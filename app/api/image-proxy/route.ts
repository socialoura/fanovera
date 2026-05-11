import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  "instagram.com",
  "cdninstagram.com",
  "fbcdn.net",
  "scontent.cdninstagram.com",
  "tiktokcdn.com",
  "tiktokcdn-us.com",
  "tiktokcdn-eu.com",
  "ggpht.com",
  "googleusercontent.com",
  "ytimg.com",
  "twimg.com",
  "pbs.twimg.com",
  "jtvnw.net",
  "static-cdn.jtvnw.net",
  "licdn.com",
  "media.licdn.com",
];

function isAllowed(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith("." + h));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url || !isAllowed(url)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      return new NextResponse("Bad gateway", { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse("Timeout", { status: 504 });
  }
}
