import { NextRequest, NextResponse } from "next/server";
import {
  LOCALE_KEY,
  LOCALE_MODE_KEY,
  isSupportedLocale,
  resolveLocale,
} from "@/app/i18n/locale";
import type { SupportedLocale } from "@/app/i18n/types";

function pickCountry(req: NextRequest): string {
  return req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "";
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const override = (sp.get("locale") || "").toLowerCase();
  const mode = sp.get("mode") || "";
  const browser = sp.get("browser") || req.headers.get("accept-language") || "";
  const cookieMode = req.cookies.get(LOCALE_MODE_KEY)?.value || "";
  const cookieLocale = (req.cookies.get(LOCALE_KEY)?.value || "").toLowerCase();
  const country = pickCountry(req);

  const manualCandidate =
    isSupportedLocale(override) ? override : isSupportedLocale(cookieLocale) ? cookieLocale : null;
  const manualMode = Boolean(override) || (cookieMode === "manual" && mode !== "auto");

  const resolved = resolveLocale({
    manual: manualCandidate,
    mode: manualMode ? "manual" : "auto",
    country,
    acceptLanguage: browser,
  });

  const locale: SupportedLocale = resolved.locale;
  const responseMode = manualMode && manualCandidate ? "manual" : "auto";
  const res = NextResponse.json({
    locale,
    country: country || null,
    mode: responseMode,
    source: resolved.source,
  });

  res.cookies.set(LOCALE_MODE_KEY, responseMode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
    sameSite: "lax",
  });
  res.cookies.set(LOCALE_KEY, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
    sameSite: "lax",
  });

  return res;
}
