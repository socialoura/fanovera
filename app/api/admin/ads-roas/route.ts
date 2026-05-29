import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { googleAdsConfigured } from "@/app/lib/googleAdsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns the real-money ROAS over the requested window, either grouped by
 * campaign (default) or by ad group.
 *
 * COST side: `ad_costs_by_*` (synced nightly from Google Ads API).
 *
 * REVENUE side: first-touch LTV attribution.
 *   1. Identify each customer's *first* gclid-matched order ever
 *      → that pins the customer to a campaign / ad_group forever.
 *   2. Sum ALL revenue from that customer in the window, even orders made
 *      without a gclid (organic returns, email reactivation, etc.).
 *
 * Why: SMM customers re-purchase. Attributing only the first-touch revenue
 * (the order with gclid) under-counts campaigns that produce loyal repeat
 * buyers. This matches the SourcesView convention already used elsewhere
 * in the admin.
 *
 * Customer identity = LOWER(TRIM(email)). Stripe-customers without an
 * email are skipped (rare — checkout requires email).
 */

// Accept refunded statuses on the acquisition side (we still consider a
// refunded customer to have been acquired), but the SUM uses
// GREATEST(0, total - refunded) so the net revenue is what counts.
const PAID_STATUSES = ["paid", "processing", "delivered", "partial", "canceled"];

type GroupBy = "campaign" | "adgroup" | "keyword";

function parseGroupBy(raw: string | null): GroupBy {
  if (raw === "adgroup") return "adgroup";
  if (raw === "keyword") return "keyword";
  return "campaign";
}

type Row = {
  costCents: number;
  clicks: number;
  impressions: number;
  googleConversions: number;
  realOrders: number;
  realRevenueCents: number;
  realRoas: number | null;
  realCpaCents: number | null;
  cpcCents: number | null;
  cvr: number | null;
};

function metrics(costCents: number, clicks: number, realOrders: number, revenueCents: number): Pick<Row, "realRoas" | "realCpaCents" | "cpcCents" | "cvr"> {
  return {
    realRoas: costCents > 0 ? revenueCents / costCents : null,
    realCpaCents: realOrders > 0 ? Math.round(costCents / realOrders) : null,
    cpcCents: clicks > 0 ? Math.round(costCents / clicks) : null,
    cvr: clicks > 0 ? realOrders / clicks : null,
  };
}

