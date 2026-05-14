/**
 * Magic-link account authentication.
 *
 * No password. The customer enters their email, we mail them a single-use
 * verification link. Clicking the link sets an HttpOnly session cookie that
 * grants read-only access to their order history (and nothing else for now).
 *
 * One row in `account_sessions` represents both the magic-link token (until
 * verified) and the long-lived session afterwards. Keeps the surface tiny.
 */

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { sql } from "./db";

export const SESSION_COOKIE_NAME = "fanovera_session";

/** Magic-link validity once issued (single-use). */
const MAGIC_LINK_TTL_MS = 15 * 60 * 1000; // 15 min

/** Session validity once the magic link has been clicked. */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function ensureSchema() {
  // Lazy migration — runs at most once per cold start.
  await sql`
    CREATE TABLE IF NOT EXISTS account_sessions (
      id BIGSERIAL PRIMARY KEY,
      token VARCHAR(80) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      verified_at TIMESTAMPTZ NULL,
      session_expires_at TIMESTAMPTZ NULL,
      ip VARCHAR(45) NULL,
      user_agent VARCHAR(255) NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_account_sessions_token ON account_sessions (token)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_account_sessions_email ON account_sessions (email)`;
}

function newToken(): string {
  return randomBytes(32).toString("hex");
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_RX.test(value.trim().toLowerCase());
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Create a fresh magic-link token for the given email. Caller is responsible
 * for emailing the link to the customer. Returns the token (URL-safe hex).
 */
export async function createMagicLinkToken(params: {
  email: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<string> {
  await ensureSchema();
  const token = newToken();
  const email = normalizeEmail(params.email);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS).toISOString();
  await sql`
    INSERT INTO account_sessions (token, email, expires_at, ip, user_agent)
    VALUES (${token}, ${email}, ${expiresAt}, ${params.ip ?? null}, ${(params.userAgent || "").slice(0, 250) || null})
  `;
  return token;
}

/**
 * Consume a magic-link token. On success, marks the row as verified, extends
 * its expiry to the long session TTL, and returns the email.
 *
 * Returns null if the token doesn't exist, has expired, or was already used
 * (a verified row can still be re-used as a session, but a token that looks
 * like a fresh magic link but isn't fresh is considered consumed).
 */
export async function consumeMagicLink(token: string): Promise<string | null> {
  if (!token || token.length < 16) return null;
  await ensureSchema();
  const rows = (await sql`
    SELECT id, email, expires_at, verified_at, session_expires_at
    FROM account_sessions
    WHERE token = ${token}
    LIMIT 1
  `) as Array<{
    id: number;
    email: string;
    expires_at: string;
    verified_at: string | null;
    session_expires_at: string | null;
  }>;

  const row = rows[0];
  if (!row) return null;

  // Already verified → still usable as a long session if not expired.
  if (row.verified_at) {
    if (row.session_expires_at && new Date(row.session_expires_at).getTime() > Date.now()) {
      return row.email;
    }
    return null;
  }

  // Fresh magic link — must still be within its TTL.
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return null;
  }

  const sessionExpires = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await sql`
    UPDATE account_sessions
    SET verified_at = NOW(),
        session_expires_at = ${sessionExpires}
    WHERE id = ${row.id}
  `;
  return row.email;
}

/**
 * Resolve the email tied to the current session cookie, or null if none.
 * Use from server components / route handlers.
 */
export async function getSessionEmail(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  await ensureSchema();
  const rows = (await sql`
    SELECT email, verified_at, session_expires_at
    FROM account_sessions
    WHERE token = ${token}
    LIMIT 1
  `) as Array<{ email: string; verified_at: string | null; session_expires_at: string | null }>;
  const row = rows[0];
  if (!row || !row.verified_at) return null;
  if (!row.session_expires_at || new Date(row.session_expires_at).getTime() < Date.now()) return null;
  return row.email;
}

/** Clear the current session cookie + revoke the matching DB row. */
export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return;
  try {
    await sql`DELETE FROM account_sessions WHERE token = ${token}`;
  } catch (err) {
    console.error("[accountAuth] destroy error:", err);
  }
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};
