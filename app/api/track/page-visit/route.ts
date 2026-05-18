import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { normalizePlatform } from "@/app/lib/productCatalog";

// Dedupe-by-day visit logger. The unique constraint on
// (anonymous_id, platform, date) means we count one visit per visitor per
// platform per day no matter how many times the page is hit — keeping the
// "revenue / visit" metric stable against page refreshes and tab switches.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const platform = normalizePlatform(body?.platform);
    const rawId = typeof body?.anonymousId === "string" ? body.anonymousId.trim() : "";
    if (!platform || !rawId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const anonymousId = rawId.slice(0, 160);
    const country = (req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "")
      .slice(0, 12)
      .toUpperCase();
    const locale = (typeof body?.locale === "string" ? body.locale : "").slice(0, 12);

    await sql`
      INSERT INTO product_page_visits (anonymous_id, platform, country, locale)
      VALUES (${anonymousId}, ${platform}, ${country}, ${locale})
      ON CONFLICT (anonymous_id, platform, date) DO NOTHING
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[track/page-visit]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
