import { NextRequest, NextResponse } from "next/server";
import { getMatchingUpsell } from "@/app/lib/db";
import { convertEurCentsTo } from "@/app/lib/fxRates";

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

    const baseCents = Math.max(0, Number(upsell.price_cents) || 0);
    const displayCents = currency === "EUR" ? baseCents : await convertEurCentsTo(baseCents, currency);
    return NextResponse.json({
      upsell: {
        ...upsell,
        price_cents: displayCents,
        currency,
        // Echo the EUR baseline so the checkout's source-of-truth (server-side
        // PaymentIntent) can re-validate using the DB value, not the converted
        // one shown in the UI.
        price_cents_eur: baseCents,
      },
    });
  } catch (err) {
    console.error("[upsells/match] error:", err);
    return NextResponse.json({ upsell: null });
  }
}
