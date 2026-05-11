export type Pack = {
  qty: number;
  price: number;
  old: number;
  bonus: number;
  popular?: boolean;
  best?: boolean;
};

export const PACKS: Pack[] = [
  { qty: 1000, price: 2.99, old: 7.99, bonus: 100 },
  { qty: 5000, price: 12.99, old: 29.99, bonus: 500 },
  { qty: 10000, price: 19.99, old: 49.99, bonus: 1500 },
  { qty: 25000, price: 44.99, old: 99.99, bonus: 5000, popular: true },
  { qty: 50000, price: 79.99, old: 179.99, bonus: 10000 },
  { qty: 100000, price: 149.99, old: 329.99, bonus: 20000 },
  { qty: 250000, price: 349.99, old: 749.99, bonus: 50000 },
  { qty: 500000, price: 649.99, old: 1399.99, bonus: 100000 },
  { qty: 1000000, price: 1199.99, old: 2599.99, bonus: 250000, best: true },
  { qty: 5000000, price: 4999.99, old: 10999.99, bonus: 1000000 },
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
export const fmtEuro = (n: number) => n.toFixed(2).replace(".", ",") + " €";
export const formatPrice = (p: Pack, country: CountryId) =>
  fmtEuro(p.price * (country === "fr" ? COUNTRIES[0].mult : 1));
export const formatOld = (p: Pack, country: CountryId) =>
  fmtEuro(p.old * (country === "fr" ? COUNTRIES[0].mult : 1));
