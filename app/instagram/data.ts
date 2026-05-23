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
  { qty: 100, price: 2.79, old: 9.99, bonus: 25 },
  { qty: 250, price: 5.49, old: 14.99, bonus: 50 },
  { qty: 500, price: 8.99, old: 24.99, bonus: 100 },
  { qty: 1000, price: 14.99, old: 39.99, bonus: 200, popular: true },
  { qty: 2500, price: 32.99, old: 84.99, bonus: 500 },
  { qty: 5000, price: 59.99, old: 149.99, bonus: 1000 },
  { qty: 10000, price: 109.99, old: 269.99, bonus: 2500 },
  { qty: 25000, price: 249.99, old: 599.99, bonus: 6000 },
  { qty: 50000, price: 449.99, old: 1099.99, bonus: 12500, best: true },
  { qty: 100000, price: 799.99, old: 1999.99, bonus: 25000 },
];

export type InstagramProductType = "followers" | "likes" | "views";

export const LIKES_PACKS: Pack[] = [
  { qty: 100, price: 1.49, old: 4.99, bonus: 25 },
  { qty: 250, price: 2.99, old: 8.99, bonus: 50 },
  { qty: 500, price: 4.99, old: 14.99, bonus: 100 },
  { qty: 1000, price: 7.99, old: 22.99, bonus: 200 },
  { qty: 2500, price: 16.99, old: 44.99, bonus: 500, popular: true },
  { qty: 5000, price: 29.99, old: 79.99, bonus: 1000 },
  { qty: 10000, price: 54.99, old: 139.99, bonus: 2500 },
  { qty: 25000, price: 119.99, old: 299.99, bonus: 6000 },
  { qty: 50000, price: 219.99, old: 549.99, bonus: 12500, best: true },
  { qty: 100000, price: 399.99, old: 999.99, bonus: 25000 },
];

export const VIEWS_PACKS: Pack[] = [
  { qty: 1000, price: 1.99, old: 5.99, bonus: 250 },
  { qty: 5000, price: 4.99, old: 14.99, bonus: 1000 },
  { qty: 10000, price: 8.99, old: 24.99, bonus: 2000 },
  { qty: 25000, price: 17.99, old: 49.99, bonus: 5000, popular: true },
  { qty: 50000, price: 29.99, old: 79.99, bonus: 10000 },
  { qty: 100000, price: 49.99, old: 129.99, bonus: 20000 },
  { qty: 250000, price: 109.99, old: 279.99, bonus: 50000 },
  { qty: 500000, price: 199.99, old: 499.99, bonus: 100000 },
  { qty: 1000000, price: 349.99, old: 879.99, bonus: 200000, best: true },
  { qty: 5000000, price: 1499.99, old: 3699.99, bonus: 1000000 },
];

export function getPacksForProduct(product: InstagramProductType): Pack[] {
  if (product === "likes") return LIKES_PACKS;
  if (product === "views") return VIEWS_PACKS;
  return PACKS;
}

export function defaultPackIndex(product: InstagramProductType): number {
  const idx = getPacksForProduct(product).findIndex((p) => p.popular);
  return idx >= 0 ? idx : 3;
}

export function getServiceForProduct(product: InstagramProductType): string {
  if (product === "likes") return "ig_likes";
  if (product === "views") return "ig_views";
  return "ig_followers";
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
    name: "Audience France",
    flag: "🇫🇷",
    desc: "Ciblage prioritaire France",
    mult: 1.6,
    premium: true,
  },
  {
    id: "eu",
    name: "Audience Europe",
    flag: "🇪🇺",
    desc: "Ciblage France, Belgique, Suisse, EU",
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
