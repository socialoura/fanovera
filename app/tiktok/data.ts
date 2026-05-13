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
  { qty: 100, price: 2.49, old: 8.99, bonus: 25 },
  { qty: 250, price: 4.99, old: 13.99, bonus: 50 },
  { qty: 500, price: 7.99, old: 22.99, bonus: 100 },
  { qty: 1000, price: 13.99, old: 36.99, bonus: 200, popular: true },
  { qty: 2500, price: 29.99, old: 79.99, bonus: 500 },
  { qty: 5000, price: 54.99, old: 139.99, bonus: 1000 },
  { qty: 10000, price: 99.99, old: 249.99, bonus: 2500 },
  { qty: 25000, price: 229.99, old: 549.99, bonus: 6000 },
  { qty: 50000, price: 419.99, old: 999.99, bonus: 12500, best: true },
  { qty: 100000, price: 749.99, old: 1849.99, bonus: 25000 },
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
