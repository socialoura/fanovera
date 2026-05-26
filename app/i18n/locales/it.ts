import en from "./en";
import type { LocaleDictionary } from "../types";

const it: LocaleDictionary = {
  ...en,
  code: "it",
  htmlLang: "it",
  name: "Italiano",
  selector: {
    label: "Lingua",
    aria: "Scegli la lingua",
    titleAuto: "Rilevamento automatico",
    titleManual: "Lingua manuale",
    menuTitle: "Lingua",
    auto: "Auto",
    autoHint: "In base al tuo paese",
    autoMeta: "Auto",
    manualMeta: "Manuale",
    active: "Attiva"},
  status: {
    ordersThisWeek: "{count} ordini consegnati questa settimana"},
  seo: {
    title: "Fanovera - Presenza online assistita dall'IA",
    description:
      "Fanovera aiuta a strutturare la tua presenza online con audit, strategia, calendario contenuti e monitoraggio chiaro."},
  css: {
    popular: "★ POPOLARE",
    bestValue: "✓ MIGLIOR VALORE"},
  exact: { ...en.exact, Suivi: "Monitoraggio", Commencer: "Inizia", Produit: "Prodotto", "Fonctionnement": "Come funziona", "Témoignages": "Recensioni", "Société": "Azienda", Confidentialité: "Privacy", Continuer: "Continua", Retour: "Indietro", Payer: "Paga", "Commande confirmée": "Ordine confermato", "Suivi de commande": "Monitoraggio ordine", "Retour à l'accueil": "Torna alla home", "Voir la solution": "Vedi la soluzione" },
  fragments: [
    ["Une presence en ligne", "Una presenza online"],
    ["Une présence en ligne", "Una presenza online"],
    ["plus claire", "più chiara"],
    ["sans promesses artificielles", "senza promesse artificiali"],
    ["Une visibilité", "Visibilità su"],
    ["Pack visibilité", "Pacchetto visibilità"],
    ["crédit inclus", "credito incluso"],
    ["Remise incluse", "Sconto incluso"],
    ["Quel profil souhaitez-vous promouvoir ?", "Quale profilo vuoi promuovere?"],
    ["Entrez votre pseudo", "Inserisci il tuo username"],
    ["Aucun mot de passe", "Nessuna password"],
    ["aucun accès demandé", "nessun accesso richiesto"],
    ["Le compte doit être public", "L'account deve essere pubblico"],
    ["Chargement du paiement sécurisé", "Caricamento pagamento sicuro"],
    ["Merci pour votre achat. Votre commande a bien été prise en compte.", "Grazie per l'acquisto. Il tuo ordine è stato ricevuto."]]};

export default it;
