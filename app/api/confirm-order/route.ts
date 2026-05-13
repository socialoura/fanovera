import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createOrder, getCheckoutPayload, getOrderByPaymentIntent, sql } from "@/app/lib/db";
import { runSmmForOrder } from "@/app/lib/smm";
import { sendOrderConfirmation } from "@/app/lib/email";
import { captureServerEvent } from "@/app/lib/analytics.server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json({ error: "paymentIntentId required" }, { status: 400 });
    }

    // Verify payment succeeded with Stripe
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not succeeded", status: pi.status },
        { status: 400 }
      );
    }

    // Idempotency: check if order already exists
    const existing = await getOrderByPaymentIntent(paymentIntentId);
    if (existing) {
      return NextResponse.json({ success: true, orderId: existing.id, duplicate: true });
    }

    const meta = pi.metadata || {};
    const checkoutE2E = process.env.ALLOW_CHECKOUT_E2E === "1" && meta.e2e === "true";
    const persisted = await getCheckoutPayload(paymentIntentId);
    const email = persisted?.email || meta.email || "";
    const username = persisted?.username || meta.username || "";
    const platform = persisted?.platform || meta.platform || "";
    let cart: unknown = persisted?.cart || [];
    try {
      if (!persisted?.cart) {
        cart = JSON.parse(meta.cart || "[]");
      }
    } catch { /* ignore */ }

    const orderId = await createOrder({
      stripePaymentIntentId: paymentIntentId,
      email,
      username,
      platform,
      cart,
      postAssignments: null,
      totalCents: pi.amount,
      status: "paid",
      currency: pi.currency || "eur",
      experimentId: persisted?.experiment_id || meta.experimentId || "",
      variantId: persisted?.variant_id || meta.variantId || "",
      pricingStrategy: persisted?.pricing_strategy || meta.pricing_strategy || "",
      sourcePage: persisted?.source_page || meta.source_page || "",
      plan: persisted?.plan || meta.plan || "",
    });

    void captureServerEvent("checkout_completed", meta.anonymousId || email || paymentIntentId, {
      orderId,
      product_area: platform,
      platform,
      amount_cents: pi.amount,
      currency: pi.currency || "eur",
      locale: meta.locale || "",
      pathname: meta.source_page || "",
      experimentId: meta.experimentId || "",
      variantId: meta.variantId || "",
      pricing_strategy: meta.pricing_strategy || "",
    });

    // Order confirmation email (non-blocking — never breaks checkout)
    if (email && !checkoutE2E) {
      sendOrderConfirmation({
        to: email,
        orderId,
        username,
        platform,
        cart: Array.isArray(cart) ? (cart as Array<{ service?: string; label?: string; qty?: number; quantity?: number; price?: number }>) : [],
        totalCents: pi.amount,
        currency: pi.currency || "eur",
      }).catch((err) => {
        console.error("[confirm-order] Email error:", err);
      });
    }

    // Discord notification
    const webhookUrl = checkoutE2E ? "" : process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [
              {
                title: "🎉 Nouvelle commande !",
                color: 0x22c55e,
                fields: [
                  { name: "Email", value: email || "—", inline: true },
                  { name: "Plateforme", value: platform || "—", inline: true },
                  { name: "Username", value: username || "—", inline: true },
                  { name: "Montant", value: `${(pi.amount / 100).toFixed(2)} ${pi.currency?.toUpperCase()}`, inline: true },
                ],
                footer: { text: `Order #${orderId} · ${paymentIntentId}` },
              },
            ],
          }),
        });
      } catch (err) {
        console.error("[confirm-order] Discord error:", err);
      }
    }

    // Auto-place SMM orders if enabled
    let smmResult = null;
    if (!checkoutE2E) {
      try {
        const toggle = await sql`SELECT value FROM smm_settings WHERE key = 'auto_order_enabled' LIMIT 1`;
        const autoEnabled = toggle[0]?.value === "true";
        if (autoEnabled) {
          smmResult = await runSmmForOrder(orderId);
        }
      } catch (smmErr) {
        console.error("[confirm-order] SMM auto-order error:", smmErr);
        // Non-blocking: order is still confirmed even if SMM fails
      }
    }

    return NextResponse.json({ success: true, orderId, smm: smmResult ? "placed" : "skipped" });
  } catch (err) {
    console.error("[confirm-order]", err);
    return NextResponse.json(
      { error: "Failed to confirm order" },
      { status: 500 }
    );
  }
}
