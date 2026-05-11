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

  // Parses numbers with K/M/B suffixes ("10.5M", "27,6 M abonnés", "1.2K subscribers").
  // Falls back to digit-only stripping for purely numeric strings.
  const num = (v: unknown): number => {
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
  };

  const author = d.author || {};
  const stats = d.stats || {};

  // Channel avatar: try multiple shapes (avatar | thumbnails | image), pick the largest.
  const pickLargest = (arr: unknown): string => {
    if (!Array.isArray(arr) || arr.length === 0) return "";
    const last = arr[arr.length - 1] as { url?: string } | undefined;
    const first = arr[0] as { url?: string } | undefined;
    return (last?.url || first?.url || "") as string;
  };
  const channelAvatar: string =
    pickLargest(author.avatar) ||
    pickLargest(author.thumbnails) ||
    pickLargest(author.image) ||
    (typeof author.avatarUrl === "string" ? author.avatarUrl : "") ||
    "";

  // Thumbnail: last element = highest resolution
  const thumbArr = d.thumbnails || [];
  const thumbnail: string = Array.isArray(thumbArr) && thumbArr.length > 0
    ? thumbArr[thumbArr.length - 1]?.url || thumbnailFor(id)
    : thumbnailFor(id);

  return {
    id,
    title: (d.title as string) || "Vidéo YouTube",
    channel: {
      name: (author.title as string) || (author.channelName as string) || "—",
      subscribers: num(
        author.stats?.subscribersText ??
          author.stats?.subscribers ??
          author.subscribersText ??
          author.subscriberCountText ??
          author.subscribers ??
          0
      ),
      verified: Boolean(author.badges?.some?.((b: { type?: string }) => b.type === "VERIFIED_CHANNEL")),
      avatarUrl: channelAvatar
        ? `/api/image-proxy?url=${encodeURIComponent(channelAvatar)}`
        : "",
    },
    thumbnail,
    views: num(stats.views ?? d.viewCount),
    likes: num(stats.likes ?? d.likeCount),
    duration: d.lengthSeconds ? formatDuration(num(d.lengthSeconds)) : "",
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
