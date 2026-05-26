"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "../i18n/I18nProvider";
import { getPublicCopy } from "../components/publicCopy";
import { gtagPurchase } from "../lib/gtag";
import NetIcon from "../components/NetIcon";
import type { NetworkId } from "../lib/networks";
import { buildCurrencyFormatter, SUPPORTED_CURRENCIES, type SupportedCurrency } from "../lib/pricingCurrency";
import Header from "../components/Header";
import Footer from "../components/Footer";
import UpsellSection from "./UpsellSection";

type ConfirmState = "idle" | "loading" | "ok" | "error";

type OrderDetailsResponse = {
  platform?: unknown;
  service?: unknown;
  totalCents?: unknown;
  total_cents?: unknown;
  currency?: unknown;
  cart?: unknown;
  services?: unknown;
};

const NEXT_STEPS_COPY: Record<string, { title: string; body: string }[]> = {
  fr: [
    { title: "Email de confirmation envoyé", body: "Reçu et numéro de commande dans votre boîte mail (vérifiez les indésirables)." },
    { title: "Démarrage sous 1-6 h", body: "Votre commande entre en préparation immédiatement, le compteur public commence sous 1 à 6 heures." },
    { title: "Suivi en temps réel", body: "Consultez la progression à tout moment depuis votre numéro de commande." },
  ],
  en: [
    { title: "Confirmation email sent", body: "Receipt and order number have been sent to your inbox (check spam too)." },
    { title: "Starts in 1-6 h", body: "Your order is now in preparation, the public counter starts within 1 to 6 hours." },
    { title: "Real-time tracking", body: "Check progress anytime using your order number." },
  ],
  es: [
    { title: "Correo de confirmacion enviado", body: "Recibo y numero de pedido en tu bandeja (revisa el spam)." },
    { title: "Inicio en 1-6 h", body: "Tu pedido entra en preparacion enseguida; el contador publico empieza en 1 a 6 horas." },
    { title: "Seguimiento en tiempo real", body: "Consulta el progreso cuando quieras con tu numero de pedido." },
  ],
  pt: [
    { title: "E-mail de confirmacao enviado", body: "Recibo e numero do pedido na sua caixa (verifique o spam)." },
    { title: "Inicio em 1-6 h", body: "Seu pedido entra em preparacao agora; o contador publico comeca em 1 a 6 horas." },
    { title: "Acompanhamento em tempo real", body: "Veja o progresso a qualquer momento com seu numero de pedido." },
  ],
  de: [
    { title: "Bestaetigungs-E-Mail gesendet", body: "Quittung und Bestellnummer im Posteingang (auch im Spam pruefen)." },
    { title: "Start in 1-6 h", body: "Deine Bestellung wird sofort vorbereitet; der oeffentliche Zaehler startet in 1 bis 6 Stunden." },
    { title: "Echtzeit-Verfolgung", body: "Verfolge den Fortschritt jederzeit mit deiner Bestellnummer." },
  ],
  it: [
    { title: "Email di conferma inviata", body: "Ricevuta e numero d'ordine nella tua casella (controlla anche lo spam)." },
    { title: "Inizio in 1-6 h", body: "Il tuo ordine entra subito in preparazione; il contatore pubblico parte in 1-6 ore." },
    { title: "Monitoraggio in tempo reale", body: "Controlla l'avanzamento in qualsiasi momento con il tuo numero d'ordine." },
  ],
  tr: [
    { title: "Onay e-postasi gonderildi", body: "Makbuz ve siparis numarasi gelen kutunuzda (spam'i da kontrol edin)." },
    { title: "Baslangic 1-6 saat icinde", body: "Siparisiniz hemen hazirlaniyor; halka acik sayac 1 ila 6 saat icinde baslar." },
    { title: "Gercek zamanli takip", body: "Siparis numaranizla ilerlemeyi istediginiz zaman kontrol edin." },
  ],
};

