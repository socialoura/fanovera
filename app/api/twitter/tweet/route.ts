import { NextRequest, NextResponse } from "next/server";
import { jsonCachedAtEdge } from "@/app/lib/cdnCache";
import { notifyApiFailure } from "@/app/lib/apiAlerts";

export type XTweet = {
  id: string;
  text: string;
  likes: number;
  retweets: number;
  replies: number;
  lang: string;
  author: {
    name: string;
    screenName: string;
    avatarUrl: string;
    verified: boolean;
  };
};

const cache = new Map<string, { data: XTweet; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000;

function getCached(id: string): XTweet | null {
  const entry = cache.get(id);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(id);
    return null;
  }
  return entry.data;
}

function setCache(id: string, data: XTweet) {
  if (cache.size >= 200) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(id, { data, ts: Date.now() });
}

function proxyAvatar(url: string): string {
  if (!url) return "";
  const enhanced = url.replace(/_normal\./, "_400x400.");
  return `/api/image-proxy?url=${encodeURIComponent(enhanced)}`;
}

// Accept either a raw numeric id or a full tweet/status URL (x.com or twitter.com).
function extractTweetId(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^\d{1,25}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/(?:twitter|x)\.com\/[^/?#]+\/status\/(\d{1,25})/i);
  return m ? m[1] : null;
}

function mockTweet(id: string): XTweet {
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) >>> 0;
  const rand = (max: number) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % max;
  };
  return {
    id,
    text: "",
    likes: 50 + rand(5000),
    retweets: 10 + rand(800),
    replies: 5 + rand(400),
    lang: "en",
    author: { name: "", screenName: "", avatarUrl: "", verified: false },
  };
}

export async function GET(req: NextRequest) {
  const rawParam =
    req.nextUrl.searchParams.get("id") ??
    req.nextUrl.searchParams.get("url") ??
    "";
  const id = extractTweetId(rawParam);

  if (!id) {
    return NextResponse.json({ error: "invalid_tweet" }, { status: 400 });
  }

  const cached = getCached(id);
  if (cached) return NextResponse.json(cached);

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json(mockTweet(id));
  }

  const host = "twitter-api45.p.rapidapi.com";
  const key = process.env.RAPIDAPI_KEY;

  try {
    const res = await fetch(
      `https://${host}/tweet.php?id=${encodeURIComponent(id)}`,
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
      void notifyApiFailure({
        platform: "twitter",
        endpoint: "/api/twitter/tweet",
        provider: host,
        status: res.status,
      });
      if (res.status === 404) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: `upstream_${res.status}` },
        { status: 502 }
      );
    }

    const json = await res.json();

    // A valid tweet always carries an id back; its absence means not found.
    if (!json || (!json.id && !json.conversation_id)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const author = json.author ?? {};
    const avatarRaw: string = author.image || "";

    const data: XTweet = {
      id: json.id || id,
      text: json.text || "",
      likes: json.likes ?? 0,
      retweets: json.retweets ?? 0,
      replies: json.replies ?? 0,
      lang: json.lang || "",
      author: {
        name: author.name || "",
        screenName: author.screen_name || "",
        avatarUrl: avatarRaw ? proxyAvatar(avatarRaw) : "",
        verified: author.blue_verified ?? false,
      },
    };

    setCache(id, data);
    return jsonCachedAtEdge(data);
  } catch (err) {
    console.error("[Twitter tweet]", err);
    return NextResponse.json(mockTweet(id));
  }
}
