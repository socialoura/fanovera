import { NextRequest, NextResponse } from "next/server";
import { runSmmForOrder } from "@/app/lib/smm";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
/**
 * POST /api/admin/orders/run-smm
 * Body: { orderId: number }
 *
 * Manually triggers SMM order placement for a given order.
 * Skips any sub-orders that are already placed/completed.
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId || typeof orderId !== "number") {
      return NextResponse.json({ error: "orderId (number) is required" }, { status: 400 });
    }

    const subOrders = await runSmmForOrder(orderId);

    const placed = subOrders.filter((s) => s.status === "placed").length;
    const failed = subOrders.filter((s) => s.status === "failed").length;
    const skipped = subOrders.filter((s) => s.status === "completed").length;

    return NextResponse.json({
      success: true,
      orderId,
      summary: { total: subOrders.length, placed, failed, skipped },
      subOrders,
    });
  } catch (error) {
    console.error("[run-smm] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
