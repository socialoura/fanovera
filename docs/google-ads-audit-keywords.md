# Audit Google Ads Fanovera — Stratégie Mot Clé Exact

**Date :** 2026-05-17
**Contexte :** Burn de 43€/jour pour 1 conversion (CPA 43€, marge brute 8,50€ → -34,50€/conv)

---

## 1. Diagnostic — Pourquoi ça burn

### Sources de gaspillage identifiées (sur 43,03€ d'aujourd'hui)

| Source | Coût | % budget | Conv |
|---|---|---|---|
| `tiktok followers` (variante proche) | 5,29€ | 12% | **1** ✅ |
| Variantes proches parasites (turc, concurrents, outils tiers) | ~10€ | 23% | 0 |
| **"Autres termes de recherche" cachés par Google** | **13,59€** | **32%** | 0 |
| Variantes proches diverses (long tail) | ~14€ | 33% | 0 |

### Causes racines
1. **Tous les keywords sont en `"Expression exacte"`** (guillemets) → Google déclenche des variantes proches très larges (turc, allemand, etc.)
2. **Pas de mots clés négatifs en place** pour bloquer les recherches "free", "gratuit", concurrents, tutoriels
3. **Pas de séparation par plateforme** → impossible d'optimiser un ad group sans casser un autre
4. **CPC moyen 1,08€ trop élevé** par rapport au break-even (~0,80€ avec marge actuelle)

### Référence de ce qui a marché historiquement (Fanovaly)
- **883,62€ → 193 conv → CPA 4,58€** ✅
- Top performer : `[buy tiktok followers]` (Mot clé exact) → CPA 4,54€, 59 conv
- Pattern gagnant : `buy X followers`, `X followers buy`, `cheap X followers`

---

## 2. Plateformes & services ciblés (8 plateformes / 14 services)

| Plateforme | Services | Codes SKU | Restrictions / Notes |
|---|---|---|---|
| Instagram | followers, likes, views | `ig_followers`, `ig_likes`, `ig_views` | — |
| TikTok | followers, likes, views | `tt_followers`, `tt_likes`, `tt_views` | ⚠️ Likes & Views = panier bas (voir §2.bis) |
| YouTube | views, subscribers | `yt_views`, `yt_subscribers` | ⚠️ Combo `buy + views` interdit |
| Spotify | streams, followers | `sp_streams`, `sp_followers` | — |
| Twitch | followers, live viewers | `tw_followers`, `tw_live_viewers` | Live viewers = service niche |
| Facebook | likes (page) | `fb_likes` | — |
| LinkedIn | followers | `li_followers` | — |
| Twitter (X) | followers | `x_followers` | — |

### 2.bis Alerte rentabilité par service

Sur Fanovaly, **tous les keywords `tiktok likes` étaient en mots clés négatifs** (`[buy tiktok likes]`, `[tiktok likes buy]`, `[buy cheap tiktok likes]`, etc.). Raison probable : panier moyen trop bas pour absorber le CPC.

**Math de rentabilité** (avec CPC moyen 1€, marge 85%) :

| Service | Pack populaire | Marge brute/conv | CR min pour rentabilité |
|---|---|---|---|
| TT followers | 1000 / 13,99€ | 11,89€ | 8,4% ✅ |
| IG followers | 1000 / ~12€ | 10,20€ | 9,8% ✅ |
| YT subscribers | ~10€ | 8,50€ | 11,8% ✅ |
| Spotify streams | ~3€ ? | ~2,50€ | 40% ❌ DUR |
| **TT likes** | 1000 / 6,99€ | 5,94€ | **16,8% ⚠️** |
| **IG likes** | similaire | ~5,5€ | **18% ⚠️** |
| **TT views** | 1000 / 1,49€ | 1,27€ | **78% ❌ IMPOSSIBLE** |
| **IG views** | similaire | ~1,5€ | **66% ❌ IMPOSSIBLE** |
| FB likes | similaire | ~5€ | **20% ⚠️** |

**Recommandation** : sur ce premier round, **NE PAS biddé sur** :
- `tiktok views`, `instagram views` (panier trop bas)
- **Optionnel** : `tiktok likes`, `instagram likes`, `facebook likes` (à tester avec budget plafonné max 5€/jour si tu veux)

Les sections ci-dessous incluent **tous les services** pour exhaustivité — c'est toi qui décides quoi activer.

---

## 3. Stratégie recommandée

