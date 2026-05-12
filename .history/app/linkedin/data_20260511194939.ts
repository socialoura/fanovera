export type Pack = {
  qty: number;
  price: number;
  old: number;
  bonus: number;
  popular?: boolean;
  best?: boolean;
};

export const PACKS: Pack[] = [
  { qty: 100, price: 9.99, old: 24.99, bonus: 10 },
  { qty: 250, price: 19.99, old: 49.99, bonus: 25 },
  { qty: 500, price: 34.99, old: 89.99, bonus: 60 },
  { qty: 1000, price: 59.99, old: 139.99, bonus: 150, popular: true },
  { qty: 2500, price: 129.99, old: 299.99, bonus: 400 },
  { qty: 5000, price: 239.99, old: 549.99, bonus: 800 },
  { qty: 10000, price: 449.99, old: 999.99, bonus: 1800 },
  { qty: 25000, price: 999.99, old: 2299.99, bonus: 5000 },
  { qty: 50000, price: 1799.99, old: 3999.99, bonus: 10000, best: true },
  { qty: 100000, price: 3299.99, old: 7499.99, bonus: 20000 },
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

export const formatQty = (q: number) => q.toLocaleString("fr-FR");
export const fmtEuro = (n: number) => n.toFixed(2).replace(".", ",") + " €";
export const formatPrice = (p: Pack, country: CountryId) =>
  fmtEuro(p.price * (country === "fr" ? COUNTRIES[0].mult : 1));
export const formatOld = (p: Pack, country: CountryId) =>
  fmtEuro(p.old * (country === "fr" ? COUNTRIES[0].mult : 1));
