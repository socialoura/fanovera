import { formatMoney, getDisplayLocale } from "../lib/pricingCurrency";

export type Pack = {
  qty: number;
  price: number;
  old: number;
  bonus: number;
  popular?: boolean;
  best?: boolean;
};

export const PACKS: Pack[] = [
  { qty: 50, price: 3.99, old: 9.98, bonus: 5 },
  { qty: 100, price: 7.99, old: 24.99, bonus: 10 },
  { qty: 250, price: 14.99, old: 49.99, bonus: 25 },
  { qty: 500, price: 24.99, old: 89.99, bonus: 60, popular: true },
  { qty: 1000, price: 49.99, old: 139.99, bonus: 150 },
  { qty: 2500, price: 119.99, old: 299.99, bonus: 400 },
  { qty: 5000, price: 229.99, old: 549.99, bonus: 800 },
  { qty: 10000, price: 449.99, old: 999.99, bonus: 1800 },
  { qty: 20000, price: 799.99, old: 2000.99, bonus: 4000 },
  { qty: 50000, price: 1599.99, old: 3999.99, bonus: 10000, best: true },
];

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
    desc: "Profils basés en France",
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
