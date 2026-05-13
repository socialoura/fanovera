import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

/**
 * Initialises / migrates the Postgres schema.
 *
 * In production this is gated behind an explicit opt-in (`ALLOW_INIT_DB=1`)
 * because:
 *  - the operation is idempotent but slow (many CREATE/ALTER round-trips),
 *  - the endpoint should not be reachable by accident, even with the admin
 *    password compromised.
 *
 * To run a migration in prod: set `ALLOW_INIT_DB=1` in Vercel env, redeploy,
 * curl with the admin Bearer token, then unset the flag and redeploy.
 */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (isProd && process.env.ALLOW_INIT_DB !== "1") {
    return NextResponse.json(
      { error: "init-db is disabled in production (set ALLOW_INIT_DB=1 to enable)" },
      { status: 403 },
    );
  }

  try {
    await initDb();
    return NextResponse.json({ success: true, message: "Database initialized" });
  } catch (err) {
    console.error("[init-db]", err);
    return NextResponse.json(
      { error: "Failed to initialize database", detail: String(err) },
      { status: 500 },
    );
  }
}
