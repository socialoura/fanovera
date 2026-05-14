"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "../i18n/I18nProvider";
import { getPublicCopy } from "../components/publicCopy";
import { gtagPurchase } from "../lib/gtag";
import Header from "../components/Header";
import Footer from "../components/Footer";
import UpsellSection from "./UpsellSection";

type ConfirmState = "idle" | "loading" | "ok" | "error";

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

const ORDER_LABEL_COPY: Record<string, { orderNumber: string; nextSteps: string; needHelp: string; contactUs: string; retry: string; reassurance: string; myOrders: string }> = {
  fr: { orderNumber: "Numéro de commande", nextSteps: "Et maintenant ?", needHelp: "Une question ?", contactUs: "Contactez-nous", retry: "Réessayer", reassurance: "Sans mot de passe - Paiement sécurisé - Aucune donnée sensible stockée", myOrders: "Voir toutes mes commandes" },
  en: { orderNumber: "Order number", nextSteps: "What's next?", needHelp: "Any questions?", contactUs: "Contact us", retry: "Try again", reassurance: "No password - Secure payment - No sensitive data stored", myOrders: "View all my orders" },
  es: { orderNumber: "Numero de pedido", nextSteps: "Y ahora?", needHelp: "Alguna pregunta?", contactUs: "Contactanos", retry: "Reintentar", reassurance: "Sin contrasena - Pago seguro - Sin datos sensibles", myOrders: "Ver todos mis pedidos" },
  pt: { orderNumber: "Numero do pedido", nextSteps: "E agora?", needHelp: "Tem alguma pergunta?", contactUs: "Fale conosco", retry: "Tentar novamente", reassurance: "Sem senha - Pagamento seguro - Sem dados sensiveis", myOrders: "Ver todos os meus pedidos" },
  de: { orderNumber: "Bestellnummer", nextSteps: "Wie geht es weiter?", needHelp: "Fragen?", contactUs: "Kontaktiere uns", retry: "Erneut versuchen", reassurance: "Kein Passwort - Sichere Zahlung - Keine sensiblen Daten", myOrders: "Alle meine Bestellungen ansehen" },
  it: { orderNumber: "Numero d'ordine", nextSteps: "E ora?", needHelp: "Hai domande?", contactUs: "Contattaci", retry: "Riprova", reassurance: "Senza password - Pagamento sicuro - Nessun dato sensibile", myOrders: "Vedi tutti i miei ordini" },
  tr: { orderNumber: "Siparis numarasi", nextSteps: "Simdi ne olacak?", needHelp: "Sorulariniz mi var?", contactUs: "Bize ulasin", retry: "Tekrar dene", reassurance: "Sifre yok - Guvenli odeme - Hassas veri saklanmaz", myOrders: "Tüm siparişlerimi görüntüle" },
};

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
    if (orderId || !paymentIntentId) return;
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
          setOrderId(String(data.orderId));
          if (typeof data.platform === "string" && data.platform) setPurchasedPlatform(data.platform);
          if (typeof data.service === "string" && data.service) setPurchasedService(data.service);
          if (typeof data.totalCents === "number") setTotalCents(data.totalCents);
          if (typeof data.currency === "string" && data.currency) setOrderCurrency(data.currency);
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
  }, [copy.confirmError, copy.unexpected, orderId, paymentIntentId, retryKey]);

  useEffect(() => {
    if (!orderId || purchaseTrackedRef.current) return;
    purchaseTrackedRef.current = true;
    gtagPurchase({
      orderId,
      value: totalCents ? totalCents / 100 : 0,
      currency: orderCurrency,
    });
  }, [orderId, totalCents, orderCurrency]);

  const done = !!orderId;
  const isLoading = !done && state !== "error";

  return (
    <main className="order-success-main">
      <div className="order-success-container">
        {isLoading && (
          <div className="order-card order-card-loading">
            <div className="order-spinner-large" />
            <h1 className="order-loading-title">{state === "loading" ? copy.finalizing : copy.verifying}</h1>
            <p className="order-loading-sub">{copy.thanks}</p>
          </div>
        )}

        {state === "error" && (
          <div className="order-card order-card-error">
            <div className="order-error-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 10v8M16 22h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </div>
            <h1 className="order-error-title">{error || copy.fallbackError}</h1>
            <p className="order-error-sub">{copy.unexpected}</p>
            <div className="order-error-actions">
              <button onClick={() => { setState("idle"); setError(""); setRetryKey((k) => k + 1); }} className="btn-primary">
                {labels.retry}
              </button>
              <Link href="/" className="btn-soft order-btn-soft">{copy.home}</Link>
            </div>
          </div>
        )}

        {done && (
          <>
            <div className="order-card order-card-success">
              <div className="order-check-wrap">
                <div className="order-check-pulse" aria-hidden />
                <div className="order-check-circle">
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
                    <path className="order-check-path" d="M11 22l7 7 14-16" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="order-confetti c1" aria-hidden />
                <span className="order-confetti c2" aria-hidden />
                <span className="order-confetti c3" aria-hidden />
                <span className="order-confetti c4" aria-hidden />
                <span className="order-confetti c5" aria-hidden />
                <span className="order-confetti c6" aria-hidden />
              </div>

              <h1 className="order-success-title">{copy.title}</h1>
              <p className="order-success-sub">{copy.thanks}</p>

              <div className="order-id-badge">
                <span className="order-id-label">{labels.orderNumber}</span>
                <span className="order-id-value">#{orderId}</span>
              </div>

              <div className="order-timeline" role="list">
                <div className="order-timeline-step done" role="listitem">
                  <div className="order-timeline-dot">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <span className="order-timeline-label">{timeline[0]}</span>
                </div>
                <div className="order-timeline-bar done" />
                <div className="order-timeline-step active" role="listitem">
                  <div className="order-timeline-dot pulsing" />
                  <span className="order-timeline-label">{timeline[1]}</span>
                </div>
                <div className="order-timeline-bar" />
                <div className="order-timeline-step" role="listitem">
                  <div className="order-timeline-dot" />
                  <span className="order-timeline-label">{timeline[2]}</span>
                </div>
              </div>

              <div className="order-actions">
                <Link href={`/track/${encodeURIComponent(orderId)}`} className="btn-primary order-btn-primary">
                  {copy.track(orderId)}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
                <Link href={platform ? `/${platform}` : "/"} className="btn-soft order-btn-soft">
                  {copy.home}
                </Link>
              </div>

              <Link href="/account" className="order-myorders-link">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2.5 4.5h11v8a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  <path d="M5.5 4.5V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
                <span>{labels.myOrders}</span>
              </Link>
            </div>

            <section className="order-next">
              <h2 className="order-next-title">{labels.nextSteps}</h2>
              <div className="order-next-grid">
                {nextSteps.map((step, i) => (
                  <div key={i} className="order-next-card">
                    <div className="order-next-num">{i + 1}</div>
                    <h3 className="order-next-step-title">{step.title}</h3>
                    <p className="order-next-step-body">{step.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <UpsellSection platform={platform} service={purchasedService} locale={locale} />

          </>
        )}
      </div>

      <style jsx>{`
        .order-success-main {
          position: relative;
          padding: 32px 20px 96px;
        }
        .order-success-container {
          position: relative;
          max-width: 720px;
          margin: 0 auto;
        }

        .order-card {
          background: white;
          border: 1px solid var(--line);
          border-radius: 24px;
          padding: 48px 32px 36px;
          box-shadow: 0 24px 60px -28px rgba(20, 22, 50, 0.18), 0 4px 12px -4px rgba(20, 22, 50, 0.05);
          text-align: center;
        }

        /* Loading */
        .order-card-loading {
          padding: 80px 32px;
        }
        .order-spinner-large {
          width: 56px;
          height: 56px;
          border: 4px solid rgba(82, 96, 230, 0.15);
          border-top-color: var(--primary);
          border-radius: 50%;
          margin: 0 auto 24px;
          animation: order-spin 0.9s linear infinite;
        }
        .order-loading-title {
          font-size: 22px;
          margin: 0 0 8px;
          color: var(--ink);
          font-weight: 800;
        }
        .order-loading-sub {
          color: var(--ink-3);
          font-size: 14px;
          margin: 0;
        }

        /* Error */
        .order-card-error {
          padding-top: 36px;
        }
        .order-error-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(180, 35, 24, 0.1);
          color: #b42318;
          display: grid;
          place-items: center;
          margin: 0 auto 18px;
        }
        .order-error-title {
          font-size: 20px;
          font-weight: 800;
          color: #b42318;
          margin: 0 0 8px;
        }
        .order-error-sub {
          color: var(--ink-3);
          font-size: 14px;
          margin: 0 0 22px;
        }
        .order-error-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* Success header */
        .order-check-wrap {
          position: relative;
          width: 96px;
          height: 96px;
          margin: 0 auto 24px;
        }
        .order-check-pulse {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.18);
          animation: order-pulse 2s ease-out infinite;
        }
        .order-check-circle {
          position: relative;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          display: grid;
          place-items: center;
          box-shadow: 0 16px 40px -12px rgba(34, 197, 94, 0.55);
          animation: order-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .order-check-path {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: order-draw 0.6s ease-out 0.3s forwards;
        }

        .order-confetti {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 2px;
          opacity: 0;
          animation: order-confetti 1.4s ease-out 0.4s forwards;
        }
        .order-confetti.c1 { top: 10%; left: 0%; background: #5260e6; --tx: -32px; --ty: -28px; --rot: -45deg; }
        .order-confetti.c2 { top: 5%; left: 50%; background: #d62976; --tx: 0px; --ty: -42px; --rot: 25deg; }
        .order-confetti.c3 { top: 10%; right: 0%; background: #f59e0b; --tx: 36px; --ty: -28px; --rot: 60deg; }
        .order-confetti.c4 { bottom: 10%; left: 0%; background: #22c55e; --tx: -34px; --ty: 26px; --rot: -25deg; }
        .order-confetti.c5 { bottom: 5%; left: 50%; background: #5260e6; --tx: 0px; --ty: 42px; --rot: 45deg; border-radius: 50%; }
        .order-confetti.c6 { bottom: 10%; right: 0%; background: #ec4899; --tx: 34px; --ty: 26px; --rot: 30deg; }

        .order-success-title {
          font-size: clamp(28px, 4vw, 36px);
          font-weight: 900;
          color: var(--ink);
          margin: 0 0 10px;
          letter-spacing: -0.02em;
        }
        .order-success-sub {
          color: var(--ink-2);
          font-size: 16px;
          line-height: 1.5;
          margin: 0 0 28px;
          max-width: 480px;
          margin-left: auto;
          margin-right: auto;
        }

        .order-id-badge {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 14px 28px;
          background: var(--paper-2, #f7f7fb);
          border: 1px dashed rgba(82, 96, 230, 0.35);
          border-radius: 14px;
          margin: 0 0 32px;
        }
        .order-id-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink-3);
        }
        .order-id-value {
          font-size: 24px;
          font-weight: 900;
          color: var(--primary);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.01em;
        }

        /* Timeline */
        .order-timeline {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 0;
          margin: 0 0 32px;
          padding: 0 8px;
        }
        .order-timeline-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 0 0 auto;
          width: 110px;
        }
        .order-timeline-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--paper-2, #eef0f4);
          border: 2px solid var(--line);
          display: grid;
          place-items: center;
          color: white;
          flex-shrink: 0;
          transition: all 0.3s;
        }
        .order-timeline-step.done .order-timeline-dot {
          background: #22c55e;
          border-color: #22c55e;
        }
        .order-timeline-step.active .order-timeline-dot {
          background: var(--primary);
          border-color: var(--primary);
        }
        .order-timeline-dot.pulsing {
          animation: order-dot-pulse 1.6s ease-in-out infinite;
        }
        .order-timeline-bar {
          flex: 1;
          height: 2px;
          background: var(--line);
          margin: 13px -10px 0;
          max-width: 60px;
          border-radius: 2px;
        }
        .order-timeline-bar.done {
          background: #22c55e;
        }
        .order-timeline-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--ink-3);
          text-align: center;
          line-height: 1.3;
        }
        .order-timeline-step.done .order-timeline-label,
        .order-timeline-step.active .order-timeline-label {
          color: var(--ink);
          font-weight: 700;
        }

        /* Actions */
        .order-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin: 0 0 24px;
        }
        .order-btn-primary {
          padding: 14px 24px !important;
          font-size: 15px !important;
          font-weight: 700 !important;
        }
        .order-btn-soft {
          display: inline-flex;
          align-items: center;
          padding: 14px 24px;
          background: white;
          color: var(--ink);
          border: 1px solid var(--line);
          border-radius: 14px;
          font-weight: 600;
          font-size: 15px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .order-btn-soft:hover {
          background: var(--paper-2, #f7f7fb);
          transform: translateY(-1px);
        }
        .order-myorders-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 600;
          color: var(--ink-2, #374151);
          text-decoration: none;
          background: var(--paper-2, #f7f7fb);
          border: 1px solid var(--line);
          border-radius: 999px;
          transition: color 0.18s ease, background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
        }
        .order-myorders-link svg {
          flex-shrink: 0;
        }
        .order-myorders-link:hover {
          color: var(--primary, #5260e6);
          background: white;
          border-color: rgba(82, 96, 230, 0.35);
          transform: translateY(-1px);
        }

        .order-reassurance {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--ink-3);
          padding-top: 18px;
          border-top: 1px solid var(--line);
          width: 100%;
          justify-content: center;
        }

        /* Next steps */
        .order-next {
          margin-top: 36px;
        }
        .order-next-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--ink);
          margin: 0 0 16px;
          text-align: center;
        }
        .order-next-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .order-next-card {
          background: white;
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 18px 16px;
          text-align: left;
          transition: all 0.2s;
        }
        .order-next-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -12px rgba(20, 22, 50, 0.12);
        }
        .order-next-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(82, 96, 230, 0.12);
          color: var(--primary);
          font-weight: 800;
          font-size: 13px;
          display: grid;
          place-items: center;
          margin-bottom: 10px;
        }
        .order-next-step-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--ink);
          margin: 0 0 6px;
          line-height: 1.3;
        }
        .order-next-step-body {
          font-size: 13px;
          color: var(--ink-3);
          margin: 0;
          line-height: 1.5;
        }

        /* Help footer */
        .order-help {
          margin-top: 28px;
          text-align: center;
          font-size: 13px;
          color: var(--ink-3);
          display: flex;
          gap: 6px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .order-help-link {
          color: var(--primary);
          text-decoration: underline;
          text-underline-offset: 3px;
          font-weight: 600;
        }

        /* Animations */
        @keyframes order-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes order-pop {
          0% { transform: scale(0); }
          80% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes order-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          70% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes order-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes order-confetti {
          0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.4); }
          15% { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--tx, 0), var(--ty, 0)) rotate(var(--rot, 0deg)) scale(1); }
        }
        @keyframes order-dot-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(82, 96, 230, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(82, 96, 230, 0); }
        }

        /* Mobile */
        @media (max-width: 640px) {
          .order-success-main {
            padding: 32px 16px 64px;
          }
          .order-card {
            padding: 36px 22px 28px;
            border-radius: 20px;
          }
          .order-next-grid {
            grid-template-columns: 1fr;
          }
          .order-timeline-step {
            width: 90px;
          }
          .order-timeline-bar {
            max-width: 30px;
          }
          .order-timeline-label {
            font-size: 11px;
          }
          .order-actions {
            flex-direction: column;
          }
          .order-btn-primary,
          .order-btn-soft {
            width: 100%;
            justify-content: center;
          }
          .order-id-value {
            font-size: 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .order-check-pulse,
          .order-check-circle,
          .order-check-path,
          .order-confetti,
          .order-timeline-dot.pulsing,
          .order-spinner-large {
            animation: none !important;
          }
          .order-check-path {
            stroke-dashoffset: 0;
          }
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
