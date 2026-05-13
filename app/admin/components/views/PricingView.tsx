"use client";

import { useState, useEffect, useCallback } from "react";
import { Ic } from "../icons";
import { applyPopularPackSelection, sortAdminPricingPacks } from "@/app/lib/adminPricing";

/* ─── Types ─── */
interface Pack {
  id: number;
  service: string;
  qty: number;
  price: number;
  price_usd: number;
  price_gbp: number;
  price_brl: number;
  price_try: number;
  price_cad: number;
  price_aud: number;
  price_chf: number;
  price_mxn: number;
  price_sek: number;
  popular: boolean;
  active: boolean;
  sort_order: number;
}

type NewPack = Omit<Pack, "id">;

/* ─── Constants ─── */
const SERVICES = [
  "ig_followers",
  "ig_likes",
  "ig_views",
  "tt_followers",
  "tt_likes",
  "tt_views",
  "followers",
  "likes",
  "views",
  "yt_subscribers",
  "yt_likes",
  "yt_views",
  "sp_streams",
  "x_followers",
  "x_likes",
  "x_retweets",
  "tw_followers",
  "tw_live_viewers",
  "fb_followers",
  "fb_likes",
  "li_followers",
] as const;

const SERVICE_LABELS: Record<string, string> = {
  ig_followers: "IG Followers",
  ig_likes: "IG Likes",
  ig_views: "IG Views",
  tt_followers: "TikTok Followers",
  tt_likes: "TikTok Likes",
  tt_views: "TikTok Views",
  followers: "Followers (legacy)",
  likes: "Likes (legacy)",
  views: "Views (legacy)",
  yt_subscribers: "YT Subscribers",
  yt_likes: "YT Likes",
  yt_views: "YT Views",
  sp_streams: "SP Streams",
  x_followers: "X Followers",
  x_likes: "X Likes",
  x_retweets: "X Retweets",
  tw_followers: "TW Followers",
  tw_live_viewers: "TW Live Viewers",
  fb_followers: "FB Followers",
  fb_likes: "FB Likes",
  li_followers: "LI Followers",
};

/* ─── EUR conversion rates (approximate) ─── */
const EUR_RATES: Record<string, number> = {
  price_usd: 1.08,
  price_gbp: 0.86,
  price_brl: 5.50,
  price_try: 35.0,
  price_cad: 1.48,
  price_aud: 1.66,
  price_chf: 0.97,
  price_mxn: 18.5,
  price_sek: 11.5,
};

function roundCurrencyConversion(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatConvertedPrice(value: number): string {
  return value.toFixed(1);
}

function convertFromEur(eur: number): Omit<Pack, 'id' | 'service' | 'qty' | 'price' | 'popular' | 'active' | 'sort_order'> {
  return {
    price_usd: roundCurrencyConversion(eur * EUR_RATES.price_usd),
    price_gbp: roundCurrencyConversion(eur * EUR_RATES.price_gbp),
    price_brl: roundCurrencyConversion(eur * EUR_RATES.price_brl),
    price_try: roundCurrencyConversion(eur * EUR_RATES.price_try),
    price_cad: roundCurrencyConversion(eur * EUR_RATES.price_cad),
    price_aud: roundCurrencyConversion(eur * EUR_RATES.price_aud),
    price_chf: roundCurrencyConversion(eur * EUR_RATES.price_chf),
    price_mxn: roundCurrencyConversion(eur * EUR_RATES.price_mxn),
    price_sek: roundCurrencyConversion(eur * EUR_RATES.price_sek),
  };
}

/* ─── API helpers ─── */
function authHeaders(): HeadersInit {
  const pw = localStorage.getItem("admin_pw") || "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${pw}`,
  };
}