const TIMELINE_COPY: Record<string, [string, string, string]> = {
  fr: ["Paiement validé", "En préparation", "Livraison 1-6 h"],
  en: ["Payment confirmed", "Preparing", "Delivery 1-6 h"],
  es: ["Pago confirmado", "En preparacion", "Entrega 1-6 h"],
  pt: ["Pagamento confirmado", "Em preparacao", "Entrega 1-6 h"],
  de: ["Zahlung bestaetigt", "In Vorbereitung", "Lieferung 1-6 h"],
  it: ["Pagamento confermato", "In preparazione", "Consegna 1-6 h"],
  tr: ["Odeme onaylandi", "Hazirlaniyor", "Teslimat 1-6 saat"],
};

const ORDER_LABEL_COPY: Record<string, { orderNumber: string; nextSteps: string; needHelp: string; contactUs: string; retry: string; reassurance: string; myOrders: string; platform: string; service: string; totalPaid: string; paidStamp: string; eta: string }> = {
  fr: { orderNumber: "Numéro de commande", nextSteps: "Et maintenant ?", needHelp: "Une question ?", contactUs: "Contactez-nous", retry: "Réessayer", reassurance: "Sans mot de passe - Paiement sécurisé - Aucune donnée sensible stockée", myOrders: "Voir toutes mes commandes", platform: "Plateforme", service: "Service", totalPaid: "Total payé", paidStamp: "PAYÉ", eta: "Démarre sous 1–6 h" },
  en: { orderNumber: "Order number", nextSteps: "What's next?", needHelp: "Any questions?", contactUs: "Contact us", retry: "Try again", reassurance: "No password - Secure payment - No sensitive data stored", myOrders: "View all my orders", platform: "Platform", service: "Service", totalPaid: "Total paid", paidStamp: "PAID", eta: "Starts in 1–6 h" },
  es: { orderNumber: "Numero de pedido", nextSteps: "Y ahora?", needHelp: "Alguna pregunta?", contactUs: "Contactanos", retry: "Reintentar", reassurance: "Sin contrasena - Pago seguro - Sin datos sensibles", myOrders: "Ver todos mis pedidos", platform: "Plataforma", service: "Servicio", totalPaid: "Total pagado", paidStamp: "PAGADO", eta: "Inicio en 1–6 h" },
  pt: { orderNumber: "Numero do pedido", nextSteps: "E agora?", needHelp: "Tem alguma pergunta?", contactUs: "Fale conosco", retry: "Tentar novamente", reassurance: "Sem senha - Pagamento seguro - Sem dados sensiveis", myOrders: "Ver todos os meus pedidos", platform: "Plataforma", service: "Serviço", totalPaid: "Total pago", paidStamp: "PAGO", eta: "Inicio em 1–6 h" },
  de: { orderNumber: "Bestellnummer", nextSteps: "Wie geht es weiter?", needHelp: "Fragen?", contactUs: "Kontaktiere uns", retry: "Erneut versuchen", reassurance: "Kein Passwort - Sichere Zahlung - Keine sensiblen Daten", myOrders: "Alle meine Bestellungen ansehen", platform: "Plattform", service: "Dienst", totalPaid: "Gesamt bezahlt", paidStamp: "BEZAHLT", eta: "Start in 1–6 h" },
  it: { orderNumber: "Numero d'ordine", nextSteps: "E ora?", needHelp: "Hai domande?", contactUs: "Contattaci", retry: "Riprova", reassurance: "Senza password - Pagamento sicuro - Nessun dato sensibile", myOrders: "Vedi tutti i miei ordini", platform: "Piattaforma", service: "Servizio", totalPaid: "Totale pagato", paidStamp: "PAGATO", eta: "Inizio in 1–6 h" },
  tr: { orderNumber: "Siparis numarasi", nextSteps: "Simdi ne olacak?", needHelp: "Sorulariniz mi var?", contactUs: "Bize ulasin", retry: "Tekrar dene", reassurance: "Sifre yok - Guvenli odeme - Hassas veri saklanmaz", myOrders: "Tüm siparişlerimi görüntüle", platform: "Platform", service: "Hizmet", totalPaid: "Toplam ödenen", paidStamp: "ÖDENDİ", eta: "1–6 saat içinde başlar" },
};

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  spotify: "Spotify",
  twitch: "Twitch",
  twitter: "X",
  facebook: "Facebook",
  linkedin: "LinkedIn",
};

