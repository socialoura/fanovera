"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Ic } from "./components/icons";
import AnalyticsView from "./components/views/AnalyticsView";
import CohortsView from "./components/views/CohortsView";
import SourcesView from "./components/views/SourcesView";
import AdsROASView from "./components/views/AdsROASView";
import SearchTermsView from "./components/views/SearchTermsView";
import AdsCohortsView from "./components/views/AdsCohortsView";
import OrdersView from "./components/views/OrdersView";
import RecoveryView from "./components/views/RecoveryView";
import PricingView from "./components/views/PricingView";
import CombosView from "./components/views/CombosView";
import UpsellsView from "./components/views/UpsellsView";
import SmmView from "./components/views/SmmView";
import SupportView from "./components/views/SupportView";
import I18nSyncView from "./components/views/I18nSyncView";
import MarketingModeView from "./components/views/MarketingModeView";
import PricingExperimentsView from "./components/views/PricingExperimentsView";
import EmailFlowsView from "./components/views/EmailFlowsView";

type ViewId = "analytics" | "cohorts" | "sources" | "adsRoas" | "searchTerms" | "adsCohorts" | "orders" | "recovery" | "pricing" | "abPricing" | "combos" | "upsells" | "smm" | "i18n" | "marketing" | "emails" | "support";

type AdminAnalyticsSummary = {
  ordersToday?: number;
};

const NAV: { id: ViewId; label: string; icon: () => React.ReactNode; sub: string }[] = [
  { id: "analytics", label: "Analytics", icon: () => Ic.dashboard(), sub: "Vue d'ensemble" },
  { id: "cohorts", label: "Cohortes", icon: () => Ic.layers(), sub: "Rétention D7/D30/D90" },
  { id: "sources", label: "Sources", icon: () => Ic.filter(), sub: "LTV par acquisition" },
  { id: "adsRoas", label: "Ads ROAS", icon: () => Ic.zap(), sub: "ROAS réel Google Ads" },
  { id: "searchTerms", label: "Search Terms", icon: () => Ic.filter(), sub: "Termes recherchés payants" },
  { id: "adsCohorts", label: "Ads Cohortes", icon: () => Ic.layers(), sub: "ROAS D7/D30/D90" },
  { id: "orders", label: "Commandes", icon: () => Ic.cart(), sub: "Gestion clients" },
  { id: "recovery", label: "Rattrapage", icon: () => Ic.refresh(), sub: "Commandes mal routées" },
  { id: "pricing", label: "Prix", icon: () => Ic.tag(), sub: "Packs multi-devises" },
  { id: "abPricing", label: "A/B Prix", icon: () => Ic.filter(), sub: "Tests pricing" },
  { id: "combos", label: "Combos", icon: () => Ic.layers(), sub: "Packs combinés" },
  { id: "upsells", label: "Upsells", icon: () => Ic.zap(), sub: "Ventes additionnelles" },
  { id: "smm", label: "SMM", icon: () => Ic.cog(), sub: "BulkFollows" },
  { id: "i18n", label: "i18n", icon: () => Ic.edit(), sub: "Traductions" },
  { id: "marketing", label: "Mode site", icon: () => Ic.zap(), sub: "Copy FR/EN" },
  { id: "emails", label: "Emails", icon: () => Ic.bell(), sub: "Relances automatiques" },
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
  const meta = NAV.find((n) => n.id === view)!;

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
  }, [authorized, view]);

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
        {NAV.slice(0, 4).map((n) => (
          <button key={n.id} className={"nav-item " + (view === n.id ? "active" : "")} onClick={() => setView(n.id)}>
            {n.icon()}
            {n.label}
            {n.id === "orders" && ordersToday > 0 ? <span className="badge">{ordersToday}</span> : null}
          </button>
        ))}

        <div className="nav-section-label">Catalogue</div>
        {NAV.slice(4, 8).map((n) => (
          <button key={n.id} className={"nav-item " + (view === n.id ? "active" : "")} onClick={() => setView(n.id)}>
            {n.icon()}
            {n.label}
          </button>
        ))}

        <div className="nav-section-label">Système</div>
        {NAV.slice(8, 11).map((n) => (
          <button key={n.id} className={"nav-item " + (view === n.id ? "active" : "")} onClick={() => setView(n.id)}>
            {n.icon()}
            {n.label}
          </button>
        ))}

        <div className="nav-section-label">Support</div>
        {NAV.slice(11).map((n) => (
          <button key={n.id} className={"nav-item " + (view === n.id ? "active" : "")} onClick={() => setView(n.id)}>
            {n.icon()}
            {n.label}
          </button>
        ))}

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
          {view === "analytics" && <AnalyticsView />}
          {view === "cohorts" && <CohortsView />}
          {view === "sources" && <SourcesView />}
          {view === "adsRoas" && <AdsROASView />}
          {view === "searchTerms" && <SearchTermsView />}
          {view === "adsCohorts" && <AdsCohortsView />}
          {view === "orders" && <OrdersView />}
          {view === "recovery" && <RecoveryView />}
          {view === "pricing" && <PricingView />}
          {view === "abPricing" && <PricingExperimentsView />}
          {view === "combos" && <CombosView />}
          {view === "upsells" && <UpsellsView />}
          {view === "smm" && <SmmView />}
          {view === "i18n" && <I18nSyncView />}
          {view === "marketing" && <MarketingModeView />}
          {view === "emails" && <EmailFlowsView />}
          {view === "support" && <SupportView />}
        </div>
      </main>
    </div>
  );
}
