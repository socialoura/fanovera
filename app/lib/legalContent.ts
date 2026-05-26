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
const updatedAtDe = "Zuletzt aktualisiert: 13. Mai 2026";
const updatedAtEs = "Última actualización: 13 de mayo de 2026";
const updatedAtIt = "Ultimo aggiornamento: 13 maggio 2026";

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

const de: Record<LegalRouteId, LegalPageCopy> = {
  legalNotice: {
    eyebrow: "Rechtliche Hinweise",
    title: "Impressum",
    intro: "Diese Seite enthält Informationen zum Anbieter, zum Hosting und zur Nutzung der Fanovera-Website.",
    updatedAt: updatedAtDe,
    sections: [
      { title: "Anbieter", body: ["Fanovera SAS, 17 rue de Paradis, 75010 Paris, Frankreich.", "Kontakt: support@fanovera.com.", "Angaben zu Handelsregister, Stammkapital und gesetzlichem Vertreter sind vor groß angelegten Werbeschaltungen mit den endgültigen Firmendaten zu vervollständigen."] },
      { title: "Hosting", body: ["Die Website wird gehostet von Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.", "Eingesetzte technische Drittanbieter können Stripe (Zahlungen), Resend (Transaktions-E-Mails) und PostHog (Produktanalyse) umfassen, sofern aktiviert."] },
      { title: "Urheberrecht", body: ["Die Marke Fanovera sowie Texte, Oberflächen, Grafiken und Code auf der Website sind urheberrechtlich geschützt, sofern nicht anders angegeben.", "Jede unbefugte Vervielfältigung oder Wiederverwendung der Website-Inhalte ist untersagt."] },
      { title: "Haftung", body: ["Fanovera setzt angemessene Mittel ein, um die Verfügbarkeit und Richtigkeit der Website zu gewährleisten, ohne eine dauerhafte Verfügbarkeit zu garantieren.", "Die auf der Website erwähnten Plattformen bleiben Marken ihrer jeweiligen Inhaber. Fanovera ist nicht mit Instagram, TikTok, YouTube, Spotify, Twitch, Facebook, LinkedIn oder X verbunden."] },
    ],
  },
  terms: {
    eyebrow: "Verkauf und Bestellung",
    title: "Allgemeine Geschäftsbedingungen",
    intro: "Diese Bedingungen gelten für Bestellungen, die auf Fanovera für Sichtbarkeits- und Kampagnen-Begleitleistungen aufgegeben werden.",
    updatedAt: updatedAtDe,
    sections: [
      { title: "Leistungen", body: ["Fanovera bietet Sichtbarkeits- und Begleitpakete für öffentliche Profile, Seiten, Kanäle, Videos oder Tracks.", "Es wird kein Passwort verlangt. Der Kunde bleibt für den Inhalt, die Konformität und die öffentliche Verfügbarkeit der angegebenen Seite oder des Profils verantwortlich."] },
      { title: "Preise und Zahlung", body: ["Preise werden gegebenenfalls inklusive geltender Steuern angezeigt. Die Zahlung erfolgt über Stripe oder einen anderen auf der Website aktivierten Zahlungsdienstleister.", "Eine Bestellung gilt als gültig, sobald die Zahlung vom Zahlungsdienstleister bestätigt wurde."] },
      { title: "Ausführung", body: ["Die Lieferung beginnt nach Bestätigung der Zahlung und Überprüfung der für die Bestellung erforderlichen Angaben.", "Die angezeigten Zeitfenster sind Richtwerte und können je nach Plattform, Verfügbarkeit der Leistung, Betrugsprüfungen oder vom Kunden bereitgestellten Informationen variieren."] },
      { title: "Grenzen der Leistung", body: ["Fanovera garantiert weder Umsatz, Viralität, künftige organische Interaktion noch Entscheidungen der jeweiligen Drittplattformen.", "Der Kunde verpflichtet sich, korrekte Angaben zu machen und den Dienst nicht für rechtswidrige, irreführende, hetzerische oder rechteverletzende Inhalte zu nutzen."] },
      { title: "Support und Vorfälle", body: ["Bei Bestellfehlern oder Lieferproblemen kontaktiere bitte support@fanovera.com.", "Die Regeln zu Erstattungen und Vorfällen sind auf der Seite „Erstattungen und Lieferung\" detailliert."] },
      { title: "Widerrufsrecht", body: ["Beginnt die Ausführung eines digitalen Dienstes unmittelbar nach der Zahlung mit ausdrücklicher Zustimmung des Verbrauchers, kann das Widerrufsrecht nach den anwendbaren Vorschriften eingeschränkt sein.", "Hat die Ausführung noch nicht begonnen, wende dich so schnell wie möglich an support@fanovera.com."] },
    ],
  },
  privacy: {
    eyebrow: "Personenbezogene Daten",
    title: "Datenschutzerklärung",
    intro: "Diese Erklärung beschreibt, welche Daten Fanovera verarbeitet, zu welchem Zweck und wie du deine Rechte ausüben kannst.",
    updatedAt: updatedAtDe,
    sections: [
      { title: "Verantwortlicher", body: ["Verantwortlicher im Sinne der DSGVO ist Fanovera SAS, 17 rue de Paradis, 75010 Paris, Frankreich.", "Kontakt für Datenschutzanfragen: support@fanovera.com."] },
      { title: "Erhobene Daten", body: ["Fanovera kann deine E-Mail-Adresse, Bestelldetails, öffentliche Seite oder Profil, Währung, Sprache, ungefähres Land sowie für die Website nötige technische Daten verarbeiten.", "Vollständige Kartendaten werden nicht von Fanovera gespeichert; sie werden vom Zahlungsdienstleister verarbeitet."] },
      { title: "Zwecke", body: ["Die Daten dienen der Vorbereitung und Auslieferung der Bestellungen, dem Versand von Bestätigungen, der Support-Bearbeitung, der Zahlungssicherung, der Messung der Website-Leistung und der Produktverbesserung.", "Analytische Daten dürfen weder sensible Informationen noch Kartendaten enthalten."] },
      { title: "Rechtsgrundlage und Speicherdauer", body: ["Die Verarbeitung kann auf der Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO), unserem berechtigten Interesse (lit. f), gesetzlichen Pflichten (lit. c) oder deiner Einwilligung (lit. a), sofern erforderlich, beruhen.", "Die Daten werden so lange aufbewahrt, wie es für die genannten Zwecke erforderlich ist, und dann gemäß den geltenden Pflichten archiviert oder gelöscht."] },
      { title: "Deine Rechte", body: ["Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Datenübertragbarkeit, soweit diese Rechte anwendbar sind.", "Zur Ausübung wende dich an support@fanovera.com. Du kannst zudem Beschwerde bei einer Aufsichtsbehörde einlegen — in Deutschland bei der zuständigen Landesbehörde für Datenschutz."] },
      { title: "Auftragsverarbeiter", body: ["Fanovera kann technische Dienstleister für Hosting, Zahlungen, E-Mail-Versand, Produktanalyse, Sicherheit und Support einsetzen.", "Diese Dienstleister greifen ausschließlich im erforderlichen Umfang auf Daten zu."] },
    ],
  },
  cookies: {
    eyebrow: "Tracker",
    title: "Cookie-Richtlinie",
    intro: "Diese Seite beschreibt die Cookies und Tracker, die Fanovera einsetzen kann.",
    updatedAt: updatedAtDe,
    sections: [
      { title: "Notwendige Cookies", body: ["Einige Cookies sind für den Betrieb der Website erforderlich, etwa um Sprache, Währung, Sitzungsstatus zu speichern oder eine Bestellung abzusichern.", "Diese Cookies lassen sich in der Regel nicht deaktivieren, ohne die Funktion des Dienstes erheblich zu beeinträchtigen."] },
      { title: "Analyse und Produktmessung", body: ["Fanovera kann Tools wie PostHog oder Vercel Analytics einsetzen, um Nutzungspfade nachzuvollziehen, Seiten zu verbessern und Conversions zu messen.", "Sofern dies gesetzlich vorgeschrieben ist, unterliegen nicht notwendige Tracker einer vorherigen Einwilligung."] },
      { title: "Zahlung und Sicherheit", body: ["Stripe oder andere Zahlungsdienstleister können Cookies setzen, die für Sicherheit, Betrugsprävention und Zahlungsabwicklung erforderlich sind.", "Diese Cookies unterliegen den Richtlinien der jeweiligen Anbieter."] },
      { title: "Verwaltung", body: ["Du kannst deinen Browser so konfigurieren, dass Cookies blockiert oder gelöscht werden.", "Wenn in der Produktion einwilligungspflichtige Tracker aktiviert werden, wird ein Einwilligungsbanner oder Präferenzcenter eingebunden."] },
    ],
  },
  refund: {
    eyebrow: "Nach der Zahlung",
    title: "Erstattungen und Lieferung",
    intro: "Diese Seite erläutert die Bearbeitung von Bestellungen, Lieferproblemen und Erstattungsanträgen.",
    updatedAt: updatedAtDe,
    sections: [
      { title: "Bestellstart", body: ["Nach der Zahlung bereitet Fanovera die Bestellung mit den vom Kunden bereitgestellten Informationen vor.", "Ist das Profil, die Seite, das Video oder der Track nicht öffentlich, oder sind die Angaben fehlerhaft, kann sich die Ausführung bis zur Korrektur verzögern."] },
      { title: "Vorfälle", body: ["Bei technischen Problemen, nicht erreichtem Volumen oder Servicefehlern kann Fanovera eine erneute Ausführung, eine Gutschrift, eine Anpassung oder eine vollständige bzw. teilweise Erstattung anbieten — abhängig vom Einzelfall.", "Jede Anfrage wird auf Basis der Bestelldaten, verfügbarer Nachweise und des tatsächlichen Lieferstatus geprüft."] },
      { title: "Widerruf", body: ["Beginnt die Ausführung eines digitalen Dienstes unmittelbar nach der Zahlung mit ausdrücklicher Zustimmung, kann das Widerrufsrecht nach den geltenden Vorschriften eingeschränkt sein.", "Hat die Bestellung noch nicht begonnen, kontaktiere support@fanovera.com so schnell wie möglich."] },
      { title: "Kontakt", body: ["Gib bei Anfragen die Bestell-E-Mail, die betroffene Plattform, den Ziel-Link oder das Zielprofil sowie eine klare Beschreibung des Problems an.", "Kontakt: support@fanovera.com."] },
    ],
  },
};

