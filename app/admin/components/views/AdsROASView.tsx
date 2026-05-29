"use client";

import { useEffect, useMemo, useState } from "react";

interface Row {
  /** Present only when groupBy = "adgroup" */
  adGroupId?: string;
  adGroupName?: string;
  /** Present only when groupBy = "keyword" */
  keyword?: string;
  matchType?: string;
  campaignId: string;
  campaignName: string;
  costCents: number;
  clicks: number;
  impressions: number;
  googleConversions: number;
  realOrders: number;
  realRevenueCents: number;
  refundedCents: number;
  refundRate: number | null;
  realRoas: number | null;
  realCpaCents: number | null;
  cpcCents: number | null;
  cvr: number | null;
}

type GroupBy = "campaign" | "adgroup" | "keyword";

interface RoasResponse {
  days: number;
  groupBy: GroupBy;
  configured: boolean;
  rows: Row[];
  totals: {
    costCents: number;
    revenueCents: number;
    clicks: number;
    impressions: number;
    realOrders: number;
    blendedRoas: number | null;
    blendedCpaCents: number | null;
  };
  diagnostics: {
    checkoutWithGclid: number;
    checkoutWithKeyword: number;
    gclidMapSize: number;
    lastSyncedAt: string | null;
    lastSyncedAtAdGroup: string | null;
    lastSyncedAtKeyword: string | null;
  };
}

type SortKey = "costCents" | "realRevenueCents" | "realRoas" | "realCpaCents" | "realOrders" | "clicks";

const eur = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const eur2 = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

const pctFmt = (n: number | null) => (n == null ? "—" : `${(n * 100).toFixed(1)}%`);

function roasColor(roas: number | null): string {
  if (roas == null) return "var(--a-ink-3)";
  if (roas >= 3) return "#16a34a";
  if (roas >= 1) return "#eab308";
  return "#ef4444";
}

function roasBadge(roas: number | null): string {
  if (roas == null) return "rgba(20, 22, 50, 0.06)";
  if (roas >= 3) return "rgba(34, 197, 94, 0.14)";
  if (roas >= 1) return "rgba(234, 179, 8, 0.14)";
  return "rgba(239, 68, 68, 0.14)";
}

// Historical baselines from the Fanovaly account (pre-Cartoonova). Used as
// a reference line so Ilyes can tell at a glance whether the new account is
// improving on the previous one. Frozen constants — update only if Fanovaly
// history is revisited.
const FANOVALY_BASELINE_CPA_CENTS = {
  fr: 768, // 7.68€
  en: 458, // 4.58€
};

function inferLocaleFromName(name: string | undefined): "fr" | "en" | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  if (/\b(fr|french|fra|france)\b/.test(lower) || lower.startsWith("[fr]") || lower.startsWith("fr-")) return "fr";
  if (/\b(en|english|eng|us|uk)\b/.test(lower) || lower.startsWith("[en]") || lower.startsWith("en-")) return "en";
  return null;
}

function baselineCpaForRow(row: Row): { cpaCents: number; locale: "fr" | "en" } | null {
  const fromCampaign = inferLocaleFromName(row.campaignName);
  const fromAdGroup = inferLocaleFromName(row.adGroupName);
  const locale = fromCampaign || fromAdGroup;
  if (!locale) return null;
  return { cpaCents: FANOVALY_BASELINE_CPA_CENTS[locale], locale };
}

