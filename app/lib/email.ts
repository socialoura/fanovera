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
  /**
   * Optional cross-sell block injected into the email. When `suggestion` is
   * present, the email shows a specific complementary product (e.g. "100
   * Instagram likes for €1.60") with the discount applied; otherwise it
   * falls back to a generic promo-code panel.
   */
  crossSell?: {
    discountPct: number;
    code: string;
    suggestion?: {
      /** Platform whose page the CTA links to (e.g. "instagram"). */
      platform: string;
      /** Full service key, e.g. "ig_likes" (used in the URL hint param). */
      serviceKey: string;
      /** Kind of the suggested product, used to pick the localized label. */
      serviceKind: string;
      /** Pack size, e.g. 100. */
      qty: number;
      /** Base price in cents, BEFORE the discount. */
      basePriceCents: number;
      /** Currency for the price display (defaults to the order's currency). */
      currency?: string;
    };
  };
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

const CROSSSELL_COPY: Record<EmailLocale, { tag: string; title: (pct: number) => string; sub: string; cta: string; codeLabel: string; suggestionTag: string; suggestionCta: string; wasLabel: string }> = {
  fr: { tag: "Pour ta prochaine commande", title: (p) => `-${p}% offert`,           sub: "On a gardé le meilleur pour la suite. Code valable 30 jours sur n'importe quel pack.", cta: "Commander avec -X%",     codeLabel: "Ton code",     suggestionTag: "Suggéré pour toi",   suggestionCta: "Ajouter à -X%",  wasLabel: "au lieu de" },
  en: { tag: "For your next order",         title: (p) => `${p}% off, on us`,        sub: "We saved the best for last. Valid 30 days on any pack.",                              cta: "Order with -X%",          codeLabel: "Your code",    suggestionTag: "Suggested for you",  suggestionCta: "Add at -X%",    wasLabel: "instead of" },
  es: { tag: "Para tu próximo pedido",      title: (p) => `-${p}% de regalo`,        sub: "Guardamos lo mejor. Válido 30 días en cualquier pack.",                              cta: "Pedir con -X%",           codeLabel: "Tu código",    suggestionTag: "Sugerido para ti",   suggestionCta: "Añadir con -X%", wasLabel: "en lugar de" },
  pt: { tag: "Para o próximo pedido",       title: (p) => `-${p}% de oferta`,        sub: "Guardamos o melhor. Válido 30 dias em qualquer pack.",                                cta: "Pedir com -X%",           codeLabel: "Seu código",   suggestionTag: "Sugerido para você", suggestionCta: "Adicionar -X%",  wasLabel: "em vez de" },
  de: { tag: "Für deine nächste Bestellung", title: (p) => `-${p}% geschenkt`,        sub: "Wir haben uns das Beste aufgespart. 30 Tage gültig auf jedes Paket.",                cta: "Mit -X% bestellen",       codeLabel: "Dein Code",    suggestionTag: "Für dich vorgeschlagen", suggestionCta: "Mit -X% holen", wasLabel: "statt" },
  it: { tag: "Per il prossimo ordine",      title: (p) => `-${p}% in regalo`,        sub: "Abbiamo conservato il meglio. Valido 30 giorni su qualsiasi pacchetto.",             cta: "Ordina con -X%",          codeLabel: "Il tuo codice", suggestionTag: "Suggerito per te",   suggestionCta: "Aggiungi a -X%", wasLabel: "invece di" },
  tr: { tag: "Sonraki siparişin için",      title: (p) => `-${p}% hediye`,           sub: "En iyisini sona sakladık. Herhangi bir pakette 30 gün geçerli.",                     cta: "-X% ile sipariş ver",     codeLabel: "Kodun",        suggestionTag: "Sana özel öneri",    suggestionCta: "-X% ile ekle",   wasLabel: "yerine" },
};

function renderCrossSellBlock(p: OrderConfirmationParams, locale: EmailLocale): string {
  if (!p.crossSell || p.crossSell.discountPct <= 0 || !p.crossSell.code) return "";
  const c = CROSSSELL_COPY[locale];
  const pct = p.crossSell.discountPct;
  const code = p.crossSell.code;
  const ctaUrl = buildPlatformUrl(p.platform, locale, code);

  // ── Variant A: specific product suggestion ──
  // Renders a 2-zone card with the bought-X → suggested-Y narrative and a
  // crossed-out base price next to the discounted one.
  const sug = p.crossSell.suggestion;
  if (sug) {
    const sugCurrency = sug.currency || p.currency || "eur";
    const discountedCents = Math.round(sug.basePriceCents * (1 - pct / 100));
    const priceNow = fmtPrice(discountedCents, sugCurrency, locale);
    const priceWas = fmtPrice(sug.basePriceCents, sugCurrency, locale);
    const platformLabel = PLATFORM_LABEL[sug.platform] || sug.platform;
    const sugServiceLabel = localizedServiceLabel(sug.serviceKey, locale);
    const productLabel = `${fmtQty(sug.qty)} ${sugServiceLabel} ${platformLabel}`;
    const sugUrl = `${buildPlatformUrl(sug.platform, locale, code)}&suggested=${encodeURIComponent(sug.serviceKey)}`;
    const sugCta = c.suggestionCta.replace("-X%", `-${pct}%`);

    return `
          <!-- Spacer -->
          <tr><td style="height:16px;line-height:16px;font-size:0;">&nbsp;</td></tr>

          <!-- Cross-sell with concrete product suggestion -->
          <tr>
            <td style="background:#5260e6;background:linear-gradient(135deg,#5260e6 0%,#7c3aed 100%);border-radius:18px;padding:28px 28px;color:#ffffff;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:6px;text-align:center;">
                ${escapeHtml(c.suggestionTag)}
              </div>
              <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;text-align:center;margin-bottom:18px;line-height:1.25;">
                ${escapeHtml(productLabel)}
              </div>
              <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:18px 20px;text-align:center;">
                <div style="display:inline-block;text-align:left;">
                  <div style="font-size:13px;color:rgba(255,255,255,0.7);text-decoration:line-through;margin-bottom:2px;">${escapeHtml(c.wasLabel)} ${escapeHtml(priceWas)}</div>
                  <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;line-height:1;">${escapeHtml(priceNow)}</div>
                </div>
                <div style="margin-top:6px;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.04em;">${escapeHtml(c.codeLabel)} <span style="font-family:monospace;font-weight:700;color:#ffffff;letter-spacing:0.1em;">${escapeHtml(code)}</span></div>
              </div>
              <div style="text-align:center;margin-top:18px;">
                <a href="${sugUrl}" style="display:inline-block;background:#ffffff;color:#5260e6;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;">${escapeHtml(sugCta)} →</a>
              </div>
            </td>
          </tr>`;
  }

  // ── Variant B: generic discount block (fallback) ──
  const cta = c.cta.replace("-X%", `-${pct}%`);
  return `
          <!-- Spacer -->
          <tr><td style="height:16px;line-height:16px;font-size:0;">&nbsp;</td></tr>

          <!-- Cross-sell generic -->
          <tr>
            <td style="background:#5260e6;background:linear-gradient(135deg,#5260e6 0%,#7c3aed 100%);border-radius:18px;padding:32px 28px;text-align:center;color:#ffffff;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:8px;">
                ${escapeHtml(c.tag)}
              </div>
              <div style="font-size:30px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;margin-bottom:8px;">
                ${escapeHtml(c.title(pct))}
              </div>
              <p style="margin:0 0 18px;font-size:14px;color:rgba(255,255,255,0.85);line-height:1.55;">
                ${escapeHtml(c.sub)}
              </p>
              <div style="background:rgba(255,255,255,0.12);border:1px dashed rgba(255,255,255,0.4);border-radius:10px;padding:14px 16px;margin:0 auto 18px;display:inline-block;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:4px;">${escapeHtml(c.codeLabel)}</div>
                <div style="font-family:monospace;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:0.1em;">${escapeHtml(code)}</div>
              </div>
              <div>
                <a href="${ctaUrl}" style="display:inline-block;background:#ffffff;color:#5260e6;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;">${escapeHtml(cta)} →</a>
              </div>
            </td>
          </tr>`;
}

