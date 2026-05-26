import { NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

// Public, anonymous, low-cardinality social-proof endpoint. Returns the
// count of orders booked over the last 7 days in Europe/Paris time, restricted
// to statuses that imply a real customer transaction (no pending/failed).
// Cached for 60s on the CDN so a busy LP doesn't fan out to the DB.
//
// Why a rolling 7-day window instead of "today": on a calm morning the
// "today" counter could legitimately sit at 0 and hide the trust pill on
// every LP — particularly painful on mobile UTM visits where the pill
// replaces the platform eyebrow. 7 days smooths that out without lying
// (the number is real and reasonably current).
//
// The route filename is kept as `today-stats` to avoid breaking deployments
// or external links; the response field rename makes the semantic explicit
// to anyone reading the code.
export const revalidate = 60;

export async function GET() {
  try {
    const res = await sql`
      SELECT COUNT(*)::int AS count
      FROM orders
      WHERE (created_at AT TIME ZONE 'Europe/Paris')::date
            > (NOW() AT TIME ZONE 'Europe/Paris')::date - INTERVAL '7 days'
        AND status IN ('paid','processing','delivered','partial')
    `;
    const ordersLast7Days = Number((res as Array<{ count: number }>)[0]?.count) || 0;
    return NextResponse.json(
      { ordersLast7Days },
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
    return NextResponse.json({ ordersLast7Days: 0 }, { status: 200 });
  }
}
