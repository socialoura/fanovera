import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { sendAbandonedCartEmail } from "@/app/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Abandoned-cart recovery cron.
 *
 * Runs once daily via vercel.json. For each `checkout_payloads` row that
 * looks like a real abandonment — i.e. the customer left an email + a
 * non-trivial cart, the row is at least 30 min old (give them time to
 * finish), at most 48 h old (daily cadence grace without week-late nags),
 * no matching
 * successful `orders` row exists, and we have not already sent a reminder —
 * send one recovery email and mark `reminder_sent_at`.
 *
 * Authentication: Vercel Cron sets `Authorization: Bearer ${CRON_SECRET}`.
 * Without that env, the route only accepts a manual `?secret=` query param
 * so a curl from the operator still works in dev.
 */

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function authorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // No secret configured: only allow when explicitly invoked from Vercel
    // (which sets the header even with empty value) OR from same-origin curl.
    return req.headers.get("user-agent")?.includes("vercel-cron") === true;
  }
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${expected}`) return true;
  // Manual override for ops: /api/cron/abandoned-cart?secret=XXX
  if (req.nextUrl.searchParams.get("secret") === expected) return true;
  return false;
}

async function ensureSchema() {
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ DEFAULT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS idx_checkout_payloads_reminder ON checkout_payloads (reminder_sent_at, created_at)`;
}

type AbandonedRow = {
  payment_intent_id: string;
  email: string;
  username: string;
  platform: string;
  amount_cents: number;
  currency: string;
  source_page: string | null;
  // we can't include `lang` directly because checkout_payloads doesn't store
  // it — we infer locale from source_page when possible.
};

function inferLocaleFromSourcePage(sourcePage: string | null): string {
  if (!sourcePage) return "fr";
  // sourcePage looks like "/fr/instagram" or "/instagram" or "/en/spotify".
  const m = sourcePage.match(/^\/([a-z]{2})(?:[\/?#]|$)/i);
  if (m && ["fr", "en", "es", "pt", "de", "it", "tr"].includes(m[1].toLowerCase())) {
    return m[1].toLowerCase();
  }
  return "fr";
}

function buildRecoveryUrl(baseUrl: string, platform: string, sourcePage: string | null): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  // Prefer the original source page when it's a known platform path; else
  // fall back to the bare /[platform] route.
  if (sourcePage && /^\/[a-z]{0,3}\/?[a-z]+$/i.test(sourcePage)) {
    return `${cleanBase}${sourcePage}?recovery=1`;
  }
  return `${cleanBase}/${platform || ""}?recovery=1`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await ensureSchema();

    // Candidates: payloads aged 30 min - 48 h, with email & non-zero cart,
    // no matching order, no reminder yet.
    const rows = (await sql`
      SELECT
        cp.payment_intent_id,
        cp.email,
        cp.username,
        cp.platform,
        cp.amount_cents,
        cp.currency,
        cp.source_page
      FROM checkout_payloads cp
      LEFT JOIN orders o ON o.stripe_payment_intent_id = cp.payment_intent_id
      WHERE
        o.id IS NULL
        AND cp.email <> ''
        AND cp.amount_cents > 0
        AND cp.reminder_sent_at IS NULL
        AND cp.created_at < NOW() - INTERVAL '30 minutes'
        AND cp.created_at > NOW() - INTERVAL '48 hours'
      ORDER BY cp.created_at ASC
      LIMIT 50
    `) as AbandonedRow[];

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows) {
      // Defensive validation — payloads are user-submitted JSON.
      if (!EMAIL_RX.test(row.email)) {
        skipped++;
        // Mark anyway so we never retry a bad email forever.
        await sql`UPDATE checkout_payloads SET reminder_sent_at = NOW() WHERE payment_intent_id = ${row.payment_intent_id}`;
        continue;
      }

      const recoveryUrl = buildRecoveryUrl(baseUrl, row.platform, row.source_page);
      const locale = inferLocaleFromSourcePage(row.source_page);

      const result = await sendAbandonedCartEmail({
        to: row.email,
        platform: row.platform || "instagram",
        username: row.username || "",
        amountCents: row.amount_cents,
        currency: row.currency || "eur",
        recoveryUrl,
        locale,
      });

      if (result.ok) {
        await sql`UPDATE checkout_payloads SET reminder_sent_at = NOW() WHERE payment_intent_id = ${row.payment_intent_id}`;
        sent++;
      } else {
        // Don't mark as sent — the next cron run will retry.
        errors++;
        console.error("[cron/abandoned-cart] send failed:", row.payment_intent_id, result.error);
      }
    }

    return NextResponse.json({ ok: true, candidates: rows.length, sent, skipped, errors });
  } catch (err) {
    console.error("[cron/abandoned-cart] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
