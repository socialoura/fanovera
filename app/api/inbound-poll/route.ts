import { NextRequest, NextResponse } from "next/server";
import { pollInboundMail } from "@/app/lib/inboundMailPoll";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorize(req: NextRequest): boolean {
  const expected = process.env.INBOUND_POLL_TOKEN;
  if (!expected) return false;
  const headerToken = req.headers.get("x-poll-token");
  const queryToken = new URL(req.url).searchParams.get("token");
  // Vercel cron uses Authorization: Bearer ${CRON_SECRET}. Accept that too so
  // a future move into /api/cron/* works without changing the auth shape.
  const authHeader = req.headers.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const cronSecret = process.env.CRON_SECRET;
  return (
    headerToken === expected ||
    queryToken === expected ||
    (!!cronSecret && bearerToken === cronSecret)
  );
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const stats = await pollInboundMail();
    return NextResponse.json({ ok: true, ...stats });
  } catch (err) {
    console.error("[inbound-poll] Fatal:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Polling failed" },
      { status: 500 },
    );
  }
}

// Allow POST too so cron services that only support POST can hit it.
export const POST = GET;
