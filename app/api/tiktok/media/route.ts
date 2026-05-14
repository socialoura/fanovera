import { NextRequest, NextResponse } from "next/server";
import { jsonCachedAtEdge } from "@/app/lib/cdnCache";
import { notifyApiFailure } from "@/app/lib/apiAlerts";

export type TtMedia = {
  id: string;
  desc: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  likeCount: number;
  playCount: number;
  commentCount: number;
  shareCount: number;
  createTime: number;
  user: {
    username: string;
    fullName: string;
    avatarUrl: string;
    verified: boolean;
  };
};

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d{6,25}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(
    /tiktok\.com\/(?:@[^\/?#]+\/)?(?:video|v)\/(\d+)/i
  );
  return m ? m[1] : null;
}

const cache = new Map<string, { data: TtMedia; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000;

function getCached(id: string): TtMedia | null {
  const entry = cache.get(id);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(id);
    return null;
  }
  return entry.data;
}

function setCache(id: string, data: TtMedia) {
  if (cache.size >= 200) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(id, { data, ts: Date.now() });
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

function mockMedia(id: string): TtMedia {
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) >>> 0;
  const rand = (max: number) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % max;
  };
  return {
    id,
    desc: "",
    thumbnailUrl: "",
    duration: 15 + rand(60),
    width: 576,
    height: 1024,
    likeCount: 1000 + rand(50000),
    playCount: 10000 + rand(500000),
    commentCount: 50 + rand(1000),
    shareCount: 20 + rand(500),
    createTime: Math.floor(Date.now() / 1000) - rand(60 * 60 * 24 * 90),
    user: { username: "user_" + id.slice(0, 6), fullName: "", avatarUrl: "", verified: false },
  };
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  const idParam = req.nextUrl.searchParams.get("id");

  let videoId: string | null = null;
  if (idParam && /^\d{6,25}$/.test(idParam)) {
    videoId = idParam;
  } else if (urlParam) {
    videoId = extractVideoId(urlParam);
  }

  if (!videoId) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const cached = getCached(videoId);
  if (cached) return jsonCachedAtEdge(cached);

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json(mockMedia(videoId));
  }

  const host = "tiktok-api23.p.rapidapi.com";
  const key = process.env.RAPIDAPI_KEY;
  const id = videoId;

  async function callUpstream(timeoutMs: number) {
    return fetch(`https://${host}/api/post/detail?videoId=${encodeURIComponent(id)}`, {
      method: "GET",
      headers: {
        "x-rapidapi-host": host,
        "x-rapidapi-key": key!,
        "Content-Type": "application/json",
      },
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
      res = await callUpstream(15000);
    }

    if (!res.ok) {
      void notifyApiFailure({
        platform: "tiktok",
        endpoint: "/api/tiktok/media",
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

    const json = await res.json();
    console.log("[TikTok media] raw response:", JSON.stringify(json).slice(0, 300));

    const item = json?.itemInfo?.itemStruct ?? json?.itemStruct ?? json;
    if (!item || (json?.statusCode && json.statusCode !== 0)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const stats = item?.statsV2 ?? item?.stats ?? {};
    const author = item?.author ?? {};
    const video = item?.video ?? {};

    const avatarRaw: string =
      author.avatarLarger || author.avatarMedium || author.avatarThumb || "";
    const coverRaw: string = video.cover || video.originCover || video.dynamicCover || "";

    const data: TtMedia = {
      id: String(item?.id || videoId),
      desc: item?.desc || "",
      thumbnailUrl: coverRaw ? proxyImage(coverRaw) : "",
      duration: toNumber(video.duration),
      width: toNumber(video.width),
      height: toNumber(video.height),
      likeCount: toNumber(stats.diggCount),
      playCount: toNumber(stats.playCount),
      commentCount: toNumber(stats.commentCount),
      shareCount: toNumber(stats.shareCount),
      createTime: toNumber(item?.createTime),
      user: {
        username: author.uniqueId || "",
        fullName: author.nickname || "",
        avatarUrl: avatarRaw ? proxyImage(avatarRaw) : "",
        verified: Boolean(author.verified),
      },
    };

    setCache(videoId, data);
    return jsonCachedAtEdge(data);
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError");
    if (isTimeout) {
      console.warn(`[TikTok media] upstream timeout for "${videoId}", returning mock`);
    } else {
      console.error("[TikTok media]", err);
    }
    return NextResponse.json(mockMedia(videoId));
  }
}
