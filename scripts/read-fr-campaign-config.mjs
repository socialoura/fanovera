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

const FR_CAMPAIGN = 23844165759;
const EN_CAMPAIGN = 23844174192;

for (const [label, id] of [["FR", FR_CAMPAIGN], ["EN", EN_CAMPAIGN]]) {
  console.log(`\n=== [${label}] Fanovera campaign config ===`);
  const camp = await customer.query(`
    SELECT
      campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
      campaign.bidding_strategy_type, campaign.manual_cpc.enhanced_cpc_enabled,
      campaign.target_spend.target_spend_micros, campaign.target_cpa.target_cpa_micros,
      campaign.target_roas.target_roas, campaign.maximize_conversions.target_cpa_micros,
      campaign_budget.amount_micros, campaign_budget.delivery_method, campaign_budget.name,
      campaign_budget.explicitly_shared,
      campaign.network_settings.target_google_search,
      campaign.network_settings.target_search_network,
      campaign.network_settings.target_content_network,
      campaign.network_settings.target_partner_search_network,
      campaign.geo_target_type_setting.positive_geo_target_type,
      campaign.geo_target_type_setting.negative_geo_target_type
    FROM campaign
    WHERE campaign.id = ${id}
  `);
  console.log(JSON.stringify(camp[0], null, 2));

  console.log(`\n  Geo targets:`);
  const geo = await customer.query(`
    SELECT campaign_criterion.location.geo_target_constant,
           campaign_criterion.proximity.geo_point.longitude_in_micro_degrees,
           campaign_criterion.negative
    FROM campaign_criterion
    WHERE campaign.id = ${id}
      AND campaign_criterion.type = 'LOCATION'
      AND campaign_criterion.status != 'REMOVED'
  `);
  for (const g of geo) {
    console.log(`    ${g.campaign_criterion.negative ? "NEG" : "POS"}  ${g.campaign_criterion.location?.geo_target_constant}`);
  }

  console.log(`\n  Language targets:`);
  const lang = await customer.query(`
    SELECT campaign_criterion.language.language_constant
    FROM campaign_criterion
    WHERE campaign.id = ${id}
      AND campaign_criterion.type = 'LANGUAGE'
      AND campaign_criterion.status != 'REMOVED'
  `);
  for (const l of lang) {
    console.log(`    ${l.campaign_criterion.language?.language_constant}`);
  }
}
