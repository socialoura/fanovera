import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

function cleanString(value: unknown, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const anonymousId = cleanString(body.anonymousId, 160);
    const experimentId = cleanString(body.experimentId);
    const variantId = cleanString(body.variantId);

    if (!anonymousId || !experimentId || !variantId || experimentId === "null") {
      return NextResponse.json({ ok: true, skipped: true });
    }

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

    await sql`
      INSERT INTO pricing_experiment_exposures (
        anonymous_id,
        experiment_id,
        variant_id,
        pricing_strategy,
        product_area,
        plan,
        locale,
        country,
        price,
        currency
      )
      VALUES (
        ${anonymousId},
        ${experimentId},
        ${variantId},
        ${cleanString(body.pricingStrategy || body.pricing_strategy)},
        ${cleanString(body.productArea || body.product_area, 80)},
        ${cleanString(body.plan, 80)},
        ${cleanString(body.locale, 12)},
        ${cleanString(body.country, 12)},
        ${Number(body.price) || 0},
        ${cleanString(body.currency, 3).toUpperCase() || "EUR"}
      )
      ON CONFLICT (anonymous_id, experiment_id, variant_id, product_area)
      DO UPDATE SET
        plan = EXCLUDED.plan,
        price = EXCLUDED.price,
        currency = EXCLUDED.currency
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[pricing-experiments/exposure]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
