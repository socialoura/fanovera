"use client";

import { useEffect, useState } from "react";

interface CohortRow {
  cohort: string;
  cohortStart: string;
  customers: number;
  revenueCents: number;
  retentionD7: number;
  retentionD30: number;
  retentionD90: number;
  retentionEver: number;
}

interface CohortsResponse {
  cohorts: CohortRow[];
  totals: {
    customers: number;
    revenueCents: number;
    retentionD7: number;
    retentionD30: number;
    retentionD90: number;
    retentionEver: number;
  };
  weeks: number;
  generatedAt: string;
}

const eur = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const pct = (num: number, denom: number) =>
  denom > 0 ? `${((num / denom) * 100).toFixed(1)}%` : "—";

/** Color a heatmap cell from soft → strong purple based on retention rate. */
function heatBg(rate: number): string {
  if (!rate) return "transparent";
  // 0 → 100% mapped to alpha 0..0.55 over the brand purple.
  const alpha = Math.min(0.55, Math.max(0.06, rate * 0.6));
  return `rgba(82, 96, 230, ${alpha.toFixed(2)})`;
}

export default function CohortsView() {
  const [data, setData] = useState<CohortsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState(26);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const pw = localStorage.getItem("admin_pw") ?? "";
    setLoading(true);
    setErr(null);
    fetch(`/api/admin/cohorts?weeks=${weeks}`, {
      headers: { Authorization: `Bearer ${pw}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as CohortsResponse;
      })
      .then((d) => setData(d))
      .catch((e) => setErr(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [weeks]);

  if (loading && !data) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>Chargement des cohortes…</div>;
  }
  if (err || !data) {
    return <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>Erreur : {err || "données indisponibles"}</div>;
  }

  const totals = data.totals;
  const sortedCohorts = [...data.cohorts].sort((a, b) => b.cohortStart.localeCompare(a.cohortStart));

  return (
    <div className="cohorts-view">
      <div className="cohorts-header">
        <div>
          <div className="cohorts-eyebrow">Rétention par cohorte</div>
          <p className="cohorts-sub">
            Chaque ligne = clients dont la première commande a eu lieu cette semaine. Les colonnes D7/D30/D90 affichent le % qui a recommandé dans cet horizon.
          </p>
        </div>
        <div className="cohorts-controls">
          {[12, 26, 52, 104].map((w) => (
            <button
              key={w}
              className={"cohorts-pill" + (weeks === w ? " active" : "")}
              onClick={() => setWeeks(w)}
              type="button"
            >
              {w >= 52 ? `${Math.round(w / 52)} an${w >= 104 ? "s" : ""}` : `${Math.round(w / 4)} mois`}
            </button>
          ))}
        </div>
      </div>

      {/* Totals strip */}
      <div className="cohorts-totals">
        <div className="cohorts-stat">
          <div className="cohorts-stat-label">Clients</div>
          <div className="cohorts-stat-value">{totals.customers.toLocaleString("fr-FR")}</div>
        </div>
        <div className="cohorts-stat">
          <div className="cohorts-stat-label">Revenu cumulé</div>
          <div className="cohorts-stat-value">{eur(totals.revenueCents)}</div>
        </div>
        <div className="cohorts-stat">
          <div className="cohorts-stat-label">D7</div>
          <div className="cohorts-stat-value">{pct(totals.retentionD7, totals.customers)}</div>
        </div>
        <div className="cohorts-stat">
          <div className="cohorts-stat-label">D30</div>
          <div className="cohorts-stat-value">{pct(totals.retentionD30, totals.customers)}</div>
        </div>
        <div className="cohorts-stat">
          <div className="cohorts-stat-label">D90</div>
          <div className="cohorts-stat-value">{pct(totals.retentionD90, totals.customers)}</div>
        </div>
        <div className="cohorts-stat">
          <div className="cohorts-stat-label">Lifetime</div>
          <div className="cohorts-stat-value">{pct(totals.retentionEver, totals.customers)}</div>
        </div>
      </div>

      {/* Cohort table */}
      <div className="cohorts-table-wrap">
        <table className="cohorts-table">
          <thead>
            <tr>
              <th>Cohorte</th>
              <th style={{ textAlign: "right" }}>Clients</th>
              <th style={{ textAlign: "right" }}>Revenu</th>
              <th style={{ textAlign: "right" }}>D7</th>
              <th style={{ textAlign: "right" }}>D30</th>
              <th style={{ textAlign: "right" }}>D90</th>
              <th style={{ textAlign: "right" }}>Lifetime</th>
            </tr>
          </thead>
          <tbody>
            {sortedCohorts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--a-ink-3)" }}>
                  Pas encore de données pour cette période.
                </td>
              </tr>
            ) : (
              sortedCohorts.map((c) => {
                const r7 = c.customers > 0 ? c.retentionD7 / c.customers : 0;
                const r30 = c.customers > 0 ? c.retentionD30 / c.customers : 0;
                const r90 = c.customers > 0 ? c.retentionD90 / c.customers : 0;
                const rEver = c.customers > 0 ? c.retentionEver / c.customers : 0;
                return (
                  <tr key={c.cohort}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{c.cohort}</div>
                      <div style={{ fontSize: 11, color: "var(--a-ink-3)" }}>{c.cohortStart}</div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{c.customers}</td>
                    <td style={{ textAlign: "right" }}>{eur(c.revenueCents)}</td>
                    <td style={{ textAlign: "right", background: heatBg(r7) }}>
                      <strong>{pct(c.retentionD7, c.customers)}</strong>
                      <div style={{ fontSize: 11, color: "var(--a-ink-3)" }}>{c.retentionD7}</div>
                    </td>
                    <td style={{ textAlign: "right", background: heatBg(r30) }}>
                      <strong>{pct(c.retentionD30, c.customers)}</strong>
                      <div style={{ fontSize: 11, color: "var(--a-ink-3)" }}>{c.retentionD30}</div>
                    </td>
                    <td style={{ textAlign: "right", background: heatBg(r90) }}>
                      <strong>{pct(c.retentionD90, c.customers)}</strong>
                      <div style={{ fontSize: 11, color: "var(--a-ink-3)" }}>{c.retentionD90}</div>
                    </td>
                    <td style={{ textAlign: "right", background: heatBg(rEver) }}>
                      <strong>{pct(c.retentionEver, c.customers)}</strong>
                      <div style={{ fontSize: 11, color: "var(--a-ink-3)" }}>{c.retentionEver}</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="cohorts-foot">
        Généré à {new Date(data.generatedAt).toLocaleString("fr-FR")} · {data.weeks} semaines
      </div>

      <style jsx>{`
        .cohorts-view { padding: 0; }
        .cohorts-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .cohorts-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--a-ink-3); margin-bottom: 6px;
        }
        .cohorts-sub { margin: 0; max-width: 640px; color: var(--a-ink-2); font-size: 13px; line-height: 1.5; }
        .cohorts-controls { display: flex; gap: 6px; }
        .cohorts-pill {
          padding: 6px 12px; font-size: 12px; font-weight: 600;
          background: transparent; border: 1px solid var(--a-line);
          color: var(--a-ink-2); border-radius: 999px; cursor: pointer;
          transition: all 0.18s;
        }
        .cohorts-pill:hover { border-color: var(--a-ink); color: var(--a-ink); }
        .cohorts-pill.active {
          background: rgba(82, 96, 230, 0.12); border-color: rgba(82, 96, 230, 0.4);
          color: #5260e6;
        }
        .cohorts-totals {
          display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px;
          margin-bottom: 24px; padding: 16px;
          background: var(--a-bg-soft, rgba(255, 255, 255, 0.04));
          border: 1px solid var(--a-line); border-radius: 12px;
        }
        .cohorts-stat-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--a-ink-3); margin-bottom: 4px;
        }
        .cohorts-stat-value { font-size: 18px; font-weight: 800; letter-spacing: -0.01em; color: var(--a-ink); }
        .cohorts-table-wrap { overflow-x: auto; border: 1px solid var(--a-line); border-radius: 12px; }
        .cohorts-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .cohorts-table th {
          padding: 10px 14px; font-weight: 700; text-align: left;
          font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--a-ink-3); border-bottom: 1px solid var(--a-line);
          background: var(--a-bg-soft, rgba(255, 255, 255, 0.02));
        }
        .cohorts-table td {
          padding: 10px 14px; border-bottom: 1px solid var(--a-line);
          color: var(--a-ink); transition: background 0.18s;
        }
        .cohorts-table tr:last-child td { border-bottom: none; }
        .cohorts-foot {
          margin-top: 12px; font-size: 11px; color: var(--a-ink-3);
          text-align: right;
        }
        @media (max-width: 720px) {
          .cohorts-totals { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
