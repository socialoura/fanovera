"use client";

import { useState, useEffect, useCallback } from "react";
import { Ic } from "../icons";

interface Order {
  id: number;
  stripe_payment_intent_id: string | null;
  email: string;
  username: string;
  platform: string;
  cart: unknown;
  post_assignments: unknown;
  total_cents: number;
  cost_cents: number;
  currency: string;
  status: string;
  followers_before: number;
  country: string | null;
  lang: string;
  smm_orders: unknown[];
  delivered_at: string | null;
  created_at: string;
}

interface ApiResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_MAP: Record<string, { label: string; pill: string }> = {
  delivered: { label: "Livree", pill: "green" },
  processing: { label: "En cours", pill: "blue" },
  paid: { label: "Payee", pill: "violet" },
  pending: { label: "En attente", pill: "amber" },
  failed: { label: "Echouee", pill: "red" },
};

const STATUSES = ["pending", "paid", "processing", "delivered", "failed"] as const;

export default function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const limit = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("admin_pw") || "";
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      status: statusFilter,
      search,
    });
    try {
      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data: ApiResponse = await res.json();
      setOrders(data.orders);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const handleSearch = () => {
    setSearch(searchInput.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleRowClick = (order: Order) => {
    if (expandedId === order.id) {
      setExpandedId(null);
    } else {
      setExpandedId(order.id);
      setEditingStatus(order.status);
    }
  };

  const handleSaveStatus = async (orderId: number) => {
    setSaving(true);
    const token = localStorage.getItem("admin_pw") || "";
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: orderId, status: editingStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      // Refresh list
      await fetchOrders();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div className="search-box" style={{ width: 320 }}>
          {Ic.search()}
          <input
            placeholder="Rechercher par email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSearch}
          />
        </div>
        <div className="tabs" style={{ padding: 3 }}>
          {(
            [
              ["all", "Tous"],
              ["pending", "Pending"],
              ["paid", "Paid"],
              ["processing", "En cours"],
              ["delivered", "Livrees"],
              ["failed", "Echouees"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              className={"tab " + (statusFilter === k ? "active" : "")}
              onClick={() => setStatusFilter(k)}
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              {l}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button className="btn" onClick={fetchOrders}>
            {Ic.refresh()} Rafraichir
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: 14,
            borderRadius: 8,
            background: "rgba(225,68,68,0.1)",
            border: "1px solid rgba(225,68,68,0.3)",
            color: "#E14444",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Orders table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>Chargement...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>Aucune commande trouvee.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Platform</th>
                <th className="num">Montant</th>
                <th className="num">Cout</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const st = STATUS_MAP[o.status] || { label: o.status, pill: "" };
                const isExpanded = expandedId === o.id;
                return (
                  <>
                    <tr
                      key={o.id}
                      onClick={() => handleRowClick(o)}
                      style={{ cursor: "pointer", background: isExpanded ? "var(--a-card)" : undefined }}
                    >
                      <td>
                        <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>
                          #{o.id}
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: 12 }}>
                          {o.email}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: 12, textTransform: "capitalize" }}>
                          {o.platform}
                        </span>
                      </td>
                      <td className="num" style={{ fontWeight: 700, color: "var(--a-ink)" }}>
                        {(o.total_cents / 100).toFixed(2)} &euro;
                      </td>
                      <td className="num" style={{ color: "var(--a-ink-3)" }}>
                        {(o.cost_cents / 100).toFixed(2)} &euro;
                      </td>
                      <td>
                        <span className={"pill " + st.pill}>
                          <span className="dot" />
                          {st.label}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: "var(--a-ink-3)" }}>{formatDate(o.created_at)}</span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${o.id}-detail`}>
                        <td colSpan={7} style={{ padding: "16px 20px", background: "var(--a-card)", borderTop: "1px solid var(--a-line)" }}>
                          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                            {/* Cart details */}
                            <div style={{ flex: 1, minWidth: 250 }}>
                              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: "var(--a-ink)" }}>
                                Cart
                              </div>
                              <pre
                                style={{
                                  fontSize: 11,
                                  background: "rgba(0,0,0,0.2)",
                                  padding: 12,
                                  borderRadius: 8,
                                  overflow: "auto",
                                  maxHeight: 200,
                                  color: "var(--a-ink-3)",
                                  border: "1px solid var(--a-line)",
                                }}
                              >
                                {JSON.stringify(o.cart, null, 2)}
                              </pre>
                            </div>
                            {/* SMM Orders */}
                            <div style={{ flex: 1, minWidth: 250 }}>
                              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: "var(--a-ink)" }}>
                                SMM Orders
                              </div>
                              <pre
                                style={{
                                  fontSize: 11,
                                  background: "rgba(0,0,0,0.2)",
                                  padding: 12,
                                  borderRadius: 8,
                                  overflow: "auto",
                                  maxHeight: 200,
                                  color: "var(--a-ink-3)",
                                  border: "1px solid var(--a-line)",
                                }}
                              >
                                {JSON.stringify(o.smm_orders, null, 2)}
                              </pre>
                            </div>
                            {/* Status change */}
                            <div style={{ minWidth: 200 }}>
                              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: "var(--a-ink)" }}>
                                Changer le statut
                              </div>
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <select
                                  value={editingStatus}
                                  onChange={(e) => setEditingStatus(e.target.value)}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                    border: "1px solid var(--a-line)",
                                    background: "var(--a-card)",
                                    color: "var(--a-ink)",
                                    fontSize: 12,
                                  }}
                                >
                                  {STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {STATUS_MAP[s]?.label || s}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  className="btn primary"
                                  disabled={saving || editingStatus === o.status}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveStatus(o.id);
                                  }}
                                  style={{ padding: "6px 14px", fontSize: 12 }}
                                >
                                  {saving ? "..." : "Sauvegarder"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderTop: "1px solid var(--a-line)",
              background: "var(--a-card)",
            }}
          >
            <div style={{ fontSize: 12, color: "var(--a-ink-3)", fontWeight: 600 }}>
              {startItem}–{endItem} sur {total} commandes
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                className="btn ghost"
                style={{ padding: "6px 12px" }}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={{ fontSize: 12, color: "var(--a-ink-3)", fontWeight: 600 }}>
                Page {page} / {totalPages}
              </span>
              <button
                className="btn ghost"
                style={{ padding: "6px 12px" }}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
