"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useI18n } from "../i18n/I18nProvider";

type ContactCopy = {
  badge: string;
  title: string;
  titleFocus: string;
  titleAfter: string;
  intro: string;
  formTitle: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  subjectLabel: string;
  subjects: { value: string; label: string }[];
  messageLabel: string;
  messagePlaceholder: string;
  submit: string;
  sending: string;
  sentTitle: string;
  sentBody: string;
  sentAction: string;
  errorTitle: string;
  invalidName: string;
  invalidEmail: string;
  invalidMessage: string;
  unexpected: string;
  consent: string;
  infoTitle: string;
  emailDirectLabel: string;
  emailDirectValue: string;
  delayLabel: string;
  delayValue: string;
  hoursLabel: string;
  hoursValue: string;
  addressLabel: string;
  addressValue: string;
  shortcutsTitle: string;
  shortcuts: { title: string; body: string; href: string; cta: string }[];
};

const COPY: Record<"fr" | "en", ContactCopy> = {
  fr: {
    badge: "Contact",
    title: "On vous répond",
    titleFocus: "vite",
    titleAfter: ".",
    intro:
      "Une question avant achat, un suivi de commande, un partenariat ou un sujet sensible — notre équipe vous répond en moins de 24 h en semaine.",
    formTitle: "Envoyez-nous un message",
    nameLabel: "Votre nom",
    namePlaceholder: "Jean Dupont",
    emailLabel: "Votre e-mail",
    emailPlaceholder: "vous@exemple.com",
    subjectLabel: "Sujet",
    subjects: [
      { value: "order", label: "Suivi de commande" },
      { value: "refund", label: "Remboursement" },
      { value: "presale", label: "Question avant achat" },
      { value: "partnership", label: "Partenariat & presse" },
      { value: "other", label: "Autre" },
    ],
    messageLabel: "Votre message",
    messagePlaceholder:
      "Décrivez votre demande. Si c'est lié à une commande, indiquez le numéro et l'e-mail utilisé au paiement.",
    submit: "Envoyer le message",
    sending: "Envoi en cours…",
    sentTitle: "Message envoyé !",
    sentBody:
      "On a bien reçu votre demande. Vous allez recevoir une réponse à l'adresse indiquée, généralement en moins de 24 h.",
    sentAction: "Envoyer un autre message",
    errorTitle: "Impossible d'envoyer le message",
    invalidName: "Indiquez votre nom (au moins 2 caractères).",
    invalidEmail: "Veuillez entrer un e-mail valide.",
    invalidMessage: "Votre message doit contenir au moins 10 caractères.",
    unexpected: "Une erreur est survenue. Réessayez dans quelques instants.",
    consent:
      "En envoyant ce message, vous acceptez d'être recontacté par e-mail dans le seul cadre de votre demande.",
    infoTitle: "Autres moyens",
    emailDirectLabel: "E-mail direct",
    emailDirectValue: "support@fanovera.com",
    delayLabel: "Délai de réponse",
    delayValue: "Moins de 24 h en semaine",
    hoursLabel: "Horaires",
    hoursValue: "Lundi - vendredi · 9 h - 18 h (Paris)",
    addressLabel: "Adresse",
    addressValue: "Fanovera SAS · 17 rue de Paradis · 75010 Paris",
    shortcutsTitle: "Avant de nous écrire",
    shortcuts: [
      {
        title: "Suivre une commande",
        body: "Retrouvez vos commandes et leur progression en temps réel avec votre e-mail.",
        href: "/track",
        cta: "Aller au suivi",
      },
      {
        title: "Conditions de remboursement",
        body: "Délais de livraison, incidents et règles de remboursement détaillés.",
        href: "/remboursement",
        cta: "Voir les règles",
      },
      {
        title: "Confidentialité & RGPD",
        body: "Données collectées, finalités, conservation et exercice de vos droits.",
        href: "/confidentialite",
        cta: "Voir la politique",
      },
    ],
  },
  en: {
    badge: "Contact",
    title: "We reply",
    titleFocus: "fast",
    titleAfter: ".",
    intro:
      "Pre-sale question, order tracking, partnership or anything sensitive — our team replies in under 24 h on business days.",
    formTitle: "Send us a message",
    nameLabel: "Your name",
    namePlaceholder: "John Doe",
    emailLabel: "Your e-mail",
    emailPlaceholder: "you@example.com",
    subjectLabel: "Subject",
    subjects: [
      { value: "order", label: "Order tracking" },
      { value: "refund", label: "Refund" },
      { value: "presale", label: "Pre-sale question" },
      { value: "partnership", label: "Partnership & press" },
      { value: "other", label: "Other" },
    ],
    messageLabel: "Your message",
    messagePlaceholder:
      "Describe your request. If it's about an order, include the order number and the e-mail used at checkout.",
    submit: "Send the message",
    sending: "Sending…",
    sentTitle: "Message sent!",
    sentBody:
      "We've received your request. You'll get a reply at the e-mail you provided, usually in under 24 h.",
    sentAction: "Send another message",
    errorTitle: "Couldn't send the message",
    invalidName: "Please enter your name (at least 2 characters).",
    invalidEmail: "Please enter a valid e-mail.",
    invalidMessage: "Your message should be at least 10 characters long.",
    unexpected: "Something went wrong. Please try again shortly.",
    consent:
      "By sending this message, you agree to be contacted by e-mail for the purpose of your request only.",
    infoTitle: "Other ways",
    emailDirectLabel: "Direct e-mail",
    emailDirectValue: "support@fanovera.com",
    delayLabel: "Reply time",
    delayValue: "Under 24 h on business days",
    hoursLabel: "Hours",
    hoursValue: "Monday - Friday · 9 a.m. - 6 p.m. (Paris)",
    addressLabel: "Address",
    addressValue: "Fanovera SAS · 17 rue de Paradis · 75010 Paris",
    shortcutsTitle: "Before writing to us",
    shortcuts: [
      {
        title: "Track an order",
        body: "Find your orders and their progress in real time with your e-mail.",
        href: "/track",
        cta: "Go to tracking",
      },
      {
        title: "Refund rules",
        body: "Delivery timelines, incident handling and refund policy in detail.",
        href: "/refund",
        cta: "Read the rules",
      },
      {
        title: "Privacy & GDPR",
        body: "Data collected, purposes, retention and how to exercise your rights.",
        href: "/privacy",
        cta: "Read the policy",
      },
    ],
  },
};

