import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import {
  getAllSurfaceMarketingModes,
  setSurfaceMarketingMode,
  getSurfaceMarketingMode,
} from "@/app/lib/marketingMode.server";
import {
  isMarketingSurface,
  isSurfaceMarketingMode,
  SURFACE_PATH_MAP,
  type MarketingSurface,
} from "@/app/lib/marketingModeTypes";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    const modes = await getAllSurfaceMarketingModes();
    return NextResponse.json({ modes });
  } catch (error) {
    console.error("Marketing modes GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = (await req.json()) as { surface?: unknown; mode?: unknown };

    if (!isMarketingSurface(body.surface)) {
      return NextResponse.json({ error: "Surface invalide." }, { status: 400 });
    }
    if (!isSurfaceMarketingMode(body.mode)) {
      return NextResponse.json({ error: "Mode invalide." }, { status: 400 });
    }

    const surface = body.surface as MarketingSurface;
    const mode = body.mode;

    // Idempotence: check current mode first
    const current = await getSurfaceMarketingMode(surface);
    if (current === mode) {
      return NextResponse.json({ surface, mode, changed: false });
    }

    const by = req.headers.get("x-admin-user") || "admin";
    await setSurfaceMarketingMode(surface, mode, by);

    // Revalidate the affected page and sitemap
    const path = SURFACE_PATH_MAP[surface];
    revalidatePath(path);
    revalidatePath("/sitemap.xml");
    revalidateTag(`marketing-mode-${surface}`);
    revalidateTag("marketing-modes");

    console.log(`[marketing-modes] ${surface} → ${mode} (by: ${by})`);

    return NextResponse.json({ surface, mode, changed: true });
  } catch (error) {
    console.error("Marketing modes POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
