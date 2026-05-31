/**
 * Creates a "Twitter" ad group on the [ES] Fanovera and [IT] Fanovera campaigns.
 * Mirrors the FR Twitter / ES-IT Twitch structure: transactional EXACT keywords
 * (followers/seguidores/follower on Twitter + X), whitehat RSA about growing
 * your X / Twitter profile.
 *
 * Campaign RSAs are created PAUSED for manual policy review (fragile account).
 * Whitehat: RSA copy has NO "comprar/comprare"/quantities/"baratos/economici".
 * (Those terms live only in the KEYWORDS — the search intent we bid on.)
 *
 * Skips a campaign if it already has a Twitter ad group (no duplicates).
 *
 * Usage:
 *   node scripts/create-twitter-es-it-ag.mjs          # dry-run
 *   node scripts/create-twitter-es-it-ag.mjs --live   # execute
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

const TARGETS = {
  es: {
    campaignId: 23899357675,
    campaignName: "[ES] Fanovera",
    finalUrl: "https://www.fanovera.com/promo?lang=es",
    positives: [
      "comprar seguidores twitter",
      "comprar seguidores de twitter",
      "seguidores twitter comprar",
      "comprar followers twitter",
      "comprar 1000 seguidores twitter",
      "comprar 100 seguidores twitter",
      "comprar 500 seguidores twitter",
      "comprar 5000 seguidores twitter",
      "seguidores twitter baratos",
      "comprar seguidores twitter baratos",
      "seguidores twitter reales",
      "comprar seguidores twitter españa",
      "comprar seguidores x",
      "comprar followers x",
      "seguidores x baratos",
      "mejor web para comprar seguidores twitter",
    ],
    broadNegatives: [
      "gratis", "gratuito", "hack", "hackear", "truco", "trucos", "bot", "bots",
      "generador", "falsos", "falso", "descargar", "apk", "foro", "reddit",
      "tutorial", "tutoriales", "trabajo", "agencia", "aplicacion",
      "como conseguir", "como ganar gratis", "como tener", "como crecer",
      "que es", "por que", "monetizar", "verificacion",
      // twitter/X product / non-service intent
      "twitter ads", "twitter blue", "x premium", "twitter pro", "twitter business",
      "crear cuenta twitter", "eliminar twitter", "iniciar sesion twitter",
      "descargar twitter", "tweetdeck", "como usar twitter", "que es twitter",
      "twitter gratis", "verificar twitter",
      // competitor brands
      "famoid", "viralyft", "twesocial", "media mister", "useviral", "buzzoid",
    ],
    exactNegatives: [
      "contador seguidores twitter",
      "seguidores twitter en vivo",
    ],
    rsa: {
      headlines: [
        "Resultados en 2 Minutos", "+8.000 Clientes Satisfechos", "Haz Crecer Tu Twitter",
        "El Precio Más Bajo", "Inicio Inmediato", "-5% con el Código FANO5",
        "Fanovera - X / Twitter", "Entrega Rápida y Fiable",
      ],
      descriptions: [
        "Más de 8.000 clientes. Crecimiento natural y progresivo, sin contraseña, pago seguro.",
        "Haz crecer tu perfil de X / Twitter. Seguro, rápido y fiable. Garantía de 30 días.",
        "Promociona tu cuenta de X / Twitter. Código FANO5 para un 5% en tu primer pedido.",
        "Aumenta tu alcance en X / Twitter. Pago seguro, sin contraseña, resultados rápidos.",
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
    campaignId: 23899365073,
    campaignName: "[IT] Fanovera",
    finalUrl: "https://www.fanovera.com/promo?lang=it",
    positives: [
      "comprare follower twitter",
      "comprare follower su twitter",
      "follower twitter comprare",
      "comprare followers twitter",
      "comprare 1000 follower twitter",
      "comprare 100 follower twitter",
      "comprare 500 follower twitter",
      "comprare 5000 follower twitter",
      "follower twitter economici",
      "comprare follower twitter economici",
      "follower twitter reali",
      "aumentare follower twitter",
      "comprare follower x",
      "comprare follower su x",
      "follower x economici",
      "miglior sito per comprare follower twitter",
    ],
    broadNegatives: [
      "gratis", "gratuito", "gratuiti", "hack", "hackerare", "trucco", "trucchi",
      "bot", "bots", "generatore", "falsi", "falso", "scaricare", "apk", "forum",
      "reddit", "tutorial", "lavoro", "agenzia", "applicazione",
      "come ottenere", "come avere", "come aumentare gratis", "come crescere",
      "cos'è", "perché", "monetizzare", "verifica",
      // twitter/X product / non-service intent
      "twitter ads", "twitter blue", "x premium", "twitter pro", "twitter business",
      "creare account twitter", "eliminare twitter", "accedere twitter",
      "scaricare twitter", "tweetdeck", "come usare twitter", "cos'è twitter",
      "twitter gratis", "verificare twitter",
      // competitor brands
      "famoid", "viralyft", "twesocial", "media mister", "useviral", "buzzoid",
    ],
    exactNegatives: [
      "contatore follower twitter",
      "follower twitter in diretta",
    ],
    rsa: {
      headlines: [
        "Risultati in 2 Minuti", "+8.000 Clienti Soddisfatti", "Fai Crescere il Tuo Twitter",
        "Prezzo Più Basso", "Avvio Immediato", "-5% con il Codice FANO5",
        "Fanovera - X / Twitter", "Consegna Rapida e Sicura",
      ],
      descriptions: [
        "Più di 8.000 clienti. Crescita naturale e progressiva, senza password, pagamento sicuro.",
        "Fai crescere il tuo profilo X / Twitter. Sicuro, veloce e affidabile. Garanzia 30 giorni.",
        "Promuovi il tuo profilo X / Twitter. Codice FANO5 per un 5% sul primo ordine.",
        "Aumenta la tua portata su X. Pagamento sicuro, senza password, risultati rapidi.",
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
};

// ── Validate every locale config up-front (lengths + conflict guard)
for (const [loc, t] of Object.entries(TARGETS)) {
  for (const h of t.rsa.headlines) if (h.length > 30) { console.error(`[${loc}] headline too long (${h.length}): "${h}"`); process.exit(1); }
  for (const d of t.rsa.descriptions) if (d.length > 90) { console.error(`[${loc}] description too long (${d.length}): "${d}"`); process.exit(1); }
  for (const s of t.sitelinks) if (s.link_text.length > 25) { console.error(`[${loc}] sitelink too long (${s.link_text.length}): "${s.link_text}"`); process.exit(1); }
  const posSets = t.positives.map((k) => new Set(k.split(/\s+/)));
  for (const neg of t.broadNegatives) {
    const nw = neg.split(/\s+/);
    for (let i = 0; i < t.positives.length; i++) {
      if (nw.every((w) => posSets[i].has(w))) { console.error(`[${loc}] CONFLICT: BROAD negative "${neg}" blocks positive "${t.positives[i]}"`); process.exit(1); }
    }
  }
}

console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));

for (const [loc, t] of Object.entries(TARGETS)) {
  console.log(`\n${t.campaignName} (${t.campaignId}) — ad group "Twitter"`);
  console.log(`  positives (EXACT): ${t.positives.length}`);
  for (const k of t.positives) console.log(`    [EXACT] ${k}`);
  console.log(`  negatives: ${t.broadNegatives.length} BROAD + ${t.exactNegatives.length} EXACT (conflict guard PASSED)`);
  console.log(`  RSA (PAUSED): ${t.rsa.headlines.length} H / ${t.rsa.descriptions.length} D · final_url ${t.finalUrl}`);
  for (const h of t.rsa.headlines) console.log(`    H(${h.length}): ${h}`);
  for (const d of t.rsa.descriptions) console.log(`    D(${d.length}): ${d}`);
  console.log(`  sitelinks: ${t.sitelinks.length}`);
}

if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }

console.log("\n" + "─".repeat(70) + "\nExecuting…");
for (const [loc, t] of Object.entries(TARGETS)) {
  // anti-duplicate guard
  const existing = await customer.query(`
    SELECT ad_group.id, ad_group.name FROM ad_group
    WHERE campaign.id = ${t.campaignId} AND ad_group.name = 'Twitter' AND ad_group.status != 'REMOVED'
  `);
  if (existing.length > 0) { console.log(`\n[${loc}] Twitter ad group already exists (${existing[0].ad_group.id}) — skipping.`); continue; }

  console.log(`\n[${loc}] ${t.campaignName}`);
  const agRes = await customer.adGroups.create([{
    name: "Twitter",
    campaign: `customers/${CUSTOMER_ID}/campaigns/${t.campaignId}`,
    status: enums.AdGroupStatus.ENABLED,
    type: enums.AdGroupType.SEARCH_STANDARD,
    cpc_bid_micros: 10000,
  }]);
  const agResource = agRes.results[0].resource_name;
  console.log(`  ✓ ad group ${agResource.split("/").pop()}`);

  const criteriaOps = [
    ...t.positives.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, keyword: { text, match_type: enums.KeywordMatchType.EXACT } })),
    ...t.broadNegatives.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, negative: true, keyword: { text, match_type: enums.KeywordMatchType.BROAD } })),
    ...t.exactNegatives.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, negative: true, keyword: { text, match_type: enums.KeywordMatchType.EXACT } })),
  ];
  for (let i = 0; i < criteriaOps.length; i += 100) await customer.adGroupCriteria.create(criteriaOps.slice(i, i + 100));
  console.log(`  ✓ ${criteriaOps.length} criteria`);

  await customer.adGroupAds.create([{
    ad_group: agResource,
    status: enums.AdGroupAdStatus.PAUSED,
    ad: {
      final_urls: [t.finalUrl],
      responsive_search_ad: {
        headlines: t.rsa.headlines.map((text) => ({ text })),
        descriptions: t.rsa.descriptions.map((text) => ({ text })),
      },
    },
  }]);
  console.log(`  ✓ RSA (PAUSED)`);

  const slRes = await customer.assets.create(t.sitelinks.map((s) => ({ sitelink_asset: { link_text: s.link_text }, final_urls: s.final_urls })));
  await customer.adGroupAssets.create(slRes.results.map((r) => ({ ad_group: agResource, asset: r.resource_name, field_type: enums.AssetFieldType.SITELINK })));
  console.log(`  ✓ ${t.sitelinks.length} sitelinks`);
}
console.log("\n✅ DONE. Twitter ad groups created (RSA PAUSED — enable after policy review).");
