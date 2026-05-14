import { NextRequest, NextResponse } from "next/server";
import { COOKIE_OPTIONS, SESSION_COOKIE_NAME, consumeMagicLink } from "@/app/lib/accountAuth";

/**
 * GET /api/account/verify?token=...
 *
 * Magic-link landing endpoint. Consumes the token, sets the session cookie
 * and redirects to /account. On failure (expired / unknown token) we still
 * redirect — but with `?error=expired` so the page can show a clear message.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  const email = await consumeMagicLink(token);

  if (!email) {
    const url = new URL("/account", baseUrl);
    url.searchParams.set("error", "expired");
    return NextResponse.redirect(url);
  }

  const url = new URL("/account", baseUrl);
  const res = NextResponse.redirect(url);
  res.cookies.set(SESSION_COOKIE_NAME, token, COOKIE_OPTIONS);
  return res;
}
