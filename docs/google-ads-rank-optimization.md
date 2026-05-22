# Améliorer son Ad Rank Google Ads — Plan d'action Fanovera

> **Compte concerné** : Cartoonova (sous MCC Fanovera Manager). Compte fragile (post-Fanovaly). Ne PAS appliquer les sections marquées 🚫 risque ban.

## La formule Ad Rank (rappel rapide)

```
Ad Rank = CPC max × Quality Score + impact extensions + signaux contextuels
```

**3 leviers** sur lesquels on peut agir directement :
1. **Quality Score** (1-10) = Expected CTR × Ad Relevance × Landing Page Experience
2. **Extensions** (sitelinks, callouts, snippets) — gratuit, sous-exploité
3. **CPC max** — augmenter mécaniquement la position, mais détruit le ROAS si fait à l'aveugle

Le QS est multiplicatif, c'est donc lui qui a le plus d'effet. **Doubler son QS de 5 → 10 vaut autant que doubler son CPC.**

---

## P0 — Quick wins à faire cette semaine (impact immédiat)

### 1. Activer **toutes** les extensions disponibles

Google compte ça dans l'Ad Rank et chaque extension augmente la surface de clic. Sous-exploiter les extensions = laisser de l'AdRank gratuit sur la table.

- [ ] **Sitelinks** (4-6 minimum) → Voir `/instagram`, `/tiktok`, `/youtube`, `/promo`, `/comparer`, `/contact`
- [ ] **Callouts** (8-10 minimum) → "Livraison instantanée", "Support 24/7 FR", "Sans mot de passe", "Sécurisé Stripe", "Garantie 30 jours", "+15 ans d'expertise" (à adapter aux mémoires whitehat)
- [ ] **Structured snippets** → Header "Services" : Instagram, TikTok, YouTube, Spotify, Twitch, Twitter, Facebook, LinkedIn
- [ ] **Call extension** → ❌ Skip (pas de support téléphonique)
- [ ] **Lead form extension** → ❌ Skip (pas pertinent)
- [ ] **Image extensions** → ⚠️ Risque — utiliser uniquement des screenshots du dashboard, pas de profils tiers
- [ ] **Promotion extensions** → "-5% premier achat" / "Free trial 100 followers" (si l'offre existe)
- [ ] **Price extensions** → Lister 4-6 packs avec prix (10€/19€/49€/etc.)

**Effort** : 2h. **Gain typique** : +10-20% de CTR et +1-2 points de QS.

### 2. Atteindre "Ad Strength: Excellent" sur tes RSAs

Dans Google Ads, chaque RSA a un score "Ad Strength" (Poor / Average / Good / Excellent). **Atteindre Excellent multiplie tes impressions par ~2** (donnée Google interne 2024).

Checklist par RSA :
- [ ] **15 titres uniques** (max permis) — pas seulement des variations cosmétiques
- [ ] **4 descriptions uniques** (max permis)
- [ ] **Inclure le mot-clé principal** dans au moins 3 titres
- [ ] **Pin** uniquement les titres qui DOIVENT apparaître (sinon ça réduit les permutations testées)
- [ ] **Pas de répétition** entre titres (Google flag les similaires)
- [ ] **Inclure des chiffres** dans 2-3 titres (CTR +10-15% empiriquement)
- [ ] **Inclure une CTA forte** dans 2-3 titres ("Commencer", "Découvrir", "Tester", whitehat strict)

**À éviter ABSOLUMENT côté ads** (mémoire `feedback_ads_whitehat`) :
- ❌ "Buy", "Acheter" (déclencheur whitehat)
- ❌ Quantités explicites ("10 000 followers")
- ❌ "Cheap", "Pas cher", "Bon marché"
- ❌ Mentions de plateformes nominatives + verbe d'achat ("Buy Instagram followers")

**À privilégier** :
- ✅ "Growth", "Croissance", "Booster", "Visibilité"
- ✅ "Service professionnel", "Stratégie", "Optimisation"
- ✅ Mots forts non-déclencheurs : "Boost", "Scale", "Accelerate"

**Effort** : 3-4h. **Gain typique** : +30-50% d'impressions.

### 3. Optimiser la vitesse de `/promo` (Landing Page Experience)

Le QS Landing Page Experience pénalise les pages lentes. Cible : **LCP < 2.5s sur mobile**.

- [ ] Tester `/promo` et `/promo?lang=en` sur **PageSpeed Insights** (mobile)
- [ ] Score Performance > 90 sur mobile, > 95 sur desktop
- [ ] LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] Si fail : optimiser images (next/image avec priority sur LCP), précharger fonts, retirer JS bloquant

