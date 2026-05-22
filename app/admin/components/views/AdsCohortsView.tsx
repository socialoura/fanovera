"use client";

import { useEffect, useState } from "react";

interface Cohort {
  monthStart: string;
  ageDays: number;
  costCents: number;
  customers: number;
  d0RevCents: number;
  d7RevCents: number;
  d30RevCents: number;
  d90RevCents: number;
  d0Roas: number | null;
  d7Roas: number | null;
  d30Roas: number | null;
  d90Roas: number | null;
}

interface Response {
  cohorts: Cohort[];
}

const eur = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function roasCell(roas: number | null, ageOK: boolean) {
  if (!ageOK) {
    return (
      <span style={{ color: "var(--a-ink-3)", fontSize: 11 }} title="Cohorte trop jeune">
        en cours
      </span>
    );
  }
  if (roas == null) return <span style={{ color: "var(--a-ink-3)" }}>—</span>;
  const color = roas >= 3 ? "#16a34a" : roas >= 1 ? "#eab308" : "#ef4444";
  const bg = roas >= 3 ? "rgba(34, 197, 94, 0.14)" : roas >= 1 ? "rgba(234, 179, 8, 0.14)" : "rgba(239, 68, 68, 0.14)";
  return (
    <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 999, fontSize: 12, fontWeight: 800, background: bg, color }}>
      {roas.toFixed(2)}×
    </span>
  );
}

function monthLabel(iso: string) {
  // iso = "2026-05-01"
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleString("fr-FR", { month: "long", year: "numeric" });
}

export default function AdsCohortsView() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    const pw = localStorage.getItem("admin_pw") ?? "";
    setLoading(true);
    setErr(null);
    fetch(`/api/admin/ads-cohorts?months=${months}`, {
      headers: { Authorization: `Bearer ${pw}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as Response;
      })
      .then((d) => setData(d))
      .catch((e) => setErr(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [months]);

  if (loading && !data) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>Chargement cohortes…</div>;
  }
  if (err || !data) {
    return <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>Erreur : {err || "indisponible"}</div>;
  }

  return (
    <div className="ac-view">
      <div className="ac-header">
        <div>
          <div className="ac-eyebrow">Cohortes ROAS — D0 / D7 / D30 / D90</div>
          <p className="ac-sub">
            Chaque ligne = clients acquis ce mois-là via Google Ads (first-touch). ROAS calculé à différents âges. Utilisez D7 pour prédire D90 : si D7 ≥ 1× la cohorte sera quasi-certainement profitable.
          </p>
        </div>
        <div className="ac-controls">
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              type="button"
              className={"ac-pill" + (months === m ? " active" : "")}
              onClick={() => setMonths(m)}
            >
              {m} mois
            </button>
          ))}
        </div>
      </div>

      <div className="ac-table-wrap">
        <table className="ac-table">
          <thead>
            <tr>
              <th>Cohorte</th>
              <th style={{ textAlign: "right" }}>Clients</th>
              <th style={{ textAlign: "right" }}>Dépense</th>
              <th style={{ textAlign: "right" }}>ROAS D0</th>
              <th style={{ textAlign: "right" }}>ROAS D7</th>
              <th style={{ textAlign: "right" }}>ROAS D30</th>
              <th style={{ textAlign: "right" }}>ROAS D90</th>
            </tr>
          </thead>
          <tbody>
            {data.cohorts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--a-ink-3)" }}>
                  Pas encore de cohortes — il faut au moins 1 mois de données.
                </td>
              </tr>
            ) : (
              data.cohorts.map((c) => (
                <tr key={c.monthStart}>
                  <td>
                    <div style={{ fontWeight: 700, textTransform: "capitalize" }}>{monthLabel(c.monthStart)}</div>
                    <div style={{ fontSize: 10, color: "var(--a-ink-3)", marginTop: 2 }}>{c.ageDays} jours d&apos;âge</div>
                  </td>
                  <td style={{ textAlign: "right" }}>{c.customers}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{eur(c.costCents)}</td>
                  <td style={{ textAlign: "right" }}>{roasCell(c.d0Roas, c.ageDays >= 0)}</td>
                  <td style={{ textAlign: "right" }}>{roasCell(c.d7Roas, c.ageDays >= 7)}</td>
                  <td style={{ textAlign: "right" }}>{roasCell(c.d30Roas, c.ageDays >= 30)}</td>
                  <td style={{ textAlign: "right" }}>{roasCell(c.d90Roas, c.ageDays >= 90)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .ac-view { padding: 0; }
        .ac-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .ac-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--a-ink-3); margin-bottom: 6px;
        }
        .ac-sub { margin: 0; max-width: 640px; color: var(--a-ink-2); font-size: 13px; line-height: 1.5; }
        .ac-controls { display: flex; gap: 6px; }
        .ac-pill {
          padding: 6px 12px; font-size: 12px; font-weight: 600;
          background: transparent; border: 1px solid var(--a-line);
          color: var(--a-ink-2); border-radius: 999px; cursor: pointer;
        }
        .ac-pill.active {
          background: rgba(82, 96, 230, 0.12); border-color: rgba(82, 96, 230, 0.4);
          color: #5260e6;
        }
        .ac-table-wrap { overflow-x: auto; border: 1px solid var(--a-line); border-radius: 12px; }
        .ac-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ac-table th {
          padding: 10px 14px; font-weight: 700; text-align: left;
          font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--a-ink-3); border-bottom: 1px solid var(--a-line);
        }
        .ac-table td {
          padding: 10px 14px; border-bottom: 1px solid var(--a-line);
          color: var(--a-ink);
        }
        .ac-table tr:last-child td { border-bottom: none; }
      `}</style>
    </div>
  );
}
