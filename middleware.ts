import { NextRequest, NextResponse } from "next/server";
import { SUPPORTED_LOCALES, type SupportedLocale } from "./app/i18n/types";
import { LOCALE_KEY, LOCALE_MODE_KEY, normalizeLocale } from "./app/i18n/locale";
import { PROMO_FLOW_COOKIE } from "./app/lib/promoFlow";
import { CHECKOUT_FLOW_COOKIE } from "./app/lib/checkoutFlow";

// Assign a sticky 50/50 A/B bucket cookie on /promo so the SSR page can render
// the matching layout with no post-hydration flash. The cookie is just a stable
// bucket — whether it's honoured is decided by the admin-controlled mode (DB)
// read on the page (off → control, ab → this bucket, force_username → variant).
// Assigning it always (even when the experiment is off) keeps buckets stable so
// flipping the admin toggle to "ab" doesn't re-randomise existing visitors.
function maybeAssignPromoFlow(req: NextRequest, res: NextResponse, effectivePath: string) {
  if (effectivePath !== "/promo") return;
  if (req.cookies.get(PROMO_FLOW_COOKIE)) return;
  const variant = Math.random() < 0.5 ? "username_first" : "control";
  res.cookies.set(PROMO_FLOW_COOKIE, variant, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 180,
  });
}

// Sticky 50/50 bucket for the Instagram merged-checkout A/B, assigned on the
// product page. Same pattern as the promo flow: always assigned (even when the
// experiment is off) so flipping the admin toggle to "ab" doesn't re-randomise
// existing visitors. Whether it's honoured is decided by the admin mode (DB).
function maybeAssignCheckoutFlow(req: NextRequest, res: NextResponse, effectivePath: string) {
  if (effectivePath !== "/instagram-old") return;
  if (req.cookies.get(CHECKOUT_FLOW_COOKIE)) return;
  const variant = Math.random() < 0.5 ? "merged" : "control";
  res.cookies.set(CHECKOUT_FLOW_COOKIE, variant, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 180,
  });
}

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

  // Permanent redirects: the 4-step flows used to live at /tiktok-2 and
  // /instagram-2 (and customers were sent there); they are now the canonical
  // /tiktok and /instagram, so keep those existing links working by landing them
  // on the same page. Preserves query (?u=, ?product=, …) and the locale prefix.
  const effectiveRest = locale ? rest : pathname;
  if (effectiveRest === "/tiktok-2") {
    const url = req.nextUrl.clone();
    url.pathname = locale ? `/${locale}/tiktok` : "/tiktok";
    return NextResponse.redirect(url, 301);
  }
  if (effectiveRest === "/instagram-2") {
    const url = req.nextUrl.clone();
    url.pathname = locale ? `/${locale}/instagram` : "/instagram";
    return NextResponse.redirect(url, 301);
  }

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
    maybeAssignPromoFlow(req, response, rest);
    maybeAssignCheckoutFlow(req, response, rest);
    return response;
  }

  const cookieLocale = normalizeLocale(req.cookies.get(LOCALE_KEY)?.value);
  const resolvedLocale = queryLocale || cookieLocale || "fr";

  requestHeaders.set("x-fanovera-locale", resolvedLocale);
  requestHeaders.set("x-fanovera-pathname", pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  maybeAssignPromoFlow(req, response, pathname);
  maybeAssignCheckoutFlow(req, response, pathname);

  if (queryLocale) {
    response.cookies.set(LOCALE_KEY, queryLocale, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 180 });
    response.cookies.set(LOCALE_MODE_KEY, "manual", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 180 });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
