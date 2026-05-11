import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

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
