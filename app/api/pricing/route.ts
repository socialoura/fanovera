import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { currencyDbColumn, SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/app/lib/pricingCurrency";

type Row = {
  id: number;
  service: string;
  qty: number;
  price: string | number;
  price_usd?: string | number;
  price_gbp?: string | number;
  price_brl?: string | number;
  price_try?: string | number;
  price_cad?: string | number;
  price_aud?: string | number;
  price_chf?: string | number;
  price_mxn?: string | number;
  price_sek?: string | number;
  popular?: boolean;
  active: boolean;
};

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
}

function pickPrice(row: Row, currency: SupportedCurrency): number {
  const key = currencyDbColumn(currency);
  const candidate = (row as Record<string, unknown>)[key];
  const fallback = row.price;
  const n = toNum(candidate);
  if (Number.isFinite(n) && n > 0) return n;
  return toNum(fallback);
}

const SERVICE_FALLBACKS: Record<string, string> = {
  ig_followers: "followers",
  tt_followers: "followers",
  ig_likes: "likes",
  tt_likes: "likes",
  ig_views: "views",
  tt_views: "views",
};

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const service = (sp.get("service") || "").trim();
    const currency = ((sp.get("currency") || "EUR").toUpperCase()) as SupportedCurrency;

    const effectiveCurrency: SupportedCurrency = SUPPORTED_CURRENCIES.includes(currency)
      ? currency
      : "EUR";

    if (!service) {
      return NextResponse.json({ error: "service required" }, { status: 400 });
    }

    let rows = await sql`
      SELECT * FROM pricing
      WHERE service = ${service} AND active = true
      ORDER BY qty ASC
    `;

    const fallbackService = SERVICE_FALLBACKS[service];
    if (rows.length === 0 && fallbackService) {
      rows = await sql`
        SELECT * FROM pricing
        WHERE service = ${fallbackService} AND active = true
        ORDER BY qty ASC
      `;
    }

    const packs = (rows as Row[]).map((r) => ({
      id: r.id,
      qty: r.qty,
      price: pickPrice(r, effectiveCurrency),
      popular: Boolean(r.popular),
    }));

    return NextResponse.json({
      service,
      currency: effectiveCurrency,
      packs,
    });
  } catch (err) {
    console.error("[pricing]", err);
    return NextResponse.json({ error: "Failed to load pricing" }, { status: 500 });
  }
}