### Architecture des ad groups
**Une campagne par langue** (FR + EN) × **2 ad groups par campagne** :
- **AG1 — Commercial Intent** (`buy/get/acheter X`)
- **AG2 — Generic Intent** (`X followers`, `X service`)

**Pourquoi 2 ad groups ?** Permet de comparer CPA et arbitrer après 7 jours sans cannibaliser. Sur ton compte aujourd'hui, c'est le générique qui a converti — mais sur Fanovaly, c'est le commercial qui dominait. On teste les deux.

### Type de correspondance
**TOUT en Mot clé exact (`[...]`)** — pas d'expression exacte (`"..."`), pas de requête large (`...`).

---

## 4. AD GROUP 1 — Commercial Intent (EN)

### 4.1 Instagram — Followers (priorité haute — historique fort)
```
[buy instagram followers]
[buy ig followers]
[buy insta followers]
[buy ig follower]
[buy real instagram followers]
[buy instagram followers cheap]
[buy cheap instagram followers]
[buy 1000 instagram followers]
[get instagram followers]
[get more instagram followers]
[instagram followers buy]
[ig followers buy]
[order instagram followers]
[purchase instagram followers]
```

### 4.1-bis Instagram — Likes (⚠️ rentabilité serrée, voir §2.bis)
```
[buy instagram likes]
[buy ig likes]
[buy insta likes]
[buy real instagram likes]
[buy instagram likes cheap]
[buy cheap instagram likes]
[buy 1000 instagram likes]
[buy instagram post likes]
[buy instagram photo likes]
[get instagram likes]
[instagram likes buy]
[order instagram likes]
```

### 4.1-ter Instagram — Views (⚠️ rentabilité ~impossible, voir §2.bis)
```
[buy instagram views]
[buy instagram reels views]
[buy instagram video views]
[buy ig reels views]
[buy instagram story views]
[get instagram views]
[instagram views buy]
```
> Recommandation : **ne pas activer** ou tester avec budget max 3€/jour.

### 4.2 TikTok — Followers (priorité haute — historique fort)
```
[buy tiktok followers]
[buy tt followers]
[buy tiktok follower]
[buy real tiktok followers]
[buy tiktok followers cheap]
[buy cheap tiktok followers]
[tiktok followers buy]
[tiktok follower buy]
[get tiktok followers]
[get tiktok followers fast]
[order tiktok followers]
[purchase tiktok followers]
[boost tiktok followers]
```

### 4.2-bis TikTok — Likes (⚠️ Fanovaly avait tout exclu, à tester avec prudence)
```
[buy tiktok likes]
[buy tt likes]
[buy tiktok like]
[buy real tiktok likes]
[buy tiktok likes cheap]
[buy cheap tiktok likes]
[buy 1000 tiktok likes]
[get tiktok likes]
[tiktok likes buy]
[order tiktok likes]
[boost tiktok likes]
```

### 4.2-ter TikTok — Views (⚠️ rentabilité ~impossible, voir §2.bis)
```
[buy tiktok views]
[buy tt views]
[buy real tiktok views]
[buy tiktok views cheap]
[buy 1000 tiktok views]
[buy 10000 tiktok views]
[get tiktok views]
[tiktok views buy]
[boost tiktok views]
```
> Recommandation : **ne pas activer** ou tester avec budget max 3€/jour.

### 4.3 YouTube — Subscribers (commercial direct OK)
```
[buy youtube subscribers]
[buy youtube subs]
[buy real youtube subscribers]
[buy youtube channel subscribers]
[buy youtube subscribers cheap]
[get youtube subscribers]
[youtube subscribers buy]
[order youtube subscribers]
```

### 4.3-bis YouTube — Views (greyhat, on évite UNIQUEMENT le combo `buy + views`)
Le seul interdit absolu côté policy = `buy youtube views` / `acheter vues youtube`. Le mot `views` seul, ou combiné avec d'autres modificateurs (`cheap`, `real`, `1000`, `get`, `more`, `increase`, `boost`), passe généralement tant que l'ad copy ne dit pas explicitement "buy views".
```
[youtube views]
[youtube views cheap]
[cheap youtube views]
[real youtube views]
[organic youtube views]
[1000 youtube views]
[10000 youtube views]
[100000 youtube views]
[get youtube views]
[get more youtube views]
[more youtube views]
[increase youtube views]
[boost youtube views]
[youtube views service]
[youtube views fast]
[instant youtube views]
[youtube views pack]
[youtube video views]
[promote youtube video]
[promote youtube channel]
[boost youtube video]
[boost youtube channel]
[youtube video promotion]
[youtube channel promotion]
[youtube growth]
[grow youtube channel]
```

