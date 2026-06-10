"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Ic } from "./components/icons";
import AnalyticsView from "./components/views/AnalyticsView";
import CohortsView from "./components/views/CohortsView";
import SourcesView from "./components/views/SourcesView";
import AdsROASView from "./components/views/AdsROASView";
import NetworkTodayView from "./components/views/NetworkTodayView";
import SearchTermsView from "./components/views/SearchTermsView";
import AdsCohortsView from "./components/views/AdsCohortsView";
import OrdersView from "./components/views/OrdersView";
import RecoveryView from "./components/views/RecoveryView";
import PricingView from "./components/views/PricingView";
import CombosView from "./components/views/CombosView";
import UpsellsView from "./components/views/UpsellsView";
import PromoCodesView from "./components/views/PromoCodesView";
import SmmView from "./components/views/SmmView";
import SupportView from "./components/views/SupportView";
import OutreachView from "./components/views/OutreachView";
import I18nSyncView from "./components/views/I18nSyncView";
import MarketingModeView from "./components/views/MarketingModeView";
import PromoFlowView from "./components/views/PromoFlowView";
import Tt2PacksView from "./components/views/Tt2PacksView";
import CheckoutFlowView from "./components/views/CheckoutFlowView";
import PricingExperimentsView from "./components/views/PricingExperimentsView";
import EmailFlowsView from "./components/views/EmailFlowsView";
import ViewErrorBoundary from "./components/ViewErrorBoundary";

/** Below this BulkFollows balance (USD) the sidebar flags it red — at 0 every
 * delivery silently fails, so we want it impossible to miss. */
const LOW_BALANCE_THRESHOLD = 200;

