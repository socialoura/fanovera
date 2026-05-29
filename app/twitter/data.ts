import { formatMoney } from "../lib/pricingCurrency";

export type Pack = {
  qty: number;
  price: number;
  old: number;
  bonus: number;
  popular?: boolean;
  best?: boolean;
};

export const PACKS: Pack[] = [
  { qty: 100, price: 3.5, old: 14.99, bonus: 10 },
  { qty: 250, price: 8.99, old: 29.99, bonus: 25 },
  { qty: 500, price: 17.99, old: 49.99, bonus: 50 },
  { qty: 1000, price: 34.99, old: 79.99, bonus: 150, popular: true },
  { qty: 2000, price: 59.99, old: 150.99, bonus: 320 },
  { qty: 5000, price: 139.99, old: 299.99, bonus: 800 },
  { qty: 10000, price: 269.99, old: 549.99, bonus: 1800 },
  { qty: 20000, price: 499.99, old: 1250.99, bonus: 4000 },
  { qty: 50000, price: 1199.99, old: 2099.99, bonus: 10000, best: true },
  { qty: 100000, price: 1999.99, old: 3799.99, bonus: 20000 },
];

export type XProductType = "followers" | "likes" | "retweets";

// Likes target a single tweet (post), unlike followers (profile). Prices are
// fallbacks only — the Neon `pricing` table (service "x_likes") is the source
// of truth and overrides these at runtime.
export const LIKES_PACKS: Pack[] = [
  { qty: 100, price: 2.99, old: 9.99, bonus: 20 },
  { qty: 250, price: 5.99, old: 17.99, bonus: 50 },
  { qty: 500, price: 9.99, old: 29.99, bonus: 100 },
  { qty: 1000, price: 16.99, old: 49.99, bonus: 200, popular: true },
  { qty: 2500, price: 34.99, old: 99.99, bonus: 500 },
  { qty: 5000, price: 59.99, old: 169.99, bonus: 1000 },
  { qty: 10000, price: 99.99, old: 279.99, bonus: 2500 },
  { qty: 25000, price: 199.99, old: 549.99, bonus: 6000 },
  { qty: 50000, price: 349.99, old: 899.99, bonus: 12500, best: true },
  { qty: 100000, price: 599.99, old: 1499.99, bonus: 25000 },
];

// Retweets target a single tweet (post), like likes. Higher-value engagement,
// so priced above likes. Prices are fallbacks only — the Neon `pricing` table
// (service "x_retweets") is the source of truth and overrides these at runtime.
export const RETWEET_PACKS: Pack[] = [
  { qty: 100, price: 4.99, old: 14.99, bonus: 20 },
  { qty: 250, price: 9.99, old: 29.99, bonus: 50 },
  { qty: 500, price: 17.99, old: 49.99, bonus: 100 },
  { qty: 1000, price: 29.99, old: 79.99, bonus: 200, popular: true },
  { qty: 2500, price: 64.99, old: 169.99, bonus: 500 },
  { qty: 5000, price: 119.99, old: 299.99, bonus: 1000 },
  { qty: 10000, price: 199.99, old: 499.99, bonus: 2500 },
  { qty: 25000, price: 449.99, old: 1099.99, bonus: 6000 },
  { qty: 50000, price: 799.99, old: 1999.99, bonus: 12500, best: true },
  { qty: 100000, price: 1399.99, old: 3299.99, bonus: 25000 },
];

export function getPacksForProduct(product: XProductType): Pack[] {
  if (product === "likes") return LIKES_PACKS;
  if (product === "retweets") return RETWEET_PACKS;
  return PACKS;
}

export function defaultPackIndex(product: XProductType): number {
  const idx = getPacksForProduct(product).findIndex((p) => p.popular);
  return idx >= 0 ? idx : 3;
}

export function getServiceForProduct(product: XProductType): string {
  if (product === "likes") return "x_likes";
  if (product === "retweets") return "x_retweets";
  return "x_followers";
}

// Tweet/status URL matcher for the likes target (x.com or twitter.com).
export const TWEET_URL_RE = /(?:twitter|x)\.com\/[^/?#]+\/status\/\d+/i;

export type CountryId = "fr" | "eu";

export type Country = {
  id: CountryId;
  name: string;
  flag: string;
  desc: string;
  mult: number;
  premium: boolean;
};

export const COUNTRIES: Country[] = [
  {
    id: "fr",
    name: "Followers Français",
    flag: "🇫🇷",
    desc: "Comptes basés en France",
    mult: 1.6,
    premium: true,
  },
  {
    id: "eu",
    name: "Followers Européens",
    flag: "🇪🇺",
    desc: "Mix France, Belgique, Suisse, EU",
    mult: 1,
    premium: false,
  },
];

export const formatQty = (q: number) => q.toLocaleString("fr-FR");
export const fmtEuro = (n: number) => formatMoney(n);
export const formatPrice = (p: Pack, country?: CountryId) => {
  void country;
  return fmtEuro(p.price);
};
export const formatOld = (p: Pack, country?: CountryId) => {
  void country;
  return fmtEuro(p.old);
};
