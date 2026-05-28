import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  getSupportThreads,
  getSupportMessageById,
  insertSupportReply,
  markThreadReplied,
  reopenSupportThread,
} from "@/app/lib/db";
import { RESEND_FROM } from "@/app/lib/email";
import { pollInboundMail } from "@/app/lib/inboundMailPoll";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

// Throttle Ionos IMAP polling on the admin support GET to avoid hammering
// the mailbox when the operator refreshes the tab in quick succession.
// Module-level state is per Lambda instance — acceptable since each instance
// will at worst poll once per OPPORTUNISTIC_POLL_MS.
let lastOpportunisticPollAt = 0;
const OPPORTUNISTIC_POLL_MS = 30_000;

// Plus-addressed alias on the existing IONOS mailbox. The IMAP poller
// extracts the thread id from the local part. A hidden token in the email
// body acts as a fallback if the mail server strips plus-addressing.
const INBOUND_ADDRESS_BASE = process.env.SUPPORT_INBOUND_ADDRESS || "support@fanovera.com";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  // Opportunistic IMAP drain: every time the operator opens the Support tab
  // we drain the IONOS inbox so new client emails surface without waiting
  // for an external cron. Throttled to OPPORTUNISTIC_POLL_MS per Lambda
  // instance to keep refresh-button mashing cheap. Fail-soft: if IMAP is
  // misconfigured or unreachable, we still return the existing threads.
  const now = Date.now();
  if (now - lastOpportunisticPollAt > OPPORTUNISTIC_POLL_MS) {
    lastOpportunisticPollAt = now;
    try {
      await pollInboundMail();
    } catch (err) {
      console.error("[admin/support] inbound poll failed:", err);
    }
  }

  const threads = await getSupportThreads();
  return NextResponse.json(threads);
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const { id, resolved } = body as { id?: number | string; resolved?: boolean };

  if (!id || typeof resolved !== "boolean") {
    return NextResponse.json({ error: "id and resolved required" }, { status: 400 });
  }

  const msg = await getSupportMessageById(Number(id));
  if (!msg) {
    return NextResponse.json({ error: "message not found" }, { status: 404 });
  }
  const rootId = msg.parent_id ? Number(msg.parent_id) : Number(msg.id);

  if (resolved) {
    await markThreadReplied(rootId, "");
  } else {
    await reopenSupportThread(rootId);
  }
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  const body = await req.json();
  const { id, replyText } = body;

  if (!id || !replyText?.trim()) {
    return NextResponse.json({ error: "id and replyText required" }, { status: 400 });
  }

  const msg = await getSupportMessageById(Number(id));
  if (!msg) {
    return NextResponse.json({ error: "message not found" }, { status: 404 });
  }

  // The id we receive is always the THREAD ROOT id (cards only ever expose the root).
  const rootId = msg.parent_id ? Number(msg.parent_id) : Number(msg.id);

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const trimmedReply = replyText.trim();
  const isEnglish = /^(hello|hi|hey|good\s+(morning|afternoon|evening))[,\s]/i.test(trimmedReply);
  const subject = isEnglish ? "Re: your request — Fanovera" : "Réponse à votre demande — Fanovera";
  const escapedReply = trimmedReply
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  // Reply-To = flat support address (IONOS doesn't support plus-addressing).
  // Thread identification relies on the hidden token below, which mail clients
  // preserve when quoting the original email in the reply.
  const replyToAddr = INBOUND_ADDRESS_BASE;
  const threadToken = `[fanovera-thread:${rootId}]`;

  try {
    const resend = new Resend(resendKey);
    const result = await resend.emails.send({
      from: RESEND_FROM,
      to: msg.email,
      replyTo: replyToAddr,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #1a1a2e; line-height: 1.6; font-size: 14px;">
          ${escapedReply}
          <div style="color: #f9fafb; font-size: 10px; line-height: 1; margin-top: 24px; user-select: none;">
            ${threadToken}
          </div>
        </div>
      `,
      text: `${trimmedReply}\n\n${threadToken}`,
    });

    if (result.error) {
      console.error(
        "[admin/support] Resend error:",
        JSON.stringify(result.error),
        "| from =",
        JSON.stringify(RESEND_FROM),
      );
      return NextResponse.json(
        { error: "Failed to send email", detail: result.error.message, from: RESEND_FROM },
        { status: 502 },
      );
    }

    await insertSupportReply({
      parentId: rootId,
      senderType: "admin",
      email: msg.email,
      message: trimmedReply,
    });
    await markThreadReplied(rootId, trimmedReply);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(
      "[admin/support] Error:",
      err,
      "| from =",
      JSON.stringify(RESEND_FROM),
    );
    return NextResponse.json(
      { error: "Failed to send email", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
