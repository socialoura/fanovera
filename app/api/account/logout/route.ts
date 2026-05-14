import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, destroyCurrentSession } from "@/app/lib/accountAuth";

/**
 * POST /api/account/logout
 * Revokes the server-side session row + clears the cookie.
 */
export async function POST() {
  await destroyCurrentSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
