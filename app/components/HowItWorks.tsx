"use client";

import { useSearchParams } from "next/navigation";
import { useI18n } from "../i18n/I18nProvider";
import { useMarketingMode } from "../marketing/MarketingModeProvider";
import { getPublicCopy } from "./publicCopy";
import { detectTargetNetworkFromParams } from "../lib/detectTargetNetwork";

type StepKind = "analyze" | "target" | "growth";

/**
 * Whitehat copy variant for the "How it works" steps, shown only on /promo
 * when `?utm_term={network}` matches. Stays compliant: no SMM product
 * nouns ("followers/likes/views/streams"), no quantities, no pricing —
 * only the operational flow from picking an offer to delivery.
 */
function getTargetedSteps(locale: string): { title: string; body: string }[] | null {
  const lower = (locale || "").toLowerCase().split("-")[0];
  const copy: Record<string, { title: string; body: string }[]> = {
    fr: [
      { title: "Vous choisissez votre offre", body: "Sélectionnez le format adapté à votre objectif. Aucun engagement, paiement à l'unité." },
      { title: "Vous donnez votre @", body: "Juste votre nom d'utilisateur public. Aucun mot de passe, aucun accès au compte." },
      { title: "Démarrage sous 1 à 6h", body: "Activation immédiate après paiement. Livraison progressive pour un effet naturel." },
    ],
    en: [
      { title: "Pick your offer", body: "Choose the format that fits your goal. No commitment, pay per order." },
      { title: "Give us your @", body: "Just your public username. No password, no account access." },
      { title: "Starts in 1 to 6 hours", body: "Immediate activation after payment. Progressive delivery for a natural effect." },
    ],
    es: [
      { title: "Eliges tu oferta", body: "Selecciona el formato que se ajusta a tu objetivo. Sin compromiso, pago por pedido." },
      { title: "Nos das tu @", body: "Solo tu nombre de usuario público. Sin contraseña, sin acceso a la cuenta." },
      { title: "Inicio en 1 a 6 horas", body: "Activación inmediata tras el pago. Entrega progresiva para un efecto natural." },
    ],
    pt: [
      { title: "Você escolhe sua oferta", body: "Selecione o formato adequado ao seu objetivo. Sem compromisso, pagamento por pedido." },
      { title: "Você nos dá seu @", body: "Apenas seu nome de usuário público. Sem senha, sem acesso à conta." },
      { title: "Início em 1 a 6 horas", body: "Ativação imediata após o pagamento. Entrega progressiva para um efeito natural." },
    ],
    de: [
      { title: "Du wählst dein Angebot", body: "Wähle das passende Format für dein Ziel. Keine Verpflichtung, Zahlung pro Bestellung." },
      { title: "Du gibst uns dein @", body: "Nur dein öffentlicher Benutzername. Kein Passwort, kein Konto-Zugriff." },
      { title: "Start in 1 bis 6 Stunden", body: "Sofortige Aktivierung nach der Zahlung. Schrittweise Lieferung für einen natürlichen Effekt." },
    ],
    it: [
      { title: "Scegli la tua offerta", body: "Seleziona il formato adatto al tuo obiettivo. Nessun impegno, paghi a ordine." },
      { title: "Ci dai il tuo @", body: "Solo il tuo nome utente pubblico. Nessuna password, nessun accesso all'account." },
      { title: "Avvio in 1-6 ore", body: "Attivazione immediata dopo il pagamento. Consegna progressiva per un effetto naturale." },
    ],
    tr: [
      { title: "Teklifini seç", body: "Hedefine uygun formatı seç. Taahhüt yok, sipariş başına ödeme." },
      { title: "@ kullanıcı adını ver", body: "Sadece herkese açık kullanıcı adın. Şifre yok, hesap erişimi yok." },
      { title: "1-6 saat içinde başlar", body: "Ödemeden hemen sonra aktivasyon. Doğal etki için kademeli teslimat." },
    ],
  };
  return copy[lower] || null;
}

function StepIcon({ kind }: { kind: StepKind }) {
  switch (kind) {
    case "analyze":
      return (
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="6" />
          <path d="M16 16l5 5" />
          <path d="M8 11h6M11 8v6" />
        </svg>
      );
    case "target":
      return (
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="14" cy="14" r="9" />
          <circle cx="14" cy="14" r="5" />
          <circle cx="14" cy="14" r="1.5" fill="white" />
        </svg>
      );
    case "growth":
      return (
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 22l6-6 4 4 8-10" />
          <path d="M16 10h6v6" />
        </svg>
      );
  }
}

export default function HowItWorks() {
  const { locale } = useI18n();
  const { mode, surfaceMode } = useMarketingMode();
  const searchParams = useSearchParams();
  const copy = getPublicCopy(locale, mode, surfaceMode).how;

  // On /promo with utm_term matching a network, swap the editorial/audit
  // steps for the operational flow ("pick → @ → delivery"). Other surfaces
  // (home, platform pages) keep the original copy from publicCopy.ts.
  const isPromo = mode === "promo";
  const targetedNetwork = isPromo ? detectTargetNetworkFromParams(searchParams) : null;
  const targetedSteps = targetedNetwork ? getTargetedSteps(locale) : null;
  const effectiveSteps = targetedSteps || copy.steps;

  const steps: { num: string; title: string; body: string; icon: StepKind; color: string }[] = [
    {
      num: "01",
      title: effectiveSteps[0].title,
      body: effectiveSteps[0].body,
      icon: "analyze",
      color: "var(--primary)",
    },
    {
      num: "02",
      title: effectiveSteps[1].title,
      body: effectiveSteps[1].body,
      icon: "target",
      color: "var(--orange)",
    },
    {
      num: "03",
      title: effectiveSteps[2].title,
      body: effectiveSteps[2].body,
      icon: "growth",
      color: "var(--green)",
    },
  ];
  return (
    <section id="how" className="section">
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "var(--primary-soft)",
              color: "var(--primary)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              borderRadius: 999,
              marginBottom: 20,
              textTransform: "uppercase",
            }}
          >
            {copy.eyebrow}
          </div>
          <h2 className="display" style={{ fontSize: "clamp(36px, 4.6vw, 60px)", margin: 0 }}>
            {copy.titleBefore}<span className="squiggle">{copy.titleHighlight}</span>{copy.titleAfter}
          </h2>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}
          className="feat-grid"
        >
          {steps.map((s, i) => (
            <div key={i} className="step-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: s.color,
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <StepIcon kind={s.icon} />
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-caveat), Caveat, cursive",
                    fontSize: 26,
                    fontWeight: 600,
                    color: s.color,
                    opacity: 0.5,
                  }}
                >
                  {s.num}
                </div>
              </div>
              <h3
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  margin: "0 0 8px",
                  letterSpacing: "-0.01em",
                }}
              >
                {s.title}
              </h3>
              <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
