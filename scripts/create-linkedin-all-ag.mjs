/**
 * Creates ONE "LinkedIn" ad group on each of the 6 active Fanovera campaigns:
 *   [FR] [CH] (French) · [ES] (Spanish) · [IT] (Italian) · [UK] [US] (English)
 *
 * Product = LinkedIn followers (pricing.li_followers). One ad group per campaign
 * holding the buying-intent keywords (followers / abonnés / seguidores / follower).
 *
 * Whitehat (fragile account, 1 strike = lifetime ban):
 *   - RSA copy is GENERIC about growing your LinkedIn presence — NO
 *     "buy/acheter/comprar/comprare", NO quantities, NO "cheap/pas cher/baratos/
 *     economici". Those terms live ONLY in the keywords (the search intent we bid on).
 *   - RSAs are created PAUSED for manual policy review before enabling.
 *
 * Sitelinks: added at AD-GROUP level only for campaigns WITHOUT campaign-level
 * sitelinks (CH, ES, IT, US). FR and UK already inherit campaign-level sitelinks.
 *
 * Negatives are curated per language (NOT copied from the Instagram base — that
 * caused positive-blocking conflicts, see clean-negative-conflicts.mjs). A
 * conflict guard verifies no BROAD negative blocks any positive before running.
 *
 * Skips any campaign that already has a LinkedIn ad group (no duplicates).
 *
 * Usage:
 *   node scripts/create-linkedin-all-ag.mjs          # dry-run
 *   node scripts/create-linkedin-all-ag.mjs --live   # execute
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

// ── Per-language content (keywords / negatives / RSA / sitelinks) ────────────
const LANG = {
  fr: {
    finalUrl: "https://www.fanovera.com/promo?lang=fr",
    positives: [
      "acheter followers linkedin", "acheter follower linkedin",
      "achat followers linkedin", "achat follower linkedin",
      "acheter abonnés linkedin", "acheter abonné linkedin",
      "achat abonnés linkedin",
      "acheter abonnés page linkedin", "acheter followers page linkedin",
      "acheter followers entreprise linkedin",
      "followers linkedin pas cher", "abonnés linkedin pas cher",
      "acheter 100 followers linkedin", "acheter 500 followers linkedin",
      "payer abonnés linkedin", "meilleur site followers linkedin",
      "acheter abonnés profil linkedin",
    ],
    broadNegatives: [
      "gratuit", "gratuits", "hack", "pirater", "astuce", "astuces", "bot", "bots",
      "générateur", "faux", "fausse", "télécharger", "appli", "application", "forum",
      "reddit", "tutoriel", "emploi", "offre emploi", "comment avoir",
      "comment obtenir", "c'est quoi", "compteur", "nombre",
      // LinkedIn product / non-service intent
      "linkedin premium", "linkedin ads", "linkedin sales navigator",
      "linkedin recruiter", "linkedin learning", "créer compte linkedin",
      "se connecter linkedin", "recruteur linkedin",
    ],
    exactNegatives: [],
    rsa: {
      headlines: [
        "+8 000 Clients Satisfaits", "Résultats Dès 2 minutes", "-5% avec le Code FANO5",
        "Prix Le Plus Bas du Marché", "Démarrage Immédiat", "Livraison Rapide",
        "Fanovera - LinkedIn",
      ],
      descriptions: [
        "Développez votre présence professionnelle sur LinkedIn. Code -5% : FANO5.",
        "+8 000 clients satisfaits. Approche progressive, sans mot de passe. Paiement sécurisé.",
        "Boostez votre profil LinkedIn. Démarrage immédiat, support 7j/7. Essayez avec FANO5.",
        "Visibilité optimisée sur LinkedIn. Paiement sécurisé et résultats rapides 7j/7.",
      ],
    },
    sitelinks: [
      { link_text: "Avis Clients", final_urls: ["https://www.fanovera.com/promo?lang=fr#proof"] },
      { link_text: "Le Fonctionnement", final_urls: ["https://www.fanovera.com/promo?lang=fr#how"] },
      { link_text: "Contact", final_urls: ["https://www.fanovera.com/contact"] },
      { link_text: "Suivi de Commande", final_urls: ["https://www.fanovera.com/track"] },
      { link_text: "FAQ", final_urls: ["https://www.fanovera.com/#faq"] },
    ],
  },

  es: {
    finalUrl: "https://www.fanovera.com/promo?lang=es",
    positives: [
      "comprar seguidores linkedin", "comprar seguidores de linkedin",
      "comprar seguidores en linkedin", "seguidores linkedin comprar",
      "comprar seguidores pagina linkedin", "comprar seguidores empresa linkedin",
      "comprar followers linkedin",
      "comprar 100 seguidores linkedin", "comprar 500 seguidores linkedin",
      "seguidores linkedin baratos", "comprar seguidores linkedin baratos",
      "seguidores linkedin reales", "aumentar seguidores linkedin",
      "comprar seguidores reales linkedin",
      "mejor web para comprar seguidores linkedin", "comprar seguidores perfil linkedin",
    ],
    broadNegatives: [
      "gratis", "gratuito", "hack", "hackear", "truco", "trucos", "bot", "bots",
      "generador", "falsos", "falsas", "descargar", "app", "aplicacion", "foro",
      "reddit", "tutorial", "trabajo", "empleo", "como conseguir", "como tener",
      "que es", "contador",
      // LinkedIn product / non-service intent
      "linkedin premium", "linkedin ads", "linkedin sales navigator",
      "linkedin recruiter", "crear cuenta linkedin", "iniciar sesion linkedin",
      "ofertas empleo linkedin",
    ],
    exactNegatives: [],
    rsa: {
      headlines: [
        "Resultados en 2 Minutos", "+8.000 Clientes Satisfechos", "Haz Crecer Tu LinkedIn",
        "El Precio Más Bajo", "Inicio Inmediato", "-5% con el Código FANO5",
        "Fanovera - LinkedIn", "Entrega Rápida y Fiable",
      ],
      descriptions: [
        "Más de 8.000 clientes. Crecimiento natural y progresivo, sin contraseña, pago seguro.",
        "Haz crecer tu perfil de LinkedIn. Seguro, rápido y fiable. Garantía de 30 días.",
        "Promociona tu LinkedIn. Código FANO5 para un 5% en tu primer pedido.",
        "Aumenta tu alcance profesional. Pago seguro, sin contraseña, resultados rápidos.",
      ],
    },
    sitelinks: [
      { link_text: "Opiniones de Clientes", final_urls: ["https://www.fanovera.com/promo?lang=es#proof"] },
      { link_text: "Cómo Funciona", final_urls: ["https://www.fanovera.com/promo?lang=es#how"] },
      { link_text: "Contacto", final_urls: ["https://www.fanovera.com/contact"] },
      { link_text: "Seguimiento de Pedido", final_urls: ["https://www.fanovera.com/track"] },
      { link_text: "Preguntas Frecuentes", final_urls: ["https://www.fanovera.com/#faq"] },
    ],
  },

  it: {
    finalUrl: "https://www.fanovera.com/promo?lang=it",
    positives: [
      "comprare follower linkedin", "comprare follower su linkedin",
      "follower linkedin comprare", "comprare follower pagina linkedin",
      "comprare follower aziendale linkedin", "comprare seguaci linkedin",
      "comprare 100 follower linkedin", "comprare 500 follower linkedin",
      "follower linkedin economici", "comprare follower linkedin economici",
      "follower linkedin reali", "aumentare follower linkedin",
      "comprare follower reali linkedin",
      "miglior sito per comprare follower linkedin", "comprare follower profilo linkedin",
    ],
    broadNegatives: [
      "gratis", "gratuito", "gratuiti", "hack", "hackerare", "trucco", "trucchi",
      "bot", "bots", "generatore", "falsi", "falso", "scaricare", "app",
      "applicazione", "forum", "reddit", "tutorial", "lavoro", "offerte lavoro",
      "come ottenere", "come avere", "cos'è", "contatore",
      // LinkedIn product / non-service intent
      "linkedin premium", "linkedin ads", "linkedin sales navigator",
      "linkedin recruiter", "creare account linkedin", "accedi linkedin",
    ],
    exactNegatives: [],
    rsa: {
      headlines: [
        "Risultati in 2 Minuti", "+8.000 Clienti Soddisfatti", "Fai Crescere il Tuo LinkedIn",
        "Prezzo Più Basso", "Avvio Immediato", "-5% con il Codice FANO5",
        "Fanovera - LinkedIn", "Consegna Rapida e Sicura",
      ],
      descriptions: [
        "Più di 8.000 clienti. Crescita naturale e progressiva, senza password, pagamento sicuro.",
        "Fai crescere il tuo profilo LinkedIn. Sicuro, veloce e affidabile. Garanzia 30 giorni.",
        "Promuovi il tuo LinkedIn. Codice FANO5 per un 5% sul primo ordine.",
        "Aumenta la tua portata professionale. Pagamento sicuro, senza password, risultati rapidi.",
      ],
    },
    sitelinks: [
      { link_text: "Recensioni dei Clienti", final_urls: ["https://www.fanovera.com/promo?lang=it#proof"] },
      { link_text: "Come Funziona", final_urls: ["https://www.fanovera.com/promo?lang=it#how"] },
      { link_text: "Contattaci", final_urls: ["https://www.fanovera.com/contact"] },
      { link_text: "Traccia il Tuo Ordine", final_urls: ["https://www.fanovera.com/track"] },
      { link_text: "Domande Frequenti", final_urls: ["https://www.fanovera.com/#faq"] },
    ],
  },

  en: {
    finalUrl: "https://www.fanovera.com/promo?lang=en",
    positives: [
      "buy linkedin followers", "buy linkedin follower", "buy followers linkedin",
      "buy linkedin company followers", "buy linkedin page followers",
      "buy company page followers linkedin", "buy followers on linkedin",
      "get linkedin followers", "linkedin followers cheap",
      "buy 100 linkedin followers", "buy 500 linkedin followers",
      "buy 1000 linkedin followers", "increase linkedin followers",
      "buy real linkedin followers", "best site to buy linkedin followers",
      "buy linkedin profile followers", "grow linkedin followers",
    ],
    broadNegatives: [
      "free", "hack", "bot", "bots", "generator", "fake", "app", "download",
      "login", "tutorial", "job", "jobs", "reddit", "how to", "what is",
      "count", "counter",
      // LinkedIn product / non-service intent
      "linkedin premium", "linkedin ads", "linkedin sales navigator",
      "linkedin recruiter", "linkedin learning", "create linkedin account",
      "linkedin marketing", "sign in linkedin",
    ],
    exactNegatives: [],
    rsa: {
      headlines: [
        "Results Within 2 Minutes", "8,000+ Happy Customers", "Grow Your LinkedIn",
        "Lowest Price Guaranteed", "Instant Start", "5% Off With Code FANO5",
        "Fanovera - LinkedIn", "Fast, Reliable Delivery",
      ],
      descriptions: [
        "Trusted by 8,000+ creators. Progressive natural growth, no password required, 3D Secure.",
        "Grow your LinkedIn presence. Safe, fast, reliable. 30-day refund guarantee included.",
        "Promote your LinkedIn with confidence. Code FANO5 for 5% off your first order.",
        "Boost your professional reach. Secure Stripe payment, no password, results in minutes.",
      ],
    },
    sitelinks: [
      { link_text: "Customer Reviews", final_urls: ["https://www.fanovera.com/promo?lang=en#proof"] },
      { link_text: "How It Works", final_urls: ["https://www.fanovera.com/promo?lang=en#how"] },
      { link_text: "Contact Us", final_urls: ["https://www.fanovera.com/contact"] },
      { link_text: "Track Your Order", final_urls: ["https://www.fanovera.com/track"] },
      { link_text: "FAQ", final_urls: ["https://www.fanovera.com/#faq"] },
    ],
  },
};

// ── The 6 campaigns. addSitelinks=false where campaign-level sitelinks exist. ─
const TARGETS = [
  { code: "FR", campaignId: 23844165759, campaignName: "[FR] Fanovera", lang: "fr", addSitelinks: false },
  { code: "CH", campaignId: 23882783997, campaignName: "[CH] Fanovera", lang: "fr", addSitelinks: true },
  { code: "ES", campaignId: 23899357675, campaignName: "[ES] Fanovera", lang: "es", addSitelinks: true },
  { code: "IT", campaignId: 23899365073, campaignName: "[IT] Fanovera", lang: "it", addSitelinks: true },
  { code: "UK", campaignId: 23844174192, campaignName: "[UK] Fanovera", lang: "en", addSitelinks: false },
  { code: "US", campaignId: 23883852621, campaignName: "[US] Fanovera", lang: "en", addSitelinks: true },
];

// ── Validate copy lengths + conflict guard up-front ──────────────────────────
for (const [lang, c] of Object.entries(LANG)) {
  for (const h of c.rsa.headlines) if (h.length > 30) { console.error(`[${lang}] headline too long (${h.length}): "${h}"`); process.exit(1); }
  for (const d of c.rsa.descriptions) if (d.length > 90) { console.error(`[${lang}] description too long (${d.length}): "${d}"`); process.exit(1); }
  for (const s of c.sitelinks) if (s.link_text.length > 25) { console.error(`[${lang}] sitelink too long (${s.link_text.length}): "${s.link_text}"`); process.exit(1); }
  const posSets = c.positives.map((k) => new Set(k.split(/\s+/)));
  for (const neg of c.broadNegatives) {
    const nw = neg.split(/\s+/);
    for (let i = 0; i < c.positives.length; i++) {
      if (nw.every((w) => posSets[i].has(w))) { console.error(`[${lang}] CONFLICT: BROAD negative "${neg}" blocks positive "${c.positives[i]}"`); process.exit(1); }
    }
  }
  // Whitehat guard: forbidden tokens must NOT appear in RSA copy
  const FORBIDDEN = /\b(buy|acheter|achat|comprar|comprare|cheap|baratos?|economic[io]|pas cher)\b/i;
  for (const t of [...c.rsa.headlines, ...c.rsa.descriptions])
    if (FORBIDDEN.test(t)) { console.error(`[${lang}] WHITEHAT VIOLATION in RSA copy: "${t}"`); process.exit(1); }
}

console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));

for (const t of TARGETS) {
  const c = LANG[t.lang];
  console.log(`\n${t.campaignName} (${t.campaignId}) — ad group "LinkedIn" [${t.lang}]`);
  console.log(`  positives (EXACT): ${c.positives.length}`);
  for (const k of c.positives) console.log(`    [EXACT] ${k}`);
  console.log(`  negatives: ${c.broadNegatives.length} BROAD${c.exactNegatives.length ? ` + ${c.exactNegatives.length} EXACT` : ""} (conflict guard PASSED)`);
  console.log(`  RSA (PAUSED): ${c.rsa.headlines.length} H / ${c.rsa.descriptions.length} D · final_url ${c.finalUrl}`);
  console.log(`  sitelinks: ${t.addSitelinks ? `${c.sitelinks.length} at ad-group level` : "inherited from campaign (none added)"}`);
}

if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }

// Submit criteria atomically; if Google rejects keyword(s) on policy grounds,
// DROP the rejected text(s) and retry (NO exemption requested — fragile account).
// Returns { created, skipped:[texts] }.
async function createCriteriaWithPolicyRetry(agResource, c) {
  const skipped = [];
  let positives = [...c.positives];
  let broadN = [...c.broadNegatives];
  let exactN = [...c.exactNegatives];
  for (;;) {
    const ops = [
      ...positives.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, keyword: { text, match_type: enums.KeywordMatchType.EXACT } })),
      ...broadN.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, negative: true, keyword: { text, match_type: enums.KeywordMatchType.BROAD } })),
      ...exactN.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, negative: true, keyword: { text, match_type: enums.KeywordMatchType.EXACT } })),
    ];
    try {
      for (let i = 0; i < ops.length; i += 100) await customer.adGroupCriteria.create(ops.slice(i, i + 100));
      return { created: ops.length, skipped };
    } catch (err) {
      const viol = (err?.errors || [])
        .filter((e) => e?.error_code?.policy_violation_error != null && e?.trigger?.string_value)
        .map((e) => e.trigger.string_value);
      if (viol.length === 0) throw err; // not a policy rejection → real failure
      for (const vt of viol) {
        if (!skipped.includes(vt)) skipped.push(vt);
        positives = positives.filter((t) => t !== vt);
        broadN = broadN.filter((t) => t !== vt);
        exactN = exactN.filter((t) => t !== vt);
      }
      console.log(`    ⚠ policy-rejected, dropped & retrying: ${viol.join(", ")}`);
    }
  }
}

console.log("\n" + "─".repeat(70) + "\nExecuting…");
const SKIPPED_ALL = [];
for (const t of TARGETS) {
  const c = LANG[t.lang];

  // anti-duplicate guard
  const existing = await customer.query(`
    SELECT ad_group.id, ad_group.name FROM ad_group
    WHERE campaign.id = ${t.campaignId} AND ad_group.name = 'LinkedIn' AND ad_group.status != 'REMOVED'
  `);
  if (existing.length > 0) { console.log(`\n[${t.code}] LinkedIn ad group already exists (${existing[0].ad_group.id}) — skipping.`); continue; }

  console.log(`\n[${t.code}] ${t.campaignName}`);
  const agRes = await customer.adGroups.create([{
    name: "LinkedIn",
    campaign: `customers/${CUSTOMER_ID}/campaigns/${t.campaignId}`,
    status: enums.AdGroupStatus.ENABLED,
    type: enums.AdGroupType.SEARCH_STANDARD,
    cpc_bid_micros: 10000,
  }]);
  const agResource = agRes.results[0].resource_name;
  console.log(`  ✓ ad group ${agResource.split("/").pop()}`);

  const { created, skipped } = await createCriteriaWithPolicyRetry(agResource, c);
  console.log(`  ✓ ${created} criteria${skipped.length ? ` (${skipped.length} skipped on policy)` : ""}`);
  if (skipped.length) SKIPPED_ALL.push(...skipped.map((kw) => `[${t.code}] ${kw}`));

  await customer.adGroupAds.create([{
    ad_group: agResource,
    status: enums.AdGroupAdStatus.PAUSED,
    ad: {
      final_urls: [c.finalUrl],
      responsive_search_ad: {
        headlines: c.rsa.headlines.map((text) => ({ text })),
        descriptions: c.rsa.descriptions.map((text) => ({ text })),
      },
    },
  }]);
  console.log(`  ✓ RSA (PAUSED)`);

  if (t.addSitelinks) {
    const slRes = await customer.assets.create(c.sitelinks.map((s) => ({ sitelink_asset: { link_text: s.link_text }, final_urls: s.final_urls })));
    await customer.adGroupAssets.create(slRes.results.map((r) => ({ ad_group: agResource, asset: r.resource_name, field_type: enums.AssetFieldType.SITELINK })));
    console.log(`  ✓ ${c.sitelinks.length} sitelinks`);
  } else {
    console.log(`  · sitelinks inherited from campaign (none added)`);
  }
}
console.log("\n✅ DONE. LinkedIn ad groups created (RSA PAUSED — enable after policy review).");
if (SKIPPED_ALL.length) {
  console.log(`\n⚠ ${SKIPPED_ALL.length} keyword(s) skipped on Google policy (NOT added, no exemption requested):`);
  for (const s of SKIPPED_ALL) console.log(`   - ${s}`);
}
