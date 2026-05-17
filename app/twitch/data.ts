import { formatMoney } from "../lib/pricingCurrency";

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
  { qty: 100, price: 4.99, old: 12.99, bonus: 15 },
  { qty: 250, price: 9.99, old: 24.99, bonus: 35 },
  { qty: 500, price: 17.99, old: 44.99, bonus: 75 },
  { qty: 1000, price: 29.99, old: 69.99, bonus: 150, popular: true },
  { qty: 2500, price: 64.99, old: 149.99, bonus: 400 },
  { qty: 5000, price: 119.99, old: 269.99, bonus: 800 },
  { qty: 10000, price: 219.99, old: 489.99, bonus: 1800 },
  { qty: 25000, price: 499.99, old: 1099.99, bonus: 5000 },
  { qty: 50000, price: 899.99, old: 1899.99, bonus: 10000, best: true },
  { qty: 100000, price: 1599.99, old: 3399.99, bonus: 20000 },
];

// AI live viewers pack: smaller concurrent-viewer counts at a higher per-unit
// price because each viewer is an active session for the duration of the
// stream, not a one-shot follow.
export const AI_VIEWERS_PACKS: Pack[] = [
  { qty: 10, price: 4.99, old: 9.99, bonus: 2 },
  { qty: 25, price: 9.99, old: 19.99, bonus: 5 },
  { qty: 50, price: 17.99, old: 34.99, bonus: 10 },
  { qty: 100, price: 29.99, old: 59.99, bonus: 20, popular: true },
  { qty: 250, price: 64.99, old: 129.99, bonus: 50 },
  { qty: 500, price: 119.99, old: 239.99, bonus: 100, best: true },
  { qty: 1000, price: 199.99, old: 399.99, bonus: 200 },
];

export function getPacksForProduct(productType: TwitchProductType): Pack[] {
  return productType === "ai_viewers" ? AI_VIEWERS_PACKS : PACKS;
}

export function getServiceForProduct(productType: TwitchProductType): string {
  return productType === "ai_viewers" ? "tw_ai_viewers" : "tw_followers";
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
