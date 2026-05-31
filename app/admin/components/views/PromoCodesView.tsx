"use client";

import { useState, useEffect, useCallback } from "react";
import { Ic } from "../icons";

interface PromoCode {
  id: number;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number; // percent (1..100) or fixed EUR cents
  max_uses: number | null;
  used_count: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

type FormState = {
  code: string;
  discountType: "percent" | "fixed";
  /** Raw input: percent points for "percent", euros for "fixed". */
  value: string;
  maxUses: string; // "" = illimité
  expiresAt: string; // "" = pas d'expiration (YYYY-MM-DD)
  active: boolean;
};

const emptyForm: FormState = {
  code: "",
  discountType: "percent",
  value: "",
  maxUses: "",
  expiresAt: "",
  active: true,
};

function fmtEur(cents: number): string {
  return ((cents || 0) / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function discountLabel(c: PromoCode): string {
  return c.discount_type === "percent" ? `−${c.discount_value} %` : `−${fmtEur(c.discount_value)}`;
}

/** ISO timestamp → "YYYY-MM-DD" for <input type="date">. "" if null/invalid. */
function isoToDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function promoToForm(c: PromoCode): FormState {
  return {
    code: c.code,
    discountType: c.discount_type,
    value: c.discount_type === "percent" ? String(c.discount_value) : (c.discount_value / 100).toString(),
    maxUses: c.max_uses == null ? "" : String(c.max_uses),
    expiresAt: isoToDateInput(c.expires_at),
    active: c.active,
  };
}

function formToPayload(f: FormState) {
  const valueNum = Number(f.value);
  const discount_value =
    f.discountType === "fixed" ? Math.round((Number.isFinite(valueNum) ? valueNum : 0) * 100) : Math.round(valueNum);
  return {
    code: f.code,
    discount_type: f.discountType,
    discount_value,
    max_uses: f.maxUses.trim() === "" ? null : Math.round(Number(f.maxUses)),
    expires_at: f.expiresAt.trim() === "" ? null : f.expiresAt,
    active: f.active,
  };
}

export default function PromoCodesView() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<null | "new" | number>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const token = () => localStorage.getItem("admin_pw") || "";

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/promo-codes", { headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setCodes(data.codes || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const openNew = () => { setForm(emptyForm); setEditing("new"); };
  const openEdit = (c: PromoCode) => { setForm(promoToForm(c)); setEditing(c.id); };
  const closeEditor = () => { setEditing(null); setForm(emptyForm); };

  const valueNum = Number(form.value);
  const canSave =
    form.code.trim() !== "" &&
    Number.isFinite(valueNum) &&
    valueNum > 0 &&
    (form.discountType !== "percent" || valueNum <= 100);

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const isNew = editing === "new";
      const payload = formToPayload(form);
      const res = await fetch("/api/admin/promo-codes", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(isNew ? payload : { id: editing, ...payload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      closeEditor();
      await fetchCodes();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (c: PromoCode) => {
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ id: c.id, active: !c.active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await fetchCodes();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce code promo ?")) return;
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await fetchCodes();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  const fieldLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
    color: "var(--a-ink-3)", marginBottom: 6, display: "block",
  };
  const inputStyle: React.CSSProperties = {
    padding: "9px 12px", borderRadius: 8, border: "1px solid var(--a-line)",
    background: "var(--a-card)", color: "var(--a-ink)", fontSize: 13, width: "100%", fontFamily: "inherit",
  };

  const renderEditor = () => (
    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: "var(--a-ink)" }}>
          {editing === "new" ? "Nouveau code promo" : "Modifier le code"}
        </div>
        <button className="btn" onClick={closeEditor} style={{ padding: "4px 10px", fontSize: 11 }}>Fermer</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={fieldLabel}>Code</label>
          <input
            style={{ ...inputStyle, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}
            placeholder="ex: ETE2026"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            disabled={editing !== "new"}
          />
          {editing !== "new" && (
            <div style={{ fontSize: 10, color: "var(--a-ink-3)", marginTop: 4 }}>Le code n&apos;est pas modifiable après création.</div>
          )}
        </div>

        <div>
          <label style={fieldLabel}>Type de remise</label>
          <select
            style={inputStyle}
            value={form.discountType}
            onChange={(e) => setForm({ ...form, discountType: e.target.value as "percent" | "fixed" })}
          >
            <option value="percent">Pourcentage (%)</option>
            <option value="fixed">Montant fixe (€)</option>
          </select>
        </div>

        <div>
          <label style={fieldLabel}>{form.discountType === "percent" ? "Remise (%)" : "Remise (€)"}</label>
          <div style={{ position: "relative" }}>
            <input
              style={{ ...inputStyle, paddingRight: 26 }}
              type="number"
              min="0"
              step={form.discountType === "percent" ? "1" : "0.5"}
              max={form.discountType === "percent" ? "100" : undefined}
              placeholder={form.discountType === "percent" ? "20" : "2.00"}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--a-ink-3)", pointerEvents: "none" }}>
              {form.discountType === "percent" ? "%" : "€"}
            </span>
          </div>
        </div>

        <div>
          <label style={fieldLabel}>Nombre d&apos;utilisations max</label>
          <input
            style={inputStyle}
            type="number"
            min="1"
            placeholder="vide = illimité"
            value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
          />
          <div style={{ fontSize: 10, color: "var(--a-ink-3)", marginTop: 4 }}>Plafond global, tous clients confondus.</div>
        </div>

        <div>
          <label style={fieldLabel}>Expiration (optionnel)</label>
          <input
            style={inputStyle}
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          />
        </div>

        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", paddingBottom: 9 }}>
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <span style={{ fontWeight: 600 }}>Actif</span>
          </label>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px dashed var(--a-line)" }}>
        <button className="btn primary" onClick={save} disabled={!canSave || saving} style={{ padding: "9px 22px", fontSize: 13 }}>
          {saving ? "Enregistrement…" : editing === "new" ? "Créer le code" : "Enregistrer"}
        </button>
        <button className="btn" onClick={closeEditor} style={{ padding: "9px 18px", fontSize: 13 }}>Annuler</button>
        {!canSave && (
          <span style={{ marginLeft: 6, fontSize: 11, color: "var(--a-ink-3)", alignSelf: "center" }}>
            Renseigne un code et une remise valide{form.discountType === "percent" ? " (1–100 %)" : ""}.
          </span>
        )}
      </div>
    </div>
  );

  const renderCard = (c: PromoCode) => {
    const exhausted = c.max_uses != null && c.used_count >= c.max_uses;
    const expired = c.expires_at != null && new Date(c.expires_at).getTime() <= Date.now();
    const usageText = c.max_uses == null ? `${c.used_count} util. · illimité` : `${c.used_count} / ${c.max_uses}`;
    return (
      <div
        key={c.id}
        className="card"
        style={{
          padding: 14,
          display: "grid",
          gridTemplateColumns: "1fr auto auto auto auto auto",
          gap: 14,
          alignItems: "center",
          opacity: c.active && !exhausted && !expired ? 1 : 0.55,
          borderLeft: `3px solid ${c.discount_type === "percent" ? "#5260e6" : "#16a34a"}`,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <code style={{ fontSize: 15, fontWeight: 800, color: "var(--a-ink)", background: "var(--a-bg)", padding: "2px 8px", borderRadius: 6, letterSpacing: "0.04em" }}>
              {c.code}
            </code>
            {exhausted && <span style={{ fontSize: 10, fontWeight: 700, color: "#E14444" }}>ÉPUISÉ</span>}
            {expired && !exhausted && <span style={{ fontSize: 10, fontWeight: 700, color: "#E14444" }}>EXPIRÉ</span>}
          </div>
          <div style={{ fontSize: 11, color: "var(--a-ink-3)", marginTop: 4 }}>
            {c.expires_at ? `Expire le ${new Date(c.expires_at).toLocaleDateString("fr-FR")}` : "Pas d'expiration"}
          </div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 900, color: "var(--a-ink)", whiteSpace: "nowrap" }}>
          {discountLabel(c)}
        </div>
        <div style={{ textAlign: "right", whiteSpace: "nowrap", minWidth: 90 }} title="Utilisations / plafond">
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--a-ink)" }}>{usageText}</div>
          <div style={{ fontSize: 10, color: "var(--a-ink-3)", marginTop: 2 }}>utilisations</div>
        </div>
        <div
          className={"toggle " + (c.active ? "on" : "")}
          onClick={() => handleToggleActive(c)}
          style={{ cursor: "pointer" }}
          title={c.active ? "Actif" : "Inactif"}
        />
        <button className="icon-btn" style={{ width: 30, height: 30, borderRadius: 7 }} onClick={() => openEdit(c)} title="Modifier">
          {Ic.edit()}
        </button>
        <button className="icon-btn" style={{ width: 30, height: 30, borderRadius: 7, color: "#E14444" }} onClick={() => handleDelete(c.id)} title="Supprimer">
          {Ic.trash()}
        </button>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: "var(--a-ink-3)", fontWeight: 600 }}>
          {codes.length} code{codes.length !== 1 ? "s" : ""}
          {codes.length > 0 && (
            <span style={{ marginLeft: 8 }}>· {codes.filter((c) => c.active).length} actif{codes.filter((c) => c.active).length !== 1 ? "s" : ""}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={fetchCodes}>{Ic.refresh()} Rafraîchir</button>
          {editing === null && (
            <button className="btn primary" onClick={openNew}>{Ic.plus()} Ajouter un code</button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", marginBottom: 14, borderRadius: 8, background: "rgba(225,68,68,0.1)", border: "1px solid rgba(225,68,68,0.3)", color: "#E14444", fontSize: 13 }}>
          {error}
        </div>
      )}

      {editing !== null && renderEditor()}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>Chargement…</div>
        ) : codes.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Aucun code promo.</div>
            <div style={{ fontSize: 12 }}>Crée ton premier code pour offrir une remise.</div>
          </div>
        ) : (
          codes.map(renderCard)
        )}
      </div>
    </div>
  );
}
