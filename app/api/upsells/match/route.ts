import { NextRequest, NextResponse } from "next/server";
import { getMatchingUpsell } from "@/app/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const platform = (url.searchParams.get("platform") || "").toLowerCase().trim();
  const service = (url.searchParams.get("service") || "").toLowerCase().trim();
  if (!platform || !service) {
    return NextResponse.json({ upsell: null });
  }
  try {
    const upsell = await getMatchingUpsell(platform, service);
    return NextResponse.json({ upsell });
  } catch (err) {
    console.error("[upsells/match] error:", err);
    return NextResponse.json({ upsell: null });
  }
}
