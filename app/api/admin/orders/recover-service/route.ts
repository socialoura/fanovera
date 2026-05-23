import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { placeOrder, getOrderStatus, type SmmSubOrder } from "@/app/lib/smm";
import { bulkFollowsCostCents, estimateBulkFollowsCharge, resolveBulkFollowsCharge } from "@/app/lib/smmCost";
import { getUsdToCurrencyRate } from "@/app/lib/fxRates";
import { PLATFORM_SERVICES } from "@/app/lib/productCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/orders/recover-service
 *
 * Recovery action for orders that paid for likes/views but were SMM-routed to
 * followers because of the cart.service bug. Places a fresh BulkFollows order
 * on the CORRECT service (qty + bonus from the original cart) and appends it
 * to smm_orders. Also rewrites cart[0].service to the correct name so the
 * order record reflects reality going forward.
 *
 * The original followers sub-order is preserved as an audit trail (it tracks
 * what was already delivered to the customer — pure bonus from their view).
 *
 * Body: { orderId: number, correctService: string }
 *   correctService must be in PLATFORM_SERVICES[order.platform].
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const orderId = Number(body?.orderId);
    const correctService = typeof body?.correctService === "string" ? body.correctService : "";

    if (!Number.isFinite(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }
    if (!correctService) {
      return NextResponse.json({ error: "correctService is required" }, { status: 400 });
    }

    const rows = await sql`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`;
    const order = rows[0];
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const platform = String(order.platform || "");
    const allowed = PLATFORM_SERVICES[platform as keyof typeof PLATFORM_SERVICES] || [];
    if (!allowed.includes(correctService)) {
      return NextResponse.json(
        { error: `Service ${correctService} not allowed for platform ${platform}` },
        { status: 400 },
      );
    }

    const cart: Array<Record<string, unknown>> = Array.isArray(order.cart)
      ? order.cart
      : JSON.parse(order.cart || "[]");
    const cartItem = (cart[0] || {}) as Record<string, unknown>;
    const qty = Number(cartItem.qty || cartItem.quantity || 0);
    const bonus = Number(cartItem.bonus || 0);
    const totalQty = qty + bonus;
    if (totalQty <= 0) {
      return NextResponse.json({ error: "Cart qty is zero" }, { status: 400 });
    }
    const link = String(cartItem.postUrl || cartItem.videoUrl || cartItem.trackUrl || cartItem.pageUrl || "");
    if (!link) {
      return NextResponse.json({ error: "Cart has no target link" }, { status: 400 });
    }

    // Look up the correct BulkFollows service ID from smm_config.
    const configRows = await sql`
      SELECT bulkfollows_service_id FROM smm_config
      WHERE platform = ${platform} AND service = ${correctService} AND enabled = true
      LIMIT 1
    ` as Array<{ bulkfollows_service_id: number }>;
    const bfServiceId = Number(configRows[0]?.bulkfollows_service_id || 0);
    if (!bfServiceId || bfServiceId <= 0) {
      return NextResponse.json(
        { error: `No BulkFollows service ID configured for ${platform}:${correctService}` },
        { status: 400 },
      );
    }

    const subOrders: SmmSubOrder[] = Array.isArray(order.smm_orders)
      ? order.smm_orders
      : JSON.parse(order.smm_orders || "[]");

    // Idempotency guard: refuse to re-place if a recovery sub-order on the
    // same correctService is already there. Operator can detach via the
    // existing "x" button on the BF row if they really need to retry.
    const alreadyRecovered = subOrders.some(
      (s) => s.service === correctService && s.bfOrderId,
    );
    if (alreadyRecovered) {
      return NextResponse.json(
        { error: `A ${correctService} sub-order is already attached to this order` },
        { status: 409 },
      );
    }

    let placed: { orderId: number };
    try {
      placed = await placeOrder({ serviceId: bfServiceId, link, quantity: totalQty });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "BulkFollows placeOrder failed" },
        { status: 502 },
      );
    }

    let charge: number | null = null;
    try {
      const st = await getOrderStatus(placed.orderId);
      // We have no per-1k rate for the new service handy. Pass 0 so the
      // estimator returns null; the next refresh-smm cycle will fill in the
      // real charge from BulkFollows.
      charge = resolveBulkFollowsCharge(st.charge, estimateBulkFollowsCharge(0, totalQty));
    } catch {
      /* non-critical; refresh-smm will catch up */
    }

    // Cart index 2000+ marks recovery sub-orders so they don't collide with
    // the original cart entries (0..N) or top-up entries (1000+).
    const newCartIndex = 2000 + subOrders.filter((s) => s.cartIndex >= 2000).length;
    const newSub: SmmSubOrder = {
      cartIndex: newCartIndex,
      service: correctService,
      platform,
      qty: totalQty,
      bfServiceId,
      bfOrderId: placed.orderId,
      status: "placed",
      charge,
      error: null,
      placedAt: new Date().toISOString(),
    };
    subOrders.push(newSub);

    // Rewrite the cart's service so future order reads, analytics, and the
    // admin OrdersView all show the correct intent. The original followers
    // sub-order in smm_orders stays untouched as audit trail.
    cartItem.service = correctService;
    cart[0] = cartItem;

    const fxRate = await getUsdToCurrencyRate(order.currency || "EUR");
    const costCents = bulkFollowsCostCents(subOrders.map((s) => s.charge), fxRate);

    await sql`
      UPDATE orders
      SET cart = ${JSON.stringify(cart)}::jsonb,
          smm_orders = ${JSON.stringify(subOrders)}::jsonb,
          cost_cents = ${costCents},
          status = 'processing',
          delivered_at = NULL
      WHERE id = ${orderId}
    `;

    return NextResponse.json({
      success: true,
      orderId,
      placedBfOrderId: placed.orderId,
      bfServiceId,
      service: correctService,
      qty: totalQty,
    });
  } catch (err) {
    console.error("[recover-service] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
