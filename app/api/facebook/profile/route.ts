import { NextRequest, NextResponse } from "next/server";

export type FbProfile = {
  name: string;
  handle: string;
  avatarUrl: string;
  coverImageUrl: string;
  followersCount: number;
  likesCount: number;
  categories: string[];
  verified: boolean;
};

const cache = new Map<string, { data: FbProfile; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000;

function getCached(key: string): FbProfile | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: FbProfile) {
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

function mockProfile(handle: string): FbProfile {
  let seed = 0;
  for (let i = 0; i < handle.length; i++) seed = (seed * 31 + handle.charCodeAt(i)) >>> 0;
  const rand = (max: number) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % max;
  };
  return {
    name: handle.replace(/[-.]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    handle,
    avatarUrl: "",
    coverImageUrl: "",
    followersCount: 1000 + rand(20000),
    likesCount: 800 + rand(15000),
    categories: ["Page"],
    verified: false,
  };
}

export async function GET(req: NextRequest) {
  const rawHandle = req.nextUrl.searchParams
    .get("handle")
    ?.trim();

  if (!rawHandle) {
    return NextResponse.json({ error: "invalid_handle" }, { status: 400 });
  }

  const cached = getCached(rawHandle);
  if (cached) return NextResponse.json(cached);

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json(mockProfile(rawHandle));
  }

  const host = "facebook-scraper3.p.rapidapi.com";
  const key = process.env.RAPIDAPI_KEY;

  const fbUrl = `https://www.facebook.com/${encodeURIComponent(rawHandle)}`;

  try {
    const res = await fetch(
      `https://${host}/page/details?url=${encodeURIComponent(fbUrl)}`,
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
    const r = json?.results ?? json;

    if (!r || (!r.name && !r.page_id)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const avatarRaw: string = r.image || "";
    const coverRaw: string = r.cover_image || "";

    const data: FbProfile = {
      name: r.name || rawHandle,
      handle: rawHandle,
      avatarUrl: avatarRaw ? proxyAvatar(avatarRaw) : "",
      coverImageUrl: coverRaw ? proxyAvatar(coverRaw) : "",
      followersCount: r.followers ?? 0,
      likesCount: r.likes ?? 0,
      categories: Array.isArray(r.categories) ? r.categories : [],
      verified: r.verified ?? false,
    };

    setCache(rawHandle, data);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Facebook profile]", err);
    return NextResponse.json(mockProfile(rawHandle));
  }
}