export default function AdsROASView() {
  const [data, setData] = useState<RoasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [groupBy, setGroupBy] = useState<GroupBy>("campaign");
  const [err, setErr] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("costCents");

  useEffect(() => {
    const pw = localStorage.getItem("admin_pw") ?? "";
    setLoading(true);
    setErr(null);
    fetch(`/api/admin/ads-roas?days=${days}&groupBy=${groupBy}`, {
      headers: { Authorization: `Bearer ${pw}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as RoasResponse;
      })
      .then((d) => setData(d))
      .catch((e) => setErr(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [days, groupBy]);

  const sorted = useMemo(() => {
    if (!data) return [];
    const rows = [...data.rows];
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
    return <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>Chargement Google Ads…</div>;
  }
  if (err || !data) {
    return <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>Erreur : {err || "données indisponibles"}</div>;
  }

  const t = data.totals;
  const isAdGroup = data.groupBy === "adgroup";
  const isKeyword = data.groupBy === "keyword";

  const sortBtn = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => setSortKey(key)}
      className={"ads-sort-btn" + (sortKey === key ? " active" : "")}
    >
      {label}
      {sortKey === key && <span style={{ marginLeft: 4 }}>↓</span>}
    </button>
  );

  return (
    <div className="ads-view">
      <div className="ads-header">
        <div>
          <div className="ads-eyebrow">ROAS réel Google Ads · LTV first-touch</div>
          <p className="ads-sub">
            ROAS basé sur le <strong>LTV</strong> : toutes les commandes (y compris les retours sans <code>gclid</code>) d&apos;un client sont attribuées à la campagne qui l&apos;a acquis la première fois.
          </p>
        </div>
        <div className="ads-controls">
          {[7, 30, 90, 180].map((d) => (
            <button
              key={d}
              className={"ads-pill" + (days === d ? " active" : "")}
              onClick={() => setDays(d)}
              type="button"
            >
              {d} j
            </button>
          ))}
        </div>
      </div>

      <div className="ads-granularity">
        <span className="ads-gran-label">Granularité</span>
        <button
          type="button"
          className={"ads-gran-btn" + (groupBy === "campaign" ? " active" : "")}
          onClick={() => setGroupBy("campaign")}
        >
          Campagne
        </button>
        <button
          type="button"
          className={"ads-gran-btn" + (groupBy === "adgroup" ? " active" : "")}
          onClick={() => setGroupBy("adgroup")}
        >
          Groupe d&apos;annonces
        </button>
        <button
          type="button"
          className={"ads-gran-btn" + (groupBy === "keyword" ? " active" : "")}
          onClick={() => setGroupBy("keyword")}
        >
          Mot-clé
        </button>
      </div>

      {!data.configured && (
        <div className="ads-warn">
          ⚠️ Variables d&apos;environnement Google Ads non configurées. Le cron quotidien tourne mais ne récupère rien. Voir <code>docs/google-ads-integration.md</code>.
        </div>
      )}

      <div className="ads-totals">
        <div className="ads-stat">
          <div className="ads-stat-label">Dépense pub</div>
          <div className="ads-stat-value">{eur(t.costCents)}</div>
        </div>
        <div className="ads-stat">
          <div className="ads-stat-label">Revenu attribué</div>
          <div className="ads-stat-value">{eur(t.revenueCents)}</div>
        </div>
        <div className="ads-stat">
          <div className="ads-stat-label">ROAS global</div>
          <div className="ads-stat-value" style={{ color: roasColor(t.blendedRoas) }}>
            {t.blendedRoas == null ? "—" : `${t.blendedRoas.toFixed(2)}×`}
          </div>
        </div>
        <div className="ads-stat">
          <div className="ads-stat-label">Commandes</div>
          <div className="ads-stat-value">{t.realOrders.toLocaleString("fr-FR")}</div>
        </div>
        <div className="ads-stat">
          <div className="ads-stat-label">CPA réel</div>
          <div className="ads-stat-value">{t.blendedCpaCents == null ? "—" : eur2(t.blendedCpaCents)}</div>
        </div>
      </div>

      <div className="ads-sort-bar">
        <span className="ads-sort-label">Trier par</span>
        {sortBtn("costCents", "Dépense")}
        {sortBtn("realRevenueCents", "Revenu")}
        {sortBtn("realRoas", "ROAS")}
        {sortBtn("realCpaCents", "CPA")}
        {sortBtn("realOrders", "Commandes")}
        {sortBtn("clicks", "Clics")}
      </div>

      <div className="ads-table-wrap">
        <table className="ads-table">
          <thead>
            <tr>
              <th>{isKeyword ? "Mot-clé · Campagne" : isAdGroup ? "Groupe d'annonces · Campagne" : "Campagne"}</th>
              <th style={{ textAlign: "right" }}>Dépense</th>
              <th style={{ textAlign: "right" }}>Clics</th>
              <th style={{ textAlign: "right" }}>Commandes</th>
              <th style={{ textAlign: "right" }}>Revenu net</th>
              <th style={{ textAlign: "right" }}>Refund</th>
              <th style={{ textAlign: "right" }}>ROAS</th>
              <th style={{ textAlign: "right" }}>CPA</th>
              <th style={{ textAlign: "right" }}>CVR</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: 32, color: "var(--a-ink-3)" }}>
                  Pas encore de données. Le premier cron tourne chaque jour à 4h UTC.
                </td>
              </tr>
            ) : (
              sorted.map((r) => {
                const rowId = isKeyword
                  ? r.keyword || r.campaignId
                  : isAdGroup
                    ? r.adGroupId || r.campaignId
                    : r.campaignId;
                const primaryName = isKeyword
                  ? r.keyword || "(mot-clé inconnu)"
                  : isAdGroup
                    ? r.adGroupName || `Ad group ${r.adGroupId}`
                    : r.campaignName || `Campagne ${r.campaignId}`;
                const secondary = isKeyword
                  ? `${r.matchType ? `${r.matchType} · ` : ""}${r.campaignName || `Campagne ${r.campaignId}`}`
                  : isAdGroup
                    ? `${r.campaignName || `Campagne ${r.campaignId}`} · ${r.adGroupId}`
                    : r.campaignId;
                return (
                  <tr key={rowId}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{primaryName}</div>
                      <div style={{ fontSize: 10, color: "var(--a-ink-3)", marginTop: 2 }}>{secondary}</div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{eur(r.costCents)}</td>
                    <td style={{ textAlign: "right" }}>{r.clicks.toLocaleString("fr-FR")}</td>
                    <td style={{ textAlign: "right" }}>{r.realOrders}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{eur(r.realRevenueCents)}</td>
                    <td style={{ textAlign: "right" }}>
                      {r.refundedCents > 0 ? (
                        <span style={{ color: r.refundRate != null && r.refundRate > 0.1 ? "#ef4444" : "var(--a-ink-2)", fontSize: 12 }}>
                          {eur(r.refundedCents)}
                          {r.refundRate != null && <span style={{ marginLeft: 4, opacity: 0.7 }}>({(r.refundRate * 100).toFixed(0)}%)</span>}
                        </span>
                      ) : (
                        <span style={{ color: "var(--a-ink-3)", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 800,
                          background: roasBadge(r.realRoas),
                          color: roasColor(r.realRoas),
                        }}
                      >
                        {r.realRoas == null ? "—" : `${r.realRoas.toFixed(2)}×`}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {r.realCpaCents == null ? (
                        "—"
                      ) : (
                        <>
                          {eur2(r.realCpaCents)}
                          {(() => {
                            const baseline = baselineCpaForRow(r);
                            if (!baseline) return null;
                            const delta = r.realCpaCents! - baseline.cpaCents;
                            const better = delta < 0;
                            return (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: better ? "#16a34a" : "#ef4444",
                                  marginTop: 2,
                                  fontWeight: 600,
                                }}
                                title={`Baseline Fanovaly ${baseline.locale.toUpperCase()} : ${eur2(baseline.cpaCents)}`}
                              >
                                {better ? "▼" : "▲"} {Math.abs(delta / 100).toFixed(2)}€ vs Fanovaly
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </td>
                    <td style={{ textAlign: "right", color: "var(--a-ink-2)" }}>{pctFmt(r.cvr)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="ads-foot">
        <div>
          Diagnostic :{" "}
          {isKeyword
            ? `${data.diagnostics.checkoutWithKeyword} checkouts avec mot-clé`
            : `${data.diagnostics.checkoutWithGclid} checkouts avec gclid · ${data.diagnostics.gclidMapSize} clics mappés`}
          {" · "}
          {(() => {
            const lastSync = isKeyword
              ? data.diagnostics.lastSyncedAtKeyword
              : isAdGroup
                ? data.diagnostics.lastSyncedAtAdGroup
                : data.diagnostics.lastSyncedAt;
            return lastSync
              ? `dernier sync ${new Date(lastSync).toLocaleString("fr-FR")}`
              : "jamais synchronisé";
          })()}
        </div>
        <div>{data.days} jours</div>
      </div>

      <style jsx>{`
        .ads-view { padding: 0; }
        .ads-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .ads-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--a-ink-3); margin-bottom: 6px;
        }
        .ads-sub { margin: 0; max-width: 640px; color: var(--a-ink-2); font-size: 13px; line-height: 1.5; }
        .ads-sub code { font-size: 12px; padding: 1px 5px; border-radius: 4px; background: rgba(20, 22, 50, 0.08); }
        .ads-controls { display: flex; gap: 6px; }
        .ads-pill {
          padding: 6px 12px; font-size: 12px; font-weight: 600;
          background: transparent; border: 1px solid var(--a-line);
          color: var(--a-ink-2); border-radius: 999px; cursor: pointer;
          transition: all 0.18s;
        }
        .ads-pill:hover { border-color: var(--a-ink); color: var(--a-ink); }
        .ads-pill.active {
          background: rgba(82, 96, 230, 0.12); border-color: rgba(82, 96, 230, 0.4);
          color: #5260e6;
        }
        .ads-granularity {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 16px;
        }
        .ads-gran-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--a-ink-3);
        }
        .ads-gran-btn {
          padding: 6px 14px; font-size: 12px; font-weight: 600;
          background: transparent; border: 1px solid var(--a-line);
          color: var(--a-ink-2); border-radius: 8px; cursor: pointer;
          transition: all 0.18s;
        }
        .ads-gran-btn:hover { border-color: var(--a-ink); color: var(--a-ink); }
        .ads-gran-btn.active {
          background: rgba(82, 96, 230, 0.12); border-color: rgba(82, 96, 230, 0.4);
          color: #5260e6;
        }
        .ads-warn {
          padding: 12px 16px; margin-bottom: 16px;
          background: rgba(234, 179, 8, 0.10); border: 1px solid rgba(234, 179, 8, 0.3);
          border-radius: 8px; font-size: 13px; color: var(--a-ink);
        }
        .ads-warn code { font-size: 12px; padding: 1px 5px; border-radius: 4px; background: rgba(20, 22, 50, 0.08); }
        .ads-totals {
          display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;
          margin-bottom: 16px; padding: 16px;
          background: var(--a-bg-soft, rgba(255, 255, 255, 0.04));
          border: 1px solid var(--a-line); border-radius: 12px;
        }
        .ads-stat-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--a-ink-3); margin-bottom: 4px;
        }
        .ads-stat-value { font-size: 18px; font-weight: 800; letter-spacing: -0.01em; color: var(--a-ink); }
        .ads-sort-bar {
          display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .ads-sort-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--a-ink-3); margin-right: 4px;
        }
        .ads-sort-btn {
          padding: 5px 10px; font-size: 11px; font-weight: 600;
          background: transparent; border: 1px solid var(--a-line);
          color: var(--a-ink-2); border-radius: 8px; cursor: pointer;
          transition: all 0.18s;
        }
        .ads-sort-btn:hover { border-color: var(--a-ink); color: var(--a-ink); }
        .ads-sort-btn.active {
          background: rgba(82, 96, 230, 0.12); border-color: rgba(82, 96, 230, 0.4);
          color: #5260e6;
        }
        .ads-table-wrap { overflow-x: auto; border: 1px solid var(--a-line); border-radius: 12px; }
        .ads-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ads-table th {
          padding: 10px 14px; font-weight: 700; text-align: left;
          font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--a-ink-3); border-bottom: 1px solid var(--a-line);
          background: var(--a-bg-soft, rgba(255, 255, 255, 0.02));
        }
        .ads-table td {
          padding: 10px 14px; border-bottom: 1px solid var(--a-line);
          color: var(--a-ink);
        }
        .ads-table tr:last-child td { border-bottom: none; }
        .ads-foot {
          display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;
          margin-top: 12px; font-size: 11px; color: var(--a-ink-3);
        }
        @media (max-width: 720px) {
          .ads-totals { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