const es: Record<LegalRouteId, LegalPageCopy> = {
  legalNotice: {
    eyebrow: "Información legal",
    title: "Aviso legal",
    intro: "Esta página recoge la información relativa al editor, al alojamiento y al uso del sitio Fanovera.",
    updatedAt: updatedAtEs,
    sections: [
      { title: "Editor del sitio", body: ["Fanovera SAS, 17 rue de Paradis, 75010 París, Francia.", "Contacto: support@fanovera.com.", "Los datos de inscripción, capital social y representante legal deben completarse con la información definitiva de la empresa antes de cualquier campaña publicitaria a gran escala."] },
      { title: "Alojamiento", body: ["El sitio está alojado por Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, Estados Unidos.", "Los servicios técnicos de terceros utilizados pueden incluir Stripe para los pagos, Resend para los correos transaccionales y PostHog para la medición de producto cuando esté activado."] },
      { title: "Propiedad intelectual", body: ["La marca Fanovera, los textos, interfaces, elementos visuales, gráficos y código presentes en el sitio están protegidos, salvo indicación contraria.", "Queda prohibida cualquier reproducción o reutilización no autorizada del contenido del sitio."] },
      { title: "Responsabilidad", body: ["Fanovera aplica medios razonables para mantener el sitio accesible y exacto, sin garantizar una disponibilidad permanente.", "Las plataformas mencionadas en el sitio son marcas pertenecientes a sus respectivos propietarios. Fanovera no está afiliado a Instagram, TikTok, YouTube, Spotify, Twitch, Facebook, LinkedIn ni X."] },
    ],
  },
  terms: {
    eyebrow: "Venta y pedidos",
    title: "Condiciones generales de venta",
    intro: "Estas condiciones regulan los pedidos realizados en Fanovera para servicios de visibilidad y seguimiento de campaña.",
    updatedAt: updatedAtEs,
    sections: [
      { title: "Servicios", body: ["Fanovera ofrece packs de visibilidad y acompañamiento para perfiles, páginas, canales, vídeos o canciones públicos.", "No se solicita ninguna contraseña. El cliente sigue siendo responsable del contenido, del cumplimiento normativo y de la accesibilidad pública de la página o perfil indicado."] },
      { title: "Precios y pago", body: ["Los precios mostrados se indican con todos los impuestos incluidos cuando proceda. El pago se realiza a través de Stripe o de otro proveedor de pagos activado en el sitio.", "Un pedido se considera validado cuando el pago ha sido confirmado por el proveedor de pagos."] },
      { title: "Ejecución", body: ["La entrega comienza tras la confirmación del pago y la verificación de la información necesaria para el pedido.", "Los plazos indicados son orientativos y pueden variar según la plataforma, la disponibilidad del servicio, los controles antifraude o la información facilitada por el cliente."] },
      { title: "Límites del servicio", body: ["Fanovera no garantiza ingresos, viralidad, interacción orgánica futura ni decisiones de las plataformas de terceros.", "El cliente se compromete a proporcionar información veraz y a no utilizar el servicio para contenidos ilegales, engañosos, de odio o que vulneren derechos."] },
      { title: "Soporte e incidencias", body: ["Para errores en el pedido o problemas de entrega, contacta con support@fanovera.com.", "Las reglas de reembolso y gestión de incidencias se detallan en la página Reembolsos y entrega."] },
      { title: "Derecho de desistimiento", body: ["Cuando la ejecución de un servicio digital comienza inmediatamente tras el pago con el consentimiento expreso del consumidor, el derecho de desistimiento puede verse limitado en las condiciones previstas por la normativa aplicable.", "Si el pedido aún no ha comenzado, contacta con support@fanovera.com lo antes posible."] },
    ],
  },
  privacy: {
    eyebrow: "Datos personales",
    title: "Política de privacidad",
    intro: "Esta política explica qué datos trata Fanovera, con qué finalidad y cómo ejercer tus derechos.",
    updatedAt: updatedAtEs,
    sections: [
      { title: "Responsable del tratamiento", body: ["El responsable del tratamiento en el sentido del RGPD es Fanovera SAS, 17 rue de Paradis, 75010 París, Francia.", "Contacto para consultas de privacidad: support@fanovera.com."] },
      { title: "Datos recogidos", body: ["Fanovera puede tratar tu dirección de correo electrónico, los detalles del pedido, la página o perfil público, la divisa, el idioma, el país aproximado y los datos técnicos necesarios para el sitio.", "Los datos completos de la tarjeta de pago no se almacenan en Fanovera y son tratados por el proveedor de pagos."] },
      { title: "Finalidades", body: ["Los datos se utilizan para preparar y entregar los pedidos, enviar confirmaciones, ofrecer soporte, asegurar los pagos, medir el rendimiento del sitio y mejorar el producto.", "Los datos analíticos no deben contener información sensible ni datos de tarjeta."] },
      { title: "Base legal y conservación", body: ["El tratamiento puede basarse en la ejecución del contrato (art. 6.1.b RGPD), el interés legítimo de Fanovera (art. 6.1.f), obligaciones legales (art. 6.1.c) o tu consentimiento (art. 6.1.a) cuando sea necesario.", "Los datos se conservan durante el tiempo necesario para los fines indicados y, después, se archivan o eliminan conforme a las obligaciones aplicables."] },
      { title: "Tus derechos", body: ["Tienes derecho de acceso, rectificación, supresión, limitación, oposición y portabilidad cuando estos derechos sean aplicables.", "Para ejercerlos, contacta con support@fanovera.com. También puedes presentar una reclamación ante la autoridad de control competente — en España, la Agencia Española de Protección de Datos (AEPD)."] },
      { title: "Encargados del tratamiento", body: ["Fanovera puede utilizar proveedores técnicos para alojamiento, pagos, envío de correos, analítica de producto, seguridad y soporte.", "Estos proveedores acceden a los datos únicamente en la medida necesaria para su función."] },
    ],
  },
  cookies: {
    eyebrow: "Trackers",
    title: "Política de cookies",
    intro: "Esta página describe las cookies y trackers que puede utilizar Fanovera.",
    updatedAt: updatedAtEs,
    sections: [
      { title: "Cookies necesarias", body: ["Algunas cookies son imprescindibles para el funcionamiento del sitio, por ejemplo para recordar el idioma, la divisa, el estado de sesión o asegurar un pedido.", "Estas cookies no siempre pueden desactivarse sin degradar gravemente el servicio."] },
      { title: "Analítica y medición de producto", body: ["Fanovera puede utilizar herramientas como PostHog o Vercel Analytics para entender los recorridos, mejorar las páginas y medir las conversiones.", "Cuando la normativa lo exija, los trackers no esenciales estarán sujetos al consentimiento previo del usuario."] },
      { title: "Pago y seguridad", body: ["Stripe u otros proveedores de pago pueden depositar cookies necesarias para la seguridad, la prevención del fraude y el procesamiento del pago.", "Estas cookies se gestionan según las políticas de los proveedores correspondientes."] },
      { title: "Gestión", body: ["Puedes configurar tu navegador para bloquear o eliminar las cookies.", "Si en producción se activan trackers sujetos a consentimiento, se incorporará un banner o centro de preferencias."] },
    ],
  },
  refund: {
    eyebrow: "Después del pago",
    title: "Reembolsos y entrega",
    intro: "Esta página explica las reglas de gestión de pedidos, incidencias de entrega y solicitudes de reembolso.",
    updatedAt: updatedAtEs,
    sections: [
      { title: "Inicio del pedido", body: ["Tras el pago, Fanovera prepara el pedido con la información proporcionada por el cliente.", "Si el perfil, página, vídeo o canción no es público, o si la información proporcionada es incorrecta, la ejecución puede retrasarse hasta su corrección."] },
      { title: "Incidencias", body: ["En caso de incidencia técnica, volumen no alcanzado o error de servicio, Fanovera puede ofrecer una nueva ejecución, un abono, un ajuste o un reembolso total o parcial según el caso.", "Cada solicitud se examina a partir de la información del pedido, las pruebas disponibles y el estado real de ejecución."] },
      { title: "Desistimiento", body: ["Cuando la ejecución de un servicio digital comienza inmediatamente tras el pago con tu consentimiento expreso, el derecho de desistimiento puede verse limitado conforme a la normativa aplicable.", "Si el pedido aún no ha comenzado, contacta con support@fanovera.com lo antes posible."] },
      { title: "Contacto", body: ["Para cualquier solicitud, indica el correo del pedido, la plataforma afectada, el enlace o perfil objetivo y una descripción clara del problema.", "Contacto: support@fanovera.com."] },
    ],
  },
};

