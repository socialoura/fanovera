import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { convertCentsToEur } from "@/app/lib/fxRates";
import { fetchAdGroupCostsToday, googleAdsConfigured } from "@/app/lib/googleAdsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Today's Google Ads spend vs revenue, broken down by SOCIAL NETWORK.
 *
 * The Google Ads account is structured by GEO at the campaign level
 * ([FR] / [UK] / [ES] / …) and by NETWORK at the ad-group level (Instagram,
 * Tiktok, YouTube, Twitch, Twitter, Facebook). So the per-network spend is the
 * sum of ad-group costs grouped by ad-group name, across all geo campaigns.
 *
 * COST: pulled LIVE from the Google Ads API (`segments.date DURING TODAY`,
 * account timezone = Europe/Paris) so it reflects spend as it accrues, without
 * waiting for the nightly cron. Fails soft to 0 if the API is unreachable.
 *
 * REVENUE (two columns, both for "today" in Europe/Paris):
 *   - revenueTotal: ALL net revenue from orders on that platform today,
 *     regardless of source (paid ads + organic + returns). Honest top-line but
 *     inflated as a ROAS denominator because organic is included.
 *   - revenueAds: first-touch LTV attribution — net revenue today from
 *     customers whose FIRST gclid-matched order was acquired via an ad group
 *     that maps to this network. Same methodology as the Ads ROAS tab, rolled
 *     up from ad group → network.
 *
 * Ad groups that are not a network (Brand, Commercial, "Groupe d'annonces 1")
 * are bucketed under the `other` slug on the cost side.
 */

// Mirror the Ads ROAS tab: accept refunded statuses on the acquisition side,
// but net out refunds in the revenue SUM via GREATEST(0, total - refunded).
const PAID_STATUSES = ["paid", "processing", "delivered", "partial", "canceled"];

const OTHER = "other";

/**
 * Map a Google Ads ad-group name to one of our canonical platform slugs
 * (matching orders.platform). Returns `other` for non-network ad groups like
 * Brand / Commercial / generic catch-alls.
 */
function platformFromAdGroupName(name: string | null | undefined): string {
  const n = (name || "").toLowerCase();
  if (n.includes("instagram")) return "instagram";
  if (n.includes("tiktok")) return "tiktok";
  if (n.includes("youtube")) return "youtube";
  if (n.includes("twitch")) return "twitch";
  if (n.includes("facebook")) return "facebook";
  if (n.includes("spotify")) return "spotify";
  if (n.includes("linkedin")) return "linkedin";
  // "twitter" or bare "x" (the X/Twitter network)
  if (n.includes("twitter") || n === "x") return "twitter";
  return OTHER;
}

/**
 * Extract the geo/locale tag from a campaign name. Campaigns are named like
 * "[FR] Fanovera" / "[UK] Fanovera" / "[EN] Fanovera", so the bracketed code is
 * our per-country dimension. We use the CAMPAIGN tag (not the buyer's country)
 * because both cost and first-touch ads revenue derive from the campaign, which
 * keeps the two sides consistent for a per-country ROAS. Untagged campaigns
 * (e.g. "Google Shopping") fall under `other`.
 */
function countryFromCampaignName(name: string | null | undefined): string {
  const m = (name || "").match(/\[([a-z]{2,3})\]/i);
  return m ? m[1].toUpperCase() : OTHER;
}

// One cell of the network × country grid (ads side only — cost + first-touch
// revenue). "CA total" (organic) is deliberately excluded: it can't be tied to
// a campaign country, so it only exists in the all-countries rollup.
type GeoCell = {
  platform: string;
  country: string;
  costCents: number;
  clicks: number;
  impressions: number;
  ordersAds: number;
  revenueAdsCents: number;
};

type Bucket = {
  platform: string;
  costCents: number;
  clicks: number;
  impressions: number;
  ordersTotal: number;
  revenueTotalCents: number;
  ordersAds: number;
  revenueAdsCents: number;
};

