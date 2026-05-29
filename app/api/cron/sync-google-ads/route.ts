import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import {
  fetchAdGroupCosts,
  fetchCampaignCosts,
  fetchClickToCampaignMap,
  fetchKeywordCosts,
  fetchSearchTermCosts,
  googleAdsConfigured,
} from "@/app/lib/googleAdsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily sync of Google Ads cost/click data into our own DB.
 *
 *   - ad_costs_by_campaign: re-upserts the last 14 days every run, because
 *     Google keeps adjusting conversions retroactively for ~2 weeks.
 *   - gclid_campaign_map: insert-or-ignore over the last 30 days. gclids
 *     are immutable, so we only ever add new ones.
 *
 * Auth: same pattern as abandoned-cart — Bearer ${CRON_SECRET} from Vercel,
 * or ?secret= for manual runs.
 */

function authorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return req.headers.get("user-agent")?.includes("vercel-cron") === true;
  }
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${expected}`) return true;
  if (req.nextUrl.searchParams.get("secret") === expected) return true;
  return false;
}

async function syncCampaignCosts(daysBack: number) {
  const rows = await fetchCampaignCosts(daysBack);
  let upserted = 0;
  for (const r of rows) {
    await sql`
      INSERT INTO ad_costs_by_campaign
        (date, campaign_id, campaign_name, cost_cents, clicks, impressions, conversions, synced_at)
      VALUES
        (${r.date}::date, ${r.campaignId}::bigint, ${r.campaignName}, ${r.costCents}, ${r.clicks}, ${r.impressions}, ${r.conversions}, NOW())
      ON CONFLICT (date, campaign_id) DO UPDATE SET
        campaign_name = EXCLUDED.campaign_name,
        cost_cents = EXCLUDED.cost_cents,
        clicks = EXCLUDED.clicks,
        impressions = EXCLUDED.impressions,
        conversions = EXCLUDED.conversions,
        synced_at = NOW()
    `;
    upserted++;
  }
  return { fetched: rows.length, upserted };
}

async function syncAdGroupCosts(daysBack: number) {
  const rows = await fetchAdGroupCosts(daysBack);
  let upserted = 0;
  for (const r of rows) {
    await sql`
      INSERT INTO ad_costs_by_ad_group
        (date, campaign_id, campaign_name, ad_group_id, ad_group_name, cost_cents, clicks, impressions, conversions, synced_at)
      VALUES
        (${r.date}::date, ${r.campaignId}::bigint, ${r.campaignName}, ${r.adGroupId}::bigint, ${r.adGroupName}, ${r.costCents}, ${r.clicks}, ${r.impressions}, ${r.conversions}, NOW())
      ON CONFLICT (date, ad_group_id) DO UPDATE SET
        campaign_id = EXCLUDED.campaign_id,
        campaign_name = EXCLUDED.campaign_name,
        ad_group_name = EXCLUDED.ad_group_name,
        cost_cents = EXCLUDED.cost_cents,
        clicks = EXCLUDED.clicks,
        impressions = EXCLUDED.impressions,
        conversions = EXCLUDED.conversions,
        synced_at = NOW()
    `;
    upserted++;
  }
  return { fetched: rows.length, upserted };
}

async function syncSearchTermCosts(daysBack: number) {
  const rows = await fetchSearchTermCosts(daysBack);
  let upserted = 0;
  for (const r of rows) {
    await sql`
      INSERT INTO ad_costs_by_search_term
        (date, campaign_id, campaign_name, ad_group_id, ad_group_name, search_term, cost_cents, clicks, impressions, conversions, conversions_value, synced_at)
      VALUES
        (${r.date}::date, ${r.campaignId}::bigint, ${r.campaignName}, ${r.adGroupId}::bigint, ${r.adGroupName}, ${r.searchTerm}, ${r.costCents}, ${r.clicks}, ${r.impressions}, ${r.conversions}, ${r.conversionsValue}, NOW())
      ON CONFLICT (date, ad_group_id, search_term) DO UPDATE SET
        campaign_id = EXCLUDED.campaign_id,
        campaign_name = EXCLUDED.campaign_name,
        ad_group_name = EXCLUDED.ad_group_name,
        cost_cents = EXCLUDED.cost_cents,
        clicks = EXCLUDED.clicks,
        impressions = EXCLUDED.impressions,
        conversions = EXCLUDED.conversions,
        conversions_value = EXCLUDED.conversions_value,
        synced_at = NOW()
    `;
    upserted++;
  }
  return { fetched: rows.length, upserted };
}

async function syncKeywordCosts(daysBack: number) {
  const rows = await fetchKeywordCosts(daysBack);
  let upserted = 0;
  for (const r of rows) {
    await sql`
      INSERT INTO ad_costs_by_keyword
        (date, campaign_id, campaign_name, ad_group_id, ad_group_name, criterion_id, keyword_text, match_type, cost_cents, clicks, impressions, conversions, conversions_value, synced_at)
      VALUES
        (${r.date}::date, ${r.campaignId}::bigint, ${r.campaignName}, ${r.adGroupId}::bigint, ${r.adGroupName}, ${r.criterionId}::bigint, ${r.keywordText}, ${r.matchType}, ${r.costCents}, ${r.clicks}, ${r.impressions}, ${r.conversions}, ${r.conversionsValue}, NOW())
      ON CONFLICT (date, ad_group_id, criterion_id) DO UPDATE SET
        campaign_id = EXCLUDED.campaign_id,
        campaign_name = EXCLUDED.campaign_name,
        ad_group_name = EXCLUDED.ad_group_name,
        keyword_text = EXCLUDED.keyword_text,
        match_type = EXCLUDED.match_type,
        cost_cents = EXCLUDED.cost_cents,
        clicks = EXCLUDED.clicks,
        impressions = EXCLUDED.impressions,
        conversions = EXCLUDED.conversions,
        conversions_value = EXCLUDED.conversions_value,
        synced_at = NOW()
    `;
    upserted++;
  }
  return { fetched: rows.length, upserted };
}

async function syncGclidMap(daysBack: number) {
  const rows = await fetchClickToCampaignMap(daysBack);
  let inserted = 0;
  for (const r of rows) {
    const result = await sql`
      INSERT INTO gclid_campaign_map
        (gclid, campaign_id, campaign_name, ad_group_id, click_date)
      VALUES
        (${r.gclid}, ${r.campaignId}::bigint, ${r.campaignName}, ${r.adGroupId ? r.adGroupId : null}, ${r.clickDate}::date)
      ON CONFLICT (gclid) DO NOTHING
      RETURNING gclid
    `;
    if (result.length > 0) inserted++;
  }
  return { fetched: rows.length, inserted };
}

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!googleAdsConfigured()) {
    return NextResponse.json(
      {
        ok: true,
        skipped: true,
        reason: "Google Ads env vars not set — see docs/google-ads-integration.md",
      },
      { status: 200 },
    );
  }

  try {
    const sp = req.nextUrl.searchParams;
    const costDays = Math.max(1, Math.min(30, Number(sp.get("costDays")) || 14));
    const gclidDays = Math.max(1, Math.min(90, Number(sp.get("gclidDays")) || 30));

    const startedAt = Date.now();
    const costs = await syncCampaignCosts(costDays);
    const adGroupCosts = await syncAdGroupCosts(costDays);
    const searchTermCosts = await syncSearchTermCosts(costDays);
    const keywordCosts = await syncKeywordCosts(costDays);
    const gclids = await syncGclidMap(gclidDays);
    const tookMs = Date.now() - startedAt;

    console.info("[cron/sync-google-ads]", { costs, adGroupCosts, searchTermCosts, keywordCosts, gclids, tookMs });
    return NextResponse.json({ ok: true, costs, adGroupCosts, searchTermCosts, keywordCosts, gclids, tookMs });
  } catch (err) {
    console.error("[cron/sync-google-ads] failed:", err);
    return NextResponse.json({ error: "Sync failed", detail: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
