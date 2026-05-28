# Google Ads — Playbook ad groups par script

Comment créer / modifier des ad groups, keywords, RSAs, sitelinks et assets PRICE via l'API Google Ads. Tiré de la session du 2026-05-27 (création de l'AG `Twitter` sur `[FR] Fanovera`).

---

## Setup

Tout est déjà en place :

- **Package** : `google-ads-api` (déjà dans `package.json`)
- **Env vars** (`.env.local`) :
  - `GOOGLE_ADS_DEVELOPER_TOKEN`
  - `GOOGLE_ADS_CLIENT_ID` / `GOOGLE_ADS_CLIENT_SECRET` / `GOOGLE_ADS_REFRESH_TOKEN`
  - `GOOGLE_ADS_LOGIN_CUSTOMER_ID` (MCC Fanovera Manager `5233587470`)
  - `GOOGLE_ADS_CUSTOMER_ID` (compte enfant Cartoonova `7881570874`)
- **Developer Token** : Basic Access approuvé → mutations OK

---

## Boilerplate script

```js
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

const LIVE = process.argv.includes("--live");
const CUSTOMER_ID = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");

const { GoogleAdsApi, enums } = await import("google-ads-api");
const client = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: CUSTOMER_ID,
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});
```

**Toujours coder `--live` flag**. Dry-run par défaut → preview JSON avant exécution.

---

## Workflow recommandé

1. **Lire la structure existante** d'un AG voisin (même langue/intent) pour calquer le style
2. **Drafter le mapping** avec l'utilisateur (keywords, RSA, sitelinks, prix)
3. **Dry-run** : print la spec, jamais d'appel mutation
4. **Live** : `node scripts/xxx.mjs --live`
5. **Vérifier dans l'UI Google Ads** : `https://ads.google.com/aw/adgroups?...&campaignId=<id>`

---

## Read patterns (GAQL)

### Lister campagnes + ad groups
```js
const ags = await customer.query(`
  SELECT campaign.id, campaign.name, ad_group.id, ad_group.name, ad_group.status
  FROM ad_group
  WHERE campaign.status != 'REMOVED' AND ad_group.status != 'REMOVED'
`);
```

### Keywords (positifs + négatifs)
```js
const kws = await customer.query(`
  SELECT ad_group_criterion.criterion_id,
         ad_group_criterion.negative,
         ad_group_criterion.keyword.text,
         ad_group_criterion.keyword.match_type
  FROM ad_group_criterion
  WHERE ad_group.id = ${AG_ID}
    AND ad_group_criterion.type = 'KEYWORD'
    AND ad_group_criterion.status != 'REMOVED'
`);
```

### RSAs
```js
const ads = await customer.query(`
  SELECT ad_group_ad.ad.id, ad_group_ad.status,
         ad_group_ad.ad.final_urls,
         ad_group_ad.ad.responsive_search_ad.headlines,
         ad_group_ad.ad.responsive_search_ad.descriptions
  FROM ad_group_ad
  WHERE ad_group.id = ${AG_ID} AND ad_group_ad.status != 'REMOVED'
`);
```

### Sitelinks (3 niveaux : account / campaign / ad_group — ad_group override le reste)
```js
// Campaign-level
const camp = await customer.query(`
  SELECT campaign.id,
         campaign_asset.asset, campaign_asset.field_type,
         asset.sitelink_asset.link_text, asset.final_urls
  FROM campaign_asset
  WHERE campaign.id = ${CAMP_ID} AND campaign_asset.field_type = 'SITELINK'
`);

// Account-level
const acct = await customer.query(`
  SELECT customer_asset.asset, asset.sitelink_asset.link_text, asset.final_urls
  FROM customer_asset
  WHERE customer_asset.field_type = 'SITELINK'
`);
```

### Price assets
```js
const prices = await customer.query(`
  SELECT campaign.id, campaign_asset.asset,
         asset.price_asset.type, asset.price_asset.price_qualifier,
         asset.price_asset.language_code, asset.price_asset.price_offerings
  FROM campaign_asset
  WHERE campaign.id = ${CAMP_ID} AND campaign_asset.field_type = 'PRICE'
