import { NextRequest, NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { ensureOrderForPaymentIntent } from "@/app/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/orders/recover-payment
 *
 * Emergency recovery for paid PaymentIntents that never materialized in DB
 * (e.g. Stripe webhook misconfigured + client never reached /api/confirm-order).
 *
 * Calls ensureOrderForPaymentIntent in "cron" mode for one PI or a batch.
 * Side effects fire normally (email, Discord, SMM if auto-order enabled), with
 * the same idempotency guarantees as the webhook + client paths.
 *
 * Body: { paymentIntentId: string } OR { paymentIntentIds: string[] }
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body?.paymentIntentIds)
    ? body.paymentIntentIds.filter((x: unknown): x is string => typeof x === "string" && x.startsWith("pi_"))
    : typeof body?.paymentIntentId === "string" && body.paymentIntentId.startsWith("pi_")
      ? [body.paymentIntentId]
      : [];

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "paymentIntentId or paymentIntentIds[] required (must start with pi_)" },
      { status: 400 },
    );
  }

  const results = [];
  for (const piId of ids) {
    try {
      const r = await ensureOrderForPaymentIntent(piId, { source: "cron" });
      results.push({ paymentIntentId: piId, ...r });
    } catch (err) {
      results.push({
        paymentIntentId: piId,
        ok: false,
        reason: "internal_error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ count: ids.length, results });
}
