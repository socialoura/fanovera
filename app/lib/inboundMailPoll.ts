import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import {
  getSupportMessageById,
  insertSupportReply,
  reopenSupportThread,
  sql,
} from "./db";

export type PollStats = {
  fetched: number;
  matched: number;
  created: number;
  unmatched: number;
  errors: number;
};

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

/**
 * Drain the IONOS INBOX once: unseen messages are matched to an existing
 * support thread (via plus-address or hidden token) and inserted as a reply.
 * Orphan messages — typical for a customer that emails support@fanovera.com
 * directly without going through the chat widget — open a brand-new thread
 * so the admin sees them in the Support tab instead of losing them in the
 * inbox. Every processed UID is flagged \Seen so we don't re-ingest.
 *
 * Fail-soft: a missing IMAP env throws; per-message errors are logged and
 * counted but don't abort the batch.
 */
export async function pollInboundMail(): Promise<PollStats> {
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

  const stats: PollStats = { fetched: 0, matched: 0, created: 0, unmatched: 0, errors: 0 };

  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
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
          const subject = (parsed.subject || "").trim();
          const fromAddr = parsed.from?.value?.[0]?.address || "";
          const cleanBody = stripQuotedHistory(rawText) || `(${subject || "no content"})`;
          const threadId = extractThreadId({ recipients: toList, rawText });

          if (threadId) {
            const thread = await getSupportMessageById(threadId);
            if (!thread) {
              // Thread referenced but no longer exists — drop on the floor
              // but flag seen so we don't keep retrying.
              stats.unmatched++;
              console.warn("[inbound-poll] Thread not found:", threadId, "UID=", uid);
              await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
              continue;
            }
            await insertSupportReply({
              parentId: threadId,
              senderType: "client",
              email: fromAddr || thread.email,
              message: cleanBody,
            });
            await reopenSupportThread(threadId);
            await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
            stats.matched++;
            continue;
          }

          // Orphan email — likely a customer emailing support directly.
          // Open a new thread so it surfaces in the admin Support tab.
          if (!fromAddr) {
            stats.unmatched++;
            console.warn(
              "[inbound-poll] Orphan email with no parseable From header, leaving unseen. UID=",
              uid,
              "to=",
              JSON.stringify(toList),
            );
            continue;
          }
          const newMessage = subject ? `${subject}\n\n${cleanBody}` : cleanBody;
          await sql`
            INSERT INTO support_messages (email, message, parent_id, sender_type, replied, replied_at)
            VALUES (${fromAddr}, ${newMessage}, NULL, 'client', false, NULL)
          `;
          await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
          stats.created++;
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