`);
```

**Quirk** : si tu filtres `WHERE campaign.id = X`, tu dois inclure `campaign.id` dans le SELECT. Sinon erreur `query_error=16`.

---

## Create patterns

### Ad group

```js
const adGroupRes = await customer.adGroups.create([{
  name: "Twitter",
  campaign: `customers/${CUSTOMER_ID}/campaigns/${CAMP_ID}`,
  status: enums.AdGroupStatus.ENABLED,
  type: enums.AdGroupType.SEARCH_STANDARD,
  cpc_bid_micros: 10000, // 0.01 EUR
}]);
const adGroupResource = adGroupRes.results[0].resource_name;
```

### Keywords (positifs + négatifs)

```js
// Batch en chunks de 100 max
await customer.adGroupCriteria.create(
  keywords.map((k) => ({
    ad_group: adGroupResource,
    status: enums.AdGroupCriterionStatus.ENABLED,
    negative: false, // ou true pour négatif
    keyword: { text: k.text, match_type: enums.KeywordMatchType.EXACT },
  })),
);
```

**Match types** : `EXACT=2`, `PHRASE=3`, `BROAD=4` (enum google-ads-api).

**Règle** : positifs souvent EXACT ou PHRASE. Négatifs **toujours BROAD** (sinon ne bloquent que le mot exact, raté sur les variantes).

### RSA (toujours PAUSED pour review Google)

```js
await customer.adGroupAds.create([{
  ad_group: adGroupResource,
  status: enums.AdGroupAdStatus.PAUSED, // user active manuellement après review
  ad: {
    final_urls: ["https://www.fanovera.com/promo?lang=fr"],
    responsive_search_ad: {
      headlines: [{ text: "..." }, ...], // max 15, chacun ≤ 30 chars
      descriptions: [{ text: "..." }, ...], // max 4, chacun ≤ 90 chars
    },
  },
}]);
```

**Sanity-check avant l'appel** :
```js
for (const h of headlines) if (h.text.length > 30) throw new Error(`Headline trop long: ${h.text}`);
for (const d of descriptions) if (d.text.length > 90) throw new Error(`Description trop long: ${d.text}`);
```

### Sitelinks (asset + attach)

```js
// 1. Créer les assets
const assetRes = await customer.assets.create(
  sitelinks.map((s) => ({
    sitelink_asset: { link_text: s.link_text },
    final_urls: s.final_urls, // PLURAL ici (oui c'est incohérent avec price, voir gotcha)
  })),
);

// 2. Attacher au AG
await customer.adGroupAssets.create(
  assetRes.results.map((r) => ({
    ad_group: adGroupResource,
    asset: r.resource_name,
    field_type: enums.AssetFieldType.SITELINK,
  })),
);
```

### Price asset

```js
const assetRes = await customer.assets.create([{
  price_asset: {
    type: enums.PriceExtensionType.BRANDS,
    price_qualifier: enums.PriceExtensionPriceQualifier.FROM,
    language_code: "fr",
    price_offerings: [
      {
        header: "Pack de 100",       // ≤ 25 chars
        description: "Le Moins Cher", // ≤ 25 chars
        final_url: "https://...",     // SINGULIER ici, pas final_urls (voir gotcha)
        price: { amount_micros: 3_500_000, currency_code: "EUR" },
        unit: enums.PriceExtensionPriceUnit.UNSPECIFIED,
      },
      // ...
    ],
  },
}]);

await customer.adGroupAssets.create([{
  ad_group: adGroupResource,
  asset: assetRes.results[0].resource_name,
  field_type: enums.AssetFieldType.PRICE,
}]);
```

---

## Modify patterns

### Changer le match type d'un keyword
Google **n'autorise pas** l'update de `match_type` sur un criterion existant → **remove + recreate**.

```js
// 1. Récupérer les resource_names
const rows = await customer.query(`
  SELECT ad_group_criterion.resource_name
  FROM ad_group_criterion
  WHERE ad_group.id = ${AG_ID} AND ad_group_criterion.negative = FALSE
