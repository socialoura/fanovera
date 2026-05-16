# Day 2 — Actions Google Ads (17 mai 2026)

Basé sur le rapport search terms du 16/05 (J1).
**Bilan J1** : 33,15 € dépensés / 4 conv / CPA 8,29 € → 82% du budget gaspillé sur des termes hors intent.

---

## 🚨 PRIORITÉ 1 — Ajouter mots-clés négatifs (30 min)

### Liste à coller dans Google Ads (négatifs au niveau compte)

**Type : Expression exacte (sauf si indiqué)**

#### Intent "tracker / counter / viewer"
```
tracker
track
count
counter
viewer
monitor
"real time"
"live count"
"recent follow"
"follower count"
"compteur abonné"
```

#### Intent "gratuit / free / outil"
```
gratuit
gratuitement
free
apk
generator
"give me"
download
```

#### Intent organique (conseils / "comment faire")
```
"how to"
"what time"
"best time"
"best bio"
"in 5 minutes"
"post on"
"good times"
```

#### Concurrents / brands à exclure
```
inflact
zefoy
viewstats
appsolo
"navi follow"
navifollow
singtip
buff
"buff follow"
fbsub
"top followers"
"tech crusader"
```

#### Botting (incompatible avec positionnement clean)
```
viewbot
viewbotter
viewbotting
```

**→ Gain estimé : 4 à 6 €/jour récupérés**

---

## 🚨 PRIORITÉ 2 — Promouvoir les winners EN (15 min)

Vérifier que ces mots-clés sont en **mot clé exact ajouté** (pas variante proche) et augmenter leur bid de 15-20% :

| Keyword | CPA J1 | Action |
|---|---|---|
| `tiktok followers` | 1,78 € | Bid +20%, exact strict |
| `buy tiktok followers` | 1,19 € | Passer en exact ajouté |
| `instagram followers cheap` | 1,79 € | ✓ Déjà ajouté, bid +15% |
| `urmaritori instagram` | 1,20 € | **AJOUTER** (roumain "followers", convertit) |

---

## 🚨 PRIORITÉ 3 — Audit campagne FR (1h)

**Symptôme** : 0 conversion sur ~9 € dépensés J1, alors que les requêtes FR matchées étaient de bon intent (`acheter abo tiktok`, `acheter abonnés tiktok`, etc.).

### Checklist

- [ ] Ouvrir LP `/promo` en navigation privée depuis IP française
- [ ] Vérifier que les prix affichent **EUR** (pas GBP/USD à cause du bug devise)
- [ ] Tester un parcours d'achat complet jusqu'au Stripe checkout
- [ ] Vérifier dans Google Ads → Conversions que `purchase` et `begin_checkout` se déclenchent (Tag Assistant)
- [ ] Vérifier le ciblage géo de la campagne FR (France uniquement, pas EU large)
- [ ] Regarder si la requête EN `buy tiktok followers` matche encore sur la campagne FR (2,36 € gaspillés J1)

**Décision après J3** :
- Si toujours 0 conv FR avec >5 clics qualifiés → baisser daily budget de 50% le temps de fixer la LP
- Si conv arrivent → maintenir ou augmenter

---

## 🚨 PRIORITÉ 4 — Vérifier le bug devise sur LP (30 min)

Lien direct avec le bug que tu as eu sur les commandes : si la LP affiche les prix dans une mauvaise devise selon la géo du visiteur, tu perds des conversions.

- [ ] Tester en VPN US, FR, UK, BR → vérifier devise affichée + symbole
- [ ] Vérifier que le `country` détecté côté front matche bien la géo réelle
- [ ] Si bug détecté → fix prioritaire AVANT de scale les pubs

---

## 🚨 PRIORITÉ 5 — Préparer suivi J2 (5 min)

À 22h ce soir, exporter le nouveau rapport search terms et comparer :

| KPI | J1 (16/05) | Cible J2 |
|---|---|---|
| CPA global | 8,29 € | < 6,00 € |
| % budget converti | 18 % | > 35 % |
| Wasters > 1€ | 8 termes | 0 |
| Conv FR | 0 | ≥ 1 |

---

## Suivi des actions

- [ ] P1 — Négatifs ajoutés au compte
- [ ] P2 — Winners promus + `urmaritori instagram` ajouté
- [ ] P3 — Audit FR fait
- [ ] P4 — Bug devise LP vérifié/fixé
- [ ] P5 — Rapport J2 récupéré et comparé

---

## Notes / signaux faibles

- **`urmaritori instagram`** : 1 conv à 1,20€ — terme roumain. Possible niche peu concurrentielle à exploiter (tester `urmaritori tiktok`, etc.)
- Beaucoup de "Variante proche" remontent sans convertir — envisager de passer plus de keywords en exact strict (ou tester DSA plus tard)
- CTR 12,90 % est solide → les annonces marchent, le problème est le ciblage des termes
