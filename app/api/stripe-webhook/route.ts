import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ensureOrderForPaymentIntent } from "@/app/lib/orders";
import { notifyDispute } from "@/app/lib/disputeAlert";
import { applyRefundToOrder } from "@/app/lib/db";

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
        const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (piId) {
          const refunded = await applyRefundToOrder(piId, charge.amount_refunded);
          console.warn("[stripe-webhook] charge.refunded", charge.id, piId, {
            amount_refunded: charge.amount_refunded,
            matched: refunded.matched,
          });
        } else {
          console.warn("[stripe-webhook] charge.refunded without payment_intent", charge.id);
        }
        break;
      }

      // ── Disputes (chargebacks) ──
      // Without this branch we'd discover chargebacks 30+ days after the fact
      // when reading the Stripe dashboard. The handler fans out to Discord +
      // admin email; failures of either channel never propagate so Stripe
      // doesn't see a 5xx and start retry-storming the webhook.
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        console.warn("[stripe-webhook] charge.dispute.created", dispute.id, dispute.reason);
        await notifyDispute(dispute, "created");
        break;
      }
      case "charge.dispute.updated": {
        const dispute = event.data.object as Stripe.Dispute;
        await notifyDispute(dispute, "updated");
        break;
      }
      case "charge.dispute.closed": {
        const dispute = event.data.object as Stripe.Dispute;
        await notifyDispute(dispute, "closed");
        break;
      }
      case "charge.dispute.funds_withdrawn": {
        const dispute = event.data.object as Stripe.Dispute;
        await notifyDispute(dispute, "funds_withdrawn");
        break;
      }
      case "charge.dispute.funds_reinstated": {
        const dispute = event.data.object as Stripe.Dispute;
        await notifyDispute(dispute, "funds_reinstated");
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
