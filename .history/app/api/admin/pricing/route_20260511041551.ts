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
    const { service, qty, price, price_usd, price_gbp, price_cad, price_nzd, price_aud, price_chf, popular, active } = body;

    if (!service || !qty || !price) {
      return NextResponse.json({ error: "service, qty, and price are required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO pricing (service, qty, price, price_usd, price_gbp, price_cad, price_nzd, price_aud, price_chf, popular, active)
      VALUES (${service}, ${qty}, ${price}, ${price_usd || 0}, ${price_gbp || 0}, ${price_cad || 0}, ${price_nzd || 0}, ${price_aud || 0}, ${price_chf || 0}, ${popular || false}, ${active !== false})
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

    // Build dynamic update
    const setClauses: string[] = [];
    const values: unknown[] = [];

    const allowedFields = ["service", "qty", "price", "price_usd", "price_gbp", "price_cad", "price_nzd", "price_aud", "price_chf", "popular", "active"];

    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        setClauses.push(`${field} = $${values.length + 1}`);
        values.push(fields[field]);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Use individual field updates since neon sql tagged template doesn't support dynamic queries easily
    if (fields.service !== undefined) await sql`UPDATE pricing SET service = ${fields.service} WHERE id = ${id}`;
    if (fields.qty !== undefined) await sql`UPDATE pricing SET qty = ${fields.qty} WHERE id = ${id}`;
    if (fields.price !== undefined) await sql`UPDATE pricing SET price = ${fields.price} WHERE id = ${id}`;
    if (fields.price_usd !== undefined) await sql`UPDATE pricing SET price_usd = ${fields.price_usd} WHERE id = ${id}`;
    if (fields.price_gbp !== undefined) await sql`UPDATE pricing SET price_gbp = ${fields.price_gbp} WHERE id = ${id}`;
    if (fields.price_cad !== undefined) await sql`UPDATE pricing SET price_cad = ${fields.price_cad} WHERE id = ${id}`;
    if (fields.price_nzd !== undefined) await sql`UPDATE pricing SET price_nzd = ${fields.price_nzd} WHERE id = ${id}`;
    if (fields.price_aud !== undefined) await sql`UPDATE pricing SET price_aud = ${fields.price_aud} WHERE id = ${id}`;
    if (fields.price_chf !== undefined) await sql`UPDATE pricing SET price_chf = ${fields.price_chf} WHERE id = ${id}`;
    if (fields.popular !== undefined) await sql`UPDATE pricing SET popular = ${fields.popular} WHERE id = ${id}`;
    if (fields.active !== undefined) await sql`UPDATE pricing SET active = ${fields.active} WHERE id = ${id}`;

    const updated = await sql`SELECT * FROM pricing WHERE id = ${id} LIMIT 1`;
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

    await sql`DELETE FROM pricing WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pricing DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
