/**
 * Comparison data for /comparer/[concurrent] long-tail SEO pages.
 *
 * Each entry is a deliberately neutral, fact-based comparison aimed at
 * users actively searching for "fanovera vs X" or "alternative à X".
 * Honest framing > over-the-top claims (which both Google and visitors
 * penalize). The "criteriaScores" matrix drives the comparison table —
 * each criterion is rated 1..5 for the competitor, and Fanovera's own
 * scores live in `FANOVERA_SCORES` so we can update them centrally.
 *
 * Adding a new competitor is an O(1) operation: just append a new entry.
 * The dynamic route auto-picks it up + the sitemap regenerates.
 */

export type ComparerLocale = "fr" | "en";

export type ComparerScores = {
  pricing: number;       // /5 — value for money
  speed: number;         // /5 — delivery speed
  quality: number;       // /5 — natural-looking accounts
  trust: number;         // /5 — public trust signals
  payments: number;      // /5 — checkout UX
  support: number;       // /5 — responsiveness
  uiClarity: number;     // /5 — clarity of the order flow
  refunds: number;       // /5 — refund policy
};

export type ComparerEntry = {
  /** URL slug (kebab-case). */
  slug: string;
  /** Display name of the competitor. */
  name: string;
  /** Marketing tagline (short, fact-based). */
  tagline: { fr: string; en: string };
  /** Two-paragraph honest pros/cons. */
  description: { fr: string; en: string };
  /** Public website (used for the cite reference, not as a link). */
  website?: string;
  /** Year founded (rough estimate is OK — it's not a tax form). */
  foundedYear?: number;
  /** Quantitative scores. */
  scores: ComparerScores;
  /** Bullet points where Fanovera is strictly better. */
  fanoveraWins: { fr: string[]; en: string[] };
  /** Bullet points where the competitor is genuinely better — keep it honest. */
  competitorWins: { fr: string[]; en: string[] };
  /** Suggested verdict. */
  verdict: { fr: string; en: string };
};

/** Fanovera's own scores — used as the right-hand column of every comparison. */
export const FANOVERA_SCORES: ComparerScores = {
  pricing: 4,
  speed: 5,
  quality: 4,
  trust: 4,
  payments: 5,
  support: 4,
  uiClarity: 5,
  refunds: 4,
};

export const FANOVERA_TAGLINE = {
  fr: "Boost transparent, paiement Stripe, livraison 1-6 h, sans accès au compte.",
  en: "Transparent boost, Stripe payments, 1-6 h delivery, no account access required.",
};

