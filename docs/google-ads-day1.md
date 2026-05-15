# Google Ads — Jour 1 (15 mai 2026)

> Itération post-audit. Voir `google-ads-day0.md` pour le snapshot de lancement.
> Landing page : `fanovera.com/promo`

---

## 📝 Ce qui change vs Jour 0

| Bloc | Jour 0 | Jour 1 | Raison |
|------|--------|--------|--------|
| **Plateformes ciblées** | 5 (IG, Spotify, YT, X, TikTok) | **8** (+ Facebook, LinkedIn, Twitch) | Nouvelle offre Fanovera |
| **Stratégie mots-clés** | 100% wording soft ("growth", "promotion") | **Zone grise mesurée** (inclut "buy", "acheter", "cheap") | Données historiques : soft = CPA estimé 10-15€, zone grise = CPA 2-5€ prouvé |
| **Focus TikTok** | Ad group normal | **Light, top winners only** | Prix source TikTok cher → garder uniquement les converters prouvés |
| **Budget par plateforme** | Réparti uniforme | **Instagram = PRIMARY 40%** | Historique : Instagram = CPA 2.76€ (best) |
| **Mots-clés négatifs EN** | ~30 dont `growth`/`grow`/`booster`/`twitter` | **9 retirés** (sabotaient les top converters) | Voir audit ci-dessous |
| **Mots-clés négatifs FR** | ~120 avec doublons | **Dédupliqués + 4 retraits** (où/pourquoi/qui/risque) | Trop larges |
| **Middleware `?lang=en`** | Forçait `currency=USD` | **Auto-détection IP** | UK/CA/AU users doivent voir leur devise locale |

---

## 📊 Audit data (qui a piloté les changements)

Source : 8 fichiers CSV de comptes Google Ads similaires + ancien compte Fanovaly.

### Performance historique par plateforme

| Plateforme | Conversions | Coût | CPA | Verdict |
|------------|-------------|------|-----|---------|
| **Instagram** | 65 (24%) | 180€ | **2.76€** ⭐ | Best CPA → PRIMARY |
| TikTok | 199 (72%) | 901€ | 4.53€ | Volume mais cher source → LIGHT |
| Spotify | 2 | 14€ | 6.85€ | Test léger |
| YouTube | 1 | 2€ | 2.25€ | Test léger |
| Twitter/FB/LinkedIn/Twitch | 0 | 0 | - | Aucune data → tests blind |

### Pépites cachées (top converters absolus)

| Mot-clé | Conv | CPA | Langue |
|---------|------|-----|--------|
| `ig boost` | 7 | **0.16€** | EN |
| `tiktok growth service` | 3 | **0.25€** | EN |
| `acheter follow insta` | 4 | **0.36€** | FR |
| `tiktok followers booster` | 3.5 | **0.48€** | EN |
| `buy ig followers` | 9 | 3.53€ | EN |

---

## 🇬🇧 Campagne EN — Social Growth

| Paramètre | Valeur |
|-----------|--------|
| **Budget** | 70 €/jour |
| **Landing page** | https://www.fanovera.com/promo?lang=en |
| **Bidding** | Maximiser les conversions (puis CPA cible 5 € après 30 conv.) |
| **Géo** | UK, US, Canada, Australie (à confirmer selon décision finale) |
| **Langue** | Anglais |
| **Réseau** | Search uniquement |

### Mots-clés (Phrase Match — copier-coller direct)

> Calibrés sur 277 conversions historiques. ⭐ = top converters prouvés.

**Instagram** (PRIMARY — meilleur CPA historique 2.76€)
```
"buy ig followers"
"ig boost"
"cheap instagram followers"
"instagram followers cheap"
"ig followers buy"
"instagram followers buyer"
"get instagram followers"
"real instagram followers"
"instagram followers service"
"instagram growth service"
"buy ig follower"
"instagram followers"
```

**TikTok** (LIGHT — top winners uniquement, prix source cher)
```
"tiktok growth service"
"tiktok followers booster"
"boost tiktok followers"
"tiktok growth"
"get tiktok followers"
```

**YouTube** (TEST)
```
"buy youtube views"
"youtube views service"
"youtube subscribers service"
"youtube growth"
"buy youtube subscribers"
```

**Spotify** (TEST)
```
"buy spotify streams"
"spotify streams service"
"spotify promotion service"
"get spotify streams"
"promote spotify music"
```

**Twitter / X** (TEST)
```
"twitter followers service"
"buy x followers"
"twitter growth"
"x growth service"
```

**Facebook** (NEW TEST — pas de data historique)
```
"facebook page likes"
"buy facebook followers"
"facebook growth service"
"facebook page boost"
```

**LinkedIn** (NEW TEST)
```
"linkedin followers service"
"linkedin growth"
"buy linkedin connections"
```

**Twitch** (NEW TEST)
```
"twitch followers"
"twitch viewers"
"twitch growth service"
"buy twitch followers"
```

