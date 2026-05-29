import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql, applyRefundToOrder } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

/**
 * POST /api/admin/orders/refund
 * Body: { orderId: number, amountCents?: number }
 *
 * Issues a Stripe refund on the order's payment intent — full when amountCents
 * is omitted, partial otherwise (capped to the remaining refundable amount).
 * amountCents is in the ORDER's currency minor units (same as total_cents).
 * On success we update the order immediately via applyRefundToOrder so the
 * admin sees the new state without waiting for the charge.refunded webhook.
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const orderId = Number(body?.orderId);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, stripe_payment_intent_id, total_cents, refunded_amount_cents, currency
      FROM orders WHERE id = ${orderId} LIMIT 1
    `;
    const order = rows[0];
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const pi = String(order.stripe_payment_intent_id || "");
    if (!pi) {
      return NextResponse.json({ error: "Order has no Stripe payment intent" }, { status: 400 });
    }

    const total = Number(order.total_cents) || 0;
    const alreadyRefunded = Number(order.refunded_amount_cents) || 0;
    const remaining = Math.max(0, total - alreadyRefunded);
    if (remaining <= 0) {
      return NextResponse.json({ error: "Order is already fully refunded" }, { status: 400 });
    }

    // Default to a full refund of what's left; clamp a partial amount to it.
    const requested = body?.amountCents !== undefined ? Math.round(Number(body.amountCents)) : remaining;
    if (!Number.isFinite(requested) || requested <= 0) {
      return NextResponse.json({ error: "amountCents must be a positive number" }, { status: 400 });
    }
    const amount = Math.min(requested, remaining);

    let refund: Stripe.Refund;
    try {
      refund = await stripe.refunds.create({
        payment_intent: pi,
        amount,
        reason: "requested_by_customer",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Stripe refund failed";
      console.error("[refund] Stripe error:", msg);
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    // applyRefundToOrder SETS the cumulative refunded amount (not increments),
    // so pass the new running total and let it flip the status.
    const newTotalRefunded = alreadyRefunded + (refund.amount || amount);
    await applyRefundToOrder(pi, newTotalRefunded);

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      refundedNow: refund.amount || amount,
      totalRefunded: newTotalRefunded,
      fullyRefunded: newTotalRefunded >= total,
    });
  } catch (err) {
    console.error("[refund] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
