import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const { GoogleAdsApi } = await import("google-ads-api");

const client = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

const customer = client.Customer({
  customer_id: env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, ""),
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});

// Try yesterday (most likely to have data)
const yesterday = new Date();
yesterday.setUTCDate(yesterday.getUTCDate() - 1);
const day = yesterday.toISOString().slice(0, 10);

console.log("Test 1: single-day WHERE segments.date = '" + day + "'");
try {
  const rows = await customer.query(`
    SELECT click_view.gclid, campaign.id, campaign.name, ad_group.id, segments.date
    FROM click_view
    WHERE segments.date = '${day}'
  `);
  console.log(`  → ${rows.length} rows`);
  if (rows.length > 0) console.log("  sample:", JSON.stringify(rows[0]));
} catch (err) {
  console.log("  ✗ ERROR:", err?.errors ? JSON.stringify(err.errors) : err?.message || String(err));
}

console.log("\nTest 2: range WHERE segments.date DURING LAST_30_DAYS");
try {
  const rows = await customer.query(`
    SELECT click_view.gclid, campaign.id, campaign.name, ad_group.id, segments.date
    FROM click_view
    WHERE segments.date DURING LAST_30_DAYS
  `);
  console.log(`  → ${rows.length} rows`);
} catch (err) {
  console.log("  ✗ ERROR:", err?.errors ? JSON.stringify(err.errors) : err?.message || String(err));
}
