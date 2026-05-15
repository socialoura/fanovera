import { SUPPORTED_CURRENCIES, currencyDbColumn, type SupportedCurrency } from "./pricingCurrency";
import { calculatePromoPricing, type PromoPricing } from "./promoCodes";
import { applyPricingAssignment, type PricingAssignment } from "./pricingExperiments";
import { findFallbackPack, getProductConfig, normalizePlatform, type PlatformId } from "./productCatalog";

export type PricingRow = {
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
  active?: boolean;
};

export type CheckoutPricingInput = {
  platform: unknown;
  currency: unknown;
  cart: unknown;
  pricingRows?: PricingRow[];
  assignment?: PricingAssignment;
  promoCode?: unknown;
  allowTestPromo?: boolean;
};

export type SanitizedCheckoutItem = {
  service: string;
  platform: PlatformId;
  qty: number;
  bonus: number;
  country?: string;
  pageUrl?: string;
  pageHandle?: string;
  postUrl?: string;
  videoUrl?: string;
  videoId?: string;
  trackUrl?: string;
  trackId?: string;
};

export type CheckoutPricingResult = {
  amountCents: number;
  currency: SupportedCurrency;
  platform: PlatformId;
  service: string;
  plan: string;
  sanitizedCart: SanitizedCheckoutItem[];
  subtotalCents: number;
  discountCents: number;
  promo: PromoPricing;
};

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return NaN;
}

function normalizeCurrency(value: unknown): SupportedCurrency {
  const upper = typeof value === "string" ? value.toUpperCase() : "EUR";
  return SUPPORTED_CURRENCIES.includes(upper as SupportedCurrency) ? (upper as SupportedCurrency) : "EUR";
}

function pickRowPrice(row: PricingRow, currency: SupportedCurrency) {
  const key = currencyDbColumn(currency);
  const value = (row as Record<string, unknown>)[key];
  const selected = toNumber(value);
  if (Number.isFinite(selected) && selected > 0) return selected;
  const fallback = toNumber(row.price);
  return Number.isFinite(fallback) && fallback > 0 ? fallback : null;
}

function sanitizeText(value: unknown, maxLength = 240) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : undefined;
}

function normalizeCart(cart: unknown) {
  return Array.isArray(cart) ? cart : [];
}

function priceForQty(platform: PlatformId, service: string, qty: number, currency: SupportedCurrency, rows: PricingRow[]) {
  const dbRow = rows.find((row) => row.service === service && Number(row.qty) === qty && row.active !== false);
  if (dbRow) {
    const price = pickRowPrice(dbRow, currency);
    if (price !== null) return price;
  }

  const fallback = findFallbackPack(platform, qty);
  return fallback?.price ?? null;
}

export function calculateCheckoutPricing(input: CheckoutPricingInput): CheckoutPricingResult {
  const platform = normalizePlatform(input.platform);
  if (!platform) throw new Error("Unsupported platform");

  const config = getProductConfig(platform);
  const currency = normalizeCurrency(input.currency);
  const rows = input.pricingRows || [];
  const cart = normalizeCart(input.cart);
  if (cart.length === 0) throw new Error("Cart is required");

  let subtotalCents = 0;
  const sanitizedCart: SanitizedCheckoutItem[] = [];

  for (const rawItem of cart) {
    const item = rawItem && typeof rawItem === "object" ? (rawItem as Record<string, unknown>) : {};
    const qty = Math.trunc(toNumber(item.qty ?? item.quantity));
    if (!Number.isFinite(qty) || qty <= 0) throw new Error("Invalid cart quantity");

    const basePrice = priceForQty(platform, config.service, qty, currency, rows);
    if (basePrice === null) throw new Error("Unknown pricing pack");

    const adjustedPrice = input.assignment ? applyPricingAssignment(basePrice, input.assignment) : basePrice;
    subtotalCents += Math.round(adjustedPrice * 100);

    sanitizedCart.push({
      service: config.service,
      platform,
      qty,
      bonus: Math.max(0, Math.trunc(toNumber(item.bonus) || 0)),
      country: sanitizeText(item.country, 8),
      pageUrl: sanitizeText(item.pageUrl),
      pageHandle: sanitizeText(item.pageHandle, 80),
      postUrl: sanitizeText(item.postUrl),
      videoUrl: sanitizeText(item.videoUrl),
      videoId: sanitizeText(item.videoId, 80),
      trackUrl: sanitizeText(item.trackUrl),
      trackId: sanitizeText(item.trackId, 80),
    });
  }

  const promo = calculatePromoPricing({
    subtotalCents,
    promoCode: input.promoCode,
    allowTestPromo: input.allowTestPromo,
  });

  return {
    amountCents: promo.amountCents,
    currency,
    platform,
    service: config.service,
    plan: sanitizedCart.map((item) => String(item.qty)).join("+"),
    sanitizedCart,
    subtotalCents,
    discountCents: promo.discountCents,
    promo,
  };
}
