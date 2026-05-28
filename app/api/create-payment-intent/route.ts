import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql, upsertCheckoutPayload, getUpsellById } from "@/app/lib/db";
import { resolveUpsellPriceCents } from "@/app/lib/fxRates";
import { calculateCheckoutPricing, type PricingRow } from "@/app/lib/checkoutPricing";
import { TestPromoDisabledError } from "@/app/lib/promoCodes";
import { assignPricingVariant } from "@/app/lib/pricingExperiments";
import { getActivePricingExperiments } from "@/app/lib/pricingExperiments.server";
import { getProductConfig, normalizePlatform, PLATFORM_SERVICES } from "@/app/lib/productCatalog";
import { captureServerEvent } from "@/app/lib/analytics.server";
import { rateLimit, tooManyRequests } from "@/app/lib/rateLimit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "fbclid",
  "entry_surface",
] as const;

function isTestPromoEnabled() {
  if (process.env.FANOVERA_TEST_PROMO_ENABLED === "1") return true;
  if (process.env.FANOVERA_TEST_PROMO_ENABLED === "0") return false;
  return process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview";
}

function sanitizeAttribution(value: unknown) {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const out: Record<string, string> = {};
  for (const key of ATTRIBUTION_KEYS) {
    const field = raw[key];
    if (typeof field === "string" && field.trim()) out[key] = field.trim().slice(0, 180);
  }
  return out;
}