const PLATFORM_ACCENT: Record<string, string> = {
  instagram: "#d62976",
  tiktok: "#fe2c55",
  youtube: "#ff0000",
  spotify: "#1ed760",
  twitch: "#9146ff",
  twitter: "#0f1419",
  facebook: "#1877f2",
  linkedin: "#0a66c2",
};

const SERVICE_KIND: Record<string, "followers" | "likes" | "views" | "subscribers" | "streams"> = {
  ig_followers: "followers", ig_likes: "likes", ig_views: "views",
  tt_followers: "followers", tt_likes: "likes", tt_views: "views",
  yt_views: "views", yt_subscribers: "subscribers",
  sp_streams: "streams", sp_followers: "followers",
  tw_followers: "followers",
  x_followers: "followers",
  fb_followers: "followers", fb_likes: "likes",
  li_followers: "followers",
};

const SERVICE_LABELS: Record<string, Record<string, string>> = {
  fr: { followers: "Followers", likes: "J'aime", views: "Vues", subscribers: "Abonnés", streams: "Streams" },
  en: { followers: "Followers", likes: "Likes", views: "Views", subscribers: "Subscribers", streams: "Streams" },
  es: { followers: "Seguidores", likes: "Me gusta", views: "Vistas", subscribers: "Suscriptores", streams: "Reproducciones" },
  pt: { followers: "Seguidores", likes: "Curtidas", views: "Visualizações", subscribers: "Inscritos", streams: "Streams" },
  de: { followers: "Follower", likes: "Likes", views: "Aufrufe", subscribers: "Abonnenten", streams: "Streams" },
  it: { followers: "Follower", likes: "Mi piace", views: "Visualizzazioni", subscribers: "Iscritti", streams: "Stream" },
  tr: { followers: "Takipçi", likes: "Beğeni", views: "İzlenme", subscribers: "Abone", streams: "Stream" },
};

function serviceLabel(service: string, locale: string): string {
  const kind = SERVICE_KIND[service] || "followers";
  return (SERVICE_LABELS[locale] || SERVICE_LABELS.en)[kind];
}

