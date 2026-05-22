"use client";

import { useEffect, useMemo, useState } from "react";

interface TermRow {
  searchTerm: string;
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  costCents: number;
  clicks: number;
  impressions: number;
  googleConversions: number;
  attributedRevenueCents: number;
  attributedOrders: number;
  realRoas: number | null;
  realCpaCents: number | null;
  cpcCents: number | null;
  shareOfAdGroupCost: number;
}

interface Response {
  days: number;
  terms: TermRow[];
}

type SortKey = "costCents" | "attributedRevenueCents" | "realRoas" | "clicks";

const eur = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

function roasColor(r: number | null) {
  if (r == null) return "var(--a-ink-3)";
  if (r >= 3) return "#16a34a";
  if (r >= 1) return "#eab308";
  return "#ef4444";
}
function roasBg(r: number | null) {
  if (r == null) return "rgba(20, 22, 50, 0.06)";
  if (r >= 3) return "rgba(34, 197, 94, 0.14)";
  if (r >= 1) return "rgba(234, 179, 8, 0.14)";
  return "rgba(239, 68, 68, 0.14)";
}

export default function SearchTermsView() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [minCost, setMinCost] = useState(100); // 1€ minimum default
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("costCents");

  useEffect(() => {
    const pw = localStorage.getItem("admin_pw") ?? "";
    const url = `/api/admin/search-terms?days=${days}&minCostCents=${minCost}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
    setLoading(true);
    setErr(null);
    fetch(url, { headers: { Authorization: `Bearer ${pw}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as Response;
      })
      .then((d) => setData(d))
      .catch((e) => setErr(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [days, minCost, q]);

  const sorted = useMemo(() => {
    if (!data) return [];
    const rows = [...data.terms];
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const an = typeof av === "number" ? av : -Infinity;
      const bn = typeof bv === "number" ? bv : -Infinity;
      return bn - an;
    });
    return rows;
  }, [data, sortKey]);

  if (loading && !data) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>Chargement search terms…</div>;
  }
  if (err || !data) {
    return <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>Erreur : {err || "données indisponibles"}</div>;
  }

  return (
    <div className="st-view">
      <div className="st-header">
        <div>
          <div className="st-eyebrow">Search Terms — performance réelle</div>
          <p className="st-sub">
            Termes réellement tapés par les utilisateurs. Le revenu est attribué proportionnellement à la part du coût du groupe d&apos;annonces — approximation utile pour identifier les gros mots-clés perdants ou gagnants. À exclure manuellement dans Google Ads si négatif.
          </p>
        </div>
        <div className="st-controls">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              className={"st-pill" + (days === d ? " active" : "")}
              onClick={() => setDays(d)}
              type="button"
            >
              {d} j
            </button>
          ))}
        </div>
      </div>

      <div className="st-filters">
        <input
          type="text"
          placeholder="Filtrer un terme…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="st-input"
        />
        <label className="st-mincost">
          Coût min
          <select value={minCost} onChange={(e) => setMinCost(Number(e.target.value))}>
            <option value={0}>tous</option>
            <option value={100}>≥ 1€</option>
            <option value={500}>≥ 5€</option>
            <option value={1000}>≥ 10€</option>
            <option value={5000}>≥ 50€</option>
          </select>
        </label>
        <div className="st-sort-bar">
          <span className="st-sort-label">Trier</span>
          {(["costCents", "attributedRevenueCents", "realRoas", "clicks"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSortKey(k)}
              className={"st-sort-btn" + (sortKey === k ? " active" : "")}
            >
              {k === "costCents" ? "Dépense" : k === "attributedRevenueCents" ? "Revenu" : k === "realRoas" ? "ROAS" : "Clics"}
            </button>
          ))}
        </div>
      </div>

      <div className="st-table-wrap">
        <table className="st-table">
          <thead>
            <tr>
              <th>Terme · Groupe d&apos;annonces</th>
              <th style={{ textAlign: "right" }}>Dépense</th>
              <th style={{ textAlign: "right" }}>Clics</th>
              <th style={{ textAlign: "right" }}>Commandes ~</th>
              <th style={{ textAlign: "right" }}>Revenu ~</th>
              <th style={{ textAlign: "right" }}>ROAS ~</th>
              <th style={{ textAlign: "right" }}>CPC</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--a-ink-3)" }}>
                  Aucun search term trouvé. Le cron quotidien les sync depuis la search_term_view Google Ads.
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <tr key={`${r.adGroupId}::${r.searchTerm}`}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{r.searchTerm}</div>
                    <div style={{ fontSize: 10, color: "var(--a-ink-3)", marginTop: 2 }}>
                      {r.adGroupName || `Ad group ${r.adGroupId}`} · {r.campaignName || `Campagne ${r.campaignId}`}
                      {r.shareOfAdGroupCost > 0 && (
                        <span style={{ marginLeft: 6 }}>· {(r.shareOfAdGroupCost * 100).toFixed(0)}% du coût AG</span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{eur(r.costCents)}</td>
                  <td style={{ textAlign: "right" }}>{r.clicks}</td>
                  <td style={{ textAlign: "right" }}>{r.attributedOrders.toFixed(1)}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{eur(r.attributedRevenueCents)}</td>
                  <td style={{ textAlign: "right" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 800,
                        background: roasBg(r.realRoas),
                        color: roasColor(r.realRoas),
                      }}
                    >
                      {r.realRoas == null ? "—" : `${r.realRoas.toFixed(2)}×`}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", color: "var(--a-ink-2)" }}>
                    {r.cpcCents == null ? "—" : eur2(r.cpcCents)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="st-foot">
        <div>{data.terms.length} termes affichés · ROAS = approximation par part du coût AG</div>
        <div>{data.days} jours</div>
      </div>

      <style jsx>{`
        .st-view { padding: 0; }
        .st-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .st-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--a-ink-3); margin-bottom: 6px;
        }
        .st-sub { margin: 0; max-width: 640px; color: var(--a-ink-2); font-size: 13px; line-height: 1.5; }
        .st-controls { display: flex; gap: 6px; }
        .st-pill {
          padding: 6px 12px; font-size: 12px; font-weight: 600;
          background: transparent; border: 1px solid var(--a-line);
          color: var(--a-ink-2); border-radius: 999px; cursor: pointer;
        }
        .st-pill:hover { border-color: var(--a-ink); color: var(--a-ink); }
        .st-pill.active {
          background: rgba(82, 96, 230, 0.12); border-color: rgba(82, 96, 230, 0.4);
          color: #5260e6;
        }
        .st-filters {
          display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .st-input {
          padding: 6px 10px; font-size: 12px;
          border: 1px solid var(--a-line); border-radius: 8px;
          background: transparent; color: var(--a-ink); min-width: 220px;
        }
        .st-mincost {
          display: flex; gap: 6px; align-items: center;
          font-size: 11px; color: var(--a-ink-3);
          font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
        }
        .st-mincost select {
          padding: 5px 8px; font-size: 12px;
          border: 1px solid var(--a-line); border-radius: 8px;
          background: transparent; color: var(--a-ink);
        }
        .st-sort-bar { display: flex; align-items: center; gap: 6px; margin-left: auto; }
        .st-sort-label { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--a-ink-3); }
        .st-sort-btn {
          padding: 5px 10px; font-size: 11px; font-weight: 600;
          background: transparent; border: 1px solid var(--a-line);
          color: var(--a-ink-2); border-radius: 8px; cursor: pointer;
        }
        .st-sort-btn.active {
          background: rgba(82, 96, 230, 0.12); border-color: rgba(82, 96, 230, 0.4);
          color: #5260e6;
        }
        .st-table-wrap { overflow-x: auto; border: 1px solid var(--a-line); border-radius: 12px; }
        .st-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .st-table th {
          padding: 10px 14px; font-weight: 700; text-align: left;
          font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--a-ink-3); border-bottom: 1px solid var(--a-line);
        }
        .st-table td {
          padding: 10px 14px; border-bottom: 1px solid var(--a-line);
          color: var(--a-ink);
        }
        .st-table tr:last-child td { border-bottom: none; }
        .st-foot {
          display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;
          margin-top: 12px; font-size: 11px; color: var(--a-ink-3);
        }
      `}</style>
    </div>
  );
}
