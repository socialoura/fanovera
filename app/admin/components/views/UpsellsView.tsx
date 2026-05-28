"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Ic } from "../icons";

interface Upsell {
  id: number;
  service: string;
  qty: number;
  label: string;
  label_en: string;
  active: boolean;
  sort_order: number;
  price_cents: number;
  trigger_platform: string | null;
  trigger_service: string | null;
}

// Platform catalog: emoji + label + which "kinds" exist on that platform.
// Order of `kinds` is the order in dropdowns.
const PLATFORM_CATALOG: Record<
  string,
  { emoji: string; label: string; accent: string; kinds: string[] }
> = {
  instagram: { emoji: "📷", label: "Instagram", accent: "#d6296e", kinds: ["followers", "likes", "views"] },
  tiktok:    { emoji: "🎵", label: "TikTok",    accent: "#fe2c55", kinds: ["followers", "likes", "views"] },
  youtube:   { emoji: "▶️", label: "YouTube",   accent: "#ff0000", kinds: ["views", "subscribers"] },
  spotify:   { emoji: "🎧", label: "Spotify",   accent: "#1db954", kinds: ["streams", "followers"] },
  twitter:   { emoji: "𝕏",  label: "Twitter / X", accent: "#000000", kinds: ["followers"] },
  twitch:    { emoji: "🎮", label: "Twitch",    accent: "#9146ff", kinds: ["followers", "ai_viewers"] },
  linkedin:  { emoji: "💼", label: "LinkedIn",  accent: "#0a66c2", kinds: ["followers"] },
  facebook:  { emoji: "👍", label: "Facebook",  accent: "#1877f2", kinds: ["followers"] },
};

// Human label per kind (shown in dropdowns).
const KIND_LABEL: Record<string, string> = {
  followers: "Followers",
  likes: "Likes",
  views: "Vues",
  subscribers: "Abonnés",
  streams: "Streams",
  ai_viewers: "Live viewers (AI)",
};

// Maps (platform + kind) → canonical SMM service code stored in DB.
const SERVICE_CODE: Record<string, Record<string, string>> = {
  instagram: { followers: "ig_followers", likes: "ig_likes", views: "ig_views" },
  tiktok:    { followers: "tt_followers", likes: "tt_likes", views: "tt_views" },
  youtube:   { views: "yt_views", subscribers: "yt_subscribers" },
  spotify:   { streams: "sp_streams", followers: "sp_followers" },
  twitter:   { followers: "x_followers" },
  twitch:    { followers: "tw_followers", ai_viewers: "tw_live_viewers" },
  linkedin:  { followers: "li_followers" },
  facebook:  { followers: "fb_likes" }, // Facebook "page like" = follower equivalent
};

// Reverse map: SMM code → kind.
const CODE_TO_KIND: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const platform of Object.keys(SERVICE_CODE)) {
    for (const [kind, code] of Object.entries(SERVICE_CODE[platform])) out[code] = kind;
  }
  return out;
})();

function formatQty(n: number) {
  return n.toLocaleString("fr-FR");
}

function suggestLabel(kind: string, qty: number, locale: "fr" | "en") {
  if (!kind || !qty) return "";
  const kindFr: Record<string, string> = {
    followers: "followers",
    likes: "likes",
    views: "vues",
    subscribers: "abonnés",
    streams: "streams",
    ai_viewers: "viewers en live",
  };
  const kindEn: Record<string, string> = {
    followers: "followers",
    likes: "likes",
    views: "views",
    subscribers: "subscribers",
    streams: "streams",
    ai_viewers: "live viewers",
  };
  if (locale === "fr") return `Ajouter +${formatQty(qty)} ${kindFr[kind] || kind}`;
  return `Add +${qty.toLocaleString("en-US")} ${kindEn[kind] || kind}`;
}

type FormState = {
  triggerPlatform: string;     // e.g. "instagram"
  triggerService: string;      // e.g. "followers" (what client must be buying)
  upsellKind: string;          // e.g. "likes" — auto-mapped to SMM code
  customServiceCode: string;   // override if user wants a custom code
  qty: number;
  priceEur: number;
  labelFr: string;
  labelEn: string;
  labelTouched: { fr: boolean; en: boolean }; // suppress auto-fill once user typed
  active: boolean;
  sortOrder: number;
};

const emptyForm: FormState = {
  triggerPlatform: "",
  triggerService: "",
  upsellKind: "",
  customServiceCode: "",
  qty: 100,
  priceEur: 2,
  labelFr: "",
  labelEn: "",
  labelTouched: { fr: false, en: false },
  active: true,
  sortOrder: 0,
};

