"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ic } from "../icons";

type Confidence = "high" | "medium" | "low";
type Intended = "likes" | "views" | "unknown";

type MismatchOrder = {
  id: number;
  created_at: string;
  email: string;
  username: string;
  platform: string;
  status: string;
  total_cents: number;
  currency: string;
  qty: number;
  bonus: number;
  post_url: string;
  source_page: string;
  saved_service: string;
  bf_service_id_sent: number;
  bf_order_id_sent: number | null;
  smm_status: string;
  intended_product: Intended;
  confidence: Confidence;
  correct_service: string | null;
  correct_bf_service_id: number | null;
};

type ApiResponse = {
  summary: {
    total: number;
    high_confidence: number;
    medium_confidence: number;
    low_confidence: number;
    likes: number;
    views: number;
    unknown: number;
    total_revenue_cents: number;
  };
  orders: MismatchOrder[];
};

const CONFIDENCE_COLOR: Record<Confidence, string> = {
  high: "#16a34a",
  medium: "#c68a19",
  low: "#E14444",
};

const INTENDED_LABEL: Record<Intended, string> = {
  likes: "Likes",
  views: "Vues",
  unknown: "?",
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: (currency || "EUR").toUpperCase(),
  }).format((cents || 0) / 100);
}

function formatQty(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n || 0);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type PaymentRecoveryResult = {
  paymentIntentId: string;
  ok?: boolean;
  orderId?: number;
  duplicate?: boolean;
  smmPlaced?: boolean;
  reason?: string;
  status?: string;
  error?: string;
};