const it: Record<LegalRouteId, LegalPageCopy> = {
  legalNotice: {
    eyebrow: "Informazioni legali",
    title: "Note legali",
    intro: "Questa pagina raccoglie le informazioni relative all'editore, all'hosting e all'utilizzo del sito Fanovera.",
    updatedAt: updatedAtIt,
    sections: [
      { title: "Editore", body: ["Fanovera SAS, 17 rue de Paradis, 75010 Parigi, Francia.", "Contatto: support@fanovera.com.", "Le informazioni relative all'iscrizione al registro delle imprese, al capitale sociale e al rappresentante legale devono essere completate con i dati definitivi della società prima di qualsiasi campagna pubblicitaria su larga scala."] },
      { title: "Hosting", body: ["Il sito è ospitato da Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, Stati Uniti.", "I servizi tecnici di terze parti utilizzati possono includere Stripe per i pagamenti, Resend per le email transazionali e PostHog per la misurazione del prodotto quando la configurazione è attiva."] },
      { title: "Proprietà intellettuale", body: ["Il marchio Fanovera, i testi, le interfacce, gli elementi grafici e il codice presenti sul sito sono protetti, salvo diversa indicazione.", "È vietata qualsiasi riproduzione o riutilizzo non autorizzato dei contenuti del sito."] },
      { title: "Responsabilità", body: ["Fanovera adotta mezzi ragionevoli per mantenere il sito accessibile ed esatto, senza garantire una disponibilità permanente.", "Le piattaforme citate sul sito sono marchi appartenenti ai rispettivi proprietari. Fanovera non è affiliato a Instagram, TikTok, YouTube, Spotify, Twitch, Facebook, LinkedIn o X."] },
    ],
  },
  terms: {
    eyebrow: "Vendita e ordini",
    title: "Condizioni generali di vendita",
    intro: "Queste condizioni regolano gli ordini effettuati su Fanovera per servizi di visibilità e monitoraggio della campagna.",
    updatedAt: updatedAtIt,
    sections: [
      { title: "Servizi", body: ["Fanovera offre pacchetti di visibilità e di accompagnamento per profili, pagine, canali, video o brani pubblici.", "Non viene richiesta alcuna password. Il cliente resta responsabile del contenuto, della conformità e dell'accessibilità pubblica della pagina o del profilo indicato."] },
      { title: "Prezzi e pagamento", body: ["I prezzi indicati sono comprensivi di IVA quando applicabile. Il pagamento avviene tramite Stripe o un altro fornitore di pagamento attivato sul sito.", "Un ordine si considera convalidato quando il pagamento è confermato dal fornitore di pagamento."] },
      { title: "Esecuzione", body: ["La consegna inizia dopo la conferma del pagamento e la verifica delle informazioni necessarie all'ordine.", "I tempi indicati sono indicativi e possono variare in base alla piattaforma, alla disponibilità del servizio, ai controlli antifrode o alle informazioni fornite dal cliente."] },
      { title: "Limiti del servizio", body: ["Fanovera non garantisce ricavi, viralità, interazione organica futura o decisioni delle piattaforme di terze parti.", "Il cliente si impegna a fornire informazioni accurate e a non utilizzare il servizio per contenuti illegali, ingannevoli, d'odio o che violino diritti altrui."] },
      { title: "Supporto e incidenti", body: ["Per errori d'ordine o problemi di consegna, contatta support@fanovera.com.", "Le regole di rimborso e gestione degli incidenti sono dettagliate nella pagina Rimborsi e consegna."] },
      { title: "Diritto di recesso", body: ["Quando l'esecuzione di un servizio digitale inizia immediatamente dopo il pagamento con il consenso espresso del consumatore, il diritto di recesso può essere limitato nei termini previsti dalla normativa applicabile.", "Se l'ordine non è ancora iniziato, contatta support@fanovera.com il prima possibile."] },
    ],
  },
  privacy: {
    eyebrow: "Dati personali",
    title: "Informativa sulla privacy",
    intro: "Questa informativa spiega quali dati Fanovera tratta, con quale finalità e come esercitare i tuoi diritti.",
    updatedAt: updatedAtIt,
    sections: [
      { title: "Titolare del trattamento", body: ["Il titolare del trattamento ai sensi del GDPR è Fanovera SAS, 17 rue de Paradis, 75010 Parigi, Francia.", "Contatto per richieste sulla privacy: support@fanovera.com."] },
      { title: "Dati raccolti", body: ["Fanovera può trattare il tuo indirizzo email, i dettagli dell'ordine, la pagina o il profilo pubblico, la valuta, la lingua, il paese approssimativo e i dati tecnici necessari al sito.", "I dati completi della carta di pagamento non sono conservati da Fanovera e vengono trattati dal fornitore di pagamento."] },
      { title: "Finalità", body: ["I dati sono utilizzati per preparare ed evadere gli ordini, inviare conferme, fornire assistenza, mettere in sicurezza i pagamenti, misurare le performance del sito e migliorare il prodotto.", "I dati analitici non devono contenere informazioni sensibili né dati di carte di pagamento."] },
      { title: "Base giuridica e conservazione", body: ["Il trattamento può fondarsi sull'esecuzione del contratto (art. 6.1.b GDPR), sul legittimo interesse di Fanovera (art. 6.1.f), su obblighi legali (art. 6.1.c) o sul consenso (art. 6.1.a) quando richiesto.", "I dati sono conservati per il tempo necessario alle finalità indicate, poi archiviati o cancellati in base agli obblighi applicabili."] },
      { title: "I tuoi diritti", body: ["Hai diritto di accesso, rettifica, cancellazione, limitazione, opposizione e portabilità, quando questi diritti sono applicabili.", "Per esercitarli, contatta support@fanovera.com. Puoi inoltre presentare un reclamo all'autorità di controllo competente — in Italia, il Garante per la Protezione dei Dati Personali."] },
      { title: "Responsabili del trattamento", body: ["Fanovera può avvalersi di fornitori tecnici per hosting, pagamenti, invio di email, analisi del prodotto, sicurezza e supporto.", "Questi fornitori accedono ai dati solo nella misura necessaria al loro ruolo."] },
    ],
  },
  cookies: {
    eyebrow: "Tracker",
    title: "Informativa sui cookie",
    intro: "Questa pagina descrive i cookie e i tracker che Fanovera può utilizzare.",
    updatedAt: updatedAtIt,
    sections: [
      { title: "Cookie necessari", body: ["Alcuni cookie sono indispensabili al funzionamento del sito, ad esempio per ricordare la lingua, la valuta, lo stato della sessione o per mettere in sicurezza un ordine.", "Questi cookie non possono sempre essere disattivati senza degradare gravemente il servizio."] },
      { title: "Analisi e misurazione del prodotto", body: ["Fanovera può utilizzare strumenti come PostHog o Vercel Analytics per comprendere i percorsi, migliorare le pagine e misurare le conversioni.", "Dove la normativa lo richiede, i tracker non essenziali sono soggetti al consenso preventivo dell'utente."] },
      { title: "Pagamento e sicurezza", body: ["Stripe o altri fornitori di pagamento possono depositare cookie necessari per la sicurezza, la prevenzione delle frodi e l'elaborazione del pagamento.", "Questi cookie sono gestiti secondo le politiche dei rispettivi fornitori."] },
      { title: "Gestione", body: ["Puoi configurare il tuo browser per bloccare o eliminare i cookie.", "Se in produzione vengono attivati tracker soggetti a consenso, sarà presente un banner o un centro preferenze."] },
    ],
  },
  refund: {
    eyebrow: "Dopo il pagamento",
    title: "Rimborsi e consegna",
    intro: "Questa pagina spiega le regole di gestione degli ordini, degli incidenti di consegna e delle richieste di rimborso.",
    updatedAt: updatedAtIt,
    sections: [
      { title: "Avvio dell'ordine", body: ["Dopo il pagamento, Fanovera prepara l'ordine con le informazioni fornite dal cliente.", "Se il profilo, la pagina, il video o il brano non è pubblico, o se l'informazione fornita non è corretta, l'esecuzione può essere ritardata fino alla correzione."] },
      { title: "Incidenti", body: ["In caso di problema tecnico, volume non raggiunto o errore di servizio, Fanovera può proporre una nuova esecuzione, un credito, un aggiustamento o un rimborso totale o parziale, a seconda dei casi.", "Ogni richiesta è esaminata sulla base delle informazioni dell'ordine, delle prove disponibili e dello stato effettivo dell'esecuzione."] },
      { title: "Recesso", body: ["Quando l'esecuzione di un servizio digitale inizia immediatamente dopo il pagamento con il tuo consenso espresso, il diritto di recesso può essere limitato secondo la normativa applicabile.", "Se l'ordine non è ancora iniziato, contatta support@fanovera.com il prima possibile."] },
      { title: "Contatto", body: ["Per qualsiasi richiesta, indica l'email dell'ordine, la piattaforma interessata, il link o profilo di destinazione e una descrizione chiara del problema.", "Contatto: support@fanovera.com."] },
    ],
  },
};

