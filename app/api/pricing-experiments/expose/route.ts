import { NextRequest, NextResponse } from "next/server";
import { recordPricingExposure } from "@/app/lib/pricingExperiments.server";
import { rateLimit, tooManyRequests } from "@/app/lib/rateLimit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { key: "pricing-experiments-expose", max: 60, windowMs: 60_000 });
  if (!rl.allowed) return tooManyRequests(rl);

  try {
    const body = await req.json();
    const anonymousId = typeof body?.anonymousId === "string" ? body.anonymousId.trim() : "";
    const experimentId = typeof body?.experimentId === "string" ? body.experimentId.trim() : "";
    const variantId = typeof body?.variantId === "string" ? body.variantId.trim() : "";

    if (!anonymousId || !experimentId || !variantId) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    const country =
      (typeof body?.country === "string" && body.country.trim()) ||
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      "";

    await recordPricingExposure({
      anonymousId,
      experimentId,
      variantId,
      pricingStrategy: typeof body?.pricingStrategy === "string" ? body.pricingStrategy : "",
      productArea: typeof body?.productArea === "string" ? body.productArea : "",
      plan: typeof body?.plan === "string" ? body.plan : "",
      locale: typeof body?.locale === "string" ? body.locale : "",
      country,
      price: typeof body?.price === "number" ? body.price : 0,
      currency: typeof body?.currency === "string" ? body.currency : "EUR",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[pricing-experiments/expose]", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
