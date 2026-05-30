/**
 * Creates the Tiktok ad group on campaign [US] Fanovera (23883852621).
 *
 * Identical to create-tiktok-uk-ag.mjs (English, lang=en) — the [US] campaign
 * was cloned from [UK] before the Tiktok ad group existed, so this back-fills
 * the missing ad group with the same proven structure.
 *
 * IMPORTANT — whitehat: RSA copy has no "buy"/quantities/"cheap" (fragile-account
 * rule). Those words live only in the keywords (targeting), which is allowed.
 * RSA is created PAUSED for manual policy review.
 *
 * NOTE — negative/positive conflict guard: UK/US positives are EXACT and contain
 * buy/cheap/followers, so we deliberately do NOT negate "buy", "cheap",
 * "followers", "buy followers", or "cheap followers".
 *
 * Usage:
 *   node scripts/create-tiktok-us-ag.mjs          # dry-run
 *   node scripts/create-tiktok-us-ag.mjs --live   # execute
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const LIVE = process.argv.includes("--live");
const CUSTOMER_ID = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");
const US_CAMPAIGN_ID = 23883852621;
const FINAL_URL = "https://www.fanovera.com/promo?lang=en";

const { GoogleAdsApi, enums } = await import("google-ads-api");
const customer = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
}).Customer({
  customer_id: CUSTOMER_ID,
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});

// ── Positive keywords (EXACT) — followers-focused, grounded in EN search-term data
const POSITIVE_KEYWORDS = [
  "buy tiktok followers",          // proven CPA 4.54 €
  "buy followers tiktok",
  "buy tiktok follower",
  "tiktok followers buy",
  "tiktok follower buy",
  "buy 1000 tiktok followers",
  "buy 100 tiktok followers",
  "buy 1k tiktok followers",
  "buy 5000 tiktok followers",
  "buy 10000 tiktok followers",
  "tiktok followers cheap",        // proven CPA 4.13 €
  "cheap tiktok followers",
  "pay for tiktok followers",
  "real tiktok followers",
  "best site to buy tiktok followers",
];

// ── Negatives (BROAD) — English + competitor brands.
// Deliberately omits buy / cheap / followers / "buy followers" / "cheap followers".
const BROAD_NEGATIVES = [
  // generic non-buyer intent
  "free", "gratis", "hack", "hacker", "cheat", "bot", "bots", "generator",
  "fake", "download", "apk", "login", "jobs", "salary", "agency", "app",
  "application", "badge", "trend", "trends", "trending", "reels", "reel",
  "story", "stories", "view", "views", "creator", "influencer", "monetize",
  "monetise", "verification", "verified", "hashtag", "hashtags", "reddit",
  "quora", "forum", "f4f", "s4s", "why", "what is",
  "how to", "how to get", "how to grow", "how to gain",
  "follow for follow", "follow 4 follow",
  "grow followers", "increase followers", "more followers", "gain followers",
  "get followers", "free followers", "free follower", "bot followers",
  "fake followers", "top follower", "top followers", "story views", "reels views",
  // tiktok product / non-service intent
  "tiktok ads", "tiktok shop", "tiktok studio", "tiktok pro", "tiktok business",
  "tiktok live", "tiktok coins", "download tiktok", "creator tiktok", "zefoy",
  // instagram cross-contamination
  "buy instagram", "instagram ads", "instagram business", "instalike",
  // competitor brands
  "famoid", "viralyft", "topfollow", "twicsy", "buzzoid", "stormlike", "leofame",
  "famety", "socialdoper", "sitefame", "getinsta", "mr insta", "mrinsta",
  "buyfollowers", "fire like", "followersgram", "socialfame", "fastagram",
  "followersup", "runpost", "viralrace", "skweezer", "goread", "anotherfollower",
  "toolzu", "getafollowers", "insfollowup", "instamama", "instamoda", "plixi", "upleap",
];

// ── EXACT negatives — tracker/counter junk (mirrors Instagram UK style)
const EXACT_NEGATIVES = [
  "tiktok follower count",
  "tiktok followers count",
  "tiktok live follower count",
  "track tiktok followers",
  "tiktok follower tracker",
];

// ── RSA (English, whitehat — no buy/quantities/cheap)
const RSA = {
  final_urls: [FINAL_URL],
  headlines: [
    { text: "Results Within 2 Minutes" },
    { text: "8,000+ Happy Customers" },
    { text: "Grow Your TikTok" },
    { text: "Lowest Price Guaranteed" },
    { text: "Instant Start" },
    { text: "5% Off With Code FANO5" },
    { text: "Fanovera - TikTok Growth" },
    { text: "Fast & Reliable Delivery" },
  ],
  descriptions: [
    { text: "Trusted by 8,000+ creators. Progressive natural growth, no password required, 3D Secure." },
    { text: "Grow your TikTok audience. Safe, fast, reliable. 30-day refund guarantee included." },
    { text: "Promote your TikTok with confidence. Code FANO5 for 5% off your first order." },
    { text: "Boost your reach on TikTok. Secure Stripe payment, no password, results in minutes." },
  ],
};
for (const h of RSA.headlines) if (h.text.length > 30) { console.error(`Headline too long (${h.text.length}): "${h.text}"`); process.exit(1); }
for (const d of RSA.descriptions) if (d.text.length > 90) { console.error(`Description too long (${d.text.length}): "${d.text}"`); process.exit(1); }

// ── Sitelinks (mirror Instagram UK, English)
const SITELINKS = [
  { link_text: "Customer Testimonials", final_urls: ["https://www.fanovera.com/promo?lang=en#proof"] },
  { link_text: "How It Works", final_urls: ["https://www.fanovera.com/promo?lang=en#how"] },
  { link_text: "Contact Us", final_urls: ["https://www.fanovera.com/contact"] },
  { link_text: "Order Tracking", final_urls: ["https://www.fanovera.com/track"] },
  { link_text: "Read The FAQs", final_urls: ["https://www.fanovera.com/#faq"] },
];

// ── Conflict guard: assert no BROAD negative would suppress a positive
const positiveWordSets = POSITIVE_KEYWORDS.map((k) => new Set(k.split(/\s+/)));
for (const neg of BROAD_NEGATIVES) {
  const negWords = neg.split(/\s+/);
  for (let i = 0; i < POSITIVE_KEYWORDS.length; i++) {
    if (negWords.every((w) => positiveWordSets[i].has(w))) {
      console.error(`✗ CONFLICT: BROAD negative "${neg}" would block positive "${POSITIVE_KEYWORDS[i]}"`);
      process.exit(1);
    }
  }
}

const ALL_NEGATIVES = [
  ...BROAD_NEGATIVES.map((text) => ({ text, match_type: enums.KeywordMatchType.BROAD })),
  ...EXACT_NEGATIVES.map((text) => ({ text, match_type: enums.KeywordMatchType.EXACT })),
];

// ── Preview
console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));
console.log(`\nCampaign:  [US] Fanovera (${US_CAMPAIGN_ID})`);
console.log(`\n[1] Ad group: "Tiktok"  ENABLED  cpc_bid=10000 micros`);
console.log(`[2] Positive keywords (EXACT): ${POSITIVE_KEYWORDS.length}`);
for (const k of POSITIVE_KEYWORDS) console.log(`    [EXACT] ${k}`);
console.log(`\n[3] Negatives: ${ALL_NEGATIVES.length} (${BROAD_NEGATIVES.length} BROAD + ${EXACT_NEGATIVES.length} EXACT)`);
console.log(`    conflict guard: PASSED (no negative blocks a positive)`);
console.log(`\n[4] RSA (PAUSED): ${RSA.headlines.length} headlines, ${RSA.descriptions.length} descriptions`);
for (const h of RSA.headlines) console.log(`    H: "${h.text}"  (${h.text.length})`);
for (const d of RSA.descriptions) console.log(`    D: "${d.text}"  (${d.text.length})`);
console.log(`\n[5] Sitelinks: ${SITELINKS.length}`);
for (const s of SITELINKS) console.log(`    "${s.link_text}" → ${s.final_urls[0]}`);
console.log(`\n[6] Price asset: none (mirrors Instagram UK)`);

if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }

// ── Execute
console.log("\nExecuting…");
const agRes = await customer.adGroups.create([{
  name: "Tiktok",
  campaign: `customers/${CUSTOMER_ID}/campaigns/${US_CAMPAIGN_ID}`,
  status: enums.AdGroupStatus.ENABLED,
  type: enums.AdGroupType.SEARCH_STANDARD,
  cpc_bid_micros: 10000,
}]);
const adGroupResource = agRes.results[0].resource_name;
const adGroupId = adGroupResource.split("/").pop();
console.log(`  ✓ Ad group: ${adGroupResource}`);

const criteriaOps = [
  ...POSITIVE_KEYWORDS.map((text) => ({
    ad_group: adGroupResource,
    status: enums.AdGroupCriterionStatus.ENABLED,
    keyword: { text, match_type: enums.KeywordMatchType.EXACT },
  })),
  ...ALL_NEGATIVES.map((k) => ({
    ad_group: adGroupResource,
    status: enums.AdGroupCriterionStatus.ENABLED,
    negative: true,
    keyword: { text: k.text, match_type: k.match_type },
  })),
];
console.log(`  creating ${criteriaOps.length} criteria…`);
for (let i = 0; i < criteriaOps.length; i += 100) {
  await customer.adGroupCriteria.create(criteriaOps.slice(i, i + 100));
}
console.log(`  ✓ ${criteriaOps.length} criteria`);

await customer.adGroupAds.create([{
  ad_group: adGroupResource,
  status: enums.AdGroupAdStatus.PAUSED,
  ad: {
    final_urls: RSA.final_urls,
    responsive_search_ad: { headlines: RSA.headlines, descriptions: RSA.descriptions },
  },
}]);
console.log(`  ✓ RSA created (PAUSED)`);

const slAssetRes = await customer.assets.create(SITELINKS.map((s) => ({
  sitelink_asset: { link_text: s.link_text },
  final_urls: s.final_urls,
})));
await customer.adGroupAssets.create(slAssetRes.results.map((r) => ({
  ad_group: adGroupResource,
  asset: r.resource_name,
  field_type: enums.AssetFieldType.SITELINK,
})));
console.log(`  ✓ ${SITELINKS.length} sitelinks`);

console.log(`\n✅ DONE. AG ${adGroupId} "Tiktok" on [US] Fanovera (RSA PAUSED — enable after policy review).`);
console.log(`URL: https://ads.google.com/aw/adgroups?campaignId=${US_CAMPAIGN_ID}`);
