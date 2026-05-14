/**
 * Stripe dispute alerting.
 *
 * Disputes (chargebacks) need an immediate human response: every hour spent
 * unaware of one is an hour we could have used to fight it. We fan out the
 * alert to two independent channels so a single integration outage doesn't
 * silence the warning:
 *
 *   1. Discord webhook (instant Slack-like ping for whoever is on call)
 *   2. Admin email (durable record + accessible from any inbox)
 *
 * Both fire in parallel and never throw — failures are logged but do not
 * propagate, since the surrounding webhook handler must always answer 200
 * to Stripe to avoid retry storms.
 */

import Stripe from "stripe";
import { sendDisputeAlertEmail } from "./email";
import { getOrderByPaymentIntent } from "./db";

type DisputeEvent = "created" | "updated" | "closed" | "funds_withdrawn" | "funds_reinstated";

const EVENT_LABELS: Record<DisputeEvent, { title: string; color: number; severity: "critical" | "warning" | "info" }> = {
  created: { title: "🚨 Dispute Stripe ouvert", color: 0xef4444, severity: "critical" },
  updated: { title: "ℹ️ Dispute Stripe mis à jour", color: 0xf59e0b, severity: "warning" },
  closed: { title: "✅ Dispute Stripe clôturé", color: 0x6b7280, severity: "info" },
  funds_withdrawn: { title: "💸 Fonds retirés (chargeback)", color: 0xdc2626, severity: "critical" },
  funds_reinstated: { title: "💰 Fonds restitués (dispute won)", color: 0x16a34a, severity: "info" },
};

function fmtAmount(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null) return "—";
  const cur = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${cur}`;
  }
}

async function pingDiscord(dispute: Stripe.Dispute, event: DisputeEvent, orderId: number | null) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  const meta = EVENT_LABELS[event];
  const piId =
    typeof dispute.payment_intent === "string"
      ? dispute.payment_intent
      : dispute.payment_intent?.id || "—";

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: meta.severity === "critical" ? "@here" : undefined,
        embeds: [
          {
            title: meta.title,
            color: meta.color,
            fields: [
              { name: "Status", value: dispute.status || "—", inline: true },
              { name: "Reason", value: dispute.reason || "—", inline: true },
              { name: "Amount", value: fmtAmount(dispute.amount, dispute.currency), inline: true },
              { name: "Payment Intent", value: piId, inline: false },
              { name: "Order ID", value: orderId ? `#${orderId}` : "—", inline: true },
              {
                name: "Evidence due",
                value: dispute.evidence_details?.due_by
                  ? new Date(dispute.evidence_details.due_by * 1000).toISOString().slice(0, 10)
                  : "—",
                inline: true,
              },
              {
                name: "Dashboard",
                value: `[Open in Stripe](https://dashboard.stripe.com/disputes/${dispute.id})`,
                inline: false,
              },
            ],
            footer: { text: `dispute ${dispute.id} · ${event}` },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (err) {
    console.error("[disputeAlert] Discord error:", err);
  }
}

async function pingAdminEmail(dispute: Stripe.Dispute, event: DisputeEvent, orderId: number | null) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) return;

  try {
    await sendDisputeAlertEmail({
      to: adminEmail,
      event,
      severity: EVENT_LABELS[event].severity,
      disputeId: dispute.id,
      reason: dispute.reason || "—",
      status: dispute.status || "—",
      amountFormatted: fmtAmount(dispute.amount, dispute.currency),
      paymentIntentId:
        typeof dispute.payment_intent === "string"
          ? dispute.payment_intent
          : dispute.payment_intent?.id || "—",
      orderId,
      evidenceDueBy: dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000).toISOString().slice(0, 10)
        : null,
    });
  } catch (err) {
    console.error("[disputeAlert] email error:", err);
  }
}

/**
 * Notify all channels in parallel. Resolves once the slowest channel returns
 * (or fails). Caller can `await` it to keep the webhook handler open until
 * delivery, but must never let an error reach Stripe.
 */
export async function notifyDispute(dispute: Stripe.Dispute, event: DisputeEvent) {
  const piId =
    typeof dispute.payment_intent === "string"
      ? dispute.payment_intent
      : dispute.payment_intent?.id || "";

  let orderId: number | null = null;
  if (piId) {
    try {
      const order = await getOrderByPaymentIntent(piId);
      orderId = order?.id ?? null;
    } catch {
      // Non-blocking: alert still goes out without the internal order id.
    }
  }

  await Promise.allSettled([
    pingDiscord(dispute, event, orderId),
    pingAdminEmail(dispute, event, orderId),
  ]);
}

export type { DisputeEvent };
