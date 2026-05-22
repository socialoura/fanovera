import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { sendOrderMissingInfoEmail, type OrderAskKind } from "@/app/lib/email";

const INBOUND_ADDRESS_BASE = process.env.SUPPORT_INBOUND_ADDRESS || "support@fanovera.com";

type CartItem = { service?: string };

/**
 * Pick the right email variant based on what's actually in the cart:
 *   - live    : any "viewers" / "live" service (e.g. tw_live_viewers)
 *   - post    : any like / view / comment / share / save (post-attached)
 *   - profile : default — followers / subscribers / listeners / plays
 */
function detectAskKind(cart: unknown): OrderAskKind {
  const items: CartItem[] = Array.isArray(cart) ? (cart as CartItem[]) : [];
  const services = items.map((i) => String(i?.service || "").toLowerCase());
  if (services.some((s) => /live|viewer/.test(s))) return "live";
  if (services.some((s) => /like|view|comment|share|save/.test(s))) return "post";
  return "profile";
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const orderId = Number(body?.orderId);
  // Optional explicit override from the UI (e.g. admin knows it's actually a
  // post problem even if the cart has followers too).
  const askOverride = body?.askKind as OrderAskKind | undefined;
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const rows = await sql`
    SELECT id, email, username, platform, lang, cart
    FROM orders WHERE id = ${orderId} LIMIT 1
  `;
  const order = rows[0];
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!order.email) {
    return NextResponse.json({ error: "Order has no customer email" }, { status: 400 });
  }

  const askKind: OrderAskKind = askOverride === "profile" || askOverride === "post" || askOverride === "live"
    ? askOverride
    : detectAskKind(order.cart);

  // Open an admin-initiated support thread so the customer's reply lands in
  // the support inbox via the IMAP poller (which routes on the hidden token).
  const seed = await sql`
    INSERT INTO support_messages (email, message, parent_id, sender_type, replied, replied_at)
    VALUES (
      ${order.email},
      ${`[admin] Missing-info email sent for order #${order.id} (ask: ${askKind}, @${order.username || "?"} on ${order.platform || "?"})`},
      NULL,
      'admin',
      true,
      NOW()
    )
    RETURNING id
  `;
  const threadRootId = Number(seed[0]?.id);
  const threadToken = `[fanovera-thread:${threadRootId}]`;

  const result = await sendOrderMissingInfoEmail({
    to: String(order.email),
    orderId: Number(order.id),
    platform: String(order.platform || ""),
    username: String(order.username || ""),
    askKind,
    locale: String(order.lang || "fr"),
    replyTo: INBOUND_ADDRESS_BASE,
    threadToken,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Email send failed", detail: result.error },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, threadRootId, askKind, emailId: result.id });
}