function upsellToForm(u: Upsell): FormState {
  const reverseKind = CODE_TO_KIND[u.service] || "";
  return {
    triggerPlatform: u.trigger_platform || "",
    triggerService: u.trigger_service || "",
    upsellKind: reverseKind,
    customServiceCode: reverseKind ? "" : u.service, // only show custom if no kind matches
    qty: u.qty,
    priceEur: (u.price_cents || 0) / 100,
    labelFr: u.label || "",
    labelEn: u.label_en || "",
    labelTouched: { fr: Boolean(u.label), en: Boolean(u.label_en) },
    active: u.active,
    sortOrder: u.sort_order,
  };
}

function formToPayload(f: FormState) {
  const code =
    SERVICE_CODE[f.triggerPlatform]?.[f.upsellKind] ||
    f.customServiceCode.trim();
  return {
    service: code,
    qty: Math.max(1, Math.round(f.qty || 0)),
    label: f.labelFr || suggestLabel(f.upsellKind, f.qty, "fr"),
    label_en: f.labelEn || suggestLabel(f.upsellKind, f.qty, "en"),
    active: f.active,
    sort_order: f.sortOrder || 0,
    price_cents: Math.round((Number(f.priceEur) || 0) * 100),
    trigger_platform: f.triggerPlatform || null,
    trigger_service: f.triggerService || null,
  };
}

