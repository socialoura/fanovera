"use client";

import { useEffect, useMemo, useState } from "react";
import { Ic } from "../icons";
import { LineChart, Sparkline, Donut, Heatmap } from "../charts";

type Series30Point = { date: string; revenue: number; cost: number; ads: number };
type Platform = { platform: string; orders: number; revenue: number; share: number };
type Currency = { currency: string; orders: number; revenue: number };
type StatusBucket = { status: string; count: number };
type Country = { country: string; orders: number; revenue: number };
type Client = { email: string; orders: number; revenue: number; country: string };
type ServicePerf = {
  service: string;
  orders: number;
  revenue: number;
  platform?: string;
  visitors?: number;
  revenuePerVisitorCents?: number;
};
type AdsDay = { date: string; cost: number };

interface AnalyticsData {
  range: number;
  fromDate: string;
  toDate: string;
  totalOrders: number;
  totalRevenue: number;
  totalCost: number;
  adCosts: number;
  profit: number;
  margin: number;
  ordersToday: number;
  revenueToday: number;
  byPlatform: Platform[];
  byCurrency: Currency[];
  byStatus: StatusBucket[];
  last30days: Series30Point[];
  deltas: { revenue: number; profit: number; margin: number; orders: number; customers: number };
  customers: { unique: number; aov: number; ltv: number; avgOrders: number; recurrence: number };
  topCountries: Country[];
  topClients: Client[];
  peakHours: number[];
  servicePerf: ServicePerf[];
  adsLast7: AdsDay[];
}

const PLATFORM_BRAND: Record<string, { color: string; icon: string }> = {
  instagram: { color: "#E1306C", icon: "I" },
  tiktok: { color: "#000000", icon: "T" },
  youtube: { color: "#FF0000", icon: "Y" },
  facebook: { color: "#1877F2", icon: "F" },
  twitter: { color: "#1DA1F2", icon: "X" },
  x: { color: "#1DA1F2", icon: "X" },
  spotify: { color: "#1DB954", icon: "S" },
  linkedin: { color: "#0A66C2", icon: "L" },
  twitch: { color: "#9146FF", icon: "T" },
};

const STATUS_COLOR: Record<string, string> = {
  delivered: "#2EA86F",
  processing: "#3B5BDB",
  paid: "#7C3AED",
  pending: "#C68A19",
  failed: "#E14444",
  partial: "#E04A8C",
};

const STATUS_LABEL: Record<string, string> = {
  delivered: "Livrée",
  processing: "En cours",
  paid: "Payée",
  pending: "En attente",
  failed: "Échouée",
  partial: "Partielle",
};

const COUNTRY_FLAGS: Record<string, string> = {
  FR: "🇫🇷", US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", ES: "🇪🇸", IT: "🇮🇹", PT: "🇵🇹", BR: "🇧🇷",
  TR: "🇹🇷", MX: "🇲🇽", CO: "🇨🇴", AR: "🇦🇷", CL: "🇨🇱", CA: "🇨🇦", BE: "🇧🇪", CH: "🇨🇭",
  NL: "🇳🇱", PL: "🇵🇱", AU: "🇦🇺", JP: "🇯🇵",
};

const CURRENCY_FLAG: Record<string, string> = {
  EUR: "🇪🇺", USD: "🇺🇸", GBP: "🇬🇧", BRL: "🇧🇷", TRY: "🇹🇷", MXN: "🇲🇽",
  CAD: "🇨🇦", AUD: "🇦🇺", CHF: "🇨🇭", SEK: "🇸🇪",
};

