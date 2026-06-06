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
- **Whitehat** : keywords propres, drop & retry si refus policy, jamais d'exemption forcée (compte fragile, 1 strike = ban).
- **Paiement** : surveiller les déclins carte sur 🇧🇷 Brésil · 🇲🇽 Mexique · 🇹🇷 Turquie (historique de déclins sur gros paniers internationaux ; AR/CL/CO déjà retirés pour cette raison).
