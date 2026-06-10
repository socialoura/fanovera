import { PACKS, LIKES_PACKS, VIEWS_PACKS, getServiceForProduct, type Pack, type TikTokProductType } from "../tiktok/data";

export type ProductKey = TikTokProductType; // "followers" | "likes" | "views"

export type ProductMeta = {
  key: ProductKey;
  service: string;
  icon: "user" | "heart" | "play";
  accent: "red" | "cyan";
  needsPosts: boolean;
  packs: Pack[];
};

// Non-localized product metadata. Labels come from the i18n copy (step1.product*).
// `packs` references the same arrays mutated in place by useApplyCurrencyPricing,
// so they always carry the live DB pricing.
export const PRODUCT_META: Record<ProductKey, ProductMeta> = {
  followers: { key: "followers", service: getServiceForProduct("followers"), icon: "user", accent: "red", needsPosts: false, packs: PACKS },
  likes: { key: "likes", service: getServiceForProduct("likes"), icon: "heart", accent: "red", needsPosts: true, packs: LIKES_PACKS },
  views: { key: "views", service: getServiceForProduct("views"), icon: "play", accent: "cyan", needsPosts: true, packs: VIEWS_PACKS },
};

export const PRODUCT_ORDER: ProductKey[] = ["followers", "likes", "views"];

// User's per-product pack selection (index into that product's packs, or null).
export type Selection = Record<ProductKey, number | null>;
