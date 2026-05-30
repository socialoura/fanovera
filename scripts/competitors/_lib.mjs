// Shared helpers for competitor price scraping.
//
// Each competitor scraper lives in its own file in this folder and exports:
//   export const meta = { name: "domain.tld", method: "woocommerce|html|nextjs" };
//   export async function scrape(): Promise<RawRecord[]>
//
// RawRecord = {
//   platform?: string,   // raw hint (we re-classify centrally anyway)
//   service?: string,     // raw hint
//   name: string,         // product/package label as shown on the site
//   qty?: number|null,    // package size (followers/likes/views...), null if unknown
//   price: number,        // numeric price in `currency`
//   currency: string,     // ISO 4217, e.g. EUR / USD
//   url?: string,
// }
//
// The orchestrator (scripts/scrape-competitors.mjs) classifies platform/service,
// converts to EUR, computes a per-1000 unit price, and stores a dated snapshot.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Reads .env.local the same way the other scripts in this repo do. */
export function loadEnv() {
  const envPath = join(__dirname, "..", "..", ".env.local");
  return Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split("\n")
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** fetch with a browser UA, timeout and one retry. */
export async function http(url, { json = false, timeout = 20000, tries = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < tries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { "User-Agent": UA, Accept: json ? "application/json,*/*" : "text/html,*/*" },
        redirect: "follow",
      });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return json ? await res.json() : await res.text();
    } catch (err) {
      clearTimeout(t);
      lastErr = err;
      if (attempt < tries - 1) await new Promise((r) => setTimeout(r, 800));
    }
  }
  throw lastErr;
}

/** Decode the most common HTML entities found in WooCommerce/WordPress titles. */
export function decodeEntities(s = "") {
  return String(s)
    .replace(/&#8211;|&ndash;/g, "-")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

/**
 * Pull a package size out of a label like "1000 Followers", "1 000 abonnés",
 * "5K likes", "No. of Followers: 2500". Returns null if none found.
 */
export function parseQty(text = "") {
  const t = decodeEntities(String(text)).toLowerCase().replace(/[  ]/g, " ");
  // "5k" / "10 k" / "1.5k"
  const k = t.match(/(\d+(?:[.,]\d+)?)\s*k\b/);
  if (k) return Math.round(parseFloat(k[1].replace(",", ".")) * 1000);
  // plain number possibly with thousands separators: "1 000", "1.000", "10,000"
  const m = t.match(/(\d{1,3}(?:[ .,]\d{3})+|\d{2,7})/);
  if (m) {
    const n = parseInt(m[1].replace(/[ .,]/g, ""), 10);
    if (Number.isFinite(n) && n >= 10) return n;
  }
  return null;
}

const PLATFORMS = [
  ["instagram", /instagram|insta\b|\big\b/i],
  ["tiktok", /tiktok|tik tok/i],
  ["youtube", /youtube|yt\b/i],
  ["twitter", /twitter|\bx\b|tweet/i],
  ["facebook", /facebook|\bfb\b/i],
  ["spotify", /spotify/i],
  ["twitch", /twitch/i],
  ["linkedin", /linkedin/i],
  ["snapchat", /snapchat|snap\b/i],
  ["telegram", /telegram/i],
  ["soundcloud", /soundcloud/i],
];

const SERVICES = [
  ["followers", /follower|abonn|suiveur|subscriber|abonné/i],
  ["likes", /\blike|j.?aime|réaction|reaction/i],
  ["views", /\bview|\bvue|visionnage|stream|écoute|ecoute|plays?/i],
  ["comments", /comment|commentaire/i],
  ["shares", /\bshare|partage|repost|retweet/i],
  ["saves", /\bsave|enregistr/i],
];

/** Best-effort classification from any combination of text hints. */
export function classify(...hints) {
  const text = hints.filter(Boolean).join(" ");
  const platform = PLATFORMS.find(([, re]) => re.test(text))?.[0] || "unknown";
  const service = SERVICES.find(([, re]) => re.test(text))?.[0] || "unknown";
  return { platform, service };
}

/**
 * Live EUR conversion rates from frankfurter.app (free, no key). Falls back to
 * rough static rates if the call fails, so a run never dies on FX. Returns a
 * function (amount, currency) => EUR.
 */
export async function makeEurConverter() {
  const fallback = { USD: 0.92, GBP: 1.17, EUR: 1 };
  let rates = { ...fallback };
  try {
    const data = await http("https://api.frankfurter.app/latest?from=EUR&to=USD,GBP", { json: true });
    // frankfurter gives EUR->X; we need X->EUR = 1/rate
    if (data?.rates?.USD) rates.USD = 1 / data.rates.USD;
    if (data?.rates?.GBP) rates.GBP = 1 / data.rates.GBP;
  } catch {
    /* keep fallback */
  }
  return (amount, currency) => {
    const cur = (currency || "EUR").toUpperCase();
    const r = rates[cur] ?? 1;
    return Math.round(amount * r * 100) / 100;
  };
}
