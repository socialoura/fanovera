import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/app/lib/db";
import { getMultipleOrderStatusCached, type SmmSubOrder } from "@/app/lib/smm";

/**
 * GET /api/order/[id]
 *
 * Returns the order details + a refreshed per-service status pulled live
 * from BulkFollows. Used by the customer-facing /track/[id] page.
 *
 * The endpoint is public (matches the orders-by-email pattern) — anyone
 * with an order ID can see basic delivery progress, but no PII is exposed.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const orderId = Number(id);
    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Parse smm_orders sub-orders
    const subOrders: SmmSubOrder[] = Array.isArray(order.smm_orders)
      ? order.smm_orders
      : (() => {
          try {
            return JSON.parse(order.smm_orders || "[]");
          } catch {
            return [];
          }
        })();

    // Fetch live status from BulkFollows for any in-flight sub-order
    const bfIds = subOrders
      .filter((s) => s.bfOrderId && (s.status === "placed" || s.status === "pending"))
      .map((s) => s.bfOrderId!) as number[];

    const liveStatuses: Record<string, { status: string; remains?: number; charge?: string }> = {};
    if (bfIds.length > 0) {
      try {
        const result = await getMultipleOrderStatusCached(bfIds);
        for (const [bfId, st] of Object.entries(result)) {
          liveStatuses[bfId] = {
            status: st.status,
            remains: st.remains ? parseInt(st.remains, 10) : undefined,
            charge: st.charge,
          };
        }
      } catch (e) {
        console.error("[order/[id]] BF status fetch failed:", e);
      }
    }

    // Build per-service status array for the UI
    const services = subOrders.map((s) => {
      const live = s.bfOrderId ? liveStatuses[String(s.bfOrderId)] : undefined;

      // Determine simplified status
      let status: "delivered" | "processing" | "partial" | "canceled" | "failed" | "pending" =
        "pending";
      const raw = (live?.status || "").toLowerCase();
      if (raw.includes("completed")) status = "delivered";
      else if (raw.includes("partial")) status = "partial";
      else if (raw.includes("progress") || raw.includes("processing")) status = "processing";
      else if (raw.includes("canceled") || raw.includes("cancelled")) status = "canceled";
      else if (s.status === "completed") status = "delivered";
      else if (s.status === "partial") status = "partial";
      else if (s.status === "placed") status = "processing";
      else if (s.status === "failed") status = "failed";
      else if (s.status === "canceled") status = "canceled";

      const remains = live?.remains;
      const delivered =
        remains !== undefined ? Math.max(0, s.qty - remains) : status === "delivered" ? s.qty : 0;
      const pct = s.qty > 0 ? Math.min(100, Math.round((delivered / s.qty) * 100)) : 0;

      return {
        service: s.service,
        platform: s.platform,
        qty: s.qty,
        status,
        delivered,
        remains: remains ?? null,
        pct,
        error: s.error,
      };
    });

    // Aggregate overall status
    let overallStatus: string = order.status || "paid";
    if (services.length > 0) {
      const allDelivered = services.every((s) => s.status === "delivered");
      const someProcessing = services.some((s) => s.status === "processing");
      const someFailed = services.some((s) => s.status === "failed" || s.status === "canceled");
      if (allDelivered) overallStatus = "delivered";
      else if (someProcessing) overallStatus = "processing";
      else if (someFailed && services.some((s) => s.status === "delivered")) overallStatus = "partial";
    }

    const cart = Array.isArray(order.cart) ? order.cart : JSON.parse(order.cart || "[]");

    return NextResponse.json({
      id: order.id,
      username: order.username,
      platform: order.platform,
      cart,
      totalCents: order.total_cents,
      currency: order.currency || "eur",
      status: overallStatus,
      followersBefore: order.followers_before || 0,
      createdAt: order.created_at,
      deliveredAt: order.delivered_at,
      services,
    });
  } catch (err) {
    console.error("[order/[id]] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