export async function POST(req: NextRequest) {
  // Rate limit: 20 payment-intent creations / 5 min / IP. Caps Stripe API abuse.
  const rl = rateLimit(req, { key: "create-payment-intent", max: 20, windowMs: 5 * 60_000 });
  if (!rl.allowed) return tooManyRequests(rl);

  try {
    const body = await req.json();
    const { currency, email, username, platform, cart, locale, sourcePage, anonymousId, userId, followersBefore } = body;
    const attribution = sanitizeAttribution(body.attribution);
    const followersBeforeNum =
      typeof followersBefore === "number" && Number.isFinite(followersBefore) && followersBefore >= 0
        ? Math.min(Math.trunc(followersBefore), 2_000_000_000)
        : 0;
    const checkoutE2E =
      process.env.ALLOW_CHECKOUT_E2E === "1" && req.headers.get("x-fanovera-e2e-checkout") === "1";
    const normalizedPlatform = normalizePlatform(platform);

    if (!normalizedPlatform) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const config = getProductConfig(normalizedPlatform);

    // Split off upsell items: they're priced from the upsells admin table,
    // not from pricing rows, so we exclude them from calculateCheckoutPricing
    // (which would throw on unknown service/qty combos) and re-attach their
    // server-validated price after.
    const rawCart = Array.isArray(cart) ? cart : [];
    const baseCart: unknown[] = [];
    const upsellRequests: Array<{ upsellId: number }> = [];
    for (const item of rawCart) {
      if (item && typeof item === "object" && (item as Record<string, unknown>).upsell === true) {
        const id = Number((item as Record<string, unknown>).upsellId);
        if (Number.isFinite(id) && id > 0) upsellRequests.push({ upsellId: id });
      } else {
        baseCart.push(item);
      }
    }
    // Upsell prices are stored in EUR cents (with optional per-currency
    // overrides in price_cents_<ccy> columns). resolveUpsellPriceCents picks
    // the override when set, otherwise auto-converts EUR. The DB row is the
    // source of truth — we ignore any priceCents echo the client may have sent.
    const requestCurrency = typeof currency === "string" ? currency.toUpperCase() : "EUR";
    let upsellAddCents = 0;
    const validatedUpsells: Array<{ id: number; service: string; qty: number; price_cents: number; price_cents_eur: number; label: string }> = [];
    for (const req of upsellRequests) {
      const row = await getUpsellById(req.upsellId);
      if (!row || !row.active) continue;
      const resolved = await resolveUpsellPriceCents(row, requestCurrency);
      upsellAddCents += resolved.cents;
      validatedUpsells.push({
        id: row.id,
        service: row.service,
        qty: row.qty,
        price_cents: resolved.cents,
        price_cents_eur: resolved.centsEur,
        label: row.label || "",
      });
    }

    const firstQty = Array.isArray(baseCart) && baseCart[0] ? String((baseCart[0] as Record<string, unknown>).qty || (baseCart[0] as Record<string, unknown>).quantity || "") : "";
    const experiments = await getActivePricingExperiments();
    const assignment = assignPricingVariant({
      anonymousId,
      userId,
      productArea: config.productArea,
      experiments,
      segment: {
        locale,
        page: sourcePage,
        plan: firstQty,
        country: Array.isArray(baseCart) && baseCart[0] ? (baseCart[0] as Record<string, unknown>).country as string | null : null,
        userType: userId ? "authenticated" : "anonymous",
      },
    });

    // Load pricing rows for ALL services on this platform (followers, likes,
    // views, …) so the cart-driven service override (see calculateCheckoutPricing)
    // can resolve the right price tier — not just the platform default.
    const platformServices = [...(PLATFORM_SERVICES[normalizedPlatform] || [config.service])];
    if (!platformServices.includes(config.service)) platformServices.push(config.service);
    const pricingRows = (await sql`
      SELECT *
      FROM pricing
      WHERE service = ANY(${platformServices}) AND active = true
      ORDER BY qty ASC
    `) as PricingRow[];

    // Use whatever the client sends (including "" for no promo). Falling back
    // to DEFAULT_PROMO_CODE here silently applies -5% on prefetched payment
    // intents (where the prefetch call doesn't include promoCode), which
    // makes Apple Pay charge less than what Step3Checkout displays.
    const promoCode = typeof body.promoCode === "string" ? body.promoCode : "";
    const pricing = calculateCheckoutPricing({
      platform: normalizedPlatform,
      currency,
      cart: baseCart,
      pricingRows,
      assignment,
      promoCode,
      allowTestPromo: isTestPromoEnabled(),
    });
    const finalAmountCents = pricing.amountCents + upsellAddCents;
    const effectivePricingStrategy = pricing.promo.isTestPromo
      ? "test_promo_fixed_total"
      : assignment.pricingStrategy;

    // Capture the visitor's country server-side. Vercel sets x-vercel-ip-country;
    // Cloudflare uses cf-ipcountry. We persist it on checkout_payloads so the
    // webhook + confirm-order paths can later attach it to the order row.
    const geoCountry =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      "";

    const upsellsForMeta = validatedUpsells.map((u) => ({
      id: u.id,
      service: u.service,
      qty: u.qty,
      price_cents: u.price_cents,
      price_cents_eur: u.price_cents_eur,
      label: u.label,
    }));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmountCents,
      currency: pricing.currency.toLowerCase(),
      metadata: {
        email: email || "",
        username: username || "",
        platform: pricing.platform,
        service: pricing.service,
        plan: pricing.plan,
        locale: typeof locale === "string" ? locale.slice(0, 8) : "",
        source_page: typeof sourcePage === "string" ? sourcePage.slice(0, 120) : "",
        experimentId: assignment.experimentId || "",
        variantId: assignment.variantId,
        pricing_strategy: effectivePricingStrategy,
        promo_code: pricing.promo.code,
        promo_type: pricing.promo.type,
        test_promo: pricing.promo.isTestPromo ? "true" : "",
        userId: typeof userId === "string" ? userId.slice(0, 120) : "",
        anonymousId: typeof anonymousId === "string" ? anonymousId.slice(0, 120) : "",
        e2e: checkoutE2E ? "true" : "",
        country: geoCountry.slice(0, 4),
        followersBefore: String(followersBeforeNum),
        cart: JSON.stringify(pricing.sanitizedCart).slice(0, 490),
        upsells: upsellsForMeta.length ? JSON.stringify(upsellsForMeta).slice(0, 480) : "",
        upsell_total_cents: upsellAddCents ? String(upsellAddCents) : "",
      },
      automatic_payment_methods: { enabled: true },
    });

    try {
      await upsertCheckoutPayload({
        paymentIntentId: paymentIntent.id,
        email,
        username,
        platform: pricing.platform,
        cart: [...pricing.sanitizedCart, ...upsellsForMeta.map((u) => ({
          service: u.service,
          platform: pricing.platform,
          qty: u.qty,
          bonus: 0,
          upsell: true as const,
          upsellId: u.id,
          priceCents: u.price_cents,
          label: u.label,
        }))],
        amountCents: finalAmountCents,
        currency: pricing.currency.toLowerCase(),
        experimentId: assignment.experimentId || "",
        variantId: assignment.variantId,
        pricingStrategy: effectivePricingStrategy,
        sourcePage: typeof sourcePage === "string" ? sourcePage.slice(0, 160) : "",
        plan: pricing.plan,
        country: geoCountry,
        followersBefore: followersBeforeNum,
        gclid: attribution.gclid,
        utmSource: attribution.utm_source,
        utmCampaign: attribution.utm_campaign,
        utmMedium: attribution.utm_medium,
      });
    } catch (payloadErr) {
      console.error("[create-payment-intent] checkout payload persist failed:", payloadErr);
    }

    void captureServerEvent("checkout_started", anonymousId || email || paymentIntent.id, {
      product_area: config.productArea,
      platform: pricing.platform,
      plan: pricing.plan,
      amount_cents: finalAmountCents,
      currency: pricing.currency,
      locale,
      pathname: sourcePage,
      experimentId: assignment.experimentId,
      variantId: assignment.variantId,
      pricing_strategy: effectivePricingStrategy,
      promo_code: pricing.promo.code,
      promo_type: pricing.promo.type,
      test_promo: pricing.promo.isTestPromo,
      ...attribution,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: finalAmountCents,
      currency: pricing.currency,
      experimentId: assignment.experimentId,
      variantId: assignment.variantId,
      pricingStrategy: effectivePricingStrategy,
      promoCode: pricing.promo.code,
      promoType: pricing.promo.type,
    });
  } catch (err) {
    if (err instanceof TestPromoDisabledError) {
      return NextResponse.json(
        { error: "Test promo code is disabled" },
        { status: 400 },
      );
    }
    console.error("[create-payment-intent]", err);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
