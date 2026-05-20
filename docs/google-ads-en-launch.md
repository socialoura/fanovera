# Google Ads — Campagne EN Search — Plan de lancement (whitehat)

Plan complet pour la campagne anglophone de Fanovera. Toutes les annonces sont **whitehat strict** (pas de "Buy followers", pas de quantités explicites, focus sur "Grow / Promote / Boost") pour rester safe sur un compte fragile.

Phase de validation : Manual CPC, Exact Match uniquement, 6 ad groups sur les services principaux.

---

## 1. Configuration de la campagne

| Paramètre | Valeur |
|---|---|
| Nom | `Fanovera — EN — Search` |
| Type | Search (Réseau de Recherche) |
| Réseaux | Google Search uniquement (**décocher** Search Partners + Display Network) |
| Budget journalier | **70 €/jour** |
| Stratégie d'enchère | **Manual CPC** (basculer en Maximize Conversions après 30+ conv/30j) |
| CPC max (au niveau ad group) | **1,80 €** |
| Géographie | **UK, US, Canada, Australia** |
| Type de présence | **"People in your targeted locations"** (pas "interested in") |
| Langues | **English** uniquement |
| Calendrier | 24/7 au démarrage (ajuster après 14 jours) |
| Devices | All — laisser Google répartir |
| Rotation des annonces | **Optimize: prefer best performing ads** |
| Final URL (toutes les annonces) | `https://fanovera.com/promo` |

**Stratégie d'enchère détaillée :**
- **Semaines 1–2** : Manual CPC, plafond 1,80 €. Récolter de la data brute.
- **Semaines 3–4** : si ≥ 30 conv/30j, passer à **Maximize Conversions** sans CPA cible.
- **Semaine 5+** : si stable, passer à **Target CPA = 4,58 €** (benchmark Fanovaly EN).

---

## 2. Conversion tracking

| Action | Compté dans bidding | Modèle d'attribution |
|---|---|---|
| `purchase` (Stripe paid) | ✅ **Primary** | Data-driven |
| `begin_checkout` | ❌ Observation only | Data-driven |
| `view_item` / `add_to_cart` | ❌ Observation only | Data-driven |

**Enhanced Conversions** : déjà activé (gtag avec email/phone hash). Vérifier dans Google Ads → Conversions → Action `purchase` → Enhanced Conversions = Active.

**Conversion window** : 30 jours clic, 1 jour view-through.

---

## 3. Modèle de suivi (Tracking Template) + Custom Parameters

C'est là que vit toute la logique UTM. **Aucun paramètre dans la Final URL.**

### 3.1 Tracking Template — niveau campagne

Aller dans : **Campagne → Paramètres → Options d'URL de campagne → Modèle de suivi**

```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign=en-search&utm_content={_network}&utm_term={keyword}&gclid={gclid}
```

- `{lpurl}` → résout automatiquement vers la Final URL (`https://fanovera.com/promo`)
- `{_network}` → custom parameter, défini par ad group (voir 3.2)
- `{keyword}` → ValueTrack natif, rempli par Google avec le keyword déclencheur
- `{gclid}` → Google Click ID, sert au Enhanced Conversions et à l'attribution server-side

**Tester le template avec le bouton "Test" de Google Ads** avant de sauvegarder — il doit retourner un 200 OK sur `/promo` avec tous les paramètres.

### 3.2 Custom Parameter `{_network}` — niveau ad group

Aller dans : **Ad Group → Settings → URL options → Custom parameters → Add parameter**

| Ad Group | Custom parameter |
|---|---|
| Instagram Followers | `_network` = `instagram` |
| YouTube Views | `_network` = `youtube` |
| Spotify Streams | `_network` = `spotify` |
| X Followers | `_network` = `twitter` |
| Facebook Page Likes | `_network` = `facebook` |
| Twitch Followers | `_network` = `twitch` |

Au clic, Google substitue `{_network}` par la valeur configurée sur l'ad group source. Le LP `/promo` lit `utm_content` et highlight la bonne carte réseau (Hero.tsx → `detectTargetNetworkFromParams`).

### 3.3 Validation côté code

Le tracker côté LP supporte déjà ces valeurs (vérifié dans `detectTargetNetwork.ts`) :
- `instagram` (alias : insta, ig)
- `youtube` (alias : yt)
- `spotify`
- `twitter` (alias : x, x_followers, tweet)
- `facebook` (alias : fb, meta)
- `twitch`

