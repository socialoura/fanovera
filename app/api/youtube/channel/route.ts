import { NextRequest, NextResponse } from "next/server";
import { jsonCachedAtEdge } from "@/app/lib/cdnCache";
import { notifyApiFailure } from "@/app/lib/apiAlerts";

export type YtChannel = {
  channelId: string;
  title: string;
  handle: string;
  description: string;
  avatarUrl: string;
  bannerUrl: string;
  subscriberCount: number;
  subscribersText: string;
  viewCount: number;
  videoCount: number;
  verified: boolean;
  country: string;
  joinedDate: string;
};

type Avatar = { url?: string; width?: number; height?: number };
type Badge = { text?: string; type?: string };

const YT_URL_RE = /^https?:\/\/(?:www\.)?youtube\.com\/(?:@[A-Za-z0-9_.-]+|c\/[A-Za-z0-9_.-]+|user\/[A-Za-z0-9_.-]+|channel\/UC[A-Za-z0-9_-]{22})\/?$/i;

const cache = new Map<string, { data: YtChannel; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000;

function getCached(key: string): YtChannel | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: YtChannel) {
  if (cache.size >= 200) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

function proxyImage(url: string): string {
  if (!url) return "";
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function pickLargest(list: Avatar[] | undefined): string {
  if (!Array.isArray(list) || list.length === 0) return "";
  const sorted = [...list].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return sorted[0]?.url || "";
}

function mockChannel(input: string): YtChannel {
  let seed = 0;
  for (let i = 0; i < input.length; i++) seed = (seed * 31 + input.charCodeAt(i)) >>> 0;
  const rand = (max: number) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % max;
  };
  const subs = 5000 + rand(500000);
  return {
    channelId: "",
    title: input,
    handle: "",
    description: "",
    avatarUrl: "",
    bannerUrl: "",
    subscriberCount: subs,
    subscribersText: `${subs.toLocaleString()} subscribers`,
    viewCount: subs * (50 + rand(200)),
    videoCount: 10 + rand(500),
    verified: false,
    country: "",
    joinedDate: "",
  };
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url")?.trim() ?? "";

  if (!urlParam || !YT_URL_RE.test(urlParam)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const cacheKey = urlParam.toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) return jsonCachedAtEdge(cached);

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json(mockChannel(urlParam));
  }

  const host = "youtube138.p.rapidapi.com";
  const key = process.env.RAPIDAPI_KEY;

  async function callUpstream(timeoutMs: number) {
    return fetch(
      `https://${host}/channel/details/?id=${encodeURIComponent(urlParam)}&hl=en&gl=US`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": host,
          "x-rapidapi-key": key,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(timeoutMs),
      }
    );
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
      res = await callUpstream(15000);
    }

    if (!res.ok) {
      void notifyApiFailure({
        platform: "youtube",
        endpoint: "/api/youtube/channel",
        provider: host,
        status: res.status,
      });
      if (res.status === 404) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: `upstream_${res.status}` },
        { status: res.status }
      );
    }

    const d = await res.json();
    console.log("[YouTube channel] raw response:", JSON.stringify(d).slice(0, 300));

    if (!d?.channelId && !d?.title) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const avatarRaw = pickLargest(d.avatar);
    const bannerRaw = pickLargest(d.banner?.desktop);
    const verified =
      Boolean(d.isVerified) ||
      (Array.isArray(d.badges) &&
        d.badges.some((b: Badge) => b?.type === "VERIFIED_CHANNEL" || b?.text === "Verified"));

    const data: YtChannel = {
      channelId: String(d.channelId || ""),
      title: String(d.title || ""),
      handle: d.username ? String(d.username).replace(/^@/, "") : "",
      description: String(d.description || ""),
      avatarUrl: avatarRaw ? proxyImage(avatarRaw) : "",
      bannerUrl: bannerRaw ? proxyImage(bannerRaw) : "",
      subscriberCount: Number(d.stats?.subscribers ?? 0),
      subscribersText: String(d.stats?.subscribersText || ""),
      viewCount: Number(d.stats?.views ?? 0),
      videoCount: Number(d.stats?.videos ?? 0),
      verified,
      country: d.country ? String(d.country) : "",
      joinedDate: d.joinedDate ? String(d.joinedDate) : "",
    };

    setCache(cacheKey, data);
    return jsonCachedAtEdge(data);
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError");
    if (isTimeout) {
      console.warn(`[YouTube channel] upstream timeout for "${urlParam}", returning mock`);
    } else {
      console.error("[YouTube channel]", err);
    }
    return NextResponse.json(mockChannel(urlParam));
  }
}
