/**
 * Rolls back the entire [DE] Fanovera campaign creation attempt.
 * Removes campaign (cascades to all ad groups) + the orphaned budget.
 * Assets (sitelinks, price) become orphaned but are harmless — leave them.
 */
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

const CAMPAIGN = "customers/7881570874/campaigns/23892001117";
const BUDGET = "customers/7881570874/campaignBudgets/15603271661";

console.log("Removing campaign [DE] Fanovera (cascades to all AGs)…");
await customer.campaigns.remove([CAMPAIGN]);
console.log(`  ✓ campaign removed: ${CAMPAIGN}`);

console.log("\nRemoving orphaned budget…");
await customer.campaignBudgets.remove([BUDGET]);
console.log(`  ✓ budget removed: ${BUDGET}`);

console.log("\nVerifying campaign is gone…");
const check = await customer.query(`
  SELECT campaign.id, campaign.name, campaign.status
  FROM campaign
  WHERE campaign.id = 23892001117
`);
if (check.length > 0) {
  console.log(`  campaign status: ${check[0].campaign.status} (4=REMOVED expected)`);
} else {
  console.log(`  no row returned (= removed)`);
}

console.log("\n✅ Rollback complete. Campaign + budget gone. Orphaned assets persist but are harmless.");
