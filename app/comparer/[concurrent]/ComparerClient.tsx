"use client";

import Link from "next/link";
import { FANOVERA_SCORES, FANOVERA_TAGLINE, type ComparerEntry } from "../../lib/comparerData";

type Props = {
  competitor: ComparerEntry;
  otherCompetitors: { slug: string; name: string }[];
  lang: "fr" | "en";
};

const COPY = {
  fr: {
    eyebrow: "Comparatif honnête",
    versus: "vs",
    tldr: "En résumé",
    detailedComparison: "Comparaison détaillée",
    fanovera: "Fanovera",
    criteria: "Critère",
    fanoveraColumn: "Fanovera",
    competitorColumn: "Concurrent",
    fanoveraWins: "Pourquoi Fanovera est mieux",
    competitorWins: "Là où le concurrent garde l'avantage",
    verdict: "Verdict",
    cta: "Démarrer avec Fanovera",
    ctaSub: "Sans mot de passe · Paiement sécurisé · Démarrage 1-6 h",
    foundedIn: "Créé en",
    sourceLabel: "Site officiel",
    seeOthers: "Comparer avec d'autres services",
    breadcrumbHome: "Accueil",
    breadcrumbList: "Comparatifs",
    rowPricing: "Tarif",
    rowSpeed: "Délai de livraison",
    rowQuality: "Qualité des comptes",
    rowTrust: "Confiance et signaux publics",
    rowPayments: "Expérience de paiement",
    rowSupport: "Support client",
    rowUiClarity: "Clarté de l'interface",
    rowRefunds: "Politique de remboursement",
    scoreSuffix: "/ 5",
  },
  en: {
    eyebrow: "Honest comparison",
    versus: "vs",
    tldr: "TL;DR",
    detailedComparison: "Detailed comparison",
    fanovera: "Fanovera",
    criteria: "Criterion",
    fanoveraColumn: "Fanovera",
    competitorColumn: "Competitor",
    fanoveraWins: "Why Fanovera is better",
    competitorWins: "Where the competitor still wins",
    verdict: "Verdict",
    cta: "Start with Fanovera",
    ctaSub: "No password · Secure payment · Starts in 1-6 h",
    foundedIn: "Founded in",
    sourceLabel: "Official website",
    seeOthers: "Compare with other services",
    breadcrumbHome: "Home",
    breadcrumbList: "Comparisons",
    rowPricing: "Pricing",
    rowSpeed: "Delivery speed",
    rowQuality: "Account quality",
    rowTrust: "Public trust signals",
    rowPayments: "Payment experience",
    rowSupport: "Customer support",
    rowUiClarity: "Interface clarity",
    rowRefunds: "Refund policy",
    scoreSuffix: "/ 5",
  },
} as const;

const SCORE_ROWS: { key: keyof typeof FANOVERA_SCORES; labelKey: keyof typeof COPY.fr }[] = [
  { key: "pricing", labelKey: "rowPricing" },
  { key: "speed", labelKey: "rowSpeed" },
  { key: "quality", labelKey: "rowQuality" },
  { key: "trust", labelKey: "rowTrust" },
  { key: "payments", labelKey: "rowPayments" },
  { key: "support", labelKey: "rowSupport" },
  { key: "uiClarity", labelKey: "rowUiClarity" },
  { key: "refunds", labelKey: "rowRefunds" },
];

function ScoreBar({ value, isFanovera }: { value: number; isFanovera: boolean }) {
  const pct = Math.max(0, Math.min(5, value)) * 20;
  return (
    <div className="comp-score">
      <div className="comp-score-track">
        <div
          className="comp-score-fill"
          style={{
            width: `${pct}%`,
            background: isFanovera
              ? "linear-gradient(90deg, #5260e6, #22c55e)"
              : "rgba(20, 22, 50, 0.35)",
          }}
        />
      </div>
      <div className="comp-score-num">{value}</div>
    </div>
  );
}

