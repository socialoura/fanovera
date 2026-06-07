import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  ensureOutreachSchema,
  createOutreachCampaign,
  addOutreachRecipient,
  markOutreachRecipientSent,
  markOutreachRecipientError,
  getOutreachCampaigns,
  getOutreachRecipientById,
  getOutreachCampaignById,
} from "@/app/lib/db";
import { RESEND_FROM } from "@/app/lib/email";
import { pollInboundMail } from "@/app/lib/inboundMailPoll";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

// Reply-To = the flat IONOS inbox the IMAP poller drains. The hidden
// `[fanovera-outreach:<rid>]` token below ties each reply back to its recipient.
const INBOUND_ADDRESS_BASE = process.env.SUPPORT_INBOUND_ADDRESS || "support@fanovera.com";

// Throttle opportunistic IMAP polling on the Outreach GET, mirroring the
// support route — avoids hammering the mailbox on rapid tab refreshes.
let lastOpportunisticPollAt = 0;
const OPPORTUNISTIC_POLL_MS = 30_000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Resend caps the default plan at 5 requests/second. We send well under that
// (≈4.5/s) so a campaign never trips the rate limiter.
const SEND_THROTTLE_MS = 220;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Send one outreach email to an existing recipient row and record the outcome.
 * Shared by the initial campaign blast (POST) and the per-recipient retry
 * (PATCH). Never throws — failures are persisted as the recipient's status.
 */
async function sendOutreachTo(
  resend: Resend,
  opts: { recipientId: number; email: string; subject: string; body: string },
): Promise<{ ok: boolean; error?: string }> {
  const token = `[fanovera-outreach:${opts.recipientId}]`;
  const escapedBody = escapeHtml(opts.body).replace(/\n/g, "<br>");
  try {
    const result = await resend.emails.send({
      from: RESEND_FROM,
      to: opts.email,
      replyTo: INBOUND_ADDRESS_BASE,
      subject: opts.subject,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a2e; line-height: 1.6; font-size: 14px;">
          ${escapedBody}
          <div style="color: #f9fafb; font-size: 10px; line-height: 1; margin-top: 24px; user-select: none;">
            ${token}
          </div>
        </div>
      `,
      text: `${opts.body}\n\n${token}`,
    });

    if (result.error) {
      const msg = result.error.message || "send error";
      await markOutreachRecipientError(opts.recipientId, msg);
      console.error("[admin/outreach] Resend error for", opts.email, JSON.stringify(result.error));
      return { ok: false, error: msg };
    }
    await markOutreachRecipientSent(opts.recipientId);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markOutreachRecipientError(opts.recipientId, msg);
    console.error("[admin/outreach] send threw for", opts.email, err);
    return { ok: false, error: msg };
  }
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  await ensureOutreachSchema();

  // Drain the IONOS inbox so new replies surface without waiting for a cron.
  // The shared poller routes outreach-tokened mail to the outreach tables.
  const now = Date.now();
  if (now - lastOpportunisticPollAt > OPPORTUNISTIC_POLL_MS) {
    lastOpportunisticPollAt = now;
    try {
      await pollInboundMail();
    } catch (err) {
      console.error("[admin/outreach] inbound poll failed:", err);
    }
  }

  const campaigns = await getOutreachCampaigns();
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.body === "string" ? body.body.trim() : "";
  const rawEmails: unknown = body.emails;

  if (!subject || !message) {
    return NextResponse.json({ error: "subject and body required" }, { status: 400 });
  }

  // Accept either an array of strings or a single blob split on newlines/commas/semicolons.
  let emailList: string[];
  if (Array.isArray(rawEmails)) {
    emailList = rawEmails.map((e) => String(e));
  } else if (typeof rawEmails === "string") {
    emailList = rawEmails.split(/[\n,;]+/);
  } else {
    return NextResponse.json({ error: "emails required" }, { status: 400 });
  }

  // Normalize, validate, dedupe (case-insensitive).
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const raw of emailList) {
    const e = raw.trim();
    if (!e) continue;
    const lower = e.toLowerCase();
    if (seen.has(lower)) continue;
    if (!EMAIL_RE.test(e)) continue;
    seen.add(lower);
    emails.push(e);
  }

  if (emails.length === 0) {
    return NextResponse.json({ error: "no valid email addresses" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  await ensureOutreachSchema();
  const resend = new Resend(resendKey);

  const campaignId = await createOutreachCampaign({ subject, body: message });

  let sent = 0;
  let failed = 0;

  // Throttled sequential send: stays under Resend's 5 req/s cap and records a
  // precise per-recipient status so failures can be retried individually.
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    const recipientId = await addOutreachRecipient({ campaignId, email });
    const res = await sendOutreachTo(resend, { recipientId, email, subject, body: message });
    if (res.ok) sent++;
    else failed++;
    if (i < emails.length - 1) await sleep(SEND_THROTTLE_MS);
  }

  return NextResponse.json({ success: true, campaignId, sent, failed, total: emails.length });
}

// Retry a single recipient that previously failed (e.g. hit the Resend rate
// limit). Re-sends with the recipient's existing token so any later reply still
// matches the right row.
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const recipientId = Number(body.recipientId);
  if (!recipientId) {
    return NextResponse.json({ error: "recipientId required" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  await ensureOutreachSchema();

  const recipient = await getOutreachRecipientById(recipientId);
  if (!recipient) {
    return NextResponse.json({ error: "recipient not found" }, { status: 404 });
  }
  const campaign = await getOutreachCampaignById(recipient.campaign_id);
  if (!campaign) {
    return NextResponse.json({ error: "campaign not found" }, { status: 404 });
  }

  const resend = new Resend(resendKey);
  const res = await sendOutreachTo(resend, {
    recipientId,
    email: recipient.email,
    subject: campaign.subject,
    body: campaign.body,
  });

  if (!res.ok) {
    return NextResponse.json({ error: res.error || "send failed" }, { status: 502 });
  }
  return NextResponse.json({ success: true });
}
