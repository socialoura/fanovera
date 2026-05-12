import { NextRequest, NextResponse } from "next/server";
import {
  mapCountryToCurrency,
  mapCurrencyToLocale,
  mapCountryToLocale,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/app/lib/pricingCurrency";

function pickCountry(req: NextRequest): string {
  const fromVercel = req.headers.get("x-vercel-ip-country");
  if (fromVercel) return fromVercel;
  const fromCf = req.headers.get("cf-ipcountry");
  if (fromCf) return fromCf;
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
