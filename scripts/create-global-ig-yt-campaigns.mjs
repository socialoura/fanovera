/**
 * Creates 2 SEPARATE global SEARCH campaigns (test 20€) :
 *   1. [GLOBAL] Instagram Followers
 *   2. [GLOBAL] YouTube Views
 *
 * Spec : docs/google-ads-target-countries.md
 *   - Geo        : 30 pays (résolus dynamiquement via geo_target_constant)
 *   - Langue     : English (1000)            ← cf. note ci-dessous
 *   - Bidding    : MAXIMIZE_CLICKS, plafond CPC 0.50 € (PAS de Smart Bidding)
 *   - Budget     : 5 €/jour PAR campagne (≈ 20€ sur 2 jours pour les deux)
 *   - Keywords   : PHRASE + mur de négatifs (base commune + spécifiques)
 *   - RSA        : copie À L'IDENTIQUE des ad groups UK (pin H2 conservé)
 *   - Final URL  : /promo?lang=en&utm_term=<network>  + suffix LTV kw/mt
 *   - Statut     : campagne PAUSED, RSA PAUSED (sécurité compte fragile)
 *
 * Whitehat : keywords créés avec drop & retry policy (JAMAIS d'exemption forcée).
 *
 * ⚠️ Langue : on cible "English". Les annonces sont en anglais, donc on évite de
 *    payer pour des utilisateurs en langue locale qui ne convertiront pas. Pour
 *    élargir au maximum (au prix de clics gaspillés), mettre LANGUAGE_ID = null.
 *
 * Usage :
 *   node scripts/create-global-ig-yt-campaigns.mjs          # dry-run
 *   node scripts/create-global-ig-yt-campaigns.mjs --live   # execute
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

// ─── Config ───────────────────────────────────────────────────────────────
const BUDGET_MICROS_PER_DAY = 5_000_000;   // 5 € / jour / campagne
const CPC_CEILING_MICROS = 500_000;        // 0.50 € plafond
const LANGUAGE_ID = "1000";                // English ; null = toutes langues
const FINAL_URL_SUFFIX = "utm_source=google&utm_medium=cpc&kw={keyword}&mt={matchtype}";

const TARGET_COUNTRIES = [
  "US", "GB", "CA", "AU", "NZ", "IE", "DE", "FR", "NL", "BE", "CH", "AT",
  "LU", "SE", "NO", "DK", "FI", "ES", "IT", "PT", "GR", "PL", "CZ", "HU",
  "RO", "SK", "SI", "BR", "MX", "TR",
];

// ─── Négatifs base commune (les 2 campagnes) ────────────────────────────────
const BASE_NEG_BROAD = [
  // gratuit / illégitime
  "free", "gratis", "hack", "hacks", "hacker", "hacking", "cheat", "cheats",
  "generator", "gen", "crack", "cracked",
  // outils / logiciels / bots
  "app", "apps", "apk", "mod", "bot", "bots", "robot", "software", "tool",
  "tools", "extension", "plugin", "addon", "panel", "reseller", "api", "script",
  "automation",
  // how-to / organique
  "tutorial", "guide", "tips", "trick", "tricks", "organic", "organically",
  "naturally", "manually", "earn",
  // info / vérification
  "meaning", "definition", "count", "counter", "checker", "tracker", "audit",
  "analytics", "calculator", "statistics", "stats",
  // compte / sécurité / réputation
  "login", "signin", "account", "password", "delete", "remove", "recover",
  "recovery", "ban", "banned", "suspended", "disabled", "hacked", "scam",
  "scams", "legit", "refund",
  // emploi
  "job", "jobs", "career", "careers", "hiring", "salary", "intern", "internship",
  // tech / support / fake-detection
  "download", "downloader", "converter", "error", "glitch", "fix", "problem",
  "support", "helpline", "fake", "fakes", "ghost", "spam",
];
const BASE_NEG_PHRASE = [
  "smm panel", "no survey", "no human verification", "for free", "without paying",
  "free trial", "how to", "how do", "how can", "best way", "real way", "ways to",
  "what is", "what are", "how many", "how much", "log in", "sign in",
  "is it safe", "is it legal", "is it worth", "to mp3", "to mp4", "not working",
  "customer service", "remove fake", "fake followers", "fake views",
];

// ─── RSA UK (verbatim) ──────────────────────────────────────────────────────
const H2 = enums.ServedAssetFieldType.HEADLINE_2;
const RSA_IG = {
  headlines: [
    { text: "Results Within 2 Minutes" },
    { text: "8,000+ Happy Customers" },
    { text: "Grow Your Instagram", pinned_field: H2 },
    { text: "Lowest Price Guaranteed" },
    { text: "Instant Start" },
    { text: "5% Off With Code FANO5" },
  ],
  descriptions: [
    { text: "Trusted by 8,000+ creators. Progressive natural growth, no password required, 3D Secure." },
    { text: "Grow your Instagram audience. Safe, fast, reliable. 30-day refund guarantee included." },
    { text: "Promote your Instagram with confidence. Code FANO5 for 5% off your first order." },
    { text: "Boost your reach on Instagram. Secure Stripe payment, no password, results in minutes." },
  ],
};
const RSA_YT = {
  headlines: [
    { text: "Results Within 2 Minutes" },
    { text: "8,000+ Happy Customers" },
    { text: "Grow Your YouTube Video", pinned_field: H2 },
    { text: "Lowest Price Guaranteed" },
    { text: "Instant Start" },
    { text: "5% Off With Code FANO5" },
  ],
  descriptions: [
    { text: "Trusted by 8,000+ creators. Progressive natural growth, no password required, 3D Secure." },
    { text: "Grow your YouTube channel reach. Safe, fast, reliable. 30-day refund guarantee." },
    { text: "Promote your YouTube videos with confidence. Code FANO5 for 5% off your first order." },
    { text: "Boost your YouTube content. Secure Stripe payment, no password, results in minutes." },
  ],
};

// ─── Sitelinks (différenciés, pas d'auto-référence) ─────────────────────────
const SL = (text, term) => ({ link_text: text, final_urls: [`https://www.fanovera.com/promo?lang=en&utm_term=${term}`] });
const SL_FAQ = { link_text: "FAQ", final_urls: ["https://www.fanovera.com/?lang=en#faq"] };
const SL_HOW = { link_text: "How it works", final_urls: ["https://www.fanovera.com/?lang=en#how"] };

// ─── Spec des 2 campagnes ───────────────────────────────────────────────────
const CAMPAIGNS = [
  {
    name: "[GLOBAL] Instagram Followers",
    adGroupName: "Instagram",
    finalUrl: "https://www.fanovera.com/promo?lang=en&utm_term=instagram",
    rsa: RSA_IG,
    keywords: [
      "instagram followers", "ig followers", "insta followers", "followers instagram",
      "instagram follower seller", "buy instagram followers", "buy ig followers",
      "get instagram followers", "grow instagram followers", "instagram followers cheap",
      "pay for instagram followers", "best site to buy instagram followers",
    ],
    negBroad: ["likes", "like", "comments", "comment", "views", "reach", "impressions", "verification", "verified", "badge"],
    negPhrase: ["story views", "reel views", "auto likes", "profile visits", "blue tick", "most followers"],
    sitelinks: [SL("TikTok", "tiktok"), SL("YouTube", "youtube"), SL("Spotify", "spotify"), SL_FAQ, SL_HOW],
  },
  {
    name: "[GLOBAL] YouTube Views",
    adGroupName: "YouTube",
    finalUrl: "https://www.fanovera.com/promo?lang=en&utm_term=youtube",
    rsa: RSA_YT,
    keywords: [
      "youtube views", "yt views", "views on youtube", "youtube video views",
      "buy youtube views", "get youtube views", "youtube views cheap",
      "best site to buy youtube views",
    ],
    negBroad: [
      "youtube ads", "youtube premium", "youtube music", "youtube kids", "youtube tv",
      "youtube shorts", "youtube vanced", "youtube studio", "youtube go", "youtube originals",
      "youtube downloader", "youtube analytics", "partner program",
      "subscribers", "subscriber", "subs", "subscribe", "monetization", "monetize",
      "monetized", "cpm", "rpm", "earnings", "revenue", "adsense",
    ],
    negPhrase: ["watch time", "watch hours", "how much youtube pays", "1000 subscribers", "4000 hours"],
    sitelinks: [SL("Instagram", "instagram"), SL("TikTok", "tiktok"), SL("Spotify", "spotify"), SL_FAQ, SL_HOW],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const tok = (s) => s.toLowerCase().split(/\s+/).filter(Boolean);
const dedupe = (arr) => [...new Set(arr.map((s) => s.toLowerCase()))];

// Validate RSA lengths upfront.
for (const c of CAMPAIGNS) {
  for (const h of c.rsa.headlines) if (h.text.length > 30) { console.error(`[${c.name}] headline too long (${h.text.length}): "${h.text}"`); process.exit(1); }
  for (const d of c.rsa.descriptions) if (d.text.length > 90) { console.error(`[${c.name}] desc too long (${d.text.length}): "${d.text}"`); process.exit(1); }
}

// Conflict guard : un négatif ne doit jamais bloquer un positif de la campagne.
function conflicts(c) {
  const out = [];
  const broad = dedupe([...BASE_NEG_BROAD, ...(c.negBroad || [])]);
  const phrase = dedupe([...BASE_NEG_PHRASE, ...(c.negPhrase || [])]);
  for (const kw of c.keywords) {
    const kwTok = new Set(tok(kw));
    for (const n of broad) if (tok(n).every((w) => kwTok.has(w))) out.push(`BROAD neg "${n}" bloque "${kw}"`);
    for (const n of phrase) if (kw.toLowerCase().includes(n)) out.push(`PHRASE neg "${n}" bloque "${kw}"`);
  }
  return out;
}

// ─── Résolution géo (dynamique, fiable) ─────────────────────────────────────
console.log("Résolution des geo_target_constant…");
const geoRows = await customer.query(`
  SELECT geo_target_constant.id, geo_target_constant.country_code, geo_target_constant.target_type
  FROM geo_target_constant
  WHERE geo_target_constant.status = 'ENABLED' AND geo_target_constant.target_type = 'Country'
`);
const codeToId = new Map();
for (const r of geoRows) {
  const cc = (r.geo_target_constant.country_code || "").toUpperCase();
  if (cc && !codeToId.has(cc)) codeToId.set(cc, r.geo_target_constant.id);
}
const geoTargets = [];
const missing = [];
for (const cc of TARGET_COUNTRIES) {
  const id = codeToId.get(cc);
  if (id) geoTargets.push({ cc, id }); else missing.push(cc);
}
if (missing.length) { console.error(`⛔ Pays non résolus : ${missing.join(", ")} — abort`); process.exit(1); }
console.log(`  ✓ ${geoTargets.length}/30 pays résolus`);

// ─── Liste de négatifs partagée "Fanovera Negatives — EN" (si existante) ────
let sharedSetResource = null;
try {
  const ss = await customer.query(`
    SELECT shared_set.id, shared_set.name FROM shared_set
    WHERE shared_set.type = 'NEGATIVE_KEYWORDS' AND shared_set.status != 'REMOVED'`);
  const hit = ss.find((s) => /negativ/i.test(s.shared_set.name) && /\ben\b/i.test(s.shared_set.name));
  if (hit) { sharedSetResource = `customers/${CUSTOMER_ID}/sharedSets/${hit.shared_set.id}`; console.log(`  ✓ liste partagée trouvée : "${hit.shared_set.name}"`); }
  else console.log("  ⚠ liste partagée 'Negatives EN' introuvable — on continue sans (négatifs ad-group suffisent)");
} catch { console.log("  ⚠ lecture shared_set impossible — on continue sans"); }

// ─── Conflict check ─────────────────────────────────────────────────────────
for (const c of CAMPAIGNS) {
  const cf = conflicts(c);
  if (cf.length) { console.error(`\n⛔ CONFLIT négatif/positif sur ${c.name} :`); cf.forEach((x) => console.error("   " + x)); process.exit(1); }
}

// ─── Preview ────────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));
for (const c of CAMPAIGNS) {
  const nNeg = dedupe([...BASE_NEG_BROAD, ...(c.negBroad || [])]).length + dedupe([...BASE_NEG_PHRASE, ...(c.negPhrase || [])]).length;
  console.log(`\nCAMPAGNE ${c.name}`);
  console.log(`  PAUSED · MAXIMIZE_CLICKS (plafond 0.50 €) · ${BUDGET_MICROS_PER_DAY / 1e6} €/jour`);
  console.log(`  Geo: 30 pays · Langue: ${LANGUAGE_ID ? "English" : "toutes"} · suffix: ${FINAL_URL_SUFFIX}`);
  console.log(`  AG "${c.adGroupName}" : ${c.keywords.length} kw PHRASE · ${nNeg} négatifs · ${c.sitelinks?.length || 0} sitelinks`);
  console.log(`  RSA: ${c.rsa.headlines.length} H / ${c.rsa.descriptions.length} D (PAUSED) · ${c.finalUrl}`);
}
if (!LIVE) { console.log("\nDry-run OK. Re-run avec --live pour exécuter."); process.exit(0); }

// ─── Exécution ──────────────────────────────────────────────────────────────
async function addKeywordsWithPolicyRetry(adGroupResource, keywords) {
  const skipped = [];
  let list = [...keywords];
  for (;;) {
    if (!list.length) return { added: keywords.length - skipped.length, skipped };
    const ops = list.map((text) => ({ ad_group: adGroupResource, status: enums.AdGroupCriterionStatus.ENABLED, keyword: { text, match_type: enums.KeywordMatchType.PHRASE } }));
    try { await customer.adGroupCriteria.create(ops); return { added: list.length, skipped }; }
    catch (err) {
      const viol = (err?.errors || []).filter((e) => e?.error_code?.policy_violation_error != null && e?.trigger?.string_value).map((e) => e.trigger.string_value);
      if (!viol.length) throw err;
      for (const vt of viol) { if (!skipped.includes(vt)) skipped.push(vt); list = list.filter((t) => t !== vt); }
      console.log(`    ⚠ policy-rejected, dropped: ${viol.join(", ")}`);
    }
  }
}

console.log("\n" + "─".repeat(70) + "\nExécution…");
for (const c of CAMPAIGNS) {
  console.log(`\n████ ${c.name} ████`);

  // 1. Budget
  const budgetRes = await customer.campaignBudgets.create([{
    name: `${c.name} ${Date.now()}`,
    amount_micros: BUDGET_MICROS_PER_DAY,
    delivery_method: enums.BudgetDeliveryMethod.STANDARD,
    explicitly_shared: false,
  }]);
  const budgetResource = budgetRes.results[0].resource_name;
  console.log(`  ✓ budget`);

  // 2. Campagne
  const campRes = await customer.campaigns.create([{
    name: c.name,
    status: enums.CampaignStatus.PAUSED,
    advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
    campaign_budget: budgetResource,
    target_spend: { cpc_bid_ceiling_micros: CPC_CEILING_MICROS },
    final_url_suffix: FINAL_URL_SUFFIX,
    contains_eu_political_advertising: enums.EuPoliticalAdvertisingStatus.DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING,
    network_settings: {
      target_google_search: true,
      target_search_network: false,
      target_content_network: false,
      target_partner_search_network: false,
    },
    geo_target_type_setting: {
      positive_geo_target_type: enums.PositiveGeoTargetType.PRESENCE,
      negative_geo_target_type: enums.NegativeGeoTargetType.PRESENCE,
    },
  }]);
  const campResource = campRes.results[0].resource_name;
  const campaignId = campResource.split("/").pop();
  console.log(`  ✓ campagne ${campaignId}`);

  // 3. Geo + langue
  const geoOps = geoTargets.map((g) => ({ campaign: campResource, location: { geo_target_constant: `geoTargetConstants/${g.id}` } }));
  if (LANGUAGE_ID) geoOps.push({ campaign: campResource, language: { language_constant: `languageConstants/${LANGUAGE_ID}` } });
  for (let i = 0; i < geoOps.length; i += 100) await customer.campaignCriteria.create(geoOps.slice(i, i + 100));
  console.log(`  ✓ ${geoTargets.length} geo${LANGUAGE_ID ? " + langue" : ""}`);

  // 3b. Liste de négatifs partagée
  if (sharedSetResource) {
    await customer.campaignSharedSets.create([{ campaign: campResource, shared_set: sharedSetResource }]);
    console.log(`  ✓ liste négative partagée rattachée`);
  }

  // 4. Ad group
  const agRes = await customer.adGroups.create([{
    name: c.adGroupName,
    campaign: campResource,
    status: enums.AdGroupStatus.ENABLED,
    type: enums.AdGroupType.SEARCH_STANDARD,
    cpc_bid_micros: 10000,
  }]);
  const adGroupResource = agRes.results[0].resource_name;
  console.log(`  ✓ ad group "${c.adGroupName}"`);

  // 5. Négatifs (positifs ajoutés après, avec policy-retry)
  const broad = dedupe([...BASE_NEG_BROAD, ...(c.negBroad || [])]);
  const phrase = dedupe([...BASE_NEG_PHRASE, ...(c.negPhrase || [])]);
  const negOps = [
    ...broad.map((text) => ({ ad_group: adGroupResource, status: enums.AdGroupCriterionStatus.ENABLED, negative: true, keyword: { text, match_type: enums.KeywordMatchType.BROAD } })),
    ...phrase.map((text) => ({ ad_group: adGroupResource, status: enums.AdGroupCriterionStatus.ENABLED, negative: true, keyword: { text, match_type: enums.KeywordMatchType.PHRASE } })),
  ];
  for (let i = 0; i < negOps.length; i += 100) await customer.adGroupCriteria.create(negOps.slice(i, i + 100));
  console.log(`  ✓ ${negOps.length} négatifs`);

  // 6. Positifs PHRASE (drop & retry policy)
  const { added, skipped } = await addKeywordsWithPolicyRetry(adGroupResource, c.keywords);
  console.log(`  ✓ ${added} keywords PHRASE${skipped.length ? ` (${skipped.length} policy-skipped: ${skipped.join(", ")})` : ""}`);

  // 7. RSA (PAUSED)
  await customer.adGroupAds.create([{
    ad_group: adGroupResource,
    status: enums.AdGroupAdStatus.PAUSED,
    ad: { final_urls: [c.finalUrl], responsive_search_ad: { headlines: c.rsa.headlines, descriptions: c.rsa.descriptions } },
  }]);
  console.log(`  ✓ RSA (PAUSED)`);

  // 8. Sitelinks
  if (c.sitelinks?.length) {
    const slRes = await customer.assets.create(c.sitelinks.map((s) => ({ sitelink_asset: { link_text: s.link_text }, final_urls: s.final_urls })));
    await customer.adGroupAssets.create(slRes.results.map((r) => ({ ad_group: adGroupResource, asset: r.resource_name, field_type: enums.AssetFieldType.SITELINK })));
    console.log(`  ✓ ${c.sitelinks.length} sitelinks`);
  }

  console.log(`  ▶ https://ads.google.com/aw/adgroups?campaignId=${campaignId}`);
}

console.log(`\n✅ DONE. 2 campagnes créées (PAUSED, RSA PAUSED). Revue manuelle puis activation.`);
