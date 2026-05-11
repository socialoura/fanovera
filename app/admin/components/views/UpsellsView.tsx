"use client";

import { useState, useEffect, useCallback } from "react";
import { Ic } from "../icons";

interface Upsell {
  id: number;
  service: string;
  qty: number;
  label: string;
  label_en: string;
  active: boolean;
  sort_order: number;
}

const emptyForm = { service: "", qty: 0, label: "", label_en: "", active: true, sort_order: 0 };

export default function UpsellsView() {
  const [upsells, setUpsells] = useState<Upsell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
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

  useEffect(() => {
    fetchUpsells();
  }, [fetchUpsells]);

  // Add upsell
  const handleAdd = async () => {
    if (!addForm.service || !addForm.qty) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/upsells", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setAddForm(emptyForm);
      setShowAdd(false);
      await fetchUpsells();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setAdding(false);
    }
  };

  // Toggle active
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

  // Start edit
  const startEdit = (u: Upsell) => {
    setEditingId(u.id);
    setEditForm({ service: u.service, qty: u.qty, label: u.label, label_en: u.label_en, active: u.active, sort_order: u.sort_order });
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (editingId === null) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/upsells", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setEditingId(null);
      await fetchUpsells();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  // Delete
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

  const inputStyle: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid var(--a-line)",
    background: "var(--a-card)",
    color: "var(--a-ink)",
    fontSize: 12,
    width: "100%",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: "var(--a-ink-3)", fontWeight: 600 }}>
          {upsells.length} upsell{upsells.length !== 1 ? "s" : ""}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={fetchUpsells}>{Ic.refresh()} Rafraichir</button>
          <button className="btn primary" onClick={() => setShowAdd(!showAdd)}>{Ic.plus()} Ajouter upsell</button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "12px 16px", marginBottom: 14, borderRadius: 8, background: "rgba(225,68,68,0.1)", border: "1px solid rgba(225,68,68,0.3)", color: "#E14444", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="card" style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: "var(--a-ink)" }}>Nouvel upsell</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr 1fr 80px 60px", gap: 10, alignItems: "center" }}>
            <input style={inputStyle} placeholder="Service (ex: instagram)" value={addForm.service} onChange={(e) => setAddForm({ ...addForm, service: e.target.value })} />
            <input style={inputStyle} type="number" placeholder="Qty" value={addForm.qty || ""} onChange={(e) => setAddForm({ ...addForm, qty: Number(e.target.value) })} />
            <input style={inputStyle} placeholder="Label (FR)" value={addForm.label} onChange={(e) => setAddForm({ ...addForm, label: e.target.value })} />
            <input style={inputStyle} placeholder="Label EN" value={addForm.label_en} onChange={(e) => setAddForm({ ...addForm, label_en: e.target.value })} />
            <input style={inputStyle} type="number" placeholder="Sort" value={addForm.sort_order || ""} onChange={(e) => setAddForm({ ...addForm, sort_order: Number(e.target.value) })} />
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--a-ink-3)" }}>
              <input type="checkbox" checked={addForm.active} onChange={(e) => setAddForm({ ...addForm, active: e.target.checked })} />
              Actif
            </label>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button className="btn primary" onClick={handleAdd} disabled={adding} style={{ padding: "6px 16px", fontSize: 12 }}>
              {adding ? "..." : "Creer"}
            </button>
            <button className="btn" onClick={() => { setShowAdd(false); setAddForm(emptyForm); }} style={{ padding: "6px 16px", fontSize: 12 }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>Chargement...</div>
        ) : upsells.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>Aucun upsell.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th className="num">Qty</th>
                <th>Label (FR)</th>
                <th>Label EN</th>
                <th>Active</th>
                <th className="num">Sort Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {upsells.map((u) => (
                editingId === u.id ? (
                  <tr key={u.id}>
                    <td><input style={inputStyle} value={editForm.service} onChange={(e) => setEditForm({ ...editForm, service: e.target.value })} /></td>
                    <td><input style={{ ...inputStyle, width: 60 }} type="number" value={editForm.qty || ""} onChange={(e) => setEditForm({ ...editForm, qty: Number(e.target.value) })} /></td>
                    <td><input style={inputStyle} value={editForm.label} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} /></td>
                    <td><input style={inputStyle} value={editForm.label_en} onChange={(e) => setEditForm({ ...editForm, label_en: e.target.value })} /></td>
                    <td>
                      <input type="checkbox" checked={editForm.active} onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} />
                    </td>
                    <td><input style={{ ...inputStyle, width: 60 }} type="number" value={editForm.sort_order || ""} onChange={(e) => setEditForm({ ...editForm, sort_order: Number(e.target.value) })} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn primary" onClick={handleSaveEdit} disabled={saving} style={{ padding: "4px 10px", fontSize: 11 }}>
                          {saving ? "..." : "Save"}
                        </button>
                        <button className="btn" onClick={() => setEditingId(null)} style={{ padding: "4px 10px", fontSize: 11 }}>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.service}</td>
                    <td className="num">{u.qty}</td>
                    <td>{u.label}</td>
                    <td style={{ color: "var(--a-ink-3)" }}>{u.label_en}</td>
                    <td>
                      <div
                        className={"toggle " + (u.active ? "on" : "")}
                        onClick={() => handleToggleActive(u)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td className="num">{u.sort_order}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="icon-btn" style={{ width: 28, height: 28, borderRadius: 7 }} onClick={() => startEdit(u)}>{Ic.edit()}</button>
                        <button className="icon-btn" style={{ width: 28, height: 28, borderRadius: 7, color: "var(--a-accent)" }} onClick={() => handleDelete(u.id)}>{Ic.trash()}</button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