**Effort** : 2-4h selon état actuel. **Gain typique** : +1-2 points de QS si la page est lente.

### 4. Corréler mots-clés ↔ landing page ↔ titre RSA

Chaque ad group doit avoir **une cohérence thématique stricte** :

```
Ad group "Instagram Growth"
  ├─ Keywords: "instagram growth", "instagram audience", "boost instagram", ...
  ├─ RSA Title 1: "Instagram Growth Service"
  ├─ RSA Title 2: "Boost Your Instagram Audience"
  └─ Landing page: /promo?platform=instagram (header H1 mentionne "Instagram")
```

**Sans cohérence** → QS Ad Relevance s'effondre.

- [ ] Vérifier chaque ad group : le mot-clé principal apparaît dans 3+ titres de l'RSA ET dans le H1 de la LP
- [ ] Si tes 8 plateformes EN tirent sur la même LP `/promo?lang=en`, considérer **8 LPs spécifiques** (`/promo/instagram?lang=en`, etc.) — gain QS énorme

**Effort** : 4-6h (création des LPs dynamiques par plateforme). **Gain typique** : +2-3 points de QS.

---

## P1 — Cette quinzaine (impact moyen-terme)

### 5. Mots-clés négatifs systématiques

Les requêtes pourries qui matchent en broad mais convertissent à 0 = ad rank flingué (CTR bas → QS bas → adRank bas).

- [ ] Importer les CSV `Rapport sur les termes de recherche - EN/FR.csv` dans l'admin Search Terms (déjà fait par l'intégration)
- [ ] Tagger comme "negative candidates" tous les termes avec **0 conversion** ET **> 0.50€ de coût** (par ad group)
- [ ] Patterns récurrents à exclure d'office :
  - [ ] "free" / "gratuit" / "no payment"
  - [ ] "crack" / "hack" / "bot"
  - [ ] "panel" (les concurrents te shoppent souvent via "smm panel")
  - [ ] Noms de concurrents (smmraja, peakerr, bulkfollows, etc.)
  - [ ] Plateformes que tu ne sers pas (telegram, snapchat, etc.)

**Effort** : 1h/semaine en routine. **Gain typique** : +20-40% de CTR sur le restant.

### 6. Niveau d'enchères par device

Les conversions desktop vs mobile vs tablet sont très différentes en SMM (mobile dominant souvent).

- [ ] Activer le segment device dans Google Ads → analyser CPA par device sur 30j
- [ ] Si mobile a un CPA 50% meilleur que desktop : **+30% bid sur mobile**, **-30% sur desktop**
- [ ] Si tablet < 5% du trafic et CPA pourri : **-100% sur tablet** (excl)

**Effort** : 30 min. **Gain typique** : +10-20% efficacité budget.

### 7. Niveau d'enchères géographique

- [ ] Vérifier les pays/villes top performeurs (Google Ads → Locations → CPA par région)
- [ ] **Sur la campagne EN** : si US/UK/CA dominent, **-50% bid sur** les pays low-revenu (Inde, Pakistan, Philippines) ou **excl complètes**
- [ ] **Sur la campagne FR** : peut-être restreindre à France métropolitaine si DOM-TOM ont un CPA mauvais

**Effort** : 30 min. **Gain typique** : -20-40% CPA en filtrant le bas de gamme.

### 8. Ad Strength → vérifier les diagnostics individuellement

Pour chaque RSA "Average" ou en dessous, Google indique précisément ce qui manque :
- "Add more headlines" → en ajouter
- "Add more descriptions" → idem
- "Make headlines more unique" → reformuler
- "Include popular keywords" → ajouter le keyword principal

**Effort** : 1h. **Gain typique** : +1 niveau d'Ad Strength = +30-50% impressions.

### 9. Tester 2 RSAs par ad group (pas qu'une)

