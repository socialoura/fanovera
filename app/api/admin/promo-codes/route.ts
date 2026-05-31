import { NextRequest, NextResponse } from "next/server";
import { sql, ensurePromoCodesSchema } from "@/app/lib/db";
import { normalizePromoCode } from "@/app/lib/promoCodes";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

// Codes handled by the hardcoded resolver in promoCodes.ts (FANO5 + lifecycle
// email codes + the test code). Admins can't create table rows that shadow these
// — they'd be resolved twice with conflicting semantics.
const RESERVED_CODES = new Set([
  "FANO5",
  "FANO10",
  "FANO15",
  "FANO20",
  "FANO25",
  "FANO30",
  "FANOTEST50",
]);

type DiscountType = "percent" | "fixed";

/** Validates + normalizes a discount type/value pair. Throws on invalid input. */
function parseDiscount(rawType: unknown, rawValue: unknown): { type: DiscountType; value: number } {
  const type: DiscountType = rawType === "fixed" ? "fixed" : "percent";
  const value = Math.round(Number(rawValue));
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("discount_value must be a positive number");
  }
  if (type === "percent" && value > 100) {
    throw new Error("percent discount cannot exceed 100");
  }
  return { type, value };
}

/** "" / null / invalid → null (no cap). Otherwise a positive integer. */
function parseMaxUses(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** "" / null / invalid → null (no expiry). Otherwise an ISO timestamp string. */
function parseExpiry(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const d = new Date(String(raw));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    await ensurePromoCodesSchema();
    const codes = await sql`SELECT * FROM promo_codes ORDER BY created_at DESC, id DESC`;
    return NextResponse.json({ codes });
  } catch (error) {
    console.error("Promo codes GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    await ensurePromoCodesSchema();
    const body = await req.json();

    const code = normalizePromoCode(body.code);
    if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });
    if (code.length > 40) return NextResponse.json({ error: "code too long (max 40)" }, { status: 400 });
    if (RESERVED_CODES.has(code)) {
      return NextResponse.json({ error: `"${code}" est un code réservé. Choisis un autre code.` }, { status: 409 });
    }

    let discount: { type: DiscountType; value: number };
    try {
      discount = parseDiscount(body.discount_type, body.discount_value);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "invalid discount" }, { status: 400 });
    }

    const maxUses = parseMaxUses(body.max_uses);
    const expiresAt = parseExpiry(body.expires_at);
    const active = body.active !== false;

    const existing = await sql`SELECT id FROM promo_codes WHERE code = ${code} LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json({ error: `Le code "${code}" existe déjà.` }, { status: 409 });
    }

    const result = await sql`
      INSERT INTO promo_codes (code, discount_type, discount_value, max_uses, active, expires_at)
      VALUES (${code}, ${discount.type}, ${discount.value}, ${maxUses}, ${active}, ${expiresAt})
      RETURNING *
    `;
    return NextResponse.json({ code: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Promo codes POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    await ensurePromoCodesSchema();
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // discount_type + discount_value are validated together (a fixed value of
    // 150 means €1.50 but a percent value of 150 is invalid), so when either is
    // present we re-validate the pair against the stored row.
    if (body.discount_type !== undefined || body.discount_value !== undefined) {
      const current = await sql`SELECT discount_type, discount_value FROM promo_codes WHERE id = ${id} LIMIT 1`;
      if (current.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
      const type = body.discount_type !== undefined ? body.discount_type : current[0].discount_type;
      const value = body.discount_value !== undefined ? body.discount_value : current[0].discount_value;
      let discount: { type: DiscountType; value: number };
      try {
        discount = parseDiscount(type, value);
      } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "invalid discount" }, { status: 400 });
      }
      await sql`UPDATE promo_codes SET discount_type = ${discount.type}, discount_value = ${discount.value} WHERE id = ${id}`;
    }

    if (body.active !== undefined) {
      await sql`UPDATE promo_codes SET active = ${Boolean(body.active)} WHERE id = ${id}`;
    }
    if (body.max_uses !== undefined) {
      await sql`UPDATE promo_codes SET max_uses = ${parseMaxUses(body.max_uses)} WHERE id = ${id}`;
    }
    if (body.expires_at !== undefined) {
      await sql`UPDATE promo_codes SET expires_at = ${parseExpiry(body.expires_at)} WHERE id = ${id}`;
    }
    // Explicit usage-counter reset (e.g. re-running a campaign on the same code).
    if (body.reset_used_count === true) {
      await sql`UPDATE promo_codes SET used_count = 0 WHERE id = ${id}`;
    }

    const updated = await sql`SELECT * FROM promo_codes WHERE id = ${id} LIMIT 1`;
    if (updated.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ code: updated[0] });
  } catch (error) {
    console.error("Promo codes PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    await ensurePromoCodesSchema();
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await sql`DELETE FROM promo_codes WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Promo codes DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
