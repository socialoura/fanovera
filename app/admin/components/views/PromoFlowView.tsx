"use client";

import { useEffect, useState } from "react";
import type { PromoFlowMode } from "@/app/lib/promoFlow.server";

const OPTIONS: { mode: PromoFlowMode; label: string; sub: string; color: string }[] = [
  { mode: "off", label: "Désactivé", sub: "Tout le monde voit la promo actuelle (contrôle).", color: "#94a3b8" },
  { mode: "ab", label: "A/B 50/50", sub: "Moitié contrôle, moitié username-first. Test en cours.", color: "#f59e0b" },
  { mode: "force_username", label: "Forcer username-first", sub: "Tout le monde voit la variante (gagnant verrouillé).", color: "#22c55e" },
];

export default function PromoFlowView() {
  const [mode, setMode] = useState<PromoFlowMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<PromoFlowMode | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("admin_pw") || ""}`,
  });

  useEffect(() => {
    fetch("/api/admin/promo-flow", { headers: authHeaders() })
      .then(async (res) => {
        const data = (await res.json()) as { mode?: PromoFlowMode; error?: string };
        if (!res.ok || !data.mode) throw new Error(data.error || "Chargement impossible.");
        setMode(data.mode);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, []);

  const updateMode = async (next: PromoFlowMode) => {
    if (mode === next) return;
    setSaving(next);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/promo-flow", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ mode: next }),
      });
      const data = (await res.json()) as { mode?: PromoFlowMode; error?: string };
      if (!res.ok) throw new Error(data.error || "Sauvegarde impossible.");
      setMode(next);
      setMessage(`Promo A/B → ${OPTIONS.find((o) => o.mode === next)?.label}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sauvegarde impossible.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="promo-flow-view">
      {error ? <div className="admin-alert error">{error}</div> : null}
      {message ? <div className="admin-alert success">{message}</div> : null}

      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--a-line)" }}>
          <div className="card-title" style={{ marginBottom: 2 }}>A/B Promo — flow username-first</div>
          <div className="card-sub">
            Sur <strong>/promo</strong> (Instagram ciblé) : demander l&apos;@ avant les packs.
            Le changement prend effet immédiatement, sans déploiement.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {OPTIONS.map((opt) => {
            const active = mode === opt.mode;
            const isSaving = saving === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                disabled={loading || Boolean(saving) || active}
                onClick={() => updateMode(opt.mode)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  textAlign: "left",
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--a-line)",
                  background: active ? "color-mix(in srgb, " + opt.color + " 10%, transparent)" : "transparent",
                  border: "none",
                  borderLeft: active ? `3px solid ${opt.color}` : "3px solid transparent",
                  cursor: loading || Boolean(saving) || active ? "default" : "pointer",
                  opacity: isSaving ? 0.5 : 1,
                  width: "100%",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: active ? `5px solid ${opt.color}` : "2px solid var(--a-line)",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                />
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontWeight: 700, fontSize: 14 }}>{opt.label}</span>
                  <span style={{ display: "block", fontSize: 12, color: "var(--a-ink-3)", marginTop: 2 }}>{opt.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Comment lire le test</div>
        <div style={{ fontSize: 13, color: "var(--a-ink-2)", lineHeight: 1.6 }}>
          Mesure dans PostHog : segmente par la super-propriété <code>promo_flow_variant</code>.
          KPI = <strong>revenu par visiteur</strong> par variante (pas le taux de saisie d&apos;@), et
          surveille le <strong>rebond /promo</strong> + le clic <code>promo_username_capture</code>.
          Verrouille le gagnant avec <strong>Forcer username-first</strong> (ou <strong>Désactivé</strong> si le contrôle gagne).
        </div>
      </aside>
    </div>
  );
}