export const COMPETITORS: ComparerEntry[] = [
  {
    slug: "bulkfollows",
    name: "BulkFollows",
    website: "bulkfollows.com",
    foundedYear: 2014,
    tagline: {
      fr: "L'un des plus anciens panneaux SMM en gros, conçu pour les revendeurs B2B.",
      en: "One of the oldest wholesale SMM panels, built for B2B resellers.",
    },
    description: {
      fr: "BulkFollows est un panel SMM en gros, principalement utilisé par des revendeurs qui placent leurs propres commandes via API. L'interface est dense, en anglais, et suppose une connaissance technique. Pour un créateur final qui veut juste booster son compte sans s'occuper d'API, c'est une expérience rugueuse.",
      en: "BulkFollows is a wholesale SMM panel mainly used by resellers placing their own orders via API. The interface is dense, English-only, and assumes technical knowledge. For an end creator who just wants to boost their account without managing APIs, the experience is rough.",
    },
    scores: { pricing: 5, speed: 4, quality: 3, trust: 3, payments: 2, support: 3, uiClarity: 2, refunds: 2 },
    fanoveraWins: {
      fr: [
        "Interface en français adaptée aux créateurs (pas aux revendeurs).",
        "Paiement Stripe + Apple Pay + Google Pay au lieu de crypto/wire.",
        "Suivi de commande visuel (barre de progression, ETA).",
        "Tarifs en EUR/USD/GBP automatiques, pas de conversion manuelle.",
      ],
      en: [
        "Creator-first French/English UI (not wholesaler-oriented).",
        "Stripe + Apple Pay + Google Pay checkout instead of crypto/wire transfer.",
        "Visual order tracking (progress bar, ETA).",
        "Auto EUR/USD/GBP pricing — no manual currency conversion.",
      ],
    },
    competitorWins: {
      fr: [
        "Tarifs au volume légèrement inférieurs si vous gérez vos propres campagnes.",
        "API publique documentée pour intégrer dans vos propres outils.",
      ],
      en: [
        "Slightly lower volume pricing if you run your own campaigns.",
        "Public API documentation for integrating into your own tools.",
      ],
    },
    verdict: {
      fr: "BulkFollows est conçu pour les agences et revendeurs. Si vous êtes un créateur qui veut un boost net en quelques clics, Fanovera est plus adapté.",
      en: "BulkFollows is built for agencies and resellers. If you're a creator who wants a clean boost in a few clicks, Fanovera fits better.",
    },
  },
  {
    slug: "peakerr",
    name: "Peakerr",
    website: "peakerr.com",
    foundedYear: 2018,
    tagline: {
      fr: "Panneau SMM populaire chez les revendeurs, large catalogue de services.",
      en: "Popular SMM panel among resellers, with a wide service catalogue.",
    },
    description: {
      fr: "Peakerr propose un catalogue très large (Instagram, TikTok, YouTube, Telegram, etc.) avec des tarifs compétitifs. Le checkout reste cependant orienté agences : dépôts à recharger, devises crypto, peu d'accompagnement utilisateur. Le suivi de commande est minimaliste.",
      en: "Peakerr offers a very wide catalogue (Instagram, TikTok, YouTube, Telegram, etc.) with competitive pricing. The checkout is still agency-oriented: top-up deposits, crypto currencies, little end-user guidance. Order tracking is minimal.",
    },
    scores: { pricing: 5, speed: 4, quality: 3, trust: 3, payments: 2, support: 3, uiClarity: 2, refunds: 3 },
    fanoveraWins: {
      fr: [
        "Achat à l'unité — pas de dépôt minimum à recharger.",
        "Paiement carte bancaire instantané, pas de crypto requise.",
        "Email de confirmation et suivi en direct, pas seulement un order ID.",
        "Aucun accès au mot de passe ni connexion à votre compte.",
      ],
      en: [
        "Pay per order — no minimum top-up deposit.",
        "Instant card payment, no crypto required.",
        "Confirmation email + live tracking, not just an order ID.",
        "Never asks for your password or account login.",
      ],
    },
    competitorWins: {
      fr: [
        "Catalogue plus large (Telegram, Discord, mailings, etc.).",
        "Tarifs au volume très bas pour les très grandes commandes.",
      ],
      en: [
        "Wider catalogue (Telegram, Discord, mass-mail, etc.).",
        "Very low volume pricing for huge orders.",
      ],
    },
    verdict: {
      fr: "Peakerr est intéressant pour qui place plusieurs centaines de commandes par mois. Pour une campagne ponctuelle simple, Fanovera est plus rapide à utiliser.",
      en: "Peakerr is interesting if you place hundreds of orders per month. For a one-off, simple campaign, Fanovera is faster to use.",
    },
  },
  {
    slug: "smmraja",
    name: "SMMRaja",
    website: "smmraja.com",
    foundedYear: 2017,
    tagline: {
      fr: "Panneau SMM low-cost basé en Inde, populaire pour les très gros volumes.",
      en: "Low-cost SMM panel based in India, popular for very large volumes.",
    },
    description: {
      fr: "SMMRaja affiche les tarifs les plus bas du marché — c'est sa principale proposition de valeur. En contrepartie, la qualité des comptes est variable, le support est limité aux heures asiatiques, et la conformité aux règles européennes (RGPD, paiements) est minimale. Réservé aux usagers techniques.",
      en: "SMMRaja advertises the lowest prices on the market — that's its main value proposition. The trade-off: account quality varies, support hours are Asian-only, and compliance with European rules (GDPR, payments) is minimal. Suited to technical users only.",
    },
    scores: { pricing: 5, speed: 3, quality: 2, trust: 2, payments: 2, support: 2, uiClarity: 2, refunds: 2 },
    fanoveraWins: {
      fr: [
        "Conformité RGPD + facturation européenne propre.",
        "Comptes audités quotidiennement contre les bots évidents.",
        "Support en français aux heures européennes (CET).",
        "Politique de remboursement claire publiée sur le site.",
      ],
      en: [
        "GDPR compliant with proper European invoicing.",
        "Accounts audited daily against obvious bots.",
        "French-speaking support during European hours (CET).",
        "Clear refund policy published on the site.",
      ],
    },
    competitorWins: {
      fr: [
        "Prix au volume parmi les plus bas du marché.",
        "Catalogue de services exotiques (réseaux peu connus).",
      ],
      en: [
        "Volume pricing among the lowest in the market.",
        "Catalogue of exotic services (lesser-known networks).",
      ],
    },
    verdict: {
      fr: "Si vous cherchez le tarif le plus bas et acceptez le compromis qualité/conformité, SMMRaja est une option. Pour une marque européenne qui veut un service propre, Fanovera est plus aligné.",
      en: "If you're chasing the lowest price and accept the quality/compliance trade-off, SMMRaja is an option. For a European brand that wants a clean service, Fanovera is more aligned.",
    },
  },
  {
    slug: "justanotherpanel",
    name: "JustAnotherPanel",
    website: "justanotherpanel.com",
    foundedYear: 2013,
    tagline: {
      fr: "L'un des panneaux SMM les plus connus, alias 'JAP'.",
      en: "One of the best-known SMM panels, aka 'JAP'.",
    },
    description: {
      fr: "JustAnotherPanel (JAP) est une référence historique du SMM, utilisée par des milliers de revendeurs. L'expérience est conçue pour eux : dashboard dense, dépôt prépayé, jargon technique. Pour un client final, l'absence de guidage et de paiement Stripe rend l'achat moins fluide.",
      en: "JustAnotherPanel (JAP) is a historic reference in SMM, used by thousands of resellers. The experience is built for them: dense dashboard, prepaid balance, technical jargon. For an end customer, the lack of guidance and Stripe checkout makes buying less smooth.",
    },
    scores: { pricing: 4, speed: 4, quality: 3, trust: 3, payments: 2, support: 3, uiClarity: 2, refunds: 3 },
    fanoveraWins: {
      fr: [
        "Pas de balance prépayée — payez exactement le montant de votre commande.",
        "Workflow en 3 étapes claires plutôt qu'un dashboard à 50 onglets.",
        "Calcul automatique du prix incluant TVA selon votre pays.",
        "Communication 100 % en français pour le marché européen.",
      ],
      en: [
        "No prepaid balance — pay exactly the amount of your order.",
        "3-step clear workflow instead of a 50-tab dashboard.",
        "Auto VAT-inclusive pricing based on your country.",
        "Communication 100% in French for the European market.",
      ],
    },
    competitorWins: {
      fr: [
        "Choix de services et fournisseurs énorme (idéal pour un revendeur).",
        "API mature et documentée pour automatisation.",
      ],
      en: [
        "Huge selection of services and providers (ideal for a reseller).",
        "Mature, documented API for automation.",
      ],
    },
    verdict: {
      fr: "JAP est imbattable si vous gérez vos propres campagnes via API. Pour un boost ponctuel sans bricolage technique, Fanovera est plus simple.",
      en: "JAP is unbeatable if you run your own campaigns via API. For a one-off boost without technical fiddling, Fanovera is simpler.",
    },
  },
  {
    slug: "growthoid",
    name: "Growthoid",
    website: "growthoid.com",
    foundedYear: 2018,
    tagline: {
      fr: "Service de growth Instagram avec gestion humaine du compte.",
      en: "Instagram growth service with hands-on human account management.",
    },
    description: {
      fr: "Growthoid utilise une approche différente : une équipe gère votre compte Instagram pendant des mois pour attirer de vrais abonnés via interactions ciblées. Cela demande de partager vos identifiants Instagram et un abonnement mensuel à 49-99 $. Approche plus organique mais beaucoup plus lente et coûteuse à long terme.",
      en: "Growthoid takes a different approach: a team manages your Instagram account for months to attract real followers via targeted interactions. It requires sharing your Instagram credentials and a monthly subscription of $49-99. More organic, but much slower and pricier long-term.",
    },
    scores: { pricing: 2, speed: 2, quality: 4, trust: 3, payments: 4, support: 4, uiClarity: 4, refunds: 3 },
    fanoveraWins: {
      fr: [
        "Aucun mot de passe partagé — Fanovera ne touche jamais votre compte.",
        "Résultat visible en quelques heures, pas plusieurs mois.",
        "Achat ponctuel à partir de 9 € — pas d'abonnement à 99 $/mois.",
        "Compatible avec tous les réseaux, pas seulement Instagram.",
      ],
      en: [
        "No password sharing — Fanovera never touches your account.",
        "Result visible in hours, not months.",
        "One-off purchase from €9 — no $99/month subscription.",
        "Works with every social network, not just Instagram.",
      ],
    },
    competitorWins: {
      fr: [
        "Croissance par interactions humaines, plus organique sur le long terme.",
        "Convient aux comptes qui veulent éviter tout signal artificiel.",
      ],
      en: [
        "Growth via real human interactions, more organic long-term.",
        "Fits accounts that want to avoid any artificial signal.",
      ],
    },
    verdict: {
      fr: "Si vous avez 99 $/mois et plusieurs mois devant vous, Growthoid peut faire sens. Pour un boost rapide sans céder votre mot de passe, Fanovera est plus adapté.",
      en: "If you have $99/month and several months ahead, Growthoid can make sense. For a fast boost without giving up your password, Fanovera fits better.",
    },
  },
];

export function getCompetitorBySlug(slug: string): ComparerEntry | null {
  return COMPETITORS.find((c) => c.slug === slug) || null;
}

export const COMPETITOR_SLUGS = COMPETITORS.map((c) => c.slug);
