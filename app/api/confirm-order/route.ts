import { NextRequest, NextResponse } from "next/server";
import { ensureOrderForPaymentIntent } from "@/app/lib/orders";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentIntentId, email, username, followersBefore } = body;

    if (!paymentIntentId || typeof paymentIntentId !== "string") {
      return NextResponse.json({ error: "paymentIntentId required" }, { status: 400 });
    }

    // The client forwards email/username/followersBefore here because the
    // PaymentIntent metadata was frozen at PI-creation time (intentionally —
    // see usePaymentIntent in StripePayment.tsx). These take precedence over
    // stale metadata so the SMM order targets the right handle / receipt
    // hits the right inbox even if the user edited those fields after the PI
    // was created.
    const overrides: { email?: string; username?: string; followersBefore?: number } = {};
    if (typeof email === "string" && email.trim()) overrides.email = email.trim().slice(0, 254);
    if (typeof username === "string" && username.trim()) overrides.username = username.trim().slice(0, 120);
    if (typeof followersBefore === "number" && Number.isFinite(followersBefore) && followersBefore > 0) {
      overrides.followersBefore = Math.min(Math.trunc(followersBefore), 2_000_000_000);
    }

    const result = await ensureOrderForPaymentIntent(paymentIntentId, { source: "client", overrides });

    if (!result.ok) {
      if (result.reason === "payment_not_succeeded") {
        return NextResponse.json(
          { error: "Payment not succeeded", status: result.status },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: "Failed to confirm order" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      duplicate: result.duplicate || false,
      smm: result.smmPlaced ? "placed" : "skipped",
      platform: result.platform,
      service: result.service,
      plan: result.plan,
      totalCents: result.totalCents,
      currency: result.currency,
    });
  } catch (err) {
    console.error("[confirm-order]", err);
    return NextResponse.json({ error: "Failed to confirm order" }, { status: 500 });
  }
}