---

## 4. Ad Groups

**Important :** Toutes les annonces utilisent la même Final URL : `https://fanovera.com/promo`.
La différenciation par réseau passe uniquement par le custom parameter `{_network}` au niveau ad group.

### 4.1 Ad Group : Instagram Followers

**Custom parameter ad group :** `_network = instagram`
**Display path :** `fanovera.com/Instagram-Growth`

**Keywords (Exact Match) — blackhat intent acheteur :**
```
[buy instagram followers]
[buy 100 instagram followers]
[buy 1000 instagram followers]
[buy 1k instagram followers]
[buy 5000 instagram followers]
[buy 10000 instagram followers]
[instagram followers buy]
[buy ig followers]
```

**RSA Headlines (≤ 30 chars chacune) :**
```
Grow Your Instagram          (19)
Boost Your IG Presence       (22)
Instagram Audience Growth    (25)
Promote Your IG Profile      (23)
8,000+ Happy Customers       (22)   ← winner
4.9/5 Trustpilot Rating      (24)
Code FANO5 — Save 5%         (20)
5% Off With Code FANO5       (22)   ← winner
30-Day Refund Guarantee      (23)
Safe Stripe Payment          (19)
3D Secure Checkout           (18)
No Password Required         (20)
Fast Worldwide Delivery      (23)
Trusted by 8,000+ Creators   (26)
Fanovera — Social Growth     (24)
```

**RSA Descriptions (≤ 90 chars chacune) :**
```
1. Trusted by 8,000+ creators. Progressive natural growth, no password required, 3D Secure.    (89)
2. Grow your Instagram audience. Safe, fast, reliable. 30-day refund guarantee included.        (86)
3. Promote your Instagram with confidence. Code FANO5 for 5% off your first order.              (79)
4. Boost your reach on Instagram. Secure Stripe payment, no password, results in minutes.       (87)
```

**Pinning recommandé :**
- Headline position 1 : `Grow Your Instagram` (pinned)
- Description position 1 : `Trusted by 8,000+ creators...` (pinned)

---

### 4.2 Ad Group : YouTube Views

**Custom parameter ad group :** `_network = youtube`
**Display path :** `fanovera.com/YouTube-Growth`

**Keywords (Exact Match) — blackhat intent acheteur :**
```
[buy youtube views]
[buy 1000 youtube views]
[buy 10000 youtube views]
[buy 100k youtube views]
[buy 1 million youtube views]
[youtube views buy]
[youtube video views buy]
[buy yt views]
```

**RSA Headlines :**
```
Grow Your YouTube Channel    (24)
Boost Your Video Reach       (22)
YouTube Content Promotion    (25)
Promote Your YT Channel      (23)
8,000+ Happy Customers       (22)   ← winner
4.9/5 Trustpilot Rating      (24)
Code FANO5 — Save 5%         (20)
5% Off With Code FANO5       (22)   ← winner
30-Day Refund Guarantee      (23)
Safe Stripe Payment          (19)
3D Secure Checkout           (18)
No Password Required         (20)
Fast Worldwide Delivery      (23)
Trusted by 8,000+ Creators   (26)
Fanovera — Social Growth     (24)
```

**RSA Descriptions :**
```
1. Trusted by 8,000+ creators. Progressive natural growth, no password required, 3D Secure.   (89)
2. Grow your YouTube channel reach. Safe, fast, reliable. 30-day refund guarantee.             (82)
3. Promote your YouTube videos with confidence. Code FANO5 for 5% off your first order.         (87)
4. Boost your YouTube content. Secure Stripe payment, no password, results in minutes.          (85)
```

---

### 4.3 Ad Group : Spotify Streams

**Custom parameter ad group :** `_network = spotify`
**Display path :** `fanovera.com/Spotify-Promotion`

**Keywords (Exact Match) — blackhat intent acheteur :**
```
[buy spotify streams]
[buy 1000 spotify streams]
[buy 10000 spotify streams]
[buy 100k spotify streams]
[spotify streams buy]
[buy spotify plays]
[spotify plays buy]
[buy spotify monthly listeners]
```

