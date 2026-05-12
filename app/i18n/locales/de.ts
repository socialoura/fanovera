import en from "./en";
import type { LocaleDictionary } from "../types";

const de: LocaleDictionary = {
  ...en,
  code: "de",
  htmlLang: "de",
  name: "Deutsch",
  selector: {
    label: "Sprache",
    aria: "Sprache wählen",
    titleAuto: "Automatische Erkennung",
    titleManual: "Manuelle Sprache",
    menuTitle: "Sprache",
    auto: "Auto",
    autoHint: "Nach deinem Land",
    autoMeta: "Auto",
    manualMeta: "Manuell",
    active: "Aktiv",
  },
  status: {
    operational: "Alle Dienste sind betriebsbereit",
    asOf: "am",
  },
  seo: {
    title: "Fanovera - KI-gestützte Online-Präsenz",
    description:
      "Fanovera hilft, deine Online-Präsenz mit Audit, Strategie, Content-Kalender und klarem Reporting zu strukturieren.",
  },
  css: {
    popular: "★ BELIEBT",
    bestValue: "✓ BESTER WERT",
  },
  exact: { ...en.exact, Suivi: "Tracking", Commencer: "Starten", Produit: "Produkt", "Fonctionnement": "Ablauf", "Témoignages": "Bewertungen", "Société": "Unternehmen", Confidentialité: "Datenschutz", Continuer: "Weiter", Retour: "Zurück", Payer: "Bezahlen", "Commande confirmée": "Bestellung bestätigt", "Commande confirmÃ©e": "Bestellung bestätigt", "Suivi de commande": "Bestellstatus", "Retour à l'accueil": "Zur Startseite", "Retour Ã  l'accueil": "Zur Startseite", "Voir la solution": "Lösung ansehen" },
  fragments: [
    ["Une presence en ligne", "Eine Online-Präsenz"],
    ["Une présence en ligne", "Eine Online-Präsenz"],
    ["plus claire", "mit mehr Klarheit"],
    ["sans promesses artificielles", "ohne künstliche Versprechen"],
    ["Une visibilité", "Sichtbarkeit auf"],
    ["Une visibilitÃ©", "Sichtbarkeit auf"],
    ["Pack visibilité", "Sichtbarkeitspaket"],
    ["Pack visibilitÃ©", "Sichtbarkeitspaket"],
    ["crédit inclus", "inklusive Guthaben"],
    ["crÃ©dit inclus", "inklusive Guthaben"],
    ["Remise incluse", "Rabatt enthalten"],
    ["Quel profil souhaitez-vous promouvoir ?", "Welches Profil möchtest du bewerben?"],
    ["Entrez votre pseudo", "Gib deinen Nutzernamen ein"],
    ["Aucun mot de passe", "Kein Passwort"],
    ["aucun accès demandé", "kein Zugriff erforderlich"],
    ["aucun accÃ¨s demandÃ©", "kein Zugriff erforderlich"],
    ["Le compte doit être public", "Das Konto muss öffentlich sein"],
    ["Le compte doit Ãªtre public", "Das Konto muss öffentlich sein"],
    ["Chargement du paiement sécurisé", "Sichere Zahlung wird geladen"],
    ["Chargement du paiement sÃ©curisÃ©", "Sichere Zahlung wird geladen"],
    ["Merci pour votre achat. Votre commande a bien été prise en compte.", "Danke für deinen Kauf. Deine Bestellung wurde erfasst."],
    ["Merci pour votre achat. Votre commande a bien Ã©tÃ© prise en compte.", "Danke für deinen Kauf. Deine Bestellung wurde erfasst."],
  ],
};

export default de;
