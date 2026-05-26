import { NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

// Public, anonymous, low-cardinality social-proof endpoint. Returns the
// count of orders booked today across all currencies/platforms, restricted
// to statuses that imply a real customer transaction (no pending/failed).
// Cached for 60s on the CDN so a busy LP doesn't fan out to the DB.
export const revalidate = 60;

export async function GET() {
  try {
    // "Today" is Europe/Paris-local (Fanovera operates from France) so the
    // ticker rolls over at midnight Paris, not midnight UTC. Without this
    // the counter visibly drops to 0 at ~01:00-02:00 Paris while the rest
    // of the LP is still showing prime-time activity.
    const res = await sql`
      SELECT COUNT(*)::int AS count
      FROM orders
      WHERE (created_at AT TIME ZONE 'Europe/Paris')::date = (NOW() AT TIME ZONE 'Europe/Paris')::date
        AND status IN ('paid','processing','delivered','partial')
    `;
    const ordersToday = Number((res as Array<{ count: number }>)[0]?.count) || 0;
    return NextResponse.json(
      { ordersToday },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    // Fail soft: the ticker hides itself on 0, so a transient DB blip just
    // makes the social-proof disappear instead of breaking the LP.
    console.error("[today-stats]", err);
    return NextResponse.json({ ordersToday: 0 }, { status: 200 });
  }
}