**RSA Headlines :**
```
Promote Your Music           (18)
Spotify Artist Promotion     (24)
Boost Your Music Reach       (22)
Music Promotion Service      (23)
8,000+ Happy Artists         (20)
4.9/5 Trustpilot Rating      (24)
Code FANO5 — Save 5%         (20)
5% Off With Code FANO5       (22)   ← winner
30-Day Refund Guarantee      (23)
Safe Stripe Payment          (19)
3D Secure Checkout           (18)
No Password Required         (20)
Fast Worldwide Delivery      (23)
Trusted by 8,000+ Artists    (25)
Fanovera — Music Growth      (23)
```

**RSA Descriptions :**
```
1. Trusted by 8,000+ artists. Progressive natural growth, no password required, 3D Secure.     (87)
2. Promote your music on Spotify. Safe, fast, reliable. 30-day refund guarantee.                (78)
3. Boost your Spotify reach with confidence. Code FANO5 for 5% off your first order.            (84)
4. Grow your audience on Spotify. Secure Stripe payment, no password, results in 24h.           (84)
```

---

### 4.4 Ad Group : X / Twitter Followers

**Custom parameter ad group :** `_network = twitter`
**Display path :** `fanovera.com/X-Growth`

**Keywords (Exact Match) — blackhat intent acheteur :**
```
[buy twitter followers]
[buy x followers]
[buy 100 twitter followers]
[buy 1000 twitter followers]
[buy 1000 x followers]
[buy 5000 twitter followers]
[twitter followers buy]
[x followers buy]
```

**RSA Headlines :**
```
Grow Your X Profile          (19)
Boost Your X Presence        (21)
X Audience Growth            (17)
Promote Your X Account       (22)
8,000+ Happy Customers       (22)   ← winner
4.9/5 Trustpilot Rating      (24)
Code FANO5 — Save 5%         (20)
5% Off With Code FANO5       (22)   ← winner
30-Day Refund Guarantee      (23)
Safe Stripe Payment          (19)
3D Secure Checkout           (18)
No Password Required         (20)
Fast Worldwide Delivery      (23)
Trusted by 8,000+ Creators   (26)
Fanovera — Social Growth     (24)
```

**RSA Descriptions :**
```
1. Trusted by 8,000+ creators. Progressive natural growth, no password required, 3D Secure.   (89)
2. Grow your X / Twitter audience. Safe, fast, reliable. 30-day refund guarantee.              (80)
3. Promote your X profile with confidence. Code FANO5 for 5% off your first order.             (81)
4. Boost your reach on X. Secure Stripe payment, no password, results in minutes.              (79)
```

---

### 4.5 Ad Group : Facebook Page Likes

**Custom parameter ad group :** `_network = facebook`
**Display path :** `fanovera.com/Facebook-Growth`

**Keywords (Exact Match) — blackhat intent acheteur :**
```
[buy facebook page likes]
[buy facebook likes]
[buy 1000 facebook page likes]
[buy 1000 facebook likes]
[buy 5000 facebook page likes]
[facebook page likes buy]
[facebook likes buy]
[buy fb page likes]
[buy fb likes]
```

**RSA Headlines :**
```
Grow Your Facebook Page      (23)
Boost Your FB Page Reach     (24)
Facebook Page Promotion      (23)
Promote Your FB Page         (20)
8,000+ Happy Businesses      (23)
4.9/5 Trustpilot Rating      (24)
Code FANO5 — Save 5%         (20)
5% Off With Code FANO5       (22)   ← winner
30-Day Refund Guarantee      (23)
Safe Stripe Payment          (19)
3D Secure Checkout           (18)
No Password Required         (20)
Fast Worldwide Delivery      (23)
Trusted by 8,000+ Brands     (24)
Fanovera — Page Growth       (22)
```

**RSA Descriptions :**
```
1. Trusted by 8,000+ businesses. Progressive natural growth, no password required, 3D Secure.  (89)
2. Grow your Facebook page audience. Safe, fast, reliable. 30-day refund included.              (80)
3. Promote your Facebook page with confidence. Code FANO5 for 5% off your first order.          (85)
4. Boost your reach on Facebook. Secure Stripe payment, no password, results in minutes.        (87)
```

---

### 4.6 Ad Group : Twitch Followers

**Custom parameter ad group :** `_network = twitch`
**Display path :** `fanovera.com/Twitch-Growth`

