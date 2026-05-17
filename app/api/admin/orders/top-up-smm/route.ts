import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { placeOrder, getOrderStatus, type SmmSubOrder } from "@/app/lib/smm";
import { bulkFollowsCostCents, estimateBulkFollowsCharge, resolveBulkFollowsCharge } from "@/app/lib/smmCost";
import { getUsdToCurrencyRate } from "@/app/lib/fxRates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/orders/top-up-smm
 *
 * Manually fires a fresh BulkFollows sub-order on top of an existing order
 * to fill the gap left by a partial / canceled delivery. Operator picks the
 * quantity (we suggest the remainder when the original sub still tracks it)
 * and we re-use the original service ID. The new sub-order is appended to
 * the order's smm_orders array as a separate entry — it does NOT overwrite
 * the original, so cost and audit trail stay intact.
 *
 * Body: { orderId: number, cartIndex: number, quantity: number, serviceId?: number, link?: string }
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const orderId = Number(body?.orderId);
    const sourceCartIndex = Number(body?.cartIndex);
    const quantity = Number(body?.quantity);
    const explicitServiceId = body?.serviceId !== undefined ? Number(body.serviceId) : undefined;
    const explicitLink = typeof body?.link === "string" ? body.link.trim() : "";

    if (!Number.isFinite(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "quantity must be a positive number" }, { status: 400 });
    }

    const rows = await sql`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`;
    const order = rows[0];
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const subOrders: SmmSubOrder[] = Array.isArray(order.smm_orders)
      ? order.smm_orders
      : JSON.parse(order.smm_orders || "[]");

    const original = subOrders.find((s) => s.cartIndex === sourceCartIndex);
    if (!original) {
      return NextResponse.json({ error: `Source sub-order cartIndex=${sourceCartIndex} not found` }, { status: 404 });
    }

    const serviceId =
      Number.isFinite(explicitServiceId) && (explicitServiceId as number) > 0
        ? (explicitServiceId as number)
        : Number(original.bfServiceId);
    if (!serviceId || serviceId <= 0) {
      return NextResponse.json({ error: "No BulkFollows service ID available" }, { status: 400 });
    }

    // Re-use the link from the source. Admin can override (e.g. if the
    // customer corrected a typo on Step 2 since).
    const cart: Array<{ postUrl?: string; videoUrl?: string; trackUrl?: string; pageUrl?: string }> = Array.isArray(order.cart)
      ? order.cart
      : JSON.parse(order.cart || "[]");
    const sourceCartItem = cart[sourceCartIndex] || {};
    const link =
      explicitLink ||
      sourceCartItem.postUrl ||
      sourceCartItem.videoUrl ||
      sourceCartItem.trackUrl ||
      sourceCartItem.pageUrl ||
      buildFallbackLink(String(original.platform || order.platform || ""), String(order.username || ""));
    if (!link) {
      return NextResponse.json({ error: "Could not resolve a target link for the top-up" }, { status: 400 });
    }

    let placed: { orderId: number } | null = null;
    try {
      placed = await placeOrder({ serviceId, link, quantity });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "BulkFollows placeOrder failed" },
        { status: 502 },
      );
    }

    let charge: number | null = null;
    try {
      const st = await getOrderStatus(placed.orderId);
      // Estimate using the original sub-order's rate_per_1k proxy: original
      // charge / original qty. Falls back to 0 if not yet known.
      const origRate = original.charge && original.qty ? (original.charge / original.qty) * 1000 : 0;
      charge = resolveBulkFollowsCharge(st.charge, estimateBulkFollowsCharge(origRate, quantity));
    } catch {
      /* non-critical */
    }

    // Append the top-up sub-order with a synthetic cartIndex so the retry /
    // refresh logic treats it as a distinct entry. We use 1000+offset to keep
    // it well clear of real cart indices.
    const newCartIndex = 1000 + subOrders.filter((s) => s.cartIndex >= 1000).length + sourceCartIndex;
    const newSub: SmmSubOrder = {
      cartIndex: newCartIndex,
      service: String(original.service || ""),
      platform: String(original.platform || order.platform || ""),
      qty: quantity,
      bfServiceId: serviceId,
      bfOrderId: placed.orderId,
      status: "placed",
      charge,
      error: null,
      placedAt: new Date().toISOString(),
    };
    subOrders.push(newSub);

    const fxRate = await getUsdToCurrencyRate(order.currency || "EUR");
    const costCents = bulkFollowsCostCents(subOrders.map((s) => s.charge), fxRate);

    // Bring the order back to processing so the auto-refresh polls it again.
    await sql`
      UPDATE orders
      SET smm_orders = ${JSON.stringify(subOrders)}::jsonb,
          cost_cents = ${costCents},
          status = 'processing',
          delivered_at = NULL
      WHERE id = ${orderId}
    `;

    return NextResponse.json({ success: true, newSub, totalSubs: subOrders.length });
  } catch (err) {
    console.error("[top-up-smm] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

function buildFallbackLink(platform: string, username: string): string {
  const clean = (username || "").replace(/^@/, "").trim();
  if (!clean) return "";
  switch (platform.toLowerCase()) {
    case "instagram":
      return `https://www.instagram.com/${clean}`;
    case "tiktok":
      return `https://www.tiktok.com/@${clean}`;
    case "youtube":
      return `https://www.youtube.com/@${clean}`;
    case "twitter":
    case "x":
      return `https://x.com/${clean}`;
    case "facebook":
      return `https://www.facebook.com/${clean}`;
    case "twitch":
      return `https://www.twitch.tv/${clean}`;
    case "linkedin":
      return `https://www.linkedin.com/in/${clean}`;
    default:
      return clean;
  }
}
