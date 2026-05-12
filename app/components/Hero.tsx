import type { CSSProperties } from "react";
import NetIcon from "./NetIcon";
import StatusBadge from "./StatusBadge";
import { NETWORKS, NET_META, type Network } from "../lib/networks";

function StarsRow() {
  const items = [
    { q: "Audit clair et plan actionnable", a: "Lea M., musicienne" },
    { q: "Service serieux, suivi lisible", a: "Karim T., DTC founder" },
    { q: "Un vrai cadre pour publier mieux", a: "Studio Metrique" },
  ];
  return (
    <div
      className="hide-md"
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 56,
        flexWrap: "wrap",
        marginBottom: 28,
      }}
    >
      {items.map((t, i) => (
        <div key={i} style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 3, marginBottom: 6 }}>
            {[...Array(5)].map((_, j) => (
              <svg key={j} width="16" height="16" viewBox="0 0 16 16" fill="var(--yellow)">
                <path d="M8 1l2 4.6 5 .7-3.6 3.5.9 5L8 12.3 3.7 14.8l.9-5L1 6.3l5-.7z" />
              </svg>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-2)", fontStyle: "italic" }}>
            &ldquo;{t.q}&rdquo;
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>- {t.a}</div>
        </div>
      ))}
    </div>
  );
}

function MockDashboard() {
  return (
    <div className="mock-window" style={{ width: "100%", maxWidth: 700 }}>
      <div className="mock-titlebar">
        <div className="traffic" style={{ background: "#ff5f57" }}></div>
        <div className="traffic" style={{ background: "#ffbd2e" }}></div>
        <div className="traffic" style={{ background: "#28c840" }}></div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "var(--ink-3)" }}>
          app.fanovera.com
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", minHeight: 380 }}>
        {/* Sidebar */}
        <div
          style={{
            background: "var(--paper-2)",
            padding: "18px 12px",
            borderRight: "1px solid var(--line)",
          }}
        >
          <div
            style={{
              background: "var(--primary)",
              color: "white",
              padding: "8px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="white"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            + Nouvelle campagne
          </div>
          {["Tableau de bord", "Campagnes", "Audience IA", "Statistiques", "Reseaux", "Facturation"].map(
            (label, i) => (
              <div
                key={label}
                style={{
                  padding: "8px 10px",
                  fontSize: 12,
                  fontWeight: i === 0 ? 700 : 500,
                  color: i === 0 ? "var(--ink)" : "var(--ink-2)",
                  borderRadius: 6,
                  marginBottom: 2,
                  background: i === 0 ? "white" : "transparent",
                }}
              >
                {label}
              </div>
            )
          )}
          <div
            style={{
              marginTop: 18,
              fontSize: 10,
              color: "var(--ink-3)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              padding: "0 10px",
            }}
          >
            RESEAUX ACTIFS
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 10px" }}>
            {NETWORKS.slice(0, 8).map((n) => (
              <div key={n.id} style={{ width: 18, height: 18 }}>
                <NetIcon kind={n.icon} color={n.color} size={18} />
              </div>
            ))}
          </div>
        </div>
        {/* Main */}
        <div style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Campagne #042</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Active · Jour 18 sur 30</div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <div
                style={{
                  padding: "4px 10px",
                  background: "var(--paper-2)",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 6,
                }}
              >
                7j
              </div>
              <div
                style={{
                  padding: "4px 10px",
                  background: "var(--ink)",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 6,
                }}
              >
                30j
              </div>
              <div
                style={{
                  padding: "4px 10px",
                  background: "var(--paper-2)",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 6,
                }}
              >
                90j
              </div>
            </div>
          </div>
          {/* Stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              marginBottom: 14,
            }}
          >
            {[
              { l: "Audit", v: "32 pts", d: "priorises", c: "var(--green)" },
              { l: "Contenus", v: "18 idees", d: "pretes", c: "var(--primary)" },
              { l: "Planning", v: "30 j", d: "cadence", c: "var(--orange)" },
            ].map((s, i) => (
              <div key={i} style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{s.l}</div>
                <div
                  style={{ fontSize: 18, fontWeight: 800, marginTop: 2, letterSpacing: "-0.01em" }}
                >
                  {s.v}
                </div>
                <div style={{ fontSize: 10, color: s.c, fontWeight: 600, marginTop: 2 }}>
                  {s.d}
                </div>
              </div>
            ))}
          </div>
          {/* Chart */}
          <div style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 8, height: 170 }}>
            <div
              style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", marginBottom: 8 }}
            >
              Plan de visibilite - 30 jours
            </div>
            <svg viewBox="0 0 300 130" style={{ width: "100%", height: 140 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5260e6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#5260e6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[30, 60, 90].map((y) => (
                <line key={y} x1="10" x2="290" y1={y} y2={y} stroke="#eee" strokeDasharray="2 3" />
              ))}
              <path
                d="M 10 110 Q 40 100 60 95 T 110 80 T 160 60 T 210 40 T 290 18 L 290 130 L 10 130 Z"
                fill="url(#grad)"
              />
              <path
                d="M 10 110 Q 40 100 60 95 T 110 80 T 160 60 T 210 40 T 290 18"
                stroke="var(--primary)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              {[
                [60, 95],
                [110, 80],
                [160, 60],
                [210, 40],
                [260, 25],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3" fill="white" stroke="var(--primary)" strokeWidth="2" />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function NetCard({ n }: { n: Network }) {
  const meta = NET_META[n.id];
  const cardStyle = {
    "--brand": meta.brand,
    "--brand-2": meta.brand2,
  } as CSSProperties;
  return (
    <a href={`/${n.id}`} className="netcard" style={cardStyle}>
      {/* Background oversized glyph */}
      <div className="netcard-glyph">
        <NetIcon kind={n.icon} color="white" size={180} />
      </div>

      {/* Top row: small icon chip + badge */}
      <div
        className="netcard-row"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: "rgba(255,255,255,0.95)",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
          }}
        >
          <NetIcon kind={n.icon} color={n.color} size={22} />
        </div>
        {meta.badge && <span className="netcard-chip solid">★ {meta.badge}</span>}
      </div>

      {/* Name + stat */}
      <div className="netcard-row">
        <div className="netcard-name">{n.name}</div>
        <div className="netcard-stat">{meta.stat}</div>
      </div>

      <div className="netcard-divider"></div>

      {/* Foot: CTA + arrow */}
      <div className="netcard-foot">
        <div>
          <div className="netcard-cta-label">Audit et strategie</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, color: "white" }}>
            Voir la solution
          </div>
        </div>
        <div className="netcard-arrow">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 12L12 4M5 4h7v7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </a>
  );
}

