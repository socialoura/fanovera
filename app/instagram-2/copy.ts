"use client";

import { useI18n } from "../i18n/I18nProvider";
import { useMarketingMode } from "../marketing/MarketingModeProvider";

// New strings specific to the instagram-2 flow (username+loading, quantities,
// post selection). Payment/coupon/legal strings are reused from the existing
// useInstagramCopy().step3. FR + EN are authored; other locales fall back to EN.
//
// Three tones, matching the per-surface marketing modes (lib/performanceCopy.ts):
//   whitehat → `base`        : neutral ("Développez", "De vrais abonnés actifs")
//   greyhat  → `greyhat` ov. : performance/traction ("campagne", "visibilité")
//   blackhat → `blackhat` ov.: explicit ("Acheter", "livraison express garantie")
// Only tone-bearing fields are overridden; functional strings stay shared.
const base = {
  fr: {
    stepper: { instagram: "Votre Instagram", quantities: "Quantités", posts: "Vos posts", payment: "Paiement" },
    step1: {
      badge: "Instagram · Followers, Likes & Vues",
      titleBefore: "Développez votre Instagram en",
      titleFocus: "quelques minutes",
      titleAfter: ".",
      intro1: "Entrez votre pseudo, on récupère votre profil et vos publications.",
      noPassword: "Aucun mot de passe.",
      intro2: "Compte public uniquement.",
      label: "Votre nom d'utilisateur Instagram",
      subTitle: "Envie de booster votre profil ?",
      placeholder: "votrepseudo",
      cta: "Analyser mon profil",
      continueCta: "Continuer",
      fromPrefix: "· dès ",
      secured: "On ne demande jamais votre mot de passe.",
      chips: ["🔒 Aucun mot de passe", "⚡ Démarrage immédiat", "🛡 Garantie à vie", "🇪🇺 Conforme RGPD"],
      ribbonOrders: "commandes en cours",
      loadingNote: "Connexion chiffrée · cela prend quelques secondes…",
      publicFound: "Compte public trouvé",
      stages: ["Connexion sécurisée à Instagram", "Profil récupéré", "Analyse des dernières publications", "Profil prêt ✨"],
      privateTitle: "Votre compte est privé",
      privateBody: "On ne peut pas récupérer votre profil ni livrer votre commande tant qu'il est privé. Passez-le en public dans Réglages → Confidentialité, puis réessayez.",
      privateRetry: "J'ai rendu mon compte public — réessayer",
    },
    step2: {
      titleBefore: "Composez votre",
      titleFocus: "boost",
      titleAfter: ".",
      intro: "Ajoutez ce que vous voulez : followers, likes, vues. Tout en une seule commande.",
      change: "Changer",
      orderTitle: "Votre commande",
      emptyCart: "Choisissez au moins un produit pour continuer.",
      total: "Total",
      continue: "Continuer",
      remove: "Retirer",
      subFollowers: "De vrais abonnés actifs",
      subLikes: "Répartis sur vos publications",
      subViews: "Boostez vos Reels",
      moreOptions: (n: number) => `+ ${n} autres paliers`,
      lessOptions: "Réduire",
      add: "Ajouter",
      dragHint: "Glissez pour ajouter",
      none: "0",
      needsPostsNote: "· sélection de posts à l'étape suivante",
      statFollowers: "abonnés",
      statFollowing: "abonnements",
      statPosts: "posts",
    },
    step3: {
      titleBefore: "Sur quels",
      titleFocus: "posts",
      titleAfter: "?",
      intro: "Sélectionnez les publications qui recevront vos likes et vues. On répartit équitablement.",
      selected: (n: number) => `${n} post${n > 1 ? "s" : ""} sélectionné${n > 1 ? "s" : ""}`,
      last: "· 12 derniers",
      selectAll: "Tout sélectionner",
      clear: "Effacer",
      distribution: "Répartition",
      empty: "Sélectionnez au moins une publication.",
      perVideoLikes: (n: number) => `≈ ${n} likes par post`,
      perVideoViews: (n: number) => `≈ ${n} vues par post`,
      followersNote: (n: string) => `${n} followers livrés sur votre profil`,
      goToPayment: "Aller au paiement",
      editQuantities: "← Modifier les quantités",
      likesUnit: "likes",
      viewsUnit: "vues",
    },
  },
  en: {
    stepper: { instagram: "Your Instagram", quantities: "Quantities", posts: "Your posts", payment: "Payment" },
    step1: {
      badge: "Instagram · Followers, Likes & Views",
      titleBefore: "Grow your Instagram in",
      titleFocus: "minutes",
      titleAfter: ".",
      intro1: "Enter your handle, we fetch your profile and your posts.",
      noPassword: "No password.",
      intro2: "Public accounts only.",
      label: "Your Instagram username",
      subTitle: "Wanna boost your profile?",
      placeholder: "yourhandle",
      cta: "Analyze my profile",
      continueCta: "Continue",
      fromPrefix: "· from ",
      secured: "We never ask for your password.",
      chips: ["🔒 No password", "⚡ Instant start", "🛡 Lifetime guarantee", "🇪🇺 GDPR compliant"],
      ribbonOrders: "orders in progress",
      loadingNote: "Encrypted connection · this takes a few seconds…",
      publicFound: "Public account found",
      stages: ["Secure connection to Instagram", "Profile fetched", "Analyzing latest posts", "Profile ready ✨"],
      privateTitle: "Your account is private",
      privateBody: "We can't fetch your profile or deliver your order while it's private. Switch it to public in Settings → Privacy, then try again.",
      privateRetry: "I made my account public — retry",
    },
    step2: {
      titleBefore: "Build your",
      titleFocus: "boost",
      titleAfter: ".",
      intro: "Add whatever you want: followers, likes, views. All in a single order.",
      change: "Change",
      orderTitle: "Your order",
      emptyCart: "Pick at least one product to continue.",
      total: "Total",
      continue: "Continue",
      remove: "Remove",
      subFollowers: "Real, active followers",
      subLikes: "Spread across your posts",
      subViews: "Boost your Reels",
      moreOptions: (n: number) => `+ ${n} more tiers`,
      lessOptions: "Show less",
      add: "Add",
      dragHint: "Drag to add",
      none: "0",
      needsPostsNote: "· post selection in the next step",
      statFollowers: "followers",
      statFollowing: "following",
      statPosts: "posts",
    },
    step3: {
      titleBefore: "On which",
      titleFocus: "posts",
      titleAfter: "?",
      intro: "Select the posts that will receive your likes and views. We spread them evenly.",
      selected: (n: number) => `${n} post${n > 1 ? "s" : ""} selected`,
      last: "· last 12",
      selectAll: "Select all",
      clear: "Clear",
      distribution: "Distribution",
      empty: "Select at least one post.",
      perVideoLikes: (n: number) => `≈ ${n} likes per post`,
      perVideoViews: (n: number) => `≈ ${n} views per post`,
      followersNote: (n: string) => `${n} followers delivered to your profile`,
      goToPayment: "Go to payment",
      editQuantities: "← Edit quantities",
      likesUnit: "likes",
      viewsUnit: "views",
    },
  },
};

