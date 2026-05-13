import { NextRequest, NextResponse } from "next/server";
import { SUPPORTED_LOCALES, type SupportedLocale } from "./app/i18n/types";
import { LOCALE_KEY, LOCALE_MODE_KEY } from "./app/i18n/locale";

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

  requestHeaders.set("x-fanovera-locale", req.cookies.get(LOCALE_KEY)?.value || "fr");
  requestHeaders.set("x-fanovera-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
