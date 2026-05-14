import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

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
 * The query stays in SQL because joining cohorts on `orders` twice in JS
 * would scale poorly past a few thousand customers. Postgres handles this
 * with one CTE in O(n) and returns ~52 rows even for a year of data.
 *
 * Response shape:
 *   {
 *     cohorts: [{
 *       cohort: "2025-W12",         // ISO week label
 *       cohortStart: "2025-03-17",  // monday of the week (date)
 *       customers: 124,             // distinct emails in cohort
 *       revenueCents: 24800,        // total revenue from those customers
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
      enriched AS (
        SELECT
          fo.email,
          fo.first_at,
          DATE_TRUNC('week', fo.first_at)::date AS cohort_start,
          TO_CHAR(fo.first_at, 'IYYY-"W"IW') AS cohort,
          (
            SELECT COALESCE(SUM(o2.total_cents), 0)::int
            FROM orders o2
            WHERE LOWER(o2.email) = fo.email
              AND o2.status IN ('paid', 'processing', 'delivered', 'partial')
          ) AS lifetime_revenue,
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
        cohort,
        cohort_start::text AS cohort_start,
        COUNT(*)::int AS customers,
        COALESCE(SUM(lifetime_revenue), 0)::int AS revenue_cents,
        SUM(CASE WHEN d7_orders > 0 THEN 1 ELSE 0 END)::int AS retention_d7,
        SUM(CASE WHEN d30_orders > 0 THEN 1 ELSE 0 END)::int AS retention_d30,
        SUM(CASE WHEN d90_orders > 0 THEN 1 ELSE 0 END)::int AS retention_d90,
        SUM(CASE WHEN ever_orders > 0 THEN 1 ELSE 0 END)::int AS retention_ever
      FROM enriched
      GROUP BY cohort, cohort_start
      ORDER BY cohort_start ASC
    `;

    const cohorts = rows.map((r: Record<string, unknown>) => ({
      cohort: String(r.cohort),
      cohortStart: String(r.cohort_start),
      customers: Number(r.customers) || 0,
      revenueCents: Number(r.revenue_cents) || 0,
      retentionD7: Number(r.retention_d7) || 0,
      retentionD30: Number(r.retention_d30) || 0,
      retentionD90: Number(r.retention_d90) || 0,
      retentionEver: Number(r.retention_ever) || 0,
    }));

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
