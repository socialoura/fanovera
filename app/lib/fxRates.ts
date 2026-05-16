// USD-based FX rates fetched from frankfurter.app, cached 24h in-memory.
// Used to convert BulkFollows USD charges → client currency at write time,
// and client currency → EUR at admin display time.

import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "./pricingCurrency";

// Hardcoded fallback if frankfurter is down. Updated 2025 — refresh occasionally.
const FALLBACK_USD_RATES: Record<SupportedCurrency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  BRL: 5.20,
  TRY: 34.0,
  CAD: 1.37,
  AUD: 1.52,
  CHF: 0.88,
  MXN: 18.5,
  SEK: 10.6,
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let cache: { rates: Record<string, number>; fetchedAt: number } | null = null;
let inflight: Promise<Record<string, number>> | null = null;

async function fetchUsdRates(): Promise<Record<string, number>> {
  const symbols = SUPPORTED_CURRENCIES.filter((c) => c !== "USD").join(",");
  const url = `https://api.frankfurter.app/latest?from=USD&to=${symbols}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`frankfurter HTTP ${res.status}`);
    const data = (await res.json()) as { rates?: Record<string, number> };
    if (!data.rates || typeof data.rates !== "object") {
      throw new Error("frankfurter: missing rates");
    }
    return { USD: 1, ...data.rates };
  } catch (err) {
    console.warn("[fxRates] frankfurter fetch failed, using fallback:", err);
    return { ...FALLBACK_USD_RATES };
  }
}

async function getRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates;
  }
  if (inflight) return inflight;
  inflight = fetchUsdRates()
    .then((rates) => {
      cache = { rates, fetchedAt: Date.now() };
      return rates;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function normalizeCurrency(currency: string | null | undefined): string {
  return (currency || "USD").toUpperCase();
}

/** 1 USD = X target currency. */
export async function getUsdToCurrencyRate(targetCurrency: string): Promise<number> {
  const target = normalizeCurrency(targetCurrency);
  if (target === "USD") return 1;
  const rates = await getRates();
  return rates[target] ?? FALLBACK_USD_RATES[target as SupportedCurrency] ?? 1;
}

/** Convert a USD amount to target currency. */
export async function convertUsdTo(amountUsd: number, targetCurrency: string): Promise<number> {
  const rate = await getUsdToCurrencyRate(targetCurrency);
  return amountUsd * rate;
}

/** Convert from any supported currency to EUR. */
export async function convertToEur(amount: number, fromCurrency: string): Promise<number> {
  const from = normalizeCurrency(fromCurrency);
  if (from === "EUR") return amount;
  const rates = await getRates();
  const fromRate = rates[from] ?? FALLBACK_USD_RATES[from as SupportedCurrency] ?? 1;
  const eurRate = rates.EUR ?? FALLBACK_USD_RATES.EUR;
  // amount is in `from` currency. 1 from = 1/fromRate USD = eurRate/fromRate EUR
  return amount * (eurRate / fromRate);
}

/** Convert cents in source currency → cents in EUR (rounded). */
export async function convertCentsToEur(amountCents: number, fromCurrency: string): Promise<number> {
  const eur = await convertToEur(amountCents / 100, fromCurrency);
  return Math.round(eur * 100);
}
