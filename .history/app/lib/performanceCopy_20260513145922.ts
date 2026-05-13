import type { SupportedLocale } from "../i18n/types";
import { getEffectiveMarketingMode, type MarketingMode } from "./marketingModeTypes";

type ProductOverrides = {
  locale: SupportedLocale;
  mode: MarketingMode;
  product: string;
  audience: string;
};

type Pair = readonly [string, string];

function applyPairItems(value: unknown, items: Pair[]) {
  return Array.isArray(value) ? items : value;
}

function objectSection(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

function getAudienceLabel(product: string, locale: SupportedLocale, fallback: string) {
  const labels: Record<string, { fr: string; en: string }> = {
    Instagram: { fr: "Followers", en: "Followers" },
    TikTok: { fr: "Followers", en: "Followers" },
    Facebook: { fr: "Followers", en: "Followers" },
    X: { fr: "Followers", en: "Followers" },
    YouTube: { fr: "Vues", en: "Views" },
    Spotify: { fr: "Écoutes", en: "Streams" },
    Twitch: { fr: "Viewers", en: "Viewers" },
    LinkedIn: { fr: "Followers", en: "Followers" },
  };
  return labels[product]?.[locale === "fr" ? "fr" : "en"] || fallback;
}

export function applyPerformancePublicCopy<T extends Record<string, unknown>>(
  locale: SupportedLocale,
  mode: MarketingMode,
  base: T,
): T {
  const effective = getEffectiveMarketingMode(locale, mode);
  if (effective === "promo") return applyPromoPublicCopy(locale, base);
  if (effective !== "performance") return base;

  const isFr = locale === "fr";
  const hero = objectSection(base.hero);
  const how = objectSection(base.how);
  const testimonials = objectSection(base.testimonials);
  const faq = objectSection(base.faq);
  const cta = objectSection(base.cta);
  const footer = objectSection(base.footer);

  return {
    ...base,
    hero: {
      ...hero,
      newCampaign: isFr ? "+ Campagne active" : "+ Active campaign",
      activeNetworks: isFr ? "RÉSEAUX PRÊTS" : "NETWORKS READY",
      campaign: isFr ? "Lancement #042" : "Launch #042",
      campaignMeta: isFr ? "Traction progressive - suivi live" : "Progressive traction - live tracking",
      cardLabel: isFr ? "Visibilité rapide" : "Fast visibility",
      cardCta: isFr ? "Choisir un réseau" : "Choose a network",
      titleBefore: isFr ? "Donnez à votre profil " : "Give your profile ",
      titleHighlight: isFr ? "le signal social" : "the social proof",
      titleAfter: isFr ? " qu'il mérite, sans mot de passe." : " it deserves, with no password.",
      rating: isFr ? "4,9/5 par les créateurs" : "4.9/5 from creators",
      tiktokValue: isFr ? "traction" : "traction",
      spotifyTitle: isFr ? "Boost Spotify" : "Spotify boost",
      spotifyMeta: isFr ? "écoutes progressives" : "progressive streams",
      youtubeTitle: isFr ? "Vues YouTube" : "YouTube views",
      youtubeMeta: isFr ? "campagne suivie" : "tracked campaign",
    },
    how: {
      ...how,
      eyebrow: isFr ? "Comment ça se lance" : "How it starts",
      titleBefore: isFr ? "Trois étapes pour gagner " : "Three steps to gain ",
      titleHighlight: isFr ? "de la traction" : "traction",
      titleAfter: isFr ? " vite et proprement." : " quickly and cleanly.",
      steps: isFr
        ? [
            { title: "Choisissez le réseau", body: "Sélectionnez Instagram, TikTok, YouTube, Spotify ou un autre produit, puis choisissez le volume adapté." },
            { title: "Indiquez le profil public", body: "Aucun mot de passe. On travaille uniquement avec le lien ou l'identifiant public que vous renseignez." },
            { title: "Suivez la livraison", body: "La campagne démarre après paiement, avance progressivement et reste suivie par le support." },
          ]
        : [
            { title: "Choose the network", body: "Pick Instagram, TikTok, YouTube, Spotify or another product, then select the right volume." },
            { title: "Enter the public profile", body: "No password. We only use the public link or handle you provide." },
            { title: "Track delivery", body: "The campaign starts after payment, progresses gradually and stays monitored by support." },
          ],
    },
    testimonials: {
      ...testimonials,
      eyebrow: isFr ? "Preuve sociale" : "Social proof",
      titleBefore: isFr ? "Des créateurs qui voulaient " : "Creators who wanted ",
      titleHighlight: isFr ? "passer un cap" : "more momentum",
      titleAfter: ".",
    },
    faq: {
      ...faq,
      eyebrow: "FAQ",
      titleBefore: isFr ? "Avant de lancer, " : "Before you launch, ",
      titleHighlight: isFr ? "les réponses utiles" : "useful answers",
      titleAfter: ".",
      items: isFr
        ? [
            { q: "Est-ce que je dois donner mon mot de passe ?", a: "Non. Fanovera demande uniquement un lien ou identifiant public pour préparer la campagne." },
            { q: "Quand la campagne démarre-t-elle ?", a: "Elle démarre après confirmation du paiement, avec une progression suivie pour éviter un pic artificiel." },
            { q: "Puis-je choisir plusieurs réseaux ?", a: "Oui. Vous pouvez lancer un pack sur un réseau puis ajouter d'autres plateformes selon votre objectif." },
            { q: "Que se passe-t-il si le volume n'est pas atteint ?", a: "Le support vérifie la campagne et peut prolonger la livraison sans frais supplémentaires." },
          ]
        : [
            { q: "Do I need to share my password?", a: "No. Fanovera only asks for a public link or handle to prepare the campaign." },
            { q: "When does the campaign start?", a: "It starts after payment confirmation, with monitored progress to avoid an artificial spike." },
            { q: "Can I choose several networks?", a: "Yes. You can launch one network pack and add other platforms depending on your goal." },
            { q: "What happens if the volume is not reached?", a: "Support reviews the campaign and can extend delivery at no extra cost." },
          ],
    },
    cta: {
      ...cta,
      titleBefore: isFr ? "Prêt à rendre votre profil " : "Ready to make your profile ",
      titleHighlight: isFr ? "plus crédible" : "more credible",
      titleAfter: isFr ? " aujourd'hui ?" : " today?",
      body: isFr
        ? "Choisissez un réseau, lancez une campagne progressive et suivez chaque étape depuis Fanovera."
        : "Choose a network, launch a progressive campaign and track every step from Fanovera.",
      footer: isFr ? "Sans mot de passe - Paiement sécurisé - Suivi inclus" : "No password - Secure payment - Tracking included",
    },
    footer: {
      ...footer,
      description: isFr
        ? "Campagnes de visibilité pour créateurs, artistes et marques : réseaux sociaux, musique, vidéo et profils publics."
        : "Visibility campaigns for creators, artists and brands: social networks, music, video and public profiles.",
    },
  } as T;
}

export function applyPerformanceProductCopy<T>(
  base: T,
  { locale, mode, product, audience }: ProductOverrides,
): T {
  if (getEffectiveMarketingMode(locale, mode) !== "performance") return base;

  const isFr = locale === "fr";
  const source = objectSection(base);
  const step1 = objectSection(source.step1);
  const step2 = objectSection(source.step2);
  const step3 = objectSection(source.step3);
  const why = objectSection(source.why);
  const faq = objectSection(source.faq);
  const footer = objectSection(source.footer);
  const reviews = objectSection(source.reviews);

  const audienceLabel = getAudienceLabel(product, locale, audience);
  const lowerAudience = audienceLabel.toLowerCase();

  return {
    ...source,
    step1: {
      ...step1,
      titleBefore: isFr ? `Boost ${product}` : `Boost ${product}`,
      titleFocus: isFr ? "rapide" : "fast",
      titleAfter: isFr ? "et suivi." : "and tracked.",
      volume: isFr ? "Combien voulez-vous ajouter ?" : "How much do you want to add?",
      audience: audienceLabel,
      selectedPack: isFr ? "Pack choisi" : "Chosen pack",
      visibilityPack: isFr ? `Pack ${product}` : `${product} pack`,
      continue: isFr ? "Lancer la campagne" : "Launch campaign",
      reassurance: isFr ? "Sans mot de passe - Livraison progressive - Support inclus" : "No password - Progressive delivery - Support included",
    },
    step2: {
      ...step2,
      titleBefore: isFr ? "Quel profil" : "Which profile",
      titleFocus: isFr ? "booster" : "to boost",
      titleAfter: "?",
      intro: isFr
        ? `Indiquez votre lien ou identifiant ${product} public. Aucun mot de passe, aucun accès au compte.`
        : `Enter your public ${product} link or handle. No password, no account access.`,
      pay: isFr ? "Continuer vers le paiement" : "Continue to payment",
    },
    step3: {
      ...step3,
      subtitle: isFr
        ? "Paiement sécurisé - lancement après confirmation - suivi de livraison inclus."
        : "Secure payment - launch after confirmation - delivery tracking included.",
      legalAfter: isFr ? "Aucun abonnement caché. Aucun mot de passe demandé." : "No hidden subscription. No password requested.",
    },
    why: {
      ...why,
      eyebrow: isFr ? "Pourquoi ça convertit" : "Why it converts",
      title1: isFr ? `${product} plus` : "More",
      title2: isFr ? "crédible" : `credible ${product}`,
      title3: isFr ? "dès le premier regard." : "at first glance.",
      items: applyPairItems(
        why.items,
        isFr
          ? [
              ["Preuve sociale visible", `Une présence plus solide aide vos contenus ${product} à paraître plus établis.`],
              ["Progression suivie", `Les ${lowerAudience} sont ajoutés progressivement avec un suivi clair de la campagne.`],
              ["Compte protégé", "Aucun accès au compte, aucune publication à votre place, aucune action directe sur votre profil."],
              ["Support inclus", "Si le volume prévu n'est pas atteint, le support vérifie et prolonge la campagne."],
            ]
          : [
              ["Visible social proof", `A stronger presence helps your ${product} content look more established.`],
              ["Tracked progress", `${audience} are added progressively with clear campaign tracking.`],
              ["Protected account", "No account access, no posting on your behalf and no direct action on your profile."],
              ["Support included", "If the planned volume is not reached, support reviews and extends the campaign."],
            ],
      ),
    },
    reviews: {
      ...reviews,
      eyebrow: isFr ? "Ils ont gagné en traction" : "They gained traction",
    },
    faq: {
      ...faq,
      titleBefore: isFr ? "Avant de commander," : "Before ordering,",
      titleFocus: isFr ? "l'essentiel" : "the essentials",
      items: applyPairItems(
        faq.items,
        isFr
          ? [
              ["Dois-je partager mon mot de passe ?", "Non. Nous demandons seulement un lien ou identifiant public pour lancer la campagne."],
              ["Quand la livraison démarre-t-elle ?", "Après confirmation du paiement. La progression est suivie et peut s'étaler sur plusieurs jours selon le volume."],
              ["Est-ce adapté à un nouveau profil ?", "Oui, le but est de renforcer la preuve sociale tout en gardant une progression crédible."],
              ["Que faire si tout n'est pas livré ?", "Le support vérifie la campagne et peut prolonger la livraison sans frais supplémentaires."],
            ]
          : [
              ["Do I need to share my password?", "No. We only ask for a public link or handle to launch the campaign."],
              ["When does delivery start?", "After payment confirmation. Progress is monitored and can span several days depending on volume."],
              ["Is it suitable for a new profile?", "Yes, the goal is to strengthen social proof while keeping progress credible."],
              ["What if everything is not delivered?", "Support reviews the campaign and can extend delivery at no extra cost."],
            ],
      ),
    },
    footer: {
      ...footer,
      desc: isFr
        ? `Campagnes ${product} avec lancement rapide, livraison progressive et suivi clair.`
        : `${product} campaigns with fast launch, progressive delivery and clear tracking.`,
    },
  } as T;
}
