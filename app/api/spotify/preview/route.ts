import { NextRequest, NextResponse } from "next/server";

const SP_RE =
  /(?:open\.spotify\.com\/(?:intl-[a-z]+\/)?track\/|spotify:track:)([a-zA-Z0-9]{22})/;

export type SpoPreview = {
  id: string | null;
  trackName: string;
  artistName: string;
  album: string;
  coverUrl: string | null;
  durationMs: number;
  monthlyListeners: number;
  popularity: number;
  totalStreams: number;
};

function extractTrackId(url: string): string | null {
  const m = url.match(SP_RE);
  return m ? m[1] : null;
}

function hashSeed(input: string) {
  let seed = 0;
  for (let i = 0; i < input.length; i++) {
    seed = (seed * 31 + input.charCodeAt(i)) >>> 0;
  }
  return seed;
}

function makeRand(seed: number) {
  let s = seed || 1;
  return (max: number) => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s % max;
  };
}

function mockFromSeed(
  seedKey: string,
  fallback: { id: string | null; trackName: string; artistName: string },
): SpoPreview {
  const rand = makeRand(hashSeed(seedKey));
  const monthlyListeners = 12_000 + rand(480_000);
  const totalStreams = monthlyListeners * (8 + rand(40));
  return {
    id: fallback.id,
    trackName: fallback.trackName || "Votre son",
    artistName: fallback.artistName || "Votre artiste",
    album: "Single",
    coverUrl: null,
    durationMs: 1000 * (90 + rand(180)),
    monthlyListeners,
    popularity: 40 + rand(50),
    totalStreams,
  };
}

async function fromSpotifyApi(
  trackId: string | null,
  q: string | null,
): Promise<SpoPreview | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!tokenRes.ok) return null;
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  let id = trackId;
  if (!id && q) {
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?type=track&limit=1&q=${encodeURIComponent(q)}`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
        cache: "no-store",
      },
    );
    if (!searchRes.ok) return null;
    const data = (await searchRes.json()) as {
      tracks?: { items?: Array<{ id: string }> };
    };
    id = data.tracks?.items?.[0]?.id ?? null;
  }
  if (!id) return null;

  const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
    headers: { Authorization: `Bearer ${access_token}` },
    cache: "no-store",
  });
  if (!trackRes.ok) return null;
  const t = (await trackRes.json()) as {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: { name: string; images: Array<{ url: string }> };
    duration_ms: number;
    popularity: number;
  };

  const seed = hashSeed(id);
  const rand = makeRand(seed);
  return {
    id: t.id,
    trackName: t.name,
    artistName: t.artists.map((a) => a.name).join(", "),
    album: t.album.name,
    coverUrl: t.album.images[0]?.url ?? null,
    durationMs: t.duration_ms,
    monthlyListeners: 8_000 + Math.round(t.popularity * 18_000) + rand(80_000),
    popularity: t.popularity,
    totalStreams:
      (8_000 + Math.round(t.popularity * 18_000)) * (8 + rand(40)),
  };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const url = sp.get("url") ?? "";
  const name = sp.get("name")?.trim() ?? "";
  const artist = sp.get("artist")?.trim() ?? "";

  const id = url ? extractTrackId(url) : null;
  const hasQuery = Boolean(name && artist);

  if (!id && !hasQuery) {
    return NextResponse.json(
      {
        error: "missing_input",
        message: "Renseignez un lien Spotify ou un titre + artiste.",
      },
      { status: 400 },
    );
  }

  if (url && !id) {
    return NextResponse.json(
      { error: "invalid_url", message: "Lien Spotify invalide." },
      { status: 400 },
    );
  }

  const real = await fromSpotifyApi(id, hasQuery ? `${name} ${artist}` : null);
  if (real) return NextResponse.json(real);

  const fallback = mockFromSeed(id ?? `${name}::${artist}`, {
    id,
    trackName: name || "Aperçu (configurez SPOTIFY_CLIENT_ID/SECRET)",
    artistName: artist || "Artiste",
  });
  return NextResponse.json(fallback);
}
