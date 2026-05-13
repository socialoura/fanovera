import { NextRequest, NextResponse } from "next/server";
import { refreshServiceRates, getServices } from "@/app/lib/smm";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
/**
 * GET /api/admin/smm/services
 * Returns the full list of BulkFollows services (with rates).
 */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const services = await getServices();
    return NextResponse.json({ services, count: services.length });
  } catch (error) {
    console.error("[smm/services GET] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch services" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/smm/services
 * Body: { action: "refresh_rates" }
 *
 * Fetches all BulkFollows services, matches them to smm_config rows,
 * and updates the rate_per_1k column with the latest prices.
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "refresh_rates") {
      const result = await refreshServiceRates();
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[smm/services POST] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to refresh rates" },
      { status: 500 },
    );
  }
}
