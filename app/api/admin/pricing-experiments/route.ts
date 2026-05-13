import { NextRequest, NextResponse } from "next/server";
import { getPricingExperimentSettings, savePricingExperimentSettings } from "@/app/lib/pricingExperiments.server";
import { normalizePricingExperiments } from "@/app/lib/pricingExperiments";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const settings = await getPricingExperimentSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const settings = await savePricingExperimentSettings({
      enabled: Boolean(body.enabled),
      experiments: normalizePricingExperiments(body.experiments),
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[admin/pricing-experiments]", error);
    return NextResponse.json({ error: "Invalid pricing experiment settings" }, { status: 400 });
  }
}
