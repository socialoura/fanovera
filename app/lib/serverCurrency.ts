import { cookies, headers } from "next/headers";
import {
  mapCountryToCurrency,
  mapCountryToLocale,
  mapCurrencyToLocale,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "./pricingCurrency";

/**
 * Resolve the visitor's country at request time from the most trustworthy
 * signal available — same priority order as /api/geo-currency's pickCountry:
 *   1. Vercel edge geo header   2. Cloudflare geo header   3. Accept-Language
 */
function pickCountry(h: Headers): string {
  const fromVercel = h.get("x-vercel-ip-country");
  if (fromVercel) return fromVercel.toUpperCase();
  const fromCf = h.get("cf-ipcountry");
  if (fromCf) return fromCf.toUpperCase();
  const acceptLang = h.get("accept-language") || "";
  const regionMatch = acceptLang.match(/[a-z]{2,3}-([a-z]{2})\b/i);
  if (regionMatch && regionMatch[1]) return regionMatch[1].toUpperCase();
  return "";
}

/**
 * SSR-resolved currency + locale, used to SEED `useCurrencyPreference` so the
 * first paint already formats prices in the visitor's currency (e.g. £ for a
 * UK Google Ads visitor) instead of flashing the EUR/fr-FR default before the
 * client-side /api/geo-currency call resolves. Mirrors the API's logic minus
 * the searchParams override: a sticky "manual" currency cookie wins, otherwise
 * we map from the geo country.
 */
export async function resolveInitialCurrency(): Promise<{ currency: SupportedCurrency; locale: string }> {
  const [h, c] = await Promise.all([headers(), cookies()]);
  const cookieCurrency = (c.get("currency")?.value || "").toUpperCase();
  const cookieMode = c.get("currency_mode")?.value || "";

  if (cookieMode === "manual" && SUPPORTED_CURRENCIES.includes(cookieCurrency as SupportedCurrency)) {
    const currency = cookieCurrency as SupportedCurrency;
    return { currency, locale: mapCurrencyToLocale(currency) };
  }

  const country = pickCountry(h);
  return { currency: mapCountryToCurrency(country), locale: mapCountryToLocale(country) };
}