async function fetchPacks(): Promise<Pack[]> {
  const res = await fetch("/api/admin/pricing", { headers: authHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to fetch packs");
  }
  const data = await res.json();
  return (data.packs || []).map(normalizePack);
}

function normalizePack(p: Record<string, unknown>): Pack {
  return {
    id: Number(p.id),
    service: String(p.service),
    qty: Number(p.qty) || 0,
    price: Number(p.price) || 0,
    price_usd: Number(p.price_usd) || 0,
    price_gbp: Number(p.price_gbp) || 0,
    price_brl: Number(p.price_brl) || 0,
    price_try: Number(p.price_try) || 0,
    price_cad: Number(p.price_cad) || 0,
    price_aud: Number(p.price_aud) || 0,
    price_chf: Number(p.price_chf) || 0,
    price_mxn: Number(p.price_mxn) || 0,
    price_sek: Number(p.price_sek) || 0,
    popular: Boolean(p.popular),
    active: p.active !== false,
    sort_order: Number(p.sort_order) || 0,
  };
}

async function createPack(pack: NewPack): Promise<Pack> {
  const res = await fetch("/api/admin/pricing", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(pack),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to create pack");
  }
  const data = await res.json();
  return normalizePack(data.pack);
}

async function updatePack(id: number, fields: Partial<Pack>): Promise<Pack> {
  const res = await fetch("/api/admin/pricing", {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ id, ...fields }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to update pack");
  }
  const data = await res.json();
  return normalizePack(data.pack);
}

async function deletePack(id: number): Promise<void> {
  const res = await fetch("/api/admin/pricing", {
    method: "DELETE",
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to delete pack");
  }
}

/* ─── Component ─── */
export default function PricingView() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeService, setActiveService] = useState<string>(SERVICES[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState<Partial<Pack>>({});
  const [newPack, setNewPack] = useState<NewPack>(emptyPack(SERVICES[0]));
  const [copyTarget, setCopyTarget] = useState<string>("");
  const [copying, setCopying] = useState(false);

  function emptyPack(service: string): NewPack {
    return {
      service,
      qty: 0,
      price: 0,
      price_usd: 0,
      price_gbp: 0,
      price_brl: 0,
      price_try: 0,
      price_cad: 0,
      price_aud: 0,
      price_chf: 0,
      price_mxn: 0,
      price_sek: 0,
      popular: false,
      active: true,
      sort_order: 0,
    };
  }

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPacks();
      setPacks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load packs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Grouped packs for current tab */
  const filtered = sortAdminPricingPacks(packs.filter((p) => p.service === activeService));
  const popularPack = filtered.find((p) => p.popular);

  /* Handlers */
  const handleAdd = async () => {
    try {
      setError(null);
      const created = await createPack(newPack);
      setPacks((prev) => applyPopularPackSelection([...prev, created], created));
      setShowAddForm(false);
      setNewPack(emptyPack(activeService));
      setSuccess("Pack créé avec succès.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create pack");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this pack?")) return;
    try {
      setError(null);
      await deletePack(id);
      setPacks((prev) => prev.filter((p) => p.id !== id));
      setSuccess("Pack supprimé avec succès.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete pack");
    }
  };

  const handleTogglePopular = async (pack: Pack) => {
    try {
      setError(null);
      const updated = await updatePack(pack.id, { popular: !pack.popular });
      setPacks((prev) => applyPopularPackSelection(prev, updated));
      setSuccess(updated.popular ? "Pack défini comme le plus populaire." : "Pack retiré des populaires.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update pack");
    }
  };

  const handleToggleActive = async (pack: Pack) => {
    try {
      setError(null);
      const updated = await updatePack(pack.id, { active: !pack.active });
      setPacks((prev) => applyPopularPackSelection(prev, updated));
      setSuccess("Pack mis à jour.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update pack");
    }
  };

  const handleMovePack = async (pack: Pack, direction: -1 | 1) => {
    const index = filtered.findIndex((p) => p.id === pack.id);
    const target = filtered[index + direction];
    if (!target) return;

    const currentOrder = pack.sort_order || (index + 1) * 1000;
    const targetOrder = target.sort_order || (index + direction + 1) * 1000;

    try {
      setError(null);
      const [updatedPack, updatedTarget] = await Promise.all([
        updatePack(pack.id, { sort_order: targetOrder }),
        updatePack(target.id, { sort_order: currentOrder }),
      ]);

      setPacks((prev) =>
        prev.map((p) => {
          if (p.id === updatedPack.id) return updatedPack;
          if (p.id === updatedTarget.id) return updatedTarget;
          return p;
        }),
      );
      setSuccess("Ordre des packs mis à jour.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reorder packs");
    }
  };

  const startEdit = (pack: Pack) => {
    setEditingId(pack.id);
    setEditFields({
      qty: pack.qty,
      price: pack.price,
      price_usd: pack.price_usd,
      price_gbp: pack.price_gbp,
      price_brl: pack.price_brl,
      price_try: pack.price_try,
      price_cad: pack.price_cad,
      price_aud: pack.price_aud,
      price_chf: pack.price_chf,
      price_mxn: pack.price_mxn,
      price_sek: pack.price_sek,
      popular: pack.popular,
      active: pack.active,
      sort_order: pack.sort_order,
    });
  };

  const saveEdit = async () => {
    if (editingId === null) return;
    try {
      setError(null);
      const updated = await updatePack(editingId, editFields);
      setPacks((prev) => applyPopularPackSelection(prev, updated));
      setEditingId(null);
      setEditFields({});
      setSuccess("Pack mis à jour avec succès.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update pack");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFields({});
  };

  const handleCopyPacks = async () => {
    if (!copyTarget || copyTarget === activeService) return;
    const source = packs.filter((p) => p.service === activeService);
    if (source.length === 0) { setError("Aucun pack à copier."); return; }
    if (!confirm(`Copier ${source.length} pack(s) de ${SERVICE_LABELS[activeService]} vers ${SERVICE_LABELS[copyTarget]} ?`)) return;
    setCopying(true);
    setError(null);
    try {
      const created: Pack[] = [];
      for (const p of source) {
        const np: NewPack = {
          service: copyTarget,
          qty: p.qty,
          price: p.price,
          price_usd: p.price_usd,
          price_gbp: p.price_gbp,
          price_brl: p.price_brl,
          price_try: p.price_try,
          price_cad: p.price_cad,
          price_aud: p.price_aud,
          price_chf: p.price_chf,
          price_mxn: p.price_mxn,
          price_sek: p.price_sek,
          popular: p.popular,
          active: p.active,
          sort_order: p.sort_order,
        };
        created.push(await createPack(np));
      }
      setPacks((prev) => created.reduce((next, pack) => applyPopularPackSelection([...next, pack], pack), prev));
      setSuccess(`${created.length} pack(s) copiés vers ${SERVICE_LABELS[copyTarget]}.`);
      setCopyTarget("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la copie");
    } finally {
      setCopying(false);
    }
  };

  /* Count packs per service for tab badges */
  const countByService = (svc: string) => packs.filter((p) => p.service === svc).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 16 }}>
        <div style={{ fontSize: 13, color: "var(--a-ink-3)", fontWeight: 600 }}>
          {SERVICES.length} services &middot; {packs.length} packs
          <span style={{ marginLeft: 10, color: "var(--a-ink)" }}>
            Populaire actuel : {popularPack ? `${popularPack.qty.toLocaleString("fr-FR")} unités` : "aucun"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={copyTarget} onChange={(e) => setCopyTarget(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--a-line)", background: "var(--a-card)", color: "var(--a-ink)", fontSize: 12 }}>
            <option value="">Copier vers…</option>
            {SERVICES.filter((s) => s !== activeService).map((s) => (
              <option key={s} value={s}>{SERVICE_LABELS[s]}</option>
            ))}
          </select>
          <button className="btn" disabled={!copyTarget || copying} onClick={handleCopyPacks} style={{ fontSize: 12 }}>{copying ? "Copie…" : "Copier packs"}</button>
          <button className="btn" onClick={load}>{Ic.refresh()} Reload</button>
          <button className="btn primary" onClick={() => { setNewPack(emptyPack(activeService)); setShowAddForm(true); }}>{Ic.plus()} Add pack</button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 12, fontSize: 12, color: "var(--a-accent)", fontWeight: 600 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ marginBottom: 12, fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
          {success}
        </div>
      )}

      {/* Service tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20, padding: 6, background: "var(--a-card)", border: "1px solid var(--a-line)", borderRadius: 12 }}>
        {SERVICES.map((svc) => (
          <button
            key={svc}
            className={"tab " + (activeService === svc ? "active" : "")}
            onClick={() => { setActiveService(svc); setShowAddForm(false); setEditingId(null); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px" }}
          >
            {SERVICE_LABELS[svc]}
            <span className="pill" style={{ padding: "1px 6px", fontSize: 10 }}>{countByService(svc)}</span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && <div style={{ padding: 32, textAlign: "center", color: "var(--a-ink-3)" }}>Loading...</div>}

      {/* Table */}
      {!loading && (
        <div className="card" style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--a-line)" }}>
                <th style={thStyle}>Ordre</th>
                <th style={thStyle}>Qty</th>
                <th style={thStyle}>EUR</th>
                <th style={thStyle}>USD</th>
                <th style={thStyle}>GBP</th>
                <th style={thStyle}>BRL</th>
                <th style={thStyle}>TRY</th>
                <th style={thStyle}>CAD</th>
                <th style={thStyle}>AUD</th>
                <th style={thStyle}>CHF</th>
                <th style={thStyle}>MXN</th>
                <th style={thStyle}>SEK</th>
                <th style={thStyle}>Plus populaire</th>
                <th style={thStyle}>Active</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pack, index) =>
                editingId === pack.id ? (
                  <tr key={pack.id} style={{ borderBottom: "1px solid var(--a-line)", background: "var(--a-card)" }}>
                    <td style={tdStyle}><input type="number" value={editFields.sort_order ?? ""} onChange={(e) => setEditFields({ ...editFields, sort_order: Number(e.target.value) })} style={inputStyle} /></td>
                    <td style={tdStyle}><input type="number" value={editFields.qty ?? ""} onChange={(e) => setEditFields({ ...editFields, qty: Number(e.target.value) })} style={inputStyle} /></td>
                    <td style={tdStyle}><input type="number" step="0.01" value={editFields.price ?? ""} onChange={(e) => setEditFields({ ...editFields, price: Number(e.target.value) })} style={inputStyle} /></td>
                    <td style={tdStyle}><input type="number" step="0.01" value={editFields.price_usd ?? ""} onChange={(e) => setEditFields({ ...editFields, price_usd: Number(e.target.value) })} style={inputStyle} /></td>
                    <td style={tdStyle}><input type="number" step="0.01" value={editFields.price_gbp ?? ""} onChange={(e) => setEditFields({ ...editFields, price_gbp: Number(e.target.value) })} style={inputStyle} /></td>
                    <td style={tdStyle}><input type="number" step="0.01" value={editFields.price_brl ?? ""} onChange={(e) => setEditFields({ ...editFields, price_brl: Number(e.target.value) })} style={inputStyle} /></td>
                    <td style={tdStyle}><input type="number" step="0.01" value={editFields.price_try ?? ""} onChange={(e) => setEditFields({ ...editFields, price_try: Number(e.target.value) })} style={inputStyle} /></td>
                    <td style={tdStyle}><input type="number" step="0.01" value={editFields.price_cad ?? ""} onChange={(e) => setEditFields({ ...editFields, price_cad: Number(e.target.value) })} style={inputStyle} /></td>
                    <td style={tdStyle}><input type="number" step="0.01" value={editFields.price_aud ?? ""} onChange={(e) => setEditFields({ ...editFields, price_aud: Number(e.target.value) })} style={inputStyle} /></td>
                    <td style={tdStyle}><input type="number" step="0.01" value={editFields.price_chf ?? ""} onChange={(e) => setEditFields({ ...editFields, price_chf: Number(e.target.value) })} style={inputStyle} /></td>
                    <td style={tdStyle}><input type="number" step="0.01" value={editFields.price_mxn ?? ""} onChange={(e) => setEditFields({ ...editFields, price_mxn: Number(e.target.value) })} style={inputStyle} /></td>
                    <td style={tdStyle}><input type="number" step="0.01" value={editFields.price_sek ?? ""} onChange={(e) => setEditFields({ ...editFields, price_sek: Number(e.target.value) })} style={inputStyle} /></td>
                    <td style={tdStyle}>
                      <label className="admin-radio-choice">
                        <input type="radio" name={`popular-${activeService}`} checked={editFields.popular ?? false} onChange={() => setEditFields({ ...editFields, popular: true })} />
                        Choisir
                      </label>
                    </td>
                    <td style={tdStyle}>
                      <input type="checkbox" checked={editFields.active ?? false} onChange={(e) => setEditFields({ ...editFields, active: e.target.checked })} />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <button className="btn" onClick={() => { const eur = editFields.price ?? 0; setEditFields({ ...editFields, ...convertFromEur(eur) }); }} style={{ padding: "4px 8px", fontSize: 11, color: "var(--a-accent)" }} title="Convertir le prix EUR dans toutes les devises">€→All</button>
                        <button className="btn primary" onClick={saveEdit} style={{ padding: "4px 8px", fontSize: 11 }}>{Ic.check()} Save</button>
                        <button className="btn" onClick={cancelEdit} style={{ padding: "4px 8px", fontSize: 11 }}>{Ic.x()} Cancel</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={pack.id} style={{ borderBottom: "1px solid var(--a-line)" }}>
                    <td style={tdStyle}>
                      <div className="admin-pack-order">
                        <span>#{index + 1}</span>
                        <button className="icon-btn" onClick={() => handleMovePack(pack, -1)} disabled={index === 0} title="Monter ce pack">
                          {Ic.arrowUp()}
                        </button>
                        <button className="icon-btn" onClick={() => handleMovePack(pack, 1)} disabled={index === filtered.length - 1} title="Descendre ce pack">
                          {Ic.arrowDown()}
                        </button>
                      </div>
                    </td>
                    <td style={tdStyle}><strong>{pack.qty.toLocaleString()}</strong></td>
                    <td style={tdStyle}>{pack.price.toFixed(2)}</td>
                    <td style={tdStyle}>{formatConvertedPrice(pack.price_usd)}</td>
                    <td style={tdStyle}>{formatConvertedPrice(pack.price_gbp)}</td>
                    <td style={tdStyle}>{formatConvertedPrice(pack.price_brl)}</td>
                    <td style={tdStyle}>{formatConvertedPrice(pack.price_try)}</td>
                    <td style={tdStyle}>{formatConvertedPrice(pack.price_cad)}</td>
                    <td style={tdStyle}>{formatConvertedPrice(pack.price_aud)}</td>
                    <td style={tdStyle}>{formatConvertedPrice(pack.price_chf)}</td>
                    <td style={tdStyle}>{formatConvertedPrice(pack.price_mxn)}</td>
                    <td style={tdStyle}>{formatConvertedPrice(pack.price_sek)}</td>
                    <td style={tdStyle}>
                      {pack.popular ? (
                        <button className="admin-popular-btn active" onClick={() => handleTogglePopular(pack)} title="Retirer le badge populaire">
                          {Ic.star()} Populaire
                        </button>
                      ) : (
                        <button className="admin-popular-btn" onClick={() => handleTogglePopular(pack)} title="Définir ce pack comme le plus populaire">
                          Choisir
                        </button>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div className={"toggle " + (pack.active ? "on" : "")} onClick={() => handleToggleActive(pack)} style={{ width: 32, height: 18, cursor: "pointer" }} />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="icon-btn" onClick={() => startEdit(pack)} style={{ width: 28, height: 28, borderRadius: 7 }}>{Ic.edit()}</button>
                        <button className="icon-btn" onClick={() => handleDelete(pack.id)} style={{ width: 28, height: 28, borderRadius: 7, color: "var(--a-accent)" }}>{Ic.trash()}</button>
                      </div>
                    </td>
                  </tr>
                )
              )}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={15} style={{ ...tdStyle, textAlign: "center", color: "var(--a-ink-3)" }}>No packs for this service</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add pack form */}
      {showAddForm && (
        <div className="card" style={{ marginTop: 16, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: "var(--a-ink)" }}>Add new pack</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            <label style={labelStyle}>
              Service
              <input value={newPack.service} onChange={(e) => setNewPack({ ...newPack, service: e.target.value })} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Qty
              <input type="number" value={newPack.qty || ""} onChange={(e) => setNewPack({ ...newPack, qty: Number(e.target.value) })} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Price (EUR)
              <input type="number" step="0.01" value={newPack.price || ""} onChange={(e) => setNewPack({ ...newPack, price: Number(e.target.value) })} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              USD
              <input type="number" step="0.01" value={newPack.price_usd || ""} onChange={(e) => setNewPack({ ...newPack, price_usd: Number(e.target.value) })} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              GBP
              <input type="number" step="0.01" value={newPack.price_gbp || ""} onChange={(e) => setNewPack({ ...newPack, price_gbp: Number(e.target.value) })} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              BRL
              <input type="number" step="0.01" value={newPack.price_brl || ""} onChange={(e) => setNewPack({ ...newPack, price_brl: Number(e.target.value) })} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              TRY
              <input type="number" step="0.01" value={newPack.price_try || ""} onChange={(e) => setNewPack({ ...newPack, price_try: Number(e.target.value) })} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              CAD
              <input type="number" step="0.01" value={newPack.price_cad || ""} onChange={(e) => setNewPack({ ...newPack, price_cad: Number(e.target.value) })} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              AUD
              <input type="number" step="0.01" value={newPack.price_aud || ""} onChange={(e) => setNewPack({ ...newPack, price_aud: Number(e.target.value) })} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              CHF
              <input type="number" step="0.01" value={newPack.price_chf || ""} onChange={(e) => setNewPack({ ...newPack, price_chf: Number(e.target.value) })} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              MXN
              <input type="number" step="0.01" value={newPack.price_mxn || ""} onChange={(e) => setNewPack({ ...newPack, price_mxn: Number(e.target.value) })} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              SEK
              <input type="number" step="0.01" value={newPack.price_sek || ""} onChange={(e) => setNewPack({ ...newPack, price_sek: Number(e.target.value) })} style={inputStyle} />
            </label>
            <label style={{ ...labelStyle, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={newPack.popular} onChange={(e) => setNewPack({ ...newPack, popular: e.target.checked })} />
              Plus populaire
            </label>
            <label style={{ ...labelStyle, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={newPack.active} onChange={(e) => setNewPack({ ...newPack, active: e.target.checked })} />
              Active
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn" onClick={() => setNewPack({ ...newPack, ...convertFromEur(newPack.price) })} style={{ color: "var(--a-accent)" }}>€→All (convert)</button>
            <button className="btn primary" onClick={handleAdd}>{Ic.check()} Create</button>
            <button className="btn" onClick={() => setShowAddForm(false)}>{Ic.x()} Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Style helpers ─── */
const thStyle: React.CSSProperties = { textAlign: "left", padding: "10px 12px", fontWeight: 700, fontSize: 11, color: "var(--a-ink-3)", textTransform: "uppercase", letterSpacing: "0.04em" };
const tdStyle: React.CSSProperties = { padding: "10px 12px", verticalAlign: "middle" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid var(--a-line)", background: "var(--a-card)", color: "var(--a-ink)", fontSize: 13 };
const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--a-ink-3)" };
