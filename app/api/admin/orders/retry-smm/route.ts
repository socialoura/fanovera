import { NextRequest, NextResponse } from "next/server";
import { retrySmmSubOrder } from "@/app/lib/smm";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
/**
 * POST /api/admin/orders/retry-smm
 * Body: { orderId: number, cartIndex: number, serviceId?: number }
 *
 * Retries a specific failed/canceled sub-order within an order. By default
 * uses the BulkFollows service ID from `smm_config`, but accepts an explicit
 * `serviceId` override so the operator can target a one-off service per
 * commande (e.g. when the global config is wrong or a better-priced service
 * is available for this specific order).
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const { orderId, cartIndex, serviceId } = body;

    if (!orderId || typeof orderId !== "number") {
      return NextResponse.json({ error: "orderId (number) is required" }, { status: 400 });
    }
    if (cartIndex === undefined || typeof cartIndex !== "number") {
      return NextResponse.json({ error: "cartIndex (number) is required" }, { status: 400 });
    }

    const opts: { serviceId?: number } = {};
    if (serviceId !== undefined && serviceId !== null && serviceId !== "") {
      const n = Number(serviceId);
      if (!Number.isFinite(n) || n <= 0) {
        return NextResponse.json({ error: "serviceId must be a positive number" }, { status: 400 });
      }
      opts.serviceId = n;
    }

    const subOrders = await retrySmmSubOrder(orderId, cartIndex, opts);

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
