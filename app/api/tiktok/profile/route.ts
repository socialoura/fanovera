import { NextRequest, NextResponse } from "next/server";

export type TtProfile = {
  username: string;
  fullName: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  videoCount: number;
  bio: string;
  verified: boolean;
};

const cache = new Map<string, { data: TtProfile; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000;

function getCached(username: string): TtProfile | null {
  const entry = cache.get(username);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(username);
    return null;
  }
  return entry.data;
}

function setCache(username: string, data: TtProfile) {
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

function mockProfile(username: string): TtProfile {
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
    followersCount: 800 + rand(15000),
    followingCount: 50 + rand(500),
    likesCount: 5000 + rand(200000),
    videoCount: 10 + rand(300),
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

  if (!username || !/^[a-zA-Z0-9._]{2,24}$/.test(username)) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }

  const cached = getCached(username);
  if (cached) return NextResponse.json(cached);

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json(mockProfile(username));
  }

  const host = "tiktok-api23.p.rapidapi.com";
  const key = process.env.RAPIDAPI_KEY;

  try {
    const res = await fetch(
      `https://${host}/api/user/info?uniqueId=${encodeURIComponent(username)}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": host,
          "x-rapidapi-key": key,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(6000),
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

    const user = json.userInfo?.user ?? json.user;
    const stats = json.userInfo?.stats ?? json.stats;

    if (!user) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (user.privateAccount) {
      return NextResponse.json({ error: "private" }, { status: 403 });
    }

    const avatarRaw: string =
      user.avatarLarger || user.avatarMedium || user.avatarThumb || "";

    const data: TtProfile = {
      username: user.uniqueId || username,
      fullName: user.nickname || username,
      avatarUrl: avatarRaw ? proxyAvatar(avatarRaw) : "",
      followersCount: stats?.followerCount ?? 0,
      followingCount: stats?.followingCount ?? 0,
      likesCount: stats?.heartCount ?? stats?.heart ?? 0,
      videoCount: stats?.videoCount ?? 0,
      bio: user.signature || "",
      verified: user.verified ?? false,
    };

    setCache(username, data);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[TikTok profile]", err);
    return NextResponse.json(mockProfile(username));
  }
}