export type I2Copy = (typeof base)["en"];

type StepKey = "stepper" | "step1" | "step2" | "step3";
type I2Overrides = {
  [K in StepKey]?: Partial<I2Copy[K]>;
};

// ── greyhat: performance / traction tone, no explicit "buy" ──
const greyhat: Record<"fr" | "en", I2Overrides> = {
  fr: {
    step1: {
      badge: "Instagram · Boost de visibilité",
      titleBefore: "Boostez votre présence Instagram en",
      subTitle: "Envie de plus de visibilité ?",
      chips: ["🔒 Aucun mot de passe", "⚡ Livraison progressive", "🛡 Garantie à vie", "🇪🇺 Conforme RGPD"],
    },
    step2: {
      titleFocus: "campagne",
      intro: "Followers, likes, vues : combinez ce qu'il faut pour gagner en visibilité. Une seule commande.",
      subFollowers: "Abonnés réels et actifs",
      subLikes: "Répartis pour un engagement crédible",
      subViews: "De la traction sur vos Reels",
    },
    step3: {
      intro: "Choisissez les publications à booster. On répartit vos likes et vues équitablement.",
    },
  },
  en: {
    step1: {
      badge: "Instagram · Visibility boost",
      titleBefore: "Boost your Instagram presence in",
      subTitle: "Want more visibility?",
      chips: ["🔒 No password", "⚡ Progressive delivery", "🛡 Lifetime guarantee", "🇪🇺 GDPR compliant"],
    },
    step2: {
      titleFocus: "campaign",
      intro: "Followers, likes, views: combine what you need to grow your reach. One single order.",
      subFollowers: "Real, active followers",
      subLikes: "Spread for credible engagement",
      subViews: "Traction on your Reels",
    },
    step3: {
      intro: "Choose the posts to boost. We spread your likes and views evenly.",
    },
  },
};

