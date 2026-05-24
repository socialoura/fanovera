"use client";

import { useCallback, useEffect, useState } from "react";
import { Ic } from "../icons";

interface EmailFlow {
  key: string;
  group_key: string;
  label_fr: string;
  label_en: string;
  active: boolean;
  delay_hours: number;
  discount_pct: number;
  subject_fr: string;
  subject_en: string;
  min_order_cents: number;
  sort_order: number;
  sent_30d: number;
  sent_total: number;
  last_sent_at: string | null;
}

const GROUP_META: Record<string, { title: string; sub: string; trigger: string }> = {
  abandoned:     { title: "Panier abandonné",     sub: "Quand un visiteur saisit son email mais ne paie pas",          trigger: "Trigger : begin_checkout sans purchase" },
  post_purchase: { title: "Relance post-achat",   sub: "Recharge sur la nature consommable du produit (followers, etc.)", trigger: "Trigger : commande payée, X heures plus tard" },
  winback:       { title: "Win-back client inactif", sub: "Réactivation des clients qui n'ont pas recommandé",          trigger: "Trigger : dernière commande il y a X jours" },
  crosssell:     { title: "Cross-sell dans confirmation", sub: "Bloc upsell injecté dans l'email de confirmation",       trigger: "Trigger : ajouté à l'email de confirmation" },
};

const GROUP_ORDER = ["abandoned", "post_purchase", "winback", "crosssell"];

const token = () => localStorage.getItem("admin_pw") || "";

function fmtDelay(hours: number): string {
  if (hours === 0) return "immédiat";
  if (hours < 24) return `H+${hours}`;
  return `J+${Math.round(hours / 24)}`;
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "jamais";
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days >= 1) return `il y a ${days}j`;
  const hours = Math.floor(diffMs / 3600000);
  if (hours >= 1) return `il y a ${hours}h`;
  return `il y a ${Math.floor(diffMs / 60000)}min`;
}

