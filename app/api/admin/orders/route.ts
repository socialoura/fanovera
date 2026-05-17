import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { convertCentsToEur } from "@/app/lib/fxRates";
import { refreshSmmStatus } from "@/app/lib/smm";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

// Pull BulkFollows status for every order still in flight, so the admin
// listing reflects the latest delivery state without a manual click. We cap
// the batch + run it before the SELECT so the response carries the new state.
// Hobby Vercel plan doesn't allow a recurring cron, so this opportunistic
// refresh on the admin GET is what keeps "delivered" auto-flipping.
const AUTO_REFRESH_MAX_PER_REQUEST = 30;

async function autoRefreshPendingOrders() {
  try {
    const pending = await sql`
      SELECT id FROM orders
      WHERE status IN ('paid', 'processing')
        AND smm_orders IS NOT NULL
        AND jsonb_typeof(smm_orders) = 'array'
        AND jsonb_array_length(smm_orders) > 0
      ORDER BY created_at ASC
      LIMIT ${AUTO_REFRESH_MAX_PER_REQUEST}
    `;
    if (pending.length === 0) return;

    // BF errors per-order shouldn't break the admin listing — Promise.allSettled
    // so one flaky sub-order doesn't sink the whole batch.
    await Promise.allSettled(
      (pending as Array<Record<string, unknown>>).map((row) =>
        refreshSmmStatus(Number(row.id)),
      ),
    );
  } catch (err) {
    console.error("[admin/orders] auto-refresh failed:", err);
  }
}

// Admin shows everything in EUR for a unified view across customer currencies.
// We compute EUR equivalents server-side so the React layer stays synchronous.
async function enrichOrdersWithEur(orders: Array<Record<string, unknown>>) {
  return Promise.all(
    orders.map(async (o) => {
      const currency = String(o.currency || "EUR");
      const totalCents = Number(o.total_cents) || 0;
      const costCents = Number(o.cost_cents) || 0;
      const [totalEur, costEur] = await Promise.all([
        convertCentsToEur(totalCents, currency),
        convertCentsToEur(costCents, currency),
      ]);
      return {
        ...o,
        total_cents_eur: totalEur,
        cost_cents_eur: costEur,
        margin_cents_eur: totalEur - costEur,
      };
    }),
  );
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // Opt-out via ?refresh=0 (used by the refresh button to avoid double work).
    if (searchParams.get("refresh") !== "0") {
      await autoRefreshPendingOrders();
    }

    let orders;
    let totalRes;

    if (status !== "all" && search) {
      totalRes = await sql`SELECT COUNT(*)::int AS count FROM orders WHERE status = ${status} AND email ILIKE ${"%" + search + "%"}`;
      orders = await sql`SELECT * FROM orders WHERE status = ${status} AND email ILIKE ${"%" + search + "%"} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (status !== "all") {
      totalRes = await sql`SELECT COUNT(*)::int AS count FROM orders WHERE status = ${status}`;
      orders = await sql`SELECT * FROM orders WHERE status = ${status} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (search) {
      totalRes = await sql`SELECT COUNT(*)::int AS count FROM orders WHERE email ILIKE ${"%" + search + "%"}`;
      orders = await sql`SELECT * FROM orders WHERE email ILIKE ${"%" + search + "%"} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    } else {
      totalRes = await sql`SELECT COUNT(*)::int AS count FROM orders`;
      orders = await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    }

    const total = totalRes[0].count;
    const totalPages = Math.ceil(total / limit);

    // Banner counter — partial + canceled orders need a manual decision
    // (top up the delivery, refund, or just accept). The list view surfaces
    // this so the admin doesn't miss them.
    const actionRequiredRes = await sql`
      SELECT COUNT(*)::int AS count FROM orders WHERE status IN ('partial', 'canceled')
    `;
    const actionRequired = Number(actionRequiredRes[0]?.count) || 0;

    const enriched = await enrichOrdersWithEur(orders as Array<Record<string, unknown>>);
    return NextResponse.json({ orders: enriched, total, page, totalPages, actionRequired });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const { id, status, cost_cents } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (status && cost_cents !== undefined) {
      if (status === "delivered") {
        await sql`UPDATE orders SET status = ${status}, cost_cents = ${cost_cents}, delivered_at = NOW() WHERE id = ${id}`;
      } else {
        await sql`UPDATE orders SET status = ${status}, cost_cents = ${cost_cents} WHERE id = ${id}`;
      }
    } else if (status) {
      if (status === "delivered") {
        await sql`UPDATE orders SET status = ${status}, delivered_at = NOW() WHERE id = ${id}`;
      } else {
        await sql`UPDATE orders SET status = ${status} WHERE id = ${id}`;
      }
    } else if (cost_cents !== undefined) {
      await sql`UPDATE orders SET cost_cents = ${cost_cents} WHERE id = ${id}`;
    }

    const updated = await sql`SELECT * FROM orders WHERE id = ${id} LIMIT 1`;
    const enriched = await enrichOrdersWithEur(updated as Array<Record<string, unknown>>);
    return NextResponse.json({ order: enriched[0] });
  } catch (error) {
    console.error("Orders PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await sql`DELETE FROM scheduled_emails WHERE order_id = ${id}`;
    const result = await sql`DELETE FROM orders WHERE id = ${id} RETURNING id`;
    if (result.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ deleted: result[0].id });
  } catch (error) {
    console.error("Orders DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
