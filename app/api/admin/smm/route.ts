import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { PLATFORM_SERVICES } from "@/app/lib/productCatalog";
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const [mappings, settings] = await Promise.all([
      sql`SELECT * FROM smm_config ORDER BY platform, service`,
      sql`SELECT * FROM smm_settings`,
    ]);

    // Fetch BulkFollows balance
    let balance = null;
    try {
      const res = await fetch("https://bulkfollows.com/api/v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: process.env.BULKFOLLOWS_API_KEY,
          action: "balance",
        }),
      });
      const data = await res.json();
      balance = data.balance ?? data;
    } catch (e) {
      console.error("BulkFollows balance error:", e);
      balance = null;
    }

    return NextResponse.json({ mappings, settings, balance });
  } catch (error) {
    console.error("SMM GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const { id, bulkfollows_service_id, enabled } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (bulkfollows_service_id !== undefined) {
      await sql`UPDATE smm_config SET bulkfollows_service_id = ${bulkfollows_service_id} WHERE id = ${id}`;
    }
    if (enabled !== undefined) {
      await sql`UPDATE smm_config SET enabled = ${enabled} WHERE id = ${id}`;
    }

    const updated = await sql`SELECT * FROM smm_config WHERE id = ${id} LIMIT 1`;
    return NextResponse.json({ mapping: updated[0] });
  } catch (error) {
    console.error("SMM PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "toggle_auto") {
      const current = await sql`SELECT value FROM smm_settings WHERE key = 'auto_order_enabled'`;
      const currentValue = current[0]?.value === "true";
      const newValue = (!currentValue).toString();
      await sql`UPDATE smm_settings SET value = ${newValue} WHERE key = 'auto_order_enabled'`;
      return NextResponse.json({ auto_order_enabled: !currentValue });
    }

    if (action === "add_mapping") {
      // Twitter is stored under platform="x" in smm_config (legacy), while the
      // catalog keys it as "twitter" — normalize so the alias matches routing.
      const rawPlatform = String(body.platform || "").toLowerCase();
      const platform = rawPlatform === "twitter" ? "x" : rawPlatform;
      const catalogPlatform = rawPlatform === "x" ? "twitter" : rawPlatform;
      const service = String(body.service || "");
      const bfId = Number(body.bulkfollows_service_id);

      // Only allow services that exist in the canonical catalog: a typo here
      // would silently fail to route orders, so we never trust free input.
      const allowed = (PLATFORM_SERVICES as Record<string, readonly string[]>)[catalogPlatform];
      if (!allowed || !allowed.includes(service)) {
        return NextResponse.json({ error: "Service ou plateforme invalide." }, { status: 400 });
      }
      if (!Number.isInteger(bfId) || bfId < 0) {
        return NextResponse.json({ error: "BulkFollows service ID invalide." }, { status: 400 });
      }

      // Auto-enable only when a real (non-zero) BF id is provided.
      await sql`
        INSERT INTO smm_config (platform, service, bulkfollows_service_id, enabled)
        VALUES (${platform}, ${service}, ${bfId}, ${bfId > 0})
        ON CONFLICT (platform, service) DO NOTHING
      `;
      return NextResponse.json({ added: true, platform, service });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("SMM POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