export default function ComparerClient({ competitor, otherCompetitors, lang }: Props) {
  const t = COPY[lang];

  return (
    <main className="comp-main">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="comp-breadcrumb">
        <Link href="/">{t.breadcrumbHome}</Link>
        <span>›</span>
        <span>{t.breadcrumbList}</span>
        <span>›</span>
        <span className="comp-breadcrumb-current">{competitor.name}</span>
      </nav>

      {/* Hero */}
      <header className="comp-hero">
        <div className="comp-eyebrow">{t.eyebrow}</div>
        <h1 className="comp-title">
          <span className="comp-title-fanovera">Fanovera</span>
          <span className="comp-vs">{t.versus}</span>
          <span className="comp-title-competitor">{competitor.name}</span>
        </h1>
        <p className="comp-tagline">{competitor.tagline[lang]}</p>
        {competitor.foundedYear && (
          <div className="comp-meta">
            {t.foundedIn} {competitor.foundedYear}
            {competitor.website ? <span className="comp-meta-dot"> · </span> : null}
            {competitor.website ? (
              <span className="comp-meta-site">
                {t.sourceLabel}: {competitor.website}
              </span>
            ) : null}
          </div>
        )}
      </header>

      {/* TL;DR with the two descriptions side by side */}
      <section className="comp-section comp-tldr">
        <h2 className="comp-section-title">{t.tldr}</h2>
        <div className="comp-tldr-grid">
          <article className="comp-tldr-card comp-tldr-card-fanovera">
            <header>
              <span className="comp-tldr-badge">{t.fanovera}</span>
            </header>
            <p>{FANOVERA_TAGLINE[lang]}</p>
          </article>
          <article className="comp-tldr-card">
            <header>
              <span className="comp-tldr-badge comp-tldr-badge-other">{competitor.name}</span>
            </header>
            <p>{competitor.description[lang]}</p>
          </article>
        </div>
      </section>

      {/* Detailed scoring table */}
      <section className="comp-section">
        <h2 className="comp-section-title">{t.detailedComparison}</h2>
        <div className="comp-table-wrap">
          <table className="comp-table">
            <thead>
              <tr>
                <th>{t.criteria}</th>
                <th className="comp-th-fanovera">{t.fanoveraColumn}</th>
                <th>{competitor.name}</th>
              </tr>
            </thead>
            <tbody>
              {SCORE_ROWS.map((row) => {
                const fScore = FANOVERA_SCORES[row.key];
                const cScore = competitor.scores[row.key];
                const fWins = fScore > cScore;
                const cWins = cScore > fScore;
                return (
                  <tr key={row.key}>
                    <td className="comp-td-criterion">{t[row.labelKey]}</td>
                    <td className={`comp-td-score${fWins ? " comp-td-winner" : ""}`}>
                      <ScoreBar value={fScore} isFanovera />
                    </td>
                    <td className={`comp-td-score${cWins ? " comp-td-winner" : ""}`}>
                      <ScoreBar value={cScore} isFanovera={false} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Why Fanovera */}
      <section className="comp-section">
        <h2 className="comp-section-title comp-section-title-positive">{t.fanoveraWins}</h2>
        <ul className="comp-bullets comp-bullets-positive">
          {competitor.fanoveraWins[lang].map((item, i) => (
            <li key={i}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="1.6" />
                <path d="M8 12.5l2.5 2.5L16 9" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* What competitor does better — credibility honesty marker */}
      <section className="comp-section">
        <h2 className="comp-section-title">{t.competitorWins}</h2>
        <ul className="comp-bullets comp-bullets-neutral">
          {competitor.competitorWins[lang].map((item, i) => (
            <li key={i}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="var(--ink-3)" strokeWidth="1.6" />
                <path d="M8 12h8" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Verdict */}
      <section className="comp-section comp-verdict">
        <h2 className="comp-section-title">{t.verdict}</h2>
        <blockquote>{competitor.verdict[lang]}</blockquote>
      </section>

      {/* CTA */}
      <section className="comp-section comp-cta-section">
        <Link href="/" className="comp-cta">
          {t.cta}
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="comp-cta-sub">{t.ctaSub}</div>
      </section>

      {/* Cross-link to other comparisons (internal SEO juice) */}
      {otherCompetitors.length > 0 && (
        <section className="comp-section comp-others">
          <h2 className="comp-section-title">{t.seeOthers}</h2>
          <div className="comp-others-grid">
            {otherCompetitors.map((c) => (
              <Link key={c.slug} href={`/comparer/${c.slug}`} className="comp-other-pill">
                Fanovera <span style={{ color: "var(--ink-3)" }}>vs</span> <strong>{c.name}</strong>
              </Link>
            ))}
          </div>
        </section>
      )}

      <style jsx>{`
        .comp-main {
          max-width: 920px;
          margin: 24px auto 64px;
          padding: 0 20px;
        }
        .comp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--ink-3);
          margin-bottom: 28px;
        }
        .comp-breadcrumb a {
          color: var(--ink-3);
          text-decoration: none;
          transition: color 0.18s ease;
        }
        .comp-breadcrumb a:hover { color: var(--ink); }
        .comp-breadcrumb-current { color: var(--ink); font-weight: 600; }

        .comp-hero {
          text-align: center;
          padding: 28px 16px 32px;
          margin-bottom: 32px;
          background: linear-gradient(135deg, rgba(82, 96, 230, 0.05), rgba(34, 197, 94, 0.04));
          border: 1px solid var(--line);
          border-radius: 20px;
        }
        .comp-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #5260e6;
          margin-bottom: 14px;
        }
        .comp-title {
          font-size: clamp(28px, 5vw, 42px);
          font-weight: 900;
          letter-spacing: -0.02em;
          margin: 0 0 14px;
          display: inline-flex;
          align-items: baseline;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .comp-title-fanovera {
          background: linear-gradient(90deg, #5260e6, #22c55e);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .comp-vs {
          color: var(--ink-3);
          font-weight: 600;
          font-size: 0.7em;
          font-style: italic;
        }
        .comp-title-competitor { color: var(--ink); }
        .comp-tagline {
          margin: 0 auto;
          max-width: 580px;
          color: var(--ink-2);
          font-size: 16px;
          line-height: 1.5;
        }
        .comp-meta {
          margin-top: 16px;
          font-size: 12px;
          color: var(--ink-3);
        }
        .comp-meta-site { color: var(--ink-2); }

        .comp-section {
          margin-bottom: 36px;
        }
        .comp-section-title {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.01em;
          margin: 0 0 16px;
        }
        .comp-section-title-positive { color: #16a34a; }

        .comp-tldr-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .comp-tldr-card {
          background: white;
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 18px 20px;
        }
        .comp-tldr-card-fanovera {
          border-color: rgba(82, 96, 230, 0.3);
          background: linear-gradient(135deg, rgba(82, 96, 230, 0.04), white);
        }
        .comp-tldr-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 4px 10px;
          background: rgba(82, 96, 230, 0.1);
          color: #5260e6;
          border-radius: 999px;
          margin-bottom: 10px;
        }
        .comp-tldr-badge-other {
          background: rgba(20, 22, 50, 0.06);
          color: var(--ink-2);
        }
        .comp-tldr-card p {
          margin: 0;
          font-size: 14px;
          line-height: 1.55;
          color: var(--ink-2);
        }

        .comp-table-wrap {
          border: 1px solid var(--line);
          border-radius: 14px;
          overflow: hidden;
        }
        .comp-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .comp-table th {
          padding: 12px 14px;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ink-3);
          text-align: left;
          background: var(--paper-2, #f7f7fb);
          border-bottom: 1px solid var(--line);
        }
        .comp-th-fanovera { color: #5260e6; }
        .comp-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--line);
          vertical-align: middle;
        }
        .comp-table tr:last-child td { border-bottom: none; }
        .comp-td-criterion { font-weight: 600; }
        .comp-td-winner {
          background: rgba(34, 197, 94, 0.04);
        }
        .comp-score {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .comp-score-track {
          flex: 1;
          min-width: 80px;
          height: 8px;
          background: rgba(20, 22, 50, 0.06);
          border-radius: 999px;
          overflow: hidden;
        }
        .comp-score-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .comp-score-num {
          font-size: 13px;
          font-weight: 700;
          min-width: 18px;
          text-align: right;
        }

        .comp-bullets {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 10px;
        }
        .comp-bullets li {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          font-size: 14px;
          line-height: 1.5;
          padding: 12px 14px;
          background: white;
          border: 1px solid var(--line);
          border-radius: 10px;
        }
        .comp-bullets-positive li {
          background: rgba(34, 197, 94, 0.04);
          border-color: rgba(34, 197, 94, 0.15);
        }
        .comp-bullets svg { flex-shrink: 0; margin-top: 2px; }

        .comp-verdict blockquote {
          margin: 0;
          padding: 18px 22px;
          background: white;
          border-left: 4px solid #5260e6;
          border-radius: 8px;
          font-size: 16px;
          line-height: 1.55;
          color: var(--ink);
          font-style: italic;
          box-shadow: 0 8px 20px -16px rgba(20, 22, 50, 0.12);
        }

        .comp-cta-section {
          text-align: center;
          padding: 36px 20px;
          background: linear-gradient(135deg, rgba(82, 96, 230, 0.06), rgba(34, 197, 94, 0.04));
          border-radius: 18px;
        }
        .comp-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 32px;
          background: linear-gradient(135deg, #5260e6, #6b7df5);
          color: white;
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          border-radius: 12px;
          box-shadow: 0 12px 28px -16px rgba(82, 96, 230, 0.6);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .comp-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 36px -18px rgba(82, 96, 230, 0.7);
        }
        .comp-cta-sub {
          margin-top: 12px;
          font-size: 12px;
          color: var(--ink-3);
        }

        .comp-others-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .comp-other-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: white;
          border: 1px solid var(--line);
          border-radius: 999px;
          font-size: 13px;
          color: var(--ink-2);
          text-decoration: none;
          transition: border-color 0.18s ease, color 0.18s ease;
        }
        .comp-other-pill:hover {
          border-color: var(--ink);
          color: var(--ink);
        }

        @media (max-width: 600px) {
          .comp-tldr-grid { grid-template-columns: 1fr; }
          .comp-table th, .comp-table td { padding: 10px; font-size: 13px; }
          .comp-score-track { min-width: 50px; }
        }
      `}</style>
    </main>
  );
}
