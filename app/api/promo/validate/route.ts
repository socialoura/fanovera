import { NextRequest, NextResponse } from "next/server";
import { getActivePromoCode } from "@/app/lib/db";
import {
  applyResolvedDiscount,
  calculatePromoPricing,
  normalizePromoCode,
} from "@/app/lib/promoCodes";
import { rateLimit, tooManyRequests } from "@/app/lib/rateLimit";

/**
 * Public promo-code validation for the checkout. Given a code + the current
 * subtotal, returns the resolved discount so the UI can display it BEFORE
 * payment. Does NOT consume a use — the usage counter is incremented only when
 * the order is actually paid (see ensureOrderForPaymentIntent).
 *
 * Resolution order: admin-managed codes (promo_codes table) first, then the
 * hardcoded FANO codes. Reserved codes can't be created in the table, so the
 * two namespaces never collide. Exhausted/expired/inactive/unknown codes return
 * { valid: false } and leak nothing about why (no max_uses / used_count).
 *
 * The response intentionally never blocks the order: the server re-resolves the
 * code authoritatively at PaymentIntent creation, so this endpoint is display-only.
 */
export async function POST(req: NextRequest) {
  // 30 attempts / 5 min / IP — enough for legitimate typo retries, caps code
  // enumeration.
  const rl = rateLimit(req, { key: "promo-validate", max: 30, windowMs: 5 * 60_000 });
  if (!rl.allowed) return tooManyRequests(rl);

  try {
    const body = await req.json().catch(() => ({}));
    const code = normalizePromoCode(body?.code);
    const subtotalRaw = Number(body?.subtotalCents);
    const subtotalCents =
      Number.isFinite(subtotalRaw) && subtotalRaw > 0 ? Math.round(subtotalRaw) : 0;

    if (!code || subtotalCents <= 0) {
      return NextResponse.json({ valid: false });
    }

    // Admin-managed code (active + not expired + under cap), else hardcoded.
    const dbPromo = await getActivePromoCode(code);
    const promo = dbPromo
      ? applyResolvedDiscount({
          subtotalCents,
          code: dbPromo.code,
          discountType: dbPromo.discount_type,
          discountValue: dbPromo.discount_value,
        })
      : calculatePromoPricing({ subtotalCents, promoCode: code });

    if (promo.type === "none" || promo.discountCents <= 0) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      type: promo.type,
      discountCents: promo.discountCents,
      amountCents: promo.amountCents,
    });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