function renderOrderConfirmationHtml(p: OrderConfirmationParams): string {
  const locale = normalizeEmailLocale(p.locale);
  const copy = EMAIL_COPY[locale];
  const platformLabel = PLATFORM_LABEL[p.platform] || p.platform;
  const trackingUrl = buildTrackingUrl(p.orderId, p.locale);
  const currency = p.currency || "eur";
  const crossSellHtml = renderCrossSellBlock(p, locale);

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
${crossSellHtml}
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

// ── Missing-info email (admin-initiated, cart-aware) ──

export type OrderAskKind = "profile" | "post" | "live" | "private";

export interface OrderMissingInfoParams {
  to: string;
  orderId: number;
  platform: string;
  /** What the customer entered for the profile (may be wrong / private / empty). */
  username: string;
  /** Drives the email copy: profile / post URL / live stream. */
  askKind: OrderAskKind;
  locale?: string;
  /** Reply-to address (support inbox). */
  replyTo: string;
  /** Hidden token so customer replies thread back via the IMAP poller. */
  threadToken: string;
}

type AskVariant = {
  hero: string;
  intro: (orderId: number, platformLabel: string, handle: string) => string;
  ask: (platformLabel: string) => string;
  /**
   * Either a fixed list (profile / post / live) or a function of the order's
   * platform — used by the `private` variant to surface the right "make it
   * public" path (Instagram vs TikTok vs X have different settings menus).
   */
  reasons: string[] | ((platform: string) => string[]);
};

/**
 * Per-locale, per-platform "how to switch the account to public" instruction
 * for the `private` variant. Falls back to the Instagram line for any platform
 * not listed (e.g. if the private button is ever enabled for a new network).
 */
const PRIVATE_HOWTO: Record<EmailLocale, Record<string, string>> = {
  fr: {
    instagram: "Sur Instagram : Paramètres → Confidentialité du compte → désactive « Compte privé »",
    tiktok: "Sur TikTok : Profil → Menu → Paramètres et confidentialité → Confidentialité → désactive « Compte privé »",
    twitter: "Sur X : Paramètres → Confidentialité et sécurité → Audience et identification → désactive « Protéger tes posts »",
  },
  en: {
    instagram: "On Instagram: Settings → Account privacy → turn off \"Private account\"",
    tiktok: "On TikTok: Profile → Menu → Settings and privacy → Privacy → turn off \"Private account\"",
    twitter: "On X: Settings → Privacy and safety → Audience and tagging → turn off \"Protect your posts\"",
  },
  es: {
    instagram: "En Instagram: Configuración → Privacidad de la cuenta → desactiva \"Cuenta privada\"",
    tiktok: "En TikTok: Perfil → Menú → Configuración y privacidad → Privacidad → desactiva \"Cuenta privada\"",
    twitter: "En X: Configuración → Privacidad y seguridad → Audiencia y etiquetado → desactiva \"Proteger tus posts\"",
  },
  pt: {
    instagram: "No Instagram: Definições → Privacidade da conta → desativar \"Conta privada\"",
    tiktok: "No TikTok: Perfil → Menu → Definições e privacidade → Privacidade → desativar \"Conta privada\"",
    twitter: "No X: Definições → Privacidade e segurança → Público e etiquetagem → desativar \"Proteger as tuas publicações\"",
  },
  de: {
    instagram: "Auf Instagram: Einstellungen → Konto-Privatsphäre → \"Privates Konto\" deaktivieren",
    tiktok: "Auf TikTok: Profil → Menü → Einstellungen und Datenschutz → Datenschutz → \"Privates Konto\" deaktivieren",
    twitter: "Auf X: Einstellungen → Datenschutz und Sicherheit → Zielgruppe und Markierungen → \"Beiträge schützen\" deaktivieren",
  },
  it: {
    instagram: "Su Instagram: Impostazioni → Privacy dell'account → disattiva \"Account privato\"",
    tiktok: "Su TikTok: Profilo → Menu → Impostazioni e privacy → Privacy → disattiva \"Account privato\"",
    twitter: "Su X: Impostazioni → Privacy e sicurezza → Pubblico e tag → disattiva \"Proteggi i tuoi post\"",
  },
  tr: {
    instagram: "Instagram'da: Ayarlar → Hesap gizliliği → \"Gizli hesap\" seçeneğini kapat",
    tiktok: "TikTok'ta: Profil → Menü → Ayarlar ve gizlilik → Gizlilik → \"Gizli hesap\" seçeneğini kapat",
    twitter: "X'te: Ayarlar → Gizlilik ve güvenlik → Hedef kitle ve etiketleme → \"Gönderilerini koru\" seçeneğini kapat",
  },
};

function privateHowto(locale: EmailLocale, platform: string): string {
  const byPlatform = PRIVATE_HOWTO[locale] || PRIVATE_HOWTO.en;
  return byPlatform[platform] || byPlatform.instagram;
}

type MissingInfoCopy = {
  subject: (orderId: number) => string;
  signoff: string;
  reasonsLabel: string;
  cta: string;
  variants: Record<OrderAskKind, AskVariant>;
};

const MISSING_INFO_COPY: Record<EmailLocale, MissingInfoCopy> = {
  fr: {
    subject: (id) => `Action requise pour ta commande #${id} — Fanovera`,
    signoff: "L'équipe Fanovera",
    reasonsLabel: "Raisons possibles",
    cta: "Réponds simplement à cet email avec les bonnes infos.",
    variants: {
      profile: {
        hero: "On n'arrive pas à trouver ton profil",
        intro: (id, p, h) => `On a essayé de livrer ta commande <strong>#${id}</strong>, mais on n'arrive pas à trouver le profil ${p} <strong>${h}</strong>.`,
        ask: (p) => `Peux-tu nous renvoyer ton nom d'utilisateur ${p} exact en répondant à cet email ?`,
        reasons: [
          "Le profil est en privé — passe-le en public le temps de la livraison",
          "Le nom d'utilisateur a changé ou contient une faute de frappe",
          "Le compte a été désactivé ou supprimé",
        ],
      },
      post: {
        hero: "On n'arrive pas à trouver ta publication",
        intro: (id, p, _h) => `On a essayé de livrer ta commande <strong>#${id}</strong>, mais on n'arrive pas à accéder à la publication ${p} sur laquelle on doit délivrer.`,
        ask: (p) => `Peux-tu nous renvoyer le lien exact de la publication ${p} à booster, en répondant à cet email ?`,
        reasons: [
          "La publication a été supprimée ou archivée",
          "Le compte est en privé — passe-le en public le temps de la livraison",
          "Le lien envoyé est incomplet ou pointe vers une autre publication",
        ],
      },
      live: {
        hero: "On n'arrive pas à trouver ton live",
        intro: (id, p, _h) => `On a essayé de lancer les viewers pour ta commande <strong>#${id}</strong>, mais on ne trouve pas ton live ${p}.`,
        ask: (p) => `Peux-tu nous renvoyer l'URL de ta chaîne ${p} et l'heure exacte (avec le fuseau) à laquelle ton live démarre, en répondant à cet email ?`,
        reasons: [
          "Le live n'a pas encore démarré ou est terminé",
          "L'URL de la chaîne envoyée est incorrecte",
          "Le stream n'est pas public",
        ],
      },
      private: {
        hero: "Ton compte est en privé",
        intro: (id, p, h) => `On a essayé de livrer ta commande <strong>#${id}</strong>, mais ton compte ${p} <strong>${h}</strong> est en privé — on ne peut pas envoyer les abonnés / likes / vues tant qu'il est verrouillé.`,
        ask: (p) => `Peux-tu passer ton compte ${p} en public le temps de la livraison, puis répondre à cet email pour confirmer ? Une fois la commande terminée, tu peux le remettre en privé.`,
        reasons: (platform) => [
          privateHowto("fr", platform),
          "Vérifie aussi qu'aucune restriction de pays / âge n'est active",
        ],
      },
    },
  },
  en: {
    subject: (id) => `Action needed for your order #${id} — Fanovera`,
    signoff: "The Fanovera team",
    reasonsLabel: "Possible reasons",
    cta: "Just reply to this email with the correct info.",
    variants: {
      profile: {
        hero: "We can't find your profile",
        intro: (id, p, h) => `We tried to deliver your order <strong>#${id}</strong>, but we can't find the ${p} profile <strong>${h}</strong>.`,
        ask: (p) => `Could you reply to this email with your exact ${p} username?`,
        reasons: [
          "Your profile is set to private — switch it to public until delivery is complete",
          "The username has changed or contains a typo",
          "The account has been deactivated or deleted",
        ],
      },
      post: {
        hero: "We can't find your post",
        intro: (id, p, _h) => `We tried to deliver your order <strong>#${id}</strong>, but we can't reach the ${p} post we're supposed to boost.`,
        ask: (p) => `Could you reply to this email with the exact URL of the ${p} post you want to boost?`,
        reasons: [
          "The post has been deleted or archived",
          "Your account is private — switch it to public until delivery is complete",
          "The link you sent is incomplete or points to a different post",
        ],
      },
      live: {
        hero: "We can't find your live stream",
        intro: (id, p, _h) => `We tried to push viewers to your order <strong>#${id}</strong>, but we can't find your ${p} live stream.`,
        ask: (p) => `Could you reply to this email with your ${p} channel URL and the exact time (with timezone) your live starts?`,
        reasons: [
          "The stream hasn't started yet or has already ended",
          "The channel URL you sent is incorrect",
          "The stream isn't public",
        ],
      },
      private: {
        hero: "Your account is set to private",
        intro: (id, p, h) => `We tried to deliver your order <strong>#${id}</strong>, but your ${p} account <strong>${h}</strong> is private — we can't push followers / likes / views while it's locked.`,
        ask: (p) => `Could you switch your ${p} account to public until delivery is complete, then reply to this email to confirm? Once the order is delivered you can switch it back.`,
        reasons: (platform) => [
          privateHowto("en", platform),
          "Also check that no country / age restriction is active on the account",
        ],
      },
    },
  },
  es: {
    subject: (id) => `Acción necesaria para tu pedido #${id} — Fanovera`,
    signoff: "El equipo Fanovera",
    reasonsLabel: "Razones posibles",
    cta: "Solo responde a este correo con la información correcta.",
    variants: {
      profile: {
        hero: "No encontramos tu perfil",
        intro: (id, p, h) => `Intentamos entregar tu pedido <strong>#${id}</strong>, pero no encontramos el perfil de ${p} <strong>${h}</strong>.`,
        ask: (p) => `¿Puedes responder a este correo con tu nombre de usuario exacto de ${p}?`,
        reasons: [
          "Tu perfil está en privado — ponlo en público hasta que se complete la entrega",
          "El nombre de usuario ha cambiado o contiene un error",
          "La cuenta ha sido desactivada o eliminada",
        ],
      },
      post: {
        hero: "No encontramos tu publicación",
        intro: (id, p, _h) => `Intentamos entregar tu pedido <strong>#${id}</strong>, pero no podemos acceder a la publicación de ${p} que debemos impulsar.`,
        ask: (p) => `¿Puedes responder a este correo con la URL exacta de la publicación de ${p} que quieres impulsar?`,
        reasons: [
          "La publicación ha sido eliminada o archivada",
          "Tu cuenta está en privado — ponla en público hasta que se complete la entrega",
          "El enlace enviado está incompleto o apunta a otra publicación",
        ],
      },
      live: {
        hero: "No encontramos tu directo",
        intro: (id, p, _h) => `Intentamos enviar viewers a tu pedido <strong>#${id}</strong>, pero no encontramos tu directo en ${p}.`,
        ask: (p) => `¿Puedes responder a este correo con la URL de tu canal de ${p} y la hora exacta (con zona horaria) a la que empieza tu directo?`,
        reasons: [
          "El directo aún no ha empezado o ya ha terminado",
          "La URL del canal enviada es incorrecta",
          "El stream no es público",
        ],
      },
      private: {
        hero: "Tu cuenta está en privado",
        intro: (id, p, h) => `Intentamos entregar tu pedido <strong>#${id}</strong>, pero tu cuenta de ${p} <strong>${h}</strong> es privada — no podemos enviar seguidores / likes / vistas mientras esté bloqueada.`,
        ask: (p) => `¿Puedes poner tu cuenta de ${p} en público hasta que se complete la entrega y luego responder a este correo para confirmar? Cuando termine el pedido puedes volver a ponerla en privado.`,
        reasons: (platform) => [
          privateHowto("es", platform),
          "Verifica también que no haya restricciones de país / edad activas",
        ],
      },
    },
  },
  pt: {
    subject: (id) => `Ação necessária para o seu pedido #${id} — Fanovera`,
    signoff: "A equipa Fanovera",
    reasonsLabel: "Razões possíveis",
    cta: "Basta responder a este e-mail com a informação correta.",
    variants: {
      profile: {
        hero: "Não conseguimos encontrar o seu perfil",
        intro: (id, p, h) => `Tentámos entregar o seu pedido <strong>#${id}</strong>, mas não conseguimos encontrar o perfil de ${p} <strong>${h}</strong>.`,
        ask: (p) => `Pode responder a este e-mail com o seu nome de utilizador exato de ${p}?`,
        reasons: [
          "O seu perfil está privado — torne-o público até a entrega ser concluída",
          "O nome de utilizador mudou ou contém um erro",
          "A conta foi desativada ou eliminada",
        ],
      },
      post: {
        hero: "Não conseguimos encontrar a sua publicação",
        intro: (id, p, _h) => `Tentámos entregar o seu pedido <strong>#${id}</strong>, mas não conseguimos aceder à publicação de ${p} que devemos impulsionar.`,
        ask: (p) => `Pode responder a este e-mail com o URL exato da publicação de ${p} que quer impulsionar?`,
        reasons: [
          "A publicação foi eliminada ou arquivada",
          "A sua conta está privada — torne-a pública até a entrega ser concluída",
          "O link enviado está incompleto ou aponta para outra publicação",
        ],
      },
      live: {
        hero: "Não conseguimos encontrar o seu live",
        intro: (id, p, _h) => `Tentámos enviar viewers para o seu pedido <strong>#${id}</strong>, mas não encontramos o seu live em ${p}.`,
        ask: (p) => `Pode responder a este e-mail com o URL do seu canal de ${p} e a hora exata (com fuso horário) a que o seu live começa?`,
        reasons: [
          "O live ainda não começou ou já terminou",
          "O URL do canal enviado está incorreto",
          "A transmissão não é pública",
        ],
      },
      private: {
        hero: "A sua conta está privada",
        intro: (id, p, h) => `Tentámos entregar o seu pedido <strong>#${id}</strong>, mas a sua conta de ${p} <strong>${h}</strong> está privada — não conseguimos enviar seguidores / gostos / visualizações enquanto estiver bloqueada.`,
        ask: (p) => `Pode tornar a sua conta de ${p} pública até a entrega ser concluída e depois responder a este e-mail para confirmar? Quando o pedido terminar, pode voltar a torná-la privada.`,
        reasons: (platform) => [
          privateHowto("pt", platform),
          "Verifique também que não existem restrições de país / idade ativas",
        ],
      },
    },
  },
  de: {
    subject: (id) => `Aktion erforderlich für deine Bestellung #${id} — Fanovera`,
    signoff: "Das Fanovera-Team",
    reasonsLabel: "Mögliche Gründe",
    cta: "Antworte einfach auf diese E-Mail mit den richtigen Infos.",
    variants: {
      profile: {
        hero: "Wir können dein Profil nicht finden",
        intro: (id, p, h) => `Wir haben versucht, deine Bestellung <strong>#${id}</strong> auszuliefern, aber wir können das ${p}-Profil <strong>${h}</strong> nicht finden.`,
        ask: (p) => `Kannst du auf diese E-Mail mit deinem genauen ${p}-Benutzernamen antworten?`,
        reasons: [
          "Dein Profil ist auf privat gestellt — schalte es bis zum Abschluss der Lieferung auf öffentlich",
          "Der Benutzername wurde geändert oder enthält einen Tippfehler",
          "Das Konto wurde deaktiviert oder gelöscht",
        ],
      },
      post: {
        hero: "Wir können deinen Beitrag nicht finden",
        intro: (id, p, _h) => `Wir haben versucht, deine Bestellung <strong>#${id}</strong> auszuliefern, aber wir können den ${p}-Beitrag, den wir pushen sollen, nicht erreichen.`,
        ask: (p) => `Kannst du auf diese E-Mail mit der genauen URL des ${p}-Beitrags antworten, den du pushen möchtest?`,
        reasons: [
          "Der Beitrag wurde gelöscht oder archiviert",
          "Dein Konto ist privat — schalte es bis zum Abschluss der Lieferung auf öffentlich",
          "Der gesendete Link ist unvollständig oder zeigt auf einen anderen Beitrag",
        ],
      },
      live: {
        hero: "Wir können deinen Livestream nicht finden",
        intro: (id, p, _h) => `Wir haben versucht, Viewer auf deine Bestellung <strong>#${id}</strong> zu pushen, aber wir finden deinen ${p}-Livestream nicht.`,
        ask: (p) => `Kannst du auf diese E-Mail mit der URL deines ${p}-Kanals und der genauen Uhrzeit (inkl. Zeitzone) antworten, wann dein Stream startet?`,
        reasons: [
          "Der Stream hat noch nicht begonnen oder ist bereits beendet",
          "Die gesendete Kanal-URL ist falsch",
          "Der Stream ist nicht öffentlich",
        ],
      },
      private: {
        hero: "Dein Konto ist auf privat gestellt",
        intro: (id, p, h) => `Wir haben versucht, deine Bestellung <strong>#${id}</strong> auszuliefern, aber dein ${p}-Konto <strong>${h}</strong> ist privat — wir können Follower / Likes / Views nicht pushen, solange es gesperrt ist.`,
        ask: (p) => `Kannst du dein ${p}-Konto bis zum Abschluss der Lieferung auf öffentlich umstellen und dann auf diese E-Mail antworten, um zu bestätigen? Sobald die Bestellung abgeschlossen ist, kannst du es wieder auf privat stellen.`,
        reasons: (platform) => [
          privateHowto("de", platform),
          "Prüfe auch, dass keine Länder- oder Altersbeschränkung aktiv ist",
        ],
      },
    },
  },
  it: {
    subject: (id) => `Azione richiesta per il tuo ordine #${id} — Fanovera`,
    signoff: "Il team Fanovera",
    reasonsLabel: "Motivi possibili",
    cta: "Basta rispondere a questa email con le informazioni corrette.",
    variants: {
      profile: {
        hero: "Non riusciamo a trovare il tuo profilo",
        intro: (id, p, h) => `Abbiamo provato a consegnare il tuo ordine <strong>#${id}</strong>, ma non riusciamo a trovare il profilo ${p} <strong>${h}</strong>.`,
        ask: (p) => `Puoi rispondere a questa email con il tuo nome utente esatto di ${p}?`,
        reasons: [
          "Il tuo profilo è impostato su privato — rendilo pubblico fino al completamento della consegna",
          "Il nome utente è cambiato o contiene un errore di battitura",
          "L'account è stato disattivato o eliminato",
        ],
      },
      post: {
        hero: "Non riusciamo a trovare il tuo post",
        intro: (id, p, _h) => `Abbiamo provato a consegnare il tuo ordine <strong>#${id}</strong>, ma non riusciamo a raggiungere il post ${p} che dobbiamo boostare.`,
        ask: (p) => `Puoi rispondere a questa email con l'URL esatto del post ${p} che vuoi boostare?`,
        reasons: [
          "Il post è stato eliminato o archiviato",
          "Il tuo account è privato — rendilo pubblico fino al completamento della consegna",
          "Il link inviato è incompleto o rimanda a un altro post",
        ],
      },
      live: {
        hero: "Non riusciamo a trovare la tua diretta",
        intro: (id, p, _h) => `Abbiamo provato a mandare viewer al tuo ordine <strong>#${id}</strong>, ma non troviamo la tua diretta su ${p}.`,
        ask: (p) => `Puoi rispondere a questa email con l'URL del tuo canale ${p} e l'orario esatto (con fuso) di inizio della diretta?`,
        reasons: [
          "La diretta non è ancora iniziata o è già finita",
          "L'URL del canale inviato non è corretto",
          "Lo stream non è pubblico",
        ],
      },
      private: {
        hero: "Il tuo account è privato",
        intro: (id, p, h) => `Abbiamo provato a consegnare il tuo ordine <strong>#${id}</strong>, ma il tuo account ${p} <strong>${h}</strong> è privato — non possiamo inviare follower / like / visualizzazioni mentre è bloccato.`,
        ask: (p) => `Puoi rendere pubblico il tuo account ${p} fino al completamento della consegna e poi rispondere a questa email per confermare? A consegna avvenuta puoi rimetterlo in privato.`,
        reasons: (platform) => [
          privateHowto("it", platform),
          "Verifica anche che non siano attive restrizioni per paese / età",
        ],
      },
    },
  },
  tr: {
    subject: (id) => `#${id} numaralı siparişin için işlem gerekli — Fanovera`,
    signoff: "Fanovera ekibi",
    reasonsLabel: "Olası nedenler",
    cta: "Doğru bilgilerle bu e-postayı yanıtlaman yeterli.",
    variants: {
      profile: {
        hero: "Profilini bulamıyoruz",
        intro: (id, p, h) => `<strong>#${id}</strong> numaralı siparişini teslim etmeye çalıştık, ancak ${p} profilini <strong>${h}</strong> bulamıyoruz.`,
        ask: (p) => `Bu e-postayı yanıtlayarak tam ${p} kullanıcı adını gönderebilir misin?`,
        reasons: [
          "Profilin gizli olarak ayarlanmış — teslimat tamamlanana kadar herkese açık yap",
          "Kullanıcı adı değişmiş veya yazım hatası içeriyor",
          "Hesap devre dışı bırakılmış veya silinmiş",
        ],
      },
      post: {
        hero: "Gönderini bulamıyoruz",
        intro: (id, p, _h) => `<strong>#${id}</strong> numaralı siparişini teslim etmeye çalıştık, ancak boost etmemiz gereken ${p} gönderisine erişemiyoruz.`,
        ask: (p) => `Bu e-postayı yanıtlayarak boost etmek istediğin ${p} gönderisinin tam URL'sini gönderebilir misin?`,
        reasons: [
          "Gönderi silinmiş veya arşivlenmiş",
          "Hesabın gizli — teslimat tamamlanana kadar herkese açık yap",
          "Gönderilen link eksik veya başka bir gönderiye işaret ediyor",
        ],
      },
      live: {
        hero: "Canlı yayınını bulamıyoruz",
        intro: (id, p, _h) => `<strong>#${id}</strong> numaralı siparişine viewer göndermeye çalıştık, ancak ${p} canlı yayınını bulamıyoruz.`,
        ask: (p) => `Bu e-postayı yanıtlayarak ${p} kanal URL'ni ve yayının başlayacağı tam saati (saat dilimiyle) gönderebilir misin?`,
        reasons: [
          "Yayın henüz başlamadı veya zaten sona erdi",
          "Gönderilen kanal URL'si yanlış",
          "Yayın herkese açık değil",
        ],
      },
      private: {
        hero: "Hesabın gizli",
        intro: (id, p, h) => `<strong>#${id}</strong> numaralı siparişini teslim etmeye çalıştık, ancak ${p} hesabın <strong>${h}</strong> gizli — kilitliyken takipçi / beğeni / görüntülenme gönderemeyiz.`,
        ask: (p) => `Teslimat tamamlanana kadar ${p} hesabını herkese açık yapıp ardından onaylamak için bu e-postayı yanıtlayabilir misin? Sipariş tamamlandığında tekrar gizli yapabilirsin.`,
        reasons: (platform) => [
          privateHowto("tr", platform),
          "Ayrıca aktif bir ülke / yaş kısıtlaması olmadığını kontrol et",
        ],
      },
    },
  },
};

/**
 * Admin-triggered email when info is missing for SMM delivery (private/wrong
 * profile, deleted post, missing live URL). The `askKind` switches between
 * three copy variants so the customer is asked for exactly what's missing
 * relative to the cart contents. The hidden `threadToken` lets the IMAP poller
 * route their reply into the support inbox.
 */
export async function sendOrderMissingInfoEmail(
  p: OrderMissingInfoParams,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "Resend not configured" };

  try {
    const locale = normalizeEmailLocale(p.locale);
    const copy = MISSING_INFO_COPY[locale];
    const variant = copy.variants[p.askKind];
    const platformLabel = PLATFORM_LABEL[p.platform] || p.platform;
    const handle = p.username ? `@${p.username.replace(/^@/, "")}` : "—";
    const emoji = p.askKind === "post"
      ? "🔗"
      : p.askKind === "live"
      ? "📡"
      : p.askKind === "private"
      ? "🔒"
      : "🔍";

    const reasons = typeof variant.reasons === "function"
      ? variant.reasons(p.platform)
      : variant.reasons;

    const html = `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8" /><title>${escapeHtml(copy.subject(p.orderId))}</title></head>
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
            <div style="font-size:44px;line-height:1;margin-bottom:12px;">${emoji}</div>
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.02em;">${escapeHtml(variant.hero)}</h1>
          </div>
          <p style="margin:18px 0 16px;font-size:15px;color:#374151;line-height:1.55;">
            ${variant.intro(p.orderId, escapeHtml(platformLabel), escapeHtml(handle))}
          </p>
          <p style="margin:0 0 18px;font-size:15px;color:#111827;line-height:1.55;font-weight:600;">
            ${escapeHtml(variant.ask(platformLabel))}
          </p>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin:0 0 16px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:10px;">
              ${escapeHtml(copy.reasonsLabel)}
            </div>
            <ul style="margin:0;padding-left:18px;font-size:14px;color:#374151;line-height:1.6;">
              ${reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
            </ul>
          </div>
          <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.55;">${escapeHtml(copy.cta)}</p>
          <p style="margin:24px 0 0;font-size:14px;color:#111827;">— ${escapeHtml(copy.signoff)}</p>
          <div style="color:#f9fafb;font-size:10px;line-height:1;margin-top:24px;user-select:none;">
            ${escapeHtml(p.threadToken)}
          </div>
        </td></tr>
        <tr><td style="padding:18px 8px 0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.5;">
          Fanovera · ${APP_URL}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const text = `${variant.hero}

${variant.intro(p.orderId, platformLabel, handle).replace(/<[^>]+>/g, "")}

${variant.ask(platformLabel)}

${copy.reasonsLabel} :
${reasons.map((r) => `  • ${r}`).join("\n")}

${copy.cta}

— ${copy.signoff}

${p.threadToken}`;

    const result = await resend.emails.send({
      from: RESEND_FROM,
      to: p.to,
      replyTo: p.replyTo,
      subject: copy.subject(p.orderId),
      html,
      text,
    });

    if (result.error) {
      console.error("[email] missing-info Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id };
  } catch (err) {
    console.error("[email] sendOrderMissingInfoEmail error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── Refill / loyalty notice (admin-initiated) ──

export interface RefillNoticeParams {
  to: string;
  /**
   * Every distinct platform+service combo the customer has ever bought, so the
   * email reflects their whole history (e.g. "your Instagram followers and your
   * TikTok likes"), not a single order. Built from all their orders by email.
   */
  purchases: Array<{ platform: string; service?: string }>;
  locale?: string;
}

type RefillCopy = {
  subject: string;
  hero: string;
  /** `summary` is the localized list of what they bought (e.g. "abonnés Instagram, likes TikTok"). */
  intro: (summary: string) => string;
  loyalty: string;
  relaunched: string;
  trackingIntro: string;
  trackingButton: string;
  closing: string;
  signoff: string;
  footerLine: string;
  /** Conjunction joining the last two items of the summary list. */
  and: string;
  /** Fallback summary when no purchase history could be resolved. */
  genericStats: string;
};

const REFILL_COPY: Record<EmailLocale, RefillCopy> = {
  fr: {
    subject: "On a rechargé tes comptes 💙 — Fanovera",
    hero: "On veille sur tes comptes",
    intro: (s) => `On a remarqué que certaines de tes stats avaient un peu baissé : ${s}.`,
    loyalty: "Comme tu fais partie de nos meilleurs clients, on ne te laisse pas tomber.",
    relaunched: "On vient de tout relancer gratuitement pour recompléter ce qui manquait.",
    trackingIntro: "Tu peux suivre tes commandes ici :",
    trackingButton: "Voir mes commandes →",
    closing: "Rien à faire de ton côté — on s'occupe de tout.",
    signoff: "L'équipe Fanovera",
    footerLine: "Tu reçois cet email car tu as passé une commande sur Fanovera.",
    and: "et",
    genericStats: "tes abonnés, likes et vues",
  },
  en: {
    subject: "We've topped up your accounts 💙 — Fanovera",
    hero: "We've got your back",
    intro: (s) => `We noticed some of your stats had dropped a little: ${s}.`,
    loyalty: "Because you're one of our best customers, we're not leaving you hanging.",
    relaunched: "We just relaunched everything for free to top back up what was missing.",
    trackingIntro: "You can track your orders here:",
    trackingButton: "View my orders →",
    closing: "Nothing to do on your end — we've handled everything.",
    signoff: "The Fanovera team",
    footerLine: "You're receiving this email because you placed an order on Fanovera.",
    and: "and",
    genericStats: "your followers, likes and views",
  },
  es: {
    subject: "Hemos recargado tus cuentas 💙 — Fanovera",
    hero: "Cuidamos tus cuentas",
    intro: (s) => `Notamos que algunas de tus estadísticas habían bajado un poco: ${s}.`,
    loyalty: "Como eres uno de nuestros mejores clientes, no te dejamos solo.",
    relaunched: "Acabamos de relanzar todo gratis para reponer lo que faltaba.",
    trackingIntro: "Puedes seguir tus pedidos aquí:",
    trackingButton: "Ver mis pedidos →",
    closing: "No tienes que hacer nada — nos encargamos de todo.",
    signoff: "El equipo Fanovera",
    footerLine: "Recibes este correo porque has realizado un pedido en Fanovera.",
    and: "y",
    genericStats: "tus seguidores, me gusta y vistas",
  },
  pt: {
    subject: "Recarregámos as tuas contas 💙 — Fanovera",
    hero: "Cuidamos das tuas contas",
    intro: (s) => `Reparámos que algumas das tuas estatísticas tinham baixado um pouco: ${s}.`,
    loyalty: "Como és um dos nossos melhores clientes, não te deixamos ficar mal.",
    relaunched: "Acabámos de relançar tudo gratuitamente para repor o que faltava.",
    trackingIntro: "Podes acompanhar os teus pedidos aqui:",
    trackingButton: "Ver os meus pedidos →",
    closing: "Não precisas de fazer nada — tratamos de tudo.",
    signoff: "A equipa Fanovera",
    footerLine: "Você está recebendo este e-mail porque fez um pedido na Fanovera.",
    and: "e",
    genericStats: "os teus seguidores, gostos e visualizações",
  },
  de: {
    subject: "Wir haben deine Konten aufgefüllt 💙 — Fanovera",
    hero: "Wir kümmern uns um deine Konten",
    intro: (s) => `Uns ist aufgefallen, dass einige deiner Werte etwas zurückgegangen sind: ${s}.`,
    loyalty: "Da du einer unserer besten Kunden bist, lassen wir dich nicht im Stich.",
    relaunched: "Wir haben alles gerade kostenlos neu gestartet, um das Fehlende wieder aufzufüllen.",
    trackingIntro: "Du kannst deine Bestellungen hier verfolgen:",
    trackingButton: "Meine Bestellungen ansehen →",
    closing: "Du musst nichts tun — wir kümmern uns um alles.",
    signoff: "Das Fanovera-Team",
    footerLine: "Du erhältst diese E-Mail, weil du eine Bestellung bei Fanovera aufgegeben hast.",
    and: "und",
    genericStats: "deine Follower, Likes und Views",
  },
  it: {
    subject: "Abbiamo ricaricato i tuoi account 💙 — Fanovera",
    hero: "Ci prendiamo cura dei tuoi account",
    intro: (s) => `Abbiamo notato che alcune delle tue statistiche erano un po' calate: ${s}.`,
    loyalty: "Dato che sei uno dei nostri migliori clienti, non ti lasciamo a piedi.",
    relaunched: "Abbiamo appena rilanciato tutto gratuitamente per ripristinare ciò che mancava.",
    trackingIntro: "Puoi seguire i tuoi ordini qui:",
    trackingButton: "Vedi i miei ordini →",
    closing: "Non devi fare nulla — pensiamo a tutto noi.",
    signoff: "Il team Fanovera",
    footerLine: "Ricevi questa email perché hai effettuato un ordine su Fanovera.",
    and: "e",
    genericStats: "i tuoi follower, like e visualizzazioni",
  },
  tr: {
    subject: "Hesaplarını tamamladık 💙 — Fanovera",
    hero: "Hesaplarını biz takip ediyoruz",
    intro: (s) => `Bazı istatistiklerinin biraz azaldığını fark ettik: ${s}.`,
    loyalty: "En iyi müşterilerimizden biri olduğun için seni yarı yolda bırakmıyoruz.",
    relaunched: "Eksik kalanı tamamlamak için her şeyi ücretsiz olarak yeniden başlattık.",
    trackingIntro: "Siparişlerini buradan takip edebilirsin:",
    trackingButton: "Siparişlerimi gör →",
    closing: "Senin bir şey yapmana gerek yok — her şeyi biz hallettik.",
    signoff: "Fanovera ekibi",
    footerLine: "Bu e-postayı, Fanovera üzerinde bir sipariş verdiğin için alıyorsun.",
    and: "ve",
    genericStats: "takipçi, beğeni ve görüntülenmelerin",
  },
};

