import { NextRequest, NextResponse } from "next/server";
import { jsonCachedAtEdge } from "@/app/lib/cdnCache";
import { notifyApiFailure } from "@/app/lib/apiAlerts";

export type SpoArtist = {
  id: string;
  name: string;
  shareUrl: string;
  verified: boolean;
  avatarUrl: string;
};

type RapidArtistResponse = {
  status?: boolean;
  errorId?: string;
  type?: string;
  id?: string;
  name?: string;
  shareUrl?: string;
  verified?: boolean;
  visuals?: {
    avatar?: Array<{ url?: string; width?: number; height?: number }>;
  };
};

const cache = new Map<string, { data: SpoArtist; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key: string): SpoArtist | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: SpoArtist) {
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

function pickAvatar(visuals: RapidArtistResponse["visuals"]): string {
  const list = visuals?.avatar ?? [];
  if (!Array.isArray(list) || list.length === 0) return "";
  const sorted = [...list].sort(
    (a, b) => (b.width ?? 0) - (a.width ?? 0)
  );
  return sorted[0]?.url || "";
}

function mockArtist(name: string): SpoArtist {
  return {
    id: "mock_" + name.toLowerCase().replace(/\s+/g, "_").slice(0, 20),
    name: name || "Artist",
    shareUrl: "",
    verified: false,
    avatarUrl: "",
  };
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim() ?? "";

  if (!name || name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const cacheKey = name.toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) return jsonCachedAtEdge(cached);

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json(mockArtist(name));
  }

  const host = "spotify-scraper.p.rapidapi.com";
  const key = process.env.RAPIDAPI_KEY;

  async function callUpstream(timeoutMs: number) {
    return fetch(
      `https://${host}/v1/artist/search?name=${encodeURIComponent(name)}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": host,
          "x-rapidapi-key": key!,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(timeoutMs),
      }
    );
  }

  try {
    let res: Response;
    try {
      res = await callUpstream(10000);
    } catch (firstErr) {
      const isTimeout =
        firstErr instanceof Error &&
        (firstErr.name === "TimeoutError" || firstErr.name === "AbortError");
      if (!isTimeout) throw firstErr;
      res = await callUpstream(12000);
    }

    if (!res.ok) {
      void notifyApiFailure({
        platform: "spotify",
        endpoint: "/api/spotify/artist",
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

    const json = (await res.json()) as RapidArtistResponse;
    console.log("[Spotify artist] raw response:", JSON.stringify(json).slice(0, 300));

    if (!json?.status || !json?.id || !json?.name) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const avatarRaw = pickAvatar(json.visuals);

    const data: SpoArtist = {
      id: String(json.id),
      name: String(json.name),
      shareUrl: json.shareUrl ? String(json.shareUrl) : "",
      verified: Boolean(json.verified),
      avatarUrl: avatarRaw ? proxyImage(avatarRaw) : "",
    };

    setCache(cacheKey, data);
    return jsonCachedAtEdge(data);
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError");
    if (isTimeout) {
      console.warn(`[Spotify artist] upstream timeout for "${name}", returning mock`);
    } else {
      console.error("[Spotify artist]", err);
    }
    return NextResponse.json(mockArtist(name));
  }
}
