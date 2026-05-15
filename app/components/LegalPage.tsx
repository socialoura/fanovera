import Header from "./Header";
import Footer from "./Footer";
import { getRequestLocale } from "../lib/metadata";
import { getLegalPageCopy, isLegalLocaleNative } from "../lib/legalContent";
import { localizedPath, type LegalRouteId } from "../lib/siteMetadata";

// Notice shown when the legal copy is not yet professionally translated for
// the visitor's locale. We fall back to English in that case (see legalContent.ts).
const FALLBACK_NOTICE: Record<string, string> = {
  es: "Esta página legal solo está disponible en inglés por el momento. La traducción profesional al español estará pronto disponible.",
  pt: "Esta página legal está disponível apenas em inglês de momento. A tradução profissional em português estará brevemente disponível.",
  de: "Diese rechtliche Seite ist derzeit nur auf Englisch verfügbar. Die professionelle deutsche Übersetzung folgt in Kürze.",
  it: "Questa pagina legale è attualmente disponibile solo in inglese. La traduzione italiana professionale arriverà presto.",
  tr: "Bu yasal sayfa şu anda yalnızca İngilizce olarak mevcuttur. Profesyonel Türkçe çeviri yakında eklenecektir.",
};

type LegalNavLabel = Record<"fr" | "en" | "es" | "pt" | "de" | "it" | "tr", string>;

const legalNav: Array<{ id: LegalRouteId; label: LegalNavLabel }> = [
  {
    id: "legalNotice",
    label: {
      fr: "Mentions légales", en: "Legal notice", es: "Aviso legal",
      pt: "Aviso legal", de: "Impressum", it: "Note legali", tr: "Yasal uyarı",
    },
  },
  {
    id: "terms",
    label: {
      fr: "CGV", en: "Terms", es: "Condiciones",
      pt: "Termos", de: "AGB", it: "Condizioni", tr: "Şartlar",
    },
  },
  {
    id: "privacy",
    label: {
      fr: "Confidentialité", en: "Privacy", es: "Privacidad",
      pt: "Privacidade", de: "Datenschutz", it: "Privacy", tr: "Gizlilik",
    },
  },
  {
    id: "cookies",
    label: {
      fr: "Cookies", en: "Cookies", es: "Cookies",
      pt: "Cookies", de: "Cookies", it: "Cookie", tr: "Çerezler",
    },
  },
  {
    id: "refund",
    label: {
      fr: "Remboursements", en: "Refunds", es: "Reembolsos",
      pt: "Reembolsos", de: "Erstattungen", it: "Rimborsi", tr: "İadeler",
    },
  },
];

export default async function LegalPage({ pageId }: { pageId: LegalRouteId }) {
  const locale = await getRequestLocale();
  const copy = getLegalPageCopy(pageId, locale);
  const navLabel =
    {
      fr: "Pages légales",
      en: "Legal pages",
      es: "Páginas legales",
      pt: "Páginas legais",
      de: "Rechtsseiten",
      it: "Pagine legali",
      tr: "Yasal sayfalar",
    }[locale] || "Legal pages";

  return (
    <div>
      <div className="paper-frame">
        <Header />
        <main className="container" style={{ padding: "44px 0 64px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 0.74fr) minmax(240px, 0.26fr)",
              gap: 32,
              alignItems: "start",
            }}
            className="legal-layout"
          >
            <article>
              <p
                style={{
                  margin: "0 0 12px",
                  color: "var(--primary)",
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {copy.eyebrow}
              </p>
              <h1 className="display" style={{ fontSize: "clamp(34px, 5vw, 62px)", margin: "0 0 18px" }}>
                {copy.title}
              </h1>
              <p style={{ margin: "0 0 10px", maxWidth: 760, color: "var(--ink-2)", fontSize: 17, lineHeight: 1.65 }}>
                {copy.intro}
              </p>
              <p style={{ margin: "0 0 34px", color: "var(--ink-3)", fontSize: 13 }}>{copy.updatedAt}</p>

              {!isLegalLocaleNative(locale) && FALLBACK_NOTICE[locale] && (
                <p
                  role="note"
                  style={{
                    margin: "0 0 28px",
                    padding: "12px 14px",
                    background: "rgba(82,96,230,0.06)",
                    border: "1px solid rgba(82,96,230,0.18)",
                    borderRadius: 12,
                    fontSize: 13,
                    color: "var(--ink-2)",
                    lineHeight: 1.55,
                  }}
                >
                  {FALLBACK_NOTICE[locale]}
                </p>
              )}

              <div style={{ display: "grid", gap: 18 }}>
                {copy.sections.map((section) => (
                  <section
                    key={section.title}
                    style={{
                      background: "white",
                      border: "1px solid var(--line)",
                      borderRadius: 18,
                      padding: 24,
                      boxShadow: "0 16px 38px -28px rgba(29,29,44,0.22)",
                    }}
                  >
                    <h2 style={{ margin: "0 0 12px", fontSize: 20, lineHeight: 1.25 }}>{section.title}</h2>
                    {section.body.map((paragraph) => (
                      <p key={paragraph} style={{ margin: "10px 0 0", color: "var(--ink-2)", fontSize: 14, lineHeight: 1.7 }}>
                        {paragraph}
                      </p>
                    ))}
                  </section>
                ))}
              </div>
            </article>

            <aside
              style={{
                position: "sticky",
                top: 24,
                background: "rgba(255,255,255,0.82)",
                border: "1px solid var(--line)",
                borderRadius: 18,
                padding: 16,
                boxShadow: "0 18px 40px -30px rgba(29,29,44,0.22)",
              }}
            >
              <div
                style={{
                  marginBottom: 12,
                  color: "var(--ink-3)",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {navLabel}
              </div>
              <nav style={{ display: "grid", gap: 6 }} aria-label={navLabel}>
                {legalNav.map((item) => {
                  const active = item.id === pageId;
                  return (
                    <a
                      key={item.id}
                      href={localizedPath(locale, item.id)}
                      aria-current={active ? "page" : undefined}
                      style={{
                        display: "block",
                        padding: "10px 12px",
                        borderRadius: 12,
                        color: active ? "white" : "var(--ink-2)",
                        background: active ? "var(--primary)" : "transparent",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {item.label[locale] || item.label.en}
                    </a>
                  );
                })}
              </nav>
            </aside>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
