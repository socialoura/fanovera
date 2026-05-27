import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { convertCentsToEur } from "@/app/lib/fxRates";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

// All money fields are returned as EUR cents. Order rows can be in any
// client currency (TRY, USD, BRL, …), so we group by currency in SQL and
// convert each bucket to EUR before aggregating.

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
    // The dashboard summarises an inclusive [fromDate, toDate] window of
    // Europe/Paris calendar days. Two ways to specify it:
    //   - preset:  ?range=7|30|90       → trailing N days ending today (Paris)
    //   - custom:  ?from=Y-M-D&to=Y-M-D → arbitrary window (capped to 365 days)
    // The custom form wins when both params are valid and from <= to.
    const searchParams = new URL(req.url).searchParams;
    const rangeParam = Number(searchParams.get("range") || "30");
    const presetRange = [7, 30, 90].includes(rangeParam) ? rangeParam : 30;
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Today in Europe/Paris as YYYY-MM-DD — used as the preset upper bound
    // and as the default end of the custom range if only `from` is provided.
    const todayParis = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Paris",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());
    const shiftDays = (isoDate: string, delta: number) => {
      const d = new Date(`${isoDate}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + delta);
      return d.toISOString().slice(0, 10);
    };
    const daysBetween = (a: string, b: string) =>
      Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

    let fromDate: string;
    let toDate: string;
    let rangeDays: number;
    const customValid =
      fromParam && toParam && DATE_RE.test(fromParam) && DATE_RE.test(toParam) && fromParam <= toParam;
    if (customValid) {
      fromDate = fromParam!;
      toDate = toParam!;
      rangeDays = Math.min(365, daysBetween(fromDate, toDate) + 1);
      // Re-clamp fromDate if the user asked for more than 365 days.
      fromDate = shiftDays(toDate, -(rangeDays - 1));
    } else {
      toDate = todayParis;
      fromDate = shiftDays(todayParis, -(presetRange - 1));
      rangeDays = presetRange;
    }
    const prevToDate = shiftDays(fromDate, -1);
    const prevFromDate = shiftDays(prevToDate, -(rangeDays - 1));

    // Optional platform filter. Whitelisted against the 8 canonical platform
    // ids — anything else (including 'all', '', null) means "no filter". Used
    // in every per-orders query below via the `(${platform}::text IS NULL OR
    // platform = ${platform})` trick so a single SQL stays valid in both modes.
    const PLATFORM_WHITELIST = new Set([
      "instagram", "tiktok", "youtube", "facebook",
      "twitter", "spotify", "linkedin", "twitch",
    ]);
    const rawPlatform = searchParams.get("platform");
    const platform: string | null = rawPlatform && PLATFORM_WHITELIST.has(rawPlatform) ? rawPlatform : null;

    const [
      totalOrdersRes,
      revenueByCurrencyAll,
      revenueByCurrencyPrevPeriod,
      ordersTodayRes,
      revenueTodayByCurrency,
      byPlatformRaw,
      byCurrencyRaw,
      byStatusRes,
      last30daysRaw,
      adCostsTotalRes,
      adCostsLast7Res,
      uniqueCustomersRes,
      uniqueCustomersPrevRes,
      topCountriesRaw,
      topClientsRaw,
      peakHoursRes,
      servicePerfRaw,
      ordersPrevPeriodRes,
    ] = await Promise.all([
      // Note: every date/hour aggregation is shifted to Europe/Paris (Fanovera
      // operates from France) so the "today" / "by day" / "peak hours" buckets
      // align with the operator's calendar instead of UTC. The TIMESTAMPTZ
      // storage stays UTC — only the cast to DATE / HOUR is timezone-shifted.
      sql`
        SELECT COUNT(*)::int AS count
        FROM orders
        WHERE status IN ('paid','processing','delivered')
          AND (created_at AT TIME ZONE 'Europe/Paris')::date BETWEEN ${fromDate}::date AND ${toDate}::date
          AND (${platform}::text IS NULL OR platform = ${platform})
      `,
      sql`
        SELECT currency,
               COALESCE(SUM(total_cents), 0)::int AS revenue,
               COALESCE(SUM(cost_cents), 0)::int AS cost
        FROM orders
        WHERE status IN ('paid','processing','delivered')
          AND (created_at AT TIME ZONE 'Europe/Paris')::date BETWEEN ${fromDate}::date AND ${toDate}::date
          AND (${platform}::text IS NULL OR platform = ${platform})
        GROUP BY currency
      `,
      sql`
        SELECT currency,
               COALESCE(SUM(total_cents), 0)::int AS revenue,
               COALESCE(SUM(cost_cents), 0)::int AS cost
        FROM orders
        WHERE status IN ('paid','processing','delivered')
          AND (created_at AT TIME ZONE 'Europe/Paris')::date BETWEEN ${prevFromDate}::date AND ${prevToDate}::date
          AND (${platform}::text IS NULL OR platform = ${platform})
        GROUP BY currency
      `,
      sql`
        SELECT COUNT(*)::int AS count
        FROM orders
        WHERE (created_at AT TIME ZONE 'Europe/Paris')::date = (NOW() AT TIME ZONE 'Europe/Paris')::date
          AND status IN ('paid','processing','delivered')
          AND (${platform}::text IS NULL OR platform = ${platform})
      `,
      sql`
        SELECT currency, COALESCE(SUM(total_cents), 0)::int AS revenue
        FROM orders
        WHERE (created_at AT TIME ZONE 'Europe/Paris')::date = (NOW() AT TIME ZONE 'Europe/Paris')::date
          AND status IN ('paid','processing','delivered')
          AND (${platform}::text IS NULL OR platform = ${platform})
        GROUP BY currency
      `,
      // Top réseaux panel stays global on purpose — filtering it would
      // collapse the chart to a single bar whenever a platform is selected.
      sql`
        SELECT platform, currency,
               COUNT(*)::int AS orders,
               COALESCE(SUM(total_cents), 0)::int AS revenue
        FROM orders
        WHERE status IN ('paid','processing','delivered')
          AND (created_at AT TIME ZONE 'Europe/Paris')::date BETWEEN ${fromDate}::date AND ${toDate}::date
        GROUP BY platform, currency
      `,
      sql`
        SELECT currency,
               COUNT(*)::int AS orders,
               COALESCE(SUM(total_cents), 0)::int AS revenue
        FROM orders
        WHERE status IN ('paid','processing','delivered')
          AND (created_at AT TIME ZONE 'Europe/Paris')::date BETWEEN ${fromDate}::date AND ${toDate}::date
          AND (${platform}::text IS NULL OR platform = ${platform})
        GROUP BY currency
      `,
      sql`
        SELECT status, COUNT(*)::int AS count
        FROM orders
        WHERE (created_at AT TIME ZONE 'Europe/Paris')::date BETWEEN ${fromDate}::date AND ${toDate}::date
          AND (${platform}::text IS NULL OR platform = ${platform})
        GROUP BY status
        ORDER BY count DESC
      `,
      sql`
        SELECT d.date::text AS date, o.currency,
          COALESCE(SUM(CASE WHEN o.status IN ('paid','processing','delivered') THEN o.total_cents ELSE 0 END), 0)::int AS revenue,
          COALESCE(SUM(CASE WHEN o.status IN ('paid','processing','delivered') THEN o.cost_cents ELSE 0 END), 0)::int AS cost
        FROM generate_series(${fromDate}::date, ${toDate}::date, '1 day') AS d(date)
        LEFT JOIN orders o ON (o.created_at AT TIME ZONE 'Europe/Paris')::date = d.date
          AND (${platform}::text IS NULL OR o.platform = ${platform})
        GROUP BY d.date, o.currency
        ORDER BY d.date ASC
      `,
      sql`SELECT COALESCE(SUM(cost_cents), 0)::int AS sum FROM ad_costs WHERE date BETWEEN ${fromDate}::date AND ${toDate}::date`,
      sql`SELECT date::text AS date, COALESCE(SUM(cost_cents), 0)::int AS cost FROM ad_costs WHERE date BETWEEN ${fromDate}::date AND ${toDate}::date GROUP BY date ORDER BY date DESC`,
      sql`
        SELECT COUNT(DISTINCT LOWER(email))::int AS count
        FROM orders
        WHERE email <> ''
          AND status IN ('paid','processing','delivered')
          AND (created_at AT TIME ZONE 'Europe/Paris')::date BETWEEN ${fromDate}::date AND ${toDate}::date
          AND (${platform}::text IS NULL OR platform = ${platform})
      `,
      sql`
        SELECT COUNT(DISTINCT LOWER(email))::int AS count
        FROM orders
        WHERE email <> ''
          AND status IN ('paid','processing','delivered')
          AND (created_at AT TIME ZONE 'Europe/Paris')::date BETWEEN ${prevFromDate}::date AND ${prevToDate}::date
          AND (${platform}::text IS NULL OR platform = ${platform})
      `,
      sql`
        SELECT COALESCE(NULLIF(country, ''), '??') AS country,
               COUNT(*)::int AS orders,
               currency,
               COALESCE(SUM(total_cents), 0)::int AS revenue
        FROM orders
        WHERE status IN ('paid','processing','delivered')
          AND (created_at AT TIME ZONE 'Europe/Paris')::date BETWEEN ${fromDate}::date AND ${toDate}::date
          AND (${platform}::text IS NULL OR platform = ${platform})
        GROUP BY country, currency
      `,
      sql`
        SELECT LOWER(email) AS email,
               COUNT(*)::int AS orders,
               currency,
               COALESCE(SUM(total_cents), 0)::int AS revenue,
               MAX(country) AS country
        FROM orders
        WHERE status IN ('paid','processing','delivered')
          AND email <> ''
          AND (${platform}::text IS NULL OR platform = ${platform})
        GROUP BY LOWER(email), currency
      `,
      sql`
        SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'Europe/Paris')::int AS hour,
               COUNT(*)::int AS count
        FROM orders
        WHERE status IN ('paid','processing','delivered')
          AND (created_at AT TIME ZONE 'Europe/Paris')::date BETWEEN ${fromDate}::date AND ${toDate}::date
          AND (${platform}::text IS NULL OR platform = ${platform})
        GROUP BY hour
      `,
      sql`
        SELECT (item->>'service') AS service,
               currency,
               COUNT(*)::int AS orders,
               COALESCE(SUM(total_cents), 0)::int AS revenue
        FROM orders, jsonb_array_elements(
          CASE WHEN jsonb_typeof(cart) = 'array' THEN cart ELSE '[]'::jsonb END
        ) AS item
        WHERE status IN ('paid','processing','delivered')
          AND (created_at AT TIME ZONE 'Europe/Paris')::date BETWEEN ${fromDate}::date AND ${toDate}::date
          AND item->>'service' IS NOT NULL
          AND (${platform}::text IS NULL OR platform = ${platform})
        GROUP BY service, currency
      `,
      sql`
        SELECT COUNT(*)::int AS count
        FROM orders
        WHERE status IN ('paid','processing','delivered')
          AND (created_at AT TIME ZONE 'Europe/Paris')::date BETWEEN ${prevFromDate}::date AND ${prevToDate}::date
          AND (${platform}::text IS NULL OR platform = ${platform})
      `,
    ]);

    // Visitor counts depend on the product_page_visits table which is created
    // by initDb(). Fail soft so analytics keeps working before that migration
    // has been run — empty visitor data is preferable to a 500 that locks the
    // admin out of every screen (auth is validated via this endpoint).
    let visitorsByPlatformRaw: Array<{ platform: string; visitors: number }> = [];
    try {
      visitorsByPlatformRaw = (await sql`
        SELECT platform,
               COUNT(DISTINCT anonymous_id)::int AS visitors
        FROM product_page_visits
        WHERE (created_at AT TIME ZONE 'Europe/Paris')::date BETWEEN ${fromDate}::date AND ${toDate}::date
        GROUP BY platform
      `) as Array<{ platform: string; visitors: number }>;
    } catch (visitErr) {
      console.warn("[analytics] product_page_visits unavailable:", visitErr);
    }

    const totalRevenue = await sumInEur(revenueByCurrencyAll as CurrencyRevenueRow[], "revenue");
    const totalCost = await sumInEur(revenueByCurrencyAll as CurrencyRevenueRow[], "cost");
    const revenueToday = await sumInEur(revenueTodayByCurrency as CurrencyRevenueRow[], "revenue");
    const prevRevenue = await sumInEur(revenueByCurrencyPrevPeriod as CurrencyRevenueRow[], "revenue");
    const prevCost = await sumInEur(revenueByCurrencyPrevPeriod as CurrencyRevenueRow[], "cost");
    // ad_costs are tracked globally (not per platform). When a single platform
    // is selected we can't honestly attribute spend to it — zero out rather
    // than inflate the platform's cost with the whole network's ad budget.
    const adCosts = platform ? 0 : (Number(adCostsTotalRes[0]?.sum) || 0);
    const profit = totalRevenue - totalCost - adCosts;
    const prevProfit = prevRevenue - prevCost; // prior period ad cost not tracked separately by date here
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    const prevMargin = prevRevenue > 0 ? (prevProfit / prevRevenue) * 100 : 0;

    const totalOrders = Number(totalOrdersRes[0].count);
    const prevOrders = Number(ordersPrevPeriodRes[0].count) || 0;

    const pctDelta = (curr: number, prev: number) => (prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0);

    // Aggregate per platform (collapse currency).
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
    const platformTotalRev = byPlatform.reduce((s, p) => s + p.revenue, 0) || 1;
    const byPlatformWithShare = byPlatform.map((p) => ({ ...p, share: Math.round((p.revenue / platformTotalRev) * 100) }));

    // Currencies in EUR.
    const byCurrency = await Promise.all(
      (byCurrencyRaw as Array<{ currency: string | null; orders: number; revenue: number }>).map(async (row) => ({
        currency: row.currency || "EUR",
        orders: Number(row.orders) || 0,
        revenue: await convertCentsToEur(Number(row.revenue) || 0, row.currency || "EUR"),
      })),
    );
    byCurrency.sort((a, b) => b.revenue - a.revenue);

    // 30-day series, collapsed to per-day EUR.
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

    // Distribute ad costs evenly across the 30-day window — we don't have a
    // per-day breakdown here (only the 7-day list is fetched in detail).
    const adCostsByDate = new Map<string, number>();
    for (const row of adCostsLast7Res as Array<{ date: string; cost: number }>) {
      adCostsByDate.set(row.date, Number(row.cost) || 0);
    }
    const last30daysWithAds = last30days.map((d) => ({
      ...d,
      ads: adCostsByDate.get(d.date) || 0,
    }));

    // Top countries: collapse (country, currency) → EUR per country.
    const countryMap = new Map<string, { country: string; orders: number; revenue: number }>();
    for (const row of topCountriesRaw as Array<{ country: string; orders: number; currency: string | null; revenue: number }>) {
      const eurCents = await convertCentsToEur(Number(row.revenue) || 0, row.currency || "EUR");
      const existing = countryMap.get(row.country);
      if (existing) {
        existing.orders += Number(row.orders) || 0;
        existing.revenue += eurCents;
      } else {
        countryMap.set(row.country, { country: row.country, orders: Number(row.orders) || 0, revenue: eurCents });
      }
    }
    const topCountries = Array.from(countryMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

    // Top clients (collapse per email).
    const clientMap = new Map<string, { email: string; orders: number; revenue: number; country: string }>();
    for (const row of topClientsRaw as Array<{ email: string; orders: number; currency: string | null; revenue: number; country: string | null }>) {
      const eurCents = await convertCentsToEur(Number(row.revenue) || 0, row.currency || "EUR");
      const existing = clientMap.get(row.email);
      if (existing) {
        existing.orders += Number(row.orders) || 0;
        existing.revenue += eurCents;
      } else {
        clientMap.set(row.email, {
          email: row.email,
          orders: Number(row.orders) || 0,
          revenue: eurCents,
          country: (row.country || "").toUpperCase(),
        });
      }
    }
    const topClients = Array.from(clientMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Peak hours: pad to 24h.
    const peakHours = Array.from({ length: 24 }, (_, h) => 0);
    for (const row of peakHoursRes as Array<{ hour: number; count: number }>) {
      const h = Number(row.hour);
      if (h >= 0 && h < 24) peakHours[h] = Number(row.count) || 0;
    }

    // Service performance.
    const serviceMap = new Map<string, { service: string; orders: number; revenue: number }>();
    for (const row of servicePerfRaw as Array<{ service: string; currency: string | null; orders: number; revenue: number }>) {
      const eurCents = await convertCentsToEur(Number(row.revenue) || 0, row.currency || "EUR");
      const existing = serviceMap.get(row.service);
      if (existing) {
        existing.orders += Number(row.orders) || 0;
        existing.revenue += eurCents;
      } else {
        serviceMap.set(row.service, { service: row.service, orders: Number(row.orders) || 0, revenue: eurCents });
      }
    }

    // Unique visitors per platform over the last 30d, used to compute
    // revenue/visit per service (services on the same platform share the
    // denominator since visits are tracked at the platform level).
    const visitorsByPlatform = new Map<string, number>();
    for (const row of visitorsByPlatformRaw as Array<{ platform: string; visitors: number }>) {
      visitorsByPlatform.set(String(row.platform), Number(row.visitors) || 0);
    }

    const SERVICE_PREFIX_TO_PLATFORM: Record<string, string> = {
      ig: "instagram",
      tt: "tiktok",
      yt: "youtube",
      sp: "spotify",
      tw: "twitch",
      fb: "facebook",
      li: "linkedin",
      x: "twitter",
    };
    const platformForService = (service: string): string => {
      const prefix = service.split("_")[0];
      return SERVICE_PREFIX_TO_PLATFORM[prefix] || service;
    };

    const servicePerf = Array.from(serviceMap.values())
      .map((entry) => {
        const platform = platformForService(entry.service);
        const visitors = visitorsByPlatform.get(platform) || 0;
        const revenuePerVisitorCents = visitors > 0 ? Math.round(entry.revenue / visitors) : 0;
        return { ...entry, platform, visitors, revenuePerVisitorCents };
      })
      .sort((a, b) => b.revenuePerVisitorCents - a.revenuePerVisitorCents);

    // Customer KPIs.
    const uniqueCustomers = Number(uniqueCustomersRes[0]?.count) || 0;
    const uniqueCustomersPrev = Number(uniqueCustomersPrevRes[0]?.count) || 0;
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0; // in EUR cents
    const ltv = uniqueCustomers > 0 ? Math.round(totalRevenue / uniqueCustomers) : 0;
    const avgOrdersPerCustomer = uniqueCustomers > 0 ? totalOrders / uniqueCustomers : 0;
    const repeatCustomers = Array.from(clientMap.values()).filter((c) => c.orders > 1).length;
    const recurrenceRate = uniqueCustomers > 0 ? Math.round((repeatCustomers / uniqueCustomers) * 100) : 0;

    return NextResponse.json({
      range: rangeDays,
      fromDate,
      toDate,
      totalOrders,
      totalRevenue,
      totalCost,
      adCosts,
      profit,
      margin,
      ordersToday: Number(ordersTodayRes[0].count),
      revenueToday,
      byPlatform: byPlatformWithShare,
      byCurrency,
      byStatus: byStatusRes,
      last30days: last30daysWithAds,
      deltas: {
        revenue: pctDelta(totalRevenue, prevRevenue),
        profit: pctDelta(profit, prevProfit),
        margin: Math.round(margin - prevMargin),
        orders: pctDelta(totalOrders, prevOrders),
        customers: pctDelta(uniqueCustomers, uniqueCustomersPrev),
      },
      customers: {
        unique: uniqueCustomers,
        aov,
        ltv,
        avgOrders: Math.round(avgOrdersPerCustomer * 10) / 10,
        recurrence: recurrenceRate,
      },
      topCountries,
      topClients,
      peakHours,
      servicePerf,
      adsLast7: (adCostsLast7Res as Array<{ date: string; cost: number }>).map((r) => ({
        date: r.date,
        cost: Number(r.cost) || 0,
      })),
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
