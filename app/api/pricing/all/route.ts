import { NextRequest, NextResponse } from "next/server";
import { loadAllProductPricing, normalizePricingCurrency } from "@/app/lib/pricingData";

export async function GET(req: NextRequest) {
  try {
    const currency = normalizePricingCurrency(req.nextUrl.searchParams.get("currency"));
    const services = await loadAllProductPricing(currency);

    return NextResponse.json({
      currency,
      services,
    });
  } catch (err) {
    console.error("[pricing/all]", err);
    return NextResponse.json({ error: "Failed to load product pricing" }, { status: 500 });
  }
}