export default function Hero() {
  return (
    <section style={{ padding: "32px 0 0", position: "relative" }}>
      <div className="container">
        <StatusBadge />
        <StarsRow />
        <h1
          className="display"
          style={{
            textAlign: "center",
            margin: "0 auto 16px",
            maxWidth: 900,
            fontSize: "clamp(28px, 5vw, 56px)",
          }}
        >
          Une presence en ligne <span className="squiggle">plus claire</span>, sans promesses artificielles.
        </h1>

        {/* 8 BIG network cards - primary hero CTA, above the fold */}
        <div
          className="net-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            maxWidth: 1100,
            margin: "0 auto 24px",
          }}
        >
          {NETWORKS.map((n) => (
            <NetCard key={n.id} n={n} />
          ))}
        </div>

        {/* Sub-CTA strip */}
        <div
          className="sub-cta-strip"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}
          >
            <span style={{ color: "var(--ink-2)" }}>Note 4,9/5</span>
            <div style={{ display: "flex", gap: 2 }}>
              {[...Array(5)].map((_, j) => (
                <svg key={j} width="14" height="14" viewBox="0 0 14 14" fill="var(--yellow)">
                  <path d="M7 1l1.8 4 4.2.6-3 3 .7 4.2L7 10.8 3.3 12.8 4 8.6 1 5.6l4.2-.6z" />
                </svg>
              ))}
            </div>
            <span style={{ color: "var(--ink-3)" }}>· 2 348 avis</span>
          </div>
        </div>

        {/* Mock with floating cards */}
        <div className="mock-dashboard-wrapper" style={{ position: "relative", marginTop: 20, marginBottom: -40, paddingBottom: 60 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <MockDashboard />
          </div>

          {/* Floating left icons */}
          <div
            style={{ position: "absolute", left: "5%", top: 60, ["--r" as string]: "-8deg" } as CSSProperties}
            className="floaty hide-lg-down"
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "linear-gradient(135deg, #fda085, #f6d365)",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 14px 30px -10px rgba(253, 160, 133, 0.5)",
              }}
            >
              <NetIcon kind="instagram" color="white" size={32} />
            </div>
          </div>
          <div
            style={{ position: "absolute", left: "2%", top: 220, ["--r" as string]: "5deg" } as CSSProperties}
            className="floaty hide-lg-down"
          >
            <div className="sticker" style={{ borderRadius: 999 }}>
              <NetIcon kind="tiktok" color="#1d1d2c" size={20} />
              <div>
                <div style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: 600 }}>TIKTOK</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>audit</div>
              </div>
            </div>
          </div>

          {/* Floating right cards */}
          <div
            style={{ position: "absolute", right: "5%", top: 30, ["--r" as string]: "7deg" } as CSSProperties}
            className="floaty hide-lg-down"
          >
            <div className="sticker">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "var(--green)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <NetIcon kind="spotify" color="white" size={20} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Audit Spotify</div>
                <div style={{ fontSize: 10, color: "var(--ink-3)" }}>plan de lancement</div>
              </div>
            </div>
          </div>
          <div
            style={{ position: "absolute", right: "2%", top: 180, ["--r" as string]: "-4deg" } as CSSProperties}
            className="floaty hide-lg-down"
          >
            <div className="sticker">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #ff6b9b, #c45cae)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M12 4l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>4,9/5</div>
                <div style={{ fontSize: 10, color: "var(--ink-3)" }}>2 348 avis</div>
              </div>
            </div>
          </div>
          <div
            style={{ position: "absolute", right: "8%", top: 320, ["--r" as string]: "3deg" } as CSSProperties}
            className="floaty hide-lg-down"
          >
            <div className="sticker">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "var(--primary)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <NetIcon kind="youtube" color="white" size={20} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>SEO video</div>
                <div style={{ fontSize: 10, color: "var(--ink-3)" }}>titres et calendrier</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
