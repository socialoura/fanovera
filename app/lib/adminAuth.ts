import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time comparison of the request's bearer token against ADMIN_PASSWORD.
 *
 * Why constant-time: a naive `===` may leak password length / prefix bytes
 * through CPU short-circuit timing differences, especially under low jitter
 * (Vercel serverless cold start can be noisy enough to mostly hide it, but
 * we don't want to rely on luck).
 */
export function isAdmin(req: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  const auth = req.headers.get("authorization") || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : auth;

  // Length mismatch → constant-time-safe early return (length is not secret).
  if (!provided || provided.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** Returns a 401 NextResponse when the caller is not authenticated as admin. */
export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** Guard helper: returns `null` if authorized, or a 401 NextResponse otherwise. */
export function requireAdmin(req: Request) {
  return isAdmin(req) ? null : unauthorized();
}
