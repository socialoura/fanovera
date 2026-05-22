/**
 * Daily ROAS health alerts.
 *
 * Sources:
 *   - ad_costs_by_campaign (last 7 days)
 *   - first-touch LTV revenue from acquired customers (last 7 days, net of refunds)
 *
 * Rules (per campaign with cost > €5 over 7 days):
 *   - ROAS < 1.0  → 🔴 LOSER alert (campaign burning money)
 *   - ROAS > 4.0  → 🟢 SCALE alert (consider increasing budget)
 *   - refund rate > 15% (within campaign's acquired customers) → ⚠️ QUALITY alert
 *
 * Channels: Discord webhook + admin email, same fan-out pattern as
 * `disputeAlert.ts`. Failures are logged and never thrown — the cron must
 * always return 200 to Vercel even when notifications fail.
 *
 * Anti-spam: we suppress duplicate alerts of the same kind for the same
 * campaign for 24h, using a small `ad_alert_dedupe` table.
 */

import { sql } from "@/app/lib/db";
import { Resend } from "resend";

const PAID_STATUSES = ["paid", "processing", "delivered", "partial_refund", "refunded"];

const MIN_COST_CENTS = 500; // €5 minimum spend over 7d before alerting
const LOSER_ROAS = 1.0;
const SCALE_ROAS = 4.0;
const REFUND_RATE_THRESHOLD = 0.15;

export type AdAlertKind = "loser" | "scale" | "quality";

export type AdAlert = {
  kind: AdAlertKind;
  campaignId: string;
  campaignName: string;
  costCents: number;
  revenueCents: number;
  refundedCents: number;
  realOrders: number;
  roas: number | null;
  refundRate: number;
};

async function ensureDedupeTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS ad_alert_dedupe (
      campaign_id BIGINT NOT NULL,
      kind VARCHAR(20) NOT NULL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (campaign_id, kind)
    )
  `;
}

/**
 * Pulls 7-day metrics by campaign and returns any alert-worthy rows.
 * Does not touch the dedupe table — that's done by `markAlertSent`.
 */
export async function computeAdAlerts(): Promise<AdAlert[]> {
  await ensureDedupeTable();

  const rows = await sql`
    WITH window_costs AS (
      SELECT
        campaign_id,
        MAX(campaign_name) AS campaign_name,
        SUM(cost_cents)::bigint AS cost_cents
      FROM ad_costs_by_campaign
      WHERE date >= CURRENT_DATE - INTERVAL '7 day'
      GROUP BY campaign_id
    ),
    customer_acquisitions AS (
      SELECT DISTINCT ON (LOWER(TRIM(o.email)))
        LOWER(TRIM(o.email)) AS email_key,
        gcm.campaign_id
      FROM orders o
      JOIN checkout_payloads cp ON cp.payment_intent_id = o.stripe_payment_intent_id
      JOIN gclid_campaign_map gcm ON gcm.gclid = cp.gclid
      WHERE cp.gclid <> ''
        AND o.email <> ''
        AND o.status = ANY(${PAID_STATUSES})
      ORDER BY LOWER(TRIM(o.email)), o.created_at ASC
    ),
    revenue AS (
      SELECT
        ca.campaign_id,
        COUNT(DISTINCT o2.id)::int AS real_orders,
        SUM(GREATEST(0, o2.total_cents - o2.refunded_amount_cents))::bigint AS revenue_cents,
        SUM(o2.refunded_amount_cents)::bigint AS refunded_cents
      FROM customer_acquisitions ca
      JOIN orders o2 ON LOWER(TRIM(o2.email)) = ca.email_key
      WHERE o2.status = ANY(${PAID_STATUSES})
        AND o2.created_at >= CURRENT_DATE - INTERVAL '7 day'
      GROUP BY ca.campaign_id
    )
    SELECT
      wc.campaign_id::text AS campaign_id,
      wc.campaign_name,
      wc.cost_cents,
      COALESCE(rv.revenue_cents, 0)::bigint AS revenue_cents,
      COALESCE(rv.refunded_cents, 0)::bigint AS refunded_cents,
      COALESCE(rv.real_orders, 0)::int AS real_orders
    FROM window_costs wc
    LEFT JOIN revenue rv ON rv.campaign_id = wc.campaign_id
    WHERE wc.cost_cents >= ${MIN_COST_CENTS}::bigint
  `;

  const alerts: AdAlert[] = [];
  for (const r of rows) {
    const costCents = Number(r.cost_cents) || 0;
    const revenueCents = Number(r.revenue_cents) || 0;
    const refundedCents = Number(r.refunded_cents) || 0;
    const realOrders = Number(r.real_orders) || 0;
    const roas = costCents > 0 ? revenueCents / costCents : null;
    const refundRate = revenueCents + refundedCents > 0 ? refundedCents / (revenueCents + refundedCents) : 0;
    const base = {
      campaignId: String(r.campaign_id),
      campaignName: String(r.campaign_name || ""),
      costCents,
      revenueCents,
      refundedCents,
      realOrders,
      roas,
      refundRate,
    };
    if (roas != null && roas < LOSER_ROAS) alerts.push({ ...base, kind: "loser" });
    else if (roas != null && roas > SCALE_ROAS) alerts.push({ ...base, kind: "scale" });
    if (refundRate > REFUND_RATE_THRESHOLD && refundedCents > 0) alerts.push({ ...base, kind: "quality" });
  }
  return alerts;
}

/** Returns only the alerts that haven't been sent for the same (campaign, kind) in the last 24h. */
export async function filterAlreadySent(alerts: AdAlert[]): Promise<AdAlert[]> {
  if (alerts.length === 0) return [];
  const dedupeRows = await sql`
    SELECT campaign_id::text AS campaign_id, kind
    FROM ad_alert_dedupe
    WHERE sent_at > NOW() - INTERVAL '24 hour'
  `;
  const sent = new Set(dedupeRows.map((d) => `${d.campaign_id}::${d.kind}`));
  return alerts.filter((a) => !sent.has(`${a.campaignId}::${a.kind}`));
}

export async function markAlertSent(alert: AdAlert) {
  await sql`
    INSERT INTO ad_alert_dedupe (campaign_id, kind, sent_at)
    VALUES (${alert.campaignId}::bigint, ${alert.kind}, NOW())
    ON CONFLICT (campaign_id, kind) DO UPDATE SET sent_at = NOW()
  `;
}

const KIND_META: Record<AdAlertKind, { emoji: string; title: string; color: number }> = {
  loser: { emoji: "🔴", title: "Campagne en perte (ROAS < 1× sur 7j)", color: 0xef4444 },
  scale: { emoji: "🚀", title: "Campagne rentable (ROAS > 4× sur 7j)", color: 0x16a34a },
  quality: { emoji: "⚠️", title: "Refunds élevés sur la cohorte (> 15%)", color: 0xf59e0b },
};

function eur(c: number) {
  return (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

async function pingDiscord(alert: AdAlert) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  const meta = KIND_META[alert.kind];
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: `${meta.emoji} ${meta.title}`,
            color: meta.color,
            fields: [
              { name: "Campagne", value: alert.campaignName || `#${alert.campaignId}`, inline: false },
              { name: "Dépense 7j", value: eur(alert.costCents), inline: true },
              { name: "Revenu net 7j", value: eur(alert.revenueCents), inline: true },
              { name: "ROAS", value: alert.roas == null ? "—" : `${alert.roas.toFixed(2)}×`, inline: true },
              { name: "Commandes", value: String(alert.realOrders), inline: true },
              { name: "Refund rate", value: `${(alert.refundRate * 100).toFixed(1)}%`, inline: true },
              {
                name: "Action",
                value:
                  alert.kind === "loser"
                    ? "Considérer pause ou refonte des créas / mots-clés"
                    : alert.kind === "scale"
                      ? "Augmenter le budget ou les enchères max"
                      : "Vérifier la qualité du trafic / clarté de l'offre",
                inline: false,
              },
            ],
            footer: { text: `Campaign ${alert.campaignId} · ${alert.kind}` },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (err) {
    console.error("[adsAlerts] Discord error:", err);
  }
}