async function queryByCampaign(days: number) {
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
    customer_acquisitions AS (
      -- Pin each customer to the FIRST campaign that produced a gclid-matched
      -- successful order (lifetime, not windowed — once acquired, always
      -- belongs to that campaign).
      SELECT DISTINCT ON (LOWER(TRIM(o.email)))
        LOWER(TRIM(o.email)) AS email_key,
        gcm.campaign_id,
        o.created_at AS acquired_at
      FROM orders o
      JOIN checkout_payloads cp ON cp.payment_intent_id = o.stripe_payment_intent_id
      JOIN gclid_campaign_map gcm ON gcm.gclid = cp.gclid
      WHERE cp.gclid <> ''
        AND o.email <> ''
        AND o.status = ANY(${PAID_STATUSES})
      ORDER BY LOWER(TRIM(o.email)), o.created_at ASC
    ),
    revenue AS (
      -- All NET revenue (gross - refunds) in window from acquired customers,
      -- INCLUDING returning orders without a gclid. Fully refunded orders
      -- still count as orders for CVR/CPA, but contribute 0 to revenue.
      SELECT
        ca.campaign_id,
        COUNT(DISTINCT o2.id)::int AS real_orders,
        SUM(GREATEST(0, o2.total_cents - o2.refunded_amount_cents))::bigint AS real_revenue_cents,
        SUM(o2.refunded_amount_cents)::bigint AS refunded_cents
      FROM customer_acquisitions ca
      JOIN orders o2 ON LOWER(TRIM(o2.email)) = ca.email_key
      WHERE o2.status = ANY(${PAID_STATUSES})
        AND o2.created_at >= CURRENT_DATE - (${days}::int * INTERVAL '1 day')
      GROUP BY ca.campaign_id
    )
    SELECT
      wc.campaign_id::text AS campaign_id,
      wc.campaign_name,
      wc.cost_cents,
      wc.clicks,
      wc.impressions,
      wc.google_conversions,
      COALESCE(rv.real_orders, 0) AS real_orders,
      COALESCE(rv.real_revenue_cents, 0) AS real_revenue_cents,
      COALESCE(rv.refunded_cents, 0) AS refunded_cents
    FROM window_costs wc
    LEFT JOIN revenue rv ON rv.campaign_id = wc.campaign_id
    ORDER BY wc.cost_cents DESC
  `;

  return rows.map((r) => {
    const costCents = Number(r.cost_cents) || 0;
    const revenueCents = Number(r.real_revenue_cents) || 0;
    const refundedCents = Number(r.refunded_cents) || 0;
    const realOrders = Number(r.real_orders) || 0;
    const clicks = Number(r.clicks) || 0;
    return {
      campaignId: r.campaign_id,
      campaignName: r.campaign_name,
      costCents,
      clicks,
      impressions: Number(r.impressions) || 0,
      googleConversions: Number(r.google_conversions) || 0,
      realOrders,
      realRevenueCents: revenueCents,
      refundedCents,
      refundRate: revenueCents + refundedCents > 0 ? refundedCents / (revenueCents + refundedCents) : null,
      ...metrics(costCents, clicks, realOrders, revenueCents),
    };
  });
}

async function queryByAdGroup(days: number) {
  const rows = await sql`
    WITH window_costs AS (
      SELECT
        ad_group_id,
        MAX(ad_group_name) AS ad_group_name,
        MAX(campaign_id)::bigint AS campaign_id,
        MAX(campaign_name) AS campaign_name,
        SUM(cost_cents)::bigint AS cost_cents,
        SUM(clicks)::int AS clicks,
        SUM(impressions)::int AS impressions,
        SUM(conversions)::numeric(12, 2) AS google_conversions
      FROM ad_costs_by_ad_group
      WHERE date >= CURRENT_DATE - (${days}::int * INTERVAL '1 day')
      GROUP BY ad_group_id
    ),
    customer_acquisitions AS (
      -- Pin each customer to the FIRST ad group that produced a gclid-matched
      -- successful order (lifetime).
      SELECT DISTINCT ON (LOWER(TRIM(o.email)))
        LOWER(TRIM(o.email)) AS email_key,
        gcm.ad_group_id,
        o.created_at AS acquired_at
      FROM orders o
      JOIN checkout_payloads cp ON cp.payment_intent_id = o.stripe_payment_intent_id
      JOIN gclid_campaign_map gcm ON gcm.gclid = cp.gclid
      WHERE cp.gclid <> ''
        AND o.email <> ''
        AND gcm.ad_group_id IS NOT NULL
        AND o.status = ANY(${PAID_STATUSES})
      ORDER BY LOWER(TRIM(o.email)), o.created_at ASC
    ),
    revenue AS (
      SELECT
        ca.ad_group_id,
        COUNT(DISTINCT o2.id)::int AS real_orders,
        SUM(GREATEST(0, o2.total_cents - o2.refunded_amount_cents))::bigint AS real_revenue_cents,
        SUM(o2.refunded_amount_cents)::bigint AS refunded_cents
      FROM customer_acquisitions ca
      JOIN orders o2 ON LOWER(TRIM(o2.email)) = ca.email_key
      WHERE o2.status = ANY(${PAID_STATUSES})
        AND o2.created_at >= CURRENT_DATE - (${days}::int * INTERVAL '1 day')
      GROUP BY ca.ad_group_id
    )
    SELECT
      wc.ad_group_id::text AS ad_group_id,
      wc.ad_group_name,
      wc.campaign_id::text AS campaign_id,
      wc.campaign_name,
      wc.cost_cents,
      wc.clicks,
      wc.impressions,
      wc.google_conversions,
      COALESCE(rv.real_orders, 0) AS real_orders,
      COALESCE(rv.real_revenue_cents, 0) AS real_revenue_cents,
      COALESCE(rv.refunded_cents, 0) AS refunded_cents
    FROM window_costs wc
    LEFT JOIN revenue rv ON rv.ad_group_id = wc.ad_group_id
    ORDER BY wc.cost_cents DESC
  `;

  return rows.map((r) => {
    const costCents = Number(r.cost_cents) || 0;
    const revenueCents = Number(r.real_revenue_cents) || 0;
    const refundedCents = Number(r.refunded_cents) || 0;
    const realOrders = Number(r.real_orders) || 0;
    const clicks = Number(r.clicks) || 0;
    return {
      adGroupId: r.ad_group_id,
      adGroupName: r.ad_group_name,
      campaignId: r.campaign_id,
      campaignName: r.campaign_name,
      costCents,
      clicks,
      impressions: Number(r.impressions) || 0,
      googleConversions: Number(r.google_conversions) || 0,
      realOrders,
      realRevenueCents: revenueCents,
      refundedCents,
      refundRate: revenueCents + refundedCents > 0 ? refundedCents / (revenueCents + refundedCents) : null,
      ...metrics(costCents, clicks, realOrders, revenueCents),
    };
  });
}

async function queryByKeyword(days: number) {
  // Keyword identity = the matched keyword TEXT (lowercased). ValueTrack
  // {keyword} only exposes the text, not the ad group, so the same keyword
  // bid in two ad groups is collapsed here on purpose — both cost and revenue
  // sides key off the text alone, keeping the join honest.
  const rows = await sql`
    WITH window_costs AS (
      SELECT
        LOWER(keyword_text) AS keyword_key,
        MAX(keyword_text) AS keyword_text,
        MAX(match_type) AS match_type,
        MAX(campaign_id)::bigint AS campaign_id,
        MAX(campaign_name) AS campaign_name,
        SUM(cost_cents)::bigint AS cost_cents,
        SUM(clicks)::int AS clicks,
        SUM(impressions)::int AS impressions,
        SUM(conversions)::numeric(12, 2) AS google_conversions
      FROM ad_costs_by_keyword
      WHERE date >= CURRENT_DATE - (${days}::int * INTERVAL '1 day')
      GROUP BY LOWER(keyword_text)
    ),
    customer_acquisitions AS (
      -- Pin each customer to the keyword text of their FIRST order that carried
      -- a captured keyword (lifetime, via checkout_payloads.keyword — NOT the
      -- gclid map, which has no keyword).
      SELECT DISTINCT ON (LOWER(TRIM(o.email)))
        LOWER(TRIM(o.email)) AS email_key,
        LOWER(TRIM(cp.keyword)) AS keyword_key
      FROM orders o
      JOIN checkout_payloads cp ON cp.payment_intent_id = o.stripe_payment_intent_id
      WHERE cp.keyword <> ''
        AND o.email <> ''
        AND o.status = ANY(${PAID_STATUSES})
      ORDER BY LOWER(TRIM(o.email)), o.created_at ASC
    ),
    revenue AS (
      SELECT
        ca.keyword_key,
        COUNT(DISTINCT o2.id)::int AS real_orders,
        SUM(GREATEST(0, o2.total_cents - o2.refunded_amount_cents))::bigint AS real_revenue_cents,
        SUM(o2.refunded_amount_cents)::bigint AS refunded_cents
      FROM customer_acquisitions ca
      JOIN orders o2 ON LOWER(TRIM(o2.email)) = ca.email_key
      WHERE o2.status = ANY(${PAID_STATUSES})
        AND o2.created_at >= CURRENT_DATE - (${days}::int * INTERVAL '1 day')
      GROUP BY ca.keyword_key
    )
    SELECT
      wc.keyword_text,
      wc.match_type,
      wc.campaign_id::text AS campaign_id,
      wc.campaign_name,
      wc.cost_cents,
      wc.clicks,
      wc.impressions,
      wc.google_conversions,
      COALESCE(rv.real_orders, 0) AS real_orders,
      COALESCE(rv.real_revenue_cents, 0) AS real_revenue_cents,
      COALESCE(rv.refunded_cents, 0) AS refunded_cents
    FROM window_costs wc
    LEFT JOIN revenue rv ON rv.keyword_key = wc.keyword_key
    ORDER BY wc.cost_cents DESC
  `;

  return rows.map((r) => {
    const costCents = Number(r.cost_cents) || 0;
    const revenueCents = Number(r.real_revenue_cents) || 0;
    const refundedCents = Number(r.refunded_cents) || 0;
    const realOrders = Number(r.real_orders) || 0;
    const clicks = Number(r.clicks) || 0;
    return {
      keyword: r.keyword_text as string,
      matchType: (r.match_type as string) || "",
      campaignId: r.campaign_id,
      campaignName: r.campaign_name,
      costCents,
      clicks,
      impressions: Number(r.impressions) || 0,
      googleConversions: Number(r.google_conversions) || 0,
      realOrders,
      realRevenueCents: revenueCents,
      refundedCents,
      refundRate: revenueCents + refundedCents > 0 ? refundedCents / (revenueCents + refundedCents) : null,
      ...metrics(costCents, clicks, realOrders, revenueCents),
    };
  });
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const sp = req.nextUrl.searchParams;
    const days = Math.max(1, Math.min(365, Number(sp.get("days")) || 30));
    const groupBy = parseGroupBy(sp.get("groupBy"));

    const rows =
      groupBy === "adgroup"
        ? await queryByAdGroup(days)
        : groupBy === "keyword"
          ? await queryByKeyword(days)
          : await queryByCampaign(days);

    const totals = rows.reduce(
      (acc, r) => {
        acc.costCents += r.costCents;
        acc.revenueCents += r.realRevenueCents;
        acc.clicks += r.clicks;
        acc.impressions += r.impressions;
        acc.realOrders += r.realOrders;
        return acc;
      },
      { costCents: 0, revenueCents: 0, clicks: 0, impressions: 0, realOrders: 0 },
    );

    const blendedRoas = totals.costCents > 0 ? totals.revenueCents / totals.costCents : null;
    const blendedCpaCents = totals.realOrders > 0 ? Math.round(totals.costCents / totals.realOrders) : null;

    const diag = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM checkout_payloads WHERE gclid <> '') AS checkout_with_gclid,
        (SELECT COUNT(*)::int FROM checkout_payloads WHERE keyword <> '') AS checkout_with_keyword,
        (SELECT COUNT(*)::int FROM gclid_campaign_map) AS gclid_map_size,
        (SELECT MAX(synced_at) FROM ad_costs_by_campaign) AS last_synced_at,
        (SELECT MAX(synced_at) FROM ad_costs_by_ad_group) AS last_synced_at_adgroup,
        (SELECT MAX(synced_at) FROM ad_costs_by_keyword) AS last_synced_at_keyword
    `;
    const diagRow = diag[0] as {
      checkout_with_gclid: number;
      checkout_with_keyword: number;
      gclid_map_size: number;
      last_synced_at: string | null;
      last_synced_at_adgroup: string | null;
      last_synced_at_keyword: string | null;
    };

    return NextResponse.json({
      days,
      groupBy,
      configured: googleAdsConfigured(),
      rows,
      // Keep `campaigns` key for backward-compat with the existing view code
      // while we migrate the front-end.
      campaigns: groupBy === "campaign" ? rows : [],
      totals: { ...totals, blendedRoas, blendedCpaCents },
      diagnostics: {
        checkoutWithGclid: diagRow.checkout_with_gclid,
        checkoutWithKeyword: diagRow.checkout_with_keyword,
        gclidMapSize: diagRow.gclid_map_size,
        lastSyncedAt: diagRow.last_synced_at,
        lastSyncedAtAdGroup: diagRow.last_synced_at_adgroup,
        lastSyncedAtKeyword: diagRow.last_synced_at_keyword,
      },
    });
  } catch (err) {
    console.error("[admin/ads-roas] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
