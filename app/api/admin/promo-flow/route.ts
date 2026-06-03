import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { getPromoFlowMode, setPromoFlowMode, isPromoFlowMode } from "@/app/lib/promoFlow.server";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    return NextResponse.json({ mode: await getPromoFlowMode() });
  } catch (error) {
    console.error("promo-flow GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    const body = (await req.json()) as { mode?: unknown };
    if (!isPromoFlowMode(body.mode)) {
      return NextResponse.json({ error: "Mode invalide." }, { status: 400 });
    }
    await setPromoFlowMode(body.mode);
    // Take effect immediately on the SSR promo page.
    revalidateTag("promo-flow-mode");
    revalidatePath("/promo");
    console.log(`[promo-flow] mode → ${body.mode}`);
    return NextResponse.json({ mode: body.mode, changed: true });
  } catch (error) {
    console.error("promo-flow POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