> ⚠️ **L'ad copy doit rester neutre** : pas de `Buy YouTube Views` / `Cheap YouTube Views` dans les headlines. Préférer `Boost Your YouTube Video`, `Get More YouTube Views`, `YouTube Growth Service`. Voir section 12.bis.

> ❌ **À NE JAMAIS AJOUTER** (suspension immédiate) :
> `[buy youtube views]`, `[buy youtube views cheap]`, `[buy cheap youtube views]`, `[buy real youtube views]`, `[buy 1000 youtube views]`, `[purchase youtube views]`, `[order youtube views]`.

### 4.4 Spotify — Streams
```
[buy spotify streams]
[buy spotify plays]
[buy spotify monthly listeners]
[buy real spotify streams]
[buy spotify streams cheap]
[buy 1000 spotify streams]
[buy 10000 spotify streams]
[get spotify streams]
[get more spotify streams]
[order spotify streams]
[spotify streams buy]
[promote spotify song]
[promote spotify track]
```

### 4.4-bis Spotify — Followers
```
[buy spotify followers]
[buy spotify artist followers]
[buy spotify playlist followers]
[buy spotify profile followers]
[buy real spotify followers]
[buy spotify followers cheap]
[get spotify followers]
[spotify followers buy]
[order spotify followers]
```

### 4.5 Twitch — Followers
```
[buy twitch followers]
[buy twitch subscribers]
[buy real twitch followers]
[buy twitch followers cheap]
[buy cheap twitch followers]
[buy 1000 twitch followers]
[get twitch followers]
[twitch followers buy]
[order twitch followers]
[boost twitch followers]
```

### 4.5-bis Twitch — Live Viewers (service niche — peu de volume search attendu)
```
[buy twitch viewers]
[buy twitch live viewers]
[buy twitch stream viewers]
[buy real twitch viewers]
[buy twitch viewers cheap]
[twitch live viewers buy]
[twitch viewers service]
[get twitch viewers]
[twitch viewer bot]
[boost twitch stream viewers]
```

### 4.6 Facebook — Page Likes (le service cible PAGES, pas posts)
```
[buy facebook page likes]
[buy facebook fan page likes]
[buy facebook page followers]
[buy facebook page fans]
[buy real facebook page likes]
[buy facebook page likes cheap]
[buy cheap facebook page likes]
[buy 1000 facebook page likes]
[get facebook page likes]
[facebook page likes buy]
[order facebook page likes]
[grow facebook page]
[boost facebook page]
[boost facebook page likes]
[facebook page promotion]
[buy facebook likes]
[buy facebook followers]
[buy facebook fans]
[buy real facebook likes]
[buy facebook likes cheap]
[get facebook likes]
```

### 4.7 LinkedIn
```
[buy linkedin followers]
[buy linkedin connections]
[buy linkedin company followers]
[buy linkedin page followers]
[get linkedin followers]
[linkedin followers buy]
[order linkedin followers]
```

### 4.8 Twitter (X)
```
[buy twitter followers]
[buy x followers]
[buy real twitter followers]
[buy twitter followers cheap]
[get twitter followers]
[twitter followers buy]
[x followers buy]
[order twitter followers]
```

---

## 5. AD GROUP 1 — Commercial Intent (FR)

### 5.1 Instagram — Followers
```
[acheter abonnes instagram]
[acheter abonnés instagram]
[acheter followers instagram]
[acheter des abonnes instagram]
[acheter des followers instagram]
[acheter abonnes insta]
[abonnes instagram pas cher]
[followers instagram pas cher]
[obtenir abonnes instagram]
[1000 abonnes instagram]
```

### 5.1-bis Instagram — Likes (⚠️ rentabilité serrée)
```
[acheter likes instagram]
[acheter likes insta]
[acheter likes photo instagram]
[acheter likes post instagram]
[likes instagram pas cher]
[acheter vrais likes instagram]
[1000 likes instagram]
[obtenir likes instagram]
```

### 5.1-ter Instagram — Views (⚠️ panier trop bas)
```
[acheter vues instagram]
[acheter vues reels instagram]
[acheter vues story instagram]
[vues instagram pas cher]
[acheter vues video instagram]
```
> Recommandation : **ne pas activer** ou budget max 2€/jour.

