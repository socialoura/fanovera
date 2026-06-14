import { NextRequest, NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { refillOrderFromScratch, type SmmProvider } from "@/app/lib/smm";
import { sql, ensureDropOpsSchema } from "@/app/lib/db";

const PROVIDERS: SmmProvider[] = ["bulkfollows", "dripfeedpanel"];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/orders/refill-smm
 * Body: { orderId: number, serviceId: number }
 *
 * Full "refill" — relaunches the entire order from scratch on the
 * operator-chosen BulkFollows service ID, re-buying every cart line at its full
 * quantity (qty + bonus) as fresh sub-orders. Used when a delivery dropped and
 * the admin wants to re-run the whole order on a (possibly different) service.
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const orderId = Number(body?.orderId);
    const serviceId = Number(body?.serviceId);
    const provider: SmmProvider = PROVIDERS.includes(body?.provider) ? body.provider : "dripfeedpanel";

    if (!Number.isFinite(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }
    if (!Number.isFinite(serviceId) || serviceId <= 0) {
      return NextResponse.json({ error: "serviceId (provider service ID) is required" }, { status: 400 });
    }

    const { placed, failed } = await refillOrderFromScratch(orderId, serviceId, provider);

    // Stamp the refill so the Drops view can flag it and avoid double-refilling.
    await ensureDropOpsSchema();
    await sql`UPDATE orders SET last_refill_at = NOW() WHERE id = ${orderId}`;

    return NextResponse.json({
      success: true,
      orderId,
      serviceId,
      provider,
      summary: { placed, failed },
    });
  } catch (err) {
    console.error("[refill-smm] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
