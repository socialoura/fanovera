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
  { qty: 1000, price: 4.99, old: 149.99, bonus: 75 },
  { qty: 2500, price: 11.99, old: 299.99, bonus: 150 },
  { qty: 5000, price: 18.99, old: 499.99, bonus: 300, popular: true },
  { qty: 10000, price: 34.99, old: 899.99, bonus: 750 },
  { qty: 20000, price: 64.99, old: 162.99, bonus: 1600 },
  { qty: 50000, price: 139.99, old: 3299.99, bonus: 4000, best: true },
  { qty: 100000, price: 239.99, old: 5999.99, bonus: 8000 },
  { qty: 200000, price: 399.99, old: 1000.99, bonus: 16000 },
  { qty: 500000, price: 999.99, old: 2500.99, bonus: 40000 },
  { qty: 1000000, price: 1899, old: 4747.99, bonus: 80000 },
];

export type YouTubeProductType = "views" | "subscribers";

export const SUBSCRIBERS_PACKS: Pack[] = [
  { qty: 100, price: 4.99, old: 14.99, bonus: 20 },
  { qty: 250, price: 9.99, old: 27.99, bonus: 50 },
  { qty: 500, price: 17.99, old: 49.99, bonus: 100 },
  { qty: 1000, price: 29.99, old: 79.99, bonus: 200, popular: true },
  { qty: 2500, price: 64.99, old: 169.99, bonus: 500 },
  { qty: 5000, price: 119.99, old: 299.99, bonus: 1000 },
  { qty: 10000, price: 219.99, old: 549.99, bonus: 2500 },
  { qty: 25000, price: 499.99, old: 1249.99, bonus: 6000 },
  { qty: 50000, price: 899.99, old: 2249.99, bonus: 12500, best: true },
  { qty: 100000, price: 1599.99, old: 3999.99, bonus: 25000 },
];

export function getPacksForProduct(product: YouTubeProductType): Pack[] {
  if (product === "subscribers") return SUBSCRIBERS_PACKS;
  return PACKS;
}

export function getServiceForProduct(product: YouTubeProductType): string {
  if (product === "subscribers") return "yt_subscribers";
  return "yt_views";
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
    name: "Abonnés Français",
    flag: "🇫🇷",
    desc: "Comptes basés en France",
    mult: 1.6,
    premium: true,
  },
  {
    id: "eu",
    name: "Vues Européennes",
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
