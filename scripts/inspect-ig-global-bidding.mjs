/** Inspect bidding strategy + the "followers instagram" keyword on [GLOBAL] IG. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const { GoogleAdsApi, enums } = await import("google-ads-api");
const customer = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID, client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
}).Customer({
  customer_id: env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, ""),
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});
const CID = "23920353991";
const eur = (m) => (Number(m) / 1e6).toFixed(2);
const MT = { 2: "EXACT", 3: "PHRASE", 4: "BROAD" };

const c = (await customer.query(`
  SELECT campaign.name, campaign.bidding_strategy_type, campaign.target_cpa.target_cpa_micros,
         campaign.maximize_conversions.target_cpa_micros, campaign.manual_cpc.enhanced_cpc_enabled,
         campaign_budget.amount_micros
  FROM campaign WHERE campaign.id=${CID}
`))[0];
const BST = c.campaign.bidding_strategy_type;
const BSTNAME = Object.fromEntries(Object.entries(enums.BiddingStrategyType).map(([k,v])=>[v,k]));
console.log(`Campaign: "${c.campaign.name}"`);
console.log(`Bidding strategy: ${BSTNAME[BST]} (${BST})`);
console.log(`Daily budget: ${eur(c.campaign_budget.amount_micros)}€`);
console.log(`tCPA (target_cpa): ${c.campaign.target_cpa?.target_cpa_micros ? eur(c.campaign.target_cpa.target_cpa_micros)+"€" : "—"}`);
console.log(`maxconv tCPA: ${c.campaign.maximize_conversions?.target_cpa_micros ? eur(c.campaign.maximize_conversions.target_cpa_micros)+"€" : "—"}`);

console.log(`\nKeywords matching "followers instagram":`);
const kws = await customer.query(`
  SELECT ad_group.id, ad_group.name, ad_group_criterion.criterion_id,
         ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
         ad_group_criterion.status, ad_group_criterion.cpc_bid_micros,
         ad_group_criterion.effective_cpc_bid_micros
  FROM ad_group_criterion
  WHERE campaign.id=${CID} AND ad_group_criterion.type='KEYWORD'
    AND ad_group_criterion.keyword.text LIKE '%followers instagram%'
`);
for (const r of kws) {
  const k = r.ad_group_criterion;
  console.log(`  ag="${r.ad_group.name}" (${r.ad_group.id})  [${MT[k.keyword.match_type]}] "${k.keyword.text}"  status=${k.status}  cpcBid=${k.cpc_bid_micros?eur(k.cpc_bid_micros)+"€":"—"}  effCpc=${k.effective_cpc_bid_micros?eur(k.effective_cpc_bid_micros)+"€":"—"}  critId=${k.criterion_id}`);
}

console.log(`\nAll ad groups in campaign:`);
const ags = await customer.query(`
  SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.cpc_bid_micros
  FROM ad_group WHERE campaign.id=${CID}
`);
for (const r of ags) console.log(`  ${r.ad_group.id}  status=${r.ad_group.status}  cpcBid=${r.ad_group.cpc_bid_micros?eur(r.ad_group.cpc_bid_micros)+"€":"—"}  "${r.ad_group.name}"`);
