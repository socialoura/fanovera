// insfamous.co — WooCommerce. Prices live in per-package variations (attribute
// "No. of Followers"), exposed individually via the Store API product endpoint.
// Simple products carry their own price directly.
import { http, decodeEntities, parseQty } from "./_lib.mjs";

export const meta = { name: "insfamous.co", method: "woocommerce" };

const BASE = "https://insfamous.co/wp-json/wc/store/products";

// Store API returns prices as integer strings in the currency's minor unit.
const toMajor = (p) => {
  const minor = p?.currency_minor_unit ?? 2;
  const v = Number(p?.price);
  return Number.isFinite(v) ? v / 10 ** minor : null;
};

export async function scrape() {
  const records = [];
  // 1) Walk the catalogue.
  const products = [];
  for (let page = 1; page <= 20; page++) {
    const batch = await http(`${BASE}?per_page=100&page=${page}`, { json: true });
    if (!Array.isArray(batch) || batch.length === 0) break;
    products.push(...batch);
    if (batch.length < 100) break;
  }

  for (const p of products) {
    const name = decodeEntities(p.name);
    const cats = (p.categories || []).map((c) => c.name).join(" ");
    const cur = p.prices?.currency_code || "USD";

    if (p.type === "variable" && Array.isArray(p.variations) && p.variations.length) {
      // 2) Each variation = one package size. Fetch its real price by id.
      for (const v of p.variations) {
        try {
          const detail = await http(`${BASE}/${v.id}`, { json: true });
          const price = toMajor(detail.prices);
          const qtyHint = detail.variation || (v.attributes || []).map((a) => a.value).join(" ");
          const qty = parseQty(qtyHint);
          if (price != null && price > 0) {
            records.push({ name: `${name} ${qtyHint}`.trim(), qty, price, currency: cur, url: p.permalink, _cats: cats });
          }
        } catch {
          /* skip a flaky variation, keep the rest */
        }
      }
    } else {
      const price = toMajor(p.prices);
      if (price != null && price > 0) {
        records.push({ name, qty: parseQty(name), price, currency: cur, url: p.permalink, _cats: cats });
      }
    }
  }
  return records;
}
