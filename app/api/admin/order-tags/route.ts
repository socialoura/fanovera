import { NextRequest, NextResponse } from "next/server";
import { sql, ensureOrderTagsSchema } from "@/app/lib/db";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

// Admin-only catalog of predefined order tags ("Compte privé", "Compte indispo"…).
// The Orders view toggles these labels on individual orders (orders.admin_tags).

const ALLOWED_COLORS = ["amber", "violet", "red", "green", "blue", "ink"] as const;

function normalizeColor(value: unknown): string {
  const c = String(value || "").toLowerCase();
  return (ALLOWED_COLORS as readonly string[]).includes(c) ? c : "amber";
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    await ensureOrderTagsSchema();
    const tags = await sql`SELECT id, label, color, sort_order FROM order_tags ORDER BY sort_order, id`;
    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Order-tags GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    await ensureOrderTagsSchema();
    const body = await req.json();
    const label = String(body?.label || "").trim();
    if (!label) return NextResponse.json({ error: "label is required" }, { status: 400 });
    if (label.length > 80) return NextResponse.json({ error: "label too long (max 80)" }, { status: 400 });

    const color = normalizeColor(body?.color);
    const sortOrder = Number.isFinite(Number(body?.sort_order)) ? Math.round(Number(body.sort_order)) : 100;

    const result = await sql`
      INSERT INTO order_tags (label, color, sort_order)
      VALUES (${label}, ${color}, ${sortOrder})
      ON CONFLICT (label) DO NOTHING
      RETURNING id, label, color, sort_order
    `;
    if (result.length === 0) {
      return NextResponse.json({ error: "Ce libellé existe déjà." }, { status: 409 });
    }
    return NextResponse.json({ tag: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Order-tags POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    await ensureOrderTagsSchema();
    const body = await req.json();
    const id = Number(body?.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (body.label !== undefined) {
      const label = String(body.label || "").trim();
      if (!label) return NextResponse.json({ error: "label cannot be empty" }, { status: 400 });
      if (label.length > 80) return NextResponse.json({ error: "label too long (max 80)" }, { status: 400 });
      await sql`UPDATE order_tags SET label = ${label} WHERE id = ${id}`;
    }
    if (body.color !== undefined) {
      await sql`UPDATE order_tags SET color = ${normalizeColor(body.color)} WHERE id = ${id}`;
    }
    if (body.sort_order !== undefined) {
      await sql`UPDATE order_tags SET sort_order = ${Math.round(Number(body.sort_order) || 0)} WHERE id = ${id}`;
    }

    const updated = await sql`SELECT id, label, color, sort_order FROM order_tags WHERE id = ${id} LIMIT 1`;
    if (updated.length === 0) return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    return NextResponse.json({ tag: updated[0] });
  } catch (error) {
    console.error("Order-tags PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    await ensureOrderTagsSchema();
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    // Detaching the label from existing orders would require scanning every
    // order's JSONB array — not worth it. Orders keep the label string they
    // already carry; it simply drops off the catalog so it can't be re-applied.
    const result = await sql`DELETE FROM order_tags WHERE id = ${id} RETURNING id`;
    if (result.length === 0) return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    return NextResponse.json({ deleted: result[0].id });
  } catch (error) {
    console.error("Order-tags DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