### 5.2 TikTok — Followers
```
[acheter abonnes tiktok]
[acheter abonnés tiktok]
[acheter followers tiktok]
[acheter des abonnes tiktok]
[acheter des followers tiktok]
[abonnes tiktok pas cher]
[followers tiktok pas cher]
[obtenir abonnes tiktok]
[1000 abonnes tiktok]
[booster abonnes tiktok]
```

### 5.2-bis TikTok — Likes (⚠️ Fanovaly avait tout exclu)
```
[acheter likes tiktok]
[acheter likes tt]
[acheter vrais likes tiktok]
[likes tiktok pas cher]
[acheter 1000 likes tiktok]
[obtenir likes tiktok]
[booster likes tiktok]
```

### 5.2-ter TikTok — Views (⚠️ panier trop bas)
```
[acheter vues tiktok]
[acheter vues tt]
[vues tiktok pas cher]
[acheter 1000 vues tiktok]
[obtenir vues tiktok]
[booster vues tiktok]
```
> Recommandation : **ne pas activer** ou budget max 2€/jour.

### 5.3 YouTube — Subscribers (commercial direct OK)
```
[acheter abonnes youtube]
[acheter abonnés youtube]
[acheter des abonnes youtube]
[abonnes youtube pas cher]
[acheter abonnés chaîne youtube]
```

### 5.3-bis YouTube — Views (greyhat, on évite UNIQUEMENT `acheter + vues`)
Seul interdit absolu = `acheter vues youtube`. Le mot `vues` seul, ou combiné avec `pas cher`, `1000`, `obtenir`, `vraies`, `booster`, `plus de`, passe tant que l'ad copy ne dit pas explicitement "achetez des vues".
```
[vues youtube]
[vues youtube pas cher]
[vraies vues youtube]
[obtenir des vues youtube]
[obtenir vues youtube]
[plus de vues youtube]
[1000 vues youtube]
[10000 vues youtube]
[100000 vues youtube]
[booster vues youtube]
[booster ses vues youtube]
[augmenter vues youtube]
[augmenter ses vues youtube]
[vues youtube rapidement]
[vues youtube instantanées]
[pack vues youtube]
[gagner des vues youtube]
[promotion video youtube]
[promotion vidéo youtube]
[promotion chaine youtube]
[promotion chaîne youtube]
[booster video youtube]
[booster vidéo youtube]
[booster chaine youtube]
[booster chaîne youtube]
[croissance youtube]
```

> ⚠️ **L'ad copy doit rester neutre** : pas de `Acheter Vues YouTube` / `Vues YouTube Pas Cher` en headline. Préférer `Boostez Votre Vidéo YouTube`, `Plus de Vues YouTube`, `Croissance YouTube Pro`. Voir section 12.bis.

> ❌ **À NE JAMAIS AJOUTER** (suspension) :
> `[acheter vues youtube]`, `[acheter des vues youtube]`, `[acheter vues youtube pas cher]`, `[acheter 1000 vues youtube]`, `[acheter vraies vues youtube]`.

### 5.4 Spotify — Streams
```
[acheter streams spotify]
[acheter écoutes spotify]
[acheter ecoutes spotify]
[acheter plays spotify]
[acheter écoutes mensuelles spotify]
[promotion spotify]
[promotion morceau spotify]
[promotion chanson spotify]
[streams spotify pas cher]
[1000 streams spotify]
[obtenir streams spotify]
```

### 5.4-bis Spotify — Followers
```
[acheter followers spotify]
[acheter abonnes spotify]
[acheter abonnés artiste spotify]
[acheter followers playlist spotify]
[followers spotify pas cher]
[obtenir followers spotify]
```

### 5.5 Twitch — Followers
```
[acheter followers twitch]
[acheter abonnes twitch]
[acheter abonnés twitch]
[abonnes twitch pas cher]
[followers twitch pas cher]
[obtenir followers twitch]
[1000 followers twitch]
[booster followers twitch]
```

### 5.5-bis Twitch — Live Viewers (service niche)
```
[acheter viewers twitch]
[acheter live viewers twitch]
[acheter viewers stream twitch]
[viewers twitch pas cher]
[booster viewers twitch]
[booster stream twitch]
[acheter spectateurs twitch]
[spectateurs twitch pas cher]
```

