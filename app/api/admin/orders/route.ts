import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

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

    return NextResponse.json({ orders, total, page, totalPages });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

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
    return NextResponse.json({ order: updated[0] });
  } catch (error) {
    console.error("Orders PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
