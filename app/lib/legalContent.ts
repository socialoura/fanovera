import type { LegalRouteId } from "./siteMetadata";
import type { SupportedLocale } from "../i18n/types";

type LegalSection = {
  title: string;
  body: string[];
};

export type LegalPageCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
};

const updatedAtFr = "Dernière mise à jour : 13 mai 2026";
const updatedAtEn = "Last updated: May 13, 2026";

const fr: Record<LegalRouteId, LegalPageCopy> = {
  legalNotice: {
    eyebrow: "Informations légales",
    title: "Mentions légales",
    intro: "Cette page regroupe les informations relatives à l’éditeur, à l’hébergement et à l’utilisation du site Fanovera.",
    updatedAt: updatedAtFr,
    sections: [
      {
        title: "Éditeur du site",
        body: [
          "Fanovera SAS, 17 rue de Paradis, 75010 Paris, France.",
          "Contact : support@fanovera.com.",
          "Les informations d’immatriculation, de capital social et de représentant légal doivent être complétées avec les données définitives de la société avant diffusion publicitaire à grande échelle.",
        ],
      },
      {
        title: "Hébergement",
        body: [
          "Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.",
          "Les services techniques tiers utilisés peuvent inclure Stripe pour les paiements, Resend pour les e-mails transactionnels et PostHog pour la mesure produit lorsque la configuration est active.",
        ],
      },
      {
        title: "Propriété intellectuelle",
        body: [
          "La marque Fanovera, les textes, interfaces, visuels, éléments graphiques et codes présents sur le site sont protégés, sauf mentions contraires.",
          "Toute reproduction ou réutilisation non autorisée du contenu du site est interdite.",
        ],
      },
      {
        title: "Responsabilité",
        body: [
          "Fanovera met en œuvre des moyens raisonnables pour maintenir le site accessible et exact, sans garantir une disponibilité permanente.",
          "Les plateformes citées sur le site restent des marques appartenant à leurs propriétaires respectifs. Fanovera n’est pas affilié à Instagram, TikTok, YouTube, Spotify, Twitch, Facebook, LinkedIn ou X.",
        ],
      },
    ],
  },
  terms: {
    eyebrow: "Vente et commande",
    title: "Conditions générales de vente",
    intro: "Ces conditions encadrent les commandes passées sur Fanovera pour des prestations de visibilité et de suivi de campagne.",
    updatedAt: updatedAtFr,
    sections: [
      {
        title: "Services",
        body: [
          "Fanovera propose des packs de visibilité et d’accompagnement pour des profils, pages, chaînes, vidéos ou morceaux publics.",
          "Aucun mot de passe n’est demandé. Le client reste responsable du contenu, de la conformité et de l’accessibilité publique de la page ou du profil indiqué.",
        ],
      },
      {
        title: "Prix et paiement",
        body: [
          "Les prix affichés sont indiqués toutes taxes comprises lorsque cela s’applique. Le paiement est réalisé via Stripe ou tout autre prestataire de paiement activé sur le site.",
          "Une commande est considérée comme validée lorsque le paiement est confirmé par le prestataire de paiement.",
        ],
      },
      {
        title: "Exécution",
        body: [
          "L’exécution démarre après confirmation du paiement et vérification des informations nécessaires à la commande.",
          "Les délais affichés sont indicatifs. Ils peuvent varier selon la plateforme, la disponibilité des services, les contrôles antifraude ou les informations fournies par le client.",
        ],
      },
      {
        title: "Limites et obligations",
        body: [
          "Fanovera ne garantit pas de résultat économique, de viralité, de revenu, d’engagement organique futur ou de décision prise par une plateforme tierce.",
          "Le client s’engage à fournir des informations exactes et à ne pas utiliser le service pour des contenus illicites, trompeurs, haineux ou portant atteinte aux droits de tiers.",
        ],
      },
      {
        title: "Support, annulation et incidents",
        body: [
          "En cas d’erreur dans les informations de commande ou de difficulté d’exécution, le client peut contacter support@fanovera.com.",
          "Les règles de remboursement et de traitement des incidents sont détaillées sur la page Remboursements et exécution.",
        ],
      },
    ],
  },
  privacy: {
    eyebrow: "Données personnelles",
    title: "Politique de confidentialité",
    intro: "Cette politique explique quelles données sont traitées par Fanovera, pourquoi elles le sont et comment exercer vos droits.",
    updatedAt: updatedAtFr,
    sections: [
      {
        title: "Données collectées",
        body: [
          "Fanovera peut traiter votre adresse e-mail, les informations de commande, la page ou le profil public indiqué, la devise, la langue, le pays approximatif et les données techniques nécessaires au fonctionnement du site.",
          "Les données de paiement complètes ne sont pas stockées par Fanovera. Elles sont traitées par le prestataire de paiement.",
        ],
      },
      {
        title: "Finalités",
        body: [
          "Les données sont utilisées pour préparer et exécuter les commandes, envoyer les confirmations, assurer le support, sécuriser les paiements, mesurer la performance du site et améliorer le produit.",
          "Les données analytics ne doivent pas contenir d’informations sensibles ni de données de carte bancaire.",
        ],
      },
      {
        title: "Base légale et conservation",
        body: [
          "Les traitements peuvent reposer sur l’exécution du contrat, l’intérêt légitime de Fanovera, le respect d’obligations légales ou le consentement lorsque celui-ci est requis.",
          "Les données sont conservées pendant la durée nécessaire aux finalités décrites, puis archivées ou supprimées selon les obligations applicables.",
        ],
      },
      {
        title: "Vos droits",
        body: [
          "Vous pouvez demander l’accès, la rectification, l’effacement, la limitation, l’opposition ou la portabilité de vos données lorsque ces droits s’appliquent.",
          "Pour exercer vos droits, contactez support@fanovera.com. Vous pouvez également introduire une réclamation auprès de l’autorité de contrôle compétente.",
        ],
      },
      {
        title: "Sous-traitants",
        body: [
          "Fanovera peut utiliser des prestataires techniques pour l’hébergement, le paiement, l’envoi d’e-mails, l’analytics produit, la sécurité et le support.",
          "Ces prestataires ne doivent accéder aux données que dans la mesure nécessaire à leur mission.",
        ],
      },
    ],
  },
  cookies: {
    eyebrow: "Traceurs",
    title: "Politique cookies",
    intro: "Cette page décrit les cookies et traceurs susceptibles d’être utilisés par Fanovera.",
    updatedAt: updatedAtFr,
    sections: [
      {
        title: "Cookies nécessaires",
        body: [
          "Certains cookies sont nécessaires au fonctionnement du site, par exemple pour mémoriser la langue, la devise, la session ou sécuriser une commande.",
          "Ces cookies ne peuvent pas toujours être désactivés sans dégrader fortement le service.",
        ],
      },
      {
        title: "Mesure d’audience et produit",
        body: [
          "Fanovera peut utiliser des outils comme PostHog ou Vercel Analytics afin de comprendre les parcours, améliorer les pages et mesurer les conversions.",
          "Lorsque la réglementation l’exige, les traceurs non nécessaires doivent être soumis au consentement de l’utilisateur.",
        ],
      },
      {
        title: "Paiement et sécurité",
        body: [
          "Stripe ou d’autres prestataires de paiement peuvent déposer des cookies nécessaires à la sécurité, à la prévention de la fraude et au traitement du paiement.",
          "Ces cookies sont gérés selon les politiques des prestataires concernés.",
        ],
      },
      {
        title: "Gestion",
        body: [
          "Vous pouvez configurer votre navigateur pour bloquer ou supprimer les cookies.",
          "Une bannière ou un module de gestion du consentement peut être ajouté si des traceurs soumis au consentement sont activés en production.",
        ],
      },
    ],
  },
  refund: {
    eyebrow: "Après paiement",
    title: "Remboursements et exécution",
    intro: "Cette page précise les règles de traitement des commandes, des incidents de livraison et des demandes de remboursement.",
    updatedAt: updatedAtFr,
    sections: [
      {
        title: "Démarrage de la commande",
        body: [
          "Après paiement, Fanovera prépare la commande avec les informations fournies par le client.",
          "Si le profil, la page, la vidéo ou le morceau n’est pas public ou si l’information fournie est incorrecte, l’exécution peut être retardée jusqu’à correction.",
        ],
      },
      {
        title: "Incidents",
        body: [
          "En cas d’incident technique, de volume non atteint ou d’erreur de service, Fanovera peut proposer une reprise d’exécution, un avoir, un ajustement ou un remboursement total ou partiel selon le cas.",
          "Chaque demande est examinée à partir des informations de commande, des preuves disponibles et de l’état réel d’exécution.",
        ],
      },
      {
        title: "Rétractation",
        body: [
          "Lorsque l’exécution d’un service numérique commence immédiatement après le paiement, le droit de rétractation peut être limité dans les conditions prévues par la réglementation applicable.",
          "Si la commande n’a pas encore commencé, contactez support@fanovera.com le plus rapidement possible.",
        ],
      },
      {
        title: "Contact",
        body: [
          "Pour toute demande, indiquez l’e-mail de commande, la plateforme concernée, le lien ou le profil cible et une description claire du problème.",
          "Contact : support@fanovera.com.",
        ],
      },
    ],
  },
};

