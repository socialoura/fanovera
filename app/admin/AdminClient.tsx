"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Ic } from "./components/icons";
import AnalyticsView from "./components/views/AnalyticsView";
import OrdersView from "./components/views/OrdersView";
import PricingView from "./components/views/PricingView";
import CombosView from "./components/views/CombosView";
import UpsellsView from "./components/views/UpsellsView";
import SmmView from "./components/views/SmmView";
import SupportView from "./components/views/SupportView";

type ViewId = "analytics" | "orders" | "pricing" | "combos" | "upsells" | "smm" | "support";

const NAV: { id: ViewId; label: string; icon: () => React.ReactNode; sub: string; badge?: number }[] = [
  { id: "analytics", label: "Analytics", icon: () => Ic.dashboard(), sub: "Vue d'ensemble" },
  { id: "orders", label: "Commandes", icon: () => Ic.cart(), sub: "Gestion clients", badge: 6 },
  { id: "pricing", label: "Prix", icon: () => Ic.tag(), sub: "Packs multi-devises" },
  { id: "combos", label: "Combos", icon: () => Ic.layers(), sub: "Packs combinés" },
  { id: "upsells", label: "Upsells", icon: () => Ic.zap(), sub: "Ventes additionnelles" },
  { id: "smm", label: "SMM", icon: () => Ic.cog(), sub: "BulkFollows" },
  { id: "support", label: "Support", icon: () => Ic.chat(), sub: "Messages clients" },
];

export default function AdminClient() {
  const [view, setView] = useState<ViewId>("analytics");
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const meta = NAV.find((n) => n.id === view)!;

  useEffect(() => {
    const saved = localStorage.getItem("admin_pw") || "";
    if (!saved) {
      setCheckingAuth(false);
      return;
    }

    fetch("/api/admin/analytics", {
      headers: { Authorization: `Bearer ${saved}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("unauthorized");
        setAuthorized(true);
      })
      .catch(() => {
        localStorage.removeItem("admin_pw");
        setAuthorized(false);
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
      localStorage.setItem("admin_pw", nextPassword);
      setAuthorized(true);
      setPassword("");
    } catch (error) {
      localStorage.removeItem("admin_pw");
      setAuthorized(false);
      setAuthError(error instanceof Error ? error.message : "Connexion impossible.");
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_pw");
    setAuthorized(false);
    setView("analytics");
  };

  if (checkingAuth && !authorized) {
    return (
      <div className="admin-shell auth-only">
        <div className="admin-login-card">
          <div className="logo-mark">F</div>
          <div className="admin-login-title">Fanovera Admin</div>
          <div className="admin-login-sub">Verification de session...</div>
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
            {checkingAuth ? "Verification..." : "Entrer"}
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
        {NAV.slice(0, 2).map((n) => (
          <button key={n.id} className={"nav-item " + (view === n.id ? "active" : "")} onClick={() => setView(n.id)}>
            {n.icon()}
            {n.label}
            {n.badge && <span className="badge">{n.badge}</span>}
          </button>
        ))}

        <div className="nav-section-label">Catalogue</div>
        {NAV.slice(2, 5).map((n) => (
          <button key={n.id} className={"nav-item " + (view === n.id ? "active" : "")} onClick={() => setView(n.id)}>
            {n.icon()}
            {n.label}
          </button>
        ))}

        <div className="nav-section-label">Système</div>
        {NAV.slice(5, 6).map((n) => (
          <button key={n.id} className={"nav-item " + (view === n.id ? "active" : "")} onClick={() => setView(n.id)}>
            {n.icon()}
            {n.label}
          </button>
        ))}

        <div className="nav-section-label">Support</div>
        {NAV.slice(6).map((n) => (
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
            <button className="icon-btn">
              {Ic.bell()}
              <span className="dot" />
            </button>
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>SK</div>
          </div>
        </header>

        <div className="page">
          {view === "analytics" && <AnalyticsView />}
          {view === "orders" && <OrdersView />}
          {view === "pricing" && <PricingView />}
          {view === "combos" && <CombosView />}
          {view === "upsells" && <UpsellsView />}
          {view === "smm" && <SmmView />}
          {view === "support" && <SupportView />}
        </div>
      </main>
    </div>
  );
}