/** Localized service word for mid-sentence use (lowercased, except German
 * where nouns stay capitalized). */
function inlineServiceLabel(service: string | undefined, locale: EmailLocale): string {
  const label = localizedServiceLabel(service, locale);
  if (locale === "de") return label;
  return label.charAt(0).toLowerCase() + label.slice(1);
}

/** Account URL with the right locale prefix (mirrors buildTrackingUrl). */
function buildAccountUrl(locale?: string): string {
  const normalized = (locale || "").toLowerCase().split("-")[0];
  if (normalized && TRACK_URL_LOCALES.has(normalized) && normalized !== "fr") {
    return `${APP_URL}/${normalized}/account`;
  }
  return `${APP_URL}/account`;
}

/**
 * Turn the customer's purchase history into a localized, human list like
 * "abonnés Instagram, likes TikTok et vues YouTube". Dedupes on the rendered
 * phrase (so two services mapping to the same label collapse) and caps at 4
 * entries to keep the sentence readable.
 */
function buildPurchaseSummary(
  purchases: RefillNoticeParams["purchases"],
  locale: EmailLocale,
  andWord: string,
  fallback: string,
): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const it of purchases || []) {
    const platformLabel = PLATFORM_LABEL[it.platform] || it.platform;
    if (!platformLabel) continue;
    const svc = inlineServiceLabel(it.service, locale);
    const phrase = `${svc} ${platformLabel}`.trim();
    const key = phrase.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(phrase);
    if (parts.length >= 4) break;
  }
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} ${andWord} ${parts[parts.length - 1]}`;
}

/**
 * Admin-triggered loyalty / refill notice: tells a top customer we just
 * relaunched their orders for free after a follower/like drop. The copy is
 * built from their whole purchase history (all platforms/services), not a
 * single order. Send-only — the actual BulkFollows relaunch is done separately
 * via the SMM action buttons.
 */
export async function sendRefillNoticeEmail(
  p: RefillNoticeParams,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "Resend not configured" };

  try {
    const locale = normalizeEmailLocale(p.locale);
    const copy = REFILL_COPY[locale];
    const summary = buildPurchaseSummary(p.purchases, locale, copy.and, copy.genericStats);
    const accountUrl = buildAccountUrl(p.locale);

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
            <div style="font-size:44px;line-height:1;margin-bottom:12px;">💙</div>
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.02em;">${escapeHtml(copy.hero)}</h1>
          </div>
          <p style="margin:18px 0 14px;font-size:15px;color:#374151;line-height:1.55;">
            ${escapeHtml(copy.intro(summary))}
          </p>
          <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.55;">
            ${escapeHtml(copy.loyalty)}
          </p>
          <p style="margin:0 0 18px;font-size:15px;color:#111827;line-height:1.55;font-weight:600;">
            ${escapeHtml(copy.relaunched)}
          </p>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:18px 20px;margin:0 0 16px;text-align:center;">
            <div style="font-size:14px;color:#374151;margin-bottom:14px;line-height:1.55;">${escapeHtml(copy.trackingIntro)}</div>
            <a href="${accountUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 26px;border-radius:10px;">${escapeHtml(copy.trackingButton)}</a>
          </div>
          <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.55;">${escapeHtml(copy.closing)}</p>
          <p style="margin:24px 0 0;font-size:14px;color:#111827;">— ${escapeHtml(copy.signoff)}</p>
        </td></tr>
        <tr><td style="padding:18px 8px 0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.5;">
          ${escapeHtml(copy.footerLine)}<br>
          <a href="${APP_URL}" style="color:#6b7280;text-decoration:underline;">fanovera.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const text = `${copy.hero}

