# Google Ads — Pays ciblés (test IG Followers / YouTube Views)

Budget test : 20€ · Annonces en **anglais** (whitehat) · 2 campagnes (IG Followers, YouTube Views)

> ⚠️ Annonces en anglais affichées sur 30 pays dont beaucoup non-anglophones.
> La colonne **Langue locale** indique où l'annonce EN risque un CTR faible / Quality Score bas.

## Tier 1

| # | Pays | Code | Langue locale | Annonce EN pertinente |
|---|------|------|---------------|----------------------|
| 1 | 🇺🇸 États-Unis | US | EN | ✅ |
| 2 | 🇬🇧 Royaume-Uni | GB | EN | ✅ |
| 3 | 🇨🇦 Canada | CA | EN/FR | ✅ |
| 4 | 🇦🇺 Australie | AU | EN | ✅ |
| 5 | 🇳🇿 Nouvelle-Zélande | NZ | EN | ✅ |
| 6 | 🇮🇪 Irlande | IE | EN | ✅ |
| 7 | 🇩🇪 Allemagne | DE | DE | ⚠️ moyen |
| 8 | 🇫🇷 France | FR | FR | ⚠️ faible |
| 9 | 🇳🇱 Pays-Bas | NL | NL | ✅ (EN très répandu) |
| 10 | 🇧🇪 Belgique | BE | NL/FR | ⚠️ moyen |
| 11 | 🇨🇭 Suisse | CH | DE/FR/IT | ⚠️ moyen |
| 12 | 🇦🇹 Autriche | AT | DE | ⚠️ moyen |
| 13 | 🇱🇺 Luxembourg | LU | FR/DE | ⚠️ moyen |
| 14 | 🇸🇪 Suède | SE | SV | ✅ (EN très répandu) |
| 15 | 🇳🇴 Norvège | NO | NO | ✅ (EN très répandu) |
| 16 | 🇩🇰 Danemark | DK | DA | ✅ (EN très répandu) |
| 17 | 🇫🇮 Finlande | FI | FI | ✅ (EN répandu) |

## Tier 2

| # | Pays | Code | Langue locale | Annonce EN pertinente |
|---|------|------|---------------|----------------------|
| 18 | 🇪🇸 Espagne | ES | ES | ⚠️ faible |
| 19 | 🇮🇹 Italie | IT | IT | ⚠️ faible |
| 20 | 🇵🇹 Portugal | PT | PT | ⚠️ moyen |
| 21 | 🇬🇷 Grèce | GR | EL | ⚠️ moyen |
| 22 | 🇵🇱 Pologne | PL | PL | ⚠️ moyen |
| 23 | 🇨🇿 Tchéquie | CZ | CS | ⚠️ moyen |
| 24 | 🇭🇺 Hongrie | HU | HU | ⚠️ faible |
| 25 | 🇷🇴 Roumanie | RO | RO | ⚠️ moyen |
| 26 | 🇸🇰 Slovaquie | SK | SK | ⚠️ moyen |
| 27 | 🇸🇮 Slovénie | SI | SL | ⚠️ moyen |
| 28 | 🇧🇷 Brésil | BR | PT | ⚠️ faible |
| 29 | 🇲🇽 Mexique | MX | ES | ⚠️ faible |
| 30 | 🇹🇷 Turquie | TR | TR | ⚠️ faible |

