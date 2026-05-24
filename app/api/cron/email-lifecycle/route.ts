import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { sendLifecycleEmail, type LifecycleKind } from "@/app/lib/email";
import { getDominantService } from "@/app/lib/serviceClassification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lifecycle email cron — daily.
 *
 * Reads the admin-configured `email_flows` rows and, for each enabled flow,
 * fires the right reminder:
 *
 *  - `post_purchase_*`: looks at orders whose payment landed `delay_hours`
 *    ago (± 12 h to absorb the once-a-day cadence). Per-order dedupe via
 *    `email_flow_runs(flow_key, order_id)` UNIQUE.
 *
 *  - `win_back_*`: looks at customers whose MOST RECENT order is `delay_hours`
 *    old. Same per-order dedupe — if the same email later orders again, the
 *    most-recent order changes and a future win-back can still fire later.
 *
 * The cross-sell flow (`confirmation_crosssell`) is NOT processed here — it
 * runs inline inside `ensureOrderForPaymentIntent` so the discount block
 * lands in the confirmation email itself.
 *
 * Auth: Vercel Cron sets `Authorization: Bearer ${CRON_SECRET}`. Manual ops:
 * `/api/cron/email-lifecycle?secret=XXX`.
 */

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

type FlowConfig = {
  key: string;
  group_key: string;
  active: boolean;
  delay_hours: number;
  discount_pct: number;
  subject_fr: string;
  subject_en: string;
  min_order_cents: number;
};

type OrderRow = {
  id: number;
  email: string;
  username: string;
  platform: string;
  lang: string;
  total_cents: number;
  created_at: string;
  cart: unknown;
};

async function processPostPurchase(flow: FlowConfig): Promise<{ sent: number; skipped: number; errors: number }> {
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  // Window: orders paid exactly `delay_hours` ago, ±12h slack to catch every
  // order even with a once-a-day cadence. Status must be paid/delivered (no
  // pending, no refunded). Skip rows we already mailed for this flow.
  const rows = (await sql`
    SELECT o.id, o.email, o.username, o.platform, o.lang, o.total_cents, o.created_at, o.cart
    FROM orders o
    WHERE o.status IN ('paid', 'delivered')
      AND o.email <> ''
      AND COALESCE(o.refunded_amount_cents, 0) < o.total_cents
      AND o.total_cents >= ${flow.min_order_cents}
      AND o.created_at <= NOW() - (${flow.delay_hours}::text || ' hours')::interval + INTERVAL '12 hours'
      AND o.created_at >= NOW() - (${flow.delay_hours}::text || ' hours')::interval - INTERVAL '12 hours'
      AND NOT EXISTS (
        SELECT 1 FROM email_flow_runs r
        WHERE r.flow_key = ${flow.key} AND r.order_id = o.id
      )
    ORDER BY o.created_at DESC
    LIMIT 200
  `) as OrderRow[];

  for (const order of rows) {
    if (!EMAIL_RX.test(order.email)) {
      skipped++;
      continue;
    }
    const delta = await fireLifecycle(flow, order);
    sent += delta.sent;
    skipped += delta.skipped;
    errors += delta.errors;
  }

  return { sent, skipped, errors };
}

async function processWinBack(flow: FlowConfig): Promise<{ sent: number; skipped: number; errors: number }> {
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  // Per-email aggregation: only the MOST RECENT order matters for win-back.
  // If the customer placed a fresher order in the meantime, they're not
  // inactive and we skip them naturally because the most-recent order is
  // newer than the delay window.
  const rows = (await sql`
    WITH latest_per_email AS (
      SELECT DISTINCT ON (LOWER(email)) id, email, username, platform, lang, total_cents, created_at, cart
      FROM orders
      WHERE status IN ('paid', 'delivered')
        AND email <> ''
        AND COALESCE(refunded_amount_cents, 0) < total_cents
      ORDER BY LOWER(email), created_at DESC
    )
    SELECT l.id, l.email, l.username, l.platform, l.lang, l.total_cents, l.created_at, l.cart
    FROM latest_per_email l
    WHERE l.total_cents >= ${flow.min_order_cents}
      AND l.created_at <= NOW() - (${flow.delay_hours}::text || ' hours')::interval + INTERVAL '12 hours'
      AND l.created_at >= NOW() - (${flow.delay_hours}::text || ' hours')::interval - INTERVAL '12 hours'
      AND NOT EXISTS (
        SELECT 1 FROM email_flow_runs r
        WHERE r.flow_key = ${flow.key} AND LOWER(r.email) = LOWER(l.email)
      )
    LIMIT 200
  `) as OrderRow[];

  for (const order of rows) {
    if (!EMAIL_RX.test(order.email)) {
      skipped++;
      continue;
    }
    const delta = await fireLifecycle(flow, order);
    sent += delta.sent;
    skipped += delta.skipped;
    errors += delta.errors;
  }

  return { sent, skipped, errors };
}

async function fireLifecycle(
  flow: FlowConfig,
  order: OrderRow,
): Promise<{ sent: number; skipped: number; errors: number }> {
  const subject =
    order.lang === "en" ? flow.subject_en : flow.subject_fr;

  // Pull the dominant service from the order's cart so the email copy reads
  // "your streams" for Spotify customers, not "your followers" by default.
  const dominantService = getDominantService(order.cart);

  const result = await sendLifecycleEmail({
    to: order.email,
    kind: flow.key as LifecycleKind,
    platform: order.platform,
    username: order.username,
    service: dominantService,
    discountPct: flow.discount_pct,
    customSubject: subject,
    locale: order.lang,
  });

  if (!result.ok) {
    console.error(`[cron/email-lifecycle] ${flow.key} send failed for order #${order.id}:`, result.error);
    return { sent: 0, skipped: 0, errors: 1 };
  }

  try {
    await sql`
      INSERT INTO email_flow_runs (flow_key, order_id, email, promo_code)
      VALUES (${flow.key}, ${order.id}, ${order.email}, ${result.code || ""})
      ON CONFLICT (flow_key, order_id) DO NOTHING
    `;
  } catch (insErr) {
    // The email already went out. Logging the dedupe failure is enough — we
    // don't want to retry the send.
    console.error(`[cron/email-lifecycle] dedupe insert failed for ${flow.key} #${order.id}:`, insErr);
  }

  return { sent: 1, skipped: 0, errors: 0 };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const flows = (await sql`
      SELECT key, group_key, active, delay_hours, discount_pct,
             subject_fr, subject_en, min_order_cents
      FROM email_flows
      WHERE active = true
        AND group_key IN ('post_purchase', 'winback')
    `) as FlowConfig[];

    const summary: Record<string, { sent: number; skipped: number; errors: number }> = {};

    for (const flow of flows) {
      if (flow.group_key === "post_purchase") {
        summary[flow.key] = await processPostPurchase(flow);
      } else if (flow.group_key === "winback") {
        summary[flow.key] = await processWinBack(flow);
      }
    }

    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    console.error("[cron/email-lifecycle] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