export default function RecoveryView() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ kind: "info" | "error"; text: string } | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState<"all" | Confidence>("all");
  const [intendedFilter, setIntendedFilter] = useState<"all" | Intended>("all");
  const [overrides, setOverrides] = useState<Record<number, string>>({});

  // Emergency PI recovery (orphan Stripe payments)
  const [piInput, setPiInput] = useState("");
  const [piBusy, setPiBusy] = useState(false);
  const [piResults, setPiResults] = useState<PaymentRecoveryResult[] | null>(null);
  const [piError, setPiError] = useState<string | null>(null);

  const handlePiRecover = async () => {
    const ids = Array.from(
      new Set(
        piInput
          .split(/[\s,;]+/)
          .map((s) => s.trim())
          .filter((s) => s.startsWith("pi_")),
      ),
    );
    if (ids.length === 0) {
      setPiError("Aucun PI valide (doit commencer par pi_)");
      return;
    }
    if (
      !confirm(
        `Recover ${ids.length} PaymentIntent${ids.length > 1 ? "s" : ""} ?\n\nLes commandes déjà en DB seront skip (duplicate). Les manquantes seront créées avec email + Discord + SMM (si auto_order_enabled).`,
      )
    ) {
      return;
    }
    setPiBusy(true);
    setPiError(null);
    setPiResults(null);
    const token = localStorage.getItem("admin_pw") || "";
    try {
      const res = await fetch("/api/admin/orders/recover-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentIntentIds: ids }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setPiResults(body.results as PaymentRecoveryResult[]);
    } catch (err) {
      setPiError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setPiBusy(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("admin_pw") || "";
    try {
      const res = await fetch("/api/admin/orders/service-mismatches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRecover = async (order: MismatchOrder) => {
    const override = overrides[order.id];
    const correctService = override || order.correct_service;
    if (!correctService) {
      setMessage({
        kind: "error",
        text: `Pas de service cible défini pour la commande #${order.id} — choisis Likes ou Vues dans la dernière colonne.`,
      });
      return;
    }
    const totalQty = order.qty + order.bonus;
    if (
      !confirm(
        `Re-livrer la commande #${order.id} (${order.email}) sur ${correctService} pour ${formatQty(totalQty)} unités via BulkFollows ?\n\nCeci va débiter ton solde BF.`,
      )
    ) {
      return;
    }
    setBusyOrderId(order.id);
    setMessage(null);
    const token = localStorage.getItem("admin_pw") || "";
    try {
      const res = await fetch("/api/admin/orders/recover-service", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: order.id, correctService }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setMessage({
        kind: "info",
        text: `Commande #${order.id} re-livrée sur ${correctService} — BF #${body.placedBfOrderId} (service ${body.bfServiceId}).`,
      });
      await fetchData();
    } catch (err) {
      setMessage({
        kind: "error",
        text: `#${order.id} : ${err instanceof Error ? err.message : "erreur"}`,
      });
    } finally {
      setBusyOrderId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    return data.orders.filter((o) => {
      if (confidenceFilter !== "all" && o.confidence !== confidenceFilter) return false;
      if (intendedFilter !== "all" && o.intended_product !== intendedFilter) return false;
      return true;
    });
  }, [data, confidenceFilter, intendedFilter]);

  return (
    <div>
      <div
        style={{
          padding: "14px 18px",
          marginBottom: 14,
          background: "rgba(82, 96, 230, 0.06)",
          border: "1px solid rgba(82, 96, 230, 0.30)",
          borderRadius: 12,
          color: "var(--a-ink)",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
          Recovery paiements Stripe orphelins
        </div>
        <div style={{ fontSize: 12, color: "var(--a-ink-3)", marginBottom: 10 }}>
          Colle des PaymentIntent IDs (un par ligne, ou séparés par espaces/virgules). L&apos;endpoint
          appelle <code>ensureOrderForPaymentIntent</code> en mode cron pour chacun. Idempotent :
          les commandes déjà en DB sont skip avec <code>duplicate: true</code>, les manquantes
          déclenchent email + Discord + SMM auto (si activé).
        </div>
        <textarea
          value={piInput}
          onChange={(e) => setPiInput(e.target.value)}
          placeholder="pi_xxx&#10;pi_yyy&#10;pi_zzz"
          rows={4}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid var(--a-line)",
            fontFamily: "ui-monospace, monospace",
            fontSize: 12,
            resize: "vertical",
            background: "var(--a-bg)",
            color: "var(--a-ink)",
            boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <button
            onClick={handlePiRecover}
            disabled={piBusy || !piInput.trim()}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "var(--a-accent)",
              color: "white",
              fontWeight: 700,
              fontSize: 12,
              border: "none",
              cursor: piBusy ? "not-allowed" : "pointer",
              opacity: piBusy ? 0.7 : 1,
            }}
          >
            {piBusy ? "Recovery en cours…" : "Recover"}
          </button>
          {piResults && (
            <div style={{ fontSize: 11, color: "var(--a-ink-3)" }}>
              {piResults.filter((r) => r.ok && !r.duplicate).length} créées ·{" "}
              {piResults.filter((r) => r.ok && r.duplicate).length} déjà en DB ·{" "}
              {piResults.filter((r) => !r.ok).length} échec
            </div>
          )}
        </div>
        {piError && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#dc2626" }}>{piError}</div>
        )}
        {piResults && (
          <div style={{ marginTop: 10, maxHeight: 240, overflow: "auto", border: "1px solid var(--a-line)", borderRadius: 8, padding: 8, background: "var(--a-bg)" }}>
            <table style={{ width: "100%", fontSize: 11, fontFamily: "ui-monospace, monospace" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--a-ink-3)" }}>
                  <th style={{ padding: "4px 6px" }}>PI</th>
                  <th style={{ padding: "4px 6px" }}>Status</th>
                  <th style={{ padding: "4px 6px" }}>Order</th>
                  <th style={{ padding: "4px 6px" }}>SMM</th>
                  <th style={{ padding: "4px 6px" }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {piResults.map((r) => {
                  const ok = r.ok;
                  const dup = r.duplicate;
                  const label = !ok ? "❌ failed" : dup ? "🟰 duplicate" : "✅ created";
                  const color = !ok ? "#dc2626" : dup ? "var(--a-ink-3)" : "#16a34a";
                  return (
                    <tr key={r.paymentIntentId}>
                      <td style={{ padding: "3px 6px", whiteSpace: "nowrap" }}>{r.paymentIntentId}</td>
                      <td style={{ padding: "3px 6px", color, fontWeight: 700 }}>{label}</td>
                      <td style={{ padding: "3px 6px" }}>{r.orderId ?? "—"}</td>
                      <td style={{ padding: "3px 6px" }}>{r.smmPlaced ? "yes" : "no"}</td>
                      <td style={{ padding: "3px 6px", color: "var(--a-ink-3)" }}>
                        {r.reason || r.status || r.error || ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        style={{
          padding: "14px 18px",
          marginBottom: 14,
          background: "linear-gradient(90deg, rgba(225,68,68,0.06), rgba(198,138,25,0.06))",
          border: "1px solid rgba(225,68,68,0.30)",
          borderRadius: 12,
          color: "var(--a-ink)",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
          Commandes mal routées (followers livrés au lieu de likes/vues)
        </div>
        <div style={{ fontSize: 12, color: "var(--a-ink-3)" }}>
          Bug historique : le frontend TikTok/Instagram n&apos;envoyait pas le type de produit
          dans le cart, donc les achats likes &amp; vues partaient sur le service Followers
          BulkFollows. Liste détectée via <code>postUrl</code> présent + service sauvegardé en
          followers. Clique &quot;Re-livrer&quot; pour placer le bon service BF — le followers
          déjà livré reste comme audit trail (bonus pour le client).
        </div>
      </div>

      {data && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <SummaryCard label="Commandes impactées" value={data.summary.total} />
          <SummaryCard
            label="Revenu impacté"
            value={formatMoney(data.summary.total_revenue_cents, "EUR")}
          />
          <SummaryCard
            label="High confidence"
            value={data.summary.high_confidence}
            color={CONFIDENCE_COLOR.high}
          />
          <SummaryCard
            label="Medium confidence"
            value={data.summary.medium_confidence}
            color={CONFIDENCE_COLOR.medium}
          />
          <SummaryCard
            label="Low (triage manuel)"
            value={data.summary.low_confidence}
            color={CONFIDENCE_COLOR.low}
          />
          <SummaryCard label="→ Likes" value={data.summary.likes} />
          <SummaryCard label="→ Vues" value={data.summary.views} />
          <SummaryCard label="→ Inconnu" value={data.summary.unknown} />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div className="tabs" style={{ padding: 3 }}>
          {(
            [
              ["all", "Toutes"],
              ["high", "High"],
              ["medium", "Medium"],
              ["low", "Low"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              className={"tab " + (confidenceFilter === k ? "active" : "")}
              onClick={() => setConfidenceFilter(k)}
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="tabs" style={{ padding: 3 }}>
          {(
            [
              ["all", "Tous types"],
              ["likes", "Likes"],
              ["views", "Vues"],
              ["unknown", "Inconnu"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              className={"tab " + (intendedFilter === k ? "active" : "")}
              onClick={() => setIntendedFilter(k)}
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              {l}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button className="btn" onClick={fetchData}>
            {Ic.refresh()} Rafraîchir
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: "10px 14px",
            marginBottom: 12,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: message.kind === "error" ? "rgba(225,68,68,0.12)" : "rgba(34,197,94,0.12)",
            color: message.kind === "error" ? "#E14444" : "#16a34a",
            border:
              "1px solid " +
              (message.kind === "error" ? "rgba(225,68,68,0.30)" : "rgba(34,197,94,0.30)"),
          }}
        >
          {message.text}
        </div>
      )}

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

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>
            Chargement...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>
            {data?.orders.length === 0
              ? "Aucune commande mal routée trouvée."
              : "Aucune commande ne correspond aux filtres."}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Email</th>
                <th>Plateforme</th>
                <th className="num">Qty (+bonus)</th>
                <th>Post</th>
                <th>BF envoyé</th>
                <th>Statut</th>
                <th>Intention</th>
                <th>Confiance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const override = overrides[o.id];
                const effectiveService = override || o.correct_service || "";
                const isUnknown = !o.correct_service;
                const totalQty = o.qty + o.bonus;
                return (
                  <tr key={o.id}>
                    <td>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>
                        #{o.id}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: "var(--a-ink-3)" }}>
                        {formatDate(o.created_at)}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: 12 }}>
                        {o.email}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, textTransform: "capitalize", fontWeight: 600 }}>
                        {o.platform}
                      </span>
                    </td>
                    <td className="num">
                      <span style={{ fontSize: 12 }}>
                        {formatQty(o.qty)}
                        {o.bonus ? (
                          <span style={{ color: "#16a34a" }}> +{formatQty(o.bonus)}</span>
                        ) : null}
                      </span>
                    </td>
                    <td>
                      <a
                        href={o.post_url}
                        target="_blank"
                        rel="noreferrer"
                        title={o.post_url}
                        style={{
                          fontSize: 12,
                          color: "#5260e6",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        Voir {Ic.external(12)}
                      </a>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: 11, color: "var(--a-ink-3)" }}>
                        {o.bf_service_id_sent ? `#${o.bf_service_id_sent}` : "—"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12 }}>{o.smm_status || o.status}</span>
                    </td>
                    <td>
                      <span
                        className="pill"
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          background: "rgba(82,96,230,0.10)",
                          color: "#5260e6",
                          border: "1px solid rgba(82,96,230,0.25)",
                        }}
                      >
                        {INTENDED_LABEL[o.intended_product]}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: CONFIDENCE_COLOR[o.confidence],
                          textTransform: "uppercase",
                        }}
                      >
                        {o.confidence}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {isUnknown && (
                          <select
                            className="input"
                            value={override || ""}
                            onChange={(e) =>
                              setOverrides((prev) => ({ ...prev, [o.id]: e.target.value }))
                            }
                            style={{ padding: "4px 8px", fontSize: 11, width: 110 }}
                          >
                            <option value="">— choisir —</option>
                            <option value={o.platform === "tiktok" ? "tt_likes" : "ig_likes"}>
                              Likes
                            </option>
                            <option value={o.platform === "tiktok" ? "tt_views" : "ig_views"}>
                              Vues
                            </option>
                          </select>
                        )}
                        <button
                          type="button"
                          className="btn primary"
                          onClick={() => handleRecover(o)}
                          disabled={busyOrderId === o.id || !effectiveService}
                          style={{ padding: "4px 10px", fontSize: 11 }}
                          title={
                            effectiveService
                              ? `Place une commande BulkFollows sur ${effectiveService} pour ${formatQty(totalQty)} unités`
                              : "Choisis un service cible d'abord"
                          }
                        >
                          {busyOrderId === o.id ? "..." : `Re-livrer${effectiveService ? ` (${effectiveService})` : ""}`}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div
      className="card"
      style={{
        padding: "12px 16px",
        minWidth: 140,
        background: "var(--a-card)",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--a-ink-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.04 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          marginTop: 4,
          color: color || "var(--a-ink)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
