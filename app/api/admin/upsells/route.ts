import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

function parseOverrideCents(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const upsells = await sql`SELECT * FROM upsells ORDER BY sort_order, id`;
    return NextResponse.json({ upsells });
  } catch (error) {
    console.error("Upsells GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const { service, qty, label, label_en, active, sort_order, price_cents, trigger_platform, trigger_service, prices_by_currency } = body;

    if (!service || !qty) {
      return NextResponse.json({ error: "service and qty are required" }, { status: 400 });
    }

    const overrides = (prices_by_currency && typeof prices_by_currency === "object") ? prices_by_currency : {};
    const result = await sql`
      INSERT INTO upsells (
        service, qty, label, label_en, active, sort_order, price_cents,
        trigger_platform, trigger_service,
        price_cents_usd, price_cents_gbp, price_cents_brl, price_cents_try,
        price_cents_cad, price_cents_aud, price_cents_chf, price_cents_mxn, price_cents_sek
      )
      VALUES (
        ${service},
        ${qty},
        ${label || ""},
        ${label_en || ""},
        ${active !== false},
        ${sort_order || 0},
        ${Math.max(0, Math.round(Number(price_cents) || 0))},
        ${trigger_platform || null},
        ${trigger_service || null},
        ${parseOverrideCents(overrides.USD)},
        ${parseOverrideCents(overrides.GBP)},
        ${parseOverrideCents(overrides.BRL)},
        ${parseOverrideCents(overrides.TRY)},
        ${parseOverrideCents(overrides.CAD)},
        ${parseOverrideCents(overrides.AUD)},
        ${parseOverrideCents(overrides.CHF)},
        ${parseOverrideCents(overrides.MXN)},
        ${parseOverrideCents(overrides.SEK)}
      )
      RETURNING *
    `;

    return NextResponse.json({ upsell: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Upsells POST error:", error);
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

    if (fields.service !== undefined) await sql`UPDATE upsells SET service = ${fields.service} WHERE id = ${id}`;
    if (fields.qty !== undefined) await sql`UPDATE upsells SET qty = ${fields.qty} WHERE id = ${id}`;
    if (fields.label !== undefined) await sql`UPDATE upsells SET label = ${fields.label} WHERE id = ${id}`;
    if (fields.label_en !== undefined) await sql`UPDATE upsells SET label_en = ${fields.label_en} WHERE id = ${id}`;
    if (fields.active !== undefined) await sql`UPDATE upsells SET active = ${fields.active} WHERE id = ${id}`;
    if (fields.sort_order !== undefined) await sql`UPDATE upsells SET sort_order = ${fields.sort_order} WHERE id = ${id}`;
    if (fields.price_cents !== undefined) {
      const cents = Math.max(0, Math.round(Number(fields.price_cents) || 0));
      await sql`UPDATE upsells SET price_cents = ${cents} WHERE id = ${id}`;
    }
    if (fields.trigger_platform !== undefined) await sql`UPDATE upsells SET trigger_platform = ${fields.trigger_platform || null} WHERE id = ${id}`;
    if (fields.trigger_service !== undefined) await sql`UPDATE upsells SET trigger_service = ${fields.trigger_service || null} WHERE id = ${id}`;
    if (fields.prices_by_currency && typeof fields.prices_by_currency === "object") {
      const o = fields.prices_by_currency as Record<string, unknown>;
      if ("USD" in o) await sql`UPDATE upsells SET price_cents_usd = ${parseOverrideCents(o.USD)} WHERE id = ${id}`;
      if ("GBP" in o) await sql`UPDATE upsells SET price_cents_gbp = ${parseOverrideCents(o.GBP)} WHERE id = ${id}`;
      if ("BRL" in o) await sql`UPDATE upsells SET price_cents_brl = ${parseOverrideCents(o.BRL)} WHERE id = ${id}`;
      if ("TRY" in o) await sql`UPDATE upsells SET price_cents_try = ${parseOverrideCents(o.TRY)} WHERE id = ${id}`;
      if ("CAD" in o) await sql`UPDATE upsells SET price_cents_cad = ${parseOverrideCents(o.CAD)} WHERE id = ${id}`;
      if ("AUD" in o) await sql`UPDATE upsells SET price_cents_aud = ${parseOverrideCents(o.AUD)} WHERE id = ${id}`;
      if ("CHF" in o) await sql`UPDATE upsells SET price_cents_chf = ${parseOverrideCents(o.CHF)} WHERE id = ${id}`;
      if ("MXN" in o) await sql`UPDATE upsells SET price_cents_mxn = ${parseOverrideCents(o.MXN)} WHERE id = ${id}`;
      if ("SEK" in o) await sql`UPDATE upsells SET price_cents_sek = ${parseOverrideCents(o.SEK)} WHERE id = ${id}`;
    }

    const updated = await sql`SELECT * FROM upsells WHERE id = ${id} LIMIT 1`;
    return NextResponse.json({ upsell: updated[0] });
  } catch (error) {
    console.error("Upsells PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    await sql`DELETE FROM upsells WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upsells DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