function emptyBucket(platform: string): Bucket {
  return {
    platform,
    costCents: 0,
    clicks: 0,
    impressions: 0,
    ordersTotal: 0,
    revenueTotalCents: 0,
    ordersAds: 0,
    revenueAdsCents: 0,
  };
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const buckets = new Map<string, Bucket>();
    const bucket = (platform: string): Bucket => {
      let b = buckets.get(platform);
      if (!b) {
        b = emptyBucket(platform);
        buckets.set(platform, b);
      }
      return b;
    };

    // Network × country grid (keyed "platform__country"), powering the country
    // filter on the client without an extra round-trip.
    const geoCells = new Map<string, GeoCell>();
    const geoCell = (platform: string, country: string): GeoCell => {
      const key = `${platform}__${country}`;
      let c = geoCells.get(key);
      if (!c) {
        c = { platform, country, costCents: 0, clicks: 0, impressions: 0, ordersAds: 0, revenueAdsCents: 0 };
        geoCells.set(key, c);
      }
      return c;
    };

    // --- COST (live) -------------------------------------------------------
    const configured = googleAdsConfigured();
    const costRows = configured ? await fetchAdGroupCostsToday() : [];
    // configured but zero rows can mean "no spend yet today" OR a transient API
    // error (fetch fails soft to []). We surface `configured` so the UI can hint.
    for (const r of costRows) {
      const platform = platformFromAdGroupName(r.adGroupName);
      const country = countryFromCampaignName(r.campaignName);
      const b = bucket(platform);
      b.costCents += r.costCents;
      b.clicks += r.clicks;
      b.impressions += r.impressions;
      const g = geoCell(platform, country);
      g.costCents += r.costCents;
      g.clicks += r.clicks;
      g.impressions += r.impressions;
    }

    // --- REVENUE: total per platform (today, Paris) ------------------------
    const totalRevRows = (await sql`
      SELECT platform, currency,
             COUNT(*)::int AS orders,
             COALESCE(SUM(GREATEST(0, total_cents - refunded_amount_cents)), 0)::bigint AS revenue
      FROM orders
      WHERE (created_at AT TIME ZONE 'Europe/Paris')::date = (NOW() AT TIME ZONE 'Europe/Paris')::date
        AND status = ANY(${PAID_STATUSES})
      GROUP BY platform, currency
    `) as Array<{ platform: string; currency: string | null; orders: number; revenue: number }>;

    for (const row of totalRevRows) {
      const b = bucket(row.platform || OTHER);
      b.ordersTotal += Number(row.orders) || 0;
      b.revenueTotalCents += await convertCentsToEur(Number(row.revenue) || 0, row.currency || "EUR");
    }

    // --- REVENUE: first-touch ads-attributed per acquisition ad group ------
    // (today, Paris). Rolled up to network in JS via the ad-group name.
    const adsRevRows = (await sql`
      WITH customer_acquisitions AS (
        SELECT DISTINCT ON (LOWER(TRIM(o.email)))
          LOWER(TRIM(o.email)) AS email_key,
          gcm.ad_group_id,
          gcm.campaign_name AS acq_campaign_name
        FROM orders o
        JOIN checkout_payloads cp ON cp.payment_intent_id = o.stripe_payment_intent_id
        JOIN gclid_campaign_map gcm ON gcm.gclid = cp.gclid
        WHERE cp.gclid <> ''
          AND o.email <> ''
          AND gcm.ad_group_id IS NOT NULL
          AND o.status = ANY(${PAID_STATUSES})
        ORDER BY LOWER(TRIM(o.email)), o.created_at ASC
      ),
      ag_names AS (
        SELECT ad_group_id, MAX(ad_group_name) AS ad_group_name
        FROM ad_costs_by_ad_group
        GROUP BY ad_group_id
      )
      SELECT
        an.ad_group_name,
        ca.acq_campaign_name,
        o2.currency,
        COUNT(DISTINCT o2.id)::int AS orders,
        COALESCE(SUM(GREATEST(0, o2.total_cents - o2.refunded_amount_cents)), 0)::bigint AS revenue
      FROM customer_acquisitions ca
      JOIN orders o2 ON LOWER(TRIM(o2.email)) = ca.email_key
      LEFT JOIN ag_names an ON an.ad_group_id = ca.ad_group_id
      WHERE o2.status = ANY(${PAID_STATUSES})
        AND (o2.created_at AT TIME ZONE 'Europe/Paris')::date = (NOW() AT TIME ZONE 'Europe/Paris')::date
      GROUP BY an.ad_group_name, ca.acq_campaign_name, o2.currency
    `) as Array<{ ad_group_name: string | null; acq_campaign_name: string | null; currency: string | null; orders: number; revenue: number }>;

    for (const row of adsRevRows) {
      const platform = platformFromAdGroupName(row.ad_group_name);
      const country = countryFromCampaignName(row.acq_campaign_name);
      const orders = Number(row.orders) || 0;
      const revenue = await convertCentsToEur(Number(row.revenue) || 0, row.currency || "EUR");
      const b = bucket(platform);
      b.ordersAds += orders;
      b.revenueAdsCents += revenue;
      const g = geoCell(platform, country);
      g.ordersAds += orders;
      g.revenueAdsCents += revenue;
    }

    // --- Assemble rows + ROAS ---------------------------------------------
    const rows = Array.from(buckets.values())
      .map((b) => ({
        ...b,
        roasTotal: b.costCents > 0 ? b.revenueTotalCents / b.costCents : null,
        roasAds: b.costCents > 0 ? b.revenueAdsCents / b.costCents : null,
      }))
      .sort((a, b) => b.costCents - a.costCents || b.revenueTotalCents - a.revenueTotalCents);

    const totals = rows.reduce(
      (acc, r) => {
        acc.costCents += r.costCents;
        acc.clicks += r.clicks;
        acc.impressions += r.impressions;
        acc.ordersTotal += r.ordersTotal;
        acc.revenueTotalCents += r.revenueTotalCents;
        acc.ordersAds += r.ordersAds;
        acc.revenueAdsCents += r.revenueAdsCents;
        return acc;
      },
      {
        costCents: 0,
        clicks: 0,
        impressions: 0,
        ordersTotal: 0,
        revenueTotalCents: 0,
        ordersAds: 0,
        revenueAdsCents: 0,
      },
    );

    // Country tags ordered by spend desc (biggest first), `other` always last.
    const countryCost = new Map<string, number>();
    for (const g of geoCells.values()) {
      countryCost.set(g.country, (countryCost.get(g.country) ?? 0) + g.costCents);
    }
    const countries = Array.from(countryCost.keys()).sort((a, b) => {
      if (a === OTHER) return 1;
      if (b === OTHER) return -1;
      return (countryCost.get(b) ?? 0) - (countryCost.get(a) ?? 0);
    });

    const todayParis = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Paris",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());

    return NextResponse.json({
      dateParis: todayParis,
      timeZone: "Europe/Paris",
      configured,
      // true when we got at least one live cost row; lets the UI distinguish
      // "no spend yet" from "couldn't reach the API".
      costLive: costRows.length > 0,
      rows,
      countries,
      networkCountry: Array.from(geoCells.values()),
      totals: {
        ...totals,
        roasTotal: totals.costCents > 0 ? totals.revenueTotalCents / totals.costCents : null,
        roasAds: totals.costCents > 0 ? totals.revenueAdsCents / totals.costCents : null,
      },
    });
  } catch (err) {
    console.error("[admin/network-today] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
