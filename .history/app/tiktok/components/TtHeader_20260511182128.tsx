import { Logo } from "../../components/Header";

export default function TtHeader() {
  return (
    <div style={{ padding: "24px 0" }}>
      <div className="container pf-header">
        <Logo />
        <nav className="nav-pill">
          <a href="/instagram">Instagram</a>
          <a href="/tiktok" className="active">TikTok</a>
          <a href="/youtube">YouTube</a>
          <a href="/facebook">Facebook</a>
          <a href="/#networks">Tous les réseaux</a>
          <a href="/track">Suivi</a>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="hide-md" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--ink-2)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--yellow)">
              <path d="M7 1l1.8 4 4.2.6-3 3 .7 4.2L7 10.8 3.3 12.8 4 8.6 1 5.6l4.2-.6z" />
            </svg>
            <span style={{ fontWeight: 700 }}>4,9</span>
            <span>· 2 348 avis</span>
          </div>
          <a href="/" style={{ width: 40, height: 40, borderRadius: 12, background: "white", border: "1px solid var(--line)", display: "grid", placeItems: "center", position: "relative" }} aria-label="Accueil">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5h2l2.4 11.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.5L21 8H6" />
              <circle cx="9" cy="21" r="1" />
              <circle cx="18" cy="21" r="1" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
