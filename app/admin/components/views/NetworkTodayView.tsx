"use client";

import { useCallback, useEffect, useState } from "react";
import NetIcon from "../../../components/NetIcon";
import { NETWORKS, type NetworkId } from "../../../lib/networks";

interface Row {
  platform: string;
  costCents: number;
  clicks: number;
  impressions: number;
  ordersTotal: number;
  revenueTotalCents: number;
  ordersAds: number;
  revenueAdsCents: number;
  roasTotal: number | null;
  roasAds: number | null;
}

interface Totals {
  costCents: number;
  clicks: number;
  impressions: number;
  ordersTotal: number;
  revenueTotalCents: number;
  ordersAds: number;
  revenueAdsCents: number;
  roasTotal: number | null;
  roasAds: number | null;
}

interface NetworkTodayResponse {
  dateParis: string;
  timeZone: string;
  configured: boolean;
  costLive: boolean;
  rows: Row[];
  totals: Totals;
}

const eur2 = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitch: "Twitch",
  twitter: "X (Twitter)",
  facebook: "Facebook",
  spotify: "Spotify",
  linkedin: "LinkedIn",
  other: "Autre (Brand / générique)",
};

// Real brand colors keyed by platform (from the shared network catalog), used
// to tint the NetIcon SVG logos. "other" has no brand — it falls back to a dot.
const PLATFORM_COLOR: Record<string, string> = Object.fromEntries(
  NETWORKS.map((n) => [n.id, n.color]),
);

function PlatformIcon({ platform }: { platform: string }) {
  const color = PLATFORM_COLOR[platform];
  if (!color) {
    return (
      <span style={{ display: "inline-flex", width: 18, justifyContent: "center", color: "var(--a-ink-3)" }}>
        •
      </span>
    );
  }
  return <NetIcon kind={platform as NetworkId} color={color} size={18} />;
}

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

function RoasPill({ roas }: { roas: number | null }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: roasBadge(roas),
        color: roasColor(roas),
      }}
    >
      {roas == null ? "—" : `${roas.toFixed(2)}×`}
    </span>
  );
}

