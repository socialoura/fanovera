import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { convertCentsToEur } from "@/app/lib/fxRates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/cohorts
 *
 * Customer-retention cohort analysis. Customers are bucketed by the ISO week
 * of their FIRST paid order; for each cohort we then count how many came
 * back within 7/30/90 days, plus how many ever placed a 2nd order
 * regardless of horizon (lifetime repeat rate).
 *
 * Money fields are returned as EUR cents. Order rows can be in any client
 * currency (TRY, USD, BRL, …) so we fetch revenue per (email, currency) and
 * convert each row to EUR in JS before aggregating per cohort.
 *
 * Response shape:
 *   {
 *     cohorts: [{
 *       cohort: "2025-W12",         // ISO week label
 *       cohortStart: "2025-03-17",  // monday of the week (date)
 *       customers: 124,             // distinct emails in cohort
 *       revenueCents: 24800,        // total revenue from those customers, in EUR cents
 *       retentionD7: 18,            // came back within 7 days
 *       retentionD30: 31,
 *       retentionD90: 47,
 *       retentionEver: 52           // any 2nd order, any horizon
 *     }, ...],
 *     totals: { customers, revenueCents, retentionD7, retentionD30, retentionD90, retentionEver },
 *     generatedAt: "2026-05-13T22:10:00.000Z"
 *   }
 */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const sp = req.nextUrl.searchParams;
    // Default = last 26 weeks (~6 months). Cap at 104 (2 years) so the
    // payload never blows past a few KB.
    const weeks = Math.max(4, Math.min(104, Number(sp.get("weeks")) || 26));

    const rows = await sql`
      WITH first_orders AS (
        SELECT
          LOWER(email) AS email,
          MIN(created_at) AS first_at
        FROM orders
        WHERE
          status IN ('paid', 'processing', 'delivered', 'partial')
          AND email <> ''
          AND created_at >= NOW() - (${weeks}::int * INTERVAL '7 days')
        GROUP BY LOWER(email)
      ),
      per_customer_revenue AS (
        SELECT
          fo.email,
          o.currency,
          COALESCE(SUM(o.total_cents), 0)::int AS revenue_cents
        FROM first_orders fo
        JOIN orders o ON LOWER(o.email) = fo.email
        WHERE o.status IN ('paid', 'processing', 'delivered', 'partial')
        GROUP BY fo.email, o.currency
      ),
      retention AS (
        SELECT
          fo.email,
          fo.first_at,
          DATE_TRUNC('week', fo.first_at)::date AS cohort_start,
          TO_CHAR(fo.first_at, 'IYYY-"W"IW') AS cohort,
          (
            SELECT COUNT(*)::int FROM orders o3
            WHERE LOWER(o3.email) = fo.email
              AND o3.status IN ('paid', 'processing', 'delivered', 'partial')
              AND o3.created_at > fo.first_at
              AND o3.created_at <= fo.first_at + INTERVAL '7 days'
          ) AS d7_orders,
          (
            SELECT COUNT(*)::int FROM orders o3
            WHERE LOWER(o3.email) = fo.email
              AND o3.status IN ('paid', 'processing', 'delivered', 'partial')
              AND o3.created_at > fo.first_at
              AND o3.created_at <= fo.first_at + INTERVAL '30 days'
          ) AS d30_orders,
          (
            SELECT COUNT(*)::int FROM orders o3
            WHERE LOWER(o3.email) = fo.email
              AND o3.status IN ('paid', 'processing', 'delivered', 'partial')
              AND o3.created_at > fo.first_at
              AND o3.created_at <= fo.first_at + INTERVAL '90 days'
          ) AS d90_orders,
          (
            SELECT COUNT(*)::int FROM orders o3
            WHERE LOWER(o3.email) = fo.email
              AND o3.status IN ('paid', 'processing', 'delivered', 'partial')
              AND o3.created_at > fo.first_at
          ) AS ever_orders
        FROM first_orders fo
      )
      SELECT
        r.cohort,
        r.cohort_start::text AS cohort_start,
        r.email,
        r.d7_orders,
        r.d30_orders,
        r.d90_orders,
        r.ever_orders,
        COALESCE(pc.currency, 'EUR') AS currency,
        COALESCE(pc.revenue_cents, 0)::int AS revenue_cents
      FROM retention r
      LEFT JOIN per_customer_revenue pc ON pc.email = r.email
    `;

    // Aggregate per cohort: collapse the (email, currency) fan-out to one EUR
    // revenue figure per customer, then to one row per cohort.
    type CohortAgg = {
      cohort: string;
      cohortStart: string;
      customers: Set<string>;
      revenueCents: number;
      retentionD7: number;
      retentionD30: number;
      retentionD90: number;
      retentionEver: number;
    };
    const seenRetentionEmail = new Set<string>();
    const cohortMap = new Map<string, CohortAgg>();

    for (const row of rows as Array<{
      cohort: string;
      cohort_start: string;
      email: string;
      currency: string;
      revenue_cents: number;
      d7_orders: number;
      d30_orders: number;
      d90_orders: number;
      ever_orders: number;
    }>) {
      const key = row.cohort;
      let agg = cohortMap.get(key);
      if (!agg) {
        agg = {
          cohort: row.cohort,
          cohortStart: row.cohort_start,
          customers: new Set<string>(),
          revenueCents: 0,
          retentionD7: 0,
          retentionD30: 0,
          retentionD90: 0,
          retentionEver: 0,
        };
        cohortMap.set(key, agg);
      }
      agg.revenueCents += await convertCentsToEur(Number(row.revenue_cents) || 0, row.currency);

      // Retention is per-email — only count it once even though the email
      // appears once per currency in the join.
      const dedupKey = `${row.cohort}:${row.email}`;
      if (!seenRetentionEmail.has(dedupKey)) {
        seenRetentionEmail.add(dedupKey);
        agg.customers.add(row.email);
        if (Number(row.d7_orders) > 0) agg.retentionD7 += 1;
        if (Number(row.d30_orders) > 0) agg.retentionD30 += 1;
        if (Number(row.d90_orders) > 0) agg.retentionD90 += 1;
        if (Number(row.ever_orders) > 0) agg.retentionEver += 1;
      }
    }

    const cohorts = Array.from(cohortMap.values())
      .map((c) => ({
        cohort: c.cohort,
        cohortStart: c.cohortStart,
        customers: c.customers.size,
        revenueCents: c.revenueCents,
        retentionD7: c.retentionD7,
        retentionD30: c.retentionD30,
        retentionD90: c.retentionD90,
        retentionEver: c.retentionEver,
      }))
      .sort((a, b) => a.cohortStart.localeCompare(b.cohortStart));

    const totals = cohorts.reduce(
      (acc, c) => ({
        customers: acc.customers + c.customers,
        revenueCents: acc.revenueCents + c.revenueCents,
        retentionD7: acc.retentionD7 + c.retentionD7,
        retentionD30: acc.retentionD30 + c.retentionD30,
        retentionD90: acc.retentionD90 + c.retentionD90,
        retentionEver: acc.retentionEver + c.retentionEver,
      }),
      { customers: 0, revenueCents: 0, retentionD7: 0, retentionD30: 0, retentionD90: 0, retentionEver: 0 },
    );

    return NextResponse.json({
      cohorts,
      totals,
      weeks,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[admin/cohorts] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
