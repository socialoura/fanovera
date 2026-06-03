import { NextRequest, NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { runHogQL, posthogQueryConfigured } from "@/app/lib/posthogQuery.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Per-variant funnel for the /promo username-first A/B, read from PostHog via
// the `promo_flow_variant` super property carried on every event of an exposed
// visitor. `amount` is in cents; revenue mixes currencies (mostly GBP for the
// GB campaign) — fine for a directional per-arm comparison.
const QUERY = `
SELECT
  properties.promo_flow_variant AS variant,
  count(DISTINCT if(event = 'promo_flow_exposed', person_id, NULL)) AS exposed,
  count(DISTINCT if(event = 'checkout_started', person_id, NULL)) AS checkouts,
  count(DISTINCT if(event = 'payment_succeeded', person_id, NULL)) AS buyers,
  countIf(event = 'payment_succeeded') AS payments,
  round(sumIf(toFloat(properties.amount), event = 'payment_succeeded') / 100, 2) AS revenue
FROM events
WHERE properties.promo_flow_variant IN ('control', 'username_first')
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY variant
ORDER BY variant
`;

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  if (!posthogQueryConfigured()) {
    return NextResponse.json({ configured: false, variants: [] });
  }
  try {
    const { results } = await runHogQL(QUERY);
    const variants = results.map((r) => ({
      variant: String(r[0] ?? ""),
      exposed: Number(r[1] ?? 0),
      checkouts: Number(r[2] ?? 0),
      buyers: Number(r[3] ?? 0),
      payments: Number(r[4] ?? 0),
      revenue: Number(r[5] ?? 0),
    }));
    return NextResponse.json({ configured: true, variants });
  } catch (error) {
    console.error("promo-flow results error:", error);
    return NextResponse.json(
      { configured: true, error: error instanceof Error ? error.message : "error", variants: [] },
      { status: 500 },
    );
  }
}
