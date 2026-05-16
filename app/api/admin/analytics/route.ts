import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { convertCentsToEur } from "@/app/lib/fxRates";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

// All money fields in analytics are returned as EUR cents. Order rows can be
// in any client currency (TRY, USD, BRL, …), so we group by currency in SQL
// and convert each bucket to EUR before aggregating.

type CurrencyRevenueRow = { currency: string | null; revenue: number; cost?: number };

async function sumInEur(rows: CurrencyRevenueRow[], field: "revenue" | "cost" = "revenue"): Promise<number> {
  let total = 0;
  for (const row of rows) {
    const cents = Number(row[field] || 0);
    if (!cents) continue;
    total += await convertCentsToEur(cents, row.currency || "EUR");
  }
  return total;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const [
      totalOrdersRes,
      revenueByCurrencyAll,
      ordersTodayRes,
      revenueTodayByCurrency,
      byPlatformRaw,
      byCurrencyRaw,
      byStatusRes,
      last30daysRaw,
      adCostsRes,
    ] = await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM orders`,
      sql`
        SELECT currency,
               COALESCE(SUM(total_cents), 0)::int AS revenue,
               COALESCE(SUM(cost_cents), 0)::int AS cost
        FROM orders
        WHERE status IN ('paid','processing','delivered')
        GROUP BY currency
      `,
      sql`SELECT COUNT(*)::int AS count FROM orders WHERE created_at >= CURRENT_DATE`,
      sql`
        SELECT currency, COALESCE(SUM(total_cents), 0)::int AS revenue
        FROM orders
        WHERE created_at >= CURRENT_DATE AND status IN ('paid','processing','delivered')
        GROUP BY currency
      `,
      sql`
        SELECT platform, currency,
               COUNT(*)::int AS orders,
               COALESCE(SUM(total_cents), 0)::int AS revenue
        FROM orders
        GROUP BY platform, currency
      `,
      sql`
        SELECT currency,
               COUNT(*)::int AS orders,
               COALESCE(SUM(total_cents), 0)::int AS revenue
        FROM orders
        GROUP BY currency
      `,
      sql`SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status ORDER BY count DESC`,
      sql`
        SELECT d.date::text AS date, o.currency,
          COALESCE(SUM(CASE WHEN o.status IN ('paid','processing','delivered') THEN o.total_cents ELSE 0 END), 0)::int AS revenue,
          COALESCE(SUM(CASE WHEN o.status IN ('paid','processing','delivered') THEN o.cost_cents ELSE 0 END), 0)::int AS cost
        FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day') AS d(date)
        LEFT JOIN orders o ON o.created_at::date = d.date
        GROUP BY d.date, o.currency
        ORDER BY d.date ASC
      `,
      sql`SELECT COALESCE(SUM(cost_cents), 0)::int AS sum FROM ad_costs WHERE date >= CURRENT_DATE - INTERVAL '30 days'`,
    ]);

    const revenueRows = revenueByCurrencyAll as CurrencyRevenueRow[];
    const totalRevenue = await sumInEur(revenueRows, "revenue");
    const totalCost = await sumInEur(revenueRows, "cost");
    const revenueToday = await sumInEur(revenueTodayByCurrency as CurrencyRevenueRow[], "revenue");

    // Collapse the (platform, currency) buckets into one EUR figure per platform.
    const platformMap = new Map<string, { platform: string; orders: number; revenue: number }>();
    for (const row of byPlatformRaw as Array<{ platform: string; currency: string | null; orders: number; revenue: number }>) {
      const eurCents = await convertCentsToEur(Number(row.revenue) || 0, row.currency || "EUR");
      const existing = platformMap.get(row.platform);
      if (existing) {
        existing.orders += Number(row.orders) || 0;
        existing.revenue += eurCents;
      } else {
        platformMap.set(row.platform, {
          platform: row.platform,
          orders: Number(row.orders) || 0,
          revenue: eurCents,
        });
      }
    }
    const byPlatform = Array.from(platformMap.values()).sort((a, b) => b.revenue - a.revenue);

    // Keep currency label, but report revenue in EUR so the user gets a
    // comparable figure across rows.
    const byCurrency = await Promise.all(
      (byCurrencyRaw as Array<{ currency: string | null; orders: number; revenue: number }>).map(async (row) => ({
        currency: row.currency || "EUR",
        orders: Number(row.orders) || 0,
        revenue: await convertCentsToEur(Number(row.revenue) || 0, row.currency || "EUR"),
      })),
    );
    byCurrency.sort((a, b) => b.revenue - a.revenue);

    // last30days: collapse the (date, currency) buckets into per-day EUR.
    const dayMap = new Map<string, { date: string; revenue: number; cost: number }>();
    for (const row of last30daysRaw as Array<{ date: string; currency: string | null; revenue: number; cost: number }>) {
      const cur = row.currency || "EUR";
      const eurRev = await convertCentsToEur(Number(row.revenue) || 0, cur);
      const eurCost = await convertCentsToEur(Number(row.cost) || 0, cur);
      const existing = dayMap.get(row.date);
      if (existing) {
        existing.revenue += eurRev;
        existing.cost += eurCost;
      } else {
        dayMap.set(row.date, { date: row.date, revenue: eurRev, cost: eurCost });
      }
    }
    const last30days = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalOrders: totalOrdersRes[0].count,
      totalRevenue,
      totalCost,
      ordersToday: ordersTodayRes[0].count,
      revenueToday,
      byPlatform,
      byCurrency,
      byStatus: byStatusRes,
      last30days,
      adCosts: adCostsRes[0].sum,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
