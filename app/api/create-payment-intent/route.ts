import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql, upsertCheckoutPayload } from "@/app/lib/db";
import { calculateCheckoutPricing, type PricingRow } from "@/app/lib/checkoutPricing";
import { assignPricingVariant } from "@/app/lib/pricingExperiments";
import { getProductConfig, normalizePlatform } from "@/app/lib/productCatalog";
import { captureServerEvent } from "@/app/lib/analytics.server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currency, email, username, platform, cart, locale, sourcePage, anonymousId, userId } = body;
    const checkoutE2E =
      process.env.ALLOW_CHECKOUT_E2E === "1" && req.headers.get("x-fanovera-e2e-checkout") === "1";
    const normalizedPlatform = normalizePlatform(platform);

    if (!normalizedPlatform) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const config = getProductConfig(normalizedPlatform);
    const firstQty = Array.isArray(cart) && cart[0] ? String(cart[0].qty || cart[0].quantity || "") : "";
    const assignment = assignPricingVariant({
      anonymousId,
      userId,
      productArea: config.productArea,
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

    const pricing = calculateCheckoutPricing({
      platform: normalizedPlatform,
      currency,
      cart,
      pricingRows,
      assignment,
    });

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
        pricing_strategy: assignment.pricingStrategy,
        userId: typeof userId === "string" ? userId.slice(0, 120) : "",
        anonymousId: typeof anonymousId === "string" ? anonymousId.slice(0, 120) : "",
        e2e: checkoutE2E ? "true" : "",
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
      pricing_strategy: assignment.pricingStrategy,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: pricing.amountCents,
      currency: pricing.currency,
      experimentId: assignment.experimentId,
      variantId: assignment.variantId,
      pricingStrategy: assignment.pricingStrategy,
    });
  } catch (err) {
    console.error("[create-payment-intent]", err);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
