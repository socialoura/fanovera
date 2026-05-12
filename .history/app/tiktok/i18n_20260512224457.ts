import { useI18n } from "../i18n/I18nProvider";
import { deepTranslateCopy } from "../i18n/deepTranslate";
import type { SupportedLocale } from "../i18n/types";

const copy = {
  fr: {
    header: { allNetworks: "Tous les reseaux", tracking: "Suivi", ratingText: "2 348 avis", home: "Accueil" },
    stepper: ["Choisir un pack", "Votre TikTok", "Paiement securise"],
    step1: {
      titleBefore: "Une visibilite TikTok",
      titleFocus: "ciblee",
      titleAfter: "& progressive.",
      volume: "Quel volume ?",
      audience: "Audience",
      included: "inclus",
      campaign: "Votre campagne",
      selectedPack: "Pack selectionne",
      visibilityPack: "Pack visibilite TikTok",
      includedCredit: "credit inclus",
      total: "Total",
      discount: "Remise incluse",
      continue: "Continuer",
      reassurance: "Sans engagement · Aucun mot de passe demande",
    },
    why: {
      eyebrow: "Pourquoi Fanovera",
      title1: "Une presence TikTok",
      title2: "progressive",
      title3: "et soignee.",
      items: [
        ["Audience ciblee", "Notre IA aide a definir une audience coherente avec votre niche et vos contenus."],
        ["Compte preserve", "Aucun acces au compte, aucune publication a votre place, aucune action directe sur votre profil."],
        ["Sans mot de passe", "Juste votre nom d'utilisateur public pour preparer la campagne de visibilite."],
        ["Suivi inclus", "Si le volume prevu n'est pas atteint, notre support verifie et prolonge la campagne."],
      ],
    },
    reviews: {
      eyebrow: "Avis clients",
      rating: "2 348 avis",
      dates: ["il y a 2 jours", "il y a 6 jours", "il y a 4 jours", "il y a 9 jours", "il y a 5 jours", "il y a 11 jours", "il y a 14 jours", "il y a 15 jours"],
      texts: [
        "Progression reguliere et campagne bien suivie. Je recommande.",
        "Mise en route rapide, suivi clair et rythme progressif.",
        "Ma visibilite TikTok a evolue progressivement.",
        "Service serieux, suivi propre sur plusieurs semaines.",
        "Bonne progression continue sur 10 jours.",
        "Premiere campagne, service clair et professionnel.",
        "Service client reactif et suivi au rendez-vous.",
        "Progression continue, exactement ce qui etait annonce.",
      ],
    },
    faq: {
      titleBefore: "Vos questions,",
      titleFocus: "nos reponses",
      items: [
        ["Comment fonctionne la mise en avant ?", "Nous preparons une campagne de visibilite autour de votre profil TikTok et de votre thematique. L'objectif est de presenter votre contenu a une audience plus pertinente, avec un rythme progressif et mesure."],
        ["Est-ce que je dois vous donner mon mot de passe ?", "Jamais. Nous avons uniquement besoin de votre nom d'utilisateur TikTok public. Aucun acces au compte n'est demande."],
        ["Est-ce que vous agissez sur mon compte ?", "Non. Nous ne nous connectons pas a votre compte et nous ne publions rien a votre place. Le service s'appuie sur une mise en avant externe et progressive."],
        ["Quand la campagne demarre-t-elle ?", "La preparation demarre apres confirmation du paiement. Le deploiement est progressif et peut s'etaler sur plusieurs jours selon le volume choisi."],
        ["Que se passe-t-il si le volume n'est pas atteint ?", "Notre support verifie la campagne et peut prolonger la mise en avant sans frais supplementaires lorsque le volume prevu n'est pas atteint."],
        ["Puis-je commander plusieurs campagnes ?", "Oui. Nous recommandons de travailler par paliers afin de garder une progression reguliere et coherente dans le temps."],
      ],
    },
    footer: {
      desc: "Strategie de presence en ligne assistee par IA. Campagnes ciblees, suivi clair et progression mesuree.",
      networks: "Reseaux",
      help: "Aide",
      how: "Comment ca marche",
      support: "Support campagne",
      tracking: "Suivi de commande",
      legal: "Legal",
      legalNotice: "Mentions legales",
      privacy: "Confidentialite",
    },
  },
  en: {
    header: { allNetworks: "All networks", tracking: "Tracking", ratingText: "2,348 reviews", home: "Home" },
    stepper: ["Choose a pack", "Your TikTok", "Secure payment"],
    step1: {
      titleBefore: "Targeted TikTok visibility",
      titleFocus: "focused",
      titleAfter: "and progressive.",
      volume: "Which volume?",
      audience: "Audience",
      included: "included",
      campaign: "Your campaign",
      selectedPack: "Selected pack",
      visibilityPack: "TikTok visibility pack",
      includedCredit: "included credit",
      total: "Total",
      discount: "Discount included",
      continue: "Continue",
      reassurance: "No commitment · No password required",
    },
    why: {
      eyebrow: "Why Fanovera",
      title1: "A progressive,",
      title2: "well-managed",
      title3: "TikTok presence.",
      items: [
        ["Focused audience", "Our AI helps define an audience aligned with your niche and content."],
        ["Account protected", "No account access, no posting on your behalf, and no direct action on your profile."],
        ["No password", "Only your public username is needed to prepare the visibility campaign."],
        ["Follow-up included", "If the planned volume is not reached, our support team reviews and extends the campaign."],
      ],
    },
    reviews: {
      eyebrow: "Customer reviews",
      rating: "2,348 reviews",
      dates: ["2 days ago", "6 days ago", "4 days ago", "9 days ago", "5 days ago", "11 days ago", "14 days ago", "15 days ago"],
      texts: [
        "Steady progress and a well-monitored campaign. I recommend it.",
        "Fast setup, clear tracking and a progressive pace.",
        "My TikTok visibility improved gradually.",
        "Serious service with clean follow-up over several weeks.",
        "Good continuous progress over 10 days.",
        "First campaign, clear and professional service.",
        "Responsive support and reliable follow-up.",
        "Continuous progress, exactly as announced.",
      ],
    },
    faq: {
      titleBefore: "Your questions,",
      titleFocus: "our answers",
      items: [
        ["How does the visibility campaign work?", "We prepare a visibility campaign around your TikTok profile and topic. The goal is to present your content to a more relevant audience, with a measured and progressive pace."],
        ["Do I need to give you my password?", "Never. We only need your public TikTok username. No account access is requested."],
        ["Do you act on my account?", "No. We do not log into your account and we do not publish anything on your behalf. The service relies on an external and progressive promotion."],
        ["When does the campaign start?", "Preparation starts after payment confirmation. Deployment is progressive and can span several days depending on the selected volume."],
        ["What happens if the volume is not reached?", "Our support team reviews the campaign and can extend the promotion at no extra cost when the planned volume is not reached."],
        ["Can I order several campaigns?", "Yes. We recommend working in stages to keep growth regular and coherent over time."],
      ],
    },
    footer: {
      desc: "AI-assisted online presence strategy. Focused campaigns, clear tracking and measured progress.",
      networks: "Networks",
      help: "Help",
      how: "How it works",
      support: "Campaign support",
      tracking: "Order tracking",
      legal: "Legal",
      legalNotice: "Legal notice",
      privacy: "Privacy",
    },
  },
} as const;

type TikTokCopy = (typeof copy)[keyof typeof copy];

const localized: Record<SupportedLocale, TikTokCopy> = {
  fr: copy.fr,
  en: copy.en,
  es: deepTranslateCopy(copy.fr, "es"),
  pt: deepTranslateCopy(copy.fr, "pt"),
  de: deepTranslateCopy(copy.fr, "de"),
  it: deepTranslateCopy(copy.fr, "it"),
  tr: deepTranslateCopy(copy.fr, "tr"),
};

export function useTikTokCopy() {
  const { locale } = useI18n();
  return localized[locale] || copy.fr;
}