export default function EmailFlowsView() {
  const [flows, setFlows] = useState<EmailFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchFlows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/email-flows", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setFlows(data.flows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  const updateFlow = async (key: string, patch: Partial<EmailFlow>) => {
    setSavingKey(key);
    // Optimistic UI: apply the patch locally so toggling feels instant.
    setFlows((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
    try {
      const res = await fetch("/api/admin/email-flows", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ key, ...patch }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setFlows((prev) => prev.map((f) => (f.key === key ? { ...f, ...data.flow } : f)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
      await fetchFlows();
    } finally {
      setSavingKey(null);
    }
  };

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    meta: GROUP_META[g],
    items: flows.filter((f) => f.group_key === g),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: "var(--a-ink-3)", fontWeight: 600 }}>
          {flows.filter((f) => f.active).length} actif{flows.filter((f) => f.active).length !== 1 ? "s" : ""} sur {flows.length}
        </div>
        <button className="btn" onClick={fetchFlows}>{Ic.refresh()} Rafraîchir</button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", marginBottom: 14, borderRadius: 8, background: "rgba(225,68,68,0.1)", border: "1px solid rgba(225,68,68,0.3)", color: "#E14444", fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>Chargement...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {grouped.map((group) => (
            <div key={group.group} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--a-line)", background: "rgba(82,96,230,0.04)" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--a-ink)" }}>{group.meta.title}</div>
                <div style={{ fontSize: 12, color: "var(--a-ink-3)", marginTop: 2 }}>{group.meta.sub}</div>
                <div style={{ fontSize: 11, color: "var(--a-ink-3)", marginTop: 4, fontFamily: "monospace" }}>{group.meta.trigger}</div>
              </div>

              <div>
                {group.items.map((f, idx) => (
                  <FlowRow
                    key={f.key}
                    flow={f}
                    saving={savingKey === f.key}
                    onUpdate={(patch) => updateFlow(f.key, patch)}
                    isLast={idx === group.items.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FlowRow({
  flow,
  saving,
  onUpdate,
  isLast,
}: {
  flow: EmailFlow;
  saving: boolean;
  onUpdate: (patch: Partial<EmailFlow>) => void;
  isLast: boolean;
}) {
  const isCrossSell = flow.group_key === "crosssell";
  const [subjectFr, setSubjectFr] = useState(flow.subject_fr);
  const [subjectEn, setSubjectEn] = useState(flow.subject_en);

  useEffect(() => {
    setSubjectFr(flow.subject_fr);
    setSubjectEn(flow.subject_en);
  }, [flow.subject_fr, flow.subject_en]);

  const inputStyle: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid var(--a-line)",
    background: "var(--a-card)",
    color: "var(--a-ink)",
    fontSize: 12,
  };

  return (
    <div
      style={{
        padding: "16px 20px",
        borderBottom: isLast ? "none" : "1px solid var(--a-line)",
        opacity: flow.active ? 1 : 0.55,
        transition: "opacity 120ms",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--a-ink)" }}>{flow.label_fr}</div>
            {!isCrossSell && (
              <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--a-ink-3)", background: "rgba(255,255,255,0.04)", padding: "2px 6px", borderRadius: 4 }}>
                {fmtDelay(flow.delay_hours)}
              </span>
            )}
            {flow.discount_pct > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--a-accent)", background: "rgba(82,96,230,0.12)", padding: "2px 6px", borderRadius: 4 }}>
                -{flow.discount_pct}% · FANO{flow.discount_pct}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--a-ink-3)" }}>
            {flow.sent_30d} envois (30j) · {flow.sent_total} au total · Dernier : {fmtRelative(flow.last_sent_at)}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {saving && <span style={{ fontSize: 11, color: "var(--a-ink-3)" }}>...</span>}
          <div
            className={"toggle " + (flow.active ? "on" : "")}
            onClick={() => onUpdate({ active: !flow.active })}
            style={{ cursor: "pointer" }}
            role="switch"
            aria-checked={flow.active}
            aria-label={`Activer ${flow.label_fr}`}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isCrossSell ? "120px 1fr" : "120px 120px 1fr 1fr", gap: 10, alignItems: "center" }}>
        {!isCrossSell && (
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--a-ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Délai (heures)</span>
            <input
              style={inputStyle}
              type="number"
              min={0}
              max={8760}
              value={flow.delay_hours}
              onChange={(e) => onUpdate({ delay_hours: Number(e.target.value) })}
            />
          </label>
        )}

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--a-ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Discount %</span>
          <select
            style={inputStyle}
            value={flow.discount_pct}
            onChange={(e) => onUpdate({ discount_pct: Number(e.target.value) })}
          >
            <option value={0}>Aucun code</option>
            <option value={10}>10% · FANO10</option>
            <option value={15}>15% · FANO15</option>
            <option value={20}>20% · FANO20</option>
            <option value={25}>25% · FANO25</option>
            <option value={30}>30% · FANO30</option>
          </select>
        </label>

        {!isCrossSell && (
          <>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--a-ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Sujet FR</span>
              <input
                style={inputStyle}
                value={subjectFr}
                onChange={(e) => setSubjectFr(e.target.value)}
                onBlur={() => subjectFr !== flow.subject_fr && onUpdate({ subject_fr: subjectFr })}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--a-ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Sujet EN</span>
              <input
                style={inputStyle}
                value={subjectEn}
                onChange={(e) => setSubjectEn(e.target.value)}
                onBlur={() => subjectEn !== flow.subject_en && onUpdate({ subject_en: subjectEn })}
              />
            </label>
          </>
        )}
      </div>
      {!isCrossSell && (
        <div style={{ marginTop: 8, fontSize: 10, color: "var(--a-ink-3)", fontFamily: "monospace" }}>
          Variables : {"{pct}"} = pourcentage de réduction · {"{code}"} = code promo (ex: FANO20)
        </div>
      )}
    </div>
  );
}