### Annonce RSA (inchangée vs Jour 0)

Voir `google-ads-day0.md` pour les headlines et descriptions.

### Mots-clés négatifs EN

> ⚠️ **Retirés vs Jour 0 / ancienne liste** : `growth`, `grow`, `growing`, `booster`, `boosters`, `twitter`, `buying`, `increase`, `increasing` — ils bloquaient nos top converters (`tiktok growth service`, `tiktok followers booster`, etc.) et toute la campagne Twitter.
>
> `buy` et `cheap` absents volontairement (utilisés dans nos mots-clés).
>
> Tout en **broad match**. Liste dédupliquée.

**Toxiques / policy**
```
fake
bot
bots
botting
hack
hacks
hacker
hacking
piracy
pirate
scam
cheat
cheats
cheater
cheating
```

**Gratuit / hors budget**
```
free
free trial
trial
gratis
gratuit
no pay
zero cost
unlimited
1 cent
5 cents
99 cents
1$
$1
2 dollars
under 1
under 5
cheapest
freer
```

**Tuto / informational**
```
tutorial
tutorials
for beginners
beginners
how to
how can
how can i
how do i
how do you
learn
learning
training
course
courses
class
classes
study
book
ebook
pdf
article
blog
forum
reddit
quora
wikipedia
wiki
masterclass
guide
what is
definition
meaning
explain
```

**Outils / apps**
```
canva
glitch
templates
template
hashtags
generate
generator
android
ios
app
apps
apk
download
software
extension
mod
edit
editing
caption
```

**Curiosité / questions**
```
why
where
who
exchange
sub4sub
f4f
follow for follow
is it legal
is it safe
is it possible
can i buy
can you buy
more followers
```

**Comparatifs / reviews**
```
review
reviews
comparison
vs
best website
best websites
best site
best sites
best place
top sites
```

**Langues parasites**
```
seguidores
suscriptores
comprar
follower kaufen
kaufen
beli
abonnés
abonne
abonnes
acheter
شراء
متابعين
```

**Hors sujet / non offert**
```
snapchat
threads
job
jobs
salary
earn
gain
gaining
tips
secret
secrets
tactic
tactics
strategy
strategies
method
methods
way
ways
schedule
when to post
best time to post
content ideas
ideas
trending audio
viral sounds
go viral
step by step
step-by-step
comment avoir
```

**Concurrents / SMM panels**
```
smm
panel
smm panel
tokupgrade
tikfans
bumbumapp
freer tiktok
```

---

## 🇫🇷 Campagne FR — Social Growth

| Paramètre | Valeur |
|-----------|--------|
| **Budget** | 30 €/jour |
| **Landing page** | https://www.fanovera.com/promo |
| **Bidding** | Maximiser les conversions (puis CPA cible 5 € après 30 conv.) |
| **Géo** | France, Belgique, Suisse |
| **Langue** | Français |
| **Réseau** | Search uniquement |

### Mots-clés (Phrase Match — copier-coller direct)

**Instagram** (PRIMARY)
```
"abonnés instagram pas cher"
"acheter abonné instagram"
"acheter follow insta"
"achat followers instagram"
"achat abonnés instagram"
"followers instagram pas cher"
"follower instagram acheter"
"meilleur site achat followers instagram"
"boost abonnés instagram"
"boost instagram"
"service abonnés instagram"
"vrais abonnés instagram"
"plus de followers instagram"
```

**TikTok** (LIGHT — top winners uniquement)
```
"abonnés tiktok pas cher"
"acheter abonnement tiktok"
"achat followers tiktok"
"meilleur site achat followers tiktok"
"acheter follow tiktok"
```

**YouTube** (TEST)
```
"acheter vues youtube"
"vues youtube pas cher"
"abonnés youtube"
"booster vidéo youtube"
"acheter abonnés youtube"
"achat vues youtube"
```

**Spotify** (TEST)
```
"promotion spotify"
"streams spotify"
"plus d'écoutes spotify"
"promouvoir musique spotify"
"acheter streams spotify"
```

**Twitter / X** (TEST)
```
"followers twitter"
"abonnés twitter"
"boost compte twitter"
"croissance twitter"
"acheter followers twitter"
```

**Facebook** (NEW TEST)
```
"likes page facebook"
"abonnés page facebook"
"booster page facebook"
"j'aime page facebook"
"acheter likes facebook"
```

**LinkedIn** (NEW TEST)
```
"abonnés linkedin"
"followers linkedin"
"boost page linkedin"
"acheter followers linkedin"
```

**Twitch** (NEW TEST)
```
"followers twitch"
"viewers twitch"
"abonnés twitch"
"boost chaîne twitch"
"acheter followers twitch"
```

### Annonce RSA (inchangée vs Jour 0)

Voir `google-ads-day0.md` pour les headlines et descriptions.

### Mots-clés négatifs FR

