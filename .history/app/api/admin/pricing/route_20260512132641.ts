import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  try {
    const packs = await sql`SELECT * FROM pricing ORDER BY service, qty`;
    return NextResponse.json({ packs });
  } catch (error) {
    console.error("Pricing GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

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

    const result = await sql`
      INSERT INTO pricing (service, qty, price, price_usd, price_gbp, price_brl, price_try, price_cad, price_aud, price_chf, price_mxn, price_sek, popular, active)
      VALUES (${service}, ${qty}, ${price}, ${price_usd || 0}, ${price_gbp || 0}, ${price_brl || 0}, ${price_try || 0}, ${price_cad || 0}, ${price_aud || 0}, ${price_chf || 0}, ${price_mxn || 0}, ${price_sek || 0}, ${popular || false}, ${active !== false})
      RETURNING *
    `;

    return NextResponse.json({ pack: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Pricing POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const allowedFields = ["service", "qty", "price", "price_usd", "price_gbp", "price_brl", "price_try", "price_cad", "price_aud", "price_chf", "price_mxn", "price_sek", "popular", "active"];

    const hasAllowedField = allowedFields.some((field) => fields[field] !== undefined);
    if (!hasAllowedField) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Use individual field updates since neon sql tagged template doesn't support dynamic queries easily
    const numericFields = ["qty", "price", "price_usd", "price_gbp", "price_brl", "price_try", "price_cad", "price_aud", "price_chf", "price_mxn", "price_sek"];
    for (const f of numericFields) {
      const v = fields[f];
      if (v !== undefined && (Number.isNaN(Number(v)) || Number(v) < 0)) {
        return NextResponse.json({ error: `Invalid ${f}` }, { status: 400 });
      }
    }

    if (fields.qty !== undefined && Number(fields.qty) <= 0) {
      return NextResponse.json({ error: "Invalid qty" }, { status: 400 });
    }

    if (fields.service !== undefined) await sql`UPDATE pricing SET service = ${fields.service} WHERE id = ${id}`;
    if (fields.qty !== undefined) await sql`UPDATE pricing SET qty = ${fields.qty} WHERE id = ${id}`;
    if (fields.price !== undefined) await sql`UPDATE pricing SET price = ${fields.price} WHERE id = ${id}`;
    if (fields.price_usd !== undefined) await sql`UPDATE pricing SET price_usd = ${fields.price_usd} WHERE id = ${id}`;
    if (fields.price_gbp !== undefined) await sql`UPDATE pricing SET price_gbp = ${fields.price_gbp} WHERE id = ${id}`;
    if (fields.price_brl !== undefined) await sql`UPDATE pricing SET price_brl = ${fields.price_brl} WHERE id = ${id}`;
    if (fields.price_try !== undefined) await sql`UPDATE pricing SET price_try = ${fields.price_try} WHERE id = ${id}`;
    if (fields.price_cad !== undefined) await sql`UPDATE pricing SET price_cad = ${fields.price_cad} WHERE id = ${id}`;
    if (fields.price_aud !== undefined) await sql`UPDATE pricing SET price_aud = ${fields.price_aud} WHERE id = ${id}`;
    if (fields.price_chf !== undefined) await sql`UPDATE pricing SET price_chf = ${fields.price_chf} WHERE id = ${id}`;
    if (fields.price_mxn !== undefined) await sql`UPDATE pricing SET price_mxn = ${fields.price_mxn} WHERE id = ${id}`;
    if (fields.price_sek !== undefined) await sql`UPDATE pricing SET price_sek = ${fields.price_sek} WHERE id = ${id}`;
    if (fields.popular !== undefined) await sql`UPDATE pricing SET popular = ${fields.popular} WHERE id = ${id}`;
    if (fields.active !== undefined) await sql`UPDATE pricing SET active = ${fields.active} WHERE id = ${id}`;

    const updated = await sql`SELECT * FROM pricing WHERE id = ${id} LIMIT 1`;
    if (updated.length === 0) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    return NextResponse.json({ pack: updated[0] });
  } catch (error) {
    console.error("Pricing PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

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
