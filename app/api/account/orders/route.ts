import { NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { getSessionEmail } from "@/app/lib/accountAuth";

/**
 * GET /api/account/orders
 *
 * Returns all orders for the email tied to the current session cookie.
 * 401 if no valid session.
 */
export async function GET() {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const rows = await sql`
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
      LIMIT 100
    `;

    // Customer-facing tracking must never expose internal blocking states
    // ("canceled" from a BF refund, "account_unavailable" when the target
    // profile is private/suspended). The admin is re-routing / waiting on
    // info; from the client's perspective the order is still in flight.
    const HIDDEN_STATUSES = new Set(["canceled", "cancelled", "account_unavailable"]);
    const orders = rows.map((o: Record<string, unknown>) =>
      typeof o.status === "string" && HIDDEN_STATUSES.has(o.status)
        ? { ...o, status: "processing" }
        : o,
    );

    return NextResponse.json({ email, orders });
  } catch (err) {
    console.error("[account/orders] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
