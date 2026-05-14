import { NextRequest, NextResponse } from "next/server";
import { jsonCachedAtEdge } from "@/app/lib/cdnCache";
import { notifyApiFailure } from "@/app/lib/apiAlerts";

export type IgProfile = {
  username: string;
  fullName: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  mediaCount: number;
  bio: string;
  verified: boolean;
};

const cache = new Map<string, { data: IgProfile; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000;

function getCached(username: string): IgProfile | null {
  const entry = cache.get(username);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(username);
    return null;
  }
  return entry.data;
}

function setCache(username: string, data: IgProfile) {
  if (cache.size >= 200) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(username, { data, ts: Date.now() });
}

function proxyAvatar(url: string): string {
  if (!url) return "";
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

async function searchFallback(query: string): Promise<string | null> {
  const key = process.env.RAPIDAPI_KEY!;
  const host = "instagram120.p.rapidapi.com";
  try {
    const res = await fetch(`https://${host}/api/instagram/search`, {
      method: "POST",
      headers: {
        "x-rapidapi-host": host,
        "x-rapidapi-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const users = json?.result || json || [];
    if (Array.isArray(users) && users.length > 0) return users[0].username || null;
    return null;
  } catch {
    return null;
  }
}

function mockProfile(username: string): IgProfile {
  let seed = 0;
  for (let i = 0; i < username.length; i++) seed = (seed * 31 + username.charCodeAt(i)) >>> 0;
  const rand = (max: number) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % max;
  };
  return {
    username,
    fullName: username,
    avatarUrl: "",
    followersCount: 800 + rand(12000),
    followingCount: 200 + rand(800),
    mediaCount: 12 + rand(240),
    bio: "",
    verified: false,
  };
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams
    .get("username")
    ?.trim()
    .toLowerCase()
    .replace(/^@/, "");

  if (!username || !/^[a-zA-Z0-9._]{2,30}$/.test(username)) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }

  const cached = getCached(username);
  if (cached) return jsonCachedAtEdge(cached);

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json(mockProfile(username));
  }

  const host = "instagram120.p.rapidapi.com";
  const key = process.env.RAPIDAPI_KEY;

  async function callUpstream(timeoutMs: number) {
    return fetch(`https://${host}/api/instagram/profile`, {
      method: "POST",
      headers: {
        "x-rapidapi-host": host,
        "x-rapidapi-key": key!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  try {
    let res: Response;
    try {
      res = await callUpstream(12000);
    } catch (firstErr) {
      const isTimeout =
        firstErr instanceof Error &&
        (firstErr.name === "TimeoutError" || firstErr.name === "AbortError");
      if (!isTimeout) throw firstErr;
      // Un seul retry rapide après timeout (l'API se réveille souvent au 2e appel)
      res = await callUpstream(15000);
    }

    if (!res.ok) {
      void notifyApiFailure({
        platform: "instagram",
        endpoint: "/api/instagram/profile",
        provider: host,
        status: res.status,
      });
      if (res.status === 404) {
        const suggestion = await searchFallback(username);
        return NextResponse.json({ error: "not_found", suggestion }, { status: 404 });
      }
      return NextResponse.json(
        { error: `upstream_${res.status}` },
        { status: res.status }
      );
    }

    const json = await res.json();
    console.log("[Instagram profile] raw response:", JSON.stringify(json).slice(0, 500));

    // API may wrap data in result, data, or user keys — try all
    const r = json?.result ?? json?.data?.user ?? json?.data ?? json?.user ?? json;

    if (r?.is_private) {
      return NextResponse.json({ error: "private" }, { status: 403 });
    }

    const avatarRaw: string = r?.profile_pic_url_hd || r?.profile_pic_url || "";

    // follower count: "follower_count" or nested "edge_followed_by.count"
    const followersCount: number =
      r?.follower_count ??
      r?.followers_count ??
      r?.edge_followed_by?.count ??
      0;

    // following count
    const followingCount: number =
      r?.following_count ??
      r?.followings_count ??
      r?.edge_follow?.count ??
      0;

    // post count
    const mediaCount: number =
      r?.media_count ??
      r?.posts_count ??
      r?.edge_owner_to_timeline_media?.count ??
      0;

    const data: IgProfile = {
      username: r?.username || username,
      fullName: r?.full_name || username,
      avatarUrl: avatarRaw ? proxyAvatar(avatarRaw) : "",
      followersCount,
      followingCount,
      mediaCount,
      bio: r?.biography || "",
      verified: r?.is_verified || false,
    };

    setCache(username, data);
    return jsonCachedAtEdge(data);
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError");
    if (isTimeout) {
      console.warn(`[Instagram profile] upstream timeout for "${username}", returning mock`);
    } else {
      console.error("[Instagram profile]", err);
    }
    return NextResponse.json(mockProfile(username));
  }
}
