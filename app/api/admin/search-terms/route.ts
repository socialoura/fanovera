import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Search term performance, joined with first-touch LTV revenue.
 *
 * Cost side: ad_costs_by_search_term (synced from Google Ads search_term_view).
 *
 * Revenue side: we cannot match search_term → order directly (the API does
 * not expose gclid → search_term). So we approximate by attributing the
 * revenue of an ad group's acquired customers PROPORTIONALLY to the share
 * of the ad group's cost that the search term represents.
 *
 * Example: ad group AG cost = 100€, of which 60€ on "buy followers".
 * AG generated 30€ of LTV revenue. → 18€ attributed to "buy followers".
 *
 * It's not perfect but it's the best approximation available without
 * conversion-level keyword data. Useful enough to identify clear winners
 * and losers when costs are concentrated.
 */

const PAID_STATUSES = ["paid", "processing", "delivered", "partial_refund", "refunded"];

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const sp = req.nextUrl.searchParams;
    const days = Math.max(1, Math.min(365, Number(sp.get("days")) || 30));
    const minCostCents = Math.max(0, Number(sp.get("minCostCents")) || 0);
    const search = (sp.get("q") || "").trim().toLowerCase();

    const rows = await sql`
      WITH term_costs AS (
        SELECT
          search_term,
          ad_group_id,
          MAX(ad_group_name) AS ad_group_name,
          MAX(campaign_id)::bigint AS campaign_id,
          MAX(campaign_name) AS campaign_name,
          SUM(cost_cents)::bigint AS cost_cents,
          SUM(clicks)::int AS clicks,
          SUM(impressions)::int AS impressions,
          SUM(conversions)::numeric(12, 2) AS google_conversions,
          SUM(conversions_value)::numeric(14, 2) AS google_conversions_value
        FROM ad_costs_by_search_term
        WHERE date >= CURRENT_DATE - (${days}::int * INTERVAL '1 day')
        GROUP BY search_term, ad_group_id
      ),
      adgroup_total_cost AS (
        SELECT ad_group_id, SUM(cost_cents)::bigint AS ag_cost_cents
        FROM term_costs
        GROUP BY ad_group_id
      ),
      customer_acquisitions AS (
        SELECT DISTINCT ON (LOWER(TRIM(o.email)))
          LOWER(TRIM(o.email)) AS email_key,
          gcm.ad_group_id
        FROM orders o
        JOIN checkout_payloads cp ON cp.payment_intent_id = o.stripe_payment_intent_id
        JOIN gclid_campaign_map gcm ON gcm.gclid = cp.gclid
        WHERE cp.gclid <> '' AND o.email <> ''
          AND gcm.ad_group_id IS NOT NULL
          AND o.status = ANY(${PAID_STATUSES})
        ORDER BY LOWER(TRIM(o.email)), o.created_at ASC
      ),
      ag_revenue AS (
        SELECT
          ca.ad_group_id,
          COUNT(DISTINCT o2.id)::int AS ag_real_orders,
          SUM(GREATEST(0, o2.total_cents - o2.refunded_amount_cents))::bigint AS ag_real_revenue_cents
        FROM customer_acquisitions ca
        JOIN orders o2 ON LOWER(TRIM(o2.email)) = ca.email_key
        WHERE o2.status = ANY(${PAID_STATUSES})
          AND o2.created_at >= CURRENT_DATE - (${days}::int * INTERVAL '1 day')
        GROUP BY ca.ad_group_id
      )
      SELECT
        tc.search_term,
        tc.campaign_id::text AS campaign_id,
        tc.campaign_name,
        tc.ad_group_id::text AS ad_group_id,
        tc.ad_group_name,
        tc.cost_cents,
        tc.clicks,
        tc.impressions,
        tc.google_conversions,
        tc.google_conversions_value,
        atc.ag_cost_cents,
        COALESCE(agr.ag_real_orders, 0) AS ag_real_orders,
        COALESCE(agr.ag_real_revenue_cents, 0) AS ag_real_revenue_cents
      FROM term_costs tc
      JOIN adgroup_total_cost atc ON atc.ad_group_id = tc.ad_group_id
      LEFT JOIN ag_revenue agr ON agr.ad_group_id = tc.ad_group_id
      WHERE tc.cost_cents >= ${minCostCents}::bigint
      ORDER BY tc.cost_cents DESC
      LIMIT 500
    `;

    const terms = rows
      .map((r) => {
        const term = String(r.search_term);
        if (search && !term.toLowerCase().includes(search)) return null;

        const costCents = Number(r.cost_cents) || 0;
        const agCostCents = Number(r.ag_cost_cents) || 0;
        const agRevenueCents = Number(r.ag_real_revenue_cents) || 0;
        const agOrders = Number(r.ag_real_orders) || 0;
        const clicks = Number(r.clicks) || 0;

        // Proportional revenue attribution: term's share of ad group cost ×
        // ad group's revenue. Falls back to 0 when ad group has no cost.
        const share = agCostCents > 0 ? costCents / agCostCents : 0;
        const attributedRevenueCents = Math.round(agRevenueCents * share);
        const attributedOrders = Math.round(agOrders * share * 100) / 100; // keep 2 decimals

        const realRoas = costCents > 0 ? attributedRevenueCents / costCents : null;
        const realCpaCents = attributedOrders > 0 ? Math.round(costCents / attributedOrders) : null;
        const cpcCents = clicks > 0 ? Math.round(costCents / clicks) : null;

        return {
          searchTerm: term,
          campaignId: r.campaign_id,
          campaignName: r.campaign_name,
          adGroupId: r.ad_group_id,
          adGroupName: r.ad_group_name,
          costCents,
          clicks,
          impressions: Number(r.impressions) || 0,
          googleConversions: Number(r.google_conversions) || 0,
          googleConversionsValueCents: Math.round((Number(r.google_conversions_value) || 0) * 100),
          attributedRevenueCents,
          attributedOrders,
          realRoas,
          realCpaCents,
          cpcCents,
          shareOfAdGroupCost: share,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return NextResponse.json({ days, terms });
  } catch (err) {
    console.error("[admin/search-terms] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
