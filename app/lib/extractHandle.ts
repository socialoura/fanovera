// Extract a clean handle/username from a pasted profile URL.
// Returns null if the input does not look like a recognizable profile URL for
// the given platform — caller should fall back to the raw input.

export type ExtractPlatform =
  | "instagram"
  | "tiktok"
  | "x"
  | "twitter"
  | "twitch"
  | "facebook"
  | "linkedin";

const RESERVED_IG = new Set([
  "p", "reel", "reels", "tv", "explore", "accounts", "stories", "direct",
  "web", "about", "developer", "developers", "press", "api", "legal",
]);

const RESERVED_TIKTOK = new Set([
  "foryou", "following", "live", "discover", "upload", "tag", "search",
  "music", "video", "embed",
]);

const RESERVED_X = new Set([
  "i", "home", "explore", "settings", "messages", "notifications", "search",
  "compose", "login", "signup", "tos", "privacy", "share",
]);

const RESERVED_TWITCH = new Set([
  "directory", "videos", "subscriptions", "downloads", "settings", "p",
  "search", "drops", "wallet",
]);

export function extractHandleFromUrl(
  platform: ExtractPlatform,
  input: string,
): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const looksLikeUrl =
    /^https?:\/\//i.test(trimmed) ||
    /(?:instagram\.com|tiktok\.com|x\.com|twitter\.com|twitch\.tv|facebook\.com|linkedin\.com)/i.test(trimmed);
  if (!looksLikeUrl) return null;

  switch (platform) {
    case "instagram": {
      const m = trimmed.match(/instagram\.com\/([a-zA-Z0-9._]{1,30})/i);
      if (!m) return null;
      if (RESERVED_IG.has(m[1].toLowerCase())) return null;
      return m[1];
    }
    case "tiktok": {
      const m = trimmed.match(/tiktok\.com\/@([a-zA-Z0-9._]{1,24})/i);
      if (!m) return null;
      if (RESERVED_TIKTOK.has(m[1].toLowerCase())) return null;
      return m[1];
    }
    case "x":
    case "twitter": {
      const m = trimmed.match(/(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]{1,15})/i);
      if (!m) return null;
      if (RESERVED_X.has(m[1].toLowerCase())) return null;
      return m[1];
    }
    case "twitch": {
      const m = trimmed.match(/twitch\.tv\/([a-zA-Z0-9_]{4,25})/i);
      if (!m) return null;
      if (RESERVED_TWITCH.has(m[1].toLowerCase())) return null;
      return m[1];
    }
    case "facebook": {
      const m = trimmed.match(/facebook\.com\/([a-zA-Z0-9.\-_]+)/i);
      if (!m) return null;
      return m[1].replace(/\/.*$/, "");
    }
    case "linkedin": {
      const m = trimmed.match(/linkedin\.com\/in\/([a-zA-Z0-9\-_]+)/i);
      if (!m) return null;
      return m[1].replace(/\/.*$/, "");
    }
    default:
      return null;
  }
}
