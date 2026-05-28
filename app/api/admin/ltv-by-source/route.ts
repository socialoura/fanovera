import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { convertCentsToEur } from "@/app/lib/fxRates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/ltv-by-source
 *
 * Aggregates lifetime value per acquisition source. Customers are attributed
 * to the source_page of their *first* paid order so channel ROI reflects the
 * lifetime, not just acquisition revenue.
 *
 * All money fields are returned in EUR cents. Order rows can be in any client
 * currency (TRY, USD, BRL, …) so we fetch per-(source, email, currency)
 * buckets and convert each to EUR before aggregating in JS.
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
          COALESCE(NULLIF(source_page, ''), '(direct)') AS source_page
        FROM orders
        WHERE
          email <> ''
          AND status IN ('paid', 'processing', 'delivered', 'partial', 'canceled')
          AND created_at >= NOW() - (${days}::int * INTERVAL '1 day')
        ORDER BY LOWER(email), created_at ASC
      )
      SELECT
        fo.source_page,
        fo.email,
        o.currency,
        COUNT(o.id)::int AS order_count,
        COALESCE(SUM(o.total_cents), 0)::int AS revenue_cents,
        COALESCE(SUM(o.cost_cents), 0)::int AS cost_cents
      FROM first_orders fo
      JOIN orders o ON LOWER(o.email) = fo.email
      WHERE o.status IN ('paid', 'processing', 'delivered', 'partial', 'canceled')
      GROUP BY fo.source_page, fo.email, o.currency
    `;

    // Per (source_page, email): collapse currency dimension into EUR.
    type PerCustomer = { orders: number; revenueEur: number; costEur: number };
    const sourceMap = new Map<string, Map<string, PerCustomer>>();

    for (const row of rows as Array<{
      source_page: string;
      email: string;
      currency: string | null;
      order_count: number;
      revenue_cents: number;
      cost_cents: number;
    }>) {
      const cur = row.currency || "EUR";
      const eurRev = await convertCentsToEur(Number(row.revenue_cents) || 0, cur);
      const eurCost = await convertCentsToEur(Number(row.cost_cents) || 0, cur);

      let customers = sourceMap.get(row.source_page);
      if (!customers) {
        customers = new Map();
        sourceMap.set(row.source_page, customers);
      }
      const existing = customers.get(row.email);
      if (existing) {
        existing.orders += Number(row.order_count) || 0;
        existing.revenueEur += eurRev;
        existing.costEur += eurCost;
      } else {
        customers.set(row.email, {
          orders: Number(row.order_count) || 0,
          revenueEur: eurRev,
          costEur: eurCost,
        });
      }
    }

    const sources = Array.from(sourceMap.entries())
      .map(([sourcePage, customers]) => {
        let revenueCents = 0;
        let costCents = 0;
        let orders = 0;
        let repeatCustomers = 0;
        for (const c of customers.values()) {
          revenueCents += c.revenueEur;
          costCents += c.costEur;
          orders += c.orders;
          if (c.orders > 1) repeatCustomers += 1;
        }
        const customerCount = customers.size;
        return {
          sourcePage,
          customers: customerCount,
          orders,
          revenueCents,
          costCents,
          avgLtvCents: customerCount > 0 ? Math.round(revenueCents / customerCount) : 0,
          repeatRate: customerCount > 0 ? repeatCustomers / customerCount : 0,
        };
      })
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 100);

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
