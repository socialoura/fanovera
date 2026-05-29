# Attribution LTV par mot-clé (exact)

Pipeline qui relie le **coût par mot-clé** Google Ads au **revenu LTV réel** d'un
client, en first-touch : le client est épinglé au mot-clé de sa 1ère commande
taggée, et **toutes** ses commandes (test à 3 €, gros pack 10 min après,
recommandes ultérieures sans gclid) remontent à ce mot-clé. Plus d'approximation
au prorata comme la vue search-term — ici c'est **exact**.

## Les 7 couches modifiées

| Couche     | Fichier                          | Changement                                                                      |
|------------|----------------------------------|---------------------------------------------------------------------------------|
| Capture    | `app/lib/analytics.ts`           | Lit `kw` + `mt` dans l'URL (`currentAttributionProperties`)                      |
| Validation | `app/api/create-payment-intent/route.ts` | `kw`/`mt` dans `ATTRIBUTION_KEYS` → passés à `saveCheckoutPayload`       |
| Stockage   | `app/lib/db.ts`                  | Colonnes `keyword`/`match_type` sur `checkout_payloads` + table `ad_costs_by_keyword` |
| Coût       | `app/lib/googleAdsClient.ts`     | `fetchKeywordCosts()` requête `keyword_view`                                     |
| Sync       | `app/api/cron/sync-google-ads/route.ts` | `syncKeywordCosts()` branché dans le cron quotidien                       |
| API        | `app/api/admin/ads-roas/route.ts` | `queryByKeyword()` — LTV first-touch, jointure sur le **texte** du mot-clé      |
| UI         | `app/admin/components/views/AdsROASView.tsx` | Bouton granularité « Mot-clé » + rendu                              |

## Comment la donnée circule

```
Annonce Google Ads (Final URL suffix kw={keyword}&mt={matchtype})
   │  clic
   ▼
URL site → analytics.ts lit kw/mt
   │  checkout
   ▼
create-payment-intent → saveCheckoutPayload → checkout_payloads.keyword / match_type
   │  paiement confirmé
   ▼
orders (lié via stripe_payment_intent_id)
   │
   ▼  REVENU : queryByKeyword épingle le client au keyword de sa 1ère commande
            taggée, somme toutes ses commandes (LTV)
   ▼  COÛT  : ad_costs_by_keyword (cron → keyword_view)
   ▼
ads-roas?groupBy=keyword → vue AdsROAS « Mot-clé »
```

## ⚠️ Étape manuelle obligatoire (sinon zéro revenu côté keyword)

Dans **Google Ads → Paramètres → Suivi → Suffixe d'URL finale** (niveau compte,
ou par campagne) :

```
kw={keyword}&mt={matchtype}
```

Tant que ce n'est pas posé, `checkout_payloads.keyword` reste vide et la vue
« Mot-clé » affiche du coût sans revenu. Le diagnostic en bas de la vue le dit :
**« N checkouts avec mot-clé »** — si 0, le suffixe n'est pas en place.

C'est du Final URL suffix technique pur → **whitehat-safe**, aucun risque
d'audit (rien à voir avec un promo code dans l'URL).

> Garde ton suffixe UTM existant en plus :
> `utm_source=google&utm_medium=cpc&utm_campaign={campaignname}&utm_content={adgroupname}&utm_term={keyword}&kw={keyword}&mt={matchtype}`
> Le code lit `kw`, pas `utm_term` — les deux coexistent (UTM pour le reporting,
> `kw` pour l'attribution LTV).

## Deux nuances honnêtes

1. **Texte du mot-clé, pas search term réel.** `{keyword}` te donne le mot-clé
   *matché* (« abonnés instagram »), pas la requête tapée. La vue **search-term**
   proportionnelle existante (`/api/admin/search-terms`) reste utile en
   complément pour repérer les négatifs (vraies requêtes).
2. **Jointure sur le texte seul, pas le match type.** ValueTrack renvoie
   `e`/`p`/`b` alors que l'API renvoie `EXACT`/`PHRASE`/`BROAD` — la jointure se
   fait volontairement sur le texte pour éviter une normalisation fragile. Le
   `mt` est stocké et affiché, mais pas dans la clé. Si un même texte existe en
   exact ET broad, leurs coûts sont agrégés ensemble.

## Le meilleur moyen d'analyser les résultats

Tout est dans l'admin → vue **ROAS Google Ads**, granularité **Mot-clé**.

1. **Fie-toi au ROAS réel (LTV), pas aux conversions Google.** La colonne ROAS =
   revenu net LTV attribué / dépense. Code couleur : vert ≥ 3×, jaune 1–3×,
   rouge < 1×. Les « conversions Google » sont là pour comparaison mais
   sous-comptent les recommandes.
2. **Trie par Dépense d'abord**, repère les mots-clés qui brûlent du budget avec
   ROAS rouge → candidats à mettre en négatif ou baisser l'enchère. Puis trie par
   ROAS pour identifier les gagnants à pousser.
3. **CPA vs baseline Fanovaly** : la vue affiche automatiquement le delta vs
   l'ancien compte (FR 7,68 € / EN 4,58 €). En dessous = on progresse.
4. **Sur campagnes jeunes, regarde les cohortes** (`/api/admin/ads-cohorts`,
   D7/D30/D90) avant de juger : un client SMM rachète, donc un ROAS D7 à 1×
   finit quasi toujours > 3× à D90. Ne coupe pas un mot-clé sur son ROAS J0.
5. **Niveau de décision** : à faible volume, pilote surtout au **groupe
   d'annonces** + cohortes ; le mot-clé exact est du raffinement pour arbitrer
   *dans* un ad group rentable. Ne sur-optimise pas un keyword avec 3 clics.
6. **Toujours vérifier le diagnostic** en bas : si « N checkouts avec mot-clé »
   est faible/0, l'attribution keyword n'est pas représentative (suffixe absent
   ou récent) → reste sur campagne/ad group le temps que la data s'accumule.

## Migrations & déploiement

Colonnes et table se créent seules via `ADD COLUMN IF NOT EXISTS` /
`CREATE TABLE IF NOT EXISTS` au prochain `initDb()` (lancé via
`npx tsx --env-file=.env.local scripts/init-db.ts` ou l'endpoint `/api/init-db`)
et à chaque `saveCheckoutPayload`. Rien à migrer à la main.

Backfill immédiat du coût keyword sans attendre le cron :
`node scripts/seed-keyword-costs.mjs [jours]` (tire les vraies données de
`keyword_view`). ⚠️ Nécessite un `GOOGLE_ADS_REFRESH_TOKEN` valide — un
`invalid_grant` signale un token OAuth expiré (ce qui bloque aussi le cron de
prod sur **toutes** les granularités).
