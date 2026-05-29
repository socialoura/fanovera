import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { convertCentsToEur } from "@/app/lib/fxRates";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

function parseOverrideCents(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

// Maps (trigger_platform + trigger_service KIND) → the SMM service code stored
// in the base cart item. Mirror of UpsellsView.SERVICE_CODE — the upsell stores
// the kind ("followers") while orders.cart stores the code ("ig_followers"), so
// we need this to know which orders were *eligible* for a given upsell.
const SERVICE_CODE: Record<string, Record<string, string>> = {
  instagram: { followers: "ig_followers", likes: "ig_likes", views: "ig_views", reposts: "ig_reposts" },
  tiktok:    { followers: "tt_followers", likes: "tt_likes", views: "tt_views" },
  youtube:   { views: "yt_views", subscribers: "yt_subscribers" },
  spotify:   { streams: "sp_streams", followers: "sp_followers" },
  twitter:   { followers: "x_followers", likes: "x_likes", retweets: "x_retweets" },
  twitch:    { followers: "tw_followers", ai_viewers: "tw_live_viewers" },
  linkedin:  { followers: "li_followers" },
  facebook:  { followers: "fb_likes" },
};

// Same status set as the revenue analytics — an order counts as a completed
// purchase (and therefore an upsell impression at checkout) in all of these.
const PAID_STATUSES = ["paid", "processing", "delivered", "partial", "canceled"];

type UpsellRow = { id: number; trigger_platform: string | null; trigger_service: string | null; created_at?: string | Date | null };
type UpsellStat = { eligible: number; taken: number; attachRate: number | null; revenueCents: number };

/**
 * Per-upsell attach rate, computed retroactively from orders.cart (zero
 * tracking needed):
 *   - eligible = paid orders whose base (non-upsell) cart item matches the
 *     upsell's trigger (platform + service kind) → i.e. the upsell WAS offered.
 *   - taken    = paid orders whose cart contains this upsell (upsellId match).
 *   - attachRate = taken / eligible.
 *   - revenueCents = EUR-converted sum of the upsell line across taken orders.
 *
 * Note: denominator is *completed purchases*, not checkout impressions —
 * abandoned checkouts that saw the upsell aren't orders, so this is the
 * take-rate among buyers, not the raw UI conversion rate.
 */
async function computeUpsellStats(upsells: UpsellRow[]): Promise<Record<number, UpsellStat>> {
  const acc = new Map<number, { eligible: number; taken: number; revenueCents: number }>();
  const expectedCode = new Map<number, string | null>();
  // When each upsell was created. Orders placed before this couldn't have been
  // offered the upsell (it didn't exist yet), so they must not count toward the
  // eligible denominator — otherwise the attach rate is diluted by historical
  // orders that never saw the offer.
  const createdMs = new Map<number, number>();
  for (const u of upsells) {
    acc.set(u.id, { eligible: 0, taken: 0, revenueCents: 0 });
    expectedCode.set(u.id, (u.trigger_platform && u.trigger_service)
      ? (SERVICE_CODE[u.trigger_platform]?.[u.trigger_service] || null)
      : null);
    const t = u.created_at ? new Date(u.created_at).getTime() : 0;
    createdMs.set(u.id, Number.isFinite(t) ? t : 0);
  }

  const orders = await sql`
    SELECT id, platform, cart, currency, created_at
    FROM orders
    WHERE status = ANY(${PAID_STATUSES})
  ` as Array<{ id: number; platform: string | null; cart: unknown; currency: string | null; created_at: string | Date | null }>;

  for (const o of orders) {
    const orderMs = o.created_at ? new Date(o.created_at).getTime() : 0;
    const cart = Array.isArray(o.cart) ? (o.cart as Array<Record<string, unknown>>) : [];
    const baseCodes = new Set<string>();
    const takenCents = new Map<number, number>(); // upsellId → summed priceCents
    for (const item of cart) {
      if (!item || typeof item !== "object") continue;
      if (item.upsell === true) {
        const id = Number(item.upsellId);
        if (Number.isFinite(id)) takenCents.set(id, (takenCents.get(id) || 0) + (Number(item.priceCents) || 0));
      } else if (item.service) {
        baseCodes.add(String(item.service));
      }
    }

    for (const u of upsells) {
      const s = acc.get(u.id)!;
      const took = takenCents.has(u.id);
      const exp = expectedCode.get(u.id);
      const baseMatch = Boolean(exp) && o.platform === u.trigger_platform && baseCodes.has(exp as string);
      // Only count as eligible if the order was placed after the upsell existed
      // — pre-creation orders never saw the offer. (A taken order is post-creation
      // by definition, so the `took` union below stays consistent.)
      const offered = baseMatch && orderMs >= (createdMs.get(u.id) || 0);
      // Union with `took` so taken ⊆ eligible even if the base item is missing
      // (legacy carts) — attachRate then never exceeds 100%.
      if (took || offered) s.eligible++;
      if (took) {
        s.taken++;
        s.revenueCents += await convertCentsToEur(takenCents.get(u.id) || 0, o.currency || "EUR");
      }
    }
  }

  const out: Record<number, UpsellStat> = {};
  for (const u of upsells) {
    const s = acc.get(u.id)!;
    out[u.id] = {
      eligible: s.eligible,
      taken: s.taken,
      attachRate: s.eligible > 0 ? s.taken / s.eligible : null,
      revenueCents: Math.round(s.revenueCents),
    };
  }
  return out;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const upsells = await sql`SELECT * FROM upsells ORDER BY sort_order, id`;
    const stats = await computeUpsellStats(upsells as UpsellRow[]);
    return NextResponse.json({ upsells, stats });
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
