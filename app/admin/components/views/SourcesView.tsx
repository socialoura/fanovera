"use client";

import { useEffect, useMemo, useState } from "react";

interface SourceRow {
  sourcePage: string;
  customers: number;
  orders: number;
  revenueCents: number;
  costCents: number;
  avgLtvCents: number;
  repeatRate: number;
}

interface SourcesResponse {
  sources: SourceRow[];
  totals: {
    customers: number;
    orders: number;
    revenueCents: number;
    costCents: number;
    avgLtvCents: number;
  };
  days: number;
  generatedAt: string;
}

type SortKey = "revenueCents" | "customers" | "avgLtvCents" | "repeatRate" | "orders";

const eur = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const pctFmt = (n: number) => `${(n * 100).toFixed(1)}%`;

/** Friendly label for the source path. "/instagram" → "Instagram", "(direct)" → "Direct", etc. */
function sourceLabel(raw: string): string {
  if (!raw || raw === "(direct)") return "Direct / inconnu";
  // Strip locale prefix `/fr/` or `/en/` if present.
  const cleaned = raw.replace(/^\/(fr|en|es|pt|de|it|tr)\//, "/");
  if (/^\/(instagram|tiktok|youtube|facebook|spotify|twitch|twitter|x|linkedin)$/i.test(cleaned)) {
    const platform = cleaned.replace(/^\//, "");
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  }
  if (cleaned.startsWith("/comparer/")) {
    const competitor = cleaned.replace("/comparer/", "");
    return `Comparatif · ${competitor}`;
  }
  if (cleaned === "/") return "Accueil";
  return cleaned;
}

export default function SourcesView() {
  const [data, setData] = useState<SourcesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90);
  const [err, setErr] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("revenueCents");

  useEffect(() => {
    const pw = localStorage.getItem("admin_pw") ?? "";
    setLoading(true);
    setErr(null);
    fetch(`/api/admin/ltv-by-source?days=${days}`, {
      headers: { Authorization: `Bearer ${pw}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as SourcesResponse;
      })
      .then((d) => setData(d))
      .catch((e) => setErr(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [days]);

  const sorted = useMemo(() => {
    if (!data) return [];
    const rows = [...data.sources];
    rows.sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
    return rows;
  }, [data, sortKey]);

  if (loading && !data) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>Chargement des sources…</div>;
  }
  if (err || !data) {
    return <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>Erreur : {err || "données indisponibles"}</div>;
  }

  const grossMarginCents = data.totals.revenueCents - data.totals.costCents;
  const grossMarginPct = data.totals.revenueCents > 0 ? grossMarginCents / data.totals.revenueCents : 0;
  const maxRevenue = Math.max(...sorted.map((s) => s.revenueCents), 1);

  const sortBtn = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => setSortKey(key)}
      className={"sources-sort-btn" + (sortKey === key ? " active" : "")}
    >
      {label}
      {sortKey === key && <span style={{ marginLeft: 4 }}>↓</span>}
    </button>
  );

  return (
    <div className="sources-view">
      <div className="sources-header">
        <div>
          <div className="sources-eyebrow">LTV par source d&apos;acquisition</div>
          <p className="sources-sub">
            Chaque client est attribué à la <strong>première</strong> page où il a acheté. Toutes ses commandes ultérieures gardent cette attribution.
          </p>
        </div>
        <div className="sources-controls">
          {[30, 90, 180, 365].map((d) => (
            <button
              key={d}
              className={"sources-pill" + (days === d ? " active" : "")}
              onClick={() => setDays(d)}
              type="button"
            >
              {d < 365 ? `${d} j` : "1 an"}
            </button>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="sources-totals">
        <div className="sources-stat">
          <div className="sources-stat-label">Clients</div>
          <div className="sources-stat-value">{data.totals.customers.toLocaleString("fr-FR")}</div>
        </div>
        <div className="sources-stat">
          <div className="sources-stat-label">Commandes</div>
          <div className="sources-stat-value">{data.totals.orders.toLocaleString("fr-FR")}</div>
        </div>
        <div className="sources-stat">
          <div className="sources-stat-label">Revenu</div>
          <div className="sources-stat-value">{eur(data.totals.revenueCents)}</div>
        </div>
        <div className="sources-stat">
          <div className="sources-stat-label">LTV moyenne</div>
          <div className="sources-stat-value">{eur(data.totals.avgLtvCents)}</div>
        </div>
        <div className="sources-stat">
          <div className="sources-stat-label">Marge brute</div>
          <div className="sources-stat-value">{pctFmt(grossMarginPct)}</div>
        </div>
      </div>

      {/* Sort controls */}
      <div className="sources-sort-bar">
        <span className="sources-sort-label">Trier par</span>
        {sortBtn("revenueCents", "Revenu")}
        {sortBtn("customers", "Clients")}
        {sortBtn("avgLtvCents", "LTV")}
        {sortBtn("repeatRate", "Repeat")}
        {sortBtn("orders", "Commandes")}
      </div>

      {/* Table */}
      <div className="sources-table-wrap">
        <table className="sources-table">
          <thead>
            <tr>
              <th>Source</th>
              <th style={{ textAlign: "right" }}>Clients</th>
              <th style={{ textAlign: "right" }}>Commandes</th>
              <th style={{ textAlign: "right" }}>Revenu</th>
              <th style={{ textAlign: "right" }}>LTV</th>
              <th style={{ textAlign: "right" }}>Coût SMM</th>
              <th style={{ textAlign: "right" }}>Repeat</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--a-ink-3)" }}>
                  Pas encore de données.
                </td>
              </tr>
            ) : (
              sorted.map((s) => {
                const revShare = s.revenueCents / maxRevenue;
                const margin = s.revenueCents > 0 ? (s.revenueCents - s.costCents) / s.revenueCents : 0;
                return (
                  <tr key={s.sourcePage}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{sourceLabel(s.sourcePage)}</div>
                      <div className="sources-bar">
                        <div className="sources-bar-fill" style={{ width: `${(revShare * 100).toFixed(1)}%` }} />
                      </div>
                      <div style={{ fontSize: 10, color: "var(--a-ink-3)", marginTop: 2 }}>{s.sourcePage}</div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{s.customers}</td>
                    <td style={{ textAlign: "right" }}>{s.orders}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{eur(s.revenueCents)}</td>
                    <td style={{ textAlign: "right" }}>
                      <strong>{eur(s.avgLtvCents)}</strong>
                      <div style={{ fontSize: 11, color: margin >= 0.5 ? "#16a34a" : "var(--a-ink-3)" }}>
                        marge {pctFmt(margin)}
                      </div>
                    </td>
                    <td style={{ textAlign: "right", color: "var(--a-ink-2)" }}>{eur(s.costCents)}</td>
                    <td style={{ textAlign: "right" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            s.repeatRate >= 0.2
                              ? "rgba(34, 197, 94, 0.14)"
                              : s.repeatRate >= 0.1
                                ? "rgba(82, 96, 230, 0.12)"
                                : "rgba(20, 22, 50, 0.06)",
                          color:
                            s.repeatRate >= 0.2 ? "#16a34a" : s.repeatRate >= 0.1 ? "#5260e6" : "var(--a-ink-3)",
                        }}
                      >
                        {pctFmt(s.repeatRate)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="sources-foot">
        Généré à {new Date(data.generatedAt).toLocaleString("fr-FR")} · {data.days} jours
      </div>

      <style jsx>{`
        .sources-view { padding: 0; }
        .sources-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .sources-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--a-ink-3); margin-bottom: 6px;
        }
        .sources-sub { margin: 0; max-width: 640px; color: var(--a-ink-2); font-size: 13px; line-height: 1.5; }
        .sources-controls { display: flex; gap: 6px; }
        .sources-pill {
          padding: 6px 12px; font-size: 12px; font-weight: 600;
          background: transparent; border: 1px solid var(--a-line);
          color: var(--a-ink-2); border-radius: 999px; cursor: pointer;
          transition: all 0.18s;
        }
        .sources-pill:hover { border-color: var(--a-ink); color: var(--a-ink); }
        .sources-pill.active {
          background: rgba(82, 96, 230, 0.12); border-color: rgba(82, 96, 230, 0.4);
          color: #5260e6;
        }
        .sources-totals {
          display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;
          margin-bottom: 16px; padding: 16px;
          background: var(--a-bg-soft, rgba(255, 255, 255, 0.04));
          border: 1px solid var(--a-line); border-radius: 12px;
        }
        .sources-stat-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--a-ink-3); margin-bottom: 4px;
        }
        .sources-stat-value { font-size: 18px; font-weight: 800; letter-spacing: -0.01em; color: var(--a-ink); }
        .sources-sort-bar {
          display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .sources-sort-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--a-ink-3); margin-right: 4px;
        }
        .sources-sort-btn {
          padding: 5px 10px; font-size: 11px; font-weight: 600;
          background: transparent; border: 1px solid var(--a-line);
          color: var(--a-ink-2); border-radius: 8px; cursor: pointer;
          transition: all 0.18s;
        }
        .sources-sort-btn:hover { border-color: var(--a-ink); color: var(--a-ink); }
        .sources-sort-btn.active {
          background: rgba(82, 96, 230, 0.12); border-color: rgba(82, 96, 230, 0.4);
          color: #5260e6;
        }
        .sources-table-wrap { overflow-x: auto; border: 1px solid var(--a-line); border-radius: 12px; }
        .sources-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .sources-table th {
          padding: 10px 14px; font-weight: 700; text-align: left;
          font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--a-ink-3); border-bottom: 1px solid var(--a-line);
          background: var(--a-bg-soft, rgba(255, 255, 255, 0.02));
        }
        .sources-table td {
          padding: 10px 14px; border-bottom: 1px solid var(--a-line);
          color: var(--a-ink);
        }
        .sources-table tr:last-child td { border-bottom: none; }
        .sources-bar {
          height: 4px; background: rgba(20, 22, 50, 0.08);
          border-radius: 999px; overflow: hidden; margin-top: 4px;
          max-width: 220px;
        }
        .sources-bar-fill {
          height: 100%; background: linear-gradient(90deg, #5260e6, #6b7df5);
          border-radius: 999px;
        }
        .sources-foot {
          margin-top: 12px; font-size: 11px; color: var(--a-ink-3);
          text-align: right;
        }
        @media (max-width: 720px) {
          .sources-totals { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
