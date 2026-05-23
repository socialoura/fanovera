import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/orders/service-mismatches
 *
 * Lists orders that paid for tt_likes / tt_views / ig_likes / ig_views but
 * were saved as tt_followers / ig_followers because the cart's service field
 * was never set by the frontend (bug fixed in calculateCheckoutPricing +
 * IG/TT/YT/SP page clients). Used by the admin "Rattrapage" view.
 *
 * Detection heuristic:
 *   - platform in (tiktok, instagram)
 *   - cart[0].postUrl is non-empty (likes & views always need a post link;
 *     followers never do — strongest single signal)
 *   - cart[0].service is the platform default (tt_followers / ig_followers)
 *
 * Classification of intended product:
 *   - source_page contains ?product=likes / ?product=views → high confidence
 *   - qty > 100000 → views (above all likes pack tiers) → medium
 *   - qty < 1000 → likes (below all views pack tiers) → medium
 *   - otherwise → unknown (overlapping qty zone, needs manual triage) → low
 */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    // Build the smm_config lookup so we can attach the correct BF service ID
    // to each row — saves the frontend from hardcoding numeric IDs.
    const configs = await sql`
      SELECT platform, service, bulkfollows_service_id
      FROM smm_config
      WHERE enabled = true
    ` as Array<{ platform: string; service: string; bulkfollows_service_id: number }>;
    const configMap = new Map<string, number>();
    for (const c of configs) {
      configMap.set(`${c.platform}:${c.service}`, Number(c.bulkfollows_service_id));
    }

    const rows = await sql`
      SELECT
        id, created_at, email, username, platform, status,
        total_cents, cost_cents, currency,
        cart, smm_orders, source_page
      FROM orders
      WHERE platform IN ('tiktok', 'instagram')
        AND cart->0->>'postUrl' IS NOT NULL
        AND cart->0->>'postUrl' <> ''
        AND COALESCE(cart->0->>'service', '') IN ('', 'tt_followers', 'ig_followers', 'followers')
      ORDER BY created_at DESC
    `;

    const classified = rows.map((row) => {
      const cart = Array.isArray(row.cart) ? row.cart : [];
      const cartItem = (cart[0] || {}) as Record<string, unknown>;
      const smmOrders = Array.isArray(row.smm_orders) ? row.smm_orders : [];
      const firstSub = (smmOrders[0] || {}) as Record<string, unknown>;
      const qty = Number(cartItem.qty || cartItem.quantity || 0);
      const sourcePage = String(row.source_page || "").toLowerCase();

      let intended: "likes" | "views" | "unknown" = "unknown";
      let confidence: "high" | "medium" | "low" = "low";
      if (sourcePage.includes("product=likes")) {
        intended = "likes";
        confidence = "high";
      } else if (sourcePage.includes("product=views")) {
        intended = "views";
        confidence = "high";
      } else if (qty > 100000) {
        intended = "views";
        confidence = "medium";
      } else if (qty > 0 && qty < 1000) {
        intended = "likes";
        confidence = "medium";
      }

      const correctService =
        intended === "unknown"
          ? null
          : row.platform === "tiktok"
            ? intended === "likes" ? "tt_likes" : "tt_views"
            : intended === "likes" ? "ig_likes" : "ig_views";

      const correctBfServiceId = correctService
        ? configMap.get(`${row.platform}:${correctService}`) || null
        : null;

      const bfServiceIdSent = Number(firstSub.bfServiceId || 0);
      const smmStatus = String(firstSub.status || "");
      const bfOrderIdSent = firstSub.bfOrderId ? Number(firstSub.bfOrderId) : null;

      return {
        id: row.id,
        created_at: row.created_at,
        email: row.email,
        username: row.username,
        platform: row.platform,
        status: row.status,
        total_cents: row.total_cents,
        currency: row.currency,
        qty,
        bonus: Number(cartItem.bonus || 0),
        post_url: String(cartItem.postUrl || ""),
        source_page: row.source_page || "",
        saved_service: String(cartItem.service || ""),
        bf_service_id_sent: bfServiceIdSent,
        bf_order_id_sent: bfOrderIdSent,
        smm_status: smmStatus,
        intended_product: intended,
        confidence,
        correct_service: correctService,
        correct_bf_service_id: correctBfServiceId,
      };
    });

    const summary = {
      total: classified.length,
      high_confidence: classified.filter((r) => r.confidence === "high").length,
      medium_confidence: classified.filter((r) => r.confidence === "medium").length,
      low_confidence: classified.filter((r) => r.confidence === "low").length,
      likes: classified.filter((r) => r.intended_product === "likes").length,
      views: classified.filter((r) => r.intended_product === "views").length,
      unknown: classified.filter((r) => r.intended_product === "unknown").length,
      total_revenue_cents: classified.reduce((sum, r) => sum + (r.total_cents || 0), 0),
    };

    return NextResponse.json({ summary, orders: classified });
  } catch (err) {
    console.error("[service-mismatches] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
