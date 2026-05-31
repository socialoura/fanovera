/**
 * Creates a "Twitch" ad group on the [ES] Fanovera and [IT] Fanovera campaigns.
 * Mirrors the UK Twitch structure (followers-focused EXACT keywords, whitehat
 * RSA about streamers/channel) adapted to Spanish and Italian.
 *
 * Campaign RSAs are created PAUSED for manual policy review (fragile account).
 * Whitehat: RSA copy has no "comprar/comprare"/quantities/"barato/economici".
 *
 * Skips a campaign if it already has a Twitch ad group (no duplicates).
 *
 * Usage:
 *   node scripts/create-twitch-es-it-ag.mjs          # dry-run
 *   node scripts/create-twitch-es-it-ag.mjs --live   # execute
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
      "comprar seguidores twitch",
      "comprar seguidores de twitch",
      "seguidores twitch comprar",
      "comprar followers twitch",
      "comprar 1000 seguidores twitch",
      "comprar 100 seguidores twitch",
      "comprar 500 seguidores twitch",
      "comprar 5000 seguidores twitch",
      "seguidores twitch baratos",
      "comprar seguidores twitch baratos",
      "seguidores twitch reales",
      "ganar seguidores twitch",
      "comprar seguidores para twitch",
      "mejor web para comprar seguidores twitch",
    ],
    broadNegatives: [
      "gratis", "gratuito", "hack", "hackear", "truco", "trucos", "bot", "bots",
      "generador", "falsos", "falso", "descargar", "apk", "foro", "reddit",
      "tutorial", "tutoriales", "trabajo", "agencia", "app", "aplicacion",
      "como conseguir", "como ganar gratis", "como tener", "como crecer",
      "que es", "por que", "iniciar sesion", "monetizar", "verificacion",
      // twitch product / non-service intent
      "twitch ads", "twitch prime", "twitch turbo", "twitch bits", "twitch studio",
      "twitch streamlabs", "descargar twitch", "como hacer directo", "como streamear",
      "afiliado twitch", "como ser afiliado", "twitch gratis",
      // competitor brands
      "famoid", "viralyft", "streamoz", "streamrise", "viewerlabs", "getviewers",
    ],
    exactNegatives: [
      "contador seguidores twitch",
      "seguidores twitch en vivo",
    ],
    rsa: {
      headlines: [
        "Resultados en 2 Minutos", "+8.000 Clientes Satisfechos", "Haz Crecer Tu Twitch",
        "El Precio Más Bajo", "Inicio Inmediato", "-5% con el Código FANO5",
        "Fanovera - Twitch", "Entrega Rápida y Fiable",
      ],
      descriptions: [
        "Más de 8.000 streamers. Crecimiento natural y progresivo, sin contraseña, pago seguro.",
        "Haz crecer tu canal de Twitch. Seguro, rápido y fiable. Garantía de 30 días.",
        "Promociona tu canal de Twitch. Código FANO5 para un 5% en tu primer pedido.",
        "Aumenta el alcance de tu directo. Pago seguro, sin contraseña, resultados rápidos.",
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
      "comprare follower twitch",
      "comprare follower su twitch",
      "follower twitch comprare",
      "comprare followers twitch",
      "comprare 1000 follower twitch",
      "comprare 100 follower twitch",
      "comprare 500 follower twitch",
      "comprare 5000 follower twitch",
      "follower twitch economici",
      "comprare follower twitch economici",
      "follower twitch reali",
      "aumentare follower twitch",
      "comprare seguaci twitch",
      "miglior sito per comprare follower twitch",
    ],
    broadNegatives: [
      "gratis", "gratuito", "gratuiti", "hack", "hackerare", "trucco", "trucchi",
      "bot", "bots", "generatore", "falsi", "falso", "scaricare", "apk", "forum",
      "reddit", "tutorial", "lavoro", "agenzia", "app", "applicazione",
      "come ottenere", "come avere", "come aumentare gratis", "come crescere",
      "cos'è", "perché", "accedi", "monetizzare", "verifica",
      // twitch product / non-service intent
      "twitch ads", "twitch prime", "twitch turbo", "twitch bits", "twitch studio",
      "twitch streamlabs", "scaricare twitch", "come fare live", "come streammare",
      "affiliato twitch", "come diventare affiliato", "twitch gratis",
      // competitor brands
      "famoid", "viralyft", "streamoz", "streamrise", "viewerlabs", "getviewers",
    ],
    exactNegatives: [
      "contatore follower twitch",
      "follower twitch in diretta",
    ],
    rsa: {
      headlines: [
        "Risultati in 2 Minuti", "+8.000 Clienti Soddisfatti", "Fai Crescere il Tuo Twitch",
        "Prezzo Più Basso", "Avvio Immediato", "-5% con il Codice FANO5",
        "Fanovera - Twitch", "Consegna Rapida e Sicura",
      ],
      descriptions: [
        "Più di 8.000 streamer. Crescita naturale e progressiva, senza password, pagamento sicuro.",
        "Fai crescere il tuo canale Twitch. Sicuro, veloce e affidabile. Garanzia 30 giorni.",
        "Promuovi il tuo canale Twitch con fiducia. Codice FANO5 per un 5% sul primo ordine.",
        "Aumenta la portata della tua diretta. Pagamento sicuro, senza password, risultati rapidi.",
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
  console.log(`\n${t.campaignName} (${t.campaignId}) — ad group "Twitch"`);
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
    WHERE campaign.id = ${t.campaignId} AND ad_group.name = 'Twitch' AND ad_group.status != 'REMOVED'
  `);
  if (existing.length > 0) { console.log(`\n[${loc}] Twitch ad group already exists (${existing[0].ad_group.id}) — skipping.`); continue; }

  console.log(`\n[${loc}] ${t.campaignName}`);
  const agRes = await customer.adGroups.create([{
    name: "Twitch",
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
console.log("\n✅ DONE. Twitch ad groups created (RSA PAUSED — enable after policy review).");
