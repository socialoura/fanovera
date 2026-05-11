import { NextRequest, NextResponse } from "next/server";

const YT_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

export type YtPreview = {
  id: string;
  title: string;
  channel: { name: string; subscribers: number; verified: boolean; avatarUrl: string };
  thumbnail: string;
  views: number;
  likes: number;
  duration: string;
  publishedAt: string;
};

function extractVideoId(url: string): string | null {
  const m = url.match(YT_RE);
  return m ? m[1] : null;
}

function thumbnailFor(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function formatDuration(secs: number) {
  const s = Math.max(0, Math.floor(secs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`;
}

// Parses numbers with K/M/B suffixes ("10.5M", "27,6 M abonnés", "1.2K subscribers").
function parseCount(v: unknown): number {
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v !== "string") return 0;
  const s = v.replace(/\u00a0/g, " ").trim();
  if (!s) return 0;
  const m = s.match(/([\d.,]+)\s*([KkMmBb])/);
  if (m) {
    const n = parseFloat(m[1].replace(",", "."));
    const mult = m[2].toUpperCase() === "K" ? 1e3 : m[2].toUpperCase() === "M" ? 1e6 : 1e9;
    return Math.round(n * mult);
  }
  const digits = s.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function pickLargest(arr: unknown): string {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  const last = arr[arr.length - 1] as { url?: string } | undefined;
  const first = arr[0] as { url?: string } | undefined;
  return (last?.url || first?.url || "") as string;
}

async function fetchChannelDetails(channelId: string, host: string, key: string) {
  try {
    const r = await fetch(`https://${host}/channel/details/?id=${encodeURIComponent(channelId)}&hl=fr&gl=FR`, {
      headers: { "x-rapidapi-host": host, "x-rapidapi-key": key },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (await r.json()) as any;
  } catch {
    return null;
  }
}

async function fromRapidApi(id: string): Promise<YtPreview> {
  const host = "youtube138.p.rapidapi.com";
  const key = process.env.RAPIDAPI_KEY!;
  const r = await fetch(`https://${host}/video/details/?id=${id}&hl=fr&gl=FR`, {
    headers: {
      "x-rapidapi-host": host,
      "x-rapidapi-key": key,
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`upstream_${r.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = (await r.json()) as any;

  const author = d.author || {};
  const stats = d.stats || {};

  // Pull channelId then enrich with /channel/details (avatar + subscribers).
  const channelId: string =
    author.channelId || author.channel_id || author.id || "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ch: any = null;
  if (channelId) ch = await fetchChannelDetails(channelId, host, key);

  const channelAvatar: string =
    pickLargest(ch?.avatar) ||
    pickLargest(ch?.thumbnails) ||
    pickLargest(ch?.image) ||
    pickLargest(author.avatar) ||
    pickLargest(author.thumbnails) ||
    pickLargest(author.image) ||
    (typeof author.avatarUrl === "string" ? author.avatarUrl : "") ||
    "";

  const subscribers = parseCount(
    ch?.stats?.subscribers ??
      ch?.stats?.subscribersText ??
      ch?.subscriberCount ??
      ch?.subscriberCountText ??
      ch?.subscribers ??
      author.stats?.subscribers ??
      author.stats?.subscribersText ??
      author.subscriberCountText ??
      author.subscribers ??
      0
  );

  // Thumbnail: last element = highest resolution
  const thumbArr = d.thumbnails || [];
  const thumbnail: string = Array.isArray(thumbArr) && thumbArr.length > 0
    ? thumbArr[thumbArr.length - 1]?.url || thumbnailFor(id)
    : thumbnailFor(id);

  return {
    id,
    title: (d.title as string) || "Vidéo YouTube",
    channel: {
      name: (ch?.title as string) || (author.title as string) || (author.channelName as string) || "—",
      subscribers,
      verified: Boolean(
        ch?.is_verified ??
          ch?.badges?.some?.((b: { type?: string }) => b.type === "VERIFIED_CHANNEL") ??
          author.badges?.some?.((b: { type?: string }) => b.type === "VERIFIED_CHANNEL")
      ),
      avatarUrl: channelAvatar
        ? `/api/image-proxy?url=${encodeURIComponent(channelAvatar)}`
        : "",
    },
    thumbnail,
    views: parseCount(stats.views ?? d.viewCount),
    likes: parseCount(stats.likes ?? d.likeCount),
    duration: d.lengthSeconds ? formatDuration(parseCount(d.lengthSeconds)) : "",
    publishedAt: (d.publishedDate as string) || (d.publishDate as string) || "",
  };
}

function mockPreview(id: string): YtPreview {
  // Stable pseudo-random numbers from the video id so the preview feels real
  // without the API key. Will be replaced by the real call as soon as
  // RAPIDAPI_KEY is set in .env.local.
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) >>> 0;
  const rand = (max: number) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % max;
  };
  const views = 5_000 + rand(120_000);
  return {
    id,
    title: "Aperçu de votre vidéo (configurez RapidAPI pour les vrais titres)",
    channel: {
      name: "Votre chaîne",
      subscribers: 8_000 + rand(40_000),
      verified: true,
      avatarUrl: "",
    },
    thumbnail: thumbnailFor(id),
    views,
    likes: Math.round(views * (0.03 + (rand(40) / 1000))),
    duration: formatDuration(60 + rand(540)),
    publishedAt: "",
  };
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") ?? "";
  const id = extractVideoId(url);
  if (!id) {
    return NextResponse.json(
      { error: "invalid_url", message: "URL YouTube invalide." },
      { status: 400 },
    );
  }

  if (!process.env.RAPIDAPI_KEY) {
    // No key yet → return a mock that still uses the real public thumbnail.
    return NextResponse.json(mockPreview(id));
  }

  try {
    const data = await fromRapidApi(id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      ...mockPreview(id),
      title: "Vidéo YouTube",
    });
  }
}
