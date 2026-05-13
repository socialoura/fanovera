import { NextRequest, NextResponse } from "next/server";
import { getMarketingMode, setMarketingMode } from "@/app/lib/marketingMode.server";
import { isMarketingMode } from "@/app/lib/marketingModeTypes";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();
  const mode = await getMarketingMode();
  return NextResponse.json({ mode });
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

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
