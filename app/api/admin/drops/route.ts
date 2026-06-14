import { NextRequest, NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { analyzeFollowerDrops } from "@/app/lib/dropAnalysis";
import { getBalanceSafe, type SmmProvider } from "@/app/lib/smm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Live count lookups are pooled but a wide range can still take a while.
export const maxDuration = 60;

/**
 * GET /api/admin/drops?platform=tiktok&since=2026-06-12&until=2026-06-14&threshold=20&provider=dripfeedpanel
 *
 * Scans follower orders in the window, compares expected vs live counts, and
 * returns the flagged accounts plus the provider balance (for refill planning).
 */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const sp = req.nextUrl.searchParams;
    const platform = (sp.get("platform") || "tiktok").toLowerCase();
    const since = sp.get("since");
    const until = sp.get("until") || undefined;
    const threshold = Number(sp.get("threshold") || 20);
    const provider = (sp.get("provider") || "dripfeedpanel") as SmmProvider;

    if (!since || !/^\d{4}-\d{2}-\d{2}$/.test(since)) {
      return NextResponse.json({ error: "since (YYYY-MM-DD) is required" }, { status: 400 });
    }

    const [analysis, balance] = await Promise.all([
      analyzeFollowerDrops({ platform, since, until, threshold }),
      getBalanceSafe(provider),
    ]);

    return NextResponse.json({ ...analysis, provider, balance });
  } catch (err) {
    console.error("[drops] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
