import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    const sp = req.nextUrl.searchParams;
    const days = Math.max(1, Math.min(365, Number(sp.get("days")) || 30));
    const rows = await sql`
      SELECT date::text AS date, cost_cents, note
      FROM ad_costs
      WHERE date >= CURRENT_DATE - (${days}::int * INTERVAL '1 day')
      ORDER BY date DESC
    `;
    return NextResponse.json({ entries: rows });
  } catch (err) {
    console.error("[admin/ad-costs] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/ad-costs
// Body: { date: "YYYY-MM-DD", costCents: number, note?: string }
// Upserts a daily entry (one row per date thanks to UNIQUE constraint).
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    const body = await req.json();
    const date = String(body?.date || "").trim();
    if (!ISO_DATE.test(date)) {
      return NextResponse.json({ error: "Invalid date (expected YYYY-MM-DD)" }, { status: 400 });
    }
    const rawCost = Number(body?.costCents);
    if (!Number.isFinite(rawCost) || rawCost < 0) {
      return NextResponse.json({ error: "costCents must be a non-negative number" }, { status: 400 });
    }
    const costCents = Math.round(rawCost);
    const note = typeof body?.note === "string" ? body.note.trim().slice(0, 255) : "";

    await sql`
      INSERT INTO ad_costs (date, cost_cents, note)
      VALUES (${date}::date, ${costCents}, ${note})
      ON CONFLICT (date) DO UPDATE
        SET cost_cents = EXCLUDED.cost_cents,
            note = EXCLUDED.note
    `;
    const updated = await sql`SELECT date::text AS date, cost_cents, note FROM ad_costs WHERE date = ${date}::date LIMIT 1`;
    return NextResponse.json({ entry: updated[0] });
  } catch (err) {
    console.error("[admin/ad-costs] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/ad-costs?date=YYYY-MM-DD
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    const date = req.nextUrl.searchParams.get("date") || "";
    if (!ISO_DATE.test(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const result = await sql`DELETE FROM ad_costs WHERE date = ${date}::date RETURNING date::text AS date`;
    if (result.length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    return NextResponse.json({ deleted: result[0].date });
  } catch (err) {
    console.error("[admin/ad-costs] DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
