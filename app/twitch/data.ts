import { formatMoney, getDisplayLocale } from "../lib/pricingCurrency";

export type Pack = {
  qty: number;
  price: number;
  old: number;
  bonus: number;
  popular?: boolean;
  best?: boolean;
};

export type TwitchProductType = "followers" | "ai_viewers";

// Followers pack: standard SMM follower-style pricing.
export const PACKS: Pack[] = [
  { qty: 100, price: 3.99, old: 12.99, bonus: 15 },
  { qty: 250, price: 6.99, old: 24.99, bonus: 35 },
  { qty: 500, price: 9.99, old: 44.99, bonus: 75 },
  { qty: 1000, price: 14.99, old: 69.99, bonus: 150, popular: true },
  { qty: 2500, price: 29.99, old: 149.99, bonus: 400 },
  { qty: 5000, price: 54.99, old: 269.99, bonus: 800 },
  { qty: 10000, price: 99.99, old: 489.99, bonus: 1800 },
  { qty: 20000, price: 189.99, old: 475.99, bonus: 4000 },
  { qty: 50000, price: 449.99, old: 1899.99, bonus: 10000, best: true },
  { qty: 100000, price: 849.99, old: 3399.99, bonus: 20000 },
];

// AI live viewers pack — quantities aligned with the admin pricing rows for
// service `tw_live_viewers` so DB prices override these fallbacks.
export const AI_VIEWERS_PACKS: Pack[] = [
  { qty: 50, price: 3.99, old: 9.99, bonus: 10 },
  { qty: 100, price: 7.99, old: 19.99, bonus: 20 },
  { qty: 250, price: 14.99, old: 34.99, bonus: 50 },
  { qty: 500, price: 24.99, old: 59.99, bonus: 100 },
  { qty: 1000, price: 49.99, old: 119.99, bonus: 200, popular: true },
  { qty: 2500, price: 109.99, old: 249.99, bonus: 500 },
  { qty: 5000, price: 199.99, old: 449.99, bonus: 1000 },
  { qty: 10000, price: 379.99, old: 849.99, bonus: 2000 },
  { qty: 20000, price: 699.99, old: 1499.99, bonus: 4000, best: true },
  { qty: 50000, price: 1599.99, old: 3299.99, bonus: 10000 },
];

export function getPacksForProduct(productType: TwitchProductType): Pack[] {
  return productType === "ai_viewers" ? AI_VIEWERS_PACKS : PACKS;
}

export function getServiceForProduct(productType: TwitchProductType): string {
  // tw_live_viewers is the canonical service name in the DB (smm_config seed
  // and admin pricing UI). Earlier drafts used "tw_ai_viewers" — that was a
  // mismatch with the data the operator entered.
  return productType === "ai_viewers" ? "tw_live_viewers" : "tw_followers";
}

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
    desc: "Viewers basés en France",
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

// Group digits in the visitor's active region locale (e.g. "10,000" for en-GB,
// "10 000" for fr-FR). Reads the same global locale as formatMoney/fmtEuro.
export const formatQty = (q: number) => q.toLocaleString(getDisplayLocale());
export const fmtEuro = (n: number) => formatMoney(n);
export const formatPrice = (p: Pack, country?: CountryId) => {
  void country;
  return fmtEuro(p.price);
};
export const formatOld = (p: Pack, country?: CountryId) => {
  void country;
  return fmtEuro(p.old);
};
