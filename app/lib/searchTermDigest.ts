/**
 * Daily TikTok search-terms digest → Discord.
 *
 * Reads from `ad_costs_by_search_term` (populated daily by the sync-google-ads
 * cron at 4h UTC), so this never calls the Google Ads API directly — it is
 * immune to the OAuth refresh-token expiry that affects the live API.
 *
 * Scope: the active Tiktok ad groups on the [XX] Fanovera campaigns.
 *
 * Surfaces, over a rolling window (default 7 days):
 *   - per-market summary (spend / conv / value / ROAS / estimated profit)
 *   - WASTE  — terms with >= MIN_WASTE_CLICKS clicks and 0 conversions
 *              (high enough to be signal, not 1-click noise) → add as negatives
 *   - WINNERS — converting terms → verify they are bidded keywords
 *
 * Discord failures are logged, never thrown — the cron must return 200.
 */

import { sql } from "@/app/lib/db";

const DAYS = 7;
const MARGIN = 0.85; // Fanovera gross margin (memory: marge 85%)
const MIN_WASTE_CLICKS = 4; // below this, "0 conversions" is statistical noise
const ALL_MARKETS = ["[FR] Fanovera", "[CH] Fanovera", "[ES] Fanovera", "[IT] Fanovera", "[UK] Fanovera", "[US] Fanovera"];

type MarketRow = { id: string; name: string; cost: number; clicks: number; conv: number; val: number };
type TermRow = { name: string; term: string; cost: number; clicks: number; conv: number; val: number };

export type DigestSummary = {
  sent: boolean;
  markets: number;
  totalCostEur: number;
  totalConv: number;
  totalValueEur: number;
  estProfitEur: number;
  wasteCount: number;
  winnerCount: number;
};

const eur = (cents: number) => cents / 100;
const f = (n: number) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const short = (name: string) => name.replace(" Fanovera", "");
const cap = (s: string, n = 1020) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

async function fetchMarkets(): Promise<MarketRow[]> {
  const rows = await sql`
    SELECT campaign_id::text AS id, MAX(campaign_name) AS name,
           SUM(cost_cents)::int AS cost, SUM(clicks)::int AS clicks,
           SUM(conversions)::float AS conv, SUM(conversions_value)::float AS val
    FROM ad_costs_by_search_term
    WHERE ad_group_name = 'Tiktok' AND campaign_name LIKE '%Fanovera%'
      AND date >= CURRENT_DATE - ${DAYS}::int * INTERVAL '1 day'
    GROUP BY campaign_id
    HAVING SUM(cost_cents) > 0
    ORDER BY SUM(cost_cents) DESC
  `;
  return rows.map((r) => ({ id: String(r.id), name: String(r.name || ""), cost: Number(r.cost) || 0, clicks: Number(r.clicks) || 0, conv: Number(r.conv) || 0, val: Number(r.val) || 0 }));
}

async function fetchWaste(): Promise<TermRow[]> {
  const rows = await sql`
    SELECT MAX(campaign_name) AS name, search_term AS term,
           SUM(cost_cents)::int AS cost, SUM(clicks)::int AS clicks
    FROM ad_costs_by_search_term
    WHERE ad_group_name = 'Tiktok' AND campaign_name LIKE '%Fanovera%'
      AND date >= CURRENT_DATE - ${DAYS}::int * INTERVAL '1 day'
    GROUP BY campaign_id, search_term
    HAVING SUM(conversions) = 0 AND SUM(clicks) >= ${MIN_WASTE_CLICKS}
    ORDER BY SUM(cost_cents) DESC
    LIMIT 8
  `;
  return rows.map((r) => ({ name: String(r.name || ""), term: String(r.term || ""), cost: Number(r.cost) || 0, clicks: Number(r.clicks) || 0, conv: 0, val: 0 }));
}