${copy.intro(summary)}
${copy.loyalty}
${copy.relaunched}

${copy.trackingIntro}
${accountUrl}

${copy.closing}

— ${copy.signoff}

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
      console.error("[email] refill notice Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id };
  } catch (err) {
    console.error("[email] sendRefillNoticeEmail error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── Lifecycle emails (post-purchase reminders + win-back) ──

export type LifecycleKind = "post_purchase_7d" | "post_purchase_30d" | "win_back_60d" | "win_back_90d";

export interface LifecycleEmailParams {
  to: string;
  kind: LifecycleKind;
  platform: string;
  username: string;
  /**
   * Dominant service from the customer's last cart (e.g. "ig_followers",
   * "sp_streams"). When provided, the copy switches to the localized service
   * label ("followers" → "abonnés", "streams" → "écoutes") instead of the
   * generic default. Falls back to "followers" wording when empty.
   */
  service?: string;
  /** Discount %: 0 = no code, else the FANO{N} code is used. */
  discountPct: number;
  /** Custom subject set in admin (falls back to a default per kind/locale). */
  customSubject?: string;
  locale?: string;
}

type LifecycleCopy = {
  defaultSubject: Record<EmailLocale, string>;
  hero: Record<EmailLocale, string>;
  intro: Record<EmailLocale, (handle: string, platformLabel: string, serviceLabel: string) => string>;
  cta: Record<EmailLocale, string>;
};

const LIFECYCLE_COPY: Record<LifecycleKind, LifecycleCopy> = {
  post_purchase_7d: {
    defaultSubject: {
      fr: "Tes {service} tiennent bien ?",
      en: "Are your {service} still going strong?",
      es: "¿Tus {service} siguen aguantando?",
      pt: "Seus {service} estão segurando bem?",
      de: "Halten deine {service} noch durch?",
      it: "I tuoi {service} stanno reggendo?",
      tr: "{service} hâlâ sağlam mı?",
    },
    hero: {
      fr: "Ça envoie du lourd sur ton compte ?",
      en: "How's the boost going on your account?",
      es: "¿Cómo va el boost en tu cuenta?",
      pt: "Como está o boost na sua conta?",
      de: "Wie läuft der Boost auf deinem Konto?",
      it: "Come va il boost sul tuo account?",
      tr: "Hesabındaki boost nasıl gidiyor?",
    },
    intro: {
      fr: (h, p, s) => `Une semaine déjà depuis tes ${s} sur ${p} pour ${h}. C'est le bon moment pour recharger : l'effet est cumulatif et l'algorithme aime la croissance régulière.`,
      en: (h, p, s) => `Already a week since your ${s} on ${p} for ${h}. Now's a great time to top up — the effect compounds and the algorithm loves steady growth.`,
      es: (h, p, s) => `Ya pasó una semana desde tus ${s} en ${p} para ${h}. Es un buen momento para recargar — el efecto es acumulativo.`,
      pt: (h, p, s) => `Já passou uma semana desde seus ${s} em ${p} para ${h}. É um bom momento para recarregar.`,
      de: (h, p, s) => `Schon eine Woche seit deinen ${s} auf ${p} für ${h}. Perfekter Zeitpunkt zum Aufladen.`,
      it: (h, p, s) => `È già passata una settimana dai tuoi ${s} su ${p} per ${h}. Momento perfetto per ricaricare.`,
      tr: (h, p, s) => `${h} için ${p}'daki ${s} siparişinden bir hafta geçti. Tazelemek için harika bir zaman.`,
    },
    cta: { fr: "Recharger maintenant", en: "Top up now", es: "Recargar ahora", pt: "Recarregar agora", de: "Jetzt aufladen", it: "Ricarica ora", tr: "Şimdi yenile" },
  },
  post_purchase_30d: {
    defaultSubject: {
      fr: "On te recharge tes {service} ?",
      en: "Time to top up your {service}?",
      es: "¿Hora de recargar tus {service}?",
      pt: "Hora de recarregar seus {service}?",
      de: "Zeit, deine {service} aufzuladen?",
      it: "È ora di ricaricare i tuoi {service}?",
      tr: "{service} yenileme zamanı mı?",
    },
    hero: {
      fr: "Un mois plus tard...",
      en: "One month later...",
      es: "Un mes después...",
      pt: "Um mês depois...",
      de: "Einen Monat später...",
      it: "Un mese dopo...",
      tr: "Bir ay sonra...",
    },
    intro: {
      fr: (h, p, s) => `Ça fait un mois depuis ta commande de ${s} sur ${p} pour ${h}. Une recharge maintenant garde la dynamique et évite que l'algorithme te déclasse.`,
      en: (h, p, s) => `It's been a month since your ${s} order on ${p} for ${h}. A refill now keeps the momentum so the algorithm doesn't slow you down.`,
      es: (h, p, s) => `Ha pasado un mes desde tu pedido de ${s} en ${p} para ${h}. Una recarga ahora mantiene el ritmo.`,
      pt: (h, p, s) => `Faz um mês desde seu pedido de ${s} em ${p} para ${h}. Uma recarga agora mantém o ritmo.`,
      de: (h, p, s) => `Ein Monat seit deiner ${s}-Bestellung auf ${p} für ${h}. Ein Refill hält den Schwung.`,
      it: (h, p, s) => `È passato un mese dall'ordine di ${s} su ${p} per ${h}. Una ricarica ora mantiene il ritmo.`,
      tr: (h, p, s) => `${h} için ${p}'daki ${s} siparişinden bir ay geçti. Şimdi tazelemek momentumu korur.`,
    },
    cta: { fr: "Relancer ma croissance", en: "Restart my growth", es: "Reiniciar mi crecimiento", pt: "Reiniciar meu crescimento", de: "Wachstum neu starten", it: "Riavvia la mia crescita", tr: "Büyümeyi yeniden başlat" },
  },
  win_back_60d: {
    defaultSubject: {
      fr: "Ça fait un moment...",
      en: "It's been a while...",
      es: "Ha pasado un tiempo...",
      pt: "Faz um tempo...",
      de: "Ist schon eine Weile her...",
      it: "È passato un po'...",
      tr: "Bir süre oldu...",
    },
    hero: {
      fr: "Tu nous manques",
      en: "We miss you",
      es: "Te echamos de menos",
      pt: "Sentimos sua falta",
      de: "Wir vermissen dich",
      it: "Ci manchi",
      tr: "Seni özledik",
    },
    intro: {
      fr: (h, p, s) => `2 mois sans nouvelle pour ${h} sur ${p} ! On a pensé à toi : voici un code spécial pour relancer tes ${s} là où on les avait laissés.`,
      en: (h, p, s) => `2 months without news for ${h} on ${p}! Here's a special code to pick your ${s} back up where we left them.`,
      es: (h, p, s) => `2 meses sin noticias para ${h} en ${p}. Aquí tienes un código especial para retomar tus ${s}.`,
      pt: (h, p, s) => `2 meses sem notícias para ${h} em ${p}. Aqui está um código especial para retomar seus ${s}.`,
      de: (h, p, s) => `2 Monate ohne Nachricht für ${h} auf ${p}! Hier ein spezieller Code, um deine ${s} wieder anzukurbeln.`,
      it: (h, p, s) => `2 mesi senza notizie per ${h} su ${p}! Ecco un codice speciale per far ripartire i tuoi ${s}.`,
      tr: (h, p, s) => `${h} için ${p}'da 2 ay haber yok! İşte ${s} büyümesini yeniden başlatmak için özel bir kod.`,
    },
    cta: { fr: "Profiter du code", en: "Use my code", es: "Usar mi código", pt: "Usar meu código", de: "Code einlösen", it: "Usa il codice", tr: "Kodu kullan" },
  },
  win_back_90d: {
    defaultSubject: {
      fr: "Reviens avec -{pct}%",
      en: "Come back with -{pct}%",
      es: "Vuelve con -{pct}%",
      pt: "Volte com -{pct}%",
      de: "Komm zurück mit -{pct}%",
      it: "Torna con -{pct}%",
      tr: "-{pct}% ile geri dön",
    },
    hero: {
      fr: "Notre meilleure offre, juste pour toi",
      en: "Our best offer, just for you",
      es: "Nuestra mejor oferta, solo para ti",
      pt: "Nossa melhor oferta, só para você",
      de: "Unser bestes Angebot, nur für dich",
      it: "La nostra migliore offerta, solo per te",
      tr: "En iyi teklifimiz, sadece sana",
    },
    intro: {
      fr: (h, p, s) => `3 mois qu'on ne s'est pas vus. Ton compte ${p} ${h} mérite mieux — voici notre code le plus généreux pour relancer tes ${s}.`,
      en: (h, p, s) => `3 months without you. Your ${p} account ${h} deserves better — here's our most generous code to restart your ${s}.`,
      es: (h, p, s) => `3 meses sin verte. Tu cuenta de ${p} ${h} merece más — aquí tienes nuestro código más generoso para tus ${s}.`,
      pt: (h, p, s) => `3 meses sem você. Sua conta de ${p} ${h} merece mais — aqui está nosso código mais generoso para seus ${s}.`,
      de: (h, p, s) => `3 Monate ohne dich. Dein ${p}-Konto ${h} verdient Besseres — hier unser großzügigster Code für deine ${s}.`,
      it: (h, p, s) => `3 mesi senza di te. Il tuo account ${p} ${h} merita di più — ecco il nostro codice più generoso per i tuoi ${s}.`,
      tr: (h, p, s) => `Sensiz 3 ay geçti. ${p} hesabın ${h} daha iyisini hak ediyor — ${s} için en cömert kodumuz.`,
    },
    cta: { fr: "Réclamer mon -{pct}%", en: "Claim my -{pct}%", es: "Reclamar mi -{pct}%", pt: "Resgatar meu -{pct}%", de: "-{pct}% sichern", it: "Riscatta il -{pct}%", tr: "-{pct}%'imi al" },
  },
};

/**
 * Substitutes `{pct}`, `{code}`, and `{service}` placeholders so default
 * copy + admin-set custom subjects automatically reflect the configured
 * discount and the customer's bought service. Safe for strings without
 * placeholders — falls through unchanged.
 */
function applyLifecyclePlaceholders(s: string, pct: number, code: string, serviceLabel: string): string {
  return s
    .replace(/\{pct\}/g, String(pct))
    .replace(/\{code\}/g, code)
    .replace(/\{service\}/g, serviceLabel);
}

/**
 * Default lowercase service label per locale, used when the order has no
 * recognized service (fallback). Matches the most common purchase ("followers")
 * so the copy still reads naturally.
 */
const FALLBACK_SERVICE_LABEL: Record<EmailLocale, string> = {
  fr: "abonnés",
  en: "followers",
  es: "seguidores",
  pt: "seguidores",
  de: "follower",
  it: "follower",
  tr: "takipçi",
};

const LIFECYCLE_CODE_INTRO: Record<EmailLocale, (pct: number, code: string) => string> = {
  fr: (pct, code) => `Code <strong>${code}</strong> — <strong>-${pct}%</strong> sur ta prochaine commande.`,
  en: (pct, code) => `Code <strong>${code}</strong> — <strong>-${pct}%</strong> on your next order.`,
  es: (pct, code) => `Código <strong>${code}</strong> — <strong>-${pct}%</strong> en tu próximo pedido.`,
  pt: (pct, code) => `Código <strong>${code}</strong> — <strong>-${pct}%</strong> no seu próximo pedido.`,
  de: (pct, code) => `Code <strong>${code}</strong> — <strong>-${pct}%</strong> auf deine nächste Bestellung.`,
  it: (pct, code) => `Codice <strong>${code}</strong> — <strong>-${pct}%</strong> sul tuo prossimo ordine.`,
  tr: (pct, code) => `Kod <strong>${code}</strong> — sonraki siparişinde <strong>-${pct}%</strong>.`,
};

const LIFECYCLE_FOOTER: Record<EmailLocale, string> = {
  fr: "Tu reçois cet email car tu as déjà passé une commande sur Fanovera.",
  en: "You're receiving this email because you've ordered on Fanovera before.",
  es: "Recibes este correo porque ya has comprado en Fanovera.",
  pt: "Você recebe este e-mail porque já fez um pedido na Fanovera.",
  de: "Du erhältst diese E-Mail, weil du bereits auf Fanovera bestellt hast.",
  it: "Ricevi questa email perché hai già ordinato su Fanovera.",
  tr: "Bu e-postayı, daha önce Fanovera'da sipariş verdiğin için alıyorsun.",
};

function buildPlatformUrl(platform: string, locale: EmailLocale, promoCode: string): string {
  const cleanBase = APP_URL.replace(/\/$/, "");
  const platformPath = platform || "instagram";
  const localePrefix = locale && locale !== "fr" ? `/${locale}` : "";
  const query = promoCode ? `?promo=${encodeURIComponent(promoCode)}` : "";
  return `${cleanBase}${localePrefix}/${platformPath}${query}`;
}

/**
 * Sends a post-purchase or win-back lifecycle email. The `kind` selects the
 * copy variant; `discountPct=0` skips the promo block entirely; otherwise the
 * code is auto-derived as `FANO{discountPct}` (must be 10/15/20/25/30 to be
 * accepted by promoCodes.ts).
 */
export async function sendLifecycleEmail(
  p: LifecycleEmailParams,
): Promise<{ ok: boolean; error?: string; id?: string; code?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "Resend not configured" };

  try {
    const locale = normalizeEmailLocale(p.locale);
    const copy = LIFECYCLE_COPY[p.kind];
    if (!copy) return { ok: false, error: `Unknown lifecycle kind: ${p.kind}` };

    const platformLabel = PLATFORM_LABEL[p.platform] || p.platform;
    const handle = p.username ? `@${p.username.replace(/^@/, "")}` : platformLabel;
    const promoCode = p.discountPct > 0 ? `FANO${p.discountPct}` : "";
    const ctaUrl = buildPlatformUrl(p.platform, locale, promoCode);

    // Lowercase localized service label ("followers" → "abonnés" in FR for
    // ig_followers). Falls back to the locale's default noun when the order
    // has no recognized service.
    const rawServiceLabel = p.service ? localizedServiceLabel(p.service, locale).toLowerCase() : "";
    const serviceLabel = rawServiceLabel || FALLBACK_SERVICE_LABEL[locale];

    const rawSubject = (p.customSubject || "").trim() || copy.defaultSubject[locale];
    const subject = applyLifecyclePlaceholders(rawSubject, p.discountPct, promoCode, serviceLabel);
    const ctaLabel = applyLifecyclePlaceholders(copy.cta[locale], p.discountPct, promoCode, serviceLabel);

    const codeBlockHtml = promoCode
      ? `<div style="background:#f5f3ec;border:1px dashed #5260e6;border-radius:12px;padding:18px 20px;margin:18px 0;text-align:center;">
           <div style="font-size:12px;color:#6b7280;margin-bottom:8px;letter-spacing:0.04em;text-transform:uppercase;font-weight:700;">${escapeHtml(locale === "en" ? "Your code" : locale === "es" ? "Tu código" : locale === "de" ? "Dein Code" : locale === "it" ? "Il tuo codice" : locale === "pt" ? "Seu código" : locale === "tr" ? "Kodun" : "Ton code")}</div>
           <div style="font-family:monospace;font-size:24px;font-weight:800;color:#5260e6;letter-spacing:0.08em;">${escapeHtml(promoCode)}</div>
           <div style="font-size:13px;color:#374151;margin-top:8px;">${LIFECYCLE_CODE_INTRO[locale](p.discountPct, promoCode)}</div>
         </div>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
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
          <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.02em;text-align:center;">${escapeHtml(copy.hero[locale])}</h1>
          <p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.55;">${copy.intro[locale](escapeHtml(handle), escapeHtml(platformLabel), escapeHtml(serviceLabel))}</p>
          ${codeBlockHtml}
          <p style="margin:24px 0 0;text-align:center;">
            <a href="${ctaUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;">${escapeHtml(ctaLabel)} →</a>
          </p>
        </td></tr>
        <tr><td style="padding:18px 8px 0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.5;">
          ${escapeHtml(LIFECYCLE_FOOTER[locale])}<br>
          <a href="${APP_URL}" style="color:#6b7280;text-decoration:underline;">fanovera.com</a> · © Fanovera SAS ${new Date().getFullYear()}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const text = `${copy.hero[locale]}

${copy.intro[locale](handle, platformLabel, serviceLabel).replace(/<[^>]+>/g, "")}

${promoCode ? `Code ${promoCode} — -${p.discountPct}%\n\n` : ""}${ctaLabel}: ${ctaUrl}

—
Fanovera · ${APP_URL}`;

    const result = await resend.emails.send({
      from: RESEND_FROM,
      to: p.to,
      subject,
      html,
      text,
    });

    if (result.error) {
      console.error("[email] lifecycle Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id, code: promoCode };
  } catch (err) {
    console.error("[email] sendLifecycleEmail error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── Cross-sell likes (post-purchase, followers-only buyers) ──

export interface CrossSellLikesParams {
  to: string;
  platform: string;
  username: string;
  /** Concrete likes pack to suggest (from getComplementarySuggestion). */
  suggestion: {
    /** Full service key, e.g. "ig_likes" — used in the URL hint param + label. */
    serviceKey: string;
    /** Pack size, e.g. 100. */
    qty: number;
    /** Base price in cents, BEFORE the discount. */
    basePriceCents: number;
    /** Currency for the price display (defaults to "eur"). */
    currency?: string;
  };
  /** Discount %: drives the FANO{N} code + crossed-out price. */
  discountPct: number;
  /** Custom subject set in admin (falls back to a default per locale). */
  customSubject?: string;
  locale?: string;
}

const CROSS_SELL_LIKES_COPY: Record<EmailLocale, {
  defaultSubject: string;
  hero: string;
  intro: (handle: string, platformLabel: string) => string;
  reassure: string;
  suggestedTag: string;
  wasLabel: string;
  codeLabel: string;
  cta: string;
}> = {
  fr: {
    defaultSubject: "Tes followers méritent des likes 👀",
    hero: "Et si on ajoutait des likes ?",
    intro: (h, p) => `Tu as boosté les abonnés de ${h} sur ${p} — top ! Mais un compte avec plein d'abonnés et peu de likes, ça sonne faux. Quelques likes sur tes publications rendent tout ça crédible.`,
    reassure: "Livraison progressive, 100&nbsp;% naturelle, sans mot de passe.",
    suggestedTag: "Suggéré pour toi",
    wasLabel: "au lieu de",
    codeLabel: "Ton code",
    cta: "Ajouter des likes -{pct}%",
  },
  en: {
    defaultSubject: "Your followers deserve some likes 👀",
    hero: "How about adding some likes?",
    intro: (h, p) => `You boosted ${h}'s followers on ${p} — nice! But an account with lots of followers and few likes looks off. A few likes on your posts make it all believable.`,
    reassure: "Gradual delivery, 100&nbsp;% natural, no password.",
    suggestedTag: "Suggested for you",
    wasLabel: "instead of",
    codeLabel: "Your code",
    cta: "Add likes -{pct}%",
  },
  es: {
    defaultSubject: "Tus seguidores merecen likes 👀",
    hero: "¿Y si añadimos likes?",
    intro: (h, p) => `Impulsaste los seguidores de ${h} en ${p} — ¡genial! Pero una cuenta con muchos seguidores y pocos likes parece falsa. Unos likes en tus publicaciones lo hacen creíble.`,
    reassure: "Entrega progresiva, 100&nbsp;% natural, sin contraseña.",
    suggestedTag: "Sugerido para ti",
    wasLabel: "en lugar de",
    codeLabel: "Tu código",
    cta: "Añadir likes -{pct}%",
  },
  pt: {
    defaultSubject: "Os teus seguidores merecem likes 👀",
    hero: "E se adicionássemos likes?",
    intro: (h, p) => `Impulsionaste os seguidores de ${h} em ${p} — boa! Mas uma conta com muitos seguidores e poucos likes parece falsa. Alguns likes nas tuas publicações tornam tudo credível.`,
    reassure: "Entrega progressiva, 100&nbsp;% natural, sem senha.",
    suggestedTag: "Sugerido para ti",
    wasLabel: "em vez de",
    codeLabel: "O teu código",
    cta: "Adicionar likes -{pct}%",
  },
  de: {
    defaultSubject: "Deine Follower verdienen Likes 👀",
    hero: "Wie wäre es mit ein paar Likes?",
    intro: (h, p) => `Du hast die Follower von ${h} auf ${p} gepusht — top! Aber ein Konto mit vielen Followern und wenigen Likes wirkt unecht. Ein paar Likes auf deinen Beiträgen machen alles glaubwürdig.`,
    reassure: "Schrittweise Lieferung, 100&nbsp;% natürlich, ohne Passwort.",
    suggestedTag: "Für dich vorgeschlagen",
    wasLabel: "statt",
    codeLabel: "Dein Code",
    cta: "Likes hinzufügen -{pct}%",
  },
  it: {
    defaultSubject: "I tuoi follower meritano dei like 👀",
    hero: "Che ne dici di aggiungere dei like?",
    intro: (h, p) => `Hai potenziato i follower di ${h} su ${p} — ottimo! Ma un account con tanti follower e pochi like sembra finto. Qualche like sui tuoi post rende tutto credibile.`,
    reassure: "Consegna progressiva, 100&nbsp;% naturale, senza password.",
    suggestedTag: "Suggerito per te",
    wasLabel: "invece di",
    codeLabel: "Il tuo codice",
    cta: "Aggiungi like -{pct}%",
  },
  tr: {
    defaultSubject: "Takipçilerin biraz beğeniyi hak ediyor 👀",
    hero: "Birkaç beğeni eklesek mi?",
    intro: (h, p) => `${h} için ${p}'da takipçilerini artırdın — harika! Ama çok takipçisi olup az beğenisi olan bir hesap sahte görünür. Gönderilerine birkaç beğeni her şeyi inandırıcı yapar.`,
    reassure: "Kademeli teslimat, %100 doğal, şifre gerekmez.",
    suggestedTag: "Sana özel öneri",
    wasLabel: "yerine",
    codeLabel: "Kodun",
    cta: "Beğeni ekle -{pct}%",
  },
};

/**
 * Post-purchase cross-sell email aimed at followers-only buyers: nudges them to
 * add likes to their posts (social proof). Built around a concrete likes pack
 * (`suggestion`) with a crossed-out base price → discounted price and a FANO{pct}
 * code. The eligibility gating (followers-only cart, no prior likes purchase)
 * lives in the cron — this function just renders + sends.
 */
export async function sendCrossSellLikesEmail(
  p: CrossSellLikesParams,
): Promise<{ ok: boolean; error?: string; id?: string; code?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "Resend not configured" };

  try {
    const locale = normalizeEmailLocale(p.locale);
    const copy = CROSS_SELL_LIKES_COPY[locale];
    const platformLabel = PLATFORM_LABEL[p.platform] || p.platform;
    const handle = p.username ? `@${p.username.replace(/^@/, "")}` : platformLabel;
    const promoCode = p.discountPct > 0 ? `FANO${p.discountPct}` : "";
    const currency = p.suggestion.currency || "eur";

    const discountedCents = Math.round(p.suggestion.basePriceCents * (1 - p.discountPct / 100));
    const priceNow = fmtPrice(discountedCents, currency, locale);
    const priceWas = fmtPrice(p.suggestion.basePriceCents, currency, locale);
    const likesLabel = localizedServiceLabel(p.suggestion.serviceKey, locale);
    const productLabel = `${fmtQty(p.suggestion.qty)} ${likesLabel} ${platformLabel}`;

    // CTA points at the platform page with the promo + a hint of which pack to
    // pre-select. buildPlatformUrl already appends `?promo=` when a code exists.
    const baseUrl = buildPlatformUrl(p.platform, locale, promoCode);
    const sep = baseUrl.includes("?") ? "&" : "?";
    const ctaUrl = `${baseUrl}${sep}suggested=${encodeURIComponent(p.suggestion.serviceKey)}`;

    const rawSubject = (p.customSubject || "").trim() || copy.defaultSubject;
    const subject = applyLifecyclePlaceholders(rawSubject, p.discountPct, promoCode, likesLabel.toLowerCase());
    const cta = copy.cta.replace(/\{pct\}/g, String(p.discountPct));

    const html = `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
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
          <div style="font-size:44px;line-height:1;margin-bottom:12px;text-align:center;">❤️</div>
          <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.02em;text-align:center;">${escapeHtml(copy.hero)}</h1>
          <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.55;">${copy.intro(escapeHtml(handle), escapeHtml(platformLabel))}</p>

          <!-- Likes pack suggestion card -->
          <div style="background:#5260e6;background:linear-gradient(135deg,#5260e6 0%,#7c3aed 100%);border-radius:18px;padding:28px;color:#ffffff;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:6px;text-align:center;">
              ${escapeHtml(copy.suggestedTag)}
            </div>
            <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;text-align:center;margin-bottom:18px;line-height:1.25;">
              ${escapeHtml(productLabel)}
            </div>
            <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:18px 20px;text-align:center;">
              <div style="display:inline-block;text-align:left;">
                <div style="font-size:13px;color:rgba(255,255,255,0.7);text-decoration:line-through;margin-bottom:2px;">${escapeHtml(copy.wasLabel)} ${escapeHtml(priceWas)}</div>
                <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;line-height:1;">${escapeHtml(priceNow)}</div>
              </div>
              ${promoCode ? `<div style="margin-top:6px;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.04em;">${escapeHtml(copy.codeLabel)} <span style="font-family:monospace;font-weight:700;color:#ffffff;letter-spacing:0.1em;">${escapeHtml(promoCode)}</span></div>` : ""}
            </div>
            <div style="text-align:center;margin-top:18px;">
              <a href="${ctaUrl}" style="display:inline-block;background:#ffffff;color:#5260e6;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;">${escapeHtml(cta)} →</a>
            </div>
          </div>

          <p style="margin:18px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;text-align:center;">${copy.reassure}</p>
        </td></tr>
        <tr><td style="padding:18px 8px 0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.5;">
          ${escapeHtml(LIFECYCLE_FOOTER[locale])}<br>
          <a href="${APP_URL}" style="color:#6b7280;text-decoration:underline;">fanovera.com</a> · © Fanovera SAS ${new Date().getFullYear()}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const stripHtml = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
    const text = `${copy.hero}

${stripHtml(copy.intro(handle, platformLabel))}

${productLabel}
${stripHtml(copy.wasLabel)} ${priceWas} → ${priceNow}
${promoCode ? `${stripHtml(copy.codeLabel)} : ${promoCode}\n` : ""}
${cta}: ${ctaUrl}

${stripHtml(copy.reassure)}

—
Fanovera · ${APP_URL}`;

    const result = await resend.emails.send({
      from: RESEND_FROM,
      to: p.to,
      subject,
      html,
      text,
    });

    if (result.error) {
      console.error("[email] cross-sell likes Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id, code: promoCode };
  } catch (err) {
    console.error("[email] sendCrossSellLikesEmail error:", err);
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
