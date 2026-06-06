"use client";

import { useEffect, useState } from "react";
import type { CheckoutFlowMode } from "@/app/lib/checkoutFlow.server";

const OPTIONS: { mode: CheckoutFlowMode; label: string; sub: string; color: string }[] = [
  { mode: "off", label: "Désactivé", sub: "Tout le monde voit le flow 3 étapes actuel (contrôle).", color: "#94a3b8" },
  { mode: "ab", label: "A/B 50/50", sub: "Moitié contrôle, moitié page unique fusionnée. Test en cours.", color: "#f59e0b" },
  { mode: "force_merged", label: "Forcer page unique", sub: "Tout le monde voit la variante fusionnée (gagnant verrouillé).", color: "#22c55e" },
];

type VariantRow = {
  variant: string;
  exposed: number;
  checkouts: number;
  buyers: number;
  payments: number;
  revenue: number;
};

const VARIANT_LABEL: Record<string, string> = {
  control: "Contrôle (3 étapes)",
  merged: "Page unique",
};

const pct = (num: number, den: number) => (den > 0 ? `${Math.round((num / den) * 1000) / 10}%` : "—");
const perVisitor = (rev: number, exposed: number) => (exposed > 0 ? rev / exposed : 0);

export default function CheckoutFlowView() {
  const [mode, setMode] = useState<CheckoutFlowMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<CheckoutFlowMode | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState<VariantRow[] | null>(null);
  const [resultsConfigured, setResultsConfigured] = useState(true);
  const [resultsError, setResultsError] = useState("");
  const [resultsLoading, setResultsLoading] = useState(true);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("admin_pw") || ""}`,
  });

  const loadResults = async () => {
    setResultsLoading(true);
    setResultsError("");
    try {
      const res = await fetch("/api/admin/checkout-flow/results", { headers: authHeaders() });
      const data = (await res.json()) as { configured?: boolean; variants?: VariantRow[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Erreur");
      setResultsConfigured(data.configured !== false);
      setResults(Array.isArray(data.variants) ? data.variants : []);
    } catch (e) {
      setResultsError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/admin/checkout-flow", { headers: authHeaders() })
      .then(async (res) => {
        const data = (await res.json()) as { mode?: CheckoutFlowMode; error?: string };
        if (!res.ok || !data.mode) throw new Error(data.error || "Chargement impossible.");
        setMode(data.mode);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, []);

  const updateMode = async (next: CheckoutFlowMode) => {
    if (mode === next) return;
    setSaving(next);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/checkout-flow", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ mode: next }),
      });
      const data = (await res.json()) as { mode?: CheckoutFlowMode; error?: string };
      if (!res.ok) throw new Error(data.error || "Sauvegarde impossible.");
      setMode(next);
      setMessage(`Checkout A/B → ${OPTIONS.find((o) => o.mode === next)?.label}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sauvegarde impossible.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="checkout-flow-view">
      {error ? <div className="admin-alert error">{error}</div> : null}
      {message ? <div className="admin-alert success">{message}</div> : null}

      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--a-line)" }}>
          <div className="card-title" style={{ marginBottom: 2 }}>A/B Checkout — page unique Instagram</div>
          <div className="card-sub">
            Sur <strong>/instagram</strong> : fusionner l&apos;étape « @ + email » et le paiement sur une seule
            page (2 colonnes). Le changement prend effet immédiatement, sans déploiement.
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

      <section className="card" style={{ marginTop: 16, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--a-line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div className="card-title" style={{ marginBottom: 2 }}>Résultats (30 derniers jours)</div>
            <div className="card-sub">KPI clé = <strong>revenu / visiteur</strong>. Source : PostHog (super-propriété <code>checkout_flow_variant</code>).</div>
          </div>
          <button type="button" className="btn" onClick={loadResults} disabled={resultsLoading} style={{ fontSize: 12, padding: "6px 12px" }}>
            {resultsLoading ? "..." : "Rafraîchir"}
          </button>
        </div>

        {!resultsConfigured ? (
          <div style={{ padding: 20, fontSize: 13, color: "var(--a-ink-3)" }}>
            Clé PostHog non configurée. Ajoute <code>POSTHOG_PERSONAL_API_KEY</code> (+ <code>POSTHOG_PROJECT_ID</code>) aux variables d&apos;environnement.
          </div>
        ) : resultsError ? (
          <div style={{ padding: 20, fontSize: 13, color: "var(--a-accent)" }}>{resultsError}</div>
        ) : (
          (() => {
            const byVariant = (v: string): VariantRow =>
              results?.find((r) => r.variant === v) || { variant: v, exposed: 0, checkouts: 0, buyers: 0, payments: 0, revenue: 0 };
            const rows = ["control", "merged"].map(byVariant);
            const totalExposed = rows.reduce((s, r) => s + r.exposed, 0);
            const bestRpv = Math.max(...rows.map((r) => perVisitor(r.revenue, r.exposed)));
            return (
              <>
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ color: "var(--a-ink-3)" }}>Variante</th>
                      <th style={{ color: "var(--a-ink-3)" }}>Exposés</th>
                      <th style={{ color: "var(--a-ink-3)" }}>Checkouts</th>
                      <th style={{ color: "var(--a-ink-3)" }}>Acheteurs</th>
                      <th style={{ color: "var(--a-ink-3)" }}>Revenu*</th>
                      <th style={{ color: "var(--a-ink-3)" }}>Revenu / visiteur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const rpv = perVisitor(r.revenue, r.exposed);
                      const isWinner = totalExposed > 0 && r.exposed > 0 && rpv === bestRpv && bestRpv > 0;
                      return (
                        <tr key={r.variant} style={isWinner ? { background: "rgba(34,197,94,0.08)" } : undefined}>
                          <td style={{ fontWeight: 700, color: "var(--a-ink)" }}>
                            {VARIANT_LABEL[r.variant] || r.variant}{isWinner ? " 🏆" : ""}
                          </td>
                          <td style={{ color: "var(--a-ink)" }}>{r.exposed}</td>
                          <td style={{ color: "var(--a-ink)" }}>{r.checkouts} <span style={{ color: "var(--a-ink-3)", fontSize: 12 }}>({pct(r.checkouts, r.exposed)})</span></td>
                          <td style={{ color: "var(--a-ink)" }}>{r.buyers} <span style={{ color: "var(--a-ink-3)", fontSize: 12 }}>({pct(r.buyers, r.exposed)})</span></td>
                          <td style={{ color: "var(--a-ink)" }}>{r.revenue.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td style={{ fontWeight: 700, color: isWinner ? "#16a34a" : "var(--a-ink)" }}>
                            {rpv.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ padding: "12px 20px", fontSize: 12, color: "var(--a-ink-3)", lineHeight: 1.6, borderTop: "1px solid var(--a-line)" }}>
                  {totalExposed === 0
                    ? "Aucune exposition encore — active le mode A/B et attends du trafic."
                    : "🏆 = meilleur revenu/visiteur. "}
                  *Revenu en devises mêlées (surtout GBP pour la campagne GB) — comparaison directionnelle entre variantes, pas un total comptable. Volume GB faible → attends plusieurs centaines d&apos;exposés/variante avant de conclure. Verrouille ensuite avec <strong>Forcer page unique</strong> ou <strong>Désactivé</strong>.
                </div>
              </>
            );
          })()
        )}
      </section>
    </div>
  );
}