async function fetchWinners(): Promise<TermRow[]> {
  const rows = await sql`
    SELECT MAX(campaign_name) AS name, search_term AS term,
           SUM(conversions)::float AS conv, SUM(conversions_value)::float AS val
    FROM ad_costs_by_search_term
    WHERE ad_group_name = 'Tiktok' AND campaign_name LIKE '%Fanovera%'
      AND date >= CURRENT_DATE - ${DAYS}::int * INTERVAL '1 day'
    GROUP BY campaign_id, search_term
    HAVING SUM(conversions) > 0
    ORDER BY SUM(conversions) DESC
    LIMIT 8
  `;
  return rows.map((r) => ({ name: String(r.name || ""), term: String(r.term || ""), conv: Number(r.conv) || 0, val: Number(r.val) || 0, cost: 0, clicks: 0 }));
}

async function postDiscord(embed: Record<string, unknown>): Promise<boolean> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    console.warn("[searchTermDigest] DISCORD_WEBHOOK_URL not set — skipping");
    return false;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!res.ok) console.error("[searchTermDigest] Discord non-2xx:", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("[searchTermDigest] Discord error:", err);
    return false;
  }
}

export async function runSearchTermDigest(): Promise<DigestSummary> {
  const [markets, waste, winners] = await Promise.all([fetchMarkets(), fetchWaste(), fetchWinners()]);

  let tCost = 0, tConv = 0, tVal = 0;
  const mLines = markets.map((m) => {
    const cost = eur(m.cost);
    tCost += cost; tConv += m.conv; tVal += m.val;
    const roas = cost > 0 ? m.val / cost : 0;
    const profit = m.val * MARGIN - cost;
    return `${profit >= 0 ? "🟢" : "🔴"} **${m.name}** — ${f(cost)}€ · ${m.conv.toFixed(1)} conv · ROAS ${f(roas)}x · profit ${profit >= 0 ? "+" : ""}${f(profit)}€`;
  });
  const noData = ALL_MARKETS.filter((n) => !markets.some((m) => m.name === n));
  const estProfit = tVal * MARGIN - tCost;

  const fields: Array<{ name: string; value: string }> = [
    { name: "📊 Par marché (7j)", value: mLines.join("\n") || "Aucune dépense sur la période." },
    {
      name: "💸 Waste (≥4 clics, 0 conv) → ajouter en négatifs",
      value: waste.length ? cap(waste.map((w) => `${f(eur(w.cost))}€ · ${w.clicks}clk · \`${w.term}\` (${short(w.name)})`).join("\n")) : "Rien à signaler ✅",
    },
    {
      name: "✅ Top converters (7j) → vérifier qu'ils sont en mots-clés",
      value: winners.length ? cap(winners.map((w) => `${w.conv.toFixed(1)} conv · ${f(w.val)}€ · \`${w.term}\` (${short(w.name)})`).join("\n")) : "—",
    },
  ];
  if (noData.length) fields.push({ name: "⏳ En attente de données", value: noData.join(", ") });

  const embed = {
    title: "📈 Rapport quotidien — TikTok Search Terms",
    color: estProfit >= 0 ? 0x16a34a : 0xef4444,
    description: `**Total 7j** : ${f(tCost)}€ dépensé · ${tConv.toFixed(1)} conv · ${f(tVal)}€ valeur · profit estimé (marge ${Math.round(MARGIN * 100)}%) **${estProfit >= 0 ? "+" : ""}${f(estProfit)}€**`,
    fields,
    footer: { text: "Source: ad_costs_by_search_term · marge 85%" },
    timestamp: new Date().toISOString(),
  };

  const sent = await postDiscord(embed);
  return {
    sent,
    markets: markets.length,
    totalCostEur: Math.round(tCost * 100) / 100,
    totalConv: Math.round(tConv * 10) / 10,
    totalValueEur: Math.round(tVal * 100) / 100,
    estProfitEur: Math.round(estProfit * 100) / 100,
    wasteCount: waste.length,
    winnerCount: winners.length,
  };
}
