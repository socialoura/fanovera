import { NextResponse } from "next/server";
import { getPricingExperimentSettings } from "@/app/lib/pricingExperiments.server";

export async function GET() {
  const settings = await getPricingExperimentSettings();
  return NextResponse.json({
    enabled: settings.enabled,
    experiments: settings.experiments.map((experiment) => ({
      ...experiment,
      enabled: settings.enabled && experiment.enabled,
    })),
  });
}
