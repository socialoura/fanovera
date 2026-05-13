import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { rateLimit, tooManyRequests } from "@/app/lib/rateLimit";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/orders-by-email
 * Body: { email: string }
 *
 * Returns all orders for the given email (case-insensitive).
 * Public endpoint — no auth required, but the email itself acts as the
 * "ownership proof" since only the customer knows their own email.
 */
export async function POST(req: NextRequest) {
  // Rate limit: 10 lookups / minute / IP. Mitigates email enumeration scans.
  const rl = rateLimit(req, { key: "orders-by-email", max: 10, windowMs: 60_000 });
  if (!rl.allowed) return tooManyRequests(rl);

  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !EMAIL_RX.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const orders = await sql`
      SELECT
        id,
        username,
        platform,
        cart,
        total_cents,
        status,
        followers_before,
        created_at,
        delivered_at,
        COALESCE(currency, 'eur') AS currency
      FROM orders
      WHERE LOWER(email) = ${email}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[orders-by-email] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
