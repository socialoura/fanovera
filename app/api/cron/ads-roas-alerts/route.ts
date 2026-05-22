import { NextRequest, NextResponse } from "next/server";
import { runAdRoasAlerts } from "@/app/lib/adsAlerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily ROAS health check. Runs at 7h UTC (9h FR), after the sync at 4h UTC
 * has refreshed the cost/click data. Sends Discord + email digest if any
 * campaign hit the thresholds.
 *
 * Auth: same Vercel-cron pattern as the other crons.
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
    const result = await runAdRoasAlerts();
    console.info("[cron/ads-roas-alerts]", {
      dispatched: result.dispatched.length,
      skipped: result.skipped,
      total: result.total,
    });
    return NextResponse.json({
      ok: true,
      dispatched: result.dispatched.length,
      skipped: result.skipped,
      total: result.total,
      alerts: result.dispatched.map((a) => ({
        kind: a.kind,
        campaignId: a.campaignId,
        campaignName: a.campaignName,
        roas: a.roas,
      })),
    });
  } catch (err) {
    console.error("[cron/ads-roas-alerts] failed:", err);
    return NextResponse.json({ error: "Alert run failed", detail: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
