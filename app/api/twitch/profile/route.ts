import { NextRequest, NextResponse } from "next/server";

export type TwProfile = {
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  isPartner: boolean;
  isAffiliate: boolean;
  isLive: boolean;
  lastBroadcastTitle: string;
  streamTitle: string;
};

const cache = new Map<string, { data: TwProfile; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000;

function getCached(username: string): TwProfile | null {
  const entry = cache.get(username);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(username);
    return null;
  }
  return entry.data;
}

function setCache(username: string, data: TwProfile) {
  if (cache.size >= 100) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(username, { data, ts: Date.now() });
}

function proxyAvatar(url: string): string {
  if (!url) return "";
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function mockProfile(username: string): TwProfile {
  return {
    username,
    displayName: username.charAt(0).toUpperCase() + username.slice(1),
    avatarUrl: "",
    bio: "",
    isPartner: false,
    isAffiliate: true,
    isLive: false,
    lastBroadcastTitle: "Just Chatting",
    streamTitle: "",
  };
}

export async function GET(req: NextRequest) {
  const rawUsername = req.nextUrl.searchParams
    .get("username")
    ?.trim()
    .toLowerCase()
    .replace(/^@/, "");

  if (!rawUsername || !/^[a-zA-Z0-9_]{3,25}$/.test(rawUsername)) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }

  const cached = getCached(rawUsername);
  if (cached) return NextResponse.json(cached);

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json(mockProfile(rawUsername));
  }

  const host = "twitch-data-api2.p.rapidapi.com";
  const key = process.env.RAPIDAPI_KEY;

  try {
    const res = await fetch(
      `https://${host}/channels/${encodeURIComponent(rawUsername)}`,
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

    if (!d || (!d.login && !d.displayName && !d.id)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const avatarRaw: string = d.profileImageUrl || "";

    const data: TwProfile = {
      username: d.login || rawUsername,
      displayName: d.displayName || rawUsername,
      avatarUrl: avatarRaw ? proxyAvatar(avatarRaw) : "",
      bio: d.description || "",
      isPartner: d.isPartner ?? false,
      isAffiliate: d.isAffiliate ?? false,
      isLive: !!d.stream,
      lastBroadcastTitle: d.lastBroadcast?.title || "",
      streamTitle: d.stream?.title || "",
    };

    setCache(rawUsername, data);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Twitch profile]", err);
    return NextResponse.json(mockProfile(rawUsername));
  }
}
