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
  { qty: 1000, price: 1.99, old: 4.99, bonus: 150 },
  { qty: 5000, price: 7.99, old: 19.99, bonus: 750 },
  { qty: 10000, price: 12.99, old: 29.99, bonus: 1500 },
  { qty: 25000, price: 27.99, old: 59.99, bonus: 4000, popular: true },
  { qty: 50000, price: 49.99, old: 109.99, bonus: 8000 },
  { qty: 100000, price: 89.99, old: 199.99, bonus: 16000 },
  { qty: 250000, price: 199.99, old: 449.99, bonus: 40000 },
  { qty: 500000, price: 379.99, old: 799.99, bonus: 80000 },
  { qty: 1000000, price: 699.99, old: 1499.99, bonus: 200000, best: true },
  { qty: 5000000, price: 2999.99, old: 6499.99, bonus: 1000000 },
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
    name: "Écoutes Françaises",
    flag: "🇫🇷",
    desc: "Auditeurs basés en France",
    mult: 1.6,
    premium: true,
  },
  {
    id: "eu",
    name: "Écoutes Européennes",
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
