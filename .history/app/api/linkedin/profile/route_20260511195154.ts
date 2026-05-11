import { NextRequest, NextResponse } from "next/server";

export type LiProfile = {
  username: string;
  fullName: string;
  headline: string;
  avatarUrl: string;
  backgroundUrl: string;
  bio: string;
  geo: string;
  isTopVoice: boolean;
  isCreator: boolean;
  isPremium: boolean;
  currentPosition: string;
  currentCompany: string;
  followersCount: number;
  connectionsCount: number;
};

const cache = new Map<string, { data: LiProfile; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000;

function getCached(key: string): LiProfile | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: LiProfile) {
  if (cache.size >= 100) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

function proxyAvatar(url: string): string {
  if (!url) return "";
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function mockProfile(username: string): LiProfile {
  const name = username
    .replace(/[-_.]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    username,
    fullName: name,
    headline: "Professional",
    avatarUrl: "",
    backgroundUrl: "",
    bio: "",
    geo: "",
    isTopVoice: false,
    isCreator: false,
    isPremium: false,
    currentPosition: "",
    currentCompany: "",
    followersCount: 0,
    connectionsCount: 0,
  };
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams
    .get("username")
    ?.trim();

  if (!username || username.length < 2) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }

  const cached = getCached(username);
  if (cached) return NextResponse.json(cached);

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json(mockProfile(username));
  }

  const host = "linkedin-data-api.p.rapidapi.com";
  const key = process.env.RAPIDAPI_KEY;

  try {
    const res = await fetch(
      `https://${host}/?username=${encodeURIComponent(username)}`,
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

    const d = await res.json();

    if (!d || (!d.username && !d.firstName && !d.id)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const avatarRaw: string = d.profilePicture || "";
    const bgArr = Array.isArray(d.backgroundImage) ? d.backgroundImage : [];
    const bgRaw: string = bgArr.length > 0 ? bgArr[bgArr.length - 1]?.url || "" : "";

    const positions = Array.isArray(d.position) ? d.position : [];
    const currentPos = positions[0];

    const data: LiProfile = {
      username: d.username || username,
      fullName: `${d.firstName || ""} ${d.lastName || ""}`.trim() || username,
      headline: d.headline || "",
      avatarUrl: avatarRaw ? proxyAvatar(avatarRaw) : "",
      backgroundUrl: bgRaw ? proxyAvatar(bgRaw) : "",
      bio: d.summary || "",
      geo: d.geo?.full || d.geo?.city || "",
      isTopVoice: d.isTopVoice ?? false,
      isCreator: d.isCreator ?? false,
      isPremium: d.isPremium ?? false,
      currentPosition: currentPos?.title || "",
      currentCompany: currentPos?.companyName || "",
      followersCount: Number(d.followers ?? d.followersCount ?? 0) || 0,
      connectionsCount: Number(d.connections ?? d.connectionsCount ?? 0) || 0,
    };

    setCache(username, data);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[LinkedIn profile]", err);
    return NextResponse.json(mockProfile(username));
  }
}
