import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { getTt2PacksMode, setTt2PacksMode, isTt2PacksMode } from "@/app/lib/tt2PacksExperiment.server";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    return NextResponse.json({ mode: await getTt2PacksMode() });
  } catch (error) {
    console.error("tt2-packs GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    const body = (await req.json()) as { mode?: unknown };
    if (!isTt2PacksMode(body.mode)) {
      return NextResponse.json({ error: "Mode invalide." }, { status: 400 });
    }
    await setTt2PacksMode(body.mode);
    // Take effect immediately on the SSR /tiktok page (the canonical TikTok flow).
    revalidateTag("tt2-packs-mode");
    revalidatePath("/tiktok");
    console.log(`[tt2-packs] mode → ${body.mode}`);
    return NextResponse.json({ mode: body.mode, changed: true });
  } catch (error) {
    console.error("tt2-packs POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
