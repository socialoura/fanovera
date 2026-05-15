"use client";

import Link from "next/link";
import { useI18n } from "./i18n/I18nProvider";
import type { SupportedLocale } from "./i18n/types";

type Copy = {
  badge: string;
  title: string;
  body: string;
  home: string;
  contact: string;
};

const COPY: Record<SupportedLocale, Copy> = {
  fr: {
    badge: "Erreur 404",
    title: "Cette page a disparu de notre fil.",
    body: "Le lien est peut-être obsolète ou la page a été déplacée. Retournez à l'accueil pour découvrir nos plateformes.",
    home: "Retour à l'accueil",
    contact: "Contacter le support",
  },
  en: {
    badge: "Error 404",
    title: "This page slipped out of our feed.",
    body: "The link may be outdated or the page has been moved. Head back home to browse our platforms.",
    home: "Back to home",
    contact: "Contact support",
  },
  es: {
    badge: "Error 404",
    title: "Esta página se ha esfumado de nuestro feed.",
    body: "El enlace puede estar caducado o la página se ha movido. Vuelve al inicio para descubrir nuestras plataformas.",
    home: "Volver al inicio",
    contact: "Contactar soporte",
  },
  pt: {
    badge: "Erro 404",
    title: "Esta página saiu do nosso feed.",
    body: "O link pode estar desatualizado ou a página foi movida. Volte ao início para explorar as nossas plataformas.",
    home: "Voltar ao início",
    contact: "Contactar o suporte",
  },
  de: {
    badge: "Fehler 404",
    title: "Diese Seite ist aus unserem Feed verschwunden.",
    body: "Der Link ist möglicherweise veraltet oder die Seite wurde verschoben. Zurück zur Startseite, um unsere Plattformen zu entdecken.",
    home: "Zur Startseite",
    contact: "Support kontaktieren",
  },
  it: {
    badge: "Errore 404",
    title: "Questa pagina è sparita dal nostro feed.",
    body: "Il link potrebbe essere obsoleto o la pagina è stata spostata. Torna alla home per scoprire le nostre piattaforme.",
    home: "Torna alla home",
    contact: "Contatta il supporto",
  },
  tr: {
    badge: "Hata 404",
    title: "Bu sayfa akışımızdan kayıp gitti.",
    body: "Bağlantı geçersiz olabilir veya sayfa taşınmış olabilir. Platformlarımızı keşfetmek için ana sayfaya dön.",
    home: "Ana sayfaya dön",
    contact: "Destekle iletişime geç",
  },
};

export default function NotFound() {
  const { locale } = useI18n();
  const c = COPY[locale] || COPY.fr;

  return (
    <main
      className="slide-in"
      style={{
        minHeight: "calc(100vh - 200px)",
        display: "grid",
        placeItems: "center",
        padding: "48px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          textAlign: "center",
          background: "white",
          border: "1px solid var(--line)",
          borderRadius: 24,
          padding: "48px 32px",
          boxShadow: "0 18px 48px -28px rgba(20, 22, 50, 0.18)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            background: "rgba(82,96,230,0.08)",
            border: "1px solid rgba(82,96,230,0.18)",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--primary)",
            marginBottom: 22,
          }}
        >
          {c.badge}
        </span>
        <h1
          className="display"
          style={{
            fontSize: "clamp(28px, 4vw, 40px)",
            margin: "0 0 14px",
            lineHeight: 1.15,
          }}
        >
          {c.title}
        </h1>
        <p
          style={{
            margin: "0 auto 28px",
            fontSize: 16,
            lineHeight: 1.55,
            color: "var(--ink-2)",
            maxWidth: 440,
          }}
        >
          {c.body}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/"
            className="btn-primary"
            style={{ padding: "12px 22px", fontSize: 15, fontWeight: 700 }}
          >
            {c.home}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M3 7h8M7 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            href="/contact"
            className="btn-soft"
            style={{ padding: "12px 22px", fontSize: 15, fontWeight: 700 }}
          >
            {c.contact}
          </Link>
        </div>
      </div>
    </main>
  );
}