### 5.6 Facebook — Page Likes (le service cible PAGES, pas profils)
```
[acheter likes page facebook]
[acheter likes fanpage]
[acheter likes pour ma page facebook]
[acheter abonnes page facebook]
[acheter followers page facebook]
[acheter fans page facebook]
[likes page facebook pas cher]
[booster page facebook]
[booster ma page facebook]
[promouvoir page facebook]
[promotion page facebook]
[1000 likes page facebook]
[acheter likes facebook]
[acheter followers facebook]
[acheter fans facebook]
[likes facebook pas cher]
[obtenir likes facebook]
```

### 5.7 LinkedIn
```
[acheter followers linkedin]
[acheter abonnes linkedin]
[abonnes linkedin pas cher]
```

### 5.8 Twitter (X)
```
[acheter followers twitter]
[acheter abonnes twitter]
[acheter followers x]
[followers twitter pas cher]
```

---

## 6. AD GROUP 2 — Generic Intent (EN)

> Pattern : nom du service sans verbe d'achat. **Plus de volume, mais intention plus floue.**
> C'est l'AG qui a converti aujourd'hui sur Fanovera (`tiktok followers` variante).

### Instagram — Followers
```
[instagram followers]
[ig followers]
[insta followers]
[instagram followers cheap]
[cheap instagram followers]
[real instagram followers]
[instant instagram followers]
[instagram followers service]
[1000 instagram followers]
```

### Instagram — Likes ⚠️
```
[instagram likes]
[ig likes]
[cheap instagram likes]
[real instagram likes]
[instagram likes service]
[1000 instagram likes]
[instagram post likes]
[instagram photo likes]
```

### Instagram — Views ⚠️ (rentabilité difficile)
```
[instagram views]
[instagram reels views]
[instagram video views]
[instagram story views]
[cheap instagram views]
```

### TikTok — Followers
```
[tiktok followers]
[tiktok follower]
[cheap tiktok followers]
[tiktok followers cheap]
[real tiktok followers]
[tiktok followers service]
[1000 tiktok followers]
[tiktok growth service]
```

### TikTok — Likes ⚠️
```
[tiktok likes]
[cheap tiktok likes]
[real tiktok likes]
[tiktok likes service]
[1000 tiktok likes]
[tiktok video likes]
```

### TikTok — Views ⚠️ (rentabilité difficile)
```
[tiktok views]
[cheap tiktok views]
[real tiktok views]
[tiktok video views]
[1000 tiktok views]
[tiktok views service]
```

### YouTube (subscribers + views — sans le combo `buy + views`)
```
[youtube subscribers]
[youtube subs]
[cheap youtube subscribers]
[real youtube subscribers]
[youtube subscribers service]
[1000 youtube subscribers]
[youtube channel growth]
[youtube views]
[cheap youtube views]
[real youtube views]
[1000 youtube views]
[get youtube views]
[more youtube views]
[increase youtube views]
[youtube views service]
[youtube views fast]
[youtube video views]
```

### Spotify — Streams
```
[spotify streams]
[spotify plays]
[spotify monthly listeners]
[spotify promotion]
[spotify streams service]
[1000 spotify streams]
[cheap spotify streams]
[real spotify streams]
[spotify song promotion]
```

### Spotify — Followers
```
[spotify followers]
[spotify artist followers]
[spotify playlist followers]
[cheap spotify followers]
[real spotify followers]
```

### Twitch — Followers
```
[twitch followers]
[cheap twitch followers]
[real twitch followers]
[twitch followers service]
[twitch growth service]
[1000 twitch followers]
```

### Twitch — Live Viewers
```
[twitch viewers]
[twitch live viewers]
[twitch stream viewers]
[cheap twitch viewers]
[twitch viewers service]
[twitch viewer bot]
```

### Facebook
```
[facebook page likes]
[facebook likes]
[facebook followers]
[cheap facebook likes]
[real facebook likes]
[facebook page likes service]
```

### LinkedIn
```
[linkedin followers]
[linkedin connections]
[linkedin company followers]
[linkedin growth service]
```

### Twitter (X)
```
[twitter followers]
[x followers]
[cheap twitter followers]
[real twitter followers]
[twitter followers service]
```

---

## 7. AD GROUP 2 — Generic Intent (FR)

### Instagram — Followers
```
[abonnes instagram]
[abonnés instagram]
[followers instagram]
[abonnes instagram pas cher]
[vrais abonnes instagram]
[abonnes insta]
[followers insta]
```

### Instagram — Likes ⚠️
```
[likes instagram]
[likes insta]
[likes instagram pas cher]
[vrais likes instagram]
[likes post instagram]
[likes photo instagram]
```

