import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql, upsertCheckoutPayload } from "@/app/lib/db";
import { calculateCheckoutPricing, type PricingRow } from "@/app/lib/checkoutPricing";
import { TestPromoDisabledError } from "@/app/lib/promoCodes";
import { assignPricingVariant } from "@/app/lib/pricingExperiments";
import { getActivePricingExperiments } from "@/app/lib/pricingExperiments.server";
import { getProductConfig, normalizePlatform } from "@/app/lib/productCatalog";
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
    const firstQty = Array.isArray(cart) && cart[0] ? String(cart[0].qty || cart[0].quantity || "") : "";
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
        country: Array.isArray(cart) && cart[0] ? cart[0].country : null,
        userType: userId ? "authenticated" : "anonymous",
      },
    });

    const pricingRows = (await sql`
      SELECT *
      FROM pricing
      WHERE service = ${config.service} AND active = true
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
      cart,
      pricingRows,
      assignment,
      promoCode,
      allowTestPromo: isTestPromoEnabled(),
    });
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.amountCents,
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
      },
      automatic_payment_methods: { enabled: true },
    });

    try {
      await upsertCheckoutPayload({
        paymentIntentId: paymentIntent.id,
        email,
        username,
        platform: pricing.platform,
        cart: pricing.sanitizedCart,
        amountCents: pricing.amountCents,
        currency: pricing.currency.toLowerCase(),
        experimentId: assignment.experimentId || "",
        variantId: assignment.variantId,
        pricingStrategy: effectivePricingStrategy,
        sourcePage: typeof sourcePage === "string" ? sourcePage.slice(0, 160) : "",
        plan: pricing.plan,
        country: geoCountry,
        followersBefore: followersBeforeNum,
      });
    } catch (payloadErr) {
      console.error("[create-payment-intent] checkout payload persist failed:", payloadErr);
    }

    void captureServerEvent("checkout_started", anonymousId || email || paymentIntent.id, {
      product_area: config.productArea,
      platform: pricing.platform,
      plan: pricing.plan,
      amount_cents: pricing.amountCents,
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
      amount: pricing.amountCents,
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
