# Google Ads — intégration ROAS réel

Sync nocturne des coûts Google Ads (par campagne, par jour) **croisée avec les commandes Stripe réelles** via le `gclid` de chaque clic. Permet d'afficher dans l'admin un ROAS basé sur le **revenu encaissé**, pas les conversions Google.

## Architecture

```
Google Ads API
   │  ├─ campaign + metrics (cost, clicks, conversions)
   │  └─ click_view (gclid → campaign_id)
   ▼
[cron quotidien /api/cron/sync-google-ads]  (4 h UTC)
   │
   ├─► ad_costs_by_campaign  (UPSERT 14 derniers jours)
   └─► gclid_campaign_map    (INSERT ON CONFLICT DO NOTHING, 30 derniers jours)

Landing  ──gclid en URL──▶  create-payment-intent  ──▶  checkout_payloads.gclid
                                                              │
Stripe webhook ──▶ orders (status = paid/processing/delivered)
                                                              │
                  /api/admin/ads-roas  ◀── JOIN orders ↔ checkout_payloads ↔ gclid_campaign_map ↔ ad_costs_by_campaign
                          │
                          ▼
                    AdsROASView (admin)
```

## Setup — checklist

### 1. Demander le Developer Token Google Ads (1-3 jours)

1. `ads.google.com` → **Tools & Settings → Setup → API Center**
2. Bouton **Apply for token**, niveau **Basic Access** (15 000 ops/jour, suffit largement)
3. Use case à mettre :

> Internal reporting tool for our own advertiser account. We sync cost, click, and conversion metrics into our own admin dashboard to compute true ROAS by joining with our Stripe order data.

> Important : il faut un Manager Account (MCC). Si t'as pas, en créer un (5 min, gratuit) et y lier ton compte Fanovera.

### 2. Créer un OAuth Client (Google Cloud Console)

1. `console.cloud.google.com` → créer ou sélectionner un projet
2. **APIs & Services → Library** → activer **Google Ads API**
3. **OAuth consent screen** : External, mode Testing, ajoute ton gmail comme test user
4. **Credentials → Create credentials → OAuth client ID** → type **Desktop app**
5. Note le `client_id` et `client_secret`

### 3. Variables d'env à renseigner

Dans `.env` local + Vercel project settings :

```env
GOOGLE_ADS_DEVELOPER_TOKEN=<reçu à l'étape 1>
GOOGLE_ADS_CLIENT_ID=<étape 2>
GOOGLE_ADS_CLIENT_SECRET=<étape 2>
GOOGLE_ADS_REFRESH_TOKEN=<voir étape 4>
GOOGLE_ADS_LOGIN_CUSTOMER_ID=<ID numérique de ton MCC, sans tirets>
GOOGLE_ADS_CUSTOMER_ID=<ID numérique du compte Fanovera, sans tirets>
CRON_SECRET=<un secret aléatoire long, partagé avec Vercel Cron>
```

### 4. Générer le refresh token

Une fois `GOOGLE_ADS_CLIENT_ID` + `GOOGLE_ADS_CLIENT_SECRET` dans `.env` :

```bash
node scripts/google-ads-oauth-bootstrap.mjs
```

Ça ouvre le browser → tu te logues avec le compte Google qui possède le MCC → callback localhost:8765 → le refresh token s'affiche dans le terminal. Le copier dans `GOOGLE_ADS_REFRESH_TOKEN`.

### 5. Installer la dépendance npm

```bash
npm i google-ads-api
```

> Le code est conçu pour fail-soft : si la lib n'est pas installée OU si une env var manque, le cron ne crashe pas, il log un warning et renvoie `{ ok: true, skipped: true }`.

### 6. Premier sync manuel

```bash
curl -X POST "https://fanovera.com/api/cron/sync-google-ads?secret=$CRON_SECRET"
```

Réponse attendue :
```json
{
  "ok": true,
  "costs":  { "fetched": 42, "upserted": 42 },
  "gclids": { "fetched": 312, "inserted": 312 },
  "tookMs": 1820
}
```

Puis ouvre `/admin → Ads ROAS`.

## Comment lire les chiffres

- **ROAS** = `revenu encaissé Stripe / dépense Google Ads`
  - 🟢 ≥ 3× : campagne profitable
  - 🟡 1-3× : break-even, à itérer
  - 🔴 < 1× : tu perds de l'argent
- **CPA réel** = `dépense / commandes vraiment encaissées` (pas les conversions Google, qui sont du déclaratif)
- **CVR** = `commandes / clics` (pas `commandes / vue de page`)

## Pourquoi le ROAS Google diffère du ROAS réel

Google compte une conversion dès que le pixel `purchase` fire côté front. Le ROAS réel ne compte que les paiements Stripe avec `status IN ('paid', 'processing', 'delivered')`, donc :

- Les refunds passent la commande en `refunded` → exclus du revenu
- Les `partial` ou `canceled` SMM → exclus
- Les paiements 3DS échoués mais comptés côté front comme conversion → exclus

C'est ça l'intérêt du croisement : **tu vois la vérité du compte en banque**, pas la promesse du pixel.

## Diagnostic — si les ROAS ressortent à 0

Trois causes possibles, visibles en bas de l'admin Ads ROAS :

1. **`checkoutWithGclid` = 0** → les URLs Google Ads n'ont pas le suffixe `?gclid={gclid}`. Vérifie que **Auto-tagging** est ON dans Google Ads (Settings → Account → Auto-tagging).
2. **`gclidMapSize` faible** → le cron `sync-google-ads` n'a pas tourné, ou n'a pas accès à `click_view`. Check les logs Vercel.
3. **`gclidMapSize` OK mais 0 commande matchée** → les commandes existent dans `orders` mais leur `checkout_payloads.gclid` est vide. Probablement un check-out depuis une session organique (pas un clic ad).

## Fenêtre temporelle

- `ad_costs_by_campaign` : re-syncé sur 14 jours glissants (Google ajuste les conversions ~14 jours rétroactivement)
- `gclid_campaign_map` : 30 jours glissants en insertion (gclid est immutable, donc INSERT ON CONFLICT DO NOTHING)
- `click_view` Google Ads est limité à 90 jours par l'API → impossible de récupérer plus loin