const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
const fmtMoneyCents = (cents: number) => (cents / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 });
const fmtMoneyCents2 = (cents: number) => (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function flagFor(code: string) {
  return COUNTRY_FLAGS[code.toUpperCase()] || "🏳️";
}

function countryFlag(code: string | null | undefined): string {
  const cc = (code || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "🏳️";
  return COUNTRY_FLAGS[cc] || String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

function todayISO() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

type RangeMode = 7 | 30 | 90 | "custom";
type PlatformFilter =
  | "all" | "instagram" | "tiktok" | "youtube" | "facebook"
  | "twitter" | "spotify" | "linkedin" | "twitch";

const PLATFORM_FILTER_OPTIONS: Array<{ value: PlatformFilter; label: string }> = [
  { value: "all", label: "Tous les réseaux" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "Twitter / X" },
  { value: "spotify", label: "Spotify" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitch", label: "Twitch" },
];

function shiftDayISO(isoDate: string, delta: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [range, setRange] = useState<RangeMode>(30);
  const [customFrom, setCustomFrom] = useState<string>(() => shiftDayISO(todayISO(), -29));
  const [customTo, setCustomTo] = useState<string>(() => todayISO());
  const [platform, setPlatform] = useState<PlatformFilter>("all");

  // Ads cost entry form state.
  const [adsDate, setAdsDate] = useState<string>(todayISO());
  const [adsAmount, setAdsAmount] = useState<string>("");
  const [adsSaving, setAdsSaving] = useState(false);
  const [adsError, setAdsError] = useState<string | null>(null);

  const fetchData = async (
    rangeMode: RangeMode = range,
    platformFilter: PlatformFilter = platform,
    from: string = customFrom,
    to: string = customTo,
  ) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_pw") ?? "";
      const params = new URLSearchParams();
      if (rangeMode === "custom") {
        params.set("from", from);
        params.set("to", to);
      } else {
        params.set("range", String(rangeMode));
      }
      if (platformFilter !== "all") params.set("platform", platformFilter);
      const res = await fetch(`/api/admin/analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = (await res.json()) as AnalyticsData;
      setData(d);
      setRefreshedAt(new Date());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const submitAdsCost = async () => {
    setAdsError(null);
    const raw = adsAmount.replace(",", ".").trim();
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount < 0) {
      setAdsError("Montant invalide.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(adsDate)) {
      setAdsError("Date invalide.");
      return;
    }
    setAdsSaving(true);
    try {
      const token = localStorage.getItem("admin_pw") ?? "";
      const res = await fetch("/api/admin/ad-costs", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ date: adsDate, costCents: Math.round(amount * 100) }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      setAdsAmount("");
      await fetchData();
    } catch (err) {
      setAdsError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setAdsSaving(false);
    }
  };

  const deleteAdsCost = async (date: string) => {
    if (!confirm(`Supprimer le coût publicitaire du ${date} ?`)) return;
    try {
      const token = localStorage.getItem("admin_pw") ?? "";
      const res = await fetch(`/api/admin/ad-costs?date=${encodeURIComponent(date)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  const editAdsCost = (date: string, cost: number) => {
    setAdsDate(date);
    setAdsAmount((cost / 100).toFixed(2).replace(".", ","));
    setAdsError(null);
  };

  useEffect(() => {
    // Skip refetch when in custom mode but the dates aren't both set yet —
    // <input type="date"> can briefly hold an empty string while editing.
    if (range === "custom" && (!customFrom || !customTo || customFrom > customTo)) return;
    fetchData(range, platform, customFrom, customTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, platform, customFrom, customTo]);

  // Sparkline series derived from the 30-day window.
  const sparklines = useMemo(() => {
    if (!data) return null;
    const revVals = data.last30days.map((d) => d.revenue);
    const profitVals = data.last30days.map((d) => d.revenue - d.cost - d.ads);
    const marginVals = data.last30days.map((d) =>
      d.revenue > 0 ? Math.round(((d.revenue - d.cost - d.ads) / d.revenue) * 100) : 0,
    );
    const ordersVals = data.last30days.map((d) => Math.max(1, Math.round(d.revenue / Math.max(1, (data.totalRevenue / Math.max(1, data.totalOrders)) || 1))));
    return { revVals, profitVals, marginVals, ordersVals };
  }, [data]);

  if (loading && !data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>
        Chargement des analytics...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>
        Erreur lors du chargement des données.
      </div>
    );
  }

  const refreshedAgo = refreshedAt
    ? (() => {
        const m = Math.floor((Date.now() - refreshedAt.getTime()) / 60000);
        return m === 0 ? "à l'instant" : `il y a ${m} min`;
      })()
    : "—";

  // Day count for subtitle interpolation ("· N jours"). The API returns the
  // resolved day count under `range`; we trust that as the source of truth.
  const rangeDaysLabel = data.range;

  const statusForDonut = data.byStatus.map((b) => ({
    key: b.status,
    label: STATUS_LABEL[b.status] || b.status,
    value: b.count,
    color: STATUS_COLOR[b.status] || "#9A9285",
  }));

  const seriesForLineChart = data.last30days.map((d, i) => ({
    d: i,
    rev: d.revenue / 100, // cents → EUR
    smm: d.cost / 100,
    ads: d.ads / 100,
  }));

  return (
    <div>
      {/* Top action row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label className="chip" style={{ cursor: "pointer", paddingRight: 4 }}>
            {Ic.calendar()}
            <select
              value={String(range)}
              onChange={(e) => {
                const v = e.target.value;
                setRange(v === "custom" ? "custom" : (Number(v) as RangeMode));
              }}
              disabled={loading}
              style={{
                background: "transparent",
                border: 0,
                font: "inherit",
                color: "inherit",
                cursor: "pointer",
                outline: "none",
                paddingRight: 4,
              }}
            >
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
              <option value="custom">Personnalisé</option>
            </select>
          </label>
          {range === "custom" && (
            <>
              <input
                type="date"
                value={customFrom}
                max={customTo || todayISO()}
                onChange={(e) => setCustomFrom(e.target.value)}
                disabled={loading}
                className="chip"
                style={{ cursor: "pointer", font: "inherit" }}
              />
              <span style={{ alignSelf: "center", color: "var(--a-ink-3)" }}>→</span>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                max={todayISO()}
                onChange={(e) => setCustomTo(e.target.value)}
                disabled={loading}
                className="chip"
                style={{ cursor: "pointer", font: "inherit" }}
              />
            </>
          )}
          <label className="chip" style={{ cursor: "pointer", paddingRight: 4 }}>
            {Ic.filter()}
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as PlatformFilter)}
              disabled={loading}
              style={{
                background: "transparent",
                border: 0,
                font: "inherit",
                color: "inherit",
                cursor: "pointer",
                outline: "none",
                paddingRight: 4,
              }}
            >
              {PLATFORM_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <div className="chip">{Ic.refresh()} Mis à jour {refreshedAgo}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => fetchData()} disabled={loading}>
            {Ic.refresh()} Rafraîchir
          </button>
        </div>
      </div>

      {/* Hero KPIs */}
      <div className="kpi-grid">
        <div className="kpi featured">
          <div className="kpi-label" style={{ color: "rgba(232,228,216,0.65)" }}>● REVENU TOTAL</div>
          <div className="kpi-value"><span className="currency">€</span>{fmtMoneyCents(data.totalRevenue)}</div>
          <div className="kpi-foot">
            <span className={"delta " + (data.deltas.revenue >= 0 ? "up" : "down")}>
              {data.deltas.revenue >= 0 ? "▲" : "▼"} {Math.abs(data.deltas.revenue)}%
            </span>
            <span className="kpi-sub">vs. mois précédent</span>
          </div>
          {sparklines && sparklines.revVals.length > 1 && <Sparkline values={sparklines.revVals} color="#FF8FBC" w={120} h={40} />}
        </div>
        <div className="kpi">
          <div className="kpi-label">PROFIT NET</div>
          <div className="kpi-value"><span className="currency">€</span>{fmtMoneyCents(data.profit)}</div>
          <div className="kpi-foot">
            <span className={"delta " + (data.deltas.profit >= 0 ? "up" : "down")}>
              {data.deltas.profit >= 0 ? "▲" : "▼"} {Math.abs(data.deltas.profit)}%
            </span>
            <span className="kpi-sub">après SMM + Ads</span>
          </div>
          {sparklines && sparklines.profitVals.length > 1 && <Sparkline values={sparklines.profitVals} color="#2EA86F" w={90} h={30} />}
        </div>
        <div className="kpi">
          <div className="kpi-label">MARGE</div>
          <div className="kpi-value">{data.margin.toFixed(1)}<span className="currency" style={{ top: 0 }}>%</span></div>
          <div className="kpi-foot">
            <span className={"delta " + (data.deltas.margin >= 0 ? "up" : "down")}>
              {data.deltas.margin >= 0 ? "▲" : "▼"} {Math.abs(data.deltas.margin)} pts
            </span>
            <span className="kpi-sub">objectif 35%</span>
          </div>
          {sparklines && sparklines.marginVals.length > 1 && <Sparkline values={sparklines.marginVals} color="#3B5BDB" w={90} h={30} />}
        </div>
        <div className="kpi">
          <div className="kpi-label">COMMANDES</div>
          <div className="kpi-value">{fmt(data.totalOrders)}</div>
          <div className="kpi-foot">
            <span className={"delta " + (data.deltas.orders >= 0 ? "up" : "down")}>
              {data.deltas.orders >= 0 ? "▲" : "▼"} {Math.abs(data.deltas.orders)}%
            </span>
            <span className="kpi-sub">{data.ordersToday} aujourd&apos;hui</span>
          </div>
          {sparklines && sparklines.ordersVals.length > 1 && <Sparkline values={sparklines.ordersVals} color="#7C3AED" w={90} h={30} />}
        </div>
      </div>

      {/* Today strip */}
      <div
        className="card"
        style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 28, padding: "14px 20px", background: "linear-gradient(90deg, #FFF 0%, #FBF1F5 100%)", flexWrap: "wrap" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--a-brand)", display: "grid", placeItems: "center", color: "white" }}>{Ic.zap(18)}</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--a-ink-3)", letterSpacing: "0.08em" }}>AUJOURD&apos;HUI</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--a-ink-2)" }}>
              {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · live
            </div>
          </div>
        </div>
        <div style={{ height: 36, width: 1, background: "var(--a-line)" }} />
        <div>
          <div style={{ fontSize: 11, color: "var(--a-ink-3)", fontWeight: 700, letterSpacing: "0.04em" }}>COMMANDES</div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>{data.ordersToday}</div>
        </div>
        <div style={{ height: 36, width: 1, background: "var(--a-line)" }} />
        <div>
          <div style={{ fontSize: 11, color: "var(--a-ink-3)", fontWeight: 700, letterSpacing: "0.04em" }}>REVENU</div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{fmtMoneyCents(data.revenueToday)} €</div>
        </div>
        <div style={{ height: 36, width: 1, background: "var(--a-line)" }} />
        <div>
          <div style={{ fontSize: 11, color: "var(--a-ink-3)", fontWeight: 700, letterSpacing: "0.04em" }}>PANIER MOYEN</div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
            {data.ordersToday > 0 ? fmtMoneyCents(Math.round(data.revenueToday / data.ordersToday)) : "0"} €
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span className="pill green"><span className="dot" />Live</span>
        </div>
      </div>

      {/* Revenue chart + Status donut */}
      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Revenu, coûts & profit · {rangeDaysLabel} jours</div>
              <div className="card-sub">Évolution du CA, coût SMM (BulkFollows) et coût Google Ads</div>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12, fontWeight: 600, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 2, background: "#E04A8C", borderRadius: 2 }} />Revenu</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 2, background: "#3B5BDB", borderRadius: 2 }} />Coût SMM</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 2, background: "#C68A19", borderRadius: 2 }} />Coût Ads</span>
            </div>
          </div>
          {seriesForLineChart.length >= 2 ? <LineChart series={seriesForLineChart} /> : <div className="order-empty">Pas assez de données.</div>}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Statut des commandes</div>
              <div className="card-sub">Répartition sur {rangeDaysLabel} jours</div>
            </div>
          </div>
          {statusForDonut.length > 0 ? (
            <div className="donut-wrap">
              <Donut data={statusForDonut} />
              <div className="donut-legend">
                {statusForDonut.map((s) => (
                  <div className="donut-leg-row" key={s.key}>
                    <span className="donut-swatch" style={{ background: s.color }} />
                    <span className="donut-leg-label">{s.label}</span>
                    <span className="donut-leg-val">{s.value.toLocaleString("fr-FR")}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="order-empty">Pas de commandes sur {rangeDaysLabel} jours.</div>
          )}
        </div>
      </div>

      {/* Customer KPIs */}
      <div className="section-title">Clients</div>
      <div className="grid-4">
        <div className="card" style={{ padding: "16px 18px" }}>
          <div className="kpi-label">Clients uniques</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 6 }}>{fmt(data.customers.unique)}</div>
          <div className="kpi-sub" style={{ marginTop: 6 }}>sur {rangeDaysLabel} jours · {data.deltas.customers >= 0 ? "+" : ""}{data.deltas.customers}% vs. période préc.</div>
        </div>
        <div className="card" style={{ padding: "16px 18px" }}>
          <div className="kpi-label">Panier moyen</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 6 }}>{fmtMoneyCents2(data.customers.aov)} €</div>
          <div className="kpi-sub" style={{ marginTop: 6 }}>AOV période</div>
        </div>
        <div className="card" style={{ padding: "16px 18px" }}>
          <div className="kpi-label">Dépense / client</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 6 }}>{fmtMoneyCents2(data.customers.ltv)} €</div>
          <div className="kpi-sub" style={{ marginTop: 6 }}>LTV 30j</div>
        </div>
        <div className="card" style={{ padding: "16px 18px" }}>
          <div className="kpi-label">Récurrence</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 6 }}>{data.customers.recurrence}%</div>
          <div className="kpi-sub" style={{ marginTop: 6 }}>{data.customers.avgOrders} cmd / client</div>
        </div>
      </div>

      {/* Platforms + Peak hours */}
      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Revenu par plateforme</div>
              <div className="card-sub">Classement par CA · {rangeDaysLabel} jours</div>
            </div>
            <span className="pill ink">{data.byPlatform.length} actifs</span>
          </div>
          <div>
            {data.byPlatform.length === 0 && <div className="order-empty">Pas de données.</div>}
            {data.byPlatform.map((p) => {
              const top = data.byPlatform[0]?.revenue || 1;
              const pct = (p.revenue / top) * 100;
              const brand = PLATFORM_BRAND[p.platform.toLowerCase()] || { color: "#9A9285", icon: p.platform.charAt(0).toUpperCase() };
              return (
                <div className="plat-row" key={p.platform}>
                  <div className="plat-icon" style={{ background: brand.color, color: brand.color === "#FFFC00" || brand.color === "#000000" ? (brand.color === "#000000" ? "white" : "#000") : "white" }}>
                    {brand.icon}
                  </div>
                  <div>
                    <div className="plat-name" style={{ textTransform: "capitalize" }}>{p.platform}</div>
                    <div style={{ fontSize: 11, color: "var(--a-ink-3)", fontWeight: 600, marginTop: 2 }}>{p.orders} commandes</div>
                  </div>
                  <div className="plat-bar-bg">
                    <div className="plat-bar-fill" style={{ width: pct + "%", background: brand.color }} />
                  </div>
                  <div className="num" style={{ fontWeight: 700, color: "var(--a-ink)" }}>{fmtMoneyCents(p.revenue)} €</div>
                  <div className="num" style={{ color: "var(--a-ink-3)" }}>{p.share}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Heures de pointe (UTC)</div>
              <div className="card-sub">Volume de commandes par heure · {rangeDaysLabel} derniers jours</div>
            </div>
            {(() => {
              const max = Math.max(...data.peakHours);
              const idx = data.peakHours.indexOf(max);
              return max > 0 ? <span className="pill">★ Pic à {idx}h UTC</span> : null;
            })()}
          </div>
          <Heatmap values={data.peakHours.length === 24 ? data.peakHours : Array.from({ length: 24 }, () => 0)} />
        </div>
      </div>

      {/* Currencies */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <div>
            <div className="card-title">Revenu par devise</div>
            <div className="card-sub">Devises supportées · valeurs converties en EUR</div>
          </div>
        </div>
        {data.byCurrency.length === 0 ? (
          <div className="order-empty">Pas de données.</div>
        ) : (
          <div className="ccy-grid">
            {data.byCurrency.map((c) => (
              <div className="ccy-card" key={c.currency}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="ccy-flag">{CURRENCY_FLAG[c.currency] || "💱"}</span>
                  <span className="ccy-code">{c.currency}</span>
                </div>
                <div className="ccy-amount">{(c.revenue / 1000 / 100).toFixed(1)}k €</div>
                <div className="ccy-orders">{c.orders} cmd</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top countries + Top clients */}
      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Top pays par revenu</div>
              <div className="card-sub">Commandes · revenu ({rangeDaysLabel} jours)</div>
            </div>
          </div>
          {data.topCountries.length === 0 ? (
            <div className="order-empty">Pas de données.</div>
          ) : (
            <div>
              {data.topCountries.map((c, i) => (
                <div className="country-row" key={i}>
                  <div className="flag" style={{ fontSize: 16 }}>{countryFlag(c.country)}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{c.country.toUpperCase()}</div>
                    <div style={{ fontSize: 11, color: "var(--a-ink-3)", marginTop: 2 }}>{c.orders} commande{c.orders > 1 ? "s" : ""}</div>
                  </div>
                  <div className="num" style={{ fontWeight: 700 }}>{fmtMoneyCents(c.revenue)} €</div>
                  <div className="num" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Top 10 clients</div>
              <div className="card-sub">Plus gros spenders (tous les temps)</div>
            </div>
          </div>
          {data.topClients.length === 0 ? (
            <div className="order-empty">Pas de clients.</div>
          ) : (
            <table className="table" style={{ margin: "-4px -4px 0" }}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th className="num">Cmd</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.topClients.map((c, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--a-paper-2)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800, color: "var(--a-ink-3)" }}>#{i + 1}</div>
                        <div className="mono" style={{ fontSize: 12 }}>{c.email}</div>
                        {c.country && <span style={{ fontSize: 14 }}>{flagFor(c.country)}</span>}
                      </div>
                    </td>
                    <td className="num">{c.orders}</td>
                    <td className="num" style={{ fontWeight: 700, color: "var(--a-ink)" }}>{fmtMoneyCents(c.revenue)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Service performance */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <div>
            <div className="card-title">Performance par service</div>
            <div className="card-sub">
              Revenu / cmd & revenu / visite plateforme · {rangeDaysLabel} jours · trié par rentabilité par visite
            </div>
          </div>
        </div>
        {data.servicePerf.length === 0 ? (
          <div className="order-empty">Pas de données service.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Plateforme</th>
                <th className="num">Commandes</th>
                <th className="num">Revenu total</th>
                <th className="num">Revenu / cmd</th>
                <th className="num">Visites 30j</th>
                <th className="num">Revenu / visite</th>
              </tr>
            </thead>
            <tbody>
              {data.servicePerf.map((s, i) => {
                const visits = s.visitors || 0;
                const rpv = s.revenuePerVisitorCents || 0;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{s.service}</td>
                    <td style={{ textTransform: "capitalize", color: "var(--a-ink-3)" }}>{s.platform || "—"}</td>
                    <td className="num">{s.orders}</td>
                    <td className="num" style={{ fontWeight: 700 }}>{fmtMoneyCents(s.revenue)} €</td>
                    <td className="num">{s.orders > 0 ? fmtMoneyCents2(Math.round(s.revenue / s.orders)) : "0,00"} €</td>
                    <td className="num" style={{ color: "var(--a-ink-3)" }}>{visits > 0 ? fmt(visits) : "—"}</td>
                    <td className="num" style={{ fontWeight: 700, color: rpv > 0 ? "var(--a-ink)" : "var(--a-ink-3)" }}>
                      {visits > 0 ? `${fmtMoneyCents2(rpv)} €` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Ads costs */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <div>
            <div className="card-title">Coûts publicitaires · 7 jours</div>
            <div className="card-sub">Saisie quotidienne · une ligne par date</div>
          </div>
        </div>

        {/* Inline entry form */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            padding: "12px 14px",
            background: "var(--a-paper-2)",
            border: "1px solid var(--a-line)",
            borderRadius: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="label" style={{ margin: 0 }}>Date</label>
            <input
              type="date"
              className="input"
              value={adsDate}
              onChange={(e) => setAdsDate(e.target.value)}
              style={{ width: 170 }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="label" style={{ margin: 0 }}>Coût total (€)</label>
            <input
              type="text"
              inputMode="decimal"
              className="input"
              placeholder="34,99"
              value={adsAmount}
              onChange={(e) => setAdsAmount(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitAdsCost(); }}
              style={{ width: 140 }}
            />
          </div>
          <button
            className="btn primary"
            onClick={submitAdsCost}
            disabled={adsSaving}
            style={{ height: 38 }}
          >
            {adsSaving ? "..." : <>{Ic.plus()} Enregistrer</>}
          </button>
          {adsError && (
            <div style={{ color: "var(--a-red)", fontSize: 12, fontWeight: 600, marginLeft: 4 }}>
              {adsError}
            </div>
          )}
          <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--a-ink-3)", fontWeight: 600 }}>
            Une saisie écrase la valeur existante de cette date
          </div>
        </div>

        {data.adsLast7.length === 0 ? (
          <div className="order-empty">Aucun coût publicitaire saisi sur 7 jours.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">Coût total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.adsLast7.map((a) => (
                <tr key={a.date}>
                  <td style={{ fontWeight: 600 }}>{new Date(a.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}</td>
                  <td className="num" style={{ fontWeight: 800 }}>{fmtMoneyCents(a.cost)} €</td>
                  <td className="num" style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button
                      className="btn ghost"
                      style={{ padding: "4px 10px", fontSize: 11 }}
                      onClick={() => editAdsCost(a.date, a.cost)}
                      title="Recharger dans le formulaire"
                    >
                      {Ic.edit()} Éditer
                    </button>
                    <button
                      className="btn ghost danger"
                      style={{ padding: "4px 10px", fontSize: 11, color: "var(--a-red)", borderColor: "var(--a-red)" }}
                      onClick={() => deleteAdsCost(a.date)}
                    >
                      Suppr.
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
