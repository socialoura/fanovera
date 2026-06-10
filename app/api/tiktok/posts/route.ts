import { NextRequest, NextResponse } from "next/server";
import { jsonCachedAtEdge } from "@/app/lib/cdnCache";
import { notifyApiFailure } from "@/app/lib/apiAlerts";

// One of the user's recent TikTok videos, trimmed down to what the
// post-selection UI (tiktok-2 step 3) and the SMM fulfillment need.
export type TtPost = {
  id: string;
  desc: string;
  thumbnailUrl: string;
  playCount: number;
  likeCount: number;
  // Canonical video URL (https://www.tiktok.com/@handle/video/<id>) — used as the
  // cart line postUrl so BulkFollows can target the exact video.
  url: string;
};

const host = "tiktok-api23.p.rapidapi.com";

const cache = new Map<string, { data: TtPost[]; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000;

function getCached(username: string): TtPost[] | null {
  const entry = cache.get(username);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(username);
    return null;
  }
  return entry.data;
}

function setCache(username: string, data: TtPost[]) {
  if (cache.size >= 200) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(username, { data, ts: Date.now() });
}

function proxyImage(url: string): string {
  if (!url) return "";
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function videoUrl(username: string, id: string): string {
  return `https://www.tiktok.com/@${username}/video/${id}`;
}

function mockPosts(username: string): TtPost[] {
  let seed = 0;
  for (let i = 0; i < username.length; i++) seed = (seed * 31 + username.charCodeAt(i)) >>> 0;
  const rand = (max: number) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % max;
  };
  return Array.from({ length: 12 }).map((_, i) => {
    const id = String(7000000000000000000 + rand(900000000) * 1000 + i);
    return {
      id,
      desc: "",
      thumbnailUrl: "",
      playCount: (rand(180) + 8) * 1000,
      likeCount: (rand(14) + 1) * 1000,
      url: videoUrl(username, id),
    };
  });
}

async function fetchSecUid(username: string, key: string): Promise<string | null> {
  const res = await fetch(
    `https://${host}/api/user/info?uniqueId=${encodeURIComponent(username)}`,
    {
      method: "GET",
      headers: { "x-rapidapi-host": host, "x-rapidapi-key": key, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(6000),
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const user = json.userInfo?.user ?? json.user;
  return user?.secUid || null;
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams
    .get("username")
    ?.trim()
    .toLowerCase()
    .replace(/^@/, "");

  if (!username || !/^[a-zA-Z0-9._]{2,24}$/.test(username)) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }

  const cached = getCached(username);
  if (cached) return NextResponse.json({ posts: cached });

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json({ posts: mockPosts(username) });
  }

  const key = process.env.RAPIDAPI_KEY;

  try {
    const secUid = await fetchSecUid(username, key);
    if (!secUid) {
      // Profile lookup failed (private/not found/upstream) — fall back to mock
      // so the post-selection UI still renders something selectable.
      return NextResponse.json({ posts: mockPosts(username) });
    }

    const res = await fetch(
      `https://${host}/api/user/posts?secUid=${encodeURIComponent(secUid)}&count=12&cursor=0`,
      {
        method: "GET",
        headers: { "x-rapidapi-host": host, "x-rapidapi-key": key, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      void notifyApiFailure({
        platform: "tiktok",
        endpoint: "/api/tiktok/posts",
        provider: host,
        status: res.status,
      });
      return NextResponse.json({ posts: mockPosts(username) });
    }

    const json = await res.json();
    const itemList: unknown[] =
      json?.data?.itemList ?? json?.itemList ?? json?.items ?? [];

    const posts: TtPost[] = (Array.isArray(itemList) ? itemList : [])
      .slice(0, 12)
      .map((raw) => {
        const item = raw as Record<string, unknown>;
        const stats = (item.statsV2 ?? item.stats ?? {}) as Record<string, unknown>;
        const video = (item.video ?? {}) as Record<string, unknown>;
        const id = String(item.id || "");
        const coverRaw = String(video.cover || video.originCover || video.dynamicCover || "");
        return {
          id,
          desc: String(item.desc || ""),
          thumbnailUrl: coverRaw ? proxyImage(coverRaw) : "",
          playCount: toNumber(stats.playCount),
          likeCount: toNumber(stats.diggCount),
          url: videoUrl(username, id),
        };
      })
      .filter((p) => p.id);

    if (posts.length === 0) {
      return NextResponse.json({ posts: mockPosts(username) });
    }

    setCache(username, posts);
    return jsonCachedAtEdge({ posts });
  } catch (err) {
    console.error("[TikTok posts]", err);
    return NextResponse.json({ posts: mockPosts(username) });
  }
}
