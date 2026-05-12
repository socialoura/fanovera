"use client";

import { useState, useEffect, useCallback } from "react";
import { Ic } from "../icons";

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
  return data.packs;
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
  return data.pack;
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
  return data.pack;
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
  const filtered = packs.filter((p) => p.service === activeService);

  /* Handlers */
  const handleAdd = async () => {
    try {
      setError(null);
      const created = await createPack(newPack);
      setPacks((prev) => [...prev, created]);
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
      setPacks((prev) => prev.map((p) => (p.id === pack.id ? updated : p)));
      setSuccess("Pack mis à jour.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update pack");
    }
  };

  const handleToggleActive = async (pack: Pack) => {
    try {
      setError(null);
      const updated = await updatePack(pack.id, { active: !pack.active });
      setPacks((prev) => prev.map((p) => (p.id === pack.id ? updated : p)));
      setSuccess("Pack mis à jour.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update pack");
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
    });
  };

  const saveEdit = async () => {
    if (editingId === null) return;
    try {
      setError(null);
      const updated = await updatePack(editingId, editFields);
      setPacks((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
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

  /* Count packs per service for tab badges */
  const countByService = (svc: string) => packs.filter((p) => p.service === svc).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 16 }}>
        <div style={{ fontSize: 13, color: "var(--a-ink-3)", fontWeight: 600 }}>
          {SERVICES.length} services &middot; {packs.length} packs
        </div>
        <div style={{ display: "flex", gap: 8 }}>
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
                <th style={thStyle}>Popular</th>
                <th style={thStyle}>Active</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pack) =>
                editingId === pack.id ? (
                  <tr key={pack.id} style={{ borderBottom: "1px solid var(--a-line)", background: "var(--a-card)" }}>
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
                      <input type="checkbox" checked={editFields.popular ?? false} onChange={(e) => setEditFields({ ...editFields, popular: e.target.checked })} />
                    </td>
                    <td style={tdStyle}>
                      <input type="checkbox" checked={editFields.active ?? false} onChange={(e) => setEditFields({ ...editFields, active: e.target.checked })} />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn primary" onClick={saveEdit} style={{ padding: "4px 8px", fontSize: 11 }}>{Ic.check()} Save</button>
                        <button className="btn" onClick={cancelEdit} style={{ padding: "4px 8px", fontSize: 11 }}>{Ic.x()} Cancel</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={pack.id} style={{ borderBottom: "1px solid var(--a-line)" }}>
                    <td style={tdStyle}><strong>{pack.qty.toLocaleString()}</strong></td>
                    <td style={tdStyle}>{pack.price.toFixed(2)}</td>
                    <td style={tdStyle}>{pack.price_usd.toFixed(2)}</td>
                    <td style={tdStyle}>{pack.price_gbp.toFixed(2)}</td>
                    <td style={tdStyle}>{pack.price_brl.toFixed(2)}</td>
                    <td style={tdStyle}>{pack.price_try.toFixed(2)}</td>
                    <td style={tdStyle}>{pack.price_cad.toFixed(2)}</td>
                    <td style={tdStyle}>{pack.price_aud.toFixed(2)}</td>
                    <td style={tdStyle}>{pack.price_chf.toFixed(2)}</td>
                    <td style={tdStyle}>{pack.price_mxn.toFixed(2)}</td>
                    <td style={tdStyle}>{pack.price_sek.toFixed(2)}</td>
                    <td style={tdStyle}>
                      {pack.popular ? (
                        <span className="pill" style={{ background: "var(--a-accent)", color: "#fff", border: "none", cursor: "pointer" }} onClick={() => handleTogglePopular(pack)}>{Ic.star()} Popular</span>
                      ) : (
                        <span style={{ cursor: "pointer", color: "var(--a-ink-3)" }} onClick={() => handleTogglePopular(pack)}>-</span>
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
                  <td colSpan={14} style={{ ...tdStyle, textAlign: "center", color: "var(--a-ink-3)" }}>No packs for this service</td>
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
              Popular
            </label>
            <label style={{ ...labelStyle, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={newPack.active} onChange={(e) => setNewPack({ ...newPack, active: e.target.checked })} />
              Active
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
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
