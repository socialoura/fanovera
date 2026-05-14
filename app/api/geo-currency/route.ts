import { NextRequest, NextResponse } from "next/server";
import {
  mapCountryToCurrency,
  mapCurrencyToLocale,
  mapCountryToLocale,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/app/lib/pricingCurrency";

/**
 * Resolve the user's country from the most-trustworthy signal available.
 * Priority order:
 *
 *   1. Vercel edge geo header (set on every Vercel-hosted request)
 *   2. Cloudflare geo header (when fronted by CF)
 *   3. `Accept-Language` region tag (e.g. `en-GB,en;q=0.9` → "GB")
 *
 * The Accept-Language fallback exists for local dev and self-hosted edge
 * runtimes where neither Vercel nor CF inject a country. It is the weakest
 * signal — users routinely have a locale that mismatches their physical
 * location — so it never overrides the IP-based ones above.
 */
function pickCountry(req: NextRequest): string {
  const fromVercel = req.headers.get("x-vercel-ip-country");
  if (fromVercel) return fromVercel.toUpperCase();
  const fromCf = req.headers.get("cf-ipcountry");
  if (fromCf) return fromCf.toUpperCase();

  const acceptLang = req.headers.get("accept-language") || "";
  // Match the first `xx-YY` tag in the header. Example inputs:
  //   "fr-FR,fr;q=0.9,en;q=0.8" → "FR"
  //   "en-GB,en;q=0.9" → "GB"
  //   "de" → "" (no region info)
  const regionMatch = acceptLang.match(/[a-z]{2,3}-([a-z]{2})\b/i);
  if (regionMatch && regionMatch[1]) return regionMatch[1].toUpperCase();

  return "";
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const override = (sp.get("currency") || "").toUpperCase();
  const mode = sp.get("mode") || "";
  const cookieCurrency = (req.cookies.get("currency")?.value || "").toUpperCase();
  const cookieMode = req.cookies.get("currency_mode")?.value || "";

  let currency: SupportedCurrency;
  const country = pickCountry(req);

  if (SUPPORTED_CURRENCIES.includes(override as SupportedCurrency)) {
    currency = override as SupportedCurrency;
  } else if (mode !== "auto" && cookieMode === "manual" && SUPPORTED_CURRENCIES.includes(cookieCurrency as SupportedCurrency)) {
    currency = cookieCurrency as SupportedCurrency;
  } else {
    currency = mapCountryToCurrency(country);
  }

  const locale = override || (cookieMode === "manual" && mode !== "auto")
    ? mapCurrencyToLocale(currency)
    : mapCountryToLocale(country);

  const res = NextResponse.json({
    currency,
    country: country || null,
    locale,
    mode: override || (cookieMode === "manual" && mode !== "auto") ? "manual" : "auto",
  });

  res.cookies.set("currency", currency, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  res.cookies.set("currency_mode", override || (cookieMode === "manual" && mode !== "auto") ? "manual" : "auto", {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });

  return res;
}
