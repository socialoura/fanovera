export type Platform = {
  id: string;
  name: string;
  icon: string;
  color: string;
  revenue: number;
  orders: number;
  share: number;
};

export type Order = {
  id: string;
  email: string;
  plat: string;
  qty: number;
  amount: number;
  cost: number;
  status: "delivered" | "processing" | "paid" | "pending" | "failed";
  smmCount: number;
  smmOk: number;
  date: string;
  country: string;
  emailNum: number;
};

export type Pack = {
  qty: number;
  popular: boolean;
  active: boolean;
  prices: Record<string, number>;
};

// Deterministic seeded PRNG so server-render and client-hydration produce identical values
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const series = (() => {
  const pts: { d: number; rev: number; smm: number; ads: number }[] = [];
  let rev = 4500, smm = 2100, ads = 800;
  const rnd = mulberry32(42);
  for (let i = 0; i < 30; i++) {
    rev = Math.max(2200, rev + (rnd() - 0.42) * 1200);
    smm = Math.max(900, smm + (rnd() - 0.46) * 500);
    ads = Math.max(300, ads + (rnd() - 0.5) * 220);
    pts.push({ d: i, rev: Math.round(rev), smm: Math.round(smm), ads: Math.round(ads) });
  }
  return pts;
})();

export const ADMIN_DATA = {
  kpis: {
    revenue: { value: 184320, delta: 23.4, currency: "€" },
    profit: { value: 68940, delta: 18.1, currency: "€" },
    margin: { value: 37.4, delta: 2.8, suffix: "%" },
    orders: { value: 4218, delta: 12.6 },
    smmCost: { value: 82110, delta: 9.2, currency: "€" },
    adsCost: { value: 33270, delta: 14.0, currency: "€" },
  },
  today: { orders: 73, revenue: 3284 },
  customers: {
    unique: 3127,
    avgBasket: 43.71,
    avgPerCustomer: 58.95,
    avgOrders: 1.35,
    recurrenceRate: 26.1,
  },

  series,

  statusRepart: [
    { key: "delivered", label: "Livrées", value: 3041, color: "#2EA86F" },
    { key: "processing", label: "En cours", value: 642, color: "#3B5BDB" },
    { key: "paid", label: "Payées", value: 398, color: "#7C3AED" },
    { key: "pending", label: "En attente", value: 95, color: "#C68A19" },
    { key: "failed", label: "Échouées", value: 42, color: "#E14444" },
  ],

  platforms: [
    { id: "instagram", name: "Instagram", icon: "IG", color: "#E04A8C", revenue: 67400, orders: 1840, share: 36.6 },
    { id: "tiktok", name: "TikTok", icon: "TT", color: "#000000", revenue: 51220, orders: 1240, share: 27.8 },
    { id: "youtube", name: "YouTube", icon: "YT", color: "#FF0000", revenue: 28400, orders: 490, share: 15.4 },
    { id: "spotify", name: "Spotify", icon: "SP", color: "#1DB954", revenue: 14380, orders: 280, share: 7.8 },
    { id: "twitter", name: "X / Twitter", icon: "X", color: "#0F1419", revenue: 9920, orders: 175, share: 5.4 },
    { id: "facebook", name: "Facebook", icon: "FB", color: "#1877F2", revenue: 6480, orders: 95, share: 3.5 },
    { id: "twitch", name: "Twitch", icon: "TV", color: "#9146FF", revenue: 4220, orders: 65, share: 2.3 },
    { id: "snapchat", name: "Snapchat", icon: "SC", color: "#FFFC00", revenue: 2300, orders: 33, share: 1.2 },
  ] as Platform[],

  currencies: [
    { code: "EUR", flag: "🇪🇺", amount: 92140, orders: 2410 },
    { code: "USD", flag: "🇺🇸", amount: 51800, orders: 1180 },
    { code: "GBP", flag: "🇬🇧", amount: 21400, orders: 365 },
    { code: "CAD", flag: "🇨🇦", amount: 10200, orders: 142 },
    { code: "AUD", flag: "🇦🇺", amount: 6420, orders: 78 },
    { code: "CHF", flag: "🇨🇭", amount: 1820, orders: 28 },
    { code: "NZD", flag: "🇳🇿", amount: 540, orders: 15 },
  ],

  countries: [
    { flag: "🇫🇷", name: "France", revenue: 48200, visits: 142000, orders: 1410, conv: 0.99 },
    { flag: "🇺🇸", name: "États-Unis", revenue: 32100, visits: 98400, orders: 720, conv: 0.73 },
    { flag: "🇬🇧", name: "Royaume-Uni", revenue: 18400, visits: 41200, orders: 330, conv: 0.80 },
    { flag: "🇩🇪", name: "Allemagne", revenue: 12200, visits: 28100, orders: 210, conv: 0.74 },
    { flag: "🇨🇦", name: "Canada", revenue: 9100, visits: 19800, orders: 142, conv: 0.71 },
    { flag: "🇧🇪", name: "Belgique", revenue: 7400, visits: 16200, orders: 118, conv: 0.72 },
    { flag: "🇨🇭", name: "Suisse", revenue: 5800, visits: 9400, orders: 72, conv: 0.76 },
    { flag: "🇪🇸", name: "Espagne", revenue: 4900, visits: 14100, orders: 88, conv: 0.62 },
  ],

  peakHours: [8, 6, 5, 4, 3, 3, 4, 8, 14, 22, 31, 38, 42, 45, 51, 58, 64, 71, 78, 84, 76, 58, 38, 22],

  services: [
    { name: "Instagram Followers", rev: 28400, perCust: 38.40, freq: 1.42 },
    { name: "TikTok Views", rev: 21200, perCust: 24.10, freq: 1.81 },
    { name: "Instagram Likes", rev: 14820, perCust: 19.50, freq: 2.03 },
    { name: "YouTube Subscribers", rev: 18600, perCust: 62.80, freq: 1.18 },
    { name: "TikTok Followers", rev: 17400, perCust: 34.20, freq: 1.33 },
    { name: "Spotify Plays", rev: 9200, perCust: 28.40, freq: 1.55 },
  ],

  topClients: [
    { email: "l***@studio-mona.fr", orders: 14, total: 2840, lastPlat: "instagram", country: "🇫🇷" },
    { email: "b***@thefade.co", orders: 11, total: 2310, lastPlat: "tiktok", country: "🇺🇸" },
    { email: "a***@nicolas.label", orders: 9, total: 1980, lastPlat: "spotify", country: "🇫🇷" },
    { email: "r***@brandwave.io", orders: 8, total: 1820, lastPlat: "youtube", country: "🇬🇧" },
    { email: "m***@gmail.com", orders: 7, total: 1460, lastPlat: "instagram", country: "🇨🇦" },
    { email: "s***@sundaylabel.com", orders: 6, total: 1340, lastPlat: "tiktok", country: "🇫🇷" },
    { email: "k***@hotmail.com", orders: 6, total: 1190, lastPlat: "instagram", country: "🇩🇪" },
    { email: "p***@pierre.media", orders: 5, total: 990, lastPlat: "youtube", country: "🇫🇷" },
    { email: "j***@gmail.com", orders: 5, total: 920, lastPlat: "instagram", country: "🇧🇪" },
    { email: "c***@studio-c.com", orders: 5, total: 890, lastPlat: "tiktok", country: "🇫🇷" },
  ],

  orders: [
    { id: "#FN-9824", email: "lea@studio-mona.fr", plat: "instagram", qty: 5000, amount: 79.90, cost: 31.40, status: "delivered", smmCount: 1, smmOk: 1, date: "il y a 2 min", country: "🇫🇷", emailNum: 14 },
    { id: "#FN-9823", email: "mike@thefade.co", plat: "tiktok", qty: 50000, amount: 124.00, cost: 52.20, status: "processing", smmCount: 2, smmOk: 1, date: "il y a 8 min", country: "🇺🇸", emailNum: 11 },
    { id: "#FN-9822", email: "aurelia.k@gmail.com", plat: "youtube", qty: 1000, amount: 219.00, cost: 92.00, status: "paid", smmCount: 1, smmOk: 0, date: "il y a 12 min", country: "🇫🇷", emailNum: 3 },
    { id: "#FN-9821", email: "rajiv@brandwave.io", plat: "spotify", qty: 25000, amount: 68.00, cost: 23.20, status: "delivered", smmCount: 1, smmOk: 1, date: "il y a 18 min", country: "🇬🇧", emailNum: 8 },
    { id: "#FN-9820", email: "morgan.r@hotmail.com", plat: "instagram", qty: 1000, amount: 19.90, cost: 6.40, status: "delivered", smmCount: 1, smmOk: 1, date: "il y a 24 min", country: "🇨🇦", emailNum: 1 },
    { id: "#FN-9819", email: "silvia@sundaylabel.com", plat: "tiktok", qty: 100000, amount: 198.00, cost: 81.10, status: "pending", smmCount: 0, smmOk: 0, date: "il y a 31 min", country: "🇫🇷", emailNum: 6 },
    { id: "#FN-9818", email: "klara.s@hotmail.com", plat: "instagram", qty: 2000, amount: 29.90, cost: 11.20, status: "failed", smmCount: 1, smmOk: 0, date: "il y a 40 min", country: "🇩🇪", emailNum: 6 },
    { id: "#FN-9817", email: "pierre@pierre.media", plat: "youtube", qty: 500, amount: 89.00, cost: 38.40, status: "delivered", smmCount: 1, smmOk: 1, date: "il y a 47 min", country: "🇫🇷", emailNum: 5 },
    { id: "#FN-9816", email: "james.h@gmail.com", plat: "instagram", qty: 10000, amount: 149.00, cost: 58.20, status: "processing", smmCount: 2, smmOk: 2, date: "il y a 58 min", country: "🇧🇪", emailNum: 5 },
    { id: "#FN-9815", email: "cyril@studio-c.com", plat: "tiktok", qty: 25000, amount: 84.00, cost: 32.10, status: "delivered", smmCount: 1, smmOk: 1, date: "il y a 1 h", country: "🇫🇷", emailNum: 5 },
    { id: "#FN-9814", email: "naomi@nomi-art.fr", plat: "spotify", qty: 10000, amount: 39.00, cost: 14.40, status: "delivered", smmCount: 1, smmOk: 1, date: "il y a 1 h", country: "🇫🇷", emailNum: 2 },
    { id: "#FN-9813", email: "tom@gmail.com", plat: "twitter", qty: 500, amount: 24.00, cost: 9.20, status: "paid", smmCount: 1, smmOk: 0, date: "il y a 1 h", country: "🇺🇸", emailNum: 1 },
  ] as Order[],

  pricing: {
    services: [
      { id: "ig-followers", plat: "Instagram", name: "Followers", packs: 10 },
      { id: "ig-likes", plat: "Instagram", name: "Likes", packs: 8 },
      { id: "ig-views", plat: "Instagram", name: "Vues Reels", packs: 6 },
      { id: "tt-followers", plat: "TikTok", name: "Followers", packs: 10 },
      { id: "tt-views", plat: "TikTok", name: "Vues", packs: 10 },
      { id: "yt-subs", plat: "YouTube", name: "Abonnés", packs: 8 },
      { id: "yt-views", plat: "YouTube", name: "Vues", packs: 6 },
      { id: "sp-plays", plat: "Spotify", name: "Plays", packs: 8 },
    ],
    packs: [
      { qty: 100, popular: false, active: true, prices: { EUR: 2.99, USD: 3.20, GBP: 2.60, CAD: 4.30, AUD: 4.80, CHF: 3.10, NZD: 5.10 } },
      { qty: 250, popular: false, active: true, prices: { EUR: 6.99, USD: 7.50, GBP: 5.90, CAD: 10.30, AUD: 11.20, CHF: 7.20, NZD: 12.10 } },
      { qty: 500, popular: false, active: true, prices: { EUR: 11.99, USD: 12.80, GBP: 10.10, CAD: 17.40, AUD: 19.20, CHF: 12.40, NZD: 20.40 } },
      { qty: 1000, popular: true, active: true, prices: { EUR: 19.90, USD: 21.40, GBP: 16.80, CAD: 28.90, AUD: 32.10, CHF: 20.60, NZD: 33.80 } },
      { qty: 2500, popular: false, active: true, prices: { EUR: 39.90, USD: 42.80, GBP: 33.70, CAD: 58.00, AUD: 64.30, CHF: 41.40, NZD: 67.80 } },
      { qty: 5000, popular: false, active: true, prices: { EUR: 69.90, USD: 75.10, GBP: 59.10, CAD: 101.5, AUD: 112.7, CHF: 72.50, NZD: 118.7 } },
      { qty: 10000, popular: false, active: true, prices: { EUR: 119.0, USD: 127.8, GBP: 100.5, CAD: 172.7, AUD: 191.7, CHF: 123.5, NZD: 202.0 } },
      { qty: 25000, popular: false, active: true, prices: { EUR: 249.0, USD: 267.4, GBP: 210.4, CAD: 361.4, AUD: 401.2, CHF: 258.4, NZD: 422.7 } },
      { qty: 50000, popular: false, active: true, prices: { EUR: 449.0, USD: 482.2, GBP: 379.5, CAD: 651.6, AUD: 723.4, CHF: 466.0, NZD: 762.2 } },
      { qty: 100000, popular: false, active: false, prices: { EUR: 799.0, USD: 858.1, GBP: 675.4, CAD: 1159, AUD: 1287, CHF: 829.4, NZD: 1356 } },
    ] as Pack[],
  },

  combos: [
    { id: 1, name: "Pack Lancement Insta", name_en: "Instagram Launch Pack", plat: "Instagram", items: ["1000 Followers", "500 Likes", "2000 Vues Reels"], discount: 20, active: true },
    { id: 2, name: "Boost Viral TikTok", name_en: "TikTok Viral Boost", plat: "TikTok", items: ["5000 Followers", "50k Vues", "2500 Likes"], discount: 25, active: true },
    { id: 3, name: "Démarrage YouTube", name_en: "YouTube Starter", plat: "YouTube", items: ["500 Abonnés", "2000 Vues", "200 Likes"], discount: 18, active: true },
    { id: 4, name: "Pack Spotify Découverte", name_en: "Spotify Discovery", plat: "Spotify", items: ["10k Plays", "500 Followers"], discount: 15, active: true },
    { id: 5, name: "Triple Combo Cross-Platform", name_en: "Triple Cross-Platform", plat: "Multi", items: ["1k IG Follow", "5k TT Vues", "500 YT Subs"], discount: 30, active: false },
  ],

  upsells: [
    { id: 1, label: "Livraison express (24h)", label_en: "Express delivery (24h)", service: "all", qty: 0, active: true, sort: 1, takeRate: 38 },
    { id: 2, label: "+ 10% en plus offerts", label_en: "+ 10% bonus", service: "all", qty: 0, active: true, sort: 2, takeRate: 24 },
    { id: 3, label: "500 likes en bonus", label_en: "500 free likes", service: "ig-followers", qty: 500, active: true, sort: 3, takeRate: 19 },
    { id: 4, label: "Garantie à vie premium", label_en: "Lifetime guarantee premium", service: "all", qty: 0, active: true, sort: 4, takeRate: 14 },
    { id: 5, label: "Boost vues Reels (2000)", label_en: "Reels views boost (2000)", service: "ig-followers", qty: 2000, active: true, sort: 5, takeRate: 11 },
    { id: 6, label: "Followers FR uniquement", label_en: "FR followers only", service: "ig-followers", qty: 0, active: false, sort: 6, takeRate: 6 },
  ],

  smm: {
    balance: 4218.42,
    autoOrder: true,
    spent7d: 1240,
    pendingCount: 6,
    settings: {
      retryAttempts: 3,
      retryDelayMin: 15,
      lowBalanceAlert: 200,
      maxOrderValue: 500,
    },
    mappings: [
      { internal: "Instagram Followers", bfId: "6249", bfName: "IG Followers Real", active: true, rate: 1.20, success: 99.4 },
      { internal: "Instagram Likes", bfId: "6312", bfName: "IG Likes HQ", active: true, rate: 0.80, success: 99.8 },
      { internal: "Instagram Reels Views", bfId: "6488", bfName: "IG Reels Views", active: true, rate: 0.40, success: 98.7 },
      { internal: "TikTok Followers", bfId: "7124", bfName: "TT Followers Real", active: true, rate: 0.95, success: 99.1 },
      { internal: "TikTok Views", bfId: "7220", bfName: "TT Views Fast", active: true, rate: 0.20, success: 99.9 },
      { internal: "YouTube Subscribers", bfId: "8401", bfName: "YT Subs Lifetime", active: true, rate: 4.10, success: 96.8 },
      { internal: "YouTube Views", bfId: "8512", bfName: "YT Views High Retention", active: true, rate: 1.80, success: 98.2 },
      { internal: "Spotify Plays", bfId: "9101", bfName: "Spotify Plays Quality", active: true, rate: 0.30, success: 99.6 },
      { internal: "Twitter Followers", bfId: "9622", bfName: "X Followers Real", active: false, rate: 1.40, success: 94.2 },
      { internal: "Facebook Likes", bfId: "9810", bfName: "FB Page Likes", active: true, rate: 1.10, success: 97.4 },
    ],
  },

  adsCosts: [
    { date: "10 mai", google: 240, meta: 180, tiktok: 96 },
    { date: "09 mai", google: 280, meta: 220, tiktok: 110 },
    { date: "08 mai", google: 195, meta: 165, tiktok: 80 },
    { date: "07 mai", google: 240, meta: 188, tiktok: 92 },
    { date: "06 mai", google: 310, meta: 240, tiktok: 124 },
    { date: "05 mai", google: 265, meta: 210, tiktok: 102 },
    { date: "04 mai", google: 220, meta: 175, tiktok: 88 },
  ],
};
