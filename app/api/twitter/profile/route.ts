import { NextRequest, NextResponse } from "next/server";

export type XProfile = {
  username: string;
  fullName: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  tweetsCount: number;
  bio: string;
  verified: boolean;
};

const cache = new Map<string, { data: XProfile; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000;

function getCached(username: string): XProfile | null {
  const entry = cache.get(username);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(username);
    return null;
  }
  return entry.data;
}

function setCache(username: string, data: XProfile) {
  if (cache.size >= 200) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(username, { data, ts: Date.now() });
}

function proxyAvatar(url: string): string {
  if (!url) return "";
  // Enhance resolution: replace _normal with _400x400
  const enhanced = url.replace(/_normal\./, "_400x400.");
  return `/api/image-proxy?url=${encodeURIComponent(enhanced)}`;
}

function mockProfile(username: string): XProfile {
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
    followersCount: 500 + rand(10000),
    followingCount: 100 + rand(800),
    likesCount: 200 + rand(20000),
    tweetsCount: 50 + rand(5000),
    bio: "",
    verified: false,
  };
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams
    .get("username")
    ?.trim()
    .replace(/^@/, "");

  if (!username || !/^[a-zA-Z0-9_]{1,15}$/.test(username)) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }

  const cached = getCached(username);
  if (cached) return NextResponse.json(cached);

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json(mockProfile(username));
  }

  const host = "twitter-api45.p.rapidapi.com";
  const key = process.env.RAPIDAPI_KEY;

  try {
    const res = await fetch(
      `https://${host}/replies.php?screenname=${encodeURIComponent(username)}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": host,
          "x-rapidapi-key": key,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: `upstream_${res.status}` },
        { status: 502 }
      );
    }

    const json = await res.json();
    const user = json?.user ?? json?.data?.user;

    if (!user) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const avatarRaw: string = user.avatar || "";

    const data: XProfile = {
      username: user.screen_name || username,
      fullName: user.name || username,
      avatarUrl: avatarRaw ? proxyAvatar(avatarRaw) : "",
      followersCount: user.sub_count ?? user.followers_count ?? 0,
      followingCount: user.friends ?? user.following_count ?? 0,
      likesCount: user.favourites_count ?? 0,
      tweetsCount: user.statuses_count ?? 0,
      bio: user.desc || user.description || "",
      verified: user.blue_verified ?? false,
    };

    setCache(username, data);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Twitter profile]", err);
    return NextResponse.json(mockProfile(username));
  }
}
