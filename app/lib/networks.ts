export type NetworkId =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "spotify"
  | "twitter"
  | "facebook"
  | "linkedin"
  | "twitch";

export type Network = {
  id: NetworkId;
  name: string;
  color: string;
  icon: NetworkId;
};

export const NETWORKS: Network[] = [
  { id: "instagram", name: "Instagram", color: "#e1407e", icon: "instagram" },
  { id: "tiktok", name: "TikTok", color: "#1d1d2c", icon: "tiktok" },
  { id: "youtube", name: "YouTube", color: "#ff3a3a", icon: "youtube" },
  { id: "spotify", name: "Spotify", color: "#1ed760", icon: "spotify" },
  { id: "twitter", name: "Twitter", color: "#1d1d2c", icon: "twitter" },
  { id: "facebook", name: "Facebook", color: "#3a6ad4", icon: "facebook" },
  { id: "linkedin", name: "LinkedIn", color: "#1d6dc1", icon: "linkedin" },
  { id: "twitch", name: "Twitch", color: "#9146ff", icon: "twitch" },
];

export type NetMeta = {
  stat: string;
  badge: string | null;
  brand: string;
  brand2: string;
  /** Lowest pack price (EUR) across all product types of this network.
   * Surfaced on /promo cards as the "À partir de X €" anchor. Update when
   * the cheapest pack in app/<network>/data.ts changes. */
  minPriceEur: number;
};

export const NET_META: Record<NetworkId, NetMeta> = {
  instagram: { stat: "Audit & contenu", badge: "POPULAIRE", brand: "#e1407e", brand2: "#fa7e1e", minPriceEur: 1.49 },
  tiktok: { stat: "Calendrier video", badge: null, brand: "#1d1d2c", brand2: "#3d3d52", minPriceEur: 1.29 },
  youtube: { stat: "SEO video", badge: null, brand: "#ff3a3a", brand2: "#ff7a5a", minPriceEur: 4.99 },
  spotify: { stat: "Lancement artiste", badge: null, brand: "#1ed760", brand2: "#16a34a", minPriceEur: 1.99 },
  twitter: { stat: "Ligne editoriale", badge: null, brand: "#1d1d2c", brand2: "#3d3d52", minPriceEur: 5.99 },
  facebook: { stat: "Page & contenus", badge: null, brand: "#3a6ad4", brand2: "#5a8af0", minPriceEur: 4.99 },
  linkedin: { stat: "Presence B2B", badge: null, brand: "#1d6dc1", brand2: "#3a8de0", minPriceEur: 9.99 },
  twitch: { stat: "Planning stream", badge: "NOUVEAU", brand: "#9146ff", brand2: "#b56cff", minPriceEur: 4.99 },
};

// Services whose cheapest pack feeds each network's "from £X" promo anchor.
// Shared by the client Hero (cached-pricing min) and the server promo page
// (SSR min price), so both compute the same anchor and the price never flickers.
export const PROMO_NETWORK_SERVICES: Record<NetworkId, string[]> = {
  instagram: ["ig_followers", "ig_likes", "ig_views"],
  tiktok: ["tt_followers", "tt_likes", "tt_views"],
  youtube: ["yt_views", "yt_subscribers"],
  spotify: ["sp_streams", "sp_followers"],
  twitter: ["x_followers"],
  facebook: ["fb_likes"],
  linkedin: ["li_followers"],
  twitch: ["tw_followers", "tw_live_viewers"],
};
