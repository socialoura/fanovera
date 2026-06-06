import { sql } from "./db";
import { buildCurrencyFormatter, currencyDbColumn, type SupportedCurrency } from "./pricingCurrency";
import { NETWORKS, NET_META, PROMO_NETWORK_SERVICES, type NetworkId } from "./networks";

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
}

/**
 * SSR the "from £X" promo anchor per network — the cheapest active pack price
 * across each network's promo services, in the visitor's currency, pre-formatted.
 *
 * Used to seed the Hero on first paint so it shows the REAL price immediately
 * instead of the hardcoded NET_META EUR fallback (which, rendered with a £ sign
 * before the client pricing loads, produced a visible "£1.49 → £1.50" flicker).
 * Reads the same raw DB currency column the client min uses, so the SSR value
 * and the post-hydration client value are identical → no flash, no mismatch.
 */
export async function loadPromoNetworkMinPriceLabels(
  currency: SupportedCurrency,
  locale: string,
): Promise<Record<NetworkId, string>> {
  const formatter = buildCurrencyFormatter(currency, locale);
  const column = currencyDbColumn(currency);
  const services = Array.from(new Set(Object.values(PROMO_NETWORK_SERVICES).flat()));

  const minByService = new Map<string, number>();
  try {
    const rows = (await sql`
      SELECT service, price, price_usd, price_gbp, price_brl, price_try, price_cad,
             price_aud, price_chf, price_mxn, price_sek
      FROM pricing
      WHERE service = ANY(${services}) AND active = true
    `) as Array<Record<string, unknown>>;

    for (const row of rows) {
      let price = toNum(row[column]);
      if (!(Number.isFinite(price) && price > 0)) price = toNum(row.price);
      if (!(Number.isFinite(price) && price > 0)) continue;
      const service = String(row.service);
      const current = minByService.get(service);
      if (current === undefined || price < current) minByService.set(service, price);
    }
  } catch (error) {
    // On any DB hiccup, fall back to the NET_META anchors below — the client
    // still corrects to the real price once it loads.
    console.error("loadPromoNetworkMinPriceLabels error:", error);
  }

  const result = {} as Record<NetworkId, string>;
  for (const network of NETWORKS) {
    const mins = PROMO_NETWORK_SERVICES[network.id]
      .map((service) => minByService.get(service))
      .filter((n): n is number => typeof n === "number");
    const min = mins.length > 0 ? Math.min(...mins) : NET_META[network.id].minPriceEur;
    result[network.id] = formatter.format(min);
  }
  return result;
}
