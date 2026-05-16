import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { getOrderStatus, type SmmSubOrder } from "@/app/lib/smm";
import { resolveBulkFollowsCharge, bulkFollowsCostCents } from "@/app/lib/smmCost";
import { getUsdToCurrencyRate } from "@/app/lib/fxRates";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

/**
 * POST /api/admin/orders/set-bf-id
 * Body: {
 *   orderId: number,
 *   cartIndex: number,
 *   bfOrderId: number | null,   // pass null to clear, otherwise an existing BulkFollows order ID
 *   bfServiceId?: number,        // optional override
 * }
 *
 * Manually attaches an existing BulkFollows order ID to a sub-order.
 * Useful when the auto API call failed but the order was actually placed,
 * or when you placed it manually in the BulkFollows dashboard.
 *
 * The endpoint immediately fetches the current BF status to populate
 * `charge` and align the local status. The order's cost_cents is recomputed.
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const { orderId, cartIndex, bfOrderId, bfServiceId } = body as {
      orderId?: number;
      cartIndex?: number;
      bfOrderId?: number | null;
      bfServiceId?: number;
    };

    if (typeof orderId !== "number") {
      return NextResponse.json({ error: "orderId (number) is required" }, { status: 400 });
    }
    if (typeof cartIndex !== "number") {
      return NextResponse.json({ error: "cartIndex (number) is required" }, { status: 400 });
    }
    if (bfOrderId !== null && typeof bfOrderId !== "number") {
      return NextResponse.json({ error: "bfOrderId must be a number or null" }, { status: 400 });
    }

    const rows = await sql`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`;
    const order = rows[0];
    if (!order) {
      return NextResponse.json({ error: `Order ${orderId} not found` }, { status: 404 });
    }

    const subOrders: SmmSubOrder[] = Array.isArray(order.smm_orders)
      ? order.smm_orders
      : JSON.parse(order.smm_orders || "[]");

    const idx = subOrders.findIndex((s) => s.cartIndex === cartIndex);
    if (idx === -1) {
      return NextResponse.json(
        { error: `Sub-order cartIndex=${cartIndex} not found on order ${orderId}` },
        { status: 404 },
      );
    }

    const sub = subOrders[idx];

    if (bfOrderId === null) {
      sub.bfOrderId = null;
      sub.charge = null;
      sub.status = "pending";
      sub.error = null;
      sub.placedAt = null;
    } else {
      sub.bfOrderId = bfOrderId;
      sub.error = null;
      sub.placedAt = sub.placedAt || new Date().toISOString();
      sub.status = "placed";
      if (typeof bfServiceId === "number" && bfServiceId > 0) {
        sub.bfServiceId = bfServiceId;
      }

      // Try to fetch the current BF status — non-blocking on failure.
      try {
        const st = await getOrderStatus(bfOrderId);
        const charge = resolveBulkFollowsCharge(st.charge, sub.charge);
        if (charge) sub.charge = charge;
        const bfStatus = (st.status || "").toLowerCase();
        if (bfStatus.includes("completed")) sub.status = "completed";
        else if (bfStatus.includes("partial")) sub.status = "partial";
        else if (bfStatus.includes("canceled") || bfStatus.includes("cancelled")) sub.status = "canceled";
        else if (bfStatus.includes("progress") || bfStatus.includes("processing")) sub.status = "placed";
      } catch (err) {
        // Keep the manual link even if BF status fetch fails — admin can refresh later.
        console.warn(
          `[set-bf-id] BF status fetch failed for order ${orderId}/sub ${cartIndex} (bf=${bfOrderId}):`,
          err,
        );
      }
    }

    const fxRate = await getUsdToCurrencyRate(order.currency || "EUR");
    const costCents = bulkFollowsCostCents(subOrders.map((s) => s.charge), fxRate);

    await sql`
      UPDATE orders
      SET smm_orders = ${JSON.stringify(subOrders)}::jsonb,
          cost_cents = ${costCents}
      WHERE id = ${orderId}
    `;

    return NextResponse.json({
      success: true,
      orderId,
      cartIndex,
      subOrder: sub,
      subOrders,
    });
  } catch (error) {
    console.error("[set-bf-id] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
