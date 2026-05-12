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
    name: "Abonnés Européens",
    flag: "🇪🇺",
    desc: "Mix France, Belgique, Suisse, EU",
    mult: 1,
    premium: false,
  },
];

export const formatQty = (q: number) => q.toLocaleString("fr-FR");
export const fmtEuro = (n: number) =>
  n.toFixed(2).replace(".", ",") + " €";
export const formatPrice = (p: Pack, country: CountryId) =>
  fmtEuro(p.price * (country === "fr" ? COUNTRIES[0].mult : 1));
export const formatOld = (p: Pack, country: CountryId) =>
  fmtEuro(p.old * (country === "fr" ? COUNTRIES[0].mult : 1));