// ── blackhat: explicit "buy", express delivery, guaranteed, 100% real ──
const blackhat: Record<"fr" | "en", I2Overrides> = {
  fr: {
    step1: {
      badge: "Instagram · Followers, Likes & Vues réels",
      titleBefore: "Achetez des followers Instagram —",
      titleFocus: "livraison express",
      titleAfter: " garantie.",
      subTitle: "Prêt à booster votre compte ?",
      chips: ["🔒 Aucun mot de passe", "⚡ Livraison express", "🛡 Garantie relivraison 30j", "✅ Profils 100% réels"],
    },
    step2: {
      titleFocus: "commande",
      intro: "Choisissez vos quantités : followers, likes, vues. Livraison express après paiement.",
      subFollowers: "Abonnés 100% réels, livrés en quelques heures",
      subLikes: "Likes réels répartis sur vos posts",
      subViews: "Vues réelles sur vos Reels",
    },
    step3: {
      intro: "Choisissez les posts à booster. Vos likes et vues réels sont répartis et livrés en quelques heures.",
      goToPayment: "Payer et recevoir",
    },
  },
  en: {
    step1: {
      badge: "Instagram · Real followers, likes & views",
      titleBefore: "Buy Instagram followers —",
      titleFocus: "express delivery",
      titleAfter: " guaranteed.",
      subTitle: "Ready to boost your account?",
      chips: ["🔒 No password", "⚡ Express delivery", "🛡 30-day refill guarantee", "✅ 100% real profiles"],
    },
    step2: {
      titleFocus: "order",
      intro: "Pick your quantities: followers, likes, views. Express delivery after payment.",
      subFollowers: "100% real followers, delivered in hours",
      subLikes: "Real likes spread across your posts",
      subViews: "Real views on your Reels",
    },
    step3: {
      intro: "Choose the posts to boost. Your real likes and views are spread and delivered in hours.",
      goToPayment: "Pay and receive",
    },
  },
};

// Shallow-merge per step (each step is a flat map of string | string[] | fn,
// so a per-step spread is correct — no deep recursion needed).
function mergeCopy(b: I2Copy, ov: I2Overrides): I2Copy {
  return {
    stepper: { ...b.stepper, ...ov.stepper },
    step1: { ...b.step1, ...ov.step1 },
    step2: { ...b.step2, ...ov.step2 },
    step3: { ...b.step3, ...ov.step3 },
  };
}

export function useI2Copy(): I2Copy {
  const { locale } = useI18n();
  const { surfaceMode } = useMarketingMode();
  const loc = locale === "fr" ? "fr" : "en";
  const b = base[loc];
  if (surfaceMode === "greyhat") return mergeCopy(b, greyhat[loc]);
  if (surfaceMode === "blackhat") return mergeCopy(b, blackhat[loc]);
  return b;
}
