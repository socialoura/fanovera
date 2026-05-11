"use client";

import { useCallback, useEffect, useState } from "react";
import { Ic } from "../icons";

interface SmmMapping {
  id: number;
  platform: string;
  service: string;
  bulkfollows_service_id: string;
  enabled: boolean;
}

interface SmmSetting {
  key: string;
  value: string;
}

interface SmmData {
  mappings: SmmMapping[];
  settings: SmmSetting[];
  balance: string | number | null;
}

function getToken() {
  return localStorage.getItem("admin_pw") ?? "";
}

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export default function SmmView() {
  const [data, setData] = useState<SmmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/smm", { headers: authHeaders() });
      if (!res.ok) throw new Error("Erreur " + res.status);
      const json: SmmData = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const autoOrderEnabled =
    data?.settings?.find((s) => s.key === "auto_order_enabled")?.value === "true";

  const handleToggleAuto = async () => {
    setToggling(true);
    try {
      const res = await fetch("/api/admin/smm", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "toggle_auto" }),
      });
      if (!res.ok) throw new Error("Erreur " + res.status);
      await fetchData();
    } catch {
      // silent
    } finally {
      setToggling(false);
    }
  };

  const handleToggleEnabled = async (mapping: SmmMapping) => {
    try {
      const res = await fetch("/api/admin/smm", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ id: mapping.id, enabled: !mapping.enabled }),
      });
      if (!res.ok) throw new Error("Erreur " + res.status);
      await fetchData();
    } catch {
      // silent
    }
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const res = await fetch("/api/admin/smm", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ id, bulkfollows_service_id: editValue }),
      });
      if (!res.ok) throw new Error("Erreur " + res.status);
      setEditingId(null);
      setEditValue("");
      await fetchData();
    } catch {
      // silent
    }
  };

  const formatBalance = (bal: string | number | null | undefined) => {
    if (bal == null) return "—";
    const n = typeof bal === "string" ? parseFloat(bal) : bal;
    if (isNaN(n)) return "—";
    return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading && !data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>
        Chargement...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--a-accent)" }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Top: balance + auto-ordering */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
        {/* Balance card */}
        <div
          style={{
            background: "var(--a-card)",
            border: "1px solid var(--a-line)",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(224,74,140,0.15)",
                color: "var(--a-accent)",
                display: "grid",
                placeItems: "center",
              }}
            >
              {Ic.wallet()}
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "var(--a-ink-3)",
                }}
              >
                SOLDE BULKFOLLOWS
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "var(--a-ink)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatBalance(data?.balance)}{" "}
            <span style={{ fontSize: 18, color: "var(--a-ink-3)" }}>$</span>
          </div>
          <button
            className="btn"
            onClick={fetchData}
            style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {Ic.refresh()} Refresh balance
          </button>
        </div>

        {/* Auto-ordering card */}
        <div
          style={{
            background: "var(--a-card)",
            border: "1px solid var(--a-line)",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--a-ink)" }}>
                Auto-ordering
              </div>
              <div style={{ fontSize: 12, color: "var(--a-ink-3)", marginTop: 2 }}>
                Lancement automatique des commandes SMM
              </div>
            </div>
            <div
              className={"toggle " + (autoOrderEnabled ? "on" : "")}
              onClick={toggling ? undefined : handleToggleAuto}
              style={{ opacity: toggling ? 0.5 : 1, cursor: toggling ? "wait" : "pointer" }}
            />
          </div>
          <div
            style={{
              padding: 12,
              background: autoOrderEnabled ? "rgba(34,197,94,0.08)" : "rgba(234,179,8,0.08)",
              borderRadius: 10,
              fontSize: 12,
              color: autoOrderEnabled ? "#22c55e" : "#eab308",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: 50, background: "currentColor" }} />
            {autoOrderEnabled
              ? "Actif — les commandes payees sont envoyees automatiquement"
              : "Inactif — lancement manuel requis"}
          </div>
        </div>
      </div>

      {/* Mappings table */}
      <div
        style={{
          background: "var(--a-card)",
          border: "1px solid var(--a-line)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--a-line)",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--a-ink)" }}>
              Mapping des services
            </div>
            <div style={{ fontSize: 12, color: "var(--a-ink-3)", marginTop: 2 }}>
              Service interne → BulkFollows service ID
            </div>
          </div>
        </div>
        <table className="table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={{ color: "var(--a-ink-3)" }}>Platform</th>
              <th style={{ color: "var(--a-ink-3)" }}>Service</th>
              <th style={{ color: "var(--a-ink-3)" }}>BulkFollows Service ID</th>
              <th style={{ color: "var(--a-ink-3)" }}>Enabled</th>
              <th style={{ color: "var(--a-ink-3)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.mappings?.map((m) => (
              <tr key={m.id}>
                <td style={{ fontWeight: 700, color: "var(--a-ink)" }}>{m.platform}</td>
                <td style={{ color: "var(--a-ink)" }}>{m.service}</td>
                <td>
                  {editingId === m.id ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        style={{
                          width: 100,
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid var(--a-line)",
                          background: "var(--a-card)",
                          color: "var(--a-ink)",
                          fontSize: 13,
                        }}
                      />
                      <button
                        className="btn"
                        onClick={() => handleSaveEdit(m.id)}
                        style={{ padding: "4px 8px", fontSize: 11 }}
                      >
                        {Ic.check()} Save
                      </button>
                      <button
                        className="btn"
                        onClick={() => { setEditingId(null); setEditValue(""); }}
                        style={{ padding: "4px 8px", fontSize: 11 }}
                      >
                        {Ic.x()}
                      </button>
                    </div>
                  ) : (
                    <span className="mono" style={{ fontSize: 12, color: "var(--a-ink)" }}>
                      {m.bulkfollows_service_id || "—"}
                    </span>
                  )}
                </td>
                <td>
                  <div
                    className={"toggle " + (m.enabled ? "on" : "")}
                    onClick={() => handleToggleEnabled(m)}
                    style={{ cursor: "pointer" }}
                  />
                </td>
                <td>
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setEditingId(m.id);
                      setEditValue(m.bulkfollows_service_id || "");
                    }}
                    style={{ width: 28, height: 28, borderRadius: 7 }}
                  >
                    {Ic.edit()}
                  </button>
                </td>
              </tr>
            ))}
            {(!data?.mappings || data.mappings.length === 0) && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--a-ink-3)", padding: 30 }}>
                  Aucun mapping configuré
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
