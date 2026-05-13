import { sql } from "@/app/lib/db";
import { currencyDbColumn, SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/app/lib/pricingCurrency";
import { PRODUCT_CATALOG } from "@/app/lib/productCatalog";

export type PricingPackRow = {
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
  sort_order?: number | null;
};

export type ApiPricingPack = {
  id: number;
  qty: number;
  price: number;
  popular: boolean;
};

const SERVICE_FALLBACKS: Record<string, string> = {
  ig_followers: "followers",
  tt_followers: "followers",
  ig_likes: "likes",
  tt_likes: "likes",
  ig_views: "views",
  tt_views: "views",
};

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
}

function pickPrice(row: PricingPackRow, currency: SupportedCurrency): number {
  const key = currencyDbColumn(currency);
  const candidate = (row as Record<string, unknown>)[key];
  const fallback = row.price;
  const n = toNum(candidate);
  if (Number.isFinite(n) && n > 0) return n;
  return toNum(fallback);
}

export function normalizePricingCurrency(value: string | null | undefined): SupportedCurrency {
  const currency = ((value || "EUR").toUpperCase()) as SupportedCurrency;
  return SUPPORTED_CURRENCIES.includes(currency) ? currency : "EUR";
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

export async function loadPricingPacksForService(service: string, currency: SupportedCurrency): Promise<ApiPricingPack[]> {
  await ensurePricingSortOrder();

  let rows = await sql`
    SELECT * FROM pricing
    WHERE service = ${service} AND active = true
    ORDER BY sort_order ASC, qty ASC
  `;

  const fallbackService = SERVICE_FALLBACKS[service];
  if (rows.length === 0 && fallbackService) {
    rows = await sql`
      SELECT * FROM pricing
      WHERE service = ${fallbackService} AND active = true
      ORDER BY sort_order ASC, qty ASC
    `;
  }

  return (rows as PricingPackRow[]).map((row) => ({
    id: row.id,
    qty: row.qty,
    price: pickPrice(row, currency),
    popular: Boolean(row.popular),
  }));
}

export async function loadAllProductPricing(currency: SupportedCurrency) {
  const entries = await Promise.all(
    Object.values(PRODUCT_CATALOG).map(async ({ service }) => [
      service,
      await loadPricingPacksForService(service, currency),
    ] as const),
  );

  return Object.fromEntries(entries);
}