/** EUR cents → "12,34 €" (FR formatting). */
function fmtEur(cents: number): string {
  return ((Number(cents) || 0) / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
}

type ViewId = "analytics" | "cohorts" | "sources" | "adsRoas" | "networkToday" | "searchTerms" | "adsCohorts" | "orders" | "recovery" | "pricing" | "abPricing" | "promoFlow" | "tt2Packs" | "checkoutFlow" | "combos" | "promo" | "upsells" | "smm" | "i18n" | "marketing" | "emails" | "outreach" | "support";

type AdminAnalyticsSummary = {
  ordersToday?: number;
  revenueToday?: number;
  costToday?: number;
  refundsToday?: number;
  stripeFeesToday?: number;
};

type TodayKpis = {
  orders: number;
  revenue: number;
  cost: number;
  refunds: number;
  stripeFees: number;
};

const NAV: { id: ViewId; label: string; icon: () => React.ReactNode; sub: string }[] = [
  { id: "analytics", label: "Analytics", icon: () => Ic.dashboard(), sub: "Vue d'ensemble" },
  { id: "cohorts", label: "Cohortes", icon: () => Ic.layers(), sub: "Rétention D7/D30/D90" },
  { id: "sources", label: "Sources", icon: () => Ic.filter(), sub: "LTV par acquisition" },
  { id: "adsRoas", label: "Ads ROAS", icon: () => Ic.zap(), sub: "ROAS réel Google Ads" },
  { id: "networkToday", label: "Réseaux jour", icon: () => Ic.zap(), sub: "Dépense vs CA par réseau (jour)" },
  { id: "searchTerms", label: "Search Terms", icon: () => Ic.filter(), sub: "Termes recherchés payants" },
  { id: "adsCohorts", label: "Ads Cohortes", icon: () => Ic.layers(), sub: "ROAS D7/D30/D90" },
  { id: "orders", label: "Commandes", icon: () => Ic.cart(), sub: "Gestion clients" },
  { id: "recovery", label: "Rattrapage", icon: () => Ic.refresh(), sub: "Commandes mal routées" },
  { id: "pricing", label: "Prix", icon: () => Ic.tag(), sub: "Packs multi-devises" },
  { id: "abPricing", label: "A/B Prix", icon: () => Ic.filter(), sub: "Tests pricing" },
  { id: "promoFlow", label: "A/B Promo", icon: () => Ic.filter(), sub: "Flow username-first" },
  { id: "tt2Packs", label: "A/B Packs", icon: () => Ic.filter(), sub: "Slider vs pastilles (tiktok-2)" },
  { id: "checkoutFlow", label: "A/B Checkout", icon: () => Ic.filter(), sub: "Page unique IG" },
  { id: "combos", label: "Combos", icon: () => Ic.layers(), sub: "Packs combinés" },
  { id: "promo", label: "Codes promo", icon: () => Ic.tag(), sub: "Réductions + utilisations" },
  { id: "upsells", label: "Upsells", icon: () => Ic.zap(), sub: "Ventes additionnelles" },
  { id: "smm", label: "SMM", icon: () => Ic.cog(), sub: "BulkFollows" },
  { id: "i18n", label: "i18n", icon: () => Ic.edit(), sub: "Traductions" },
  { id: "marketing", label: "Mode site", icon: () => Ic.zap(), sub: "Copy FR/EN" },
  { id: "emails", label: "Emails", icon: () => Ic.bell(), sub: "Relances automatiques" },
  { id: "outreach", label: "Outreach", icon: () => Ic.mail(), sub: "Emailing + réponses" },
  { id: "support", label: "Support", icon: () => Ic.chat(), sub: "Messages clients" },
];

export default function AdminClient() {
  const [view, setView] = useState<ViewId>("analytics");
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [ordersToday, setOrdersToday] = useState(0);
  const [pendingSupport, setPendingSupport] = useState(0);
  const [bfBalance, setBfBalance] = useState<number | null>(null);
  const [today, setToday] = useState<TodayKpis | null>(null);
  // Live Google Ads spend today (EUR), pulled from the network-today endpoint
  // (which queries the Ads API live). null = not yet loaded / unreachable.
  const [adsCostToday, setAdsCostToday] = useState<number | null>(null);
  const meta = NAV.find((n) => n.id === view)!;

  // Poll support inbox count. Deps are [authorized] only — keying on `view`
  // would tear down and recreate the interval on every tab switch.
  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/support/pending-count", {
          headers: { Authorization: `Bearer ${localStorage.getItem("admin_pw") || ""}` },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (!cancelled) setPendingSupport(Number(data.count) || 0);
      } catch { /* ignore */ }
    };
    load();
    const id = window.setInterval(load, 30_000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [authorized]);

  // Keep the orders-today badge (B3) and the BulkFollows balance (U1) fresh —
  // both go stale otherwise (ordersToday was only set at login).
  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    const token = () => localStorage.getItem("admin_pw") || "";
    const load = async () => {
      try {
        const [analyticsRes, smmRes] = await Promise.all([
          fetch("/api/admin/analytics", { headers: { Authorization: `Bearer ${token()}` } }),
          fetch("/api/admin/smm", { headers: { Authorization: `Bearer ${token()}` } }),
        ]);
        if (analyticsRes.ok) {
          const data = (await analyticsRes.json()) as AdminAnalyticsSummary;
          if (!cancelled) {
            setOrdersToday(Number(data.ordersToday) || 0);
            setToday({
              orders: Number(data.ordersToday) || 0,
              revenue: Number(data.revenueToday) || 0,
              cost: Number(data.costToday) || 0,
              refunds: Number(data.refundsToday) || 0,
              stripeFees: Number(data.stripeFeesToday) || 0,
            });
          }
        }
        if (smmRes.ok) {
          const data = (await smmRes.json()) as { balance?: string | number | null };
          const bal = data?.balance == null ? null : Number(data.balance);
          if (!cancelled) setBfBalance(Number.isFinite(bal as number) ? (bal as number) : null);
        }
      } catch { /* ignore */ }
    };
    load();
    const id = window.setInterval(load, 60_000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [authorized]);

  // Live Google Ads spend today. Separate from the 60s KPI poll because it hits
  // the Ads API (heavier, can take a few seconds) — refreshed every 5 min, which
  // is plenty for a running daily total.
  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    const token = () => localStorage.getItem("admin_pw") || "";
    const load = async () => {
      try {
        const res = await fetch("/api/admin/network-today", {
          headers: { Authorization: `Bearer ${token()}` },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { totals?: { costCents?: number } };
        const cents = Number(data?.totals?.costCents);
        if (!cancelled) setAdsCostToday(Number.isFinite(cents) ? cents / 100 : null);
      } catch { /* ignore */ }
    };
    load();
    const id = window.setInterval(load, 300_000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [authorized]);

  useEffect(() => {
    const saved = localStorage.getItem("admin_pw") || "";
    if (!saved) {
      setCheckingAuth(false);
      return;
    }

    fetch("/api/admin/analytics", {
      headers: { Authorization: `Bearer ${saved}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("unauthorized");
        const data = (await res.json()) as AdminAnalyticsSummary;
        setOrdersToday(Number(data.ordersToday) || 0);
        setAuthorized(true);
      })
      .catch(() => {
        localStorage.removeItem("admin_pw");
        setAuthorized(false);
        setOrdersToday(0);
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextPassword = password.trim();
    if (!nextPassword) return;

    setCheckingAuth(true);
    setAuthError("");
    try {
      const res = await fetch("/api/admin/analytics", {
        headers: { Authorization: `Bearer ${nextPassword}` },
      });
      if (!res.ok) throw new Error("Mot de passe incorrect.");
      const data = (await res.json()) as AdminAnalyticsSummary;
      setOrdersToday(Number(data.ordersToday) || 0);
      localStorage.setItem("admin_pw", nextPassword);
      setAuthorized(true);
      setPassword("");
    } catch (error) {
      localStorage.removeItem("admin_pw");
      setAuthorized(false);
      setOrdersToday(0);
      setAuthError(error instanceof Error ? error.message : "Connexion impossible.");
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_pw");
    setAuthorized(false);
    setView("analytics");
    setOrdersToday(0);
  };

  if (checkingAuth && !authorized) {
    return (
      <div className="admin-shell auth-only">
        <div className="admin-login-card">
          <div className="logo-mark">F</div>
          <div className="admin-login-title">Fanovera Admin</div>
          <div className="admin-login-sub">Vérification de session...</div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="admin-shell auth-only">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <div className="logo-mark">F</div>
          <div className="admin-login-title">Fanovera Admin</div>
          <label className="label" htmlFor="admin-password">Mot de passe</label>
          <input
            id="admin-password"
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            autoComplete="current-password"
          />
          {authError ? <div className="admin-login-error">{authError}</div> : null}
          <button className="btn primary" type="submit" disabled={checkingAuth || !password.trim()}>
            {checkingAuth ? "Vérification..." : "Entrer"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">F</div>
          <div>
            <div className="logo-name">Fanovera</div>
            <div className="logo-sub">Admin · v2.4</div>
          </div>
        </div>

        <div className="nav-section-label">Pilotage</div>
        {NAV.slice(0, 5).map((n) => (
          <button key={n.id} className={"nav-item " + (view === n.id ? "active" : "")} onClick={() => setView(n.id)}>
            {n.icon()}
            {n.label}
            {n.id === "orders" && ordersToday > 0 ? <span className="badge">{ordersToday}</span> : null}
          </button>
        ))}

        <div className="nav-section-label">Catalogue</div>
        {NAV.slice(5, 9).map((n) => (
          <button key={n.id} className={"nav-item " + (view === n.id ? "active" : "")} onClick={() => setView(n.id)}>
            {n.icon()}
            {n.label}
          </button>
        ))}

        <div className="nav-section-label">Système</div>
        {NAV.slice(9, 13).map((n) => (
          <button key={n.id} className={"nav-item " + (view === n.id ? "active" : "")} onClick={() => setView(n.id)}>
            {n.icon()}
            {n.label}
          </button>
        ))}

        <div className="nav-section-label">Support</div>
        {NAV.slice(13).map((n) => (
          <button key={n.id} className={"nav-item " + (view === n.id ? "active" : "")} onClick={() => setView(n.id)}>
            {n.icon()}
            {n.label}
            {n.id === "support" && pendingSupport > 0 ? <span className="badge">{pendingSupport}</span> : null}
          </button>
        ))}

        {bfBalance !== null ? (
          <button
            type="button"
            className="nav-item"
            onClick={() => setView("smm")}
            title="Solde BulkFollows — clique pour ouvrir l'onglet SMM. Sous le seuil, tes livraisons risquent d'échouer."
            style={{
              marginTop: "auto",
              justifyContent: "space-between",
              color: bfBalance < LOW_BALANCE_THRESHOLD ? "#fca5a5" : undefined,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {Ic.zap()} Solde BF
            </span>
            <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
              {bfBalance < LOW_BALANCE_THRESHOLD ? "⚠️ " : ""}${bfBalance.toFixed(2)}
            </span>
          </button>
        ) : null}

        <div className="sidebar-foot">
          <div className="avatar">SK</div>
          <div className="who">
            <div className="who-name">Sami Kacimi</div>
            <div className="who-role">Founder · Admin</div>
          </div>
          <button
            className="icon-btn"
            onClick={handleLogout}
            aria-label="Se deconnecter"
            title="Se deconnecter"
            style={{ background: "transparent", border: "none", color: "rgba(232,228,216,0.5)", width: 28, height: 28 }}
          >
            {Ic.more()}
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div style={{ fontSize: 11, color: "var(--a-ink-3)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
              Admin {Ic.chevronRight()} <span style={{ color: "var(--a-ink)" }}>{meta.label}</span>
            </div>
            <div className="crumb-h1" style={{ marginTop: 2 }}>
              {meta.label} <span className="hand-note" style={{ marginLeft: 8, fontSize: 16 }}>{meta.sub}</span>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="search-box">
              {Ic.search()}
              <input placeholder="Rechercher partout..." />
              <span className="search-kbd">⌘K</span>
            </div>
            <button
              className="icon-btn"
              onClick={() => setView("support")}
              aria-label={pendingSupport > 0 ? `${pendingSupport} demande(s) de support en attente` : "Aucune demande de support en attente"}
              title={pendingSupport > 0 ? `${pendingSupport} demande${pendingSupport > 1 ? "s" : ""} en attente` : "Support"}
            >
              {Ic.bell()}
              {pendingSupport > 0 ? <span className="dot" /> : null}
            </button>
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>SK</div>
          </div>
        </header>

        <div className="page">
          {today ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 16,
              }}
            >
              {([
                ["Aujourd'hui", `${today.orders}`, "cmd", false],
                ["CA", fmtEur(today.revenue), "", false],
                ["Coût BF", fmtEur(today.cost), "", false],
                ["Frais Stripe", fmtEur(today.stripeFees), "", false],
                ["Coût Ads", adsCostToday == null ? "—" : fmtEur(adsCostToday), "", false],
                ["Marge", fmtEur(today.revenue - today.cost - today.stripeFees - today.refunds - (adsCostToday ?? 0)), "", today.revenue - today.cost - today.stripeFees - today.refunds - (adsCostToday ?? 0) < 0],
                ["Remboursé", fmtEur(today.refunds), "", today.refunds > 0],
              ] as const).map(([label, value, suffix, warn]) => (
                <div
                  key={label}
                  style={{
                    flex: "1 1 120px",
                    background: "var(--a-surface, #fff)",
                    border: "1px solid var(--a-line, #e5e7eb)",
                    borderRadius: 12,
                    padding: "10px 14px",
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--a-ink-3, #9ca3af)" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: warn ? "#dc2626" : "var(--a-ink, #111827)", fontVariantNumeric: "tabular-nums" }}>
                    {value}{suffix ? <span style={{ fontSize: 12, fontWeight: 600, color: "var(--a-ink-3, #9ca3af)", marginLeft: 4 }}>{suffix}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <ViewErrorBoundary key={view}>
            {view === "analytics" && <AnalyticsView />}
            {view === "cohorts" && <CohortsView />}
            {view === "sources" && <SourcesView />}
            {view === "adsRoas" && <AdsROASView />}
            {view === "networkToday" && <NetworkTodayView />}
            {view === "searchTerms" && <SearchTermsView />}
            {view === "adsCohorts" && <AdsCohortsView />}
            {view === "orders" && <OrdersView />}
            {view === "recovery" && <RecoveryView />}
            {view === "pricing" && <PricingView />}
            {view === "abPricing" && <PricingExperimentsView />}
            {view === "promoFlow" && <PromoFlowView />}
            {view === "tt2Packs" && <Tt2PacksView />}
            {view === "checkoutFlow" && <CheckoutFlowView />}
            {view === "combos" && <CombosView />}
            {view === "promo" && <PromoCodesView />}
            {view === "upsells" && <UpsellsView />}
            {view === "smm" && <SmmView />}
            {view === "i18n" && <I18nSyncView />}
            {view === "marketing" && <MarketingModeView />}
            {view === "emails" && <EmailFlowsView />}
            {view === "outreach" && <OutreachView />}
            {view === "support" && <SupportView />}
          </ViewErrorBoundary>
        </div>
      </main>
    </div>
  );
}
