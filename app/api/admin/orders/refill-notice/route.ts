import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";
import { sendRefillNoticeEmail } from "@/app/lib/email";

type CartItem = { service?: string };
type OrderRow = { platform?: string | null; cart?: unknown };

/**
 * Flatten every order the customer ever placed into the distinct
 * (platform, service) combos they've bought, so the email reflects their whole
 * history ("your Instagram followers and your TikTok likes") rather than the
 * single order the admin happened to click.
 */
function collectPurchases(rows: OrderRow[]): Array<{ platform: string; service?: string }> {
  const out: Array<{ platform: string; service?: string }> = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const platform = String(r.platform || "");
    if (!platform) continue;
    const items: CartItem[] = Array.isArray(r.cart) ? (r.cart as CartItem[]) : [];
    if (items.length === 0) {
      const key = `${platform}|`;
      if (!seen.has(key)) { seen.add(key); out.push({ platform }); }
      continue;
    }
    for (const it of items) {
      const service = it?.service ? String(it.service) : undefined;
      const key = `${platform}|${service || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ platform, service });
    }
  }
  return out;
}

/**
 * Admin-triggered loyalty / refill notice. Tells a top customer we just
 * relaunched their orders for free after a follower/like drop. The email is
 * personalized from the customer's entire purchase history. Send-only — the
 * actual BulkFollows relaunch happens via the SMM action buttons.
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const orderId = Number(body?.orderId);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const rows = await sql`
    SELECT id, email, lang FROM orders WHERE id = ${orderId} LIMIT 1
  `;
  const order = rows[0];
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!order.email) {
    return NextResponse.json({ error: "Order has no customer email" }, { status: 400 });
  }

  // Pull the customer's full history (all orders under the same email).
  const history = await sql`
    SELECT platform, cart FROM orders WHERE lower(email) = lower(${order.email})
  ` as OrderRow[];

  const purchases = collectPurchases(history);

  const result = await sendRefillNoticeEmail({
    to: String(order.email),
    purchases,
    locale: String(order.lang || "fr"),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Email send failed", detail: result.error },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, emailId: result.id, purchaseCount: purchases.length });
}
