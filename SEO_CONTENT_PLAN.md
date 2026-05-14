# Plan SEO Content - Fanovera

> Plan exécutable pour 6.1 (vs competitors), 6.3 (programmatique longtail), 6.5 (blog niches).
> Aucune ligne de code n'est implémentée tant que tu n'as pas validé la structure et les tone guidelines ci-dessous.

---

## Pré-requis transverses

### Tone of voice (à respecter sur TOUTES les pages SEO)
- **Honnête** : ne jamais promettre un résultat impossible. Quand on dit "10 000 abonnés", on précise *de la nature* du service (followers ciblés vs non-ciblés, durée moyenne de rétention si on l'a, etc.).
- **Comparatif factuel** : prix, délais, support, mots de passe demandés ou non. Pas d'attaque marketing du concurrent.
- **CTA unique** : un seul lien primaire par page (vers `/instagram`, `/tiktok`... selon le contexte).

### Schema.org & SEO technique
- Toutes les pages 6.1 + 6.3 doivent avoir : `<title>`, `<meta description>` (≤160 char), `<h1>` unique, breadcrumb JSON-LD, FAQ schema si bloc FAQ.
- URL slug en kebab-case sans accents (les routes Next existantes ne supportent pas les accents proprement).
- Sitemap.xml à régénérer après chaque batch publié.
- 1 image hero unique par page (poids < 80 KB, format WebP).

### Stratégie de maillage interne
- Pages 6.1/6.3/6.5 → liens vers `/instagram`, `/tiktok`, `/youtube`... (pages produit) et vers `/roi` (calculateur).
- Footer global → ajouter section "Comparatifs" et "Blog" quand ≥ 3 pages publiées.

---

## 6.1 - Pages comparatives "Fanovera vs X"

### Concurrents prioritaires (FR + EN)
1. **TopFollowers** (cité par toi)
2. **Buzzoid** (gros volume EN, cible IG)
3. **Famoid** (présence FR moyenne, cible IG/TikTok)
4. **SocialBuy** (cible multi-réseaux)
5. **SocialPros** (concurrent direct sur le SEO français)

### Structure de page (template)
- **URL** : `/compare/fanovera-vs-{slug}` (ex: `fanovera-vs-topfollowers`)
- **H1** : "Fanovera vs {Competitor} : comparatif {année}"
- **Hero** : 2 cartes côte à côte (logo, note moyenne, prix d'entrée, délai)
- **Tableau comparatif (8 lignes)** :
  - Prix d'entrée (pack 100 followers)
  - Délai de livraison
  - Mot de passe demandé ?
  - Apple Pay / Google Pay
  - Service client (langues, horaires)
  - Garantie remboursement
  - Méthode (drip-feed / instant)
  - Support multi-plateformes (combien)
- **Section "À choisir si..."** : 2 paragraphes neutres (cas d'usage Fanovera, cas d'usage où le concurrent peut convenir)
- **FAQ** : 4 questions ciblées sur la comparaison
- **CTA** : `/instagram` (bouton primaire)

### Charge de travail estimée
- **Recherche par concurrent** : 30-45min (extraire prix, délais, T&C, lire 10 avis Trustpilot)
- **Rédaction** : 1h (2200-2800 mots)
- **Intégration code** : 15min (page MDX ou TSX statique)
- **Total par page** : ~2h
- **Total 5 pages** : ~10h

### Risques honnêtes
- Les concurrents peuvent changer leurs prix → page périme vite. Prévoir un re-audit trimestriel ou intégrer un disclaimer "Données vérifiées le {date}".
- Comparatif négatif → risque DMCA si tu cites mal. Fact-check obligatoire.
- Honnêtement, **les pages "vs concurrent" performent bien** mais elles attirent des recherches comparatives (intention basse) — ne pas en attendre du trafic top-funnel massif.

---

## 6.3 - Longtail programmatique (120 pages)

### Schéma combinatoire
**8 plateformes × 5 volumes × 3 intentions = 120 pages**

- **Plateformes** : instagram, tiktok, youtube, spotify, facebook, twitter, twitch, linkedin
- **Volumes** : 100, 500, 1000, 5000, 10000
- **Intentions** :
  - `acheter` (commercial pure)
  - `obtenir` (orienté méthode/résultat)
  - `gagner` (orienté audience croissance)

### URL pattern
`/{intention}-{volume}-abonnes-{platform}`
Exemples :
- `/acheter-1000-abonnes-instagram`
- `/obtenir-500-followers-tiktok`
- `/gagner-10000-abonnes-youtube`

> ⚠️ Note : "abonnés" / "followers" varie selon plateforme. Dictionnaire de mapping nécessaire (followers pour IG/TikTok/X/Twitch, abonnés pour YouTube/LinkedIn, auditeurs pour Spotify, fans pour Facebook).

### Structure de page (template programmatique)
Chaque page partage un même squelette mais varie les blocs dynamiques :
1. **H1 dynamique** : "{Intention capitalize} {Volume formaté} {terme} {Platform}"
2. **Sous-titre** : phrase courte avec délai ("Livré en 1-6 h, sans mot de passe")
3. **Pack pré-sélectionné** : pousse vers la page produit avec query string `?pack={index}`
4. **Section "Pourquoi ce volume ?"** : 150 mots adaptés au volume (100 = test, 1000 = palier social, 10000 = palier crédibilité)
5. **3 témoignages plateforme-spécifiques** (réutiliser les copies existantes via `i18n.ts`)
6. **FAQ** : 3 questions ciblées intention/volume

### Quality control - À VÉRIFIER (selon ton tag)
**Le risque #1 du programmatique : duplicate content / thin content qui fait tomber le domaine entier.**

Mes garde-fous recommandés :
- **Texte unique par page ≥ 800 mots** (pas seulement template + variables)
- **3 paragraphes 100% custom par page** (intro, "pourquoi ce volume", conclusion)
- **Pas d'indexation initiale** : déployer en `noindex` puis lever par batch de 20 quand validé manuellement
- **Audit Search Console mensuel** : si CTR < 1% sur > 30 jours, désindexer
- **Limite à 60 pages au lancement** (3 plateformes prioritaires × 5 volumes × 3 intentions plutôt que 8×5×3 d'un coup)

### Charge de travail estimée
- **Setup template Next.js** (route dynamique `[...slug]` + génération statique) : 4h
- **Rédaction des 3 paragraphes uniques par page** : 25min × 60 = 25h
- **QA / vérification noindex levé progressivement** : 5h/mois sur 3 mois
- **Total démarrage** : ~30h

### Honnêtement
- 120 pages d'un coup = **risque algorithmique élevé** (Google Helpful Content Update 2023+ pénalise lourdement le programmatique mou).
- Recommandation : **commencer par 30 pages vraiment travaillées** plutôt que 120 mediocres. Mesurer pendant 60 jours avant d'étendre.
- Si tu veux tester l'idée vite, je peux livrer 6 pages exemplaires (1 par intention × 2 volumes Instagram) en ~6h, puis tu décides.

---

## 6.5 - Blog niche (1 article fond / mois)

### 12 sujets briefés (rotation 12 mois)

| # | Sujet (titre travaillé) | Keyword cible | Mots | Angle différenciant |
|---|-------------------------|---------------|------|---------------------|
| 1 | Comment l'algorithme Instagram traite les nouveaux abonnés en 2026 | algorithme instagram abonnés | 2200 | Cite la doc Meta + tests A/B publics |
| 2 | Spotify monthly listeners vs followers : ce qui compte vraiment | spotify monthly listeners followers | 1800 | Données from Chartmetric/Soundcharts |
| 3 | Pourquoi la moitié des followers TikTok deviennent inactifs en 6 mois | rétention followers tiktok | 2000 | Analyse cohorte + recommandations |
| 4 | YouTube Shorts vs TikTok : où poster d'abord en 2026 ? | youtube shorts vs tiktok | 2400 | Comparatif données engagement |
| 5 | Twitter / X : la vérification payante change-t-elle l'engagement ? | x premium engagement | 1600 | Données API X publique |
| 6 | LinkedIn creator mode : qui devrait l'activer (et qui pas) | linkedin creator mode | 1800 | Cas d'usage B2B vs B2C |
| 7 | Twitch followers vs subs vs viewers : le vrai KPI | kpi twitch streamer | 2000 | Data Sullygnome + interviews |
| 8 | Facebook Pages : pourquoi le reach organique est mort (et que faire) | reach organique facebook | 2200 | Historique 2018-2026 |
| 9 | Combien coûte vraiment 10 000 followers Instagram en 2026 | coût acquisition instagram | 2000 | Lien direct vers `/roi` |
| 10 | Les 7 biais cognitifs derrière la course aux followers | psychologie followers réseaux | 1800 | Angle déontologique, contre-pied |
| 11 | Comment Spotify détecte les streams non-organiques (et comment vendre quand même) | spotify détection bots | 1700 | Doc technique Spotify for Artists |
| 12 | Étude Fanovera : nous avons analysé 50 000 commandes en 12 mois | étude croissance réseaux sociaux | 2500 | Données propriétaires anonymisées |

### Structure d'article (template)
- Hero image (custom OR Unsplash crédité)
- TL;DR de 5 lignes
- Sommaire ancres
- 5-7 sections H2
- 1 graphique data minimum (Recharts ou image)
- 3 sources externes citées avec liens
- Bio courte de l'auteur (signe de E-E-A-T)
- Bloc CTA bas : `/roi` ou plateforme concernée

### Charge de travail
- **Recherche + rédaction** : 6-8h par article
- **Mise en page + assets** : 2h
- **SEO + maillage** : 1h
- **Total par article** : ~10h, soit 120h/an

### Honnêtement
- Le blog est le **levier le plus rentable à long terme** (12 articles bien faits > 120 pages programmatiques moyennes)
- Le sujet #12 (étude propriétaire) est **le plus puissant** : ça génère du backlink naturel. À programmer pour le mois 6 quand tu as la donnée.

---

## Priorisation recommandée (3 mois)

### Mois 1
- Publier **2 pages 6.1** (vs TopFollowers + vs Buzzoid)
- Publier **1 article 6.5** (sujet #1 ou #9)
- Setup template programmatique 6.3 (sans publier)

### Mois 2
- Publier **2 pages 6.1** (vs Famoid + vs SocialBuy)
- Publier **1 article 6.5** (sujet #4 ou #2)
- Publier **15 pages 6.3 sur Instagram** (3 volumes × 3 intentions × 1 plateforme + 6 fillers Instagram), en `noindex` puis levée progressive

### Mois 3
- Publier **1 page 6.1** (vs SocialPros)
- Publier **1 article 6.5** (sujet #7 ou #11)
- Étendre **6.3 à TikTok** (15 pages supplémentaires) si signaux Search Console positifs sur le batch IG

**Total mois 1-3** : 5 pages comparatives + 3 articles fond + 30 pages programmatiques contrôlées = ~70-80h de travail rédactionnel.

---

## Ce qui n'est PAS dans ce plan (à clarifier si besoin)

- **Localisation EN** : tout le plan ci-dessus est FR-first. Une copie EN doublera la charge mais multipliera l'audience par ~5x.
- **Backlinks** : aucune stratégie outreach proposée ici (digital PR, guest posts). Sans ça, le programmatique aura du mal à ranker.
- **Mesures de succès** : à définir en amont (sessions organiques, conversions de chaque page, position moyenne keyword X). Sinon difficile de juger.

---

*Plan rédigé pour validation. Aucun code écrit avant ton OK sur la structure 6.1 / 6.3 / 6.5.*
