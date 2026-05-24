import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

/**
 * Admin CRUD for the 4 lifecycle email flows (abandoned cart, post-purchase
 * J+7/J+30, win-back J+60/J+90, confirmation cross-sell). Reads from
 * `email_flows` and joins last-30-day send counts from `email_flow_runs`.
 *
 * Only the fields admins are meant to tweak are accepted on PUT — `key` and
 * `group_key` are immutable so the cron lookups stay deterministic.
 */

const EDITABLE_FIELDS = [
  "active",
  "delay_hours",
  "discount_pct",
  "subject_fr",
  "subject_en",
  "min_order_cents",
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const flows = await sql`
      SELECT
        f.key, f.group_key, f.label_fr, f.label_en, f.active,
        f.delay_hours, f.discount_pct,
        f.subject_fr, f.subject_en,
        f.min_order_cents, f.sort_order, f.updated_at,
        COALESCE(stats.sent_30d, 0)::int AS sent_30d,
        COALESCE(stats.sent_total, 0)::int AS sent_total,
        stats.last_sent_at
      FROM email_flows f
      LEFT JOIN (
        SELECT
          flow_key,
          COUNT(*) FILTER (WHERE sent_at > NOW() - INTERVAL '30 days') AS sent_30d,
          COUNT(*) AS sent_total,
          MAX(sent_at) AS last_sent_at
        FROM email_flow_runs
        GROUP BY flow_key
      ) stats ON stats.flow_key = f.key
      ORDER BY f.sort_order, f.key
    `;
    return NextResponse.json({ flows });
  } catch (error) {
    console.error("EmailFlows GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const key = typeof body?.key === "string" ? body.key.trim() : "";
    if (!key) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    const exists = await sql`SELECT 1 FROM email_flows WHERE key = ${key} LIMIT 1`;
    if (exists.length === 0) {
      return NextResponse.json({ error: "Unknown flow key" }, { status: 404 });
    }

    for (const field of EDITABLE_FIELDS) {
      if (!(field in body)) continue;
      const value = (body as Record<EditableField, unknown>)[field];

      switch (field) {
        case "active":
          await sql`UPDATE email_flows SET active = ${Boolean(value)}, updated_at = NOW() WHERE key = ${key}`;
          break;
        case "delay_hours": {
          const n = Math.max(0, Math.min(8760, Math.trunc(Number(value) || 0)));
          await sql`UPDATE email_flows SET delay_hours = ${n}, updated_at = NOW() WHERE key = ${key}`;
          break;
        }
        case "discount_pct": {
          // Clamp to the codes the promo engine understands (0 = no code, or
          // 10/15/20/25/30). 5 % is reserved for the default FANO5 code.
          const raw = Math.max(0, Math.min(30, Math.trunc(Number(value) || 0)));
          const allowed = [0, 10, 15, 20, 25, 30];
          const n = allowed.reduce((acc, v) => (Math.abs(v - raw) < Math.abs(acc - raw) ? v : acc), 0);
          await sql`UPDATE email_flows SET discount_pct = ${n}, updated_at = NOW() WHERE key = ${key}`;
          break;
        }
        case "subject_fr": {
          const s = String(value || "").slice(0, 200);
          await sql`UPDATE email_flows SET subject_fr = ${s}, updated_at = NOW() WHERE key = ${key}`;
          break;
        }
        case "subject_en": {
          const s = String(value || "").slice(0, 200);
          await sql`UPDATE email_flows SET subject_en = ${s}, updated_at = NOW() WHERE key = ${key}`;
          break;
        }
        case "min_order_cents": {
          const n = Math.max(0, Math.trunc(Number(value) || 0));
          await sql`UPDATE email_flows SET min_order_cents = ${n}, updated_at = NOW() WHERE key = ${key}`;
          break;
        }
      }
    }

    const updated = await sql`SELECT * FROM email_flows WHERE key = ${key} LIMIT 1`;
    return NextResponse.json({ flow: updated[0] });
  } catch (error) {
    console.error("EmailFlows PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
