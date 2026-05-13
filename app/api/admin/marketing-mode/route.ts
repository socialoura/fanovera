import { NextRequest, NextResponse } from "next/server";
import { getMarketingMode, setMarketingMode } from "@/app/lib/marketingMode.server";
import { isMarketingMode } from "@/app/lib/marketingModeTypes";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const mode = await getMarketingMode();
  return NextResponse.json({ mode });
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = (await req.json()) as { mode?: unknown };
    if (!isMarketingMode(body.mode)) {
      return NextResponse.json({ error: "Mode invalide." }, { status: 400 });
    }

    const mode = await setMarketingMode(body.mode);
    return NextResponse.json({ mode });
  } catch (error) {
    console.error("Marketing mode update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
