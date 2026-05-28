import { NextRequest, NextResponse } from "next/server";
import { getMatchingUpsell } from "@/app/lib/db";
import { resolveUpsellPriceCents } from "@/app/lib/fxRates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const platform = (url.searchParams.get("platform") || "").toLowerCase().trim();
  const service = (url.searchParams.get("service") || "").toLowerCase().trim();
  const currency = (url.searchParams.get("currency") || "EUR").toUpperCase().trim();
  if (!platform || !service) {
    return NextResponse.json({ upsell: null });
  }
  try {
    const upsell = await getMatchingUpsell(platform, service);
    if (!upsell) return NextResponse.json({ upsell: null });

    const resolved = await resolveUpsellPriceCents(upsell, currency);
    return NextResponse.json({
      upsell: {
        id: upsell.id,
        service: upsell.service,
        qty: upsell.qty,
        label: upsell.label,
        label_en: upsell.label_en,
        price_cents: resolved.cents,
        price_cents_eur: resolved.centsEur,
        currency,
        price_is_override: resolved.isOverride,
      },
    });
  } catch (err) {
    console.error("[upsells/match] error:", err);
    return NextResponse.json({ upsell: null });
  }
}