export default function ContactClient() {
  const { locale } = useI18n();
  const copy = COPY[locale === "en" ? "en" : "fr"];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(copy.subjects[0].value);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, message: false });

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const nameValid = name.trim().length >= 2;
  const messageValid = message.trim().length >= 10;
  const subjectLabel = useMemo(() => copy.subjects.find((s) => s.value === subject)?.label || subject, [copy.subjects, subject]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ name: true, email: true, message: true });
    setError(null);

    if (!nameValid) return setError(copy.invalidName);
    if (!emailValid) return setError(copy.invalidEmail);
    if (!messageValid) return setError(copy.invalidMessage);

    setSubmitting(true);
    try {
      const composed = `[${subjectLabel}] ${name.trim()}\n\n${message.trim()}`;
      const res = await fetch("/api/chat-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), message: composed }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || copy.unexpected);
      setSent(true);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.unexpected);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="slide-in" style={{ padding: "32px 0 64px", position: "relative" }}>
      <div className="container" style={{ maxWidth: 1080, position: "relative", zIndex: 1 }}>
        {/* Hero */}
        <header style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 28px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "white",
              border: "1px solid var(--line)",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              marginBottom: 18,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 8l9 6 9-6M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"
                stroke="var(--primary)"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {copy.badge}
          </span>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 48px)", margin: "0 0 14px", lineHeight: 1.1 }}>
            {copy.title} <span className="squiggle">{copy.titleFocus}</span>
            {copy.titleAfter}
          </h1>
          <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55, margin: 0 }}>{copy.intro}</p>
        </header>

        <div className="contact-grid">
          {/* Form */}
          <section
            style={{
              background: "white",
              border: "1px solid var(--line)",
              borderRadius: 24,
              padding: "28px",
              boxShadow: "0 14px 40px -20px rgba(15, 23, 42, 0.18)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 18 }}>
              {copy.formTitle}
            </div>

            {sent ? (
              <div role="status" aria-live="polite" style={{ textAlign: "center", padding: "24px 12px" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "rgba(77,191,138,0.14)",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 16px",
                  }}
                  aria-hidden
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12l4 4 10-10"
                      stroke="var(--green)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{copy.sentTitle}</div>
                <p style={{ margin: "0 auto 20px", fontSize: 14, color: "var(--ink-2)", maxWidth: 380, lineHeight: 1.55 }}>
                  {copy.sentBody}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setError(null);
                  }}
                  className="btn-soft"
                  style={{ padding: "10px 18px" }}
                >
                  {copy.sentAction}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate style={{ display: "grid", gap: 16 }}>
                <Field label={copy.nameLabel} invalid={touched.name && !nameValid} error={touched.name && !nameValid ? copy.invalidName : null}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    placeholder={copy.namePlaceholder}
                    autoComplete="name"
                    spellCheck={false}
                  />
                </Field>

                <Field label={copy.emailLabel} invalid={touched.email && !emailValid} error={touched.email && !emailValid ? copy.invalidEmail : null}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    placeholder={copy.emailPlaceholder}
                    autoComplete="email"
                    spellCheck={false}
                    autoCapitalize="none"
                    inputMode="email"
                  />
                </Field>

                <Field label={copy.subjectLabel}>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{ width: "100%", border: 0, outline: 0, padding: "12px 4px", fontSize: 15, fontWeight: 500, background: "transparent" }}
                  >
                    {copy.subjects.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label={copy.messageLabel} invalid={touched.message && !messageValid} error={touched.message && !messageValid ? copy.invalidMessage : null}>
                  <textarea
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, message: true }))}
                    placeholder={copy.messagePlaceholder}
                    style={{
                      width: "100%",
                      border: 0,
                      outline: 0,
                      padding: "12px 4px",
                      fontSize: 15,
                      fontFamily: "inherit",
                      lineHeight: 1.5,
                      resize: "vertical",
                      minHeight: 120,
                      background: "transparent",
                    }}
                  />
                </Field>

                {error && (
                  <div
                    role="alert"
                    style={{
                      padding: "10px 14px",
                      background: "rgba(180,35,24,0.08)",
                      border: "1px solid rgba(180,35,24,0.20)",
                      borderRadius: 12,
                      fontSize: 13,
                      color: "#b42318",
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ minHeight: 52, padding: "0 26px", justifyContent: "center" }}
                  aria-busy={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner" aria-hidden />
                      {copy.sending}
                    </>
                  ) : (
                    <>
                      {copy.submit}
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                        <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>

                <p style={{ margin: 0, fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>{copy.consent}</p>
              </form>
            )}
          </section>

          {/* Info side panel */}
          <aside style={{ display: "grid", gap: 16, alignContent: "start" }}>
            <div
              style={{
                background: "linear-gradient(135deg, rgba(82,96,230,0.06), rgba(214,41,118,0.06))",
                border: "1px solid var(--line)",
                borderRadius: 20,
                padding: 22,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>
                {copy.infoTitle}
              </div>
              <InfoRow
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 8l9 6 9-6M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
                label={copy.emailDirectLabel}
              >
                <a href={`mailto:${copy.emailDirectValue}`} style={{ color: "var(--ink)", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>
                  {copy.emailDirectValue}
                </a>
              </InfoRow>
              <InfoRow
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="var(--primary)" strokeWidth="1.7" />
                    <path d="M12 7v5l3 2" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                }
                label={copy.delayLabel}
              >
                <span style={{ fontWeight: 600 }}>{copy.delayValue}</span>
              </InfoRow>
              <InfoRow
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="16" rx="2" stroke="var(--primary)" strokeWidth="1.7" />
                    <path d="M3 9h18M8 3v4M16 3v4" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                }
                label={copy.hoursLabel}
              >
                <span style={{ fontWeight: 600 }}>{copy.hoursValue}</span>
              </InfoRow>
              <InfoRow
                last
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" stroke="var(--primary)" strokeWidth="1.7" strokeLinejoin="round" />
                    <circle cx="12" cy="9" r="2.5" stroke="var(--primary)" strokeWidth="1.7" />
                  </svg>
                }
                label={copy.addressLabel}
              >
                <span style={{ fontWeight: 600 }}>{copy.addressValue}</span>
              </InfoRow>
            </div>
          </aside>
        </div>

        {/* Shortcuts */}
        <section style={{ marginTop: 36 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>
            {copy.shortcutsTitle}
          </div>
          <div className="contact-shortcuts">
            {copy.shortcuts.map((sc) => (
              <Link
                key={sc.href}
                href={sc.href}
                className="shortcut-card"
                style={{
                  display: "grid",
                  gap: 10,
                  padding: 20,
                  background: "white",
                  border: "1px solid var(--line)",
                  borderRadius: 18,
                  textDecoration: "none",
                  color: "var(--ink)",
                  transition: "border-color .2s, transform .2s, box-shadow .2s",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 16 }}>{sc.title}</div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>{sc.body}</p>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--primary)", marginTop: 2 }}>
                  {sc.cta}
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .contact-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 24px;
          align-items: start;
        }
        .contact-shortcuts {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        .shortcut-card:hover {
          border-color: var(--primary) !important;
          transform: translateY(-2px);
          box-shadow: 0 18px 40px -22px rgba(82, 96, 230, 0.35);
        }
        @media (max-width: 880px) {
          .contact-grid {
            grid-template-columns: 1fr;
          }
          .contact-shortcuts {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
  invalid,
  error,
}: {
  label: string;
  children: React.ReactNode;
  invalid?: boolean;
  error?: string | null;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          marginBottom: 8,
        }}
      >
        {label}
      </label>
      <div
        className="input-shell"
        style={{
          paddingLeft: 14,
          paddingRight: 14,
          borderColor: invalid ? "rgba(180,35,24,0.45)" : undefined,
        }}
      >
        {children}
      </div>
      {error && <div style={{ marginTop: 6, fontSize: 12, color: "#b42318" }}>{error}</div>}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "12px 0",
        borderBottom: last ? "none" : "1px dashed var(--line)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "white",
          border: "1px solid var(--line)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
        aria-hidden
      >
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>{children}</div>
      </div>
    </div>
  );
}