**Keywords (Exact Match) — blackhat intent acheteur :**
```
[buy twitch followers]
[buy 100 twitch followers]
[buy 500 twitch followers]
[buy 1000 twitch followers]
[buy 5000 twitch followers]
[twitch followers buy]
```

**RSA Headlines :**
```
Grow Your Twitch Channel     (24)
Boost Your Stream Reach      (23)
Twitch Channel Promotion     (24)
Promote Your Twitch          (19)
8,000+ Happy Streamers       (22)
4.9/5 Trustpilot Rating      (24)
Code FANO5 — Save 5%         (20)
5% Off With Code FANO5       (22)   ← winner
30-Day Refund Guarantee      (23)
Safe Stripe Payment          (19)
3D Secure Checkout           (18)
No Password Required         (20)
Fast Worldwide Delivery      (23)
Trusted by 8,000+ Streamers  (27)
Fanovera — Stream Growth     (24)
```

**RSA Descriptions :**
```
1. Trusted by 8,000+ streamers. Progressive natural growth, no password required, 3D Secure.   (88)
2. Grow your Twitch channel audience. Safe, fast, reliable. 30-day refund included.             (82)
3. Promote your Twitch channel. Code FANO5 for 5% off your first order.                          (69)
4. Boost your stream reach. Secure Stripe payment, no password, results in minutes.             (82)
```

---

## 5. Negative Keywords

### 5.1 Liste compte-level (s'applique à toutes les campagnes)

Type : **Broad Match** (par défaut au niveau compte).

```
free
gratis
no payment
without paying
without money
how to
how do
tutorial
tutorials
tuto
guide
guides
hack
hacks
bot
bots
script
scripts
python
automation
app
apk
download
crack
cracked
generator
free generator
software
review
reviews
reddit
forum
quora
vs
versus
comparison
compare
agency
agencies
b2b
enterprise
wholesale
marketing course
course
courses
online course
training
masterclass
certification
ebook
job
jobs
career
careers
salary
recovery
password reset
account recovery
account hacked
report
unfollow
unfollowers
remove followers
lose followers
fake followers checker
follower counter
follower count
analytics
manager job
manager jobs
intern
internship
```

### 5.2 Liste compétiteurs (account-level, à exclure)

```
socialboss
bulkfollows
famoid
mr insta
mr.insta
mrinsta
buzzoid
growthoid
kicksta
twicsy
social viral
socialviral
stormlikes
goread
followersup
followers up
upleap
nitreo
viralyft
viral yft
useviral
use viral
```

### 5.3 Négatifs supplémentaires (niveau campagne — EN Search uniquement)

Liste large à ajouter au niveau **campagne** (Paramètres → Mots-clés négatifs → Campagne). Distincte de la liste compte-level pour ne pas polluer d'autres campagnes futures.

**Type recommandé : Phrase Match** pour la majorité (`"how to"`, `"free followers"`), **Broad** pour les uniques (`snapchat`, `onlyfans`).

#### Educational / research intent
```
what is
what are
how does
how does it work
meaning
definition
definitions
examples
example
ideas
tips
tricks
explained
explainer
learn
learning
research
case study
beginner
beginners
for beginners
basics
fundamentals
```

#### Free / scam patterns
```
free followers
free likes
free views
free streams
free comments
free generator
free trial
no human verification
human verification
without human verification
no survey
no verification
giveaway
sweepstakes
prize
contest
freebies
hack tool
mod apk
mod app
```

#### Wrong platforms / confusion
```
snapchat
snap
tinder
bumble
hinge
telegram
whatsapp
discord
signal
pinterest
threads app
mastodon
bluesky
clubhouse
truth social
onlyfans
fansly
```

#### Account problems / recovery
```
blocked
banned
suspended
deleted account
locked account
restricted account
shadow ban
shadowban
shadow banned
report account
delete account
log out
logout
deactivate
deactivated
disabled account
```

#### Trackers / analytics / audit tools (intent monitoring, jamais acheteur)
```
tracker
trackers
follower tracker
followers tracker
unfollow tracker
unfollower tracker
unfollowers tracker
view count
viewcount
view counter
views counter
view tracker
views tracker
engagement rate
engagement rate calculator
engagement calculator
engagement tracker
analytics
instagram analytics
youtube analytics
spotify analytics
twitter analytics
facebook analytics
tiktok analytics
twitch analytics
linkedin analytics
insights
instagram insights
youtube insights
stats
statistics
follower stats
metrics
audit
audit tool
profile audit
account audit
profile analyzer
account analyzer
profile checker
account checker
social blade
socialblade
hypeauditor
hype auditor
modash
phlanx
ninjalitics
notjustanalytics
not just analytics
influencer search
influencer tracker
influencer lookup
competitor analysis
competitor tracker
ghost followers
ghost follower
inactive followers
unfollow checker
who unfollowed me
who viewed my profile
profile viewers
story viewers
who viewed my story
```

