import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/ltv-by-source
 *
 * Aggregates lifetime value per acquisition source. We group by the
 * normalized source_page captured at checkout (e.g. "/instagram",
 * "/comparer/peakerr", "/landing/black-friday") so the operator can rank
 * which entry pages convert best AND retain best.
 *
 * The metric tower per source:
 *   • customers       distinct emails first attributed to this source
 *   • orders          total orders ever placed by those customers
 *   • revenueCents    sum of total_cents across those orders
 *   • costCents       sum of cost_cents — useful to compute gross margin
 *   • avgLtvCents     revenueCents / customers
 *   • repeatRate      share of customers with > 1 order (0..1)
 *
 * Customers are attributed to a source by their *first* paid order's
 * source_page. Subsequent purchases keep the original attribution so
 * channel ROI reflects the lifetime, not just acquisition revenue.
 */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const sp = req.nextUrl.searchParams;
    const days = Math.max(7, Math.min(730, Number(sp.get("days")) || 90));

    const rows = await sql`
      WITH first_orders AS (
        SELECT DISTINCT ON (LOWER(email))
          LOWER(email) AS email,
          COALESCE(NULLIF(source_page, ''), '(direct)') AS source_page,
          created_at AS first_at
        FROM orders
        WHERE
          email <> ''
          AND status IN ('paid', 'processing', 'delivered', 'partial')
          AND created_at >= NOW() - (${days}::int * INTERVAL '1 day')
        ORDER BY LOWER(email), created_at ASC
      ),
      lifetime AS (
        SELECT
          fo.source_page,
          fo.email,
          (
            SELECT COUNT(*)::int FROM orders o
            WHERE LOWER(o.email) = fo.email
              AND o.status IN ('paid', 'processing', 'delivered', 'partial')
          ) AS order_count,
          (
            SELECT COALESCE(SUM(o.total_cents), 0)::int FROM orders o
            WHERE LOWER(o.email) = fo.email
              AND o.status IN ('paid', 'processing', 'delivered', 'partial')
          ) AS revenue_cents,
          (
            SELECT COALESCE(SUM(o.cost_cents), 0)::int FROM orders o
            WHERE LOWER(o.email) = fo.email
              AND o.status IN ('paid', 'processing', 'delivered', 'partial')
          ) AS cost_cents
        FROM first_orders fo
      )
      SELECT
        source_page,
        COUNT(*)::int AS customers,
        SUM(order_count)::int AS orders,
        COALESCE(SUM(revenue_cents), 0)::int AS revenue_cents,
        COALESCE(SUM(cost_cents), 0)::int AS cost_cents,
        SUM(CASE WHEN order_count > 1 THEN 1 ELSE 0 END)::int AS repeat_customers
      FROM lifetime
      GROUP BY source_page
      ORDER BY revenue_cents DESC
      LIMIT 100
    `;

    const sources = rows.map((r: Record<string, unknown>) => {
      const customers = Number(r.customers) || 0;
      const revenueCents = Number(r.revenue_cents) || 0;
      const repeatCustomers = Number(r.repeat_customers) || 0;
      return {
        sourcePage: String(r.source_page),
        customers,
        orders: Number(r.orders) || 0,
        revenueCents,
        costCents: Number(r.cost_cents) || 0,
        avgLtvCents: customers > 0 ? Math.round(revenueCents / customers) : 0,
        repeatRate: customers > 0 ? repeatCustomers / customers : 0,
      };
    });

    const totals = sources.reduce(
      (acc, s) => ({
        customers: acc.customers + s.customers,
        orders: acc.orders + s.orders,
        revenueCents: acc.revenueCents + s.revenueCents,
        costCents: acc.costCents + s.costCents,
      }),
      { customers: 0, orders: 0, revenueCents: 0, costCents: 0 },
    );

    return NextResponse.json({
      sources,
      totals: {
        ...totals,
        avgLtvCents: totals.customers > 0 ? Math.round(totals.revenueCents / totals.customers) : 0,
      },
      days,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[admin/ltv-by-source] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
