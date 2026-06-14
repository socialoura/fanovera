import { NextRequest, NextResponse } from "next/server";
import { refreshServiceRates, getServices, type SmmProvider } from "@/app/lib/smm";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

const VALID_PROVIDERS: SmmProvider[] = ["bulkfollows", "dripfeedpanel"];

/**
 * GET /api/admin/smm/services?provider=bulkfollows
 * Returns the full list of services from the specified provider.
 */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const providerParam = req.nextUrl.searchParams.get("provider") || "bulkfollows";
    const provider = VALID_PROVIDERS.includes(providerParam as SmmProvider)
      ? (providerParam as SmmProvider)
      : "bulkfollows";
    const services = await getServices(provider);

    // Single-service lookup (used by the Drops cost preview): return just the
    // matching service so the client doesn't ship the whole catalog.
    const idParam = req.nextUrl.searchParams.get("id");
    if (idParam) {
      const id = Number(idParam);
      const service = services.find((s) => Number(s.service) === id) || null;
      return NextResponse.json({ service, provider });
    }

    return NextResponse.json({ services, count: services.length, provider });
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
