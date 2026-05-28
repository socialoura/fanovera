import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Monthly cohort ROAS at multiple ages (D7, D30, D90).
 *
 * For each calendar month, we identify the customers acquired that month
 * (first-touch via gclid) and compare their cumulative net revenue at
 * various ages against the campaign cost of that same month.
 *
 *   Cohort May 2026:
 *     D0  ROAS = revenue in [acq, acq] / cost in [first day of month, last day]
 *     D7  ROAS = revenue in [acq, acq+7d] / same cost
 *     D30 ROAS = revenue in [acq, acq+30d] / same cost
 *     D90 ROAS = revenue in [acq, acq+90d] / same cost
 *
 * Predicts long-term payoff from early signal: a campaign whose D7 ROAS is
 * already 1× will almost certainly clear 3× by D90.
 *
 * Granularity: campaign (or "all" for blended).
 */

const PAID_STATUSES = ["paid", "processing", "delivered", "partial", "canceled"];

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const sp = req.nextUrl.searchParams;
    const months = Math.max(1, Math.min(12, Number(sp.get("months")) || 6));

    const rows = await sql`
      WITH months AS (
        SELECT
          (date_trunc('month', CURRENT_DATE) - (gs.n * INTERVAL '1 month'))::date AS month_start
        FROM generate_series(0, ${months}::int - 1) AS gs(n)
      ),
      monthly_costs AS (
        SELECT
          date_trunc('month', date)::date AS month_start,
          SUM(cost_cents)::bigint AS cost_cents
        FROM ad_costs_by_campaign
        WHERE date >= date_trunc('month', CURRENT_DATE) - (${months}::int * INTERVAL '1 month')
        GROUP BY 1
      ),
      customer_acquisitions AS (
        SELECT DISTINCT ON (LOWER(TRIM(o.email)))
          LOWER(TRIM(o.email)) AS email_key,
          o.created_at AS acquired_at,
          date_trunc('month', o.created_at)::date AS cohort_month
        FROM orders o
        JOIN checkout_payloads cp ON cp.payment_intent_id = o.stripe_payment_intent_id
        JOIN gclid_campaign_map gcm ON gcm.gclid = cp.gclid
        WHERE cp.gclid <> ''
          AND o.email <> ''
          AND o.status = ANY(${PAID_STATUSES})
        ORDER BY LOWER(TRIM(o.email)), o.created_at ASC
      ),
      cohort_revenue AS (
        SELECT
          ca.cohort_month,
          SUM(CASE WHEN o2.created_at <= ca.acquired_at + INTERVAL '0 day'
            THEN GREATEST(0, o2.total_cents - o2.refunded_amount_cents) ELSE 0 END)::bigint AS d0_cents,
          SUM(CASE WHEN o2.created_at <= ca.acquired_at + INTERVAL '7 day'
            THEN GREATEST(0, o2.total_cents - o2.refunded_amount_cents) ELSE 0 END)::bigint AS d7_cents,
          SUM(CASE WHEN o2.created_at <= ca.acquired_at + INTERVAL '30 day'
            THEN GREATEST(0, o2.total_cents - o2.refunded_amount_cents) ELSE 0 END)::bigint AS d30_cents,
          SUM(CASE WHEN o2.created_at <= ca.acquired_at + INTERVAL '90 day'
            THEN GREATEST(0, o2.total_cents - o2.refunded_amount_cents) ELSE 0 END)::bigint AS d90_cents,
          COUNT(DISTINCT ca.email_key)::int AS customers
        FROM customer_acquisitions ca
        JOIN orders o2 ON LOWER(TRIM(o2.email)) = ca.email_key
        WHERE o2.status = ANY(${PAID_STATUSES})
        GROUP BY ca.cohort_month
      )
      SELECT
        m.month_start::text AS month_start,
        COALESCE(mc.cost_cents, 0) AS cost_cents,
        COALESCE(cr.customers, 0) AS customers,
        COALESCE(cr.d0_cents, 0) AS d0_cents,
        COALESCE(cr.d7_cents, 0) AS d7_cents,
        COALESCE(cr.d30_cents, 0) AS d30_cents,
        COALESCE(cr.d90_cents, 0) AS d90_cents,
        (CURRENT_DATE - m.month_start) AS age_days
      FROM months m
      LEFT JOIN monthly_costs mc ON mc.month_start = m.month_start
      LEFT JOIN cohort_revenue cr ON cr.cohort_month = m.month_start
      ORDER BY m.month_start DESC
    `;

    const cohorts = rows.map((r) => {
      const costCents = Number(r.cost_cents) || 0;
      const ageDays = Number(r.age_days) || 0;
      const safe = (c: number) => (costCents > 0 ? c / costCents : null);
      // Mark ROAS as null when the cohort isn't old enough for that age yet
      // (avoids misleadingly low values for very young cohorts).
      const roas = (cents: number, requiredAge: number) =>
        ageDays >= requiredAge ? safe(Number(cents) || 0) : null;
      return {
        monthStart: r.month_start,
        ageDays,
        costCents,
        customers: Number(r.customers) || 0,
        d0RevCents: Number(r.d0_cents) || 0,
        d7RevCents: Number(r.d7_cents) || 0,
        d30RevCents: Number(r.d30_cents) || 0,
        d90RevCents: Number(r.d90_cents) || 0,
        d0Roas: roas(Number(r.d0_cents) || 0, 0),
        d7Roas: roas(Number(r.d7_cents) || 0, 7),
        d30Roas: roas(Number(r.d30_cents) || 0, 30),
        d90Roas: roas(Number(r.d90_cents) || 0, 90),
      };
    });

    return NextResponse.json({ cohorts });
  } catch (err) {
    console.error("[admin/ads-cohorts] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
