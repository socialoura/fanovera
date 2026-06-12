import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { getCheckoutFlowMode, setCheckoutFlowMode, isCheckoutFlowMode } from "@/app/lib/checkoutFlow.server";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    return NextResponse.json({ mode: await getCheckoutFlowMode() });
  } catch (error) {
    console.error("checkout-flow GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  try {
    const body = (await req.json()) as { mode?: unknown };
    if (!isCheckoutFlowMode(body.mode)) {
      return NextResponse.json({ error: "Mode invalide." }, { status: 400 });
    }
    await setCheckoutFlowMode(body.mode);
    // Take effect immediately on the SSR Instagram page.
    revalidateTag("checkout-flow-mode");
    revalidatePath("/instagram-2");
    console.log(`[checkout-flow] mode → ${body.mode}`);
    return NextResponse.json({ mode: body.mode, changed: true });
  } catch (error) {
    console.error("checkout-flow POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
