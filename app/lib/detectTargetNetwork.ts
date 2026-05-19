import type { NetworkId } from "./networks";

// Order matters: more specific aliases first. "tik tok" before "tik" so the
// space variant matches before any bare prefix would.
const NETWORK_ALIASES: { id: NetworkId; patterns: RegExp[] }[] = [
  { id: "instagram", patterns: [/\binstagram\b/i, /\binsta\b/i, /\big\b/i] },
  { id: "tiktok", patterns: [/\btiktok\b/i, /\btik[\s_-]?tok\b/i, /\btt\b/i] },
  { id: "youtube", patterns: [/\byoutube\b/i, /\byt\b/i] },
  { id: "spotify", patterns: [/\bspotify\b/i] },
  { id: "twitter", patterns: [/\btwitter\b/i, /\btweet/i, /\bx[\s_-]followers?\b/i, /\bx\.com\b/i] },
  { id: "facebook", patterns: [/\bfacebook\b/i, /\bfb\b/i, /\bmeta\b/i] },
  { id: "linkedin", patterns: [/\blinkedin\b/i, /\blinked[\s_-]?in\b/i] },
  { id: "twitch", patterns: [/\btwitch\b/i] },
];

const UTM_KEYS = ["utm_term", "utm_content", "utm_campaign"] as const;

/**
 * Inspects UTM params on the URL (in priority order: term > content > campaign)
 * and returns the network the visitor most likely intended. Returns null when
 * no network name appears, so callers can fall back to the generic hero.
 *
 * "ig" / "tt" / "yt" / "fb" are accepted as short aliases — they show up in
 * ad-group names from concise campaign structures. We anchor on word boundaries
 * to avoid matching them inside longer words (e.g. "yt" inside "lyrics").
 */
export function detectTargetNetworkFromParams(
  params: URLSearchParams | { get: (key: string) => string | null } | null | undefined,
): NetworkId | null {
  if (!params) return null;
  for (const key of UTM_KEYS) {
    const raw = params.get(key);
    if (!raw) continue;
    const decoded = decodeURIComponent(raw.replace(/\+/g, " "));
    for (const { id, patterns } of NETWORK_ALIASES) {
      for (const re of patterns) {
        if (re.test(decoded)) return id;
      }
    }
  }
  return null;
}