### Instagram — Views ⚠️
```
[vues instagram]
[vues reels instagram]
[vues story instagram]
[vues instagram pas cher]
```

### TikTok — Followers
```
[abonnes tiktok]
[abonnés tiktok]
[followers tiktok]
[vrais abonnes tiktok]
[abonnes tiktok pas cher]
[followers tiktok pas cher]
```

### TikTok — Likes ⚠️
```
[likes tiktok]
[likes tt]
[likes tiktok pas cher]
[vrais likes tiktok]
[likes video tiktok]
```

### TikTok — Views ⚠️
```
[vues tiktok]
[vues tt]
[vues tiktok pas cher]
[vues video tiktok]
```

### YouTube (subscribers + vues — sans le combo `acheter + vues`)
```
[abonnes youtube]
[abonnés youtube]
[abonnes youtube pas cher]
[vues youtube]
[vues youtube pas cher]
[vraies vues youtube]
[1000 vues youtube]
[obtenir vues youtube]
[plus de vues youtube]
[augmenter vues youtube]
[booster vues youtube]
[promotion youtube]
[booster chaine youtube]
[croissance youtube]
```

### Spotify — Streams
```
[streams spotify]
[ecoutes spotify]
[écoutes spotify]
[promotion spotify]
[plays spotify]
[écoutes mensuelles spotify]
[streams spotify pas cher]
[promotion morceau spotify]
```

### Spotify — Followers
```
[followers spotify]
[abonnes spotify]
[abonnés artiste spotify]
[followers playlist spotify]
```

### Twitch — Followers
```
[followers twitch]
[abonnes twitch]
[abonnés twitch]
[followers twitch pas cher]
[vrais followers twitch]
```

### Twitch — Live Viewers
```
[viewers twitch]
[live viewers twitch]
[spectateurs twitch]
[viewers twitch pas cher]
[viewers stream twitch]
```

### Facebook
```
[likes facebook]
[likes page facebook]
[abonnes facebook]
```

### LinkedIn
```
[abonnes linkedin]
[followers linkedin]
```

### Twitter (X)
```
[abonnes twitter]
[followers twitter]
[abonnes x]
[followers x]
```

---

## 8. MOTS CLÉS NÉGATIFS (à appliquer au niveau campagne)

### 8.1 Négatifs en **Requête large** (bloque toute requête contenant ces mots)

**Intent informationnel (tutoriels / éducation)**
```
how to
how can
how do
how can i
how do i
how do you
how
why
where
when
what is
guide
tutorial
tutorials
tips
tricks
hacks
hack
hacking
hacker
method
methods
methode
tactic
tactics
strategy
strategies
secret
secrets
step by step
step-by-step
for beginners
beginners
learn
learning
training
class
classes
masterclass
course
ebook
pdf
study
wiki
wikipedia
article
blog
forum
reddit
quora
review
reviews
comparison
vs
meaning
definition
explain
ideas
content ideas
script
template
templates
caption
schedule
when to post
best time to post
hashtags
trending audio
viral sounds
```

**Intent gratuit / arnaque**
```
free
gratuit
gratis
no pay
zero cost
trial
free trial
generator
generate
download
software
app
apps
apk
mod
glitch
bot
bots
botting
hack
cheat
cheats
fake
unlimited
under 1
under 5
1 cent
2 dollars
5 cents
99 cents
1$
$1
sub4sub
f4f
follow for follow
exchange
```

**Hors-cible géo / langue**
```
kaufen
follower kaufen
abonnenten kaufen
comprar
seguidores
beli
شراء
متابعين
takipci
takipçi
gercek
ücretsiz
bedava
yağmur
```

**Concurrents / outils tiers** (Fanovaly history)
```
ytmonster
instastatics
instastatistics
trendhero
pathsocial
getinsta
increasefollower
lionfollow
tikviral
givemeboost
nreer
tikfans
tokupgrade
tikfollowers
bumbumapp
smm
smm panel
panel
canva
capcut
```

**Plateformes/sujets parasites** (recherches sur les apps elles-mêmes)
```
ios
android
extension
tool
tools
booster
boosters
edit
editing
mod
android apk
download
how to use
sign up
login
account
profile
bio
threads
snapchat
```

**Croissance organique / contenu**
```
grow
growing
growth
gain
gaining
increase
increasing
buying
beli
content
caption
hashtag
hashtags
viral
go viral
engagement
more followers
```