/**
 * Returns the legal page copy for the requested locale.
 *
 * Localization policy:
 *  - `fr` is the authoritative legal version (the company is French, Paris-based).
 *  - `en`, `de`, `es` and `it` ship reviewed translations.
 *  - Other locales fall back to the `en` translation. This is intentional:
 *    a professional legal translation per locale (pt/tr) is required
 *    before serving it to users, otherwise we risk shipping inaccurate clauses
 *    that could weaken our enforceability or compliance posture.
 *  - When adding a new locale, replace the fallback below with the reviewed
 *    `Record<LegalRouteId, LegalPageCopy>` for that locale.
 *
 * UI surfaces consuming this helper (e.g. `LegalPage.tsx`) should ideally show
 * a small notice when the served locale doesn't have a native version — see
 * `LegalPage.tsx` for the implementation.
 */
export function getLegalPageCopy(pageId: LegalRouteId, locale: SupportedLocale): LegalPageCopy {
  if (locale === "fr") return fr[pageId];
  if (locale === "de") return de[pageId];
  if (locale === "es") return es[pageId];
  if (locale === "it") return it[pageId];
  return en[pageId];
}

/** Whether the displayed legal copy is an official translation for the locale. */
export function isLegalLocaleNative(locale: SupportedLocale): boolean {
  return locale === "fr" || locale === "en" || locale === "de" || locale === "es" || locale === "it";
}
