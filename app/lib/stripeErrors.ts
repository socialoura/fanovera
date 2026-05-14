import type { StripeError } from "@stripe/stripe-js";
import type { SupportedLocale } from "../i18n/types";

/**
 * Humanizes Stripe errors into actionable, user-friendly messages.
 * Always pairs the failure cause with a concrete suggestion (try Apple Pay,
 * different card, contact bank). The fallback path mirrors Stripe's raw
 * message so we never hide unknown failure modes.
 */

type ErrorBundle = {
  // Decline reasons (when Stripe returns code === "card_declined")
  decline_generic: string;
  decline_insufficient_funds: string;
  decline_lost_or_stolen: string;
  decline_expired: string;
  decline_processing: string;
  decline_do_not_honor: string;
  // Validation errors (typed-in card data)
  invalid_number: string;
  invalid_expiry: string;
  invalid_cvc: string;
  // Other Stripe error categories
  authentication_required: string;
  rate_limit: string;
  network: string;
  // Generic fallback when we have no mapping
  fallback: string;
  // Suffix appended to most messages to nudge toward Apple Pay / another card
  suggestion: string;
};

const COPY: Record<SupportedLocale, ErrorBundle> = {
  fr: {
    decline_generic: "Carte refusee par votre banque.",
    decline_insufficient_funds: "Provision insuffisante sur la carte.",
    decline_lost_or_stolen: "Cette carte est marquee comme perdue ou volee.",
    decline_expired: "Cette carte est expiree.",
    decline_processing: "Erreur de traitement cote banque.",
    decline_do_not_honor: "Votre banque a bloque ce paiement (regle anti-fraude).",
    invalid_number: "Numero de carte invalide.",
    invalid_expiry: "Date d'expiration invalide.",
    invalid_cvc: "Code de securite (CVC) invalide.",
    authentication_required: "Authentification 3D Secure requise. Validez la dans votre app bancaire.",
    rate_limit: "Trop de tentatives. Patientez quelques secondes puis reessayez.",
    network: "Connexion au service de paiement impossible.",
    fallback: "Le paiement n'a pas abouti.",
    suggestion: " Essayez Apple Pay ou Google Pay (plus haut), ou une autre carte. Si le probleme persiste, contactez votre banque.",
  },
  en: {
    decline_generic: "Card declined by your bank.",
    decline_insufficient_funds: "Insufficient funds on the card.",
    decline_lost_or_stolen: "This card is reported lost or stolen.",
    decline_expired: "This card has expired.",
    decline_processing: "Bank-side processing error.",
    decline_do_not_honor: "Your bank blocked this payment (fraud rule).",
    invalid_number: "Invalid card number.",
    invalid_expiry: "Invalid expiration date.",
    invalid_cvc: "Invalid security code (CVC).",
    authentication_required: "3D Secure authentication required. Approve it in your banking app.",
    rate_limit: "Too many attempts. Wait a few seconds and retry.",
    network: "Cannot reach the payment service.",
    fallback: "Payment did not go through.",
    suggestion: " Try Apple Pay or Google Pay (above), or a different card. If it persists, contact your bank.",
  },
  es: {
    decline_generic: "Tarjeta rechazada por tu banco.",
    decline_insufficient_funds: "Saldo insuficiente en la tarjeta.",
    decline_lost_or_stolen: "Esta tarjeta esta marcada como perdida o robada.",
    decline_expired: "Esta tarjeta esta caducada.",
    decline_processing: "Error de procesamiento del banco.",
    decline_do_not_honor: "Tu banco bloqueo el pago (regla antifraude).",
    invalid_number: "Numero de tarjeta no valido.",
    invalid_expiry: "Fecha de caducidad no valida.",
    invalid_cvc: "Codigo de seguridad (CVC) no valido.",
    authentication_required: "Autenticacion 3D Secure requerida. Validala en tu app bancaria.",
    rate_limit: "Demasiados intentos. Espera unos segundos y vuelve a intentarlo.",
    network: "No se puede conectar con el servicio de pago.",
    fallback: "El pago no se completo.",
    suggestion: " Prueba Apple Pay o Google Pay (arriba), u otra tarjeta. Si persiste, contacta a tu banco.",
  },
  pt: {
    decline_generic: "Cartao recusado pelo seu banco.",
    decline_insufficient_funds: "Saldo insuficiente no cartao.",
    decline_lost_or_stolen: "Este cartao esta marcado como perdido ou roubado.",
    decline_expired: "Este cartao expirou.",
    decline_processing: "Erro de processamento do banco.",
    decline_do_not_honor: "Seu banco bloqueou este pagamento (regra antifraude).",
    invalid_number: "Numero de cartao invalido.",
    invalid_expiry: "Data de validade invalida.",
    invalid_cvc: "Codigo de seguranca (CVC) invalido.",
    authentication_required: "Autenticacao 3D Secure necessaria. Aprove no app do seu banco.",
    rate_limit: "Muitas tentativas. Aguarde alguns segundos e tente de novo.",
    network: "Nao foi possivel conectar ao servico de pagamento.",
    fallback: "O pagamento nao foi concluido.",
    suggestion: " Tente Apple Pay ou Google Pay (acima), ou outro cartao. Se persistir, contacte seu banco.",
  },
  de: {
    decline_generic: "Karte von deiner Bank abgelehnt.",
    decline_insufficient_funds: "Unzureichendes Guthaben auf der Karte.",
    decline_lost_or_stolen: "Diese Karte ist als verloren oder gestohlen gemeldet.",
    decline_expired: "Diese Karte ist abgelaufen.",
    decline_processing: "Verarbeitungsfehler bei der Bank.",
    decline_do_not_honor: "Deine Bank hat diese Zahlung blockiert (Anti-Betrugsregel).",
    invalid_number: "Ungultige Kartennummer.",
    invalid_expiry: "Ungultiges Ablaufdatum.",
    invalid_cvc: "Ungultiger Sicherheitscode (CVC).",
    authentication_required: "3D Secure Authentifizierung erforderlich. Bestatige in deiner Banking-App.",
    rate_limit: "Zu viele Versuche. Warte einige Sekunden und versuche es erneut.",
    network: "Kann den Zahlungsdienst nicht erreichen.",
    fallback: "Die Zahlung wurde nicht abgeschlossen.",
    suggestion: " Probiere Apple Pay oder Google Pay (oben), oder eine andere Karte. Bei Problemen, kontaktiere deine Bank.",
  },
  it: {
    decline_generic: "Carta rifiutata dalla tua banca.",
    decline_insufficient_funds: "Fondi insufficienti sulla carta.",
    decline_lost_or_stolen: "Questa carta risulta smarrita o rubata.",
    decline_expired: "Questa carta e scaduta.",
    decline_processing: "Errore di elaborazione della banca.",
    decline_do_not_honor: "La tua banca ha bloccato questo pagamento (regola antifrode).",
    invalid_number: "Numero di carta non valido.",
    invalid_expiry: "Data di scadenza non valida.",
    invalid_cvc: "Codice di sicurezza (CVC) non valido.",
    authentication_required: "Autenticazione 3D Secure richiesta. Approvala nell'app della tua banca.",
    rate_limit: "Troppi tentativi. Attendi qualche secondo e riprova.",
    network: "Impossibile raggiungere il servizio di pagamento.",
    fallback: "Il pagamento non e andato a buon fine.",
    suggestion: " Prova Apple Pay o Google Pay (sopra), o un'altra carta. Se persiste, contatta la tua banca.",
  },
  tr: {
    decline_generic: "Kart bankaniz tarafindan reddedildi.",
    decline_insufficient_funds: "Kartta yetersiz bakiye.",
    decline_lost_or_stolen: "Bu kart kayip veya calinti olarak isaretli.",
    decline_expired: "Bu kartin suresi dolmus.",
    decline_processing: "Banka tarafinda islem hatasi.",
    decline_do_not_honor: "Bankaniz bu odemeyi engelledi (dolandiricilik kurali).",
    invalid_number: "Gecersiz kart numarasi.",
    invalid_expiry: "Gecersiz son kullanma tarihi.",
    invalid_cvc: "Gecersiz guvenlik kodu (CVC).",
    authentication_required: "3D Secure dogrulamasi gerekli. Bankanizin uygulamasinda onaylayin.",
    rate_limit: "Cok fazla deneme. Birkac saniye bekleyip tekrar deneyin.",
    network: "Odeme servisine baglanilamadi.",
    fallback: "Odeme tamamlanmadi.",
    suggestion: " Apple Pay veya Google Pay'i (yukarida) ya da baska bir kart deneyin. Sorun devam ederse bankanizla iletisime gecin.",
  },
};

