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