function formatTotal(cents: number, currency: string, locale: string): string {
  if (!cents) return "—";
  const upper = currency.toUpperCase();
  const safe: SupportedCurrency = (SUPPORTED_CURRENCIES as readonly string[]).includes(upper)
    ? (upper as SupportedCurrency)
    : "EUR";
  try {
    return buildCurrencyFormatter(safe, locale).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${upper}`;
  }
}

function nonEmptyString(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function firstServiceFromItems(value: unknown): string {
  if (!Array.isArray(value)) return "";
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const service = nonEmptyString((item as Record<string, unknown>).service);
    if (service) return service;
  }
  return "";
}

function serviceFromOrderDetails(data: OrderDetailsResponse): string {
  return (
    nonEmptyString(data.service) ||
    firstServiceFromItems(data.cart) ||
    firstServiceFromItems(data.services)
  );
}

function totalCentsFromOrderDetails(data: OrderDetailsResponse): number | null {
  const value = data.totalCents ?? data.total_cents;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function OrderSuccessContent() {
  const search = useSearchParams();
  const { locale } = useI18n();
  const copy = getPublicCopy(locale).order;
  const labels = ORDER_LABEL_COPY[locale] || ORDER_LABEL_COPY.fr;
  const nextSteps = NEXT_STEPS_COPY[locale] || NEXT_STEPS_COPY.fr;
  const timeline = TIMELINE_COPY[locale] || TIMELINE_COPY.fr;

  const [state, setState] = useState<ConfirmState>("idle");
  const [orderId, setOrderId] = useState<string>(search.get("orderId") || "");
  const [error, setError] = useState<string>("");
  const [retryKey, setRetryKey] = useState(0);
  const [purchasedService, setPurchasedService] = useState<string>("");
  const [purchasedPlatform, setPurchasedPlatform] = useState<string>(search.get("platform") || "");
  const [totalCents, setTotalCents] = useState<number>(0);
  const [orderCurrency, setOrderCurrency] = useState<string>("eur");
  const purchaseTrackedRef = useRef(false);

  const paymentIntentId = useMemo(() => search.get("payment_intent") || "", [search]);
  const platform = purchasedPlatform || search.get("platform") || "";

  useEffect(() => {
    if (!paymentIntentId) return;
    // Skip only when we already have the full payload (orderId alone isn't
    // enough — service + totalCents come from the same API call and stay
    // empty if we don't fetch). This also covers the case where the URL has
    // ?orderId=X&payment_intent=pi_X (e.g. webhook-redirect or shared link).
    if (orderId && purchasedService && totalCents > 0) return;
    let cancelled = false;
    const run = async () => {
      setState("loading");
      setError("");
      try {
        const res = await fetch("/api/confirm-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.orderId) {
          throw new Error(data?.error || copy.confirmError);
        }
        if (!cancelled) {
          const details = data as OrderDetailsResponse;
          const platformFromResponse = nonEmptyString(details.platform);
          const serviceFromResponse = serviceFromOrderDetails(details);
          const totalFromResponse = totalCentsFromOrderDetails(details);
          const currencyFromResponse = nonEmptyString(details.currency);

          setOrderId(String(data.orderId));
          if (platformFromResponse) setPurchasedPlatform(platformFromResponse);
          if (serviceFromResponse) setPurchasedService(serviceFromResponse);
          if (totalFromResponse !== null) setTotalCents(totalFromResponse);
          if (currencyFromResponse) setOrderCurrency(currencyFromResponse);
          setState("ok");
        }
      } catch (e) {
        if (!cancelled) {
          setState("error");
          setError(e instanceof Error ? e.message : copy.unexpected);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [copy.confirmError, copy.unexpected, orderId, paymentIntentId, purchasedService, totalCents, retryKey]);

  useEffect(() => {
    if (!orderId) return;
    if (purchasedService && totalCents > 0 && purchasedPlatform) return;

    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`/api/order/${encodeURIComponent(orderId)}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Order details unavailable");
        if (cancelled) return;

        const details = data as OrderDetailsResponse;
        const platformFromOrder = nonEmptyString(details.platform);
        const serviceFromOrder = serviceFromOrderDetails(details);
        const totalFromOrder = totalCentsFromOrderDetails(details);
        const currencyFromOrder = nonEmptyString(details.currency);

        if (platformFromOrder) setPurchasedPlatform(platformFromOrder);
        if (serviceFromOrder) setPurchasedService(serviceFromOrder);
        if (totalFromOrder !== null) setTotalCents(totalFromOrder);
        if (currencyFromOrder) setOrderCurrency(currencyFromOrder);
        setState((current) => (current === "idle" ? "ok" : current));
      } catch (e) {
        console.warn("[order-success] Unable to load order details:", e);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [orderId, purchasedPlatform, purchasedService, totalCents]);

  useEffect(() => {
    if (!orderId || totalCents <= 0 || purchaseTrackedRef.current) return;
    purchaseTrackedRef.current = true;
    gtagPurchase({
      orderId,
      value: totalCents ? totalCents / 100 : 0,
      currency: orderCurrency,
    });
  }, [orderId, totalCents, orderCurrency]);

  const done = !!orderId;
  const isLoading = !done && state !== "error";

  const platformKey = (platform || "").toLowerCase();
  const platformLabel = PLATFORM_LABEL[platformKey] || (platformKey ? platformKey.charAt(0).toUpperCase() + platformKey.slice(1) : "—");
  const accent = PLATFORM_ACCENT[platformKey] || "#5260e6";
  const serviceText = purchasedService ? serviceLabel(purchasedService, locale) : "—";
  const totalText = formatTotal(totalCents, orderCurrency, locale);

  return (
    <main className="success-main" data-i18n-skip>
      <div className="success-shell">
        {isLoading && (
          <div className="success-loading">
            <div className="success-spinner" />
            <h1>{state === "loading" ? copy.finalizing : copy.verifying}</h1>
            <p>{copy.thanks}</p>
          </div>
        )}

        {state === "error" && (
          <div className="success-error">
            <div className="success-error-icon" aria-hidden>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 10v8M16 22h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </div>
            <h1>{error || copy.fallbackError}</h1>
            <p>{copy.unexpected}</p>
            <div className="success-error-actions">
              <button onClick={() => { setState("idle"); setError(""); setRetryKey((k) => k + 1); }} className="btn-primary success-btn-primary">
                {labels.retry}
              </button>
              <Link href="/" className="success-btn-ghost">{copy.home}</Link>
            </div>
          </div>
        )}

        {done && (
          <>
            <header className="success-hero">
              <div className="success-stamp" aria-hidden>
                <div className="success-stamp-inner">{labels.paidStamp}</div>
              </div>

              <div className="success-check-wrap">
                <span className="success-check-pulse" aria-hidden />
                <div className="success-check" aria-hidden>
                  <svg width="32" height="32" viewBox="0 0 44 44" fill="none">
                    <path className="success-check-path" d="M11 22l7 7 14-16" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="success-confetti c1" aria-hidden />
                <span className="success-confetti c2" aria-hidden />
                <span className="success-confetti c3" aria-hidden />
                <span className="success-confetti c4" aria-hidden />
              </div>

              <h1 className="success-title">{copy.title}</h1>
              <p className="success-sub">{copy.thanks}</p>
            </header>

            <div className="email-callout" role="status">
              <span className="email-callout-icon" aria-hidden>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="email-callout-text">
                <strong>{nextSteps[0].title}</strong>
                <span>{nextSteps[0].body}</span>
              </div>
            </div>

            <article
              className="ticket"
              style={{ ["--accent" as string]: accent } as React.CSSProperties}
              aria-label={`${labels.orderNumber} ${orderId}`}
            >
              <div className="ticket-perf top" aria-hidden />

              <div className="ticket-head">
                <span className="ticket-eyebrow">{labels.orderNumber}</span>
                <span className="ticket-id">#{orderId}</span>
              </div>

              <dl className="ticket-rows">
                <div className="ticket-row">
                  <dt>{labels.platform}</dt>
                  <dd>
                    {platformKey && (
                      <span className="ticket-net-icon" aria-hidden>
                        <NetIcon kind={platformKey as NetworkId} color={accent} size={18} />
                      </span>
                    )}
                    <span>{platformLabel}</span>
                  </dd>
                </div>
                <div className="ticket-row">
                  <dt>{labels.service}</dt>
                  <dd>{serviceText}</dd>
                </div>
                <div className="ticket-row total">
                  <dt>{labels.totalPaid}</dt>
                  <dd className="ticket-total-amount">{totalText}</dd>
                </div>
              </dl>

              <div className="ticket-eta">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{labels.eta}</span>
              </div>

              <div className="ticket-perf bottom" aria-hidden />
            </article>

            <section className="success-checklist" aria-label={labels.nextSteps}>
              <h2>{labels.nextSteps}</h2>
              <ul>
                {nextSteps.slice(1).map((step, i) => {
                  const isDone = i < 1;
                  return (
                    <li key={i} className={isDone ? "done" : "pending"}>
                      <span className="checklist-marker" aria-hidden>
                        {isDone ? (
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                            <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                            <path d="M7 4.5V7l1.5 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <div className="checklist-text">
                        <strong>{step.title}</strong>
                        <span>{step.body}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="success-actions">
                <Link href={`/track/${encodeURIComponent(orderId)}`} className="success-btn-primary">
                  <span>{copy.track(orderId)}</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link href="/account" className="success-btn-secondary">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <rect x="2.5" y="3" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M5 6.5h6M5 9h6M5 11.5h3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  <span>{labels.myOrders}</span>
                </Link>
                <Link href={platform ? `/${platform}` : "/"} className="success-btn-ghost">
                  {copy.home}
                </Link>
              </div>

              <div className="success-upsell-wrap">
                <UpsellSection platform={platform} service={purchasedService} locale={locale} compact />
              </div>
            </section>

            <p className="success-timeline-summary">
              <span className="dot done" /> {timeline[0]}
              <span className="sep">·</span>
              <span className="dot active" /> {timeline[1]}
              <span className="sep">·</span>
              <span className="dot" /> {timeline[2]}
            </p>

            <p className="success-help">
              {labels.needHelp}{" "}
              <Link href="/contact" className="success-help-link">{labels.contactUs}</Link>
            </p>
          </>
        )}
      </div>

      <style jsx>{`
        .success-main {
          padding: 40px 20px 96px;
          background: linear-gradient(180deg, rgba(82, 96, 230, 0.04) 0%, transparent 240px);
        }
        .success-shell {
          max-width: 560px;
          margin: 0 auto;
        }

        /* Loading */
        .success-loading {
          background: white;
          border: 1px solid var(--line);
          border-radius: 22px;
          padding: 64px 28px;
          text-align: center;
          box-shadow: 0 24px 60px -28px rgba(20, 22, 50, 0.15);
        }
        .success-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(82, 96, 230, 0.15);
          border-top-color: var(--primary);
          border-radius: 50%;
          margin: 0 auto 20px;
          animation: spin 0.9s linear infinite;
        }
        .success-loading h1 {
          font-size: 20px;
          margin: 0 0 6px;
          font-weight: 800;
          color: var(--ink);
        }
        .success-loading p {
          color: var(--ink-3);
          font-size: 14px;
          margin: 0;
        }

        /* Error */
        .success-error {
          background: white;
          border: 1px solid var(--line);
          border-radius: 22px;
          padding: 40px 28px;
          text-align: center;
          box-shadow: 0 24px 60px -28px rgba(20, 22, 50, 0.15);
        }
        .success-error-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(180, 35, 24, 0.1);
          color: #b42318;
          display: grid;
          place-items: center;
          margin: 0 auto 16px;
        }
        .success-error h1 {
          font-size: 19px;
          font-weight: 800;
          color: #b42318;
          margin: 0 0 6px;
        }
        .success-error p {
          color: var(--ink-3);
          font-size: 14px;
          margin: 0 0 18px;
        }
        .success-error-actions {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* Hero */
        .success-hero {
          position: relative;
          text-align: center;
          padding: 8px 0 28px;
        }
        .success-stamp {
          position: absolute;
          top: -10px;
          right: 8px;
          transform: rotate(-12deg);
          z-index: 2;
          animation: stamp-drop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
        }
        .success-stamp-inner {
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: #16a34a;
          padding: 8px 16px;
          border: 3px double #16a34a;
          border-radius: 6px;
          background: rgba(34, 197, 94, 0.08);
          text-transform: uppercase;
          font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
        }
        .success-check-wrap {
          position: relative;
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
        }
        .success-check-pulse {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.2);
          animation: pulse 2s ease-out infinite;
        }
        .success-check {
          position: relative;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          display: grid;
          place-items: center;
          box-shadow: 0 12px 28px -10px rgba(34, 197, 94, 0.55);
          animation: pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .success-check-path {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: draw 0.55s ease-out 0.25s forwards;
        }
        .success-confetti {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 1px;
          opacity: 0;
          animation: confetti 1.4s ease-out 0.3s forwards;
        }
        .success-confetti.c1 { top: 10%; left: -2px; background: #5260e6; --tx: -22px; --ty: -18px; }
        .success-confetti.c2 { top: 0%; left: 50%; background: #d62976; --tx: 0px; --ty: -28px; }
        .success-confetti.c3 { top: 10%; right: -2px; background: #f59e0b; --tx: 24px; --ty: -18px; }
        .success-confetti.c4 { bottom: 0%; left: 50%; background: #22c55e; --tx: 0px; --ty: 28px; border-radius: 50%; }

        .success-title {
          font-size: clamp(24px, 3.6vw, 32px);
          font-weight: 900;
          color: var(--ink);
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }
        .success-sub {
          color: var(--ink-2);
          font-size: 15px;
          line-height: 1.5;
          margin: 0;
        }

        /* Email confirmation callout — surfaces the receipt-sent reassurance
           above the order ticket so the user sees it before reading the
           transaction details. Mirrors the success-checklist visual language
           (green check on tinted background) but in a single emphasised row. */
        .email-callout {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin: 18px 0 20px;
          padding: 14px 16px;
          background: rgba(77, 191, 138, 0.10);
          border: 1px solid rgba(77, 191, 138, 0.30);
          border-radius: 14px;
        }
        .email-callout-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--green);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .email-callout-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .email-callout-text strong {
          font-weight: 800;
          color: var(--ink);
          font-size: 15px;
          line-height: 1.3;
        }
        .email-callout-text span {
          color: var(--ink-2);
          font-size: 13px;
          line-height: 1.45;
        }

        /* Ticket / receipt */
        .ticket {
          position: relative;
          background: white;
          border-radius: 18px;
          padding: 26px 24px 22px;
          box-shadow: 0 20px 50px -22px rgba(20, 22, 50, 0.22);
          margin-bottom: 20px;
        }
        .ticket::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 18px;
          padding: 1.5px;
          background: linear-gradient(135deg, var(--accent, #5260e6), rgba(82, 96, 230, 0.2));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .ticket-perf {
          position: absolute;
          left: 12px;
          right: 12px;
          height: 12px;
          background-image: radial-gradient(circle at 6px 6px, var(--paper, #f5f5f8) 4px, transparent 4.5px);
          background-size: 14px 12px;
          background-repeat: repeat-x;
        }
        .ticket-perf.top { top: -6px; }
        .ticket-perf.bottom { bottom: -6px; }
        .ticket-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding-bottom: 14px;
          border-bottom: 1px dashed var(--line);
          margin-bottom: 14px;
        }
        .ticket-eyebrow {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--ink-3);
        }
        .ticket-id {
          font-size: 18px;
          font-weight: 900;
          color: var(--accent);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.01em;
        }
        .ticket-rows {
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ticket-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .ticket-row dt {
          font-size: 13px;
          color: var(--ink-3);
          margin: 0;
        }
        .ticket-row dd {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: var(--ink);
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .ticket-net-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: color-mix(in srgb, var(--accent) 12%, transparent);
        }
        .ticket-row.total {
          padding-top: 12px;
          border-top: 1px dashed var(--line);
          margin-top: 6px;
        }
        .ticket-row.total dt {
          font-weight: 700;
          color: var(--ink);
          font-size: 14px;
        }
        .ticket-total-amount {
          font-size: 22px;
          font-weight: 900;
          color: var(--accent);
          letter-spacing: -0.01em;
          font-variant-numeric: tabular-nums;
        }
        .ticket-eta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 16px;
          padding: 6px 12px;
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        /* Actions — nested inside .success-checklist */
        .success-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px dashed var(--line);
        }
        .success-upsell-wrap {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px dashed var(--line);
        }
        .success-actions :global(a),
        .success-actions :global(button) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px 22px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          border: 1px solid transparent;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease;
          cursor: pointer;
          box-sizing: border-box;
        }
        :global(.success-btn-primary) {
          background: var(--primary, #5260e6);
          color: white !important;
          box-shadow: 0 12px 24px -12px rgba(82, 96, 230, 0.6);
        }
        :global(.success-btn-primary:hover) {
          transform: translateY(-1px);
          filter: brightness(1.06);
        }
        :global(.success-btn-secondary) {
          background: rgba(82, 96, 230, 0.08);
          color: var(--primary, #5260e6) !important;
          border-color: rgba(82, 96, 230, 0.25);
        }
        :global(.success-btn-secondary:hover) {
          background: rgba(82, 96, 230, 0.14);
          border-color: rgba(82, 96, 230, 0.45);
          transform: translateY(-1px);
        }
        :global(.success-btn-ghost) {
          background: white;
          color: var(--ink, #111827) !important;
          border-color: var(--line, #e5e7eb);
          font-weight: 600;
        }
        :global(.success-btn-ghost:hover) {
          background: var(--paper-2, #f7f7fb);
        }

        /* Checklist */
        .success-checklist {
          background: white;
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: 18px 20px;
          margin-bottom: 16px;
        }
        .success-checklist h2 {
          font-size: 12px;
          font-weight: 800;
          color: var(--ink-3);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0 0 14px;
        }
        .success-checklist ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .success-checklist li {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .checklist-marker {
          flex-shrink: 0;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          margin-top: 1px;
        }
        .success-checklist li.done .checklist-marker {
          background: #22c55e;
          color: white;
        }
        .success-checklist li.pending .checklist-marker {
          background: rgba(82, 96, 230, 0.1);
          color: var(--primary);
        }
        .checklist-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .checklist-text strong {
          font-size: 14px;
          font-weight: 700;
          color: var(--ink);
        }
        .checklist-text span {
          font-size: 13px;
          color: var(--ink-3);
          line-height: 1.5;
        }

        /* Timeline summary */
        .success-timeline-summary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex-wrap: wrap;
          font-size: 12px;
          color: var(--ink-3);
          margin: 0 0 18px;
        }
        .success-timeline-summary .dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--line);
          margin-right: 4px;
        }
        .success-timeline-summary .dot.done {
          background: #22c55e;
        }
        .success-timeline-summary .dot.active {
          background: var(--primary, #5260e6);
          animation: dot-pulse 1.6s ease-in-out infinite;
        }
        .success-timeline-summary .sep {
          color: var(--ink-3);
          opacity: 0.5;
        }

        /* Help */
        .success-help {
          text-align: center;
          font-size: 13px;
          color: var(--ink-3);
          margin: 0 0 32px;
        }
        .success-help-link {
          color: var(--primary);
          text-decoration: underline;
          text-underline-offset: 3px;
          font-weight: 600;
        }

        /* Animations */
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pop {
          0% { transform: scale(0); }
          80% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          70%, 100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        @keyframes confetti {
          0% { opacity: 0; transform: translate(0, 0) scale(0.4); }
          15% { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--tx, 0), var(--ty, 0)) scale(1); }
        }
        @keyframes dot-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(82, 96, 230, 0.5); }
          50% { box-shadow: 0 0 0 6px rgba(82, 96, 230, 0); }
        }
        @keyframes stamp-drop {
          0% { transform: rotate(20deg) scale(2); opacity: 0; }
          100% { transform: rotate(-12deg) scale(1); opacity: 1; }
        }

        /* Mobile */
        @media (max-width: 640px) {
          .success-main { padding: 24px 14px 56px; }
          .ticket { padding: 22px 18px 18px; }
          .ticket-total-amount { font-size: 19px; }
          .success-stamp { top: -6px; right: 0; }
          .success-stamp-inner { font-size: 12px; padding: 6px 12px; }
          .ticket-id { font-size: 16px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .success-check-pulse,
          .success-check,
          .success-check-path,
          .success-confetti,
          .success-stamp,
          .success-timeline-summary .dot.active,
          .success-spinner {
            animation: none !important;
          }
          .success-check-path { stroke-dashoffset: 0; }
          .success-stamp { opacity: 1; transform: rotate(-12deg) scale(1); }
        }
      `}</style>
    </main>
  );
}

export default function OrderSuccessClient() {
  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <OrderSuccessContent />
      </Suspense>
      <Footer />
    </>
  );
}