> ⚠️ **Retirés** : `où`, `pourquoi`, `qui`, `risque` (trop larges, bloquaient des intentions d'achat légitimes).
>
> `acheter`, `achat`, `pas cher`, `buy`, `cheap` absents volontairement (utilisés dans nos top converters).
>
> Tout en **broad match**. Liste dédupliquée (~120 négatifs initiaux → ~110 propres).

**Toxiques / policy**
```
fake
faux
bot
bots
botting
hack
hacks
piratage
pirate
piraterie
triche
triches
arnaque
scam
viewbot
```

**Gratuit / hors budget**
```
gratuit
gratis
free
sans payer
coût zéro
illimité
essai
essai gratuit
1€
1 €
followers gratuit
```

**Tuto / formation**
```
tuto
tutoriel
formation
cours
classe
classes
guide
blog
wiki
wikipedia
forum
reddit
quora
masterclass
ebook
pdf
livre
article
étude
apprentissage
apprendre
expliquer
how to
```

**Conseils / stratégie**
```
astuces
conseils
stratégie
stratégies
tactique
tactiques
secret
secrets
```

**Questions informationnelles**
```
comment
comment faire
c'est quoi
définition
signification
```

**Apprentissage**
```
pas à pas
étape par étape
débutants
pour débutants
```

**Outils / logiciels**
```
générateur
generateur
générer
logiciel
script
outil
outils
applications
appli
analytics
converter
software
generator
```

**Échange / troc**
```
sub4sub
f4f
follow pour follow
échange
```

**Création de contenu**
```
capcut
montage
éditer
modèle
modèles
légende
thumbnail
miniature
hashtags
caption
```

**Tendances / idées**
```
son tendance
sons viraux
idées de contenu
idées
trending audio
```

**Planning**
```
meilleure heure pour poster
quand poster
planning
```

**Téléchargement / apps**
```
apk
ios
android
télécharger
download
extension
mod
mp3
mp4
musique libre
seo youtube
youtube studio
```

**Technique / contraintes plateforme**
```
smm
panel
smm panel
danger
interdit
signaler
règles
bug
strike
copyright
sous-titres
partenaire youtube
monétisation
légal
account
acheter compte
```

**SMM panels concurrents**
```
zefoy
zefame
smmfollows
socialblast
tikboost
tik booster
tikviral
followersnet
instafollowers
mr popular
```

**Hors sujet**
```
gagner de l'argent
entraînement
méthode
méthodes
façon
façons
emploi
salaire
supprimer
get
purchase
buying
claim
```

---

## 🔧 Changements techniques

### Middleware — devise auto-détectée

**Fichier** : `middleware.ts:44-54`

Avant (Jour 0) : `?lang=en` forçait `currency=USD` via cookie.

Maintenant (Jour 1) : `?lang=en` force la **locale** EN, mais la devise est détectée automatiquement via `x-vercel-ip-country` :

| Pays IP | Devise affichée |
|---------|-----------------|
| US | USD |
| UK | GBP |
| Canada | CAD |
| Australia | AUD |
| France | EUR |
| Suisse | CHF |
| Brésil | BRL |
| Mexique | MXN |

L'utilisateur peut toujours basculer manuellement via le `CurrencySelector`.

---

## ✅ Actions à exécuter dans Google Ads

1. **Remplacer les mots-clés** des deux campagnes par les listes Jour 1 (8 plateformes)
2. **Créer 8 ad groups par campagne** (un par plateforme) — permet de couper/scaler indépendamment
3. **Remplacer les listes de mots-clés à exclure** :
   - Créer `Fanovera EN - Negatifs J1` et `Fanovera FR - Negatifs J1`
   - Appliquer chacune à sa campagne respective
   - Désactiver les anciennes listes (mais ne pas les supprimer tout de suite — fallback)
4. **Vérifier** : `growth`, `grow`, `booster`, `twitter` bien retirés de la nouvelle liste EN

---

## 📈 KPI à suivre (inchangé vs Jour 0)

Voir `google-ads-day0.md` section "KPI à suivre".

Surveillance supplémentaire S1-S2 post-Jour 1 :
- Impressions sur `tiktok growth service`, `tiktok followers booster` → doivent remonter dès J+1
- Impressions Twitter EN → doivent remonter dès J+1
- 0 conv sur Facebook/LinkedIn/Twitch après 30 clics → couper l'ad group concerné

---

## 🧠 Mémo : pourquoi cette stratégie tient

1. **Mots-clés peuvent contenir "buy/acheter/cheap"** → captent l'intent d'achat (CPA prouvé 2-5€)
2. **Annonces JAMAIS ces mots** → restent dans le registre "growth/visibility/professional service"
3. **Landing `/promo` whitehat** → reviewer Google voit du contenu clean
4. **Compte nouveau** → slate propre (l'ancien compte Fanovaly avait 2/3 strikes)

C'est l'approche "zone grise mesurée" — la même qui permet à `buy.fans` de tourner avec 13 annonces actives.
