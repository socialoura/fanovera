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
  instagram: { stat: "Audit & contenu", badge: "POPULAIRE", brand: "#e1407e", brand2: "#fa7e1e" },
  tiktok: { stat: "Calendrier video", badge: null, brand: "#1d1d2c", brand2: "#3d3d52" },
  youtube: { stat: "SEO video", badge: null, brand: "#ff3a3a", brand2: "#ff7a5a" },
  spotify: { stat: "Lancement artiste", badge: null, brand: "#1ed760", brand2: "#16a34a" },
  twitter: { stat: "Ligne editoriale", badge: null, brand: "#1d1d2c", brand2: "#3d3d52" },
  facebook: { stat: "Page & contenus", badge: null, brand: "#3a6ad4", brand2: "#5a8af0" },
  linkedin: { stat: "Presence B2B", badge: null, brand: "#1d6dc1", brand2: "#3a8de0" },
  twitch: { stat: "Planning stream", badge: "NOUVEAU", brand: "#9146ff", brand2: "#b56cff" },
};
