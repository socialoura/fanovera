import { sql } from "./db";

/**
 * Service classification helpers used by the email lifecycle / cross-sell
 * features. Lives here (not in productCatalog.ts) so it's safe to import from
 * server-side email code without dragging UI catalog data along.
 */

export type ServiceKind =
  | "followers"
  | "subscribers"
  | "likes"
  | "views"
  | "streams"
  | "live_viewers"
  | "monthly_listeners"
  | "comments"
  | "shares"
  | "saves"
  | "retweets"
  | "other";

const PREFIX_RX = /^(ig|tt|yt|sp|spo|fb|x|tw|li|in)_/;

/**
 * Maps a platform-prefixed service name (e.g. `ig_followers`, `sp_streams`)
 * to a generic kind ("followers", "streams", ...). Used to localize copy and
 * pick complementary products. Falls back to "other" when unrecognized.
 */
export function getServiceKind(service: string): ServiceKind {
  if (!service) return "other";
  const lower = service.toLowerCase();
  const stripped = lower.replace(PREFIX_RX, "");
  if (stripped.includes("subscriber")) return "subscribers";
  if (stripped.includes("monthly") || stripped.includes("listener")) return "monthly_listeners";
  if (stripped.includes("live_viewer") || stripped.includes("live viewer")) return "live_viewers";
  if (stripped.includes("stream") || stripped.includes("play")) return "streams";
  if (stripped.includes("retweet")) return "retweets";
  if (stripped.includes("follower")) return "followers";
  if (stripped.includes("like")) return "likes";
  if (stripped.includes("view")) return "views";
  if (stripped.includes("comment")) return "comments";
  if (stripped.includes("repost") || stripped.includes("share")) return "shares";
  if (stripped.includes("save")) return "saves";
  return "other";
}

/**
 * Pulls the most prominent service from a cart payload. We pick the first
 * item with a recognized `service` field — for combos (followers + likes)
 * this is good enough since the user typically considers them a single
 * purchase intent.
 */
export function getDominantService(cart: unknown): string {
  if (!Array.isArray(cart)) return "";
  for (const item of cart) {
    if (item && typeof item === "object") {
      const s = (item as { service?: unknown }).service;
      if (typeof s === "string" && s.length > 0) return s;
    }
  }
  return "";
}

/**
 * Per-platform complement: if customer bought X, suggest Y as cross-sell.
 * Pattern is "complete the funnel" — followers without likes look fake, etc.
 *
 * Returns a fully-qualified service name (with platform prefix) so the
 * downstream pricing lookup is unambiguous.
 */
const COMPLEMENT: Record<string, Partial<Record<ServiceKind, string>>> = {
  instagram: {
    followers: "ig_likes",
    likes: "ig_views",
    views: "ig_likes",
    comments: "ig_likes",
  },
  tiktok: {
    followers: "tt_likes",
    likes: "tt_views",
    views: "tt_likes",
    comments: "tt_likes",
  },
  youtube: {
    subscribers: "yt_views",
    views: "yt_subscribers",
    likes: "yt_views",
  },
  spotify: {
    streams: "sp_followers",
    monthly_listeners: "sp_streams",
    followers: "sp_streams",
  },
  twitch: {
    followers: "tw_live_viewers",
    live_viewers: "tw_followers",
  },
  facebook: {
    followers: "fb_likes",
    likes: "fb_followers",
  },
  twitter: {
    likes: "x_followers",
    retweets: "x_followers",
  },
  // linkedin: no obvious complement — leave empty so we fall back to a generic block.
};

export type CrossSellSuggestion = {
  service: string;     // full platform-prefixed service key (e.g., "ig_likes")
  serviceKind: ServiceKind;
  qty: number;
  priceCents: number;
};

/**
 * Looks up the cheapest active pack of the complementary service for
 * `platform` + `boughtService`. Returns null when no mapping exists or the
 * pricing table has no active pack for it.
 */
export async function getComplementarySuggestion(
  platform: string,
  boughtService: string,
): Promise<CrossSellSuggestion | null> {
  if (!platform || !boughtService) return null;
  const kind = getServiceKind(boughtService);
  const complementService = COMPLEMENT[platform.toLowerCase()]?.[kind];
  if (!complementService) return null;

  try {
    const rows = (await sql`
      SELECT service, qty, price
      FROM pricing
      WHERE service = ${complementService} AND active = true AND qty > 0
      ORDER BY qty ASC
      LIMIT 1
    `) as Array<{ service: string; qty: number; price: string | number }>;
    if (rows.length === 0) return null;

    const r = rows[0];
    return {
      service: r.service,
      serviceKind: getServiceKind(r.service),
      qty: Number(r.qty),
      priceCents: Math.round(Number(r.price) * 100),
    };
  } catch (err) {
    console.error("[serviceClassification] suggestion lookup failed:", err);
    return null;
  }
}