Google laisse jusqu'à **3 RSAs par ad group**. Avec 2-3 RSAs en compétition, Google teste plus de combos → plus de signal.

- [ ] Cloner ton RSA actuel en version "B" avec un angle différent (urgence vs bénéfice vs identité de marque)
- [ ] Laisser tourner 14 jours, garder le meilleur

**Effort** : 1h. **Gain typique** : +10-20% CTR du meilleur survivant.

---

## P2 — Ce mois-ci (gains structurels)

### 10. Resserrer la structure des ad groups

Règle d'or : **1 thème = 1 ad group = 1 LP dédiée**.

- [ ] Si "Instagram growth" et "Instagram followers" sont dans le même ad group, **les séparer** en 2 ad groups (chacun avec sa RSA et idéalement sa LP)
- [ ] Single Keyword Ad Groups (SKAG) — chaque mot-clé exact + son broad + son phrase ont leur ad group → QS de 9-10 facile, mais beaucoup de maintenance

**Trade-off** : SKAG = QS max mais charge de gestion 3-5×. Pour ton volume actuel (100€/jour) c'est probablement overkill. Mais quand tu scale > 500€/jour, **fait**.

**Effort** : 4-8h. **Gain typique** : +2-3 points de QS sur les groupes restructurés.

### 11. Audience targeting (observation, pas restriction)

- [ ] Ajouter des audiences en **observation** (pas restriction) : "in-market for marketing services", "small business owners", "social media users"
- [ ] Après 30 jours de data, voir lesquelles convertissent mieux → **bid + sur celles-là**
- [ ] Permet à Smart Bidding de mieux qualifier le trafic → CPA baisse

**Effort** : 30 min setup + 30 min/mois review. **Gain typique** : -10-15% CPA.

### 12. Remarketing list pour les non-convertisseurs

- [ ] Créer une liste "Visited /promo, did NOT purchase, 30 days" (déjà cookied via gtag déjà en place per mémoire `project_ads_tracking`)
- [ ] Campagne Display Remarketing dédiée avec budget limité (5-10€/jour)
- [ ] CPC bas, copies adaptées ("Tu hésitais ? -10% si tu finalises maintenant")
- [ ] Améliore l'Ad Rank de la campagne search principale car Google voit qu'on a un funnel qui convertit

**Effort** : 2h setup. **Gain typique** : +10-30% de conversions globales sur le canal Search (les retours convertissent mieux).

### 13. Conversion tracking + Smart Bidding

Le QS est aussi influencé par la **qualité des conversions remontées** à Google. Plus le signal est fort, mieux Smart Bidding optimise → meilleur Ad Rank dans les enchères qui comptent.

- [ ] **Enhanced Conversions** activées (déjà en place per mémoire `project_ads_tracking`)
- [ ] Vérifier que `purchase` event fire à 100% des achats (pas perdu en cas de redirect)
- [ ] Considérer une **2e conversion goal** : "Lead" (begin_checkout) en plus de "Purchase" — fournit plus de data pour Smart Bidding
- [ ] Stratégie d'enchère : **Maximize Conversions** au début (apprentissage), puis bascule sur **tROAS** (target ROAS) quand t'as 30+ conversions/mois

**Effort** : 1-2h. **Gain typique** : -20-40% CPA après 4 semaines d'apprentissage Smart Bidding.

### 14. Importer des conversions hors-ligne (offline conversions)

Game changer pour la qualité du signal :

- [ ] Quand un client refund → upload "negative conversion" à Google Ads via API
- [ ] Quand un client repurchase → upload "second purchase" comme conversion separate
- [ ] Smart Bidding apprend à éviter le trafic refundeur ET à favoriser le trafic repeat

L'intégration Google Ads existante a tout le pipeline pour le faire (gclid stocké, refund tracké). C'est ~3-4h de dev en plus.

**Effort** : 3-4h. **Gain typique** : -15-30% CPA sur 60 jours.

---

## P3 — Long terme / quand tu scale

### 15. Compte Google Ads "vétéran"

Google trust score de compte = **non-officiel mais réel**. Un compte qui :
- A 6+ mois d'historique propre
- N'a jamais eu de strike / suspension
- Maintient une qualité de trafic stable
- Spend régulier (pas de coupures brutales)

→ obtient des meilleurs prix à enchères égales.

