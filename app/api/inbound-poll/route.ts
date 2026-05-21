import { NextRequest, NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import {
  getSupportMessageById,
  insertSupportReply,
  reopenSupportThread,
} from "@/app/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function stripQuotedHistory(text: string): string {
  if (!text) return "";

  const markers: RegExp[] = [
    /\n\s*On\s.+\swrote:\s*\n/i,
    /\n\s*Le\s.+a\s+écrit\s*:\s*\n/i,
    /\n\s*-+\s*Original Message\s*-+\s*\n/i,
    /\n\s*-+\s*Message d['’]origine\s*-+\s*\n/i,
    /\n\s*From:\s.+\n\s*Sent:\s/i,
    /\n\s*De\s*:\s.+\n\s*Envoyé\s*:/i,
  ];

  let cutoff = text.length;
  for (const re of markers) {
    const m = text.match(re);
    if (m && m.index !== undefined && m.index < cutoff) cutoff = m.index;
  }

  const quotedBlockMatch = text.match(/\n(?:>[^\n]*\n)+/);
  if (quotedBlockMatch && quotedBlockMatch.index !== undefined && quotedBlockMatch.index < cutoff) {
    cutoff = quotedBlockMatch.index;
  }

  return text.slice(0, cutoff).trim();
}

/**
 * Try to extract the thread root id from a reply.
 * Priority:
 *   1. Plus-addressing in the To/Cc headers ("support+123@fanovera.com").
 *   2. Hidden token in the body ("[fanovera-thread:123]") — works even when
 *      the mail server strips plus-addressing or the client mangles the To.
 */
function extractThreadId(opts: { recipients: string[]; rawText: string }): number | null {
  for (const addr of opts.recipients) {
    if (!addr) continue;
    const m = addr.toLowerCase().match(/[a-z0-9._-]+\+(\d+)@/);
    if (m) return Number(m[1]);
  }
  const tokenMatch = opts.rawText.match(/\[fanovera-thread:(\d+)\]/i);
  if (tokenMatch) return Number(tokenMatch[1]);
  return null;
}

function authorize(req: NextRequest): boolean {
  const expected = process.env.INBOUND_POLL_TOKEN;
  if (!expected) return false;
  const headerToken = req.headers.get("x-poll-token");
  const queryToken = new URL(req.url).searchParams.get("token");
  return headerToken === expected || queryToken === expected;
}

async function pollOnce() {
  const host = process.env.IONOS_IMAP_HOST;
  const user = process.env.IONOS_IMAP_USER;
  const pass = process.env.IONOS_IMAP_PASS;
  const portStr = process.env.IONOS_IMAP_PORT;
  const port = portStr ? Number(portStr) : 993;

  if (!host || !user || !pass) {
    throw new Error("IMAP credentials missing (IONOS_IMAP_HOST / USER / PASS)");
  }

  const client = new ImapFlow({
    host,
    port,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  const stats = { fetched: 0, matched: 0, unmatched: 0, errors: 0 };

  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      // UIDs of unseen messages
      const uids = await client.search({ seen: false }, { uid: true });
      if (!uids || uids.length === 0) return stats;

      for (const uid of uids) {
        stats.fetched++;
        try {
          const msg = await client.fetchOne(uid, { source: true }, { uid: true });
          if (!msg || !msg.source) {
            stats.errors++;
            continue;
          }

          const parsed = await simpleParser(msg.source);

          const toList: string[] = [];
          const collect = (val: unknown) => {
            if (!val) return;
            if (Array.isArray(val)) {
              for (const v of val) collect(v);
              return;
            }
            const obj = val as { value?: Array<{ address?: string }>; text?: string };
            if (obj.value) {
              for (const v of obj.value) {
                if (v.address) toList.push(v.address);
              }
            } else if (obj.text) {
              toList.push(obj.text);
            }
          };
          collect(parsed.to);
          collect(parsed.cc);
          collect(parsed.bcc);
          const deliveredTo = parsed.headers.get("delivered-to") || parsed.headers.get("x-original-to");
          if (typeof deliveredTo === "string") toList.push(deliveredTo);

          const rawText = (parsed.text || parsed.html || "").toString();
          const threadId = extractThreadId({ recipients: toList, rawText });

          if (!threadId) {
            stats.unmatched++;
            console.warn(
              "[inbound-poll] No thread id, leaving unseen. UID=",
              uid,
              "to=",
              JSON.stringify(toList),
            );
            continue;
          }

          const thread = await getSupportMessageById(threadId);
          if (!thread) {
            stats.unmatched++;
            console.warn("[inbound-poll] Thread not found:", threadId, "UID=", uid);
            // Mark as seen anyway so we don't keep retrying
            await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
            continue;
          }

          const fromAddr = parsed.from?.value?.[0]?.address || thread.email;
          const cleanBody = stripQuotedHistory(rawText) || `(${parsed.subject || "no content"})`;

          await insertSupportReply({
            parentId: threadId,
            senderType: "client",
            email: fromAddr,
            message: cleanBody,
          });
          await reopenSupportThread(threadId);
          await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
          stats.matched++;
        } catch (err) {
          stats.errors++;
          console.error("[inbound-poll] Error processing UID", uid, err);
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => { /* ignore */ });
  }

  return stats;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const stats = await pollOnce();
    return NextResponse.json({ ok: true, ...stats });
  } catch (err) {
    console.error("[inbound-poll] Fatal:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Polling failed" },
      { status: 500 },
    );
  }
}

// Allow POST too so cron services that only support POST can hit it.
export const POST = GET;
