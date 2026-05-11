import { NextRequest, NextResponse } from "next/server";

export type YtProfile = {
  username: string;
  fullName: string;
  avatarUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  bio: string;
  verified: boolean;
};

const cache = new Map<string, { data: YtProfile; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000;

function getCached(key: string): YtProfile | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: YtProfile) {
  if (cache.size >= 200) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

function proxyAvatar(url: string): string {
  if (!url) return "";
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function mockProfile(handle: string): YtProfile {
  let seed = 0;
  for (let i = 0; i < handle.length; i++) seed = (seed * 31 + handle.charCodeAt(i)) >>> 0;
  const rand = (max: number) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % max;
  };
  return {
    username: handle,
    fullName: handle,
    avatarUrl: "",
    subscriberCount: 5000 + rand(50000),
    videoCount: 10 + rand(300),
    viewCount: 50000 + rand(2000000),
    bio: "",
    verified: false,
  };
}

async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest) {
  const rawHandle = req.nextUrl.searchParams
    .get("username")
    ?.trim()
    .toLowerCase()
    .replace(/^@/, "");

  if (!rawHandle || rawHandle.length < 2) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }

  const cached = getCached(rawHandle);
  if (cached) return NextResponse.json(cached);

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json(mockProfile(rawHandle));
  }

  const host = "youtube-v2.p.rapidapi.com";
  const key = process.env.RAPIDAPI_KEY;
  const headers = {
    "x-rapidapi-host": host,
    "x-rapidapi-key": key,
    "Content-Type": "application/json",
  };

  try {
    // Step 1: Search for channel
    const searchUrl = `https://${host}/search/?query=${encodeURIComponent("@" + rawHandle)}&lang=fr&order_by=relevance&country=fr`;
    const searchRes = await fetchWithTimeout(searchUrl, headers);

    if (!searchRes.ok) {
      return NextResponse.json(
        { error: `upstream_${searchRes.status}` },
        { status: 502 }
      );
    }

    const searchData = await searchRes.json();

    // Extract channel from search results
    const channels = searchData.channels || searchData.results || [];
    const channel = Array.isArray(channels) ? channels[0] : null;

    if (!channel) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const channelId = channel.channel_id || channel.channelId;

    if (!channelId) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Step 2: Get channel details
    const detailsUrl = `https://${host}/channel/details?channel_id=${encodeURIComponent(channelId)}`;
    const detailsRes = await fetchWithTimeout(detailsUrl, headers);

    if (!detailsRes.ok) {
      // Fallback to search data
      const avatarRaw = channel.thumbnail || "";
      const data: YtProfile = {
        username: channel.handle || channel.custom_url || channel.username || rawHandle,
        fullName: channel.title || rawHandle,
        avatarUrl: avatarRaw ? proxyAvatar(avatarRaw) : "",
        subscriberCount: channel.subscriber_count || channel.subscriberCount || 0,
        videoCount: channel.video_count || channel.videoCount || 0,
        viewCount: channel.view_count || channel.viewCount || 0,
        bio: "",
        verified: true,
      };
      setCache(rawHandle, data);
      return NextResponse.json(data);
    }

    const d = await detailsRes.json();

    // Avatar priority: avatar array > thumbnail > avatar_url
    const avatarRaw: string =
      (Array.isArray(d.avatar) && d.avatar.length > 0 ? d.avatar[d.avatar.length - 1]?.url : null) ||
      d.thumbnail ||
      d.avatar_url ||
      "";

    const data: YtProfile = {
      username: d.handle || d.custom_url || d.username || rawHandle,
      fullName: d.title || d.name || rawHandle,
      avatarUrl: avatarRaw ? proxyAvatar(avatarRaw) : "",
      subscriberCount: d.subscriber_count ?? d.subscriberCount ?? 0,
      videoCount: d.video_count ?? d.videoCount ?? 0,
      viewCount: d.view_count ?? d.viewCount ?? 0,
      bio: d.description || "",
      verified: d.is_verified ?? true,
    };

    setCache(rawHandle, data);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[YouTube profile]", err);
    return NextResponse.json(mockProfile(rawHandle));
  }
}