`);
// 2. Remove
await customer.adGroupCriteria.remove(rows.map((r) => r.ad_group_criterion.resource_name));
// 3. Re-create with new match_type
await customer.adGroupCriteria.create(...);
```

---

## Gotchas (= erreurs rencontrées en vrai)

| Erreur API | Cause | Fix |
|---|---|---|
| `query_error=16 — field must be present in SELECT` | `WHERE campaign.id = X` sans `campaign.id` dans SELECT | Ajouter `campaign.id` au SELECT |
| `click_view_error=2 — must filter to one day` | `WHERE segments.date DURING LAST_N_DAYS` sur `click_view` | Loop jour par jour avec `WHERE segments.date = 'YYYY-MM-DD'` |
| `DURING LAST_90_DAYS` retourne silencieusement vide | `LAST_N_DAYS` n'accepte QUE certaines constantes : 7, 14, 30. PAS 90. | Utiliser `BETWEEN '...' AND '...'` ou rester sur 30 |
| `field_error=2 — final_url required` sur price | `final_urls` plural rejeté pour `price_offerings` | Utiliser `final_url` **singulier** sur price offerings (alors que sitelinks et ads utilisent `final_urls` plural) |
| `string_length_error=3 — Too long` sur headline | Headline > 30 chars | Compter avant l'envoi ; descriptions = 90 chars |
| Table `ad_costs_by_search_term` n'existe pas | `initDb()` jamais appelé en prod | Hit `/api/init-db` avec `ALLOW_INIT_DB=1` en env, OU créer la table en direct via script Neon |

---

## Précédence des assets (à savoir avant de créer)

Pour sitelinks et price : **ad_group override campaign override account**. Pas additif.

→ Si tu attaches 6 sitelinks AG-level, l'AG perd les 4 campaign + 2 account hérités. Donc inclus dans tes 6 ce que tu veux garder.

---

## Safety pattern

1. **AG = ENABLED, RSA = PAUSED** → Google review l'ad pendant que toi tu vérifies. Pas d'impression tant que la RSA est PAUSED, même si l'AG tourne.
2. **Pas de rollback automatique** : Google Ads ne supporte pas les transactions. Si un appel sur 5 fail, les 4 précédents sont déjà commit. Toujours dry-run d'abord.
3. **Continuation script** si fail au milieu : script séparé qui pick up depuis le dernier resource_name créé.

---

## Scripts références (créés le 2026-05-27, dans `scripts/`)

| Script | Rôle |
|---|---|
| `read-twitter-ag-en.mjs` | Lire structure complète d'un AG (keywords, RSA, settings) |
| `read-fr-ag.mjs` | Lire plusieurs AGs en batch |
| `read-fr-sitelinks.mjs` | Lire sitelinks aux 3 niveaux (account/campaign/ad_group) |
| `read-price-assets.mjs` | Lire price assets aux 3 niveaux |
| `create-twitter-fr-ag.mjs` | Création complète AG (AG + criteria + RSA + sitelinks) avec `--live` |
| `finish-twitter-fr-ag.mjs` | Continuation après fail partiel |
| `convert-twitter-fr-to-exact.mjs` | Pattern remove + recreate pour changer match type |
| `create-twitter-price-asset.mjs` | Création + attach d'un price asset AG-level |

Tous sont des one-shots — pas designed pour réutilisation directe, mais leurs patterns sont copiables.

---

## Limites observées

- **Pas d'API pour les "close variants"** : EXACT match inclut quand même les variantes proches (pluriels, fautes, etc.). Si trop de variantes indésirables, faut les ajouter en négatifs au cas par cas (via le rapport Search Terms admin).
- **Aucune attribution gclid → search_term** : Google ne fournit pas ce mapping. Le revenue par search term est forcément approximé (proportion du coût de l'AG).
- **MetadataLookupWarning** au runtime : warning Google Cloud SDK qui essaie de fetch des credentials GCE inexistants en local — **ignorer**, aucun impact.