export default function NetworkTodayView() {
  const [data, setData] = useState<NetworkTodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const pw = localStorage.getItem("admin_pw") ?? "";
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/network-today", {
        headers: { Authorization: `Bearer ${pw}` },
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData((await r.json()) as NetworkTodayResponse);
      setRefreshedAt(new Date());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto-refresh every 2 min (live cost keeps moving during the day).
  useEffect(() => {
    load();
    const id = window.setInterval(load, 120_000);
    return () => window.clearInterval(id);
  }, [load]);

  if (loading && !data) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>Chargement Google Ads…</div>;
  }
  if (err || !data) {
    return <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>Erreur : {err || "données indisponibles"}</div>;
  }

  const t = data.totals;

  return (
    <div className="net-view">
      <div className="net-header">
        <div>
          <div className="net-eyebrow">Aujourd&apos;hui par réseau · fuseau Europe/Paris</div>
          <p className="net-sub">
            Dépense Google Ads <strong>en direct</strong> (par groupe d&apos;annonces réseau, tous pays confondus) face au CA
            généré par chaque réseau aujourd&apos;hui. <strong>CA total</strong> = toutes les commandes du réseau (payant +
            organique). <strong>CA ads</strong> = revenu attribué aux clics Google Ads (first-touch LTV, comme l&apos;onglet Ads ROAS).
          </p>
        </div>
        <button type="button" className="net-refresh" onClick={load} disabled={loading}>
          {loading ? "…" : "↻ Rafraîchir"}
        </button>
      </div>

      {!data.configured && (
        <div className="net-warn">
          ⚠️ Variables d&apos;environnement Google Ads non configurées — la dépense ne peut pas être récupérée. Voir{" "}
          <code>docs/google-ads-integration.md</code>.
        </div>
      )}
      {data.configured && !data.costLive && (
        <div className="net-warn">
          ℹ️ Aucune dépense remontée pour aujourd&apos;hui pour l&apos;instant (zéro dépense, ou API Google Ads momentanément
          injoignable — réessaie dans un instant).
        </div>
      )}

      <div className="net-totals">
        <div className="net-stat">
          <div className="net-stat-label">Dépense pub (jour)</div>
          <div className="net-stat-value">{eur2(t.costCents)}</div>
        </div>
        <div className="net-stat">
          <div className="net-stat-label">CA total (jour)</div>
          <div className="net-stat-value">{eur2(t.revenueTotalCents)}</div>
        </div>
        <div className="net-stat">
          <div className="net-stat-label">CA ads (jour)</div>
          <div className="net-stat-value">{eur2(t.revenueAdsCents)}</div>
        </div>
        <div className="net-stat">
          <div className="net-stat-label">ROAS ads</div>
          <div className="net-stat-value" style={{ color: roasColor(t.roasAds) }}>
            {t.roasAds == null ? "—" : `${t.roasAds.toFixed(2)}×`}
          </div>
        </div>
      </div>

      <div className="net-table-wrap">
        <table className="net-table">
          <thead>
            <tr>
              <th>Réseau</th>
              <th style={{ textAlign: "right" }}>Dépense</th>
              <th style={{ textAlign: "right" }}>Clics</th>
              <th style={{ textAlign: "right" }}>CA total</th>
              <th style={{ textAlign: "right" }}>ROAS tot.</th>
              <th style={{ textAlign: "right" }}>CA ads</th>
              <th style={{ textAlign: "right" }}>ROAS ads</th>
              <th style={{ textAlign: "right" }}>Cmd (tot/ads)</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--a-ink-3)" }}>
                  Aucune donnée aujourd&apos;hui.
                </td>
              </tr>
            ) : (
              data.rows.map((r) => (
                <tr key={r.platform}>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <PlatformIcon platform={r.platform} />
                      <span style={{ fontWeight: 700 }}>{PLATFORM_LABEL[r.platform] ?? r.platform}</span>
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{eur2(r.costCents)}</td>
                  <td style={{ textAlign: "right", color: "var(--a-ink-2)" }}>{r.clicks.toLocaleString("fr-FR")}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{eur2(r.revenueTotalCents)}</td>
                  <td style={{ textAlign: "right" }}>
                    <RoasPill roas={r.roasTotal} />
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{eur2(r.revenueAdsCents)}</td>
                  <td style={{ textAlign: "right" }}>
                    <RoasPill roas={r.roasAds} />
                  </td>
                  <td style={{ textAlign: "right", color: "var(--a-ink-2)", fontVariantNumeric: "tabular-nums" }}>
                    {r.ordersTotal} / {r.ordersAds}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {data.rows.length > 0 && (
            <tfoot>
              <tr>
                <td style={{ fontWeight: 800 }}>Total</td>
                <td style={{ textAlign: "right", fontWeight: 800 }}>{eur2(t.costCents)}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{t.clicks.toLocaleString("fr-FR")}</td>
                <td style={{ textAlign: "right", fontWeight: 800 }}>{eur2(t.revenueTotalCents)}</td>
                <td style={{ textAlign: "right" }}>
                  <RoasPill roas={t.roasTotal} />
                </td>
                <td style={{ textAlign: "right", fontWeight: 800 }}>{eur2(t.revenueAdsCents)}</td>
                <td style={{ textAlign: "right" }}>
                  <RoasPill roas={t.roasAds} />
                </td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  {t.ordersTotal} / {t.ordersAds}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="net-foot">
        <div>
          Le découpage par réseau se fait au niveau du groupe d&apos;annonces (les campagnes Ads sont par pays). « CA total »
          inclut l&apos;organique — le « ROAS tot. » est donc plus flatteur que le réel ; « ROAS ads » est le vrai retour pub.
        </div>
        <div>
          {data.dateParis}
          {refreshedAt ? ` · maj ${refreshedAt.toLocaleTimeString("fr-FR")}` : ""}
        </div>
      </div>

      <style jsx>{`
        .net-view { padding: 0; }
        .net-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .net-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--a-ink-3); margin-bottom: 6px;
        }
        .net-sub { margin: 0; max-width: 720px; color: var(--a-ink-2); font-size: 13px; line-height: 1.5; }
        .net-refresh {
          padding: 8px 14px; font-size: 12px; font-weight: 700;
          background: rgba(82, 96, 230, 0.12); border: 1px solid rgba(82, 96, 230, 0.4);
          color: #5260e6; border-radius: 8px; cursor: pointer; transition: all 0.18s;
          white-space: nowrap;
        }
        .net-refresh:hover:not(:disabled) { background: rgba(82, 96, 230, 0.2); }
        .net-refresh:disabled { opacity: 0.5; cursor: default; }
        .net-warn {
          padding: 12px 16px; margin-bottom: 16px;
          background: rgba(234, 179, 8, 0.10); border: 1px solid rgba(234, 179, 8, 0.3);
          border-radius: 8px; font-size: 13px; color: var(--a-ink);
        }
        .net-warn code { font-size: 12px; padding: 1px 5px; border-radius: 4px; background: rgba(20, 22, 50, 0.08); }
        .net-totals {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
          margin-bottom: 16px; padding: 16px;
          background: var(--a-bg-soft, rgba(255, 255, 255, 0.04));
          border: 1px solid var(--a-line); border-radius: 12px;
        }
        .net-stat-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--a-ink-3); margin-bottom: 4px;
        }
        .net-stat-value { font-size: 18px; font-weight: 800; letter-spacing: -0.01em; color: var(--a-ink); }
        .net-table-wrap { overflow-x: auto; border: 1px solid var(--a-line); border-radius: 12px; }
        .net-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .net-table th {
          padding: 10px 14px; font-weight: 700; text-align: left;
          font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--a-ink-3); border-bottom: 1px solid var(--a-line);
          background: var(--a-bg-soft, rgba(255, 255, 255, 0.02));
        }
        .net-table td {
          padding: 10px 14px; border-bottom: 1px solid var(--a-line);
          color: var(--a-ink);
        }
        .net-table tbody tr:last-child td { border-bottom: none; }
        .net-table tfoot td {
          border-top: 2px solid var(--a-line);
          background: var(--a-bg-soft, rgba(255, 255, 255, 0.02));
        }
        .net-foot {
          display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;
          margin-top: 12px; font-size: 11px; color: var(--a-ink-3);
        }
        .net-foot > div:first-child { max-width: 640px; }
        @media (max-width: 720px) {
          .net-totals { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
