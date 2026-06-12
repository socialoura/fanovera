import { NextRequest, NextResponse } from "next/server";
import { jsonCachedAtEdge } from "@/app/lib/cdnCache";
import { notifyApiFailure } from "@/app/lib/apiAlerts";

// One of the user's recent Instagram posts, trimmed down to what the
// post-selection UI (instagram-2 step 3) and the SMM fulfillment need.
export type IgPost = {
  id: string;
  code: string;
  caption: string;
  thumbnailUrl: string;
  likeCount: number;
  commentCount: number;
  playCount: number;
  // 1 = image, 2 = video/reel, 8 = carousel
  mediaType: number;
  // Canonical post URL (https://www.instagram.com/p/<code>/) — used as the cart
  // line postUrl so BulkFollows can target the exact publication.
  url: string;
};

const host = "instagram120.p.rapidapi.com";

const cache = new Map<string, { data: IgPost[]; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000;

function getCached(username: string): IgPost[] | null {
  const entry = cache.get(username);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(username);
    return null;
  }
  return entry.data;
}

function setCache(username: string, data: IgPost[]) {
  if (cache.size >= 200) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(username, { data, ts: Date.now() });
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

function postUrl(code: string): string {
  return `https://www.instagram.com/p/${code}/`;
}

function mockPosts(username: string): IgPost[] {
  let seed = 0;
  for (let i = 0; i < username.length; i++) seed = (seed * 31 + username.charCodeAt(i)) >>> 0;
  const rand = (max: number) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % max;
  };
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 12 }).map((_, i) => {
    let code = "";
    for (let j = 0; j < 11; j++) code += ALPHABET[rand(ALPHABET.length)];
    const isReel = rand(3) === 0;
    return {
      id: String(3000000000000000000 + rand(900000000) * 1000 + i),
      code,
      caption: "",
      thumbnailUrl: "",
      likeCount: (rand(40) + 1) * 100,
      commentCount: rand(120) + 2,
      playCount: isReel ? (rand(180) + 8) * 1000 : 0,
      mediaType: isReel ? 2 : 1,
      url: postUrl(code),
    };
  });
}

// The instagram120 posts payload can arrive in several shapes (GraphQL-style
// edges[].node, the private-API "items", or a bare result array). Normalise all
// of them to a flat list of post nodes.
function extractNodes(json: unknown): Record<string, unknown>[] {
  const j = json as Record<string, unknown> | null;
  const result = (j?.result ?? j?.data ?? j) as Record<string, unknown> | unknown[] | null;

  const candidates: unknown[] = [];
  if (Array.isArray(result)) {
    candidates.push(...result);
  } else if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    const list =
      (r.edges as unknown[]) ??
      (r.items as unknown[]) ??
      (r.posts as unknown[]) ??
      ((r.data as Record<string, unknown> | undefined)?.edges as unknown[]) ??
      [];
    if (Array.isArray(list)) candidates.push(...list);
  }

  return candidates
    .map((c) => {
      const obj = c as Record<string, unknown>;
      // edges[] wrap the post in `node`; items/posts are already the node
      const node = (obj?.node ?? obj) as Record<string, unknown>;
      return node;
    })
    .filter((n) => n && typeof n === "object");
}

function mapNode(node: Record<string, unknown>): IgPost | null {
  const code = String(node.code || node.shortcode || "");
  if (!code) return null;

  const iv2 = node.image_versions2 as Record<string, unknown> | undefined;
  const candidates = (iv2?.candidates as Record<string, unknown>[] | undefined) ?? [];
  const carousel = node.carousel_media as Record<string, unknown>[] | undefined;
  const carouselIv2 = carousel?.[0]?.image_versions2 as Record<string, unknown> | undefined;
  const carouselCandidates = (carouselIv2?.candidates as Record<string, unknown>[] | undefined) ?? [];

  const thumbnailRaw = String(
    candidates[0]?.url ||
      carouselCandidates[0]?.url ||
      node.display_url ||
      node.thumbnail_src ||
      node.thumbnail_url ||
      ""
  );

  const likePreview = node.edge_media_preview_like as Record<string, unknown> | undefined;
  const likedBy = node.edge_liked_by as Record<string, unknown> | undefined;
  const likeCount = toNumber(
    node.like_count ?? likePreview?.count ?? likedBy?.count ?? 0
  );

  const commentEdge = node.edge_media_to_comment as Record<string, unknown> | undefined;
  const commentCount = toNumber(node.comment_count ?? commentEdge?.count ?? 0);

  const playCount = toNumber(
    node.play_count ?? node.ig_play_count ?? node.view_count ?? node.video_view_count ?? 0
  );

  const captionEdges = (node.edge_media_to_caption as Record<string, unknown> | undefined)
    ?.edges as Record<string, unknown>[] | undefined;
  const captionFromEdge = (captionEdges?.[0]?.node as Record<string, unknown> | undefined)?.text;
  const captionObj = node.caption as Record<string, unknown> | string | undefined;
  const caption = String(
    (typeof captionObj === "object" ? captionObj?.text : captionObj) || captionFromEdge || ""
  );

  const isVideo = Boolean(node.is_video);
  const mediaType = toNumber(node.media_type) || (isVideo ? 2 : 1);

  return {
    id: String(node.id || node.pk || code),
    code,
    caption,
    thumbnailUrl: thumbnailRaw ? proxyImage(thumbnailRaw) : "",
    likeCount,
    commentCount,
    playCount,
    mediaType,
    url: postUrl(code),
  };
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams
    .get("username")
    ?.trim()
    .toLowerCase()
    .replace(/^@/, "");

  if (!username || !/^[a-zA-Z0-9._]{2,30}$/.test(username)) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }

  const cached = getCached(username);
  if (cached) return NextResponse.json({ posts: cached });

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json({ posts: mockPosts(username) });
  }

  const key = process.env.RAPIDAPI_KEY;

  async function callUpstream(timeoutMs: number) {
    return fetch(`https://${host}/api/instagram/posts`, {
      method: "POST",
      headers: {
        "x-rapidapi-host": host,
        "x-rapidapi-key": key!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, maxId: "" }),
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
      // Un seul retry rapide après timeout (l'API se réveille souvent au 2e appel)
      res = await callUpstream(15000);
    }

    if (!res.ok) {
      void notifyApiFailure({
        platform: "instagram",
        endpoint: "/api/instagram/posts",
        provider: host,
        status: res.status,
      });
      // Fall back to mock so the post-selection UI still renders something.
      return NextResponse.json({ posts: mockPosts(username) });
    }

    const json = await res.json();
    console.log("[Instagram posts] raw response:", JSON.stringify(json).slice(0, 400));

    const posts: IgPost[] = extractNodes(json)
      .map(mapNode)
      .filter((p): p is IgPost => p !== null)
      .slice(0, 12);

    if (posts.length === 0) {
      return NextResponse.json({ posts: mockPosts(username) });
    }

    setCache(username, posts);
    return jsonCachedAtEdge({ posts });
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError");
    if (isTimeout) {
      console.warn(`[Instagram posts] upstream timeout for "${username}", returning mock`);
    } else {
      console.error("[Instagram posts]", err);
    }
    return NextResponse.json({ posts: mockPosts(username) });
  }
}