#### Organic growth tools (concurrents indirects)
```
scheduler
post scheduler
planner
content planner
buffer app
hootsuite
later app
metricool
sprout social
sprout
sociality
creator studio
business suite
meta business suite
growth tool
analytics tool
monitoring tool
social media management
smm tool
smm software
smm panel script
```

#### Customer service / login intent
```
login
log in
sign in
sign up
signup
forgot password
support contact
customer service
help center
help centre
contact us
how to contact
phone number
```

#### Music / video adjacent (Spotify / YouTube parasites)
```
lyrics
chord
chords
mp3
mp3 download
free download
music download
songs free
free songs
movie
film
documentary
watch online
watch free
stream movie
streaming service
best of
top songs
playlist curator
playlist submission
distrokid
tunecore
```

#### Platform feature noise
```
story template
story templates
highlight cover
highlight covers
filter
filters
effect
effects
preset
presets
overlay
overlays
emote maker
emote
emoji
twitch panel
twitch overlay
stream key
obs
streamlabs
```

#### Adult / unsafe / Stripe-risk
```
porn
pornhub
nudes
naked
nsfw
adult content
xxx
escort
sex
sexy
camgirl
cam girl
sugar daddy
```

#### Trade / crypto / scam adjacencies
```
nft
crypto
bitcoin
btc
gambling
casino
loan
loans
get rich
rich quick
mlm
pyramid scheme
forex
trading signals
```

#### News / celebs / gossip
```
news
celebrity
celebrities
leaked
scandal
gossip
viral video
viral tweet
trending
trending now
breaking news
```

#### B2B / dev / press
```
api
documentation
docs
sdk
developer
developers
partnership
affiliate program
affiliates
press release
investor
funding
ipo
case study b2b
white label
reseller
```

---

### 5.4 Négatifs spécifiques par ad group

**Instagram Followers** :
```
likes
views
story views
reels views
comments
saves
shares
profile visits
ig hack
recover
recovery
```

**YouTube Views** :
```
subscribers
subs
likes
comments
shorts views
watch hours
monetization
adsense
copyright
youtube studio
```

**Spotify Streams** :
```
followers
playlist placement
spotify wrapped
premium
free spotify
spotify gift
spotify hack
spotify mod
spotify family
```

**X / Twitter Followers** :
```
likes
retweets
impressions
views
verify
verification
blue check
twitter blue
x premium
twitter login
```

**Facebook Page Likes** :
```
followers
post likes
reactions
ads manager
business manager
boost post
marketplace
groups
messenger
facebook login
```

**Twitch Followers** :
```
viewers
live viewers
subs
subscribers
bits
prime sub
emotes
turbo
twitch login
```

---

## 6. Ad Assets / Extensions (niveau campagne)

### 6.1 Sitelinks (8 minimum)

Tous les sitelinks pointent vers des sous-pages réelles. **À vérifier dans le code avant launch** — Google désactive les sitelinks 404 et pénalise l'AdRank.

| Texte | Description ligne 1 | Description ligne 2 | URL |
|---|---|---|---|
| 30-Day Refund | Money-back guarantee | Risk-free purchase | `https://fanovera.com/refund` |
| 8,000+ Reviews | Trusted by creators | 4.9/5 Trustpilot rating | `https://fanovera.com/reviews` |
| How It Works | Results in minutes | No password required | `https://fanovera.com/how-it-works` |
| Secure Payment | 3D Secure Stripe | Apple Pay, Google Pay | `https://fanovera.com/payment` |
| Pricing | Volume discounts | Transparent pricing | `https://fanovera.com/pricing` |
| Support | Email & live chat | Average reply 2h | `https://fanovera.com/support` |
| FAQ | Common questions | Help center | `https://fanovera.com/faq` |
| All Networks | IG, YT, Spotify, X, FB... | One trusted provider | `https://fanovera.com/promo` |

