import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
async function ensureExperimentColumns() {
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS experiment_id VARCHAR(120) DEFAULT ''`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS variant_id VARCHAR(120) DEFAULT ''`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pricing_strategy VARCHAR(120) DEFAULT ''`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS source_page VARCHAR(160) DEFAULT ''`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS plan VARCHAR(80) DEFAULT ''`;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS experiment_id VARCHAR(120) DEFAULT ''`;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS variant_id VARCHAR(120) DEFAULT ''`;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS pricing_strategy VARCHAR(120) DEFAULT ''`;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS source_page VARCHAR(160) DEFAULT ''`;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS plan VARCHAR(80) DEFAULT ''`;
  await sql`
    CREATE TABLE IF NOT EXISTS pricing_experiment_exposures (
      id SERIAL PRIMARY KEY,
      anonymous_id VARCHAR(160) NOT NULL,
      experiment_id VARCHAR(120) NOT NULL,
      variant_id VARCHAR(120) NOT NULL,
      pricing_strategy VARCHAR(120) DEFAULT '',
      product_area VARCHAR(80) DEFAULT '',
      plan VARCHAR(80) DEFAULT '',
      locale VARCHAR(12) DEFAULT '',
      country VARCHAR(12) DEFAULT '',
      price NUMERIC(12, 2) DEFAULT 0,
      currency VARCHAR(3) DEFAULT 'EUR',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(anonymous_id, experiment_id, variant_id, product_area)
    )
  `;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    await ensureExperimentColumns();
    const days = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get("days")) || 30));
    const since = `${days} days`;

    const [exposureRows, checkoutRows, orderRows, totalRows] = await Promise.all([
      sql`
        SELECT
          COALESCE(NULLIF(experiment_id, ''), 'no_experiment') AS experiment_id,
          COALESCE(NULLIF(variant_id, ''), 'control') AS variant_id,
          COALESCE(NULLIF(pricing_strategy, ''), 'standard') AS pricing_strategy,
          COUNT(*)::int AS exposures,
          COUNT(DISTINCT anonymous_id)::int AS visitors
        FROM pricing_experiment_exposures
        WHERE created_at >= NOW() - ${since}::interval
        GROUP BY 1, 2, 3
      `,
      sql`
        SELECT
          COALESCE(NULLIF(experiment_id, ''), 'no_experiment') AS experiment_id,
          COALESCE(NULLIF(variant_id, ''), 'control') AS variant_id,
          COALESCE(NULLIF(pricing_strategy, ''), 'standard') AS pricing_strategy,
          COUNT(*)::int AS checkout_started,
          COALESCE(SUM(amount_cents), 0)::int AS checkout_amount_cents
        FROM checkout_payloads
        WHERE created_at >= NOW() - ${since}::interval
        GROUP BY 1, 2, 3
      `,
      sql`
        SELECT
          COALESCE(NULLIF(experiment_id, ''), 'no_experiment') AS experiment_id,
          COALESCE(NULLIF(variant_id, ''), 'control') AS variant_id,
          COALESCE(NULLIF(pricing_strategy, ''), 'standard') AS pricing_strategy,
          COUNT(*)::int AS orders,
          COALESCE(SUM(total_cents), 0)::int AS revenue_cents,
          COALESCE(SUM(cost_cents), 0)::int AS cost_cents
        FROM orders
        WHERE created_at >= NOW() - ${since}::interval
          AND status IN ('paid','processing','delivered')
        GROUP BY 1, 2, 3
      `,
      sql`
        SELECT
          COUNT(*)::int AS checkout_started,
          COALESCE(SUM(amount_cents), 0)::int AS checkout_amount_cents
        FROM checkout_payloads
        WHERE created_at >= NOW() - ${since}::interval
      `,
    ]);

    const byKey = new Map<string, Record<string, unknown>>();
    for (const row of exposureRows as Record<string, unknown>[]) {
      const key = `${row.experiment_id}:${row.variant_id}:${row.pricing_strategy}`;
      byKey.set(key, { ...row });
    }
    for (const row of checkoutRows as Record<string, unknown>[]) {
      const key = `${row.experiment_id}:${row.variant_id}:${row.pricing_strategy}`;
      byKey.set(key, { ...row });
    }
    for (const row of orderRows as Record<string, unknown>[]) {
      const key = `${row.experiment_id}:${row.variant_id}:${row.pricing_strategy}`;
      byKey.set(key, { ...(byKey.get(key) || row), ...row });
    }

    const variants = Array.from(byKey.values()).map((row) => {
      const checkoutStarted = Number(row.checkout_started) || 0;
      const visitors = Number(row.visitors) || 0;
      const exposures = Number(row.exposures) || 0;
      const orders = Number(row.orders) || 0;
      const revenueCents = Number(row.revenue_cents) || 0;
      const costCents = Number(row.cost_cents) || 0;
      return {
        experimentId: row.experiment_id,
        variantId: row.variant_id,
        pricingStrategy: row.pricing_strategy,
        visitors,
        exposures,
        checkoutStarted,
        orders,
        revenueCents,
        costCents,
        profitCents: revenueCents - costCents,
        averageOrderValueCents: orders > 0 ? Math.round(revenueCents / orders) : 0,
        visitorConversionRate: visitors > 0 ? orders / visitors : 0,
        checkoutConversionRate: checkoutStarted > 0 ? orders / checkoutStarted : 0,
      };
    }).sort((a, b) => b.revenueCents - a.revenueCents);

    return NextResponse.json({
      days,
      totals: totalRows[0] || { checkout_started: 0, checkout_amount_cents: 0 },
      variants,
    });
  } catch (error) {
    console.error("[admin/pricing-experiments/results]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
