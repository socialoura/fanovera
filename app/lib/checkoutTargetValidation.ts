export function isValidCheckoutEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function cleanAtHandle(value: string): string {
  return value.replace(/^@/, "").trim();
}

export function cleanLowerAtHandle(value: string): string {
  return cleanAtHandle(value).toLowerCase();
}

const FACEBOOK_RE = /facebook\.com\/([a-zA-Z0-9.\-_]+)/;
const LINKEDIN_RE = /linkedin\.com\/(in|company|school)\/([a-zA-Z0-9\-_.]+)/i;
const YOUTUBE_VIDEO_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/;
const YOUTUBE_CHANNEL_RE = /^https?:\/\/(?:www\.)?youtube\.com\/(?:@[A-Za-z0-9_.-]+|c\/[A-Za-z0-9_.-]+|user\/[A-Za-z0-9_.-]+|channel\/UC[A-Za-z0-9_-]{22})\/?$/i;
const SPOTIFY_TRACK_RE = /(?:open\.spotify\.com\/(?:intl-[a-z]+\/)?track\/|spotify:track:)([a-zA-Z0-9]{22})/;
const INSTAGRAM_POST_RE = /instagram\.com\/(?:[^\/?#]+\/)?(?:p|reel|reels|tv)\/[A-Za-z0-9_-]+/i;
const TIKTOK_POST_RE = /tiktok\.com\/(?:@[^\/?#]+\/)?(?:video|v)\/\d+/i;

export function extractFacebookHandle(input: string): string | null {
  const trimmed = cleanAtHandle(input);
  if (!trimmed) return null;
  if (trimmed.startsWith("http") || trimmed.includes("facebook.com")) {
    const match = trimmed.match(FACEBOOK_RE);
    if (!match) return null;
    const handle = match[1].replace(/\/.*$/, "").replace(/[^a-zA-Z0-9.\-_]/g, "");
    return handle.length >= 3 ? handle : null;
  }
  return /^[a-zA-Z0-9.\-_]{3,50}$/.test(trimmed) ? trimmed : null;
}

export function extractLinkedinHandle(input: string): string | null {
  const trimmed = cleanAtHandle(input);
  if (!trimmed) return null;
  if (trimmed.startsWith("http") || trimmed.includes("linkedin.com")) {
    const match = trimmed.match(LINKEDIN_RE);
    if (!match) return null;
    const kind = match[1].toLowerCase();
    const handle = match[2].replace(/\/.*$/, "");
    return `${kind}/${handle}`;
  }
  const pathMatch = trimmed.match(/^(in|company|school)\/([a-zA-Z0-9\-_.]+)$/i);
  if (pathMatch) return `${pathMatch[1].toLowerCase()}/${pathMatch[2]}`;
  return /^[a-zA-Z0-9\-_.]{3,100}$/.test(trimmed) ? `in/${trimmed}` : null;
}

export function isInstagramUsername(input: string): boolean {
  return /^[a-zA-Z0-9._]{2,30}$/.test(cleanAtHandle(input));
}

export function isTikTokUsername(input: string): boolean {
  return /^[a-zA-Z0-9._]{2,24}$/.test(cleanAtHandle(input));
}

export function isTwitterUsername(input: string): boolean {
  return /^[a-zA-Z0-9_]{4,15}$/.test(cleanAtHandle(input));
}

export function isTwitchUsername(input: string): boolean {
  return /^[a-zA-Z0-9_]{4,25}$/.test(input.replace(/^@/, "").replace(/^twitch\.tv\//, "").trim());
}

export function isYoutubeVideoUrl(input: string): boolean {
  return YOUTUBE_VIDEO_RE.test(input.trim());
}

export function isYoutubeChannelUrl(input: string): boolean {
  return YOUTUBE_CHANNEL_RE.test(input.trim());
}

export function isSpotifyArtistName(input: string): boolean {
  const clean = input.trim();
  return clean.length >= 2 && clean.length <= 80;
}

export function isSpotifyTrackTarget(input: string): boolean {
  const clean = input.trim();
  if (!clean) return false;
  if (clean.includes("spotify:track:") || clean.includes("open.spotify.com")) {
    return SPOTIFY_TRACK_RE.test(clean);
  }
  return clean.length >= 3;
}

export function isInstagramPostUrl(input: string): boolean {
  return INSTAGRAM_POST_RE.test(input.trim());
}

export function isTikTokPostUrl(input: string): boolean {
  return TIKTOK_POST_RE.test(input.trim());
}