**Action** : **dépenser un budget minimum constant** (même 5€/jour de baseline) pour pas que le compte "dorme". Et **ne pas changer brutalement** les paramètres tous les jours (Google flag l'instabilité).

### 16. Diversifier les types de campagnes

Quand tu maîtrises Search :
- [ ] **Performance Max** — budget séparé (commencer petit 10€/jour), laisser tourner 3 semaines minimum
- [ ] **Display Remarketing** (voir #12)
- [ ] **YouTube Discovery** si tu fais de la vidéo

Le mix de campagnes augmente la perception "marque sérieuse" par Google et améliore l'Ad Rank global du compte.

### 17. Backlinks + autorité de domaine

`fanovera.com` doit avoir une autorité de domaine respectable. Google scrute la **réputation du domaine** dans le QS Landing Page Experience.

- [ ] Vérifier le **DA (Domain Authority)** sur Moz / Ahrefs
- [ ] Si DA < 20 : campagne backlinks SEO (ne pas confondre avec PBN black-hat) — guest posts, articles invités sur sites SEO/marketing tech
- [ ] Profil GMB (Google My Business) actif et bien noté

**Effort** : ongoing. **Gain typique** : -10% CPA sur 6 mois quand le DA monte.

---

## 🚫 À NE PAS FAIRE (compte fragile)

| Action | Pourquoi pas | Risque |
|---|---|---|
| Mots-clés exact "buy followers", "10k subs cheap" | Déclenche le ML antifraude Google | Strike → ban |
| Annonces avec ces mots-clés visibles | Idem | Strike → ban |
| Cloaking (LP différente selon l'IP) | Détecté en < 24h par Google | Suspension immédiate |
| Acheter du trafic vers ta LP via autres canaux pour booster artificiellement le CTR | Google détecte les anomalies | Quality Score crash + flag |
| Modifier les params de campagne 10×/jour | "Erratic account behavior" | Smart Bidding cassé, QS volatile |
| Skip-conversions (essayer de pas remonter certaines convs à Google) | Smart Bidding mal nourri | CPA explose |
| Auto-pause/play les campagnes via scripts/API trop souvent | Pattern suspect | Flag automatique |

---

## Ordre d'attaque recommandé pour Fanovera (Cartoonova)

**Semaine 1** : #1 (Extensions) + #2 (Ad Strength Excellent) + #3 (LP Speed) — gains les plus rapides

**Semaine 2** : #4 (Cohérence mot-clé/LP) + #5 (Négatifs)

**Mois 1** : #6 (Device bids) + #7 (Geo bids) + #8 + #9 (Multi-RSA)

**Mois 2** : #10 (Restructure ad groups si nécessaire) + #11 (Audiences observation) + #13 (tROAS bidding)

**Mois 3+** : #12 (Remarketing) + #14 (Offline conversions) + #15 (Maintenir le compte stable)

---

## Métriques à surveiller dans l'admin Fanovera

Une fois le token Google approuvé, suivre dans `/admin/ads-roas` :

| Métrique | Cible | Action si hors cible |
|---|---|---|
| **Quality Score moyen** | ≥ 7/10 | Revoir #2 + #4 |
| **CTR moyen Search** | ≥ 4% | Revoir #1 + #2 |
| **CPC moyen** | ≤ 0.50€ (FR), ≤ 0.30€ (EN) | Si plus haut : QS trop bas |
| **Impression Share Lost (Rank)** | ≤ 30% | Si plus haut : Ad Rank insuffisant — booster CPC OU améliorer QS |
| **ROAS réel (LTV)** | ≥ 3× | Voir cohortes D7/D30 |
| **Refund rate par campagne** | ≤ 10% | Si plus haut : trafic toxique — exclure les termes/audiences |

---

## Liens utiles

- [Google Ads Ad Rank documentation officielle](https://support.google.com/google-ads/answer/1722122)
- [Quality Score factors](https://support.google.com/google-ads/answer/6167118)
- [PageSpeed Insights](https://pagespeed.web.dev/) — tester `/promo`
- Voir aussi `docs/google-ads-integration.md` pour le setup tracking
- Mémoires : `project_google_ads_strategy.md`, `feedback_ads_whitehat.md`, `project_fanovaly_history.md`
