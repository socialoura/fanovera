import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const [
      totalOrdersRes,
      totalRevenueRes,
      totalCostRes,
      ordersTodayRes,
      revenueTodayRes,
      byPlatformRes,
      byCurrencyRes,
      byStatusRes,
      last30daysRes,
      adCostsRes,
    ] = await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM orders`,
      sql`SELECT COALESCE(SUM(total_cents), 0)::int AS sum FROM orders WHERE status IN ('paid','processing','delivered')`,
      sql`SELECT COALESCE(SUM(cost_cents), 0)::int AS sum FROM orders WHERE status IN ('paid','processing','delivered')`,
      sql`SELECT COUNT(*)::int AS count FROM orders WHERE created_at >= CURRENT_DATE`,
      sql`SELECT COALESCE(SUM(total_cents), 0)::int AS sum FROM orders WHERE created_at >= CURRENT_DATE AND status IN ('paid','processing','delivered')`,
      sql`SELECT platform, COUNT(*)::int AS count, COALESCE(SUM(total_cents), 0)::int AS revenue FROM orders GROUP BY platform ORDER BY revenue DESC`,
      sql`SELECT currency, COUNT(*)::int AS count, COALESCE(SUM(total_cents), 0)::int AS revenue FROM orders GROUP BY currency ORDER BY revenue DESC`,
      sql`SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status ORDER BY count DESC`,
      sql`
        SELECT d.date::text AS date,
          COALESCE(SUM(CASE WHEN o.status IN ('paid','processing','delivered') THEN o.total_cents ELSE 0 END), 0)::int AS revenue,
          COALESCE(SUM(CASE WHEN o.status IN ('paid','processing','delivered') THEN o.cost_cents ELSE 0 END), 0)::int AS cost
        FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day') AS d(date)
        LEFT JOIN orders o ON o.created_at::date = d.date
        GROUP BY d.date
        ORDER BY d.date ASC
      `,
      sql`SELECT COALESCE(SUM(cost_cents), 0)::int AS sum FROM ad_costs WHERE date >= CURRENT_DATE - INTERVAL '30 days'`,
    ]);

    return NextResponse.json({
      totalOrders: totalOrdersRes[0].count,
      totalRevenue: totalRevenueRes[0].sum,
      totalCost: totalCostRes[0].sum,
      ordersToday: ordersTodayRes[0].count,
      revenueToday: revenueTodayRes[0].sum,
      byPlatform: byPlatformRes,
      byCurrency: byCurrencyRes,
      byStatus: byStatusRes,
      last30days: last30daysRes,
      adCosts: adCostsRes[0].sum,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
