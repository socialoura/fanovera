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
    const upsells = await sql`SELECT * FROM upsells ORDER BY sort_order, id`;
    return NextResponse.json({ upsells });
  } catch (error) {
    console.error("Upsells GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  try {
    const body = await req.json();
    const { service, qty, label, label_en, active, sort_order } = body;

    if (!service || !qty) {
      return NextResponse.json({ error: "service and qty are required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO upsells (service, qty, label, label_en, active, sort_order)
      VALUES (${service}, ${qty}, ${label || ""}, ${label_en || ""}, ${active !== false}, ${sort_order || 0})
      RETURNING *
    `;

    return NextResponse.json({ upsell: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Upsells POST error:", error);
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

    if (fields.service !== undefined) await sql`UPDATE upsells SET service = ${fields.service} WHERE id = ${id}`;
    if (fields.qty !== undefined) await sql`UPDATE upsells SET qty = ${fields.qty} WHERE id = ${id}`;
    if (fields.label !== undefined) await sql`UPDATE upsells SET label = ${fields.label} WHERE id = ${id}`;
    if (fields.label_en !== undefined) await sql`UPDATE upsells SET label_en = ${fields.label_en} WHERE id = ${id}`;
    if (fields.active !== undefined) await sql`UPDATE upsells SET active = ${fields.active} WHERE id = ${id}`;
    if (fields.sort_order !== undefined) await sql`UPDATE upsells SET sort_order = ${fields.sort_order} WHERE id = ${id}`;

    const updated = await sql`SELECT * FROM upsells WHERE id = ${id} LIMIT 1`;
    return NextResponse.json({ upsell: updated[0] });
  } catch (error) {
    console.error("Upsells PUT error:", error);
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

    await sql`DELETE FROM upsells WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upsells DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