**Modificateurs problématiques**
```
is it safe
is it legal
is it possible
can i buy
can you buy
best site
best sites
best place
best website
best websites
top sites
cheapest
reddit
forum
review
reviews
```

### 8.2 Négatifs en **Mot clé exact** (bloque la requête identique)

**Recherches de termes seuls non-acheteurs** (le mot seul de la plateforme = recherche info, pas commerciale)
```
[instagram]
[tiktok]
[youtube]
[spotify]
[twitch]
[twitter]
[facebook]
[linkedin]
[x]
```

> Note : on ne bloque PAS `[followers]`, `[likes]`, `[views]`, `[subscribers]`, `[streams]`, `[abonnes]` seuls car ce sont des requêtes que tu peux servir si elles arrivent (rare en exact). On bloque uniquement le nom seul des plateformes.

**Bloque les variantes problématiques de Fanovaly**
```
[freer tiktok]
[tiktok followers cheap free]
[free instagram followers]
[free tiktok followers]
[free youtube subscribers]
[get free followers]
[free spotify streams]
```

### 8.3 Négatifs spécifiques YouTube (suspension policy)
Comme on bid maintenant sur `[youtube views]` et `[vues youtube]`, on N'EXCLUT QUE le combo littéral `buy/acheter + views/vues` (le seul vrai interdit policy) :

**Niveau campagne YouTube (en Mot clé exact, pour ne bloquer QUE la requête exacte)** :
```
[buy youtube views]
[buy youtube views cheap]
[buy cheap youtube views]
[buy real youtube views]
[buy 1000 youtube views]
[buy 10000 youtube views]
[purchase youtube views]
[order youtube views]
[acheter vues youtube]
[acheter des vues youtube]
[acheter 1000 vues youtube]
[acheter vues youtube pas cher]
[acheter vraies vues youtube]
```

> Ne PAS mettre `views`, `view`, `youtube views`, `vues` en requête large — ça bloquerait tous tes keywords commerciaux YouTube views.

---

## 9. Paramètres d'enchère & campagne

### 9.1 Stratégie d'enchère
**Phase 1 (semaine 1–2) : CPC Manuel**
- CPC max : **0,60€** pour AG2 Generic
- CPC max : **0,80€** pour AG1 Commercial (volume plus rare, on peut payer un peu plus)
- Pas de Smart Bidding tant qu'on n'a pas 20+ conversions/semaine

**Phase 2 (après 20+ conv en 7j) : tCPA**
- CPA cible : **5€** (laisse 3,50€ de marge brute)
- Augmenter à 7€ uniquement si volume insuffisant

