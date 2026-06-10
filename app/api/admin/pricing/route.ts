import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
async function clearPopularForService(service: string, exceptId?: number) {
  if (exceptId) {
    await sql`UPDATE pricing SET popular = false WHERE service = ${service} AND id <> ${exceptId}`;
    return;
  }

  await sql`UPDATE pricing SET popular = false WHERE service = ${service}`;
}

async function ensurePricingSortOrder() {
  await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`;
  await sql`
    UPDATE pricing
    SET sort_order = ranked.rank * 1000
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY service ORDER BY qty ASC, id ASC) AS rank
      FROM pricing
      WHERE COALESCE(sort_order, 0) = 0
    ) ranked
    WHERE pricing.id = ranked.id
  `;
}

async function nextSortOrder(service: string) {
  const rows = await sql`SELECT COALESCE(MAX(sort_order), 0)::int AS max FROM pricing WHERE service = ${service}`;
  return Number(rows[0]?.max || 0) + 1000;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    await ensurePricingSortOrder();
    const packs = await sql`SELECT * FROM pricing ORDER BY service, sort_order ASC, qty ASC`;
    return NextResponse.json({ packs });
  } catch (error) {
    console.error("Pricing GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const {
      service,
      qty,
      price,
      price_usd,
      price_gbp,
      price_brl,
      price_try,
      price_cad,
      price_aud,
      price_chf,
      price_mxn,
      price_sek,
      popular,
      active,
      sort_order,
    } = body;

    if (!service || !Number.isFinite(Number(qty)) || Number(qty) <= 0 || !Number.isFinite(Number(price))) {
      return NextResponse.json({ error: "service, qty (> 0), and valid price are required" }, { status: 400 });
    }

    const numericToValidate = [
      qty,
      price,
      price_usd,
      price_gbp,
      price_brl,
      price_try,
      price_cad,
      price_aud,
      price_chf,
      price_mxn,
      price_sek,
    ];
    if (numericToValidate.some((n) => n !== undefined && (Number.isNaN(Number(n)) || Number(n) < 0))) {
      return NextResponse.json({ error: "Invalid numeric values" }, { status: 400 });
    }

    if (popular) {
      await clearPopularForService(String(service));
    }

    await ensurePricingSortOrder();
    const resolvedSortOrder = Number.isFinite(Number(sort_order)) && Number(sort_order) > 0
      ? Number(sort_order)
      : await nextSortOrder(String(service));

    const result = await sql`
      INSERT INTO pricing (service, qty, price, price_usd, price_gbp, price_brl, price_try, price_cad, price_aud, price_chf, price_mxn, price_sek, popular, active, sort_order)
      VALUES (${service}, ${qty}, ${price}, ${price_usd || 0}, ${price_gbp || 0}, ${price_brl || 0}, ${price_try || 0}, ${price_cad || 0}, ${price_aud || 0}, ${price_chf || 0}, ${price_mxn || 0}, ${price_sek || 0}, ${popular || false}, ${active !== false}, ${resolvedSortOrder})
      RETURNING *
    `;

    return NextResponse.json({ pack: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Pricing POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await ensurePricingSortOrder();

    const allowedFields = ["service", "qty", "price", "price_usd", "price_gbp", "price_brl", "price_try", "price_cad", "price_aud", "price_chf", "price_mxn", "price_sek", "popular", "active", "sort_order"];

    const hasAllowedField = allowedFields.some((field) => fields[field] !== undefined);
    if (!hasAllowedField) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const current = await sql`SELECT * FROM pricing WHERE id = ${id} LIMIT 1`;
    if (current.length === 0) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    const nextService = String(fields.service ?? current[0].service);
    const willBePopular = fields.popular === true || (fields.popular === undefined && Boolean(current[0].popular));

    if (willBePopular) {
      await clearPopularForService(nextService, Number(id));
    }

    // Use individual field updates since neon sql tagged template doesn't support dynamic queries easily
    const numericFields = ["qty", "price", "price_usd", "price_gbp", "price_brl", "price_try", "price_cad", "price_aud", "price_chf", "price_mxn", "price_sek", "sort_order"];
    for (const f of numericFields) {
      const v = fields[f];
      if (v !== undefined && (Number.isNaN(Number(v)) || Number(v) < 0)) {
        return NextResponse.json({ error: `Invalid ${f}` }, { status: 400 });
      }
    }

    if (fields.qty !== undefined && Number(fields.qty) <= 0) {
      return NextResponse.json({ error: "Invalid qty" }, { status: 400 });
    }

    const cur = current[0];
    if (fields.service !== undefined && fields.service !== cur.service) await sql`UPDATE pricing SET service = ${fields.service} WHERE id = ${id}`;
    if (fields.qty !== undefined && Number(fields.qty) !== Number(cur.qty)) await sql`UPDATE pricing SET qty = ${fields.qty} WHERE id = ${id}`;
    if (fields.price !== undefined && Number(fields.price) !== Number(cur.price)) await sql`UPDATE pricing SET price = ${fields.price} WHERE id = ${id}`;
    if (fields.price_usd !== undefined && Number(fields.price_usd) !== Number(cur.price_usd)) await sql`UPDATE pricing SET price_usd = ${fields.price_usd} WHERE id = ${id}`;
    if (fields.price_gbp !== undefined && Number(fields.price_gbp) !== Number(cur.price_gbp)) await sql`UPDATE pricing SET price_gbp = ${fields.price_gbp} WHERE id = ${id}`;
    if (fields.price_brl !== undefined && Number(fields.price_brl) !== Number(cur.price_brl)) await sql`UPDATE pricing SET price_brl = ${fields.price_brl} WHERE id = ${id}`;
    if (fields.price_try !== undefined && Number(fields.price_try) !== Number(cur.price_try)) await sql`UPDATE pricing SET price_try = ${fields.price_try} WHERE id = ${id}`;
    if (fields.price_cad !== undefined && Number(fields.price_cad) !== Number(cur.price_cad)) await sql`UPDATE pricing SET price_cad = ${fields.price_cad} WHERE id = ${id}`;
    if (fields.price_aud !== undefined && Number(fields.price_aud) !== Number(cur.price_aud)) await sql`UPDATE pricing SET price_aud = ${fields.price_aud} WHERE id = ${id}`;
    if (fields.price_chf !== undefined && Number(fields.price_chf) !== Number(cur.price_chf)) await sql`UPDATE pricing SET price_chf = ${fields.price_chf} WHERE id = ${id}`;
    if (fields.price_mxn !== undefined && Number(fields.price_mxn) !== Number(cur.price_mxn)) await sql`UPDATE pricing SET price_mxn = ${fields.price_mxn} WHERE id = ${id}`;
    if (fields.price_sek !== undefined && Number(fields.price_sek) !== Number(cur.price_sek)) await sql`UPDATE pricing SET price_sek = ${fields.price_sek} WHERE id = ${id}`;
    if (fields.popular !== undefined && Boolean(fields.popular) !== Boolean(cur.popular)) await sql`UPDATE pricing SET popular = ${fields.popular} WHERE id = ${id}`;
    if (fields.active !== undefined && Boolean(fields.active) !== Boolean(cur.active)) await sql`UPDATE pricing SET active = ${fields.active} WHERE id = ${id}`;
    if (fields.sort_order !== undefined && Math.round(Number(fields.sort_order)) !== Number(cur.sort_order)) await sql`UPDATE pricing SET sort_order = ${Math.round(Number(fields.sort_order))} WHERE id = ${id}`;

    const updated = await sql`SELECT * FROM pricing WHERE id = ${id} LIMIT 1`;

    return NextResponse.json({ pack: updated[0] });
  } catch (error) {
    console.error("Pricing PUT error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const deleted = await sql`DELETE FROM pricing WHERE id = ${id} RETURNING id`;
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pricing DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
