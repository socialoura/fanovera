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
};

export const NET_META: Record<NetworkId, NetMeta> = {
  instagram: { stat: "+412% portée", badge: "POPULAIRE", brand: "#e1407e", brand2: "#fa7e1e" },
  tiktok: { stat: "+847% vues", badge: null, brand: "#1d1d2c", brand2: "#3d3d52" },
  youtube: { stat: "+186% abonnés", badge: null, brand: "#ff3a3a", brand2: "#ff7a5a" },
  spotify: { stat: "+312% écoutes", badge: null, brand: "#1ed760", brand2: "#16a34a" },
  twitter: { stat: "+254% impressions", badge: null, brand: "#1d1d2c", brand2: "#3d3d52" },
  facebook: { stat: "+198% portée", badge: null, brand: "#3a6ad4", brand2: "#5a8af0" },
  linkedin: { stat: "+147% leads", badge: null, brand: "#1d6dc1", brand2: "#3a8de0" },
  twitch: { stat: "+221% viewers", badge: "NOUVEAU", brand: "#9146ff", brand2: "#b56cff" },
};