> **Pourquoi pas Smart Bidding tout de suite ?** Smart Bidding amplifie les "Autres termes de recherche" cachés (32% de ton burn aujourd'hui). Tant que le compte n'a pas d'historique de conversion, l'algo va surenchérir sur n'importe quoi.

### 9.2 Réglages de campagne
- **Réseau** : Recherche uniquement (désactiver Search Partners + Display)
- **Variantes proches** : impossible à désactiver totalement, mais Mot clé exact (`[...]`) en réduit énormément l'impact
- **Géo-ciblage** :
  - Campagne FR : France uniquement (exclure DOM-TOM si pas pertinent)
  - Campagne EN : US, UK, CA, AU, IE, NZ (exclure Inde, Pakistan, Bangladesh, Philippines, Nigeria — trafic peu solvable / fraude)
  - **Exclure Turquie partout** (turc dans tes requêtes parasites)
- **Langue** : FR pour campagne FR / EN pour campagne EN
- **Calendrier de diffusion** : limiter aux heures actives 8h–23h (heure locale du pays cible)
- **Audience** : si possible, exclure les audiences "Recherche d'informations" (Google Audience Insights)
- **Appareils** : commencer mobile + desktop, exclure tablette si historique faible

### 9.3 Budget recommandé
- **Campagne FR** : 30€/jour (mémoire)
- **Campagne EN** : 70€/jour (mémoire)
- **Répartition par AG** :
  - AG1 Commercial : 60% du budget (intent fort)
  - AG2 Generic : 40% du budget (volume mais à monitorer)
- Si AG2 brûle sans converti après 7j → coupé.

---

## 10. Plan d'action — Ordre d'exécution

### Aujourd'hui (urgent — stop le burn)
1. **Mettre en PAUSE toutes les campagnes actuelles** (le temps de refaire la structure)
2. Créer la liste de négatifs (section 8) au niveau **compte** dans la bibliothèque partagée, puis appliquer à toutes les campagnes
3. Exclure géo : Turquie + pays non-cible

### Demain (refonte structure)
4. Créer 2 campagnes : `[FR] Search` et `[EN] Search`
5. Dans chaque campagne, créer 2 ad groups : `Commercial` et `Generic`
6. Coller les keywords des sections 4–7 (en exact match `[...]`)
7. Régler enchères : CPC manuel 0,60€ AG2 / 0,80€ AG1
8. Activer les campagnes

### J+3 (premier check)
9. Vérifier rapport des termes de recherche → ajouter les nouvelles requêtes parasites en négatifs
10. Mettre en pause les keywords avec 0 impression depuis 3 jours (faible Quality Score → ils tirent l'AG vers le bas)

### J+7 (premier arbitrage)
11. Comparer AG1 Commercial vs AG2 Generic
12. Si CPA AG2 > 8€ → couper AG2 entièrement
13. Si une plateforme tire le CPA → l'isoler dans son propre AG
14. Si conversions > 20 → tester tCPA à 5€

### J+14 (optimisation)
15. Identifier les top 3 keywords convertisseurs → augmenter CPC de +20%
16. Bottom 30% (clics sans conv) → mettre en pause

---

## 11. Métriques cibles

| KPI | Cible 7j | Cible 30j |
|---|---|---|
| CPC moyen | < 0,80€ | < 0,70€ |
| CPA | < 8€ | < 5€ |
| Taux de conversion | > 12% | > 20% |
| % "Autres termes de recherche" | < 20% | < 10% |
| Conversions/jour | 5+ | 15+ |

---

## 12.bis Règle d'or YouTube — Évite UNIQUEMENT le combo `buy/acheter + views/vues`

Google flag sur la **combinaison explicite**, pas sur les mots individuels. Tant que tu n'écris jamais `Buy YouTube Views` ou `Acheter des Vues YouTube` dans l'ad copy + tant que la LP ne dit pas explicitement "Achetez des vues", les keywords avec `views` / `vues` passent.

### ✅ Ad copy SAFE (greyhat — autorisé)
**Headlines EN** :
- "Get More YouTube Views"
- "Boost Your YouTube Video"
- "1000 YouTube Views Fast"
- "Real YouTube Views"
- "YouTube Growth Service"
- "Increase YouTube Views"

**Headlines FR** :
- "Plus de Vues YouTube"
- "Boostez Votre Vidéo YouTube"
- "1000 Vues YouTube Rapide"
- "Vraies Vues YouTube"
- "Augmenter Vues YouTube"

### ❌ Ad copy BANNI (suspension automatique)
- "Buy YouTube Views" / "Buy Cheap YouTube Views"
- "Acheter Vues YouTube" / "Acheter des Vues YouTube"
- "Purchase YouTube Views" / "Order YouTube Views"

### Landing page `/youtube` — règle simple
La LP peut **vendre des vues** (c'est ton business), mais évite le **call-to-action littéral** `Buy YouTube Views` en H1/CTA principal. Préfère :
- H1 : "Plus de Vues YouTube en 24h" (au lieu de "Achetez des Vues YouTube")
- CTA : "Lancer ma campagne" / "Commander" (au lieu de "Acheter des vues")
- Le wording dans les packs peut rester "1000 vues / 4,99€" — c'est le titre/CTA qui compte le plus pour Google.

### Action recommandée
1. Audit rapide de `app/youtube/page.tsx` pour vérifier les H1/CTA
2. Si tu vois "Buy YouTube Views" / "Achetez des Vues YouTube" en titre principal → reformule
3. Le reste du contenu (packs, descriptions, FAQ) peut rester explicite

---

## 12. Garde-fous légaux (rappel)

- ❌ Combo `buy + youtube views` / `acheter + vues youtube` → suspension immédiate (en keyword ET en ad copy)
- ✅ `[youtube views]`, `[get youtube views]`, `[1000 youtube views]`, `[vues youtube]` → autorisés tant que l'ad copy reste neutre
- ❌ Promesse `real followers from real users` si tu ne peux pas le garantir → ad disapproved
- ⚠️ Whitelabel : si tu opères sous nom "Fanovera", **ne PAS biddé sur "Fanovaly" ou anciens noms** sauf à des fins défensives explicites
- ⚠️ Politique "Misleading content" : éviter `guaranteed`, `100% real`, `instant delivery` dans le texte d'annonce