const en: Record<LegalRouteId, LegalPageCopy> = {
  legalNotice: {
    eyebrow: "Legal information",
    title: "Legal notice",
    intro: "This page contains information about the Fanovera publisher, hosting provider and website usage.",
    updatedAt: updatedAtEn,
    sections: [
      { title: "Publisher", body: ["Fanovera SAS, 17 rue de Paradis, 75010 Paris, France.", "Contact: support@fanovera.com.", "Company registration, share capital and legal representative details should be completed with final corporate data before large-scale advertising."] },
      { title: "Hosting", body: ["The website is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, United States.", "Technical third parties may include Stripe for payments, Resend for transactional emails and PostHog for product analytics when enabled."] },
      { title: "Intellectual property", body: ["Fanovera branding, copy, interfaces, visuals and code are protected unless stated otherwise.", "Unauthorized reproduction or reuse of website content is prohibited."] },
      { title: "Liability", body: ["Fanovera uses reasonable efforts to keep the website available and accurate, without guaranteeing permanent availability.", "Third-party platforms mentioned on the website remain trademarks of their respective owners. Fanovera is not affiliated with Instagram, TikTok, YouTube, Spotify, Twitch, Facebook, LinkedIn or X."] },
    ],
  },
  terms: {
    eyebrow: "Sales and orders",
    title: "Terms of sale",
    intro: "These terms apply to orders placed on Fanovera for visibility and campaign tracking services.",
    updatedAt: updatedAtEn,
    sections: [
      { title: "Services", body: ["Fanovera offers visibility and support packs for public profiles, pages, channels, videos or tracks.", "No password is requested. The customer remains responsible for the content, compliance and public availability of the page or profile provided."] },
      { title: "Pricing and payment", body: ["Prices are displayed including applicable taxes where relevant. Payment is processed through Stripe or another payment provider enabled on the website.", "An order is validated once payment is confirmed by the payment provider."] },
      { title: "Delivery", body: ["Delivery starts after payment confirmation and verification of the information required for the order.", "Displayed timelines are indicative and may vary depending on the platform, service availability, fraud checks or customer-provided information."] },
      { title: "Limits", body: ["Fanovera does not guarantee revenue, virality, future organic engagement or decisions made by third-party platforms.", "The customer agrees to provide accurate information and not to use the service for unlawful, misleading, hateful or infringing content."] },
      { title: "Support and incidents", body: ["For order errors or delivery issues, contact support@fanovera.com.", "Refund and incident handling rules are detailed on the Refunds and delivery page."] },
    ],
  },
  privacy: {
    eyebrow: "Personal data",
    title: "Privacy policy",
    intro: "This policy explains what data Fanovera processes, why it is processed and how to exercise your rights.",
    updatedAt: updatedAtEn,
    sections: [
      { title: "Data collected", body: ["Fanovera may process your email address, order details, public page or profile, currency, language, approximate country and technical data needed for the website.", "Full payment card details are not stored by Fanovera and are processed by the payment provider."] },
      { title: "Purposes", body: ["Data is used to prepare and deliver orders, send confirmations, provide support, secure payments, measure website performance and improve the product.", "Analytics data should not contain sensitive information or payment card data."] },
      { title: "Legal basis and retention", body: ["Processing may rely on contract performance, Fanovera's legitimate interest, legal obligations or consent when required.", "Data is retained for as long as needed for the stated purposes, then archived or deleted according to applicable obligations."] },
      { title: "Your rights", body: ["You may request access, correction, deletion, restriction, objection or portability where these rights apply.", "To exercise your rights, contact support@fanovera.com. You may also lodge a complaint with the competent supervisory authority."] },
      { title: "Processors", body: ["Fanovera may use technical providers for hosting, payments, email delivery, product analytics, security and support.", "These providers should only access data as needed for their role."] },
    ],
  },
  cookies: {
    eyebrow: "Trackers",
    title: "Cookie policy",
    intro: "This page describes cookies and trackers that may be used by Fanovera.",
    updatedAt: updatedAtEn,
    sections: [
      { title: "Necessary cookies", body: ["Some cookies are required for the website to work, for example to remember language, currency, session state or secure an order.", "These cookies cannot always be disabled without severely degrading the service."] },
      { title: "Analytics and product measurement", body: ["Fanovera may use tools such as PostHog or Vercel Analytics to understand journeys, improve pages and measure conversions.", "Where regulation requires it, non-essential trackers should be subject to user consent."] },
      { title: "Payment and security", body: ["Stripe or other payment providers may set cookies required for security, fraud prevention and payment processing.", "These cookies are managed according to the relevant providers' policies."] },
      { title: "Management", body: ["You can configure your browser to block or delete cookies.", "A consent banner or preference center can be added if consent-based trackers are enabled in production."] },
    ],
  },
  refund: {
    eyebrow: "After payment",
    title: "Refunds and delivery",
    intro: "This page explains how Fanovera handles order delivery, incidents and refund requests.",
    updatedAt: updatedAtEn,
    sections: [
      { title: "Order start", body: ["After payment, Fanovera prepares the order using the information provided by the customer.", "If the profile, page, video or track is not public, or if the provided information is incorrect, delivery may be delayed until corrected."] },
      { title: "Incidents", body: ["In case of a technical issue, missing volume or service error, Fanovera may offer redelivery, credit, adjustment or full or partial refund depending on the case.", "Each request is reviewed using order information, available evidence and actual delivery status."] },
      { title: "Withdrawal", body: ["When delivery of a digital service starts immediately after payment, withdrawal rights may be limited under applicable regulations.", "If the order has not started yet, contact support@fanovera.com as soon as possible."] },
      { title: "Contact", body: ["For any request, include the order email, platform, target link or profile and a clear description of the issue.", "Contact: support@fanovera.com."] },
    ],
  },
};

export function getLegalPageCopy(pageId: LegalRouteId, locale: SupportedLocale): LegalPageCopy {
  return locale === "fr" ? fr[pageId] : en[pageId];
}
