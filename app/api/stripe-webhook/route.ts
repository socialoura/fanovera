import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ensureOrderForPaymentIntent } from "@/app/lib/orders";

export const runtime = "nodejs"; // Stripe SDK needs Node, not Edge.
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

/**
 * Stripe webhook — server-side fallback that materializes the order in DB
 * even if the client never reached /api/confirm-order (closed tab, network drop).
 *
 * Required env: STRIPE_WEBHOOK_SECRET (Dashboard > Developers > Webhooks).
 *
 * We rely on the unique index `idx_orders_pi_unique` to make the operation
 * idempotent vs the client-driven /api/confirm-order route — whichever
 * arrives first wins, the second one returns `duplicate: true`.
 */
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    console.error("[stripe-webhook] Missing signature or STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch (err) {
    console.error("[stripe-webhook] Failed to read body:", err);
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe-webhook] Signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const result = await ensureOrderForPaymentIntent(pi.id, { source: "webhook" });
        if (!result.ok) {
          console.error("[stripe-webhook] ensureOrder failed:", pi.id, result.reason);
          // Return 200 anyway: avoid Stripe retries on transient app errors.
          // Stripe retries on 5xx; here we already logged and the cron can recover.
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.warn("[stripe-webhook] payment_intent.payment_failed", pi.id, pi.last_payment_error?.message);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.warn("[stripe-webhook] charge.refunded", charge.id, charge.payment_intent);
        // Future: mark order as refunded in DB.
        break;
      }
      default:
        // Ignore other event types — silent OK.
        break;
    }
  } catch (err) {
    console.error("[stripe-webhook] handler error:", event.type, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
