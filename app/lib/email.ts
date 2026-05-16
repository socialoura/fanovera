/**
 * Email sending via Resend.
 *
 * Required env vars:
 *  - RESEND_API_KEY     — your Resend API key
 *  - RESEND_FROM        — sender (e.g. "Fanovera <noreply@fanovera.com>")
 *  - NEXT_PUBLIC_APP_URL — base URL for tracking links (e.g. "https://fanovera.com")
 */

import { Resend } from "resend";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — emails disabled.");
    return null;
  }
  return new Resend(key);
}

// Strip accidental surrounding quotes / whitespace / newlines from env values.
// Vercel UI usually cleans these up but .env files or shell exports can leak
// them — and Resend rejects `from` for any of these with HTTP 422.
function sanitizeFromAddress(raw: string | undefined): string {
  return (raw || "")
    .replace(/^\s+|\s+$/g, "")
    .replace(/^["']|["']$/g, "")
    .replace(/\r?\n/g, " ")
    .trim();
}

const RESEND_FROM_FALLBACK = "Fanovera <noreply@fanovera.com>";

const RESEND_FROM_RAW =
  sanitizeFromAddress(process.env.RESEND_FROM) ||
  sanitizeFromAddress(process.env.EMAIL_FROM) ||
  RESEND_FROM_FALLBACK;

// Validate against the two formats Resend accepts:
//   "email@domain"            (1)
//   "Name <email@domain>"     (2)
// If the env value is broken, fall back to the hardcoded default rather than
// shipping every email straight into a 422.
const FROM_PLAIN = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const FROM_NAMED = /^[^<>]+<\s*[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+\s*>$/;

export const RESEND_FROM = (() => {
  if (FROM_PLAIN.test(RESEND_FROM_RAW) || FROM_NAMED.test(RESEND_FROM_RAW)) {
    return RESEND_FROM_RAW;
  }
  console.warn(
    `[email] RESEND_FROM env value is invalid (${JSON.stringify(RESEND_FROM_RAW)}). Falling back to ${RESEND_FROM_FALLBACK}.`,
  );
  return RESEND_FROM_FALLBACK;
})();
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://fanovera.com";

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  spotify: "Spotify",
  twitch: "Twitch",
  twitter: "X",
  x: "X",
  linkedin: "LinkedIn",
};

/**
 * Normalize service keys ("ig_followers", "yt_subscribers", "followers", ...)
 * into a base service kind so we don't have to enumerate every prefix.
 */
function baseServiceKind(service: string): string {
  const lower = service.toLowerCase();
  // Strip common platform prefixes (ig_, tt_, yt_, sp_, fb_, x_, tw_, li_)
  const stripped = lower.replace(/^(ig|tt|yt|sp|spo|fb|x|tw|li|in)_/, "");
  if (stripped.includes("follower")) return "followers";
  if (stripped.includes("subscriber")) return "subscribers";
  if (stripped.includes("like")) return "likes";
  if (stripped.includes("view")) return "views";
  if (stripped.includes("comment")) return "comments";
  if (stripped.includes("monthly") || stripped.includes("listener")) return "monthly_listeners";
  if (stripped.includes("play") || stripped.includes("stream")) return "plays";
  if (stripped.includes("share")) return "shares";
  if (stripped.includes("save")) return "saves";
  return stripped;
}

const SERVICE_LABELS: Record<EmailLocale, Record<string, string>> = {
  fr: {
    followers: "Abonn\u00e9s",
    subscribers: "Abonn\u00e9s",
    likes: "Likes",
    views: "Vues",
    comments: "Commentaires",
    monthly_listeners: "Auditeurs mensuels",
    plays: "\u00c9coutes",
    shares: "Partages",
    saves: "Sauvegardes",
  },
  en: {
    followers: "Followers",
    subscribers: "Subscribers",
    likes: "Likes",
    views: "Views",
    comments: "Comments",
    monthly_listeners: "Monthly listeners",
    plays: "Plays",
    shares: "Shares",
    saves: "Saves",
  },
  es: {
    followers: "Seguidores",
    subscribers: "Suscriptores",
    likes: "Me gusta",
    views: "Visualizaciones",
    comments: "Comentarios",
    monthly_listeners: "Oyentes mensuales",
    plays: "Reproducciones",
    shares: "Compartidos",
    saves: "Guardados",
  },
  pt: {
    followers: "Seguidores",
    subscribers: "Inscritos",
    likes: "Curtidas",
    views: "Visualiza\u00e7\u00f5es",
    comments: "Coment\u00e1rios",
    monthly_listeners: "Ouvintes mensais",
    plays: "Reprodu\u00e7\u00f5es",
    shares: "Compartilhamentos",
    saves: "Salvos",
  },
  de: {
    followers: "Follower",
    subscribers: "Abonnenten",
    likes: "Likes",
    views: "Aufrufe",
    comments: "Kommentare",
    monthly_listeners: "Monatliche H\u00f6rer",
    plays: "Wiedergaben",
    shares: "Geteilt",
    saves: "Gespeichert",
  },
  it: {
    followers: "Follower",
    subscribers: "Iscritti",
    likes: "Mi piace",
    views: "Visualizzazioni",
    comments: "Commenti",
    monthly_listeners: "Ascoltatori mensili",
    plays: "Riproduzioni",
    shares: "Condivisioni",
    saves: "Salvataggi",
  },
  tr: {
    followers: "Takip\u00e7i",
    subscribers: "Abone",
    likes: "Be\u011feni",
    views: "G\u00f6r\u00fcnt\u00fclenme",
    comments: "Yorum",
    monthly_listeners: "Ayl\u0131k dinleyici",
    plays: "Dinleme",
    shares: "Payla\u015f\u0131m",
    saves: "Kaydedilen",
  },
};

function localizedServiceLabel(service: string | undefined, locale: EmailLocale): string {
  if (!service) return "Service";
  const kind = baseServiceKind(service);
  return SERVICE_LABELS[locale]?.[kind] || SERVICE_LABELS.en[kind] || service;
}

const CURRENCY_SYMBOL: Record<string, string> = {
  eur: "€",
  usd: "$",
  gbp: "£",
  cad: "CA$",
  nzd: "NZ$",
  aud: "A$",
  chf: "CHF",
};

function fmtPrice(cents: number, currency = "eur", locale: EmailLocale = "fr"): string {
  const cur = currency.toUpperCase();
  try {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-FR", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    // Fallback if the runtime doesn't know the currency code.
    const sym = CURRENCY_SYMBOL[currency.toLowerCase()] || "€";
    return `${(cents / 100).toFixed(2)} ${sym}`;
  }
}

function fmtQty(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return String(n);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── Localized copy ──

type EmailLocale = "fr" | "en" | "es" | "pt" | "de" | "it" | "tr";

const EMAIL_LOCALES: EmailLocale[] = ["fr", "en", "es", "pt", "de", "it", "tr"];

function normalizeEmailLocale(locale?: string): EmailLocale {
  const short = (locale || "").toLowerCase().split("-")[0];
  return (EMAIL_LOCALES as string[]).includes(short) ? (short as EmailLocale) : "fr";
}

type EmailCopy = {
  subject: (orderId: number) => string;
  htmlLang: EmailLocale;
  title: string;
  heroTitle: string;
  heroBody: (orderId: number) => string;
  detailsLabel: string;
  platformLabel: string;
  accountLabel: string;
  totalLabel: string;
  trackingIntro: string;
  trackingButton: string;
  orCopyLink: string;
  whatsNextLabel: string;
  step1: string;
  step2: string;
  step3: string;
  manageOrders: string;
  footerLine: string;
  // Plain-text labels
  textDetails: string;
  textTracking: string;
  textWhatsNext: string;
};

const EMAIL_COPY: Record<EmailLocale, EmailCopy> = {
  fr: {
    subject: (id) => `Confirmation de commande #${id} — Fanovera`,
    htmlLang: "fr",
    title: "Confirmation de commande",
    heroTitle: "Merci pour ta commande !",
    heroBody: (id) => `Ta commande <strong style="color:#111827;">#${id}</strong> est confirmée. On la lance immédiatement.`,
    detailsLabel: "Détail de la commande",
    platformLabel: "Plateforme",
    accountLabel: "Compte",
    totalLabel: "Total payé",
    trackingIntro: "Tu peux suivre la livraison en temps réel ici :",
    trackingButton: "Suivre ma commande →",
    orCopyLink: "ou copie ce lien :",
    whatsNextLabel: "Et maintenant ?",
    step1: "Activation immédiate (en moins de 60 secondes)",
    step2: "Livraison progressive pour un effet 100&nbsp;% naturel",
    step3: "Une question ? Réponds simplement à cet email — on est là.",
    manageOrders: "Voir toutes mes commandes",
    footerLine: "Tu reçois cet email car tu as passé une commande sur Fanovera.",
    textDetails: "DÉTAIL",
    textTracking: "SUIVI",
    textWhatsNext: "Et maintenant ?",
  },
  en: {
    subject: (id) => `Order confirmation #${id} — Fanovera`,
    htmlLang: "en",
    title: "Order confirmation",
    heroTitle: "Thanks for your order!",
    heroBody: (id) => `Your order <strong style="color:#111827;">#${id}</strong> is confirmed. We're starting it right away.`,
    detailsLabel: "Order details",
    platformLabel: "Platform",
    accountLabel: "Account",
    totalLabel: "Total paid",
    trackingIntro: "Track delivery in real time here:",
    trackingButton: "Track my order →",
    orCopyLink: "or copy this link:",
    whatsNextLabel: "What's next?",
    step1: "Immediate activation (under 60 seconds)",
    step2: "Gradual delivery for a 100&nbsp;% natural effect",
    step3: "Got a question? Just reply to this email — we're here.",
    manageOrders: "View all my orders",
    footerLine: "You're receiving this email because you placed an order on Fanovera.",
    textDetails: "DETAILS",
    textTracking: "TRACKING",
    textWhatsNext: "What's next?",
  },
  es: {
    subject: (id) => `Confirmación de pedido #${id} — Fanovera`,
    htmlLang: "es",
    title: "Confirmación de pedido",
    heroTitle: "¡Gracias por tu pedido!",
    heroBody: (id) => `Tu pedido <strong style="color:#111827;">#${id}</strong> está confirmado. Lo lanzamos de inmediato.`,
    detailsLabel: "Detalles del pedido",
    platformLabel: "Plataforma",
    accountLabel: "Cuenta",
    totalLabel: "Total pagado",
    trackingIntro: "Sigue la entrega en tiempo real aquí:",
    trackingButton: "Seguir mi pedido →",
    orCopyLink: "o copia este enlace:",
    whatsNextLabel: "¿Y ahora?",
    step1: "Activación inmediata (en menos de 60 segundos)",
    step2: "Entrega progresiva para un efecto 100&nbsp;% natural",
    step3: "¿Una pregunta? Responde a este correo — estamos aquí.",
    manageOrders: "Ver todos mis pedidos",
    footerLine: "Recibes este correo porque has realizado un pedido en Fanovera.",
    textDetails: "DETALLES",
    textTracking: "SEGUIMIENTO",
    textWhatsNext: "¿Y ahora?",
  },
  pt: {
    subject: (id) => `Confirmação do pedido #${id} — Fanovera`,
    htmlLang: "pt",
    title: "Confirmação do pedido",
    heroTitle: "Obrigado pelo seu pedido!",
    heroBody: (id) => `O seu pedido <strong style="color:#111827;">#${id}</strong> foi confirmado. Vamos iniciá-lo imediatamente.`,
    detailsLabel: "Detalhes do pedido",
    platformLabel: "Plataforma",
    accountLabel: "Conta",
    totalLabel: "Total pago",
    trackingIntro: "Acompanhe a entrega em tempo real aqui:",
    trackingButton: "Acompanhar meu pedido →",
    orCopyLink: "ou copie este link:",
    whatsNextLabel: "E agora?",
    step1: "Ativação imediata (em menos de 60 segundos)",
    step2: "Entrega progressiva para um efeito 100&nbsp;% natural",
    step3: "Uma pergunta? Basta responder a este e-mail — estamos aqui.",
    manageOrders: "Ver todos os meus pedidos",
    footerLine: "Você está recebendo este e-mail porque fez um pedido na Fanovera.",
    textDetails: "DETALHES",
    textTracking: "ACOMPANHAMENTO",
    textWhatsNext: "E agora?",
  },
  de: {
    subject: (id) => `Bestellbestätigung #${id} — Fanovera`,
    htmlLang: "de",
    title: "Bestellbestätigung",
    heroTitle: "Danke für deine Bestellung!",
    heroBody: (id) => `Deine Bestellung <strong style="color:#111827;">#${id}</strong> ist bestätigt. Wir starten sie sofort.`,
    detailsLabel: "Bestelldetails",
    platformLabel: "Plattform",
    accountLabel: "Konto",
    totalLabel: "Gesamtbetrag",
    trackingIntro: "Verfolge die Lieferung in Echtzeit hier:",
    trackingButton: "Bestellung verfolgen →",
    orCopyLink: "oder kopiere diesen Link:",
    whatsNextLabel: "Wie geht es weiter?",
    step1: "Sofortige Aktivierung (in weniger als 60 Sekunden)",
    step2: "Schrittweise Lieferung für eine 100&nbsp;% natürliche Wirkung",
    step3: "Eine Frage? Antworte einfach auf diese E-Mail — wir sind da.",
    manageOrders: "Alle meine Bestellungen ansehen",
    footerLine: "Du erhältst diese E-Mail, weil du eine Bestellung bei Fanovera aufgegeben hast.",
    textDetails: "DETAILS",
    textTracking: "TRACKING",
    textWhatsNext: "Wie geht es weiter?",
  },
  it: {
    subject: (id) => `Conferma d'ordine #${id} — Fanovera`,
    htmlLang: "it",
    title: "Conferma d'ordine",
    heroTitle: "Grazie per il tuo ordine!",
    heroBody: (id) => `Il tuo ordine <strong style="color:#111827;">#${id}</strong> è confermato. Lo avviamo subito.`,
    detailsLabel: "Dettagli dell'ordine",
    platformLabel: "Piattaforma",
    accountLabel: "Account",
    totalLabel: "Totale pagato",
    trackingIntro: "Segui la consegna in tempo reale qui:",
    trackingButton: "Traccia il mio ordine →",
    orCopyLink: "oppure copia questo link:",
    whatsNextLabel: "E adesso?",
    step1: "Attivazione immediata (in meno di 60 secondi)",
    step2: "Consegna progressiva per un effetto 100&nbsp;% naturale",
    step3: "Una domanda? Rispondi a questa e-mail — siamo qui.",
    manageOrders: "Vedi tutti i miei ordini",
    footerLine: "Ricevi questa e-mail perché hai effettuato un ordine su Fanovera.",
    textDetails: "DETTAGLI",
    textTracking: "TRACCIAMENTO",
    textWhatsNext: "E adesso?",
  },
  tr: {
    subject: (id) => `Sipariş onayı #${id} — Fanovera`,
    htmlLang: "tr",
    title: "Sipariş onayı",
    heroTitle: "Siparişin için teşekkürler!",
    heroBody: (id) => `<strong style="color:#111827;">#${id}</strong> numaralı siparişin onaylandı. Hemen başlatıyoruz.`,
    detailsLabel: "Sipariş ayrıntıları",
    platformLabel: "Platform",
    accountLabel: "Hesap",
    totalLabel: "Ödenen toplam",
    trackingIntro: "Teslimatı buradan gerçek zamanlı takip et:",
    trackingButton: "Siparişimi takip et →",
    orCopyLink: "veya bu bağlantıyı kopyala:",
    whatsNextLabel: "Sırada ne var?",
    step1: "Anında etkinleştirme (60 saniyeden kısa sürede)",
    step2: "%100 doğal etki için kademeli teslimat",
    step3: "Sorun mu var? Bu e-postayı yanıtlaman yeterli — buradayız.",
    manageOrders: "Tüm siparişlerimi görüntüle",
    footerLine: "Bu e-postayı, Fanovera üzerinde bir sipariş verdiğin için alıyorsun.",
    textDetails: "AYRINTILAR",
    textTracking: "TAKİP",
    textWhatsNext: "Sırada ne var?",
  },
};

// ── Order confirmation ──

export interface OrderConfirmationParams {
  to: string;
  orderId: number;
  username: string;
  platform: string;
  cart: Array<{
    service?: string;
    label?: string;
    qty?: number;
    quantity?: number;
    price?: number;
  }>;
  totalCents: number;
  currency?: string;
  /**
   * Customer-facing locale at checkout time. Used to build the right tracking
   * URL (e.g. `/en/track/123` for an English visitor) so the page renders in
   * the right language when they click from their inbox (no cookie there).
   * Defaults to the FR routing if missing.
   */
  locale?: string;
}

/** Whitelist of supported tracking-URL locale prefixes. */
const TRACK_URL_LOCALES = new Set(["fr", "en", "es", "pt", "de", "it", "tr"]);

function buildTrackingUrl(orderId: number, locale?: string): string {
  const normalized = (locale || "").toLowerCase().split("-")[0];
  if (normalized && TRACK_URL_LOCALES.has(normalized) && normalized !== "fr") {
    return `${APP_URL}/${normalized}/track/${orderId}`;
  }
  return `${APP_URL}/track/${orderId}`;
}

/**
 * Sends an order confirmation email to the customer.
 * Returns { ok: true } on success, { ok: false, error } on failure.
 * Never throws — emails are non-critical and shouldn't break checkout.
 */
export async function sendOrderConfirmation(
  params: OrderConfirmationParams,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "Resend not configured" };

  try {
    const html = renderOrderConfirmationHtml(params);
    const text = renderOrderConfirmationText(params);
    const copy = EMAIL_COPY[normalizeEmailLocale(params.locale)];

    const result = await resend.emails.send({
      from: RESEND_FROM,
      to: params.to,
      subject: copy.subject(params.orderId),
      html,
      text,
    });

    if (result.error) {
      console.error("[email] Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }

    return { ok: true, id: result.data?.id };
  } catch (err) {
    console.error("[email] sendOrderConfirmation error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── HTML template ──

function renderOrderConfirmationHtml(p: OrderConfirmationParams): string {
  const locale = normalizeEmailLocale(p.locale);
  const copy = EMAIL_COPY[locale];
  const platformLabel = PLATFORM_LABEL[p.platform] || p.platform;
  const trackingUrl = buildTrackingUrl(p.orderId, p.locale);
  const currency = p.currency || "eur";

  const itemsHtml = p.cart
    .map((it) => {
      const qty = it.qty || it.quantity || 0;
      const lbl = escapeHtml(it.label || localizedServiceLabel(it.service, locale));
      const priceCell =
        it.price !== undefined
          ? `<td align="right" style="padding:12px 0;font-size:14px;color:#6b7280;">${fmtPrice(Math.round(it.price * 100), currency, locale)}</td>`
          : "";
      return `
        <tr>
          <td style="padding:12px 0;font-size:14px;color:#111827;border-top:1px solid #e5e7eb;">
            <strong>${fmtQty(qty)}</strong> ${lbl}
          </td>
          ${priceCell ? priceCell.replace("padding:12px 0", "padding:12px 0;border-top:1px solid #e5e7eb") : ""}
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="${copy.htmlLang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${copy.title}</title>
</head>
<body style="margin:0;padding:0;background:#f8f6f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f6f1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${APP_URL}" style="text-decoration:none;display:inline-block;">
                <img src="${APP_URL}/fanovera-logo.png" alt="Fanovera" width="140" height="auto" style="display:block;height:auto;max-height:42px;border:0;outline:none;" />
              </a>
            </td>
          </tr>

          <!-- Hero card -->
          <tr>
            <td style="background:#ffffff;border-radius:18px;border:1px solid #e5e7eb;padding:36px 32px;text-align:center;">
              <div style="font-size:44px;line-height:1;margin-bottom:12px;">🎉</div>
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.02em;">
                ${copy.heroTitle}
              </h1>
              <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.55;">
                ${copy.heroBody(p.orderId)}
              </p>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:16px;line-height:16px;font-size:0;">&nbsp;</td></tr>

          <!-- Order details -->
          <tr>
            <td style="background:#ffffff;border-radius:18px;border:1px solid #e5e7eb;padding:24px 28px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:14px;">
                ${copy.detailsLabel}
              </div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                <tr>
                  <td style="font-size:14px;color:#6b7280;padding-bottom:6px;">${copy.platformLabel}</td>
                  <td align="right" style="font-size:14px;font-weight:600;color:#111827;padding-bottom:6px;">${escapeHtml(platformLabel)}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#6b7280;padding-bottom:6px;">${copy.accountLabel}</td>
                  <td align="right" style="font-size:14px;font-weight:600;color:#111827;padding-bottom:6px;">@${escapeHtml(p.username)}</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${itemsHtml}
                <tr>
                  <td style="padding:14px 0 0;border-top:2px solid #111827;font-size:15px;font-weight:700;color:#111827;">${copy.totalLabel}</td>
                  <td align="right" style="padding:14px 0 0;border-top:2px solid #111827;font-size:16px;font-weight:800;color:#111827;">
                    ${fmtPrice(p.totalCents, currency, locale)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:16px;line-height:16px;font-size:0;">&nbsp;</td></tr>

          <!-- Tracking CTA -->
          <tr>
            <td align="center" style="background:#ffffff;border-radius:18px;border:1px solid #e5e7eb;padding:28px 28px;">
              <div style="font-size:15px;color:#374151;margin-bottom:18px;line-height:1.55;">
                ${copy.trackingIntro}
              </div>
              <a href="${trackingUrl}"
                 style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 28px;border-radius:12px;">
                ${copy.trackingButton}
              </a>
              <div style="margin-top:14px;font-size:12px;color:#9ca3af;">
                ${copy.orCopyLink} <a href="${trackingUrl}" style="color:#6b7280;">${trackingUrl}</a>
              </div>
              <div style="margin-top:18px;font-size:13px;">
                <a href="${APP_URL}/account" style="color:#5260e6;text-decoration:none;font-weight:600;">${copy.manageOrders} →</a>
              </div>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:24px;line-height:24px;font-size:0;">&nbsp;</td></tr>

          <!-- Steps -->
          <tr>
            <td style="padding:0 8px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:12px;">
                ${copy.whatsNextLabel}
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top" style="font-size:14px;color:#374151;line-height:1.6;padding:6px 0;">
                    <strong style="color:#111827;">1.</strong> ${copy.step1}
                  </td>
                </tr>
                <tr>
                  <td valign="top" style="font-size:14px;color:#374151;line-height:1.6;padding:6px 0;">
                    <strong style="color:#111827;">2.</strong> ${copy.step2}
                  </td>
                </tr>
                <tr>
                  <td valign="top" style="font-size:14px;color:#374151;line-height:1.6;padding:6px 0;">
                    <strong style="color:#111827;">3.</strong> ${copy.step3}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 8px 0;border-top:1px solid #e5e7eb;margin-top:32px;">
              <div style="font-size:12px;color:#9ca3af;line-height:1.55;text-align:center;padding-top:24px;">
                ${copy.footerLine}<br>
                <a href="${APP_URL}" style="color:#6b7280;text-decoration:underline;">fanovera.com</a> · 17 rue de Paradis · 75010 Paris<br>
                © Fanovera SAS ${new Date().getFullYear()}
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Plain-text fallback ──

function renderOrderConfirmationText(p: OrderConfirmationParams): string {
  const locale = normalizeEmailLocale(p.locale);
  const copy = EMAIL_COPY[locale];
  const platformLabel = PLATFORM_LABEL[p.platform] || p.platform;
  const trackingUrl = buildTrackingUrl(p.orderId, p.locale);
  const currency = p.currency || "eur";

  const items = p.cart
    .map((it) => {
      const qty = it.qty || it.quantity || 0;
      const lbl = it.label || localizedServiceLabel(it.service, locale);
      return `  • ${fmtQty(qty)} ${lbl}`;
    })
    .join("\n");

  // Strip HTML tags & entities from copy values that may contain inline markup.
  const stripHtml = (s: string) =>
    s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

  return `${copy.heroTitle}

${stripHtml(copy.heroBody(p.orderId))}

${copy.textDetails}
------
${copy.platformLabel} : ${platformLabel}
${copy.accountLabel}    : @${p.username}

${items}

${copy.totalLabel} : ${fmtPrice(p.totalCents, currency, locale)}

${copy.textTracking}
-----
${trackingUrl}

${copy.textWhatsNext}
1. ${stripHtml(copy.step1)}
2. ${stripHtml(copy.step2)}
3. ${stripHtml(copy.step3)}

—
Fanovera SAS · 17 rue de Paradis · 75010 Paris
${APP_URL}`;
}

// ── Abandoned-cart recovery ──

export interface AbandonedCartParams {
  to: string;
  platform: string;
  username: string;
  amountCents: number;
  currency: string;
  recoveryUrl: string;
  locale?: string;
}

const ABANDONED_COPY: Record<EmailLocale, {
  subject: string;
  hero: string;
  intro: (handle: string) => string;
  benefit1: string;
  benefit2: string;
  benefit3: string;
  cta: string;
  fallback: string;
  reassurance: string;
  ignore: string;
}> = {
  fr: {
    subject: "Tu as oublié quelque chose ?",
    hero: "Ta commande t'attend",
    intro: (h) => `Tu étais à deux clics de booster ${h}. On a sauvegardé ta sélection — tu peux finaliser en moins d'une minute.`,
    benefit1: "Activation immédiate",
    benefit2: "Livraison progressive 100% naturelle",
    benefit3: "Sans mot de passe ni accès au compte",
    cta: "Reprendre ma commande →",
    fallback: "Ou copie ce lien :",
    reassurance: "Paiement sécurisé Stripe · Aucune donnée sensible stockée",
    ignore: "Tu reçois cet email car tu as commencé une commande sur Fanovera. Si ce n'est pas toi, ignore simplement ce message.",
  },
  en: {
    subject: "Did you forget something?",
    hero: "Your order is waiting",
    intro: (h) => `You were two clicks away from boosting ${h}. We saved your selection — you can finish in under a minute.`,
    benefit1: "Immediate activation",
    benefit2: "Gradual 100% natural delivery",
    benefit3: "No password, no account access",
    cta: "Resume my order →",
    fallback: "Or copy this link:",
    reassurance: "Secure Stripe payment · No sensitive data stored",
    ignore: "You're receiving this because you started an order on Fanovera. If it wasn't you, just ignore this message.",
  },
  es: {
    subject: "¿Olvidaste algo?",
    hero: "Tu pedido te espera",
    intro: (h) => `Estabas a dos clics de impulsar ${h}. Guardamos tu selección — puedes terminar en menos de un minuto.`,
    benefit1: "Activación inmediata",
    benefit2: "Entrega progresiva 100% natural",
    benefit3: "Sin contraseña ni acceso a la cuenta",
    cta: "Continuar mi pedido →",
    fallback: "O copia este enlace:",
    reassurance: "Pago seguro Stripe · Sin datos sensibles",
    ignore: "Recibes este correo porque iniciaste un pedido en Fanovera. Si no eras tú, ignora este mensaje.",
  },
  pt: {
    subject: "Esqueceu algo?",
    hero: "Seu pedido está esperando",
    intro: (h) => `Você estava a dois cliques de impulsionar ${h}. Salvamos sua seleção — você pode finalizar em menos de um minuto.`,
    benefit1: "Ativação imediata",
    benefit2: "Entrega progressiva 100% natural",
    benefit3: "Sem senha nem acesso à conta",
    cta: "Retomar meu pedido →",
    fallback: "Ou copie este link:",
    reassurance: "Pagamento seguro Stripe · Sem dados sensíveis",
    ignore: "Você recebe este e-mail porque iniciou um pedido na Fanovera. Se não foi você, ignore.",
  },
  de: {
    subject: "Hast du etwas vergessen?",
    hero: "Deine Bestellung wartet",
    intro: (h) => `Du warst zwei Klicks davon entfernt, ${h} zu pushen. Wir haben deine Auswahl gespeichert — fertigstellen in unter einer Minute.`,
    benefit1: "Sofortige Aktivierung",
    benefit2: "Schrittweise 100% natürliche Lieferung",
    benefit3: "Kein Passwort, kein Konto-Zugriff",
    cta: "Bestellung fortsetzen →",
    fallback: "Oder kopiere diesen Link:",
    reassurance: "Sichere Stripe-Zahlung · Keine sensiblen Daten",
    ignore: "Du erhältst diese E-Mail, weil du eine Bestellung auf Fanovera begonnen hast. Wenn du das nicht warst, ignoriere die Nachricht.",
  },
  it: {
    subject: "Hai dimenticato qualcosa?",
    hero: "Il tuo ordine ti aspetta",
    intro: (h) => `Eri a due clic dal boostare ${h}. Abbiamo salvato la tua selezione — puoi finire in meno di un minuto.`,
    benefit1: "Attivazione immediata",
    benefit2: "Consegna progressiva 100% naturale",
    benefit3: "Senza password né accesso all'account",
    cta: "Riprendi il mio ordine →",
    fallback: "O copia questo link:",
    reassurance: "Pagamento sicuro Stripe · Nessun dato sensibile",
    ignore: "Ricevi questa email perché hai iniziato un ordine su Fanovera. Se non sei stato tu, ignora.",
  },
  tr: {
    subject: "Bir şeyi unuttun mu?",
    hero: "Siparişin seni bekliyor",
    intro: (h) => `${h} için boost yapmana iki tık kaldı. Seçimini kaydettik — bir dakikadan kısa sürede tamamlayabilirsin.`,
    benefit1: "Anında etkinleştirme",
    benefit2: "%100 doğal kademeli teslimat",
    benefit3: "Şifre veya hesap erişimi gerekmez",
    cta: "Siparişe devam et →",
    fallback: "Veya bu bağlantıyı kopyala:",
    reassurance: "Güvenli Stripe ödemesi · Hassas veri saklanmaz",
    ignore: "Fanovera'da bir sipariş başlattığın için bu e-postayı alıyorsun. Sen değildiysen yok say.",
  },
};

const ABANDONED_LOCALE_TAG: Record<EmailLocale, string> = {
  fr: "fr-FR", en: "en-US", es: "es-ES", pt: "pt-PT", de: "de-DE", it: "it-IT", tr: "tr-TR",
};

function fmtPriceForAbandoned(amountCents: number, currency: string, locale: EmailLocale): string {
  try {
    return new Intl.NumberFormat(ABANDONED_LOCALE_TAG[locale] || "fr-FR", {
      style: "currency",
      currency: (currency || "EUR").toUpperCase(),
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${(currency || "eur").toUpperCase()}`;
  }
}

export async function sendAbandonedCartEmail(
  p: AbandonedCartParams,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "Resend not configured" };

  try {
    const locale = normalizeEmailLocale(p.locale);
    const copy = ABANDONED_COPY[locale];
    const platformLabel = PLATFORM_LABEL[p.platform] || p.platform;
    const handle = p.username ? `@${p.username.replace(/^@/, "")}` : platformLabel;
    const priceText = fmtPriceForAbandoned(p.amountCents, p.currency, locale);

    const html = `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8" /><title>${escapeHtml(copy.subject)}</title></head>
<body style="margin:0;padding:0;background:#f8f6f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f6f1;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <tr><td align="center" style="padding-bottom:24px;">
          <a href="${APP_URL}" style="text-decoration:none;display:inline-block;">
            <img src="${APP_URL}/fanovera-logo.png" alt="Fanovera" width="140" height="auto" style="display:block;height:auto;max-height:42px;border:0;outline:none;" />
          </a>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:18px;border:1px solid #e5e7eb;padding:36px 32px;">
          <div style="text-align:center;">
            <div style="font-size:48px;line-height:1;margin-bottom:12px;">🛒</div>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.02em;">${escapeHtml(copy.hero)}</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.55;">${escapeHtml(copy.intro(handle))}</p>
          </div>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <div>
                <div style="font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(platformLabel)}</div>
                <div style="font-size:16px;font-weight:700;color:#111827;margin-top:2px;">${escapeHtml(handle)}</div>
              </div>
              <div style="font-size:22px;font-weight:800;color:#5260e6;letter-spacing:-0.02em;">${escapeHtml(priceText)}</div>
            </div>
          </div>
          <p style="margin:0 0 24px;text-align:center;">
            <a href="${p.recoveryUrl}" style="display:inline-block;background:#5260e6;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:16px 32px;border-radius:12px;">${escapeHtml(copy.cta)}</a>
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;color:#6b7280;line-height:1.6;">
            <tr><td style="padding:4px 0;">✓ ${escapeHtml(copy.benefit1)}</td></tr>
            <tr><td style="padding:4px 0;">✓ ${escapeHtml(copy.benefit2)}</td></tr>
            <tr><td style="padding:4px 0;">✓ ${escapeHtml(copy.benefit3)}</td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.5;border-top:1px solid #e5e7eb;padding-top:18px;">${escapeHtml(copy.reassurance)}</p>
        </td></tr>
        <tr><td style="padding:18px 8px 0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.5;">
          ${escapeHtml(copy.ignore)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const text = `${copy.hero}

${copy.intro(handle)}

${platformLabel} · ${handle}
${priceText}

${copy.cta}
${p.recoveryUrl}

✓ ${copy.benefit1}
✓ ${copy.benefit2}
✓ ${copy.benefit3}

${copy.reassurance}

${copy.ignore}

—
Fanovera · ${APP_URL}`;

    const result = await resend.emails.send({
      from: RESEND_FROM,
      to: p.to,
      subject: copy.subject,
      html,
      text,
    });
    if (result.error) {
      console.error("[email] abandoned cart Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id };
  } catch (err) {
    console.error("[email] sendAbandonedCartEmail error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── Magic-link sign-in email ──

const MAGIC_LINK_COPY: Record<EmailLocale, {
  subject: string;
  title: string;
  intro: string;
  cta: string;
  fallback: string;
  expiry: string;
  ignore: string;
}> = {
  fr: {
    subject: "Votre lien de connexion Fanovera",
    title: "Voici votre lien de connexion",
    intro: "Cliquez sur le bouton ci-dessous pour accéder à vos commandes Fanovera. Aucun mot de passe à retenir.",
    cta: "Accéder à mes commandes →",
    fallback: "Ou copiez ce lien dans votre navigateur :",
    expiry: "Ce lien expire dans 15 minutes pour des raisons de sécurité.",
    ignore: "Vous n'avez pas demandé ce lien ? Ignorez simplement cet email — personne ne pourra accéder à votre compte sans cliquer dessus.",
  },
  en: {
    subject: "Your Fanovera sign-in link",
    title: "Here's your sign-in link",
    intro: "Tap the button below to access your Fanovera orders. No password to remember.",
    cta: "Access my orders →",
    fallback: "Or copy this link into your browser:",
    expiry: "This link expires in 15 minutes for security reasons.",
    ignore: "Didn't request this? Just ignore this email — no one can access your account without clicking the link.",
  },
  es: {
    subject: "Tu enlace de acceso a Fanovera",
    title: "Aquí está tu enlace de acceso",
    intro: "Pulsa el botón para acceder a tus pedidos Fanovera. Sin contraseñas.",
    cta: "Ver mis pedidos →",
    fallback: "O copia este enlace en tu navegador:",
    expiry: "Este enlace caduca en 15 minutos por seguridad.",
    ignore: "¿No lo has solicitado? Ignora este correo — nadie puede acceder a tu cuenta sin pulsar el enlace.",
  },
  pt: {
    subject: "O seu link de acesso à Fanovera",
    title: "Aqui está o seu link de acesso",
    intro: "Toque no botão abaixo para aceder aos seus pedidos Fanovera. Sem senhas.",
    cta: "Ver os meus pedidos →",
    fallback: "Ou copie este link para o seu navegador:",
    expiry: "Este link expira em 15 minutos por motivos de segurança.",
    ignore: "Não solicitou? Basta ignorar este e-mail — ninguém pode aceder sem clicar no link.",
  },
  de: {
    subject: "Dein Fanovera-Anmeldelink",
    title: "Hier ist dein Anmeldelink",
    intro: "Klicke auf den Button, um auf deine Fanovera-Bestellungen zuzugreifen. Ohne Passwort.",
    cta: "Zu meinen Bestellungen →",
    fallback: "Oder kopiere diesen Link in deinen Browser:",
    expiry: "Aus Sicherheitsgründen läuft dieser Link in 15 Minuten ab.",
    ignore: "Nicht angefordert? Ignoriere diese E-Mail einfach — niemand kann ohne Klick auf den Link zugreifen.",
  },
  it: {
    subject: "Il tuo link di accesso Fanovera",
    title: "Ecco il tuo link di accesso",
    intro: "Tocca il pulsante per accedere ai tuoi ordini Fanovera. Niente password.",
    cta: "Vai ai miei ordini →",
    fallback: "Oppure copia questo link nel browser:",
    expiry: "Questo link scade tra 15 minuti per motivi di sicurezza.",
    ignore: "Non l'hai richiesto? Ignora questa email — nessuno può accedere senza cliccare sul link.",
  },
  tr: {
    subject: "Fanovera oturum açma bağlantınız",
    title: "İşte oturum açma bağlantınız",
    intro: "Fanovera siparişlerinize erişmek için aşağıdaki düğmeye dokunun. Şifre yok.",
    cta: "Siparişlerime git →",
    fallback: "Veya bu bağlantıyı tarayıcınıza kopyalayın:",
    expiry: "Bu bağlantı güvenlik nedeniyle 15 dakika içinde sona erer.",
    ignore: "Bunu sen istemediysen bu e-postayı yok say — bağlantıya tıklanmadan kimse erişemez.",
  },
};

// ── Dispute alert (admin) ──

export interface DisputeAlertParams {
  to: string;
  event: "created" | "updated" | "closed" | "funds_withdrawn" | "funds_reinstated";
  severity: "critical" | "warning" | "info";
  disputeId: string;
  reason: string;
  status: string;
  amountFormatted: string;
  paymentIntentId: string;
  orderId: number | null;
  evidenceDueBy: string | null;
}

const DISPUTE_EVENT_TITLES: Record<DisputeAlertParams["event"], string> = {
  created: "🚨 Dispute opened",
  updated: "ℹ️ Dispute updated",
  closed: "✅ Dispute closed",
  funds_withdrawn: "💸 Funds withdrawn (chargeback)",
  funds_reinstated: "💰 Funds reinstated (dispute won)",
};

const SEVERITY_BG: Record<DisputeAlertParams["severity"], string> = {
  critical: "#fef2f2",
  warning: "#fffbeb",
  info: "#f0fdf4",
};

const SEVERITY_BORDER: Record<DisputeAlertParams["severity"], string> = {
  critical: "#dc2626",
  warning: "#f59e0b",
  info: "#16a34a",
};

/** Internal admin alert when a Stripe dispute event lands on the webhook. */
export async function sendDisputeAlertEmail(
  p: DisputeAlertParams,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "Resend not configured" };

  try {
    const title = DISPUTE_EVENT_TITLES[p.event];
    const dashUrl = `https://dashboard.stripe.com/disputes/${p.disputeId}`;
    const subject = `[Stripe] ${title} · ${p.amountFormatted} · ${p.disputeId}`;
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f8f6f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f6f1;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <tr><td style="background:${SEVERITY_BG[p.severity]};border:2px solid ${SEVERITY_BORDER[p.severity]};border-radius:14px;padding:28px 24px;">
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:800;color:#111827;letter-spacing:-0.01em;">${escapeHtml(title)}</h1>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;color:#374151;">
            <tr><td style="padding:6px 0;color:#6b7280;width:140px;">Dispute ID</td><td style="padding:6px 0;font-family:monospace;">${escapeHtml(p.disputeId)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Status</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(p.status)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Reason</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(p.reason)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Amount</td><td style="padding:6px 0;font-weight:700;">${escapeHtml(p.amountFormatted)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Payment Intent</td><td style="padding:6px 0;font-family:monospace;font-size:12px;">${escapeHtml(p.paymentIntentId)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Internal Order</td><td style="padding:6px 0;">${p.orderId ? `#${p.orderId}` : "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Evidence due</td><td style="padding:6px 0;font-weight:${p.evidenceDueBy ? "700" : "400"};color:${p.evidenceDueBy ? "#dc2626" : "#6b7280"};">${p.evidenceDueBy ? escapeHtml(p.evidenceDueBy) : "—"}</td></tr>
          </table>
          <p style="margin:24px 0 0;text-align:center;">
            <a href="${dashUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;">Open in Stripe →</a>
          </p>
        </td></tr>
        <tr><td style="padding:18px 8px 0;font-size:11px;color:#9ca3af;text-align:center;">
          Automated alert from Fanovera Stripe webhook · ${new Date().toISOString()}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const text = `${title}

Dispute: ${p.disputeId}
Status: ${p.status}
Reason: ${p.reason}
Amount: ${p.amountFormatted}
Payment Intent: ${p.paymentIntentId}
Internal Order: ${p.orderId ? `#${p.orderId}` : "—"}
Evidence due: ${p.evidenceDueBy || "—"}

Open in Stripe: ${dashUrl}
`;

    const result = await resend.emails.send({
      from: RESEND_FROM,
      to: p.to,
      subject,
      html,
      text,
    });
    if (result.error) {
      console.error("[email] dispute Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id };
  } catch (err) {
    console.error("[email] sendDisputeAlertEmail error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export interface MagicLinkParams {
  to: string;
  link: string;
  locale?: string;
}

/**
 * Send a magic-link sign-in email. Fails silently (returns ok:false) — never
 * throws, since email is best-effort and the caller should always answer 200
 * to avoid leaking whether an email is registered.
 */
export async function sendMagicLinkEmail(
  params: MagicLinkParams,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "Resend not configured" };

  try {
    const locale = normalizeEmailLocale(params.locale);
    const copy = MAGIC_LINK_COPY[locale];
    const link = params.link;
    const html = `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8" /><title>${copy.subject}</title></head>
<body style="margin:0;padding:0;background:#f8f6f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f6f1;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <tr><td align="center" style="padding-bottom:24px;">
          <a href="${APP_URL}" style="text-decoration:none;display:inline-block;">
            <img src="${APP_URL}/fanovera-logo.png" alt="Fanovera" width="140" height="auto" style="display:block;height:auto;max-height:42px;border:0;outline:none;" />
          </a>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:18px;border:1px solid #e5e7eb;padding:36px 32px;">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.02em;text-align:center;">${copy.title}</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.55;text-align:center;">${escapeHtml(copy.intro)}</p>
          <p style="margin:0 0 24px;text-align:center;">
            <a href="${link}" style="display:inline-block;background:#5260e6;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;">${copy.cta}</a>
          </p>
          <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-align:center;">${escapeHtml(copy.fallback)}</p>
          <p style="margin:0 0 24px;font-size:11px;color:#6b7280;text-align:center;word-break:break-all;"><a href="${link}" style="color:#5260e6;">${link}</a></p>
          <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-align:center;">${escapeHtml(copy.expiry)}</p>
        </td></tr>
        <tr><td style="padding:18px 8px 0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.5;">
          ${escapeHtml(copy.ignore)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const text = `${copy.title}

${copy.intro}

${link}

${copy.expiry}

${copy.ignore}

—
Fanovera · ${APP_URL}`;

    const result = await resend.emails.send({
      from: RESEND_FROM,
      to: params.to,
      subject: copy.subject,
      html,
      text,
    });

    if (result.error) {
      console.error("[email] Magic-link Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id };
  } catch (err) {
    console.error("[email] sendMagicLinkEmail error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
