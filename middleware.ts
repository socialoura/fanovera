import { NextRequest, NextResponse } from "next/server";
import { SUPPORTED_LOCALES, type SupportedLocale } from "./app/i18n/types";
import { LOCALE_KEY, LOCALE_MODE_KEY, normalizeLocale } from "./app/i18n/locale";

function localeFromPath(pathname: string): { locale: SupportedLocale | null; rest: string } {
  const [, firstSegment, ...rest] = pathname.split("/");
  if (SUPPORTED_LOCALES.includes(firstSegment as SupportedLocale)) {
    return {
      locale: firstSegment as SupportedLocale,
      rest: `/${rest.join("/")}`.replace(/\/$/, "") || "/",
    };
  }
  return { locale: null, rest: pathname };
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const { locale, rest } = localeFromPath(pathname);
  const queryLocale = normalizeLocale(req.nextUrl.searchParams.get("lang"));
  const requestHeaders = new Headers(req.headers);

  if (locale) {
    requestHeaders.set("x-fanovera-locale", locale);
    requestHeaders.set("x-fanovera-pathname", rest);

    const url = req.nextUrl.clone();
    url.pathname = rest;

    const response = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    response.cookies.set(LOCALE_KEY, locale, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 180 });
    response.cookies.set(LOCALE_MODE_KEY, "manual", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 180 });
    return response;
  }

  const cookieLocale = normalizeLocale(req.cookies.get(LOCALE_KEY)?.value);
  const resolvedLocale = queryLocale || cookieLocale || "fr";

  requestHeaders.set("x-fanovera-locale", resolvedLocale);
  requestHeaders.set("x-fanovera-pathname", pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (queryLocale) {
    response.cookies.set(LOCALE_KEY, queryLocale, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 180 });
    response.cookies.set(LOCALE_MODE_KEY, "manual", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 180 });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
