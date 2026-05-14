"use client";

import { useEffect, useState } from "react";
import {
  MARKETING_SURFACES,
  SURFACE_LABELS,
  SURFACE_MARKETING_MODES,
  type MarketingSurface,
  type SurfaceMarketingMode,
} from "@/app/lib/marketingModeTypes";

type Modes = Record<MarketingSurface, SurfaceMarketingMode>;
type SavingState = { surface: MarketingSurface; mode: SurfaceMarketingMode } | null;

const MODE_COLORS: Record<SurfaceMarketingMode, string> = {
  whitehat: "#22c55e",
  greyhat: "#f59e0b",
  blackhat: "#ef4444",
};

const MODE_LABELS: Record<SurfaceMarketingMode, string> = {
  whitehat: "Whitehat",
  greyhat: "Greyhat",
  blackhat: "Blackhat",
};

const SURFACE_ICONS: Record<MarketingSurface, string> = {
  home: "🏠",
  promo: "🎯",
  instagram: "📸",
  tiktok: "🎵",
  twitter: "🐦",
  twitch: "🎮",
  youtube: "▶️",
  spotify: "🎧",
  facebook: "👤",
  linkedin: "💼",
};

const defaultModes = (): Modes =>
  Object.fromEntries(MARKETING_SURFACES.map((s) => [s, "whitehat" as const])) as Modes;

export default function MarketingModeView() {
  const [modes, setModes] = useState<Modes>(defaultModes());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SavingState>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("admin_pw") || ""}`,
  });

  useEffect(() => {
    fetch("/api/admin/marketing-modes", { headers: authHeaders() })
      .then(async (res) => {
        const data = (await res.json()) as { modes?: Modes; error?: string };
        if (!res.ok || !data.modes) throw new Error(data.error || "Chargement impossible.");
        setModes({ ...defaultModes(), ...data.modes });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, []);

  const updateMode = async (surface: MarketingSurface, mode: SurfaceMarketingMode) => {
    if (modes[surface] === mode) return;
    setSaving({ surface, mode });
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/marketing-modes", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ surface, mode }),
      });
      const data = (await res.json()) as { surface?: string; mode?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Sauvegarde impossible.");
      setModes((prev) => ({ ...prev, [surface]: mode }));
      setMessage(`${SURFACE_LABELS[surface]} passé en ${MODE_LABELS[mode]}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sauvegarde impossible.");
    } finally {
      setSaving(null);
    }
  };

  const resetAll = async () => {
    setSaving({ surface: "home", mode: "whitehat" });
    setMessage("");
    setError("");
    try {
      for (const surface of MARKETING_SURFACES) {
        if (modes[surface] !== "whitehat") {
          await fetch("/api/admin/marketing-modes", {
            method: "POST",
            headers: { ...authHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ surface, mode: "whitehat" }),
          });
        }
      }
      setModes(defaultModes());
      setMessage("Toutes les surfaces repassées en Whitehat.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Réinitialisation impossible.");
    } finally {
      setSaving(null);
    }
  };

  const hasBlackhat = Object.values(modes).some((m) => m === "blackhat");

  return (
    <div className="marketing-mode-view">
      {error ? <div className="admin-alert error">{error}</div> : null}
      {message ? <div className="admin-alert success">{message}</div> : null}

      {hasBlackhat && (
        <div className="admin-alert error" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span>
            <strong>Attention :</strong> au moins une surface est en <strong>Blackhat</strong>. Ces pages ne sont <strong>pas indexées</strong> par Google (noindex, nofollow) et sont exclues du sitemap.
          </span>
        </div>
      )}

      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--a-line)" }}>
          <div className="card-title" style={{ marginBottom: 2 }}>Mode marketing par surface</div>
          <div className="card-sub">Choisissez indépendamment le mode de chaque page. FR/EN uniquement — les autres langues restent en whitehat.</div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--a-line)", fontSize: 11, fontWeight: 700, color: "var(--a-ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <th style={{ textAlign: "left", padding: "10px 20px" }}>Surface</th>
              {SURFACE_MARKETING_MODES.map((m) => (
                <th key={m} style={{ textAlign: "center", padding: "10px 16px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: MODE_COLORS[m], display: "inline-block" }} />
                    {MODE_LABELS[m]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MARKETING_SURFACES.map((surface) => {
              const current = modes[surface];
              const isSaving = saving?.surface === surface;
              return (
                <tr key={surface} style={{ borderBottom: "1px solid var(--a-line)" }}>
                  <td style={{ padding: "10px 20px", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{SURFACE_ICONS[surface]}</span>
                    {SURFACE_LABELS[surface]}
                  </td>
                  {SURFACE_MARKETING_MODES.map((m) => {
                    const active = current === m;
                    const pending = isSaving && saving?.mode === m;
                    return (
                      <td key={m} style={{ textAlign: "center", padding: "10px 16px" }}>
                        <button
                          type="button"
                          disabled={loading || Boolean(saving) || active}
                          onClick={() => updateMode(surface, m)}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: active ? `3px solid ${MODE_COLORS[m]}` : "2px solid var(--a-line)",
                            background: active ? MODE_COLORS[m] : "transparent",
                            cursor: loading || Boolean(saving) || active ? "default" : "pointer",
                            position: "relative",
                            opacity: pending ? 0.5 : 1,
                            transition: "all 0.15s ease",
                          }}
                          title={`${SURFACE_LABELS[surface]} → ${MODE_LABELS[m]}`}
                          aria-label={`${SURFACE_LABELS[surface]} → ${MODE_LABELS[m]}`}
                        >
                          {active && (
                            <span style={{
                              position: "absolute",
                              inset: 0,
                              display: "grid",
                              placeItems: "center",
                            }}>
                              <span style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "white",
                              }} />
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--a-line)", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn"
            disabled={loading || Boolean(saving) || !Object.values(modes).some((m) => m !== "whitehat")}
            onClick={resetAll}
            style={{
              fontSize: 12,
              padding: "6px 14px",
              background: "var(--a-red, #ef4444)",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
              opacity: Object.values(modes).some((m) => m !== "whitehat") ? 1 : 0.4,
            }}
          >
            🛑 Tout passer en Whitehat
          </button>
        </div>
      </section>

      <aside className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Rappel des modes</div>
        <div className="marketing-mode-list">
          <div><span style={{ color: MODE_COLORS.whitehat }}>●</span> <strong>Whitehat</strong><span>Copy safe, conforme, indexable. Audit + stratégie. Aucune promesse de volume.</span></div>
          <div><span style={{ color: MODE_COLORS.greyhat }}>●</span> <strong>Greyhat</strong><span>Copy orientée conversion. Chiffres cliqués, vrais profils audités, disclaimers TOS. Indexable.</span></div>
          <div><span style={{ color: MODE_COLORS.blackhat }}>●</span> <strong>Blackhat</strong><span>Copy agressive. +10K garantis, abonnés réels actifs. Noindex automatique, exclu du sitemap.</span></div>
          <div>🌐 <strong>Langues</strong><span>Seuls FR et EN sont affectés. ES, PT, DE, IT et TR restent en whitehat quoi qu'il arrive.</span></div>
        </div>
      </aside>
    </div>
  );
}