type StripeLikeError = Pick<StripeError, "code" | "decline_code" | "message" | "type"> & {
  code?: string | null;
  decline_code?: string | null;
};

function pickReason(err: StripeLikeError, c: ErrorBundle): string {
  const code = err.code || "";
  const declineCode = err.decline_code || "";

  // Card declined: drill into decline_code
  if (code === "card_declined") {
    switch (declineCode) {
      case "insufficient_funds":
        return c.decline_insufficient_funds;
      case "lost_card":
      case "stolen_card":
      case "pickup_card":
        return c.decline_lost_or_stolen;
      case "expired_card":
        return c.decline_expired;
      case "processing_error":
        return c.decline_processing;
      case "do_not_honor":
      case "fraudulent":
      case "merchant_blacklist":
      case "security_violation":
        return c.decline_do_not_honor;
      default:
        return c.decline_generic;
    }
  }

  switch (code) {
    case "expired_card":
      return c.decline_expired;
    case "incorrect_number":
    case "invalid_number":
      return c.invalid_number;
    case "invalid_expiry_month":
    case "invalid_expiry_year":
      return c.invalid_expiry;
    case "incorrect_cvc":
    case "invalid_cvc":
      return c.invalid_cvc;
    case "authentication_required":
    case "payment_intent_authentication_failure":
      return c.authentication_required;
    case "rate_limit":
      return c.rate_limit;
    default:
      return "";
  }
}

export function humanizeStripeError(err: unknown, locale: SupportedLocale): string {
  const c = COPY[locale] || COPY.fr;
  if (!err || typeof err !== "object") return c.fallback + c.suggestion;

  const e = err as StripeLikeError;
  const reason = pickReason(e, c);

  if (reason) return reason + c.suggestion;
  // Unknown / unmapped: keep raw Stripe message but still nudge
  if (e.message) return e.message + c.suggestion;
  return c.fallback + c.suggestion;
}
