import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { googleAdsConfigured } from "@/app/lib/googleAdsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns the real-money ROAS per Google Ads campaign over the requested
 * window (default 30 days). Cost comes from `ad_costs_by_campaign` (synced
 * nightly from the Google Ads API). Revenue comes from our own `orders`
 * table, attributed to a campaign by joining each successful order →
 * `checkout_payloads.gclid` → `gclid_campaign_map.campaign_id`.
 *
 * Why join via gclid (not utm_campaign): the gclid is unique per click and
 * the API gives us an authoritative click → campaign mapping. utm_campaign
 * relies on URL tagging we control imperfectly. We still surface utm as a
 * fallback for campaigns that never produced a click_view row.
 */

const PAID_STATUSES = ["paid", "processing", "delivered"];

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const sp = req.nextUrl.searchParams;
    const days = Math.max(1, Math.min(365, Number(sp.get("days")) || 30));

    const rows = await sql`
      WITH window_costs AS (
        SELECT
          campaign_id,
          MAX(campaign_name) AS campaign_name,
          SUM(cost_cents)::bigint AS cost_cents,
          SUM(clicks)::int AS clicks,
          SUM(impressions)::int AS impressions,
          SUM(conversions)::numeric(12, 2) AS google_conversions
        FROM ad_costs_by_campaign
        WHERE date >= CURRENT_DATE - (${days}::int * INTERVAL '1 day')
        GROUP BY campaign_id
      ),
      attributed_orders AS (
        SELECT
          gcm.campaign_id,
          COUNT(*)::int AS real_orders,
          SUM(o.total_cents)::bigint AS real_revenue_cents
        FROM orders o
        JOIN checkout_payloads cp ON cp.payment_intent_id = o.stripe_payment_intent_id
        JOIN gclid_campaign_map gcm ON gcm.gclid = cp.gclid
        WHERE o.status = ANY(${PAID_STATUSES})
          AND cp.gclid <> ''
          AND o.created_at >= CURRENT_DATE - (${days}::int * INTERVAL '1 day')
        GROUP BY gcm.campaign_id
      )
      SELECT
        wc.campaign_id::text AS campaign_id,
        wc.campaign_name,
        wc.cost_cents,
        wc.clicks,
        wc.impressions,
        wc.google_conversions,
        COALESCE(ao.real_orders, 0) AS real_orders,
        COALESCE(ao.real_revenue_cents, 0) AS real_revenue_cents
      FROM window_costs wc
      LEFT JOIN attributed_orders ao ON ao.campaign_id = wc.campaign_id
      ORDER BY wc.cost_cents DESC
    `;

    const campaigns = rows.map((r) => {
      const costCents = Number(r.cost_cents) || 0;
      const revenueCents = Number(r.real_revenue_cents) || 0;
      const realOrders = Number(r.real_orders) || 0;
      const clicks = Number(r.clicks) || 0;
      const realRoas = costCents > 0 ? revenueCents / costCents : null;
      const realCpaCents = realOrders > 0 ? Math.round(costCents / realOrders) : null;
      const cpcCents = clicks > 0 ? Math.round(costCents / clicks) : null;
      const cvr = clicks > 0 ? realOrders / clicks : null;
      return {
        campaignId: r.campaign_id,
        campaignName: r.campaign_name,
        costCents,
        clicks,
        impressions: Number(r.impressions) || 0,
        googleConversions: Number(r.google_conversions) || 0,
        realOrders,
        realRevenueCents: revenueCents,
        realRoas,
        realCpaCents,
        cpcCents,
        cvr,
      };
    });

    const totals = campaigns.reduce(
      (acc, c) => {
        acc.costCents += c.costCents;
        acc.revenueCents += c.realRevenueCents;
        acc.clicks += c.clicks;
        acc.impressions += c.impressions;
        acc.realOrders += c.realOrders;
        return acc;
      },
      { costCents: 0, revenueCents: 0, clicks: 0, impressions: 0, realOrders: 0 },
    );

    const blendedRoas = totals.costCents > 0 ? totals.revenueCents / totals.costCents : null;
    const blendedCpaCents = totals.realOrders > 0 ? Math.round(totals.costCents / totals.realOrders) : null;

    // How many gclids we have stored vs. how many actually matched a campaign.
    // Useful diagnostic so the user can tell whether ROAS gaps are caused by
    // (a) campaigns with no clicks, (b) clicks that never converted, or
    // (c) orders whose gclid hasn't been synced yet.
    const diag = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM checkout_payloads WHERE gclid <> '') AS checkout_with_gclid,
        (SELECT COUNT(*)::int FROM gclid_campaign_map) AS gclid_map_size,
        (SELECT MAX(synced_at) FROM ad_costs_by_campaign) AS last_synced_at
    `;
    const diagRow = diag[0] as { checkout_with_gclid: number; gclid_map_size: number; last_synced_at: string | null };

    return NextResponse.json({
      days,
      configured: googleAdsConfigured(),
      campaigns,
      totals: { ...totals, blendedRoas, blendedCpaCents },
      diagnostics: {
        checkoutWithGclid: diagRow.checkout_with_gclid,
        gclidMapSize: diagRow.gclid_map_size,
        lastSyncedAt: diagRow.last_synced_at,
      },
    });
  } catch (err) {
    console.error("[admin/ads-roas] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
