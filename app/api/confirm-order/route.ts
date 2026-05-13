import { NextRequest, NextResponse } from "next/server";
import { ensureOrderForPaymentIntent } from "@/app/lib/orders";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId || typeof paymentIntentId !== "string") {
      return NextResponse.json({ error: "paymentIntentId required" }, { status: 400 });
    }

    const result = await ensureOrderForPaymentIntent(paymentIntentId, { source: "client" });

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
    });
  } catch (err) {
    console.error("[confirm-order]", err);
    return NextResponse.json({ error: "Failed to confirm order" }, { status: 500 });
  }
}
