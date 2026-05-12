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
    name: "Likes Français",
    flag: "🇫🇷",
    desc: "Comptes basés en France",
    mult: 1.6,
    premium: true,
  },
  {
    id: "eu",
    name: "Likes Européens",
    flag: "🇪🇺",
    desc: "Mix France, Belgique, Suisse, EU",
    mult: 1,
    premium: false,
  },
];

export const formatQty = (q: number) => q.toLocaleString("fr-FR");
export const fmtEuro = (n: number) => formatMoney(n);
export const formatPrice = (p: Pack, _country?: CountryId) =>
  fmtEuro(p.price);
export const formatOld = (p: Pack, _country?: CountryId) =>
  fmtEuro(p.old);
