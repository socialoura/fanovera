import { NextRequest, NextResponse } from "next/server";
import { getPricingExperimentSettings, savePricingExperimentSettings } from "@/app/lib/pricingExperiments.server";
import { normalizePricingExperiments } from "@/app/lib/pricingExperiments";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();
  const settings = await getPricingExperimentSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

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
