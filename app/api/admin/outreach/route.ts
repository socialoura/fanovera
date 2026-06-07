import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  ensureOutreachSchema,
  createOutreachCampaign,
  addOutreachRecipient,
  markOutreachRecipientSent,
  markOutreachRecipientError,
  getOutreachCampaigns,
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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

  const escapedBody = escapeHtml(message).replace(/\n/g, "<br>");

  let sent = 0;
  let failed = 0;

  // Sequential send: the lists here are small (a handful to a few dozen) and
  // sequential keeps us well clear of Resend rate limits while letting us
  // record a precise per-recipient status.
  for (const email of emails) {
    const recipientId = await addOutreachRecipient({ campaignId, email });
    const token = `[fanovera-outreach:${recipientId}]`;
    try {
      const result = await resend.emails.send({
        from: RESEND_FROM,
        to: email,
        replyTo: INBOUND_ADDRESS_BASE,
        subject,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a2e; line-height: 1.6; font-size: 14px;">
            ${escapedBody}
            <div style="color: #f9fafb; font-size: 10px; line-height: 1; margin-top: 24px; user-select: none;">
              ${token}
            </div>
          </div>
        `,
        text: `${message}\n\n${token}`,
      });

      if (result.error) {
        failed++;
        await markOutreachRecipientError(recipientId, result.error.message || "send error");
        console.error("[admin/outreach] Resend error for", email, JSON.stringify(result.error));
      } else {
        sent++;
        await markOutreachRecipientSent(recipientId);
      }
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      await markOutreachRecipientError(recipientId, msg);
      console.error("[admin/outreach] send threw for", email, err);
    }
  }

  return NextResponse.json({ success: true, campaignId, sent, failed, total: emails.length });
}