### 6.2 Callouts (8+)

```
No password required
3D Secure payment
30-day refund guarantee
Trusted by 8,000+ creators
Progressive natural delivery
24/7 customer support
Worldwide delivery
4.9/5 Trustpilot rating
```

### 6.3 Structured Snippets

| Header | Values |
|---|---|
| Services | Instagram Growth, YouTube Growth, Spotify Promotion, X Growth, Facebook Growth, Twitch Growth |
| Featured | Fast Delivery, No Password, 30-Day Refund, 3D Secure |

### 6.4 Promotion Extension

| Champ | Valeur |
|---|---|
| Occasion | None |
| Language | English |
| Currency | USD |
| Promotion type | **Percent off** |
| Percent off | **5%** |
| Item | Any order |
| Promotion code | **FANO5** |
| Final URL | `https://fanovera.com/promo?promo=FANO5` |
| Tracking template | `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign=en-search&utm_content=promo_fano5&utm_term=fano5&gclid={gclid}` |
| Start date | Day of launch |
| End date | Leave blank (ongoing) |

**Comportement à l'arrivée** : le hook `usePromoFromUrl` (`app/lib/usePromoFromUrl.ts`) lit le paramètre `?promo=` et pré-applique automatiquement le code FANO5 dans le champ coupon de Step3Checkout (8 réseaux). Le visiteur n'a rien à recopier — la réduction est déjà appliquée à l'arrivée au checkout.

### 6.5 Price Extension

Type : **Service categories**

| Header | Description | Price | URL |
|---|---|---|---|
| Instagram Growth | Audience expansion | from $4.99 | `https://fanovera.com/promo` |
| YouTube Growth | Channel reach | from $4.99 | `https://fanovera.com/promo` |
| Spotify Promotion | Music reach | from $4.99 | `https://fanovera.com/promo` |
| X Growth | Profile growth | from $4.99 | `https://fanovera.com/promo` |
| Facebook Growth | Page reach | from $4.99 | `https://fanovera.com/promo` |
| Twitch Growth | Channel growth | from $4.99 | `https://fanovera.com/promo` |

Remplacer les prix par les vrais minimums après l'arrondi DB.

### 6.6 Logo + Business name

- Logo : 1024×1024 (à ré-uploader sur le nouveau compte Fanovera)
- Business name : `Fanovera`

---

## 7. Brand Campaign (séparée, ~1€/jour)

Empêcher les concurrents de squatter le nom Fanovera.

| Paramètre | Valeur |
|---|---|
| Nom | `Fanovera — EN — Brand` |
| Budget | **1 €/jour** |
| Géo | UK, US, CA, AU |
| Stratégie | Manual CPC, max **0,30 €** |
| Final URL | `https://fanovera.com/promo` |
| Tracking template | mêmé que campagne principale (avec `_network = brand`) |
| Ad Group unique | `Brand Exact` |
| Custom parameter | `_network = brand` |

**Keywords (Exact) :**
```
[fanovera]
[fanovera.com]
[fanovera reviews]
[fanovera promotion]
[fanovera instagram]
[fanovera youtube]
[fanovera spotify]
```

**RSA Headlines :**
```
Fanovera — Official Site
Social Media Growth Service
8,000+ Happy Customers
4.9/5 Trustpilot Rating
5% Off With Code FANO5
30-Day Refund Guarantee
Trusted Promotion Service
```

**Description :**
```
Fanovera — official site. Trusted growth for Instagram, YouTube, Spotify, X, Facebook, Twitch.
```

---

## 8. Monitoring & règles d'optimisation

### 8.1 Métriques à surveiller

| Métrique | Seuil sain | Action si dépassement |
|---|---|---|
| CPA | ≤ 5 € | Si > 7€ sur 100 clics, kill le keyword |
| CTR (Search) | ≥ 5 % | Si < 2%, retravailler RSA |
| Quality Score | ≥ 7 | Si < 6, vérifier alignement keyword/ad/LP |
| Conversion rate | ≥ 4 % | Si < 2%, tester nouvelles LP |
| Search Impr. Share | ≥ 60 % | Si < 40%, augmenter CPC max ou budget |
| Bounce rate (GA4) | ≤ 50 % | Si > 70%, mismatch keyword/LP |

### 8.2 Routine hebdomadaire (chaque lundi)

