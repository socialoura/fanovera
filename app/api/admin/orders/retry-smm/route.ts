import { NextRequest, NextResponse } from "next/server";
import { retrySmmSubOrder } from "@/app/lib/smm";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
/**
 * POST /api/admin/orders/retry-smm
 * Body: { orderId: number, cartIndex: number }
 *
 * Retries a specific failed/canceled sub-order within an order.
 * Re-reads the SMM config so you can fix the service ID before retrying.
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const { orderId, cartIndex } = body;

    if (!orderId || typeof orderId !== "number") {
      return NextResponse.json({ error: "orderId (number) is required" }, { status: 400 });
    }
    if (cartIndex === undefined || typeof cartIndex !== "number") {
      return NextResponse.json({ error: "cartIndex (number) is required" }, { status: 400 });
    }

    const subOrders = await retrySmmSubOrder(orderId, cartIndex);

    const retried = subOrders.find((s) => s.cartIndex === cartIndex);

    return NextResponse.json({
      success: retried?.status === "placed",
      orderId,
      cartIndex,
      retried,
      subOrders,
    });
  } catch (error) {
    console.error("[retry-smm] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
