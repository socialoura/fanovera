import { NextRequest, NextResponse } from "next/server";

type SpotifyResult = {
  id: string;
  name: string;
  shareUrl: string | null;
  durationText: string | null;
  artists: Array<{ name: string; id: string | null }>;
  cover: string | null;
  albumName: string | null;
  playCount?: number | null;
};

type SpotifyRawArtist = {
  id?: unknown;
  name?: unknown;
};

type SpotifyRawTrack = {
  id?: unknown;
  name?: unknown;
  shareUrl?: unknown;
  durationText?: unknown;
  artists?: unknown;
  album?: {
    cover?: unknown;
    name?: unknown;
  };
  playCount?: unknown;
  status?: unknown;
};

type SpotifyRawCover = {
  url?: unknown;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 200;
const cache = new Map<string, { data: SpotifyResult; ts: number }>();

function getCached(key: string): SpotifyResult | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: SpotifyResult) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

function parsePlayCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value));
  if (typeof value === "string") {
    const n = Number(value.replace(/[^\d.]/g, ""));
    if (Number.isFinite(n)) return Math.max(0, Math.round(n));
  }
  return null;
}

function normalize(raw: SpotifyRawTrack, includePlayCount: boolean): SpotifyResult | null {
  if (!raw?.id || !raw?.name) return null;

  const coverList = Array.isArray(raw.album?.cover) ? raw.album.cover : [];
  const coverUrl = coverList.length > 0 ? (coverList[coverList.length - 1] as SpotifyRawCover)?.url : null;
  const bestCover = coverUrl ? String(coverUrl) : null;

  const result: SpotifyResult = {
    id: String(raw.id),
    name: String(raw.name),
    shareUrl: raw.shareUrl ? String(raw.shareUrl) : null,
    durationText: raw.durationText ? String(raw.durationText) : null,
    artists: Array.isArray(raw.artists)
      ? raw.artists.map((a: SpotifyRawArtist) => ({ name: a?.name ? String(a.name) : "", id: a?.id ? String(a.id) : null }))
      : [],
    cover: bestCover,
    albumName: raw.album?.name ? String(raw.album.name) : null,
  };

  if (includePlayCount) result.playCount = parsePlayCount(raw.playCount);
  return result;
}

async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { method: "GET", headers, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const mode = sp.get("mode") ?? "search";

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "rapidapi_key_missing", message: "RAPIDAPI_KEY manquant." }, { status: 500 });
  }

  const headers = {
    "x-rapidapi-host": "spotify-scraper.p.rapidapi.com",
    "x-rapidapi-key": apiKey,
  };

  try {
    if (mode === "track") {
      const trackId = sp.get("trackId")?.trim() ?? "";
      if (!trackId) {
        return NextResponse.json({ error: "missing_trackId", message: "trackId requis." }, { status: 400 });
      }

      const cacheKey = `track:${trackId}`;
      const cached = getCached(cacheKey);
      if (cached) return NextResponse.json(cached);

      const providerUrl = `https://spotify-scraper.p.rapidapi.com/v1/track/metadata?trackId=${encodeURIComponent(trackId)}`;
      const res = await fetchWithTimeout(providerUrl, headers, 8000);

      if (!res.ok) {
        if (res.status === 404) {
          return NextResponse.json({ error: "not_found", message: "Track introuvable." }, { status: 404 });
        }
        return NextResponse.json({ error: "provider_error", message: `Spotify provider status ${res.status}.` }, { status: 502 });
      }

      const raw = await res.json();
      const result = normalize(raw, true);
      if (!raw?.status || !result) {
        return NextResponse.json({ error: "not_found", message: "Track introuvable." }, { status: 404 });
      }

      setCached(cacheKey, result);
      return NextResponse.json(result);
    }

    const q = sp.get("q")?.trim() ?? "";
    if (!q) {
      return NextResponse.json({ error: "missing_q", message: "q requis." }, { status: 400 });
    }

    const cacheKey = `search:${q.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json(cached);

    const providerUrl = `https://spotify-scraper.p.rapidapi.com/v1/track/search?name=${encodeURIComponent(q)}`;
    const res = await fetchWithTimeout(providerUrl, headers, 8000);

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: "not_found", message: "Track introuvable." }, { status: 404 });
      }
      return NextResponse.json({ error: "provider_error", message: `Spotify provider status ${res.status}.` }, { status: 502 });
    }

    const raw = await res.json();
    const result = normalize(raw, false);
    if (!raw?.status || !result) {
      return NextResponse.json({ error: "not_found", message: "Track introuvable." }, { status: 404 });
    }

    setCached(cacheKey, result);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error && err.name === "AbortError"
      ? "Spotify provider timeout."
      : "Erreur provider Spotify.";
    return NextResponse.json({ error: "provider_error", message }, { status: 502 });
  }
}
