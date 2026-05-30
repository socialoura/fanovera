# Concurrents Instagram — marché FR

Veille prix des concurrents B2C français sur Instagram. Prix relevés sur les
pages publiques. €/1k = prix ramené à 1000 unités (pour comparer les paliers).

> Dernière mise à jour : **2026-05-30**

> ⚠️ **Réseau de sites** : `lefollower.fr` et `followersgram.fr` affichent des
> prix réels identiques (2,99 / 4,49 / 6,99 / 10,99 € sur les premiers paliers).
> Très probablement le même opérateur derrière plusieurs marques — à confirmer
> au fur et à mesure des relevés.

## Concurrents identifiés (Instagram FR)

| Domaine | Plateforme tech | Prix capturés | Méthode de relevé |
|---|---|---|---|
| [followersgram.fr](https://followersgram.fr) | Custom PHP | ✅ oui | HTML (`data-amount`) |
| lefollower.fr | Next.js | ✅ oui | relevé manuel (rendu JS) |
| rehype.me | Next.js | ✅ oui | relevé manuel (rendu JS) |
| noniba.fr | WooCommerce | ✅ oui | HTML (`data-rules` du calculateur TM EPO) |
| propulse.me | Next.js | ⏳ à faire | rendu JS |
| deviral.fr | Custom | ✅ oui | relevé manuel |
| topfollowers.fr | Next.js | ⏳ à faire | rendu JS |
| insfamous.co | WooCommerce | ✅ (anglophone) | Store API |
| folami.fr | Hostinger Builder | ⏳ à faire | HTML |
| social-flare.com | Next.js | ⏳ à faire | rendu JS |

---

## Référence — Fanovera (toi)

Instagram followers, grille actuelle (table `pricing`, EUR) :

| Quantité | Prix | €/1k |
|---:|---:|---:|
| 100 | 0,99 € | 9,90 |
| 250 | 1,49 € | 5,96 |
| 500 | 2,49 € | 4,98 |
| 1 000 | 3,99 € | 3,99 |
| 5 000 | 14,99 € | 3,00 |
| 10 000 | 29,99 € | 3,00 |
| 20 000 | 54,99 € | 2,75 |
| 50 000 | 99,99 € | 2,00 |
| 100 000 | 169,99 € | 1,70 |
| 500 000 | 799,99 € | 1,60 |

---

## followersgram.fr

- **URL** : https://followersgram.fr/acheter-des-followers-instagram-pas-cher/
- **Tech** : site custom PHP (thème "hyper"), Cloudflare.
- **Relevé** : prix dans les attributs HTML `data-amount` (ex. `€2,99`),
  quantité dans `data-name`. Scrapable directement, sans navigateur headless.
- **Positionnement** : se présente comme *low-cost* ("...-pas-cher"). Deux
  gammes : **Standard** et **Premium**.

### Instagram Followers — Standard

| Quantité | Prix | €/1k |
|---:|---:|---:|
| 100 | 2,99 € | 29,90 |
| 250 | 4,49 € | 17,96 |
| 500 | 6,99 € | 13,98 |
| 750 | 8,99 € | 11,99 |
| 1 000 | 10,99 € | 10,99 |
| 2 500 | 19,90 € | 7,96 |
| 5 000 | 31,90 € | 6,38 |
| 7 500 | 41,90 € | 5,59 |
| 10 000 | 49,90 € | 4,99 |
| 25 000 | 89,90 € | 3,60 |
| 50 000 | 149,90 € | 3,00 |
| 100 000 | 229,90 € | 2,30 |
| 250 000 | 399,90 € | 1,60 |
| 500 000 | 599,90 € | 1,20 |
| 1 000 000 | 1 199,90 € | 1,20 |

### Instagram Followers — Premium

| Quantité | Prix | €/1k |
|---:|---:|---:|
| 50 | 3,29 € | 65,80 |
| 100 | 4,61 € | 46,10 |
| 250 | 6,80 € | 27,20 |
| 500 | 9,91 € | 19,82 |
| 750 | 13,07 € | 17,43 |
| 1 000 | 16,18 € | 16,18 |
| 2 000 | 26,13 € | 13,06 |
| 3 000 | 35,54 € | 11,85 |
| 4 000 | 44,94 € | 11,23 |
| 5 000 | 49,90 € | 9,98 |
| 7 500 | 59,90 € | 7,99 |
| 10 000 | 69,90 € | 6,99 |
| 25 000 | 119,90 € | 4,80 |
| 50 000 | 209,90 € | 4,20 |
| 100 000 | 349,90 € | 3,50 |
| 250 000 | 649,90 € | 2,60 |
| 500 000 | 1 210,90 € | 2,42 |
| 1 000 000 | 1 999,90 € | 2,00 |

### Écart vs Fanovera (Standard)

| Quantité | Fanovera | followersgram | Écart |
|---:|---:|---:|---:|
| 100 | 0,99 € | 2,99 € | 3,0× |
| 1 000 | 3,99 € | 10,99 € | 2,8× |
| 5 000 | 14,99 € | 31,90 € | 2,1× |
| 10 000 | 29,99 € | 49,90 € | 1,7× |
| 100 000 | 169,99 € | 229,90 € | 1,4× |

**Note** : followersgram se positionne *pas cher* et reste 2,8–3× au-dessus de
Fanovera sur les petits/moyens paliers → forte marge de hausse côté Fanovera.

---

## lefollower.fr

- **URL** : https://www.lefollower.fr/
- **Tech** : Next.js (rendu JS — prix non présents dans le HTML brut, relevés
  manuellement depuis la page rendue).
- **Mécanique commerciale** : **prix barré** (faux ancrage marketing, ex. 9 €)
  + **prix réel** affiché en dessous, et **quantité bonus offerte** ("+100
  GRATIS") sur les paliers ≥ 1 000. Palier 1 000 marqué *Populaire*.
- **⚠️ Prix réels identiques à followersgram.fr** → vraisemblablement le même
  opérateur.

### Instagram Followers

| Quantité | Prix barré | **Prix réel** | Bonus offert | €/1k (réel) |
|---:|---:|---:|---:|---:|
| 100 | 9 € | 2,99 € | — | 29,90 |
| 300 | 12 € | 4,49 € | — | 14,97 |
| 500 | 15 € | 6,99 € | — | 13,98 |
| 1 000 | 25 € | 10,99 € | +100 *(Populaire)* | 10,99 |
| 2 000 | 39 € | 18,49 € | +200 | 9,25 |
| 5 000 | 69 € | 33,49 € | +500 | 6,70 |
| 10 000 | 109 € | 51,99 € | +1 000 | 5,20 |
| 20 000 | 179 € | 86,99 € | +2 000 | 4,35 |
| 50 000 | 329 € | 158,99 € | +5 000 | 3,18 |

### Écart vs Fanovera

| Quantité | Fanovera | lefollower (réel) | Écart |
|---:|---:|---:|---:|
| 100 | 0,99 € | 2,99 € | 3,0× |
| 1 000 | 3,99 € | 10,99 € | 2,8× |
| 5 000 | 14,99 € | 33,49 € | 2,2× |
| 10 000 | 29,99 € | 51,99 € | 1,7× |
| 50 000 | 99,99 € | 158,99 € | 1,6× |

---

## rehype.me

- **URL** : https://www.rehype.me/fr/i/
- **Tech** : Next.js (rendu JS — relevé manuel).
- **Mécanique commerciale** : **faux rabais permanent** (-50 % à -75 % affiché,
  prix barré = simplement ×2 du prix réel). Quantités exprimées en bonus
  ("+500", "+1000"…). Palier 1 000 marqué *Le plus populaire*. Option *Custom*.
- **Positionnement prix** : nettement **moins cher** que followersgram /
  lefollower → concurrent le plus agressif relevé jusqu'ici.

### Instagram Followers

| Quantité | Prix barré | **Prix réel** | €/1k |
|---:|---:|---:|---:|
| 500 | 5,80 € | 2,90 € | 5,80 |
| 1 000 | 11,80 € | 5,90 € *(Le plus populaire)* | 5,90 |
| 2 500 | 22,00 € | 9,90 € | 3,96 |
| 5 000 | 44,00 € | 19,80 € | 3,96 |
| 10 000 | 99,50 € | 39,80 € | 3,98 |
| 20 000 | 199,00 € | 79,60 € | 3,98 |
| 35 000 | 490,00 € | 122,50 € | 3,50 |
| 50 000 | 700,00 € | 175,00 € | 3,50 |

### Écart vs Fanovera

| Quantité | Fanovera | rehype (réel) | Écart |
|---:|---:|---:|---:|
| 1 000 | 3,99 € | 5,90 € | 1,5× |
| 5 000 | 14,99 € | 19,80 € | 1,3× |
| 10 000 | 29,99 € | 39,80 € | 1,3× |
| 50 000 | 99,99 € | 175,00 € | 1,8× |

---

## noniba.fr

- **URL** : https://noniba.fr/acheter-des-followers-instagram/
- **Tech** : WooCommerce + plugin **TM Extra Product Options** (calculateur).
- **Relevé** : prix planqués dans l'attribut HTML `data-rules` du calculateur
  (l'API Store renvoie `price=0`). **Scrapable directement**, sans navigateur
  headless — il suffit de parser le JSON de `data-rules`.
- **Positionnement** : prix médian (entre rehype et followersgram).

### Instagram Followers

| Quantité | Prix | €/1k |
|---:|---:|---:|
| 250 | 2,50 € | 10,00 |
| 500 | 3,90 € | 7,80 |
| 1 000 | 7,00 € | 7,00 |
| 2 000 | 12,00 € | 6,00 |
| 5 000 | 30,00 € | 6,00 |
| 10 000 | 55,00 € | 5,50 |
| 20 000 | 100,00 € | 5,00 |
| 50 000 | 220,00 € | 4,40 |
| 100 000 | 400,00 € | 4,00 |

### Écart vs Fanovera

| Quantité | Fanovera | noniba | Écart |
|---:|---:|---:|---:|
| 500 | 2,49 € | 3,90 € | 1,6× |
| 1 000 | 3,99 € | 7,00 € | 1,8× |
| 5 000 | 14,99 € | 30,00 € | 2,0× |
| 10 000 | 29,99 € | 55,00 € | 1,8× |
| 50 000 | 99,99 € | 220,00 € | 2,2× |

---

## deviral.fr

- **URL** : https://www.deviral.fr/instagram/follower/
- **Tech** : site custom.
- **Mécanique commerciale** : quantité bonus offerte ("+10 gratuits"). Gamme
  plafonnée à 1 000 followers (pas de gros volumes affichés).
- **⚠️ Positionnement PREMIUM / outlier** : ~10× plus cher que noniba, ~25× plus
  cher que Fanovera. Ne joue pas la guerre des prix — vise probablement les
  "vrais abonnés FR de qualité". À traiter à part dans toute analyse de médiane.

### Instagram Followers

| Quantité | Bonus | Prix | €/1k |
|---:|---:|---:|---:|
| 25 | +3 | 4,89 € | 195,60 |
| 50 | +5 | 6,89 € | 137,80 |
| 100 | +10 | 12,89 € | 128,90 |
| 250 | +25 | 26,89 € | 107,56 |
| 500 | +50 | 51,89 € | 103,78 |
| 1 000 | +100 | 98,89 € | 98,89 |

### Écart vs Fanovera

| Quantité | Fanovera | deviral | Écart |
|---:|---:|---:|---:|
| 100 | 0,99 € | 12,89 € | 13,0× |
| 250 | 1,49 € | 26,89 € | 18,0× |
| 500 | 2,49 € | 51,89 € | 20,8× |
| 1 000 | 3,99 € | 98,89 € | 24,8× |
