import { PACKS as FACEBOOK_PACKS } from "@/app/facebook/data";
import { PACKS as INSTAGRAM_PACKS } from "@/app/instagram/data";
import { PACKS as LINKEDIN_PACKS } from "@/app/linkedin/data";
import { PACKS as SPOTIFY_PACKS } from "@/app/spotify/data";
import { PACKS as TIKTOK_PACKS } from "@/app/tiktok/data";
import { PACKS as TWITCH_PACKS } from "@/app/twitch/data";
import { PACKS as TWITTER_PACKS } from "@/app/twitter/data";
import { PACKS as YOUTUBE_PACKS } from "@/app/youtube/data";

export type PlatformId =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "spotify"
  | "twitch"
  | "facebook"
  | "linkedin"
  | "twitter";

export type PackLike = {
  qty: number;
  price: number;
  old: number;
  bonus: number;
  popular?: boolean;
  best?: boolean;
};

type ProductConfig = {
  platform: PlatformId;
  service: string;
  productArea: string;
  fallbackPacks: readonly PackLike[];
};

export const PRODUCT_CATALOG: Record<PlatformId, ProductConfig> = {
  instagram: { platform: "instagram", service: "ig_followers", productArea: "instagram", fallbackPacks: INSTAGRAM_PACKS },
  tiktok: { platform: "tiktok", service: "tt_followers", productArea: "tiktok", fallbackPacks: TIKTOK_PACKS },
  youtube: { platform: "youtube", service: "yt_views", productArea: "youtube", fallbackPacks: YOUTUBE_PACKS },
  spotify: { platform: "spotify", service: "sp_streams", productArea: "spotify", fallbackPacks: SPOTIFY_PACKS },
  twitch: { platform: "twitch", service: "tw_followers", productArea: "twitch", fallbackPacks: TWITCH_PACKS },
  facebook: { platform: "facebook", service: "fb_likes", productArea: "facebook", fallbackPacks: FACEBOOK_PACKS },
  linkedin: { platform: "linkedin", service: "li_followers", productArea: "linkedin", fallbackPacks: LINKEDIN_PACKS },
  twitter: { platform: "twitter", service: "x_followers", productArea: "twitter", fallbackPacks: TWITTER_PACKS },
};

export function normalizePlatform(value: unknown): PlatformId | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "x") return "twitter";
  return normalized in PRODUCT_CATALOG ? (normalized as PlatformId) : null;
}

export function getProductConfig(platform: PlatformId) {
  return PRODUCT_CATALOG[platform];
}

export function getProductAreaForService(service: string) {
  return Object.values(PRODUCT_CATALOG).find((config) => config.service === service)?.productArea || service;
}

export function findFallbackPack(platform: PlatformId, qty: number) {
  return PRODUCT_CATALOG[platform].fallbackPacks.find((pack) => pack.qty === qty) || null;
}
