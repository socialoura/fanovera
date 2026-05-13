import { NextRequest, NextResponse } from "next/server";
import { loadPricingPacksForService, normalizePricingCurrency } from "@/app/lib/pricingData";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const service = (sp.get("service") || "").trim();
    const effectiveCurrency = normalizePricingCurrency(sp.get("currency"));

    if (!service) {
      return NextResponse.json({ error: "service required" }, { status: 400 });
    }

    const packs = await loadPricingPacksForService(service, effectiveCurrency);

    return NextResponse.json({
      service,
      currency: effectiveCurrency,
      packs,
    });
  } catch (err) {
    console.error("[pricing]", err);
    return NextResponse.json({ error: "Failed to load pricing" }, { status: 500 });
  }
}