> ❌ **Retirés du test** : 🇦🇷 Argentine · 🇨🇱 Chili · 🇨🇴 Colombie.
> Triple friction = clics payés mais quasi aucune vente : prix affichés en **EUR** (peso non supporté),
> panier ressenti comme cher (pouvoir d'achat plus faible), et **déclins carte** élevés (paiement carte uniquement).
> Ils pollueraient le signal du test sans rien apporter.

## Codes pays (copier-coller Google Ads API / éditeur)

```
US, GB, CA, AU, NZ, IE, DE, FR, NL, BE, CH, AT, LU, SE, NO, DK, FI,
ES, IT, PT, GR, PL, CZ, HU, RO, SK, SI, BR, MX, TR
```

**Total : 30 pays**

---

## Notes

- **Risque dilution** : 20€ ≈ 15-25 clics répartis sur 30 pays → signal de rentabilité quasi illisible. Ce test mesure surtout *d'où vient le trafic* et *si les keywords passent la policy*, pas la marge.
- **Langue** : 12 pays sont en ✅ (annonce EN pertinente), le reste en ⚠️. Envisager des annonces localisées si un marché ⚠️ ressort.
- **Whitehat** : la règle whitehat (pas de "buy"/"cheap"/quantités) s'applique au **texte de l'annonce (RSA)**, PAS aux keywords. Les keywords buy-intent sont OK ; ceux refusés par la policy sont drop & retry, jamais d'exemption forcée (compte fragile, 1 strike = ban).
- **Paiement** : surveiller les déclins carte sur 🇧🇷 Brésil · 🇲🇽 Mexique · 🇹🇷 Turquie (historique de déclins sur gros paniers internationaux ; AR/CL/CO déjà retirés pour cette raison).

---

## Keywords (match type PHRASE)

> Stratégie : **PHRASE** (`"..."`) au lieu d'EXACT (`[...]`) pour capter plus de requêtes, **compensé par un gros mur de négatifs** pour rester serré.
> Notation Google : `"keyword"` = phrase · `[keyword]` = exact · `keyword` = broad.
> En phrase, une tête courte absorbe ses variantes : `"instagram followers"` capte déjà *buy / get / cheap / increase + instagram followers* tant que les mots sont contigus et dans l'ordre. D'où une liste resserrée de têtes + des négatifs costauds.

### 📸 Instagram Followers (PHRASE)

```
"instagram followers"
"ig followers"
"insta followers"
"followers instagram"
"instagram follower seller"
"buy instagram followers"
"buy ig followers"
"get instagram followers"
"grow instagram followers"
"instagram followers cheap"
"pay for instagram followers"
"best site to buy instagram followers"
```

### ▶️ YouTube Views (PHRASE — views only)

```
"youtube views"
"yt views"
"views on youtube"
"youtube video views"
"buy youtube views"
"get youtube views"
"youtube views cheap"
"best site to buy youtube views"
```

> Têtes larges (`"instagram followers"`, `"youtube views"`) = le filet. Les autres phrases gardent l'intention claire pour le pilotage d'enchères. Abonnés YT écartés pour ne pas diluer.

---

## Négatifs (le mur — à poser AVANT tout positif)

> ⚠️ Règle : ne JAMAIS négativer un mot présent dans un positif → ne pas négativer `real, active, get, increase, grow, cheap, pay, best, site, buy, followers, seller, views(YT)`.
> `views` est négativé côté **IG seulement** (c'est le produit côté YT).

### Base commune (les 2 campagnes)

**Gratuit / illégitime** — BROAD
```
free, gratis, hack, hacks, hacker, hacking, cheat, cheats,
generator, gen, crack, cracked
```

**Outils / logiciels / bots** — BROAD
```
app, apps, apk, mod, bot, bots, robot, software, tool, tools,
extension, plugin, addon, panel, reseller, api, script, automation
```
PHRASE : `"smm panel"`, `"no survey"`, `"no human verification"`, `"for free"`, `"without paying"`, `"free trial"`

**How-to / organique (pas acheteur)** — BROAD
```
tutorial, guide, tips, trick, tricks, organic, organically,
naturally, manually, earn
```
PHRASE : `"how to"`, `"how do"`, `"how can"`, `"best way"`, `"real way"`, `"ways to"`

**Info / vérification (pas acheteur)** — BROAD
```
meaning, definition, count, counter, checker, tracker, audit,
analytics, calculator, statistics, stats
```
PHRASE : `"what is"`, `"what are"`, `"how many"`, `"how much"`

**Compte / sécurité / réputation** — BROAD
```
login, signin, account, password, delete, remove, recover,
recovery, ban, banned, suspended, disabled, hacked, scam,
scams, legit, refund
```
PHRASE : `"log in"`, `"sign in"`, `"is it safe"`, `"is it legal"`, `"is it worth"`

**Emploi / carrière** — BROAD
```
job, jobs, career, careers, hiring, salary, intern, internship
```

**Tech / support / fake-detection** — BROAD
```
download, downloader, converter, error, glitch, fix, problem,
support, helpline, fake, fakes, ghost, spam
```
PHRASE : `"to mp3"`, `"to mp4"`, `"not working"`, `"customer service"`, `"remove fake"`, `"fake followers"`, `"fake views"`

### 📸 IG-spécifiques (services croisés → rester sur followers)
BROAD : `likes, like, comments, comment, views, reach, impressions, verification, verified, badge`
PHRASE : `"story views"`, `"reel views"`, `"auto likes"`, `"profile visits"`, `"blue tick"`, `"most followers"`

### ▶️ YouTube-spécifiques (features + services croisés)
Features (BROAD multi-mots, ton pattern) :
```
youtube ads, youtube premium, youtube music, youtube kids,
youtube tv, youtube shorts, youtube vanced, youtube studio,
youtube go, youtube originals, youtube downloader, youtube analytics,
partner program
```
Services croisés / monétisation (BROAD) :
```
subscribers, subscriber, subs, subscribe, monetization, monetize,
monetized, cpm, rpm, earnings, revenue, adsense
```
PHRASE : `"watch time"`, `"watch hours"`, `"how much youtube pays"`, `"1000 subscribers"`, `"4000 hours"`

### + liste partagée **"Fanovera Negatives — EN"** (déjà rattachée aux campagnes EN)

---

> 🔎 **Impératif avec du PHRASE** : miner les termes de recherche **dès les premiers jours** (`scripts/mine-search-terms.mjs`) et pousser les dépensiers à 0 conv en négatifs. Le mur ci-dessus filtre l'évident en amont, mais phrase fera remonter du junk imprévu — et à 20€ l'échantillon de termes sera petit, donc surveiller de près.

---

## Liens des annonces (Final URLs)

> Landing = `/promo` (page whitehat vettée). Elle s'adapte au réseau via `utm_term` (`detectTargetNetworkFromParams` : `utm_term` > `utm_content` > `utm_campaign`).
> `?utm_term=instagram` → hero thémé Instagram · `?utm_term=youtube` → hero thémé YouTube.
> **Domaine : `www.fanovera.com`** obligatoire (l'apex redirige en 307, à éviter).

### 📸 Campagne Instagram Followers → Final URL

```
https://www.fanovera.com/promo?lang=en&utm_term=instagram
```

### ▶️ Campagne YouTube Views → Final URL

```
https://www.fanovera.com/promo?lang=en&utm_term=youtube
```

### Final URL suffix (les 2 campagnes)

Champ "Final URL suffix" Google Ads (PAS collé à la Final URL — Google l'ajoute) — **requis pour l'attribution LTV par mot-clé** (cf. `docs/keyword-ltv-attribution.md`) :

```
utm_source=google&utm_medium=cpc&kw={keyword}&mt={matchtype}
```

### Sitelinks — différenciés par campagne (pas d'auto-référence)

**📸 Campagne Instagram Followers** (sitelink "Instagram" retiré — c'est déjà la destination) :

| Texte | URL |
|-------|-----|
| TikTok | `https://www.fanovera.com/promo?lang=en&utm_term=tiktok` |
| YouTube | `https://www.fanovera.com/promo?lang=en&utm_term=youtube` |
| Spotify | `https://www.fanovera.com/promo?lang=en&utm_term=spotify` |
| FAQ | `https://www.fanovera.com/?lang=en#faq` |
| How it works | `https://www.fanovera.com/?lang=en#how` |

**▶️ Campagne YouTube Views** (sitelink "YouTube" retiré — c'est déjà la destination) :

| Texte | URL |
|-------|-----|
| Instagram | `https://www.fanovera.com/promo?lang=en&utm_term=instagram` |
| TikTok | `https://www.fanovera.com/promo?lang=en&utm_term=tiktok` |
| Spotify | `https://www.fanovera.com/promo?lang=en&utm_term=spotify` |
| FAQ | `https://www.fanovera.com/?lang=en#faq` |
| How it works | `https://www.fanovera.com/?lang=en#how` |

---

## RSA — annonces (copiées À L'IDENTIQUE de la campagne [UK])

> Lues en live via `scripts/read-uk-rsa.mjs` (read-only). Le titre plateforme est **épinglé en position 2** (`pin:2`) comme sur UK.

### 📸 Instagram Followers (= UK ad group "Instagram")

**Titres (6)**
```
Results Within 2 Minutes       (24)
8,000+ Happy Customers         (22)
Grow Your Instagram            (19)   ← pin position 2
Lowest Price Guaranteed        (23)
Instant Start                  (13)
5% Off With Code FANO5         (22)
```

**Descriptions (4)**
```
Trusted by 8,000+ creators. Progressive natural growth, no password required, 3D Secure.   (88)
Grow your Instagram audience. Safe, fast, reliable. 30-day refund guarantee included.       (85)
Promote your Instagram with confidence. Code FANO5 for 5% off your first order.             (79)
Boost your reach on Instagram. Secure Stripe payment, no password, results in minutes.      (86)
```

### ▶️ YouTube Views (= UK ad group "Youtube")

**Titres (6)**
```
Results Within 2 Minutes       (24)
8,000+ Happy Customers         (22)
Grow Your YouTube Video        (23)   ← pin position 2
Lowest Price Guaranteed        (23)
Instant Start                  (13)
5% Off With Code FANO5         (22)
```

**Descriptions (4)**
```
Trusted by 8,000+ creators. Progressive natural growth, no password required, 3D Secure.   (88)
Grow your YouTube channel reach. Safe, fast, reliable. 30-day refund guarantee.             (79)
Promote your YouTube videos with confidence. Code FANO5 for 5% off your first order.        (84)
Boost your YouTube content. Secure Stripe payment, no password, results in minutes.         (83)
```

---

> ⚠️ **Rien n'est créé sur Google Ads** — ce fichier est la spec. La création via l'API se fera plus tard sur ton OK (sur le modèle de `scripts/create-*-ag.mjs`).
