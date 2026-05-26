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

    // Customer-facing tracking must never show "canceled". A BulkFollows
    // cancellation just triggers an internal re-route by the admin; the
    // client sees the order as still in flight (processing).
    const orders = rows.map((o: Record<string, unknown>) =>
      o.status === "canceled" || o.status === "cancelled"
        ? { ...o, status: "processing" }
        : o,
    );

    return NextResponse.json({ email, orders });
  } catch (err) {
    console.error("[account/orders] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
