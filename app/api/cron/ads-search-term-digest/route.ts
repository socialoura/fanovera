import { NextRequest, NextResponse } from "next/server";
import { runSearchTermDigest } from "@/app/lib/searchTermDigest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily TikTok search-terms digest to Discord. Runs at 12h UTC (14h FR),
 * well after the 4h UTC sync has refreshed ad_costs_by_search_term.
 *
 * Auth: same Vercel-cron pattern as the other crons (Bearer ${CRON_SECRET}
 * or ?secret= for manual runs).
 */

function authorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return req.headers.get("user-agent")?.includes("vercel-cron") === true;
  }
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${expected}`) return true;
  if (req.nextUrl.searchParams.get("secret") === expected) return true;
  return false;
}

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runSearchTermDigest();
    console.info("[cron/ads-search-term-digest]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/ads-search-term-digest] failed:", err);
    return NextResponse.json({ error: "Digest run failed", detail: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
