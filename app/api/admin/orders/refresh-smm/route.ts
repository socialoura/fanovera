import { NextRequest, NextResponse } from "next/server";
import { refreshSmmStatus } from "@/app/lib/smm";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

/**
 * POST /api/admin/orders/refresh-smm
 * Body: { orderId: number }
 *
 * Refreshes BulkFollows status for all placed sub-orders of an order.
 * Updates charge, cost_cents, and marks delivered if all completed.
 */
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId || typeof orderId !== "number") {
      return NextResponse.json({ error: "orderId (number) is required" }, { status: 400 });
    }

    const subOrders = await refreshSmmStatus(orderId);

    const completed = subOrders.filter((s) => s.status === "completed").length;
    const inProgress = subOrders.filter((s) => s.status === "placed").length;
    const failed = subOrders.filter((s) => s.status === "failed" || s.status === "canceled").length;

    return NextResponse.json({
      success: true,
      orderId,
      summary: { total: subOrders.length, completed, inProgress, failed },
      subOrders,
    });
  } catch (error) {
    console.error("[refresh-smm] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
