"use client";

import { useEffect, useState } from "react";

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  totalCost: number;
  ordersToday: number;
  revenueToday: number;
  byPlatform: { platform: string; orders: number; revenue: number }[];
  byCurrency: { currency: string; orders: number; revenue: number }[];
  byStatus: { status: string; count: number }[];
  last30days: { date: string; revenue: number }[];
  adCosts: number;
}

const eur = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export default function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pw = localStorage.getItem("admin_pw") ?? "";
    fetch("/api/admin/analytics", {
      headers: { Authorization: `Bearer ${pw}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        if (!Array.isArray(d.last30days)) throw new Error("Invalid analytics payload");
        return d;
      })
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>
        Chargement des analytics...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>
        Erreur lors du chargement des donnees.
      </div>
    );
  }

  const profit = (data.totalRevenue - data.totalCost - data.adCosts) / 100;
  const revenue = data.totalRevenue / 100;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const maxRev = Math.max(...data.last30days.map((d) => d.revenue), 1);

  const cardStyle: React.CSSProperties = {
    background: "var(--a-card)",
    border: "1px solid var(--a-line)",
    borderRadius: 10,
    padding: "16px 20px",
  };

  const kpiVal: React.CSSProperties = {
    fontSize: 26,
    fontWeight: 800,
    color: "var(--a-ink)",
    letterSpacing: "-0.02em",
    marginTop: 4,
  };

  const kpiLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--a-ink-3)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  return (
    <div>
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        <div style={cardStyle}>
          <div style={kpiLabel}>Total commandes</div>
          <div style={kpiVal}>{data.totalOrders}</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabel}>Revenu total</div>
          <div style={kpiVal}>{eur(data.totalRevenue)}</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabel}>Cout total</div>
          <div style={kpiVal}>{eur(data.totalCost + data.adCosts)}</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabel}>Profit</div>
          <div style={kpiVal}>{profit.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} &euro;</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabel}>Marge</div>
          <div style={kpiVal}>{margin.toFixed(1)}%</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabel}>Commandes aujourd&apos;hui</div>
          <div style={kpiVal}>{data.ordersToday}</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabel}>Revenu aujourd&apos;hui</div>
          <div style={kpiVal}>{eur(data.revenueToday)}</div>
        </div>
      </div>

      {/* Par plateforme */}
      <div style={{ ...cardStyle, marginBottom: 18 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "var(--a-ink)" }}>Par plateforme</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--a-line)" }}>
              <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--a-ink-3)", fontWeight: 600 }}>Plateforme</th>
              <th style={{ textAlign: "right", padding: "8px 4px", color: "var(--a-ink-3)", fontWeight: 600 }}>Commandes</th>
              <th style={{ textAlign: "right", padding: "8px 4px", color: "var(--a-ink-3)", fontWeight: 600 }}>Revenu</th>
            </tr>
          </thead>
          <tbody>
            {data.byPlatform.map((p) => (
              <tr key={p.platform} style={{ borderBottom: "1px solid var(--a-line)" }}>
                <td style={{ padding: "8px 4px", fontWeight: 600, color: "var(--a-ink)" }}>{p.platform}</td>
                <td style={{ padding: "8px 4px", textAlign: "right", color: "var(--a-ink)" }}>{p.orders}</td>
                <td style={{ padding: "8px 4px", textAlign: "right", fontWeight: 700, color: "var(--a-ink)" }}>{eur(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Par statut */}
      <div style={{ ...cardStyle, marginBottom: 18 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "var(--a-ink)" }}>Par statut</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--a-line)" }}>
              <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--a-ink-3)", fontWeight: 600 }}>Statut</th>
              <th style={{ textAlign: "right", padding: "8px 4px", color: "var(--a-ink-3)", fontWeight: 600 }}>Nombre</th>
            </tr>
          </thead>
          <tbody>
            {data.byStatus.map((s) => (
              <tr key={s.status} style={{ borderBottom: "1px solid var(--a-line)" }}>
                <td style={{ padding: "8px 4px", fontWeight: 600, color: "var(--a-ink)" }}>{s.status}</td>
                <td style={{ padding: "8px 4px", textAlign: "right", color: "var(--a-ink)" }}>{s.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Par devise */}
      <div style={{ ...cardStyle, marginBottom: 18 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "var(--a-ink)" }}>Par devise</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--a-line)" }}>
              <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--a-ink-3)", fontWeight: 600 }}>Devise</th>
              <th style={{ textAlign: "right", padding: "8px 4px", color: "var(--a-ink-3)", fontWeight: 600 }}>Commandes</th>
              <th style={{ textAlign: "right", padding: "8px 4px", color: "var(--a-ink-3)", fontWeight: 600 }}>Revenu</th>
            </tr>
          </thead>
          <tbody>
            {data.byCurrency.map((c) => (
              <tr key={c.currency} style={{ borderBottom: "1px solid var(--a-line)" }}>
                <td style={{ padding: "8px 4px", fontWeight: 600, color: "var(--a-ink)" }}>{c.currency}</td>
                <td style={{ padding: "8px 4px", textAlign: "right", color: "var(--a-ink)" }}>{c.orders}</td>
                <td style={{ padding: "8px 4px", textAlign: "right", fontWeight: 700, color: "var(--a-ink)" }}>{eur(c.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Last 30 days chart */}
      <div style={{ ...cardStyle }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--a-ink)" }}>30 derniers jours</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120 }}>
          {data.last30days.map((d) => (
            <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
              <div
                style={{
                  width: "100%",
                  background: "var(--a-accent)",
                  borderRadius: "3px 3px 0 0",
                  height: `${(d.revenue / maxRev) * 100}%`,
                  minHeight: d.revenue > 0 ? 2 : 0,
                }}
                title={`${d.date}: ${eur(d.revenue)}`}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
          {data.last30days.map((d, i) => (
            <div key={d.date} style={{ flex: 1, textAlign: "center", fontSize: 8, color: "var(--a-ink-3)", overflow: "hidden" }}>
              {i % 5 === 0 ? d.date.slice(5) : ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
