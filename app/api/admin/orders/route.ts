import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { convertCentsToEur } from "@/app/lib/fxRates";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

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

    const enriched = await enrichOrdersWithEur(orders as Array<Record<string, unknown>>);
    return NextResponse.json({ orders: enriched, total, page, totalPages });
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
