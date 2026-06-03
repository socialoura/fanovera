/**
 * On [CH] and [FR] Facebook ad groups: remove the off-product EXACT keyword
 * "acheter abonnés page facebook" (followers intent) and add
 * "acheter j'aime page facebook" (likes intent — matches the product).
 * Idempotent. Dry-run by default; --live to execute.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(readFileSync(join(__dirname,"..",".env.local"),"utf8").split("\n").filter(l=>l&&!l.startsWith("#")&&l.includes("=")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
const LIVE = process.argv.includes("--live");
const CUSTOMER_ID = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g,"");
const { GoogleAdsApi, enums } = await import("google-ads-api");
const customer = new GoogleAdsApi({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,developer_token:env.GOOGLE_ADS_DEVELOPER_TOKEN}).Customer({customer_id:CUSTOMER_ID,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,login_customer_id:env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g,"")});

const REMOVE = "acheter abonnés page facebook";
const ADD = "acheter j'aime page facebook";
const CAMPS = {CH:23882783997,FR:23844165759};

console.log(LIVE?"▶ LIVE":"▶ DRY-RUN");
for (const [k,id] of Object.entries(CAMPS)) {
  const ag = await customer.query(`SELECT ad_group.id FROM ad_group WHERE campaign.id=${id} AND ad_group.name='Facebook' AND ad_group.status!='REMOVED'`);
  if(!ag.length){console.log(`[${k}] no Facebook ad group — skip`);continue;}
  const agId=ag[0].ad_group.id;
  const agResource=`customers/${CUSTOMER_ID}/adGroups/${agId}`;
  const kws = await customer.query(`SELECT ad_group_criterion.resource_name, ad_group_criterion.keyword.text FROM ad_group_criterion WHERE ad_group.id=${agId} AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.negative=FALSE AND ad_group_criterion.status!='REMOVED'`);
  const toRemove = kws.find(r=>r.ad_group_criterion.keyword.text.toLowerCase()===REMOVE);
  const alreadyHasAdd = kws.some(r=>r.ad_group_criterion.keyword.text.toLowerCase()===ADD);
  console.log(`\n[${k}] AG ${agId}`);
  console.log(`   remove "${REMOVE}": ${toRemove?"found":"absent (nothing to remove)"}`);
  console.log(`   add    "${ADD}": ${alreadyHasAdd?"already present (skip)":"will add"}`);
  if(!LIVE) continue;
  if(toRemove){ await customer.adGroupCriteria.remove([toRemove.ad_group_criterion.resource_name]); console.log("   ✓ removed"); }
  if(!alreadyHasAdd){
    await customer.adGroupCriteria.create([{ad_group:agResource,status:enums.AdGroupCriterionStatus.ENABLED,keyword:{text:ADD,match_type:enums.KeywordMatchType.EXACT}}]);
    console.log("   ✓ added");
  }
}
console.log(LIVE?"\n✅ DONE":"\nDry-run complete. Re-run with --live.");