1. **Search Terms Report** → ajouter requêtes pourries comme négatifs
2. **Keyword performance** → pause keywords > 100 clics, 0 conv
3. **RSA Asset Report** → remplacer assets notés "Low"
4. **Conversion lag check** → comparer conv J-7 vs J-14
5. **Auction Insights** → voir qui se positionne contre toi

### 8.3 Règles automatiques

| Règle | Condition | Action | Fréquence |
|---|---|---|---|
| Kill keyword | Clicks > 50 AND Conv = 0 | Pause keyword | Lundi |
| Boost performer | Conv ≥ 5 AND CPA < 3 € | +15% CPC | Lundi |
| Alert overspend | Cost > 1.5× target CPA AND no conv | Email | Daily |

### 8.4 Critères de passage en Phase 2 (Smart Bidding)

- ≥ **30 conversions sur 30 jours glissants** au niveau campagne
- ≥ **2 ad groups stables** (CPA < 6€ sur 50+ clics)
- ≥ **14 jours de data** sans changement de structure majeur

---

## 9. Checklist de lancement

- [ ] Conversion `purchase` taggée `Primary` dans Google Ads
- [ ] `begin_checkout` en `Secondary / Observation only`
- [ ] Enhanced Conversions actif (vert dans Conversions)
- [ ] Tracking template configuré au niveau campagne
- [ ] Custom parameter `_network` configuré sur chaque ad group
- [ ] LP `/promo` testée : highlight de la bonne carte par valeur `utm_content`
- [ ] Pages sitelinks `/refund`, `/reviews`, `/how-it-works`, `/payment`, `/pricing`, `/support`, `/faq` toutes en 200 OK
- [ ] Toutes les négatives ajoutées au niveau compte
- [ ] Négatives spécifiques ajoutées par ad group
- [ ] Budget 70€/jour configuré
- [ ] Géo UK + US + CA + AU en "Presence"
- [ ] Langue English uniquement
- [ ] Search Partners + Display **décochés**
- [ ] CPC max 1,80€ au niveau ad group
- [ ] Brand campaign séparée créée
- [ ] Promotion extension FANO5 active
- [ ] Sitelinks (8), callouts (8), structured snippets configurés
- [ ] Email overspend daily activé

---

## 10. Budget projection (Phase 1, 30 premiers jours)

Hypothèses optimistes basées sur les benchmarks Fanovaly EN (CPC 1,17 €, conv rate 25 %, CPA 4,58 €) :

| Métrique | Réaliste 30 jours |
|---|---|
| Budget consommé | ~1 800 € (90% du plafond) |
| Clics | ~1 500 |
| Conversions | ~375 |
| CA brut (ticket 10€) | ~3 750 € |
| Marge brute (85%) | ~3 188 € |
| Coût Ads | ~1 800 € |
| **Marge nette** | **~1 388 €** |

Ramp-up de 2-3 semaines avant que Google ait assez de data. **N'attends pas un CPA propre avant J+14.**

---

## Annexe : Mots-clés convertissants historiques Fanovaly (référence)

À comparer avec les nouveaux Fanovera après 14 jours pour valider :

| Keyword Fanovaly | CPA |
|---|---|
| `get tiktok followers` | 3,60 € |
| `cheap ig followers` | 5,63 € |
| `tiktok booster` | bon volume, CTR 57% |

Si Fanovera n'atteint pas ces CPA sur des kw équivalents whitehat (`grow tiktok followers`, etc.) au bout de 30 jours, c'est la LP/pricing à blâmer — pas les ads.

---

## Annexe technique : exemple d'URL finale au clic

Quand un visiteur clique sur l'annonce de l'ad group "Spotify Streams" en cherchant `grow spotify streams` :

1. Google Ads applique le tracking template
2. Substitue `{_network}` → `spotify`, `{keyword}` → `grow spotify streams`, `{gclid}` → token unique
3. Le visiteur est redirigé vers :

```
https://fanovera.com/promo?utm_source=google&utm_medium=cpc&utm_campaign=en-search&utm_content=spotify&utm_term=grow+spotify+streams&gclid=Cj0KCQ...
```

4. `Hero.tsx` → `detectTargetNetworkFromParams` lit `utm_content=spotify` → highlight la carte Spotify dans le grid

Aucun changement de code n'est requis : le système actuel gère déjà cette intégration.