export default function UpsellsView() {
  const [upsells, setUpsells] = useState<Upsell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor state: null = closed, "new" = add form, number = edit existing
  const [editing, setEditing] = useState<null | "new" | number>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);

  const token = () => localStorage.getItem("admin_pw") || "";

  const fetchUpsells = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/upsells", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setUpsells(data.upsells);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUpsells(); }, [fetchUpsells]);

  const openNew = () => {
    setForm(emptyForm);
    setShowAdvanced(false);
    setEditing("new");
  };

  const openEdit = (u: Upsell) => {
    setForm(upsellToForm(u));
    setShowAdvanced(Boolean(u.sort_order) || (u.service && !CODE_TO_KIND[u.service]));
    setEditing(u.id);
  };

  const closeEditor = () => { setEditing(null); setForm(emptyForm); };

  // Derived: available "service" choices for the chosen platform
  const triggerServiceOptions = useMemo(() => {
    const cfg = PLATFORM_CATALOG[form.triggerPlatform];
    return cfg ? cfg.kinds : [];
  }, [form.triggerPlatform]);

  const upsellKindOptions = useMemo(() => {
    const cfg = PLATFORM_CATALOG[form.triggerPlatform];
    return cfg ? cfg.kinds : [];
  }, [form.triggerPlatform]);

  // Live label suggestions — only auto-fill if user hasn't typed yet
  useEffect(() => {
    setForm((f) => {
      const next = { ...f };
      if (!f.labelTouched.fr) next.labelFr = suggestLabel(f.upsellKind, f.qty, "fr");
      if (!f.labelTouched.en) next.labelEn = suggestLabel(f.upsellKind, f.qty, "en");
      return next;
    });
  }, [form.upsellKind, form.qty]);

  // Reset dependent fields when platform changes
  const onPlatformChange = (platform: string) => {
    const cfg = PLATFORM_CATALOG[platform];
    setForm((f) => ({
      ...f,
      triggerPlatform: platform,
      triggerService: cfg && cfg.kinds.length === 1 ? cfg.kinds[0] : "",
      upsellKind: "",
      customServiceCode: "",
    }));
  };

  const canSave =
    Boolean(form.triggerPlatform) &&
    Boolean(form.triggerService) &&
    Boolean(SERVICE_CODE[form.triggerPlatform]?.[form.upsellKind] || form.customServiceCode.trim()) &&
    form.qty > 0 &&
    form.priceEur > 0;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const isNew = editing === "new";
      const payload = formToPayload(form);
      const res = await fetch("/api/admin/upsells", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(isNew ? payload : { id: editing, ...payload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      closeEditor();
      await fetchUpsells();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: Upsell) => {
    try {
      const res = await fetch("/api/admin/upsells", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ id: u.id, active: !u.active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await fetchUpsells();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet upsell ?")) return;
    try {
      const res = await fetch("/api/admin/upsells", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await fetchUpsells();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  const selectStyle: React.CSSProperties = {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid var(--a-line)",
    background: "var(--a-card)",
    color: "var(--a-ink)",
    fontSize: 13,
    width: "100%",
    fontFamily: "inherit",
  };

  const inputStyle: React.CSSProperties = { ...selectStyle };

  const fieldLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "var(--a-ink-3)",
    marginBottom: 6,
    display: "block",
  };

  const accent = PLATFORM_CATALOG[form.triggerPlatform]?.accent || "#5260e6";
  const generatedCode = SERVICE_CODE[form.triggerPlatform]?.[form.upsellKind] || form.customServiceCode.trim();

  const renderEditor = () => (
    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: "var(--a-ink)" }}>
          {editing === "new" ? "Nouvel upsell" : "Modifier l'upsell"}
        </div>
        <button className="btn" onClick={closeEditor} style={{ padding: "4px 10px", fontSize: 11 }}>Fermer</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={fieldLabel}>① Sur quelle plateforme ?</label>
            <select style={selectStyle} value={form.triggerPlatform} onChange={(e) => onPlatformChange(e.target.value)}>
              <option value="">— Choisir une plateforme —</option>
              {Object.entries(PLATFORM_CATALOG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.emoji} {cfg.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={fieldLabel}>② Quand le client achète…</label>
            <select
              style={selectStyle}
              value={form.triggerService}
              onChange={(e) => setForm({ ...form, triggerService: e.target.value })}
              disabled={!form.triggerPlatform}
            >
              <option value="">{form.triggerPlatform ? "— Choisir le service acheté —" : "— Choisis d'abord une plateforme —"}</option>
              {triggerServiceOptions.map((k) => (
                <option key={k} value={k}>{KIND_LABEL[k] || k}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={fieldLabel}>③ Proposer comme upsell</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px", gap: 8 }}>
              <select
                style={selectStyle}
                value={form.upsellKind}
                onChange={(e) => setForm({ ...form, upsellKind: e.target.value, customServiceCode: "" })}
                disabled={!form.triggerPlatform}
              >
                <option value="">— Type —</option>
                {upsellKindOptions.map((k) => (
                  <option key={k} value={k}>{KIND_LABEL[k] || k}</option>
                ))}
              </select>
              <input
                style={inputStyle}
                type="number"
                min="1"
                placeholder="Qty"
                value={form.qty || ""}
                onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
              />
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...inputStyle, paddingRight: 26 }}
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="Prix"
                  value={form.priceEur || ""}
                  onChange={(e) => setForm({ ...form, priceEur: Number(e.target.value) })}
                />
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--a-ink-3)", pointerEvents: "none" }}>€</span>
              </div>
            </div>
            {generatedCode && (
              <div style={{ fontSize: 11, color: "var(--a-ink-3)", marginTop: 6 }}>
                Code SMM : <code style={{ background: "var(--a-bg)", padding: "1px 6px", borderRadius: 4 }}>{generatedCode}</code>
              </div>
            )}
          </div>

          <div>
            <label style={fieldLabel}>④ Texte affiché au client</label>
            <input
              style={{ ...inputStyle, marginBottom: 6 }}
              placeholder="FR — auto si vide"
              value={form.labelFr}
              onChange={(e) => setForm({ ...form, labelFr: e.target.value, labelTouched: { ...form.labelTouched, fr: true } })}
            />
            <input
              style={inputStyle}
              placeholder="EN — auto if empty"
              value={form.labelEn}
              onChange={(e) => setForm({ ...form, labelEn: e.target.value, labelTouched: { ...form.labelTouched, en: true } })}
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: "none", border: "none", color: "var(--a-ink-3)", fontSize: 11,
                fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
                cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 4,
              }}
            >
              {showAdvanced ? "▾" : "▸"} Avancé
            </button>
            {showAdvanced && (
              <div style={{ marginTop: 10, padding: 12, background: "var(--a-bg)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ ...fieldLabel, marginBottom: 4 }}>Priorité (sort order)</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={form.sortOrder || ""}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    placeholder="0 = première"
                  />
                  <div style={{ fontSize: 10, color: "var(--a-ink-3)", marginTop: 4 }}>Utile si plusieurs upsells matchent. Le plus bas s&apos;affiche.</div>
                </div>
                <div>
                  <label style={{ ...fieldLabel, marginBottom: 4 }}>Code SMM personnalisé</label>
                  <input
                    style={inputStyle}
                    placeholder="ex: ig_likes_hq"
                    value={form.customServiceCode}
                    onChange={(e) => setForm({ ...form, customServiceCode: e.target.value, upsellKind: "" })}
                  />
                  <div style={{ fontSize: 10, color: "var(--a-ink-3)", marginTop: 4 }}>Remplace le code auto-généré. Laisse vide pour utiliser le type ci-dessus.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live preview */}
        <div>
          <div style={fieldLabel}>Aperçu côté client</div>
          <div style={{
            padding: 16, borderRadius: 14, border: `2px solid ${accent}`,
            background: `color-mix(in srgb, ${accent} 6%, white)`,
            display: "flex", alignItems: "center", gap: 12,
            opacity: form.upsellKind && form.qty && form.priceEur ? 1 : 0.4,
          }}>
            <div style={{
              flexShrink: 0, width: 22, height: 22, borderRadius: 6,
              background: accent, display: "grid", placeItems: "center",
            }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1, color: "#1a1a2e" }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: accent, marginBottom: 2 }}>
                + Boostez encore plus
              </div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {form.labelFr || suggestLabel(form.upsellKind, form.qty, "fr") || "— ton texte ici —"}
              </div>
            </div>
            <div style={{ textAlign: "right", color: "#1a1a2e" }}>
              <div style={{ fontSize: 18, fontWeight: 900 }}>
                +{(form.priceEur || 0).toFixed(2)} €
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "var(--a-ink-3)", marginTop: 8, lineHeight: 1.5 }}>
            Apparaît sur <strong>{PLATFORM_CATALOG[form.triggerPlatform]?.label || "—"}</strong> quand le client achète <strong>{KIND_LABEL[form.triggerService] || "—"}</strong>.
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginTop: 18, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <span style={{ fontWeight: 600 }}>Actif (visible sur le site)</span>
          </label>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px dashed var(--a-line)" }}>
        <button
          className="btn primary"
          onClick={save}
          disabled={!canSave || saving}
          style={{ padding: "9px 22px", fontSize: 13 }}
        >
          {saving ? "Enregistrement…" : editing === "new" ? "Créer l'upsell" : "Enregistrer"}
        </button>
        <button className="btn" onClick={closeEditor} style={{ padding: "9px 18px", fontSize: 13 }}>Annuler</button>
        {!canSave && (
          <span style={{ marginLeft: 6, fontSize: 11, color: "var(--a-ink-3)", alignSelf: "center" }}>
            Remplis plateforme, déclencheur, type, qty et prix pour activer.
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: "var(--a-ink-3)", fontWeight: 600 }}>
          {upsells.length} upsell{upsells.length !== 1 ? "s" : ""}
          {upsells.length > 0 && (
            <span style={{ marginLeft: 8 }}>· {upsells.filter((u) => u.active).length} actif{upsells.filter((u) => u.active).length !== 1 ? "s" : ""}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={fetchUpsells}>{Ic.refresh()} Rafraîchir</button>
          {editing === null && (
            <button className="btn primary" onClick={openNew}>{Ic.plus()} Ajouter upsell</button>
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
        ) : upsells.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Aucun upsell pour l&apos;instant.</div>
            <div style={{ fontSize: 12 }}>Crée ton premier upsell pour booster le panier moyen.</div>
          </div>
        ) : (
          upsells.map((u) => {
            const cfg = PLATFORM_CATALOG[u.trigger_platform || ""];
            const accent = cfg?.accent || "#5260e6";
            const triggerLabel = u.trigger_service ? (KIND_LABEL[u.trigger_service] || u.trigger_service) : "—";
            const kind = CODE_TO_KIND[u.service];
            const kindLabel = kind ? (KIND_LABEL[kind] || kind) : u.service;
            return (
              <div
                key={u.id}
                className="card"
                style={{
                  padding: 14,
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto auto auto auto",
                  gap: 14,
                  alignItems: "center",
                  opacity: u.active ? 1 : 0.55,
                  borderLeft: `3px solid ${accent}`,
                }}
              >
                <div style={{ fontSize: 22, lineHeight: 1 }}>{cfg?.emoji || "·"}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--a-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.label || `+${formatQty(u.qty)} ${kindLabel}`}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--a-ink-3)", marginTop: 3 }}>
                    Sur <strong>{cfg?.label || u.trigger_platform || "—"}</strong> · quand achat <strong>{triggerLabel}</strong> · livre <strong>{formatQty(u.qty)} {kindLabel}</strong>
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "var(--a-ink)", whiteSpace: "nowrap" }}>
                  {((u.price_cents || 0) / 100).toFixed(2)} €
                </div>
                <div
                  className={"toggle " + (u.active ? "on" : "")}
                  onClick={() => handleToggleActive(u)}
                  style={{ cursor: "pointer" }}
                  title={u.active ? "Actif" : "Inactif"}
                />
                <button
                  className="icon-btn"
                  style={{ width: 30, height: 30, borderRadius: 7 }}
                  onClick={() => openEdit(u)}
                  title="Modifier"
                >
                  {Ic.edit()}
                </button>
                <button
                  className="icon-btn"
                  style={{ width: 30, height: 30, borderRadius: 7, color: "#E14444" }}
                  onClick={() => handleDelete(u.id)}
                  title="Supprimer"
                >
                  {Ic.trash()}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