async function pingEmail(alerts: AdAlert[]) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Fanovera <noreply@fanovera.com>";
  if (!to || !apiKey || alerts.length === 0) return;

  const resend = new Resend(apiKey);
  const subject = `[Ads ROAS] ${alerts.length} alerte${alerts.length > 1 ? "s" : ""} sur 7j`;
  const lines = alerts.map((a) => {
    const meta = KIND_META[a.kind];
    return `${meta.emoji} ${a.campaignName || `#${a.campaignId}`}
   ${meta.title}
   Dépense 7j : ${eur(a.costCents)} · Revenu net 7j : ${eur(a.revenueCents)} · ROAS : ${a.roas == null ? "—" : `${a.roas.toFixed(2)}×`}
   Commandes : ${a.realOrders} · Refund : ${(a.refundRate * 100).toFixed(1)}%
`;
  });
  const text = `${subject}

${lines.join("\n")}

Voir l'admin : ${process.env.NEXT_PUBLIC_APP_URL || "https://www.fanovera.com"}/admin
`;
  try {
    await resend.emails.send({ from, to, subject, text });
  } catch (err) {
    console.error("[adsAlerts] email error:", err);
  }
}

/** Compute, dedupe, send. Returns the alerts that were actually dispatched. */
export async function runAdRoasAlerts(): Promise<{ dispatched: AdAlert[]; skipped: number; total: number }> {
  const all = await computeAdAlerts();
  const fresh = await filterAlreadySent(all);
  if (fresh.length === 0) {
    return { dispatched: [], skipped: all.length, total: all.length };
  }

  // Discord: one ping per alert (so it shows up as multiple embeds in the channel)
  // Email: one digest grouping all alerts (so the inbox doesn't get spammed)
  await Promise.allSettled(fresh.map((a) => pingDiscord(a)));
  await pingEmail(fresh);
  for (const a of fresh) {
    try {
      await markAlertSent(a);
    } catch (err) {
      console.error("[adsAlerts] markAlertSent failed for", a.campaignId, a.kind, err);
    }
  }

  return { dispatched: fresh, skipped: all.length - fresh.length, total: all.length };
}
