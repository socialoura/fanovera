import { NextRequest, NextResponse } from "next/server";
import { jsonCachedAtEdge } from "@/app/lib/cdnCache";
import { notifyApiFailure } from "@/app/lib/apiAlerts";

export type IgMedia = {
  id: string;
  code: string;
  mediaType: number; // 1=photo, 2=video/reel, 8=carousel
  thumbnailUrl: string;
  videoUrl: string;
  likeCount: number;
  playCount: number;
  commentCount: number;
  caption: string;
  takenAt: number;
  user: {
    username: string;
    fullName: string;
    avatarUrl: string;
    verified: boolean;
  };
};

const SHORTCODE_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function shortcodeToId(code: string): string | null {
  if (!/^[A-Za-z0-9_-]{5,20}$/.test(code)) return null;
  let id = 0n;
  for (const ch of code) {
    const idx = SHORTCODE_ALPHABET.indexOf(ch);
    if (idx === -1) return null;
    id = id * 64n + BigInt(idx);
  }
  return id.toString();
}

function extractShortcode(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{5,20}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(
    /instagram\.com\/(?:[^\/?#]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i
  );
  return m ? m[1] : null;
}

const cache = new Map<string, { data: IgMedia; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000;

function getCached(id: string): IgMedia | null {
  const entry = cache.get(id);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(id);
    return null;
  }
  return entry.data;
}

function setCache(id: string, data: IgMedia) {
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

function mockMedia(id: string, code: string): IgMedia {
  let seed = 0;
  const src = id + code;
  for (let i = 0; i < src.length; i++) seed = (seed * 31 + src.charCodeAt(i)) >>> 0;
  const rand = (max: number) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % max;
  };
  return {
    id,
    code,
    mediaType: 2,
    thumbnailUrl: "",
    videoUrl: "",
    likeCount: 500 + rand(15000),
    playCount: 5000 + rand(150000),
    commentCount: 10 + rand(300),
    caption: "",
    takenAt: Math.floor(Date.now() / 1000) - rand(60 * 60 * 24 * 60),
    user: { username: "user_" + code.slice(0, 6), fullName: "", avatarUrl: "", verified: false },
  };
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  const idParam = req.nextUrl.searchParams.get("id");

  let mediaId: string | null = null;
  let shortcode = "";

  if (idParam && /^\d{6,25}$/.test(idParam)) {
    mediaId = idParam;
  } else if (urlParam) {
    shortcode = extractShortcode(urlParam) || "";
    mediaId = shortcode ? shortcodeToId(shortcode) : null;
  }

  if (!mediaId) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const cached = getCached(mediaId);
  if (cached) return jsonCachedAtEdge(cached);

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json(mockMedia(mediaId, shortcode));
  }

  const host = "instagram-api-fast-reliable-data-scraper.p.rapidapi.com";
  const key = process.env.RAPIDAPI_KEY;
  const id = mediaId;

  async function callUpstream(timeoutMs: number) {
    return fetch(`https://${host}/media?id=${encodeURIComponent(id)}`, {
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
        platform: "instagram",
        endpoint: "/api/instagram/media",
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
    console.log("[Instagram media] raw response:", JSON.stringify(json).slice(0, 300));

    const r = json?.result ?? json?.data ?? json;
    const thumbnailRaw: string =
      r?.image_versions2?.candidates?.[0]?.url ||
      r?.thumbnail_url ||
      r?.display_url ||
      "";
    const videoRaw: string = r?.video_versions?.[0]?.url || "";

    const data: IgMedia = {
      id: mediaId,
      code: r?.code || shortcode,
      mediaType: Number(r?.media_type) || 1,
      thumbnailUrl: thumbnailRaw ? proxyImage(thumbnailRaw) : "",
      videoUrl: videoRaw,
      likeCount: Number(r?.like_count ?? r?.likes_count ?? 0),
      playCount: Number(
        r?.play_count ?? r?.video_view_count ?? r?.view_count ?? 0
      ),
      commentCount: Number(r?.comment_count ?? 0),
      caption: r?.caption?.text || r?.caption || "",
      takenAt: Number(r?.taken_at ?? 0),
      user: {
        username: r?.user?.username || "",
        fullName: r?.user?.full_name || "",
        avatarUrl: r?.user?.profile_pic_url ? proxyImage(r.user.profile_pic_url) : "",
        verified: Boolean(r?.user?.is_verified),
      },
    };

    setCache(mediaId, data);
    return jsonCachedAtEdge(data);
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError");
    if (isTimeout) {
      console.warn(`[Instagram media] upstream timeout for "${mediaId}", returning mock`);
    } else {
      console.error("[Instagram media]", err);
    }
    return NextResponse.json(mockMedia(mediaId, shortcode));
  }
}
