"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { Ic } from "../icons";
import type { PricingExperiment } from "@/app/lib/pricingExperiments";

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
  // EUR equivalents computed server-side from order.currency. Admin displays
  // these to keep a unified view across customer currencies.
  total_cents_eur: number;
  cost_cents_eur: number;
  margin_cents_eur: number;
  currency: string;
  status: string;
  followers_before: number;
  country: string | null;
  lang: string;
  smm_orders: unknown[];
  delivered_at: string | null;
  created_at: string;
  experiment_id?: string | null;
  variant_id?: string | null;
  pricing_strategy?: string | null;
  customer_order_number?: number;
  customer_total_orders?: number;
}

type AbInfo = { experimentLabel: string; variantLabel: string; pricingStrategy: string } | null;

function resolveAbInfo(order: Order, experiments: PricingExperiment[]): AbInfo {
  if (!order.variant_id || !order.experiment_id) return null;
  const experiment = experiments.find((e) => e.id === order.experiment_id);
  const variant = experiment?.variants.find((v) => v.id === order.variant_id);
  return {
    experimentLabel: experiment?.id || order.experiment_id,
    variantLabel: variant?.label || order.variant_id,
    pricingStrategy: order.pricing_strategy || variant?.pricingStrategy || "",
  };
}

interface ApiResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
  actionRequired?: number;
}

const STATUS_MAP: Record<string, { label: string; pill: string }> = {
  delivered: { label: "Livrée", pill: "green" },
  processing: { label: "En cours", pill: "blue" },
  paid: { label: "Payée", pill: "violet" },
  pending: { label: "En attente", pill: "amber" },
  partial: { label: "Partielle", pill: "amber" },
  canceled: { label: "Annulée", pill: "red" },
  failed: { label: "Échouée", pill: "red" },
};

const STATUSES = ["pending", "paid", "processing", "delivered", "partial", "canceled", "failed"] as const;

const SERVICE_LABELS: Record<string, string> = {
  followers: "Followers",
  ig_followers: "Followers Instagram",
  tw_followers: "Followers Twitch",
  tw_live_viewers: "AI Viewers Twitch (live)",
  likes: "Likes",
  views: "Vues",
  subscribers: "Abonnés",
  comments: "Commentaires",
};

const SMM_STATUS_MAP: Record<string, { label: string; pill: string }> = {
  pending: { label: "À lancer", pill: "amber" },
  placed: { label: "Envoyée", pill: "blue" },
  completed: { label: "Terminée", pill: "green" },
  partial: { label: "Partielle", pill: "amber" },
  failed: { label: "Erreur", pill: "red" },
  canceled: { label: "Annulée", pill: "red" },
};

type CartItem = {
  qty?: number;
  quantity?: number;
  bonus?: number;
  country?: string;
  service?: string;
  platform?: string;
  postUrl?: string;
  link?: string;
  scheduledStartAt?: string;
};

type SmmOrderItem = {
  cartIndex?: number;
  service?: string;
  platform?: string;
  qty?: number;
  bfServiceId?: number;
  bfOrderId?: number | null;
  status?: string;
  charge?: number | null;
  error?: string | null;
  placedAt?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function formatMoney(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
  }).format((cents || 0) / 100);
}

// Show the actual paid amount in the customer's currency, with EUR conversion
// in parentheses. Hides the parenthesis when the currency is already EUR.
function formatMoneyDual(cents: number, currency: string, eurCents: number) {
  const cur = (currency || "EUR").toUpperCase();
  const primary = formatMoney(cents, cur);
  if (cur === "EUR") return primary;
  return `${primary} (${formatMoney(eurCents, "EUR")})`;
}

function formatQty(value: number | undefined) {
  return new Intl.NumberFormat("fr-FR").format(value || 0);
}

function getServiceLabel(service?: string) {
  if (!service) return "Service";
  return SERVICE_LABELS[service] || service.replace(/_/g, " ");
}

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "?";
}

function countryFlag(code: string | null | undefined): string {
  const cc = (code || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="order-field">
      <span>{label}</span>
      <strong>{value || "Non renseigné"}</strong>
    </div>
  );
}

function JsonDetails({ cart, smmOrders }: { cart: unknown; smmOrders: unknown }) {
  return (
    <details className="order-json-details">
      <summary>Données techniques</summary>
      <div className="order-json-grid">
        <div>
          <div className="order-json-title">Cart brut</div>
          <pre>{JSON.stringify(cart, null, 2)}</pre>
        </div>
        <div>
          <div className="order-json-title">SMM brut</div>
          <pre>{JSON.stringify(smmOrders, null, 2)}</pre>
        </div>
      </div>
    </details>
  );
}

type BfEditState = { cartIndex: number; value: string; serviceValue: string } | null;

function OrderDetail({
  order,
  ab,
  editingStatus,
  editingCost,
  saving,
  formatDate,
  formatShortDate,
  onStatusChange,
  onCostChange,
  onSaveStatus,
  smmBusy,
  smmMessage,
  editingBf,
  onRunSmm,
  onRefreshSmm,
  onRetrySub,
  onTopUpSub,
  onStartEditBf,
  onChangeBf,
  onChangeBfService,
  onSaveBf,
  onCancelBf,
  onClearBf,
  onDeleteOrder,
  onProfileNotFound,
  onPrivateAccount,
  profileNotFoundBusy,
}: {
  order: Order;
  ab: AbInfo;
  editingStatus: string;
  editingCost: string;
  saving: boolean;
  formatDate: (dateStr: string) => string;
  formatShortDate: (dateStr: string | null) => string;
  onStatusChange: (status: string) => void;
  onCostChange: (cost: string) => void;
  onSaveStatus: (orderId: number) => void;
  smmBusy: boolean;
  smmMessage: { kind: "info" | "error"; text: string } | null;
  editingBf: BfEditState;
  onRunSmm: (orderId: number) => void;
  onRefreshSmm: (orderId: number) => void;
  onRetrySub: (orderId: number, cartIndex: number, currentServiceId: number) => void;
  onTopUpSub: (orderId: number, cartIndex: number, originalQty: number, bfServiceId: number) => void;
  onStartEditBf: (cartIndex: number, currentBf: string, currentService: string) => void;
  onChangeBf: (value: string) => void;
  onChangeBfService: (value: string) => void;
  onSaveBf: (orderId: number) => void;
  onCancelBf: () => void;
  onClearBf: (orderId: number, cartIndex: number) => void;
  onDeleteOrder: (orderId: number) => void;
  onProfileNotFound: (orderId: number) => void;
  onPrivateAccount: (orderId: number) => void;
  profileNotFoundBusy: boolean;
}) {
  const cart = asArray<CartItem>(order.cart);
  const smmOrders = asArray<SmmOrderItem>(order.smm_orders);
  const firstItem = cart[0] ? asRecord(cart[0]) : {};
  const paidAt = formatDate(order.created_at);
  const totalQty = cart.reduce((sum, item) => sum + (item.qty || item.quantity || 0), 0);
  const totalBonus = cart.reduce((sum, item) => sum + (item.bonus || 0), 0);
  const marginEur = order.margin_cents_eur;
  const marginRate = order.total_cents_eur > 0 ? Math.round((marginEur / order.total_cents_eur) * 100) : 0;
  const activeSmm = smmOrders.filter((item) => item.status && item.status !== "failed").length;

  return (
    <div className="order-detail">
      <div className="order-detail-hero">
        <div className="order-customer">
          <div className="order-avatar">{getInitial(order.email)}</div>
          <div>
            <div className="order-detail-kicker">Commande #{order.id}</div>
            <div className="order-detail-title">{order.email}</div>
            <div className="order-detail-sub">
              {order.username ? `@${order.username.replace(/^@/, "")}` : "Client sans username"} · {paidAt}
            </div>
            {(() => {
              const n = order.customer_order_number || 0;
              const total = order.customer_total_orders || 0;
              if (n <= 0) return null;
              const isNew = n === 1 && total <= 1;
              return (
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <span style={{ color: "var(--a-ink-3)", fontWeight: 600 }}>Client :</span>
                  <span
                    className="pill"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: isNew ? "rgba(34,197,94,0.10)" : "rgba(82,96,230,0.10)",
                      color: isNew ? "#16a34a" : "#5260e6",
                      border: isNew ? "1px solid rgba(34,197,94,0.30)" : "1px solid rgba(82,96,230,0.30)",
                    }}
                  >
                    {isNew ? "🆕 Nouveau client" : `🔁 ${n}ème commande`}
                  </span>
                  {!isNew && total > 0 && (
                    <span style={{ color: "var(--a-ink-3)", fontSize: 11 }}>
                      · {total} commande{total > 1 ? "s" : ""} au total
                    </span>
                  )}
                </div>
              );
            })()}
            {ab && (
              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span style={{ color: "var(--a-ink-3)", fontWeight: 600 }}>Test A/B :</span>
                <span
                  className="pill"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    background: "rgba(82, 96, 230, 0.08)",
                    color: "#5260e6",
                    border: "1px solid rgba(82, 96, 230, 0.25)",
                  }}
                >
                  {ab.variantLabel}
                </span>
                <span style={{ color: "var(--a-ink-3)", fontSize: 11 }}>
                  · {ab.experimentLabel}
                  {ab.pricingStrategy ? ` · ${ab.pricingStrategy}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="order-finance-grid">
          <div>
            <span>Montant</span>
            <strong>{formatMoneyDual(order.total_cents, order.currency, order.total_cents_eur)}</strong>
          </div>
          <div>
            <span>Coût</span>
            <strong>{formatMoneyDual(order.cost_cents, order.currency, order.cost_cents_eur)}</strong>
          </div>
          <div>
            <span>Marge</span>
            <strong>
              {formatMoney(marginEur, "EUR")} <em>{marginRate}%</em>
            </strong>
          </div>
        </div>
      </div>

      <div className="order-detail-grid">
        <section className="order-panel order-panel-main">
          <div className="order-panel-head">
            <div>
              <h3>Panier client</h3>
              <p>
                {cart.length} ligne{cart.length > 1 ? "s" : ""} · {formatQty(totalQty)} unités
                {totalBonus ? ` · ${formatQty(totalBonus)} bonus` : ""}
              </p>
            </div>
            <span className="pill ink" style={{ textTransform: "capitalize" }}>
              {order.platform}
            </span>
          </div>

          {cart.length ? (
            <div className="order-items">
              {cart.map((item, index) => {
                const qty = item.qty || item.quantity || 0;
                const service = item.service || String(firstItem.service || "service");
                return (
                  <div className="order-item-card" key={`${service}-${index}`}>
                    <div className="order-item-main">
                      <div className="order-item-icon">{getInitial(service)}</div>
                      <div>
                        <strong>{getServiceLabel(service)}</strong>
                        <span>
                          {formatQty(qty)} unité{qty > 1 ? "s" : ""}
                          {item.bonus ? ` + ${formatQty(item.bonus)} bonus` : ""}
                        </span>
                      </div>
                    </div>
                    <div className="order-item-meta">
                      <span>{(item.platform || order.platform).toString()}</span>
                      <span>{(item.country || order.country || "Pays inconnu").toString().toUpperCase()}</span>
                    </div>
                    {item.scheduledStartAt && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: "rgba(145,70,255,0.08)",
                          border: "1px solid rgba(145,70,255,0.25)",
                          color: "#5b21b6",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                        title="Le client a programmé son live à cette date — lance BulkFollows ~5-10 min avant pour synchroniser les viewers."
                      >
                        📅 Live programmé : {new Date(item.scheduledStartAt).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}
                      </div>
                    )}
                    {(item.postUrl || item.link) && (
                      <a className="order-link" href={(item.postUrl || item.link) as string} target="_blank" rel="noreferrer">
                        Voir le lien {Ic.external()}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="order-empty">Aucun panier enregistré sur cette commande.</div>
          )}
        </section>

        <aside className="order-panel">
          <div className="order-panel-head">
            <div>
              <h3>Traitement</h3>
              <p>{activeSmm ? `${activeSmm} sous-commande(s) active(s)` : "Aucune sous-commande lancée"}</p>
            </div>
          </div>

          <div className="order-status-box">
            <label htmlFor={`status-${order.id}`}>Statut commande</label>
            <div className="order-status-actions">
              <select id={`status-${order.id}`} className="input" value={editingStatus} onChange={(e) => onStatusChange(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_MAP[s]?.label || s}
                  </option>
                ))}
              </select>
              <div className="order-cost-input-wrap">
                <input
                  id={`cost-${order.id}`}
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingCost}
                  onChange={(e) => onCostChange(e.target.value)}
                  aria-label="Coût commande"
                />
                <span>{order.currency || "EUR"}</span>
              </div>
              <button
                className="btn primary"
                disabled={saving || (editingStatus === order.status && Math.round(Number(editingCost || 0) * 100) === order.cost_cents)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveStatus(order.id);
                }}
              >
                {saving ? "..." : "Sauvegarder"}
              </button>
            </div>
          </div>

          <div className="order-fields">
            <Field
              label="Pays"
              value={
                order.country
                  ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{countryFlag(order.country) || "🏳️"}</span>
                      {order.country.toUpperCase()}
                    </span>
                  : "Non renseigné"
              }
            />
            <Field label="Langue" value={(order.lang || "Non renseignée").toUpperCase()} />
            <Field label="Followers avant" value={formatQty(order.followers_before)} />
            <Field label="Livraison" value={formatShortDate(order.delivered_at)} />
          </div>
        </aside>
      </div>

      <section className="order-panel">
        <div className="order-panel-head">
          <div>
            <h3>Commandes SMM (BulkFollows)</h3>
            <p>Suivi des sous-commandes envoyées au fournisseur</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn primary"
              onClick={(e) => { e.stopPropagation(); onRunSmm(order.id); }}
              disabled={smmBusy || cart.length === 0}
              title="Lance ou relance les sous-commandes manquantes via l'API BulkFollows"
            >
              {smmBusy ? "..." : Ic.zap()} Lancer BulkFollows
            </button>
            <button
              type="button"
              className="btn"
              onClick={(e) => { e.stopPropagation(); onRefreshSmm(order.id); }}
              disabled={smmBusy || smmOrders.length === 0}
              title="Rafraîchit les statuts BulkFollows et recalcule le coût"
            >
              {Ic.refresh()} Rafraîchir statuts
            </button>
          </div>
        </div>

        {smmMessage ? (
          <div
            style={{
              padding: "10px 14px",
              marginBottom: 12,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: smmMessage.kind === "error" ? "rgba(225,68,68,0.12)" : "rgba(82,96,230,0.10)",
              color: smmMessage.kind === "error" ? "#E14444" : "var(--a-ink)",
              border: "1px solid " + (smmMessage.kind === "error" ? "rgba(225,68,68,0.30)" : "rgba(82,96,230,0.25)"),
            }}
          >
            {smmMessage.text}
          </div>
        ) : null}

        {smmOrders.length || cart.length ? (
          <div className="smm-list">
            {(smmOrders.length ? smmOrders : cart.map((c, i) => ({
              cartIndex: i,
              service: c.service,
              platform: c.platform || order.platform,
              qty: c.qty || c.quantity,
              status: "pending" as const,
              bfOrderId: null,
              bfServiceId: 0,
              charge: null,
              error: null,
              placedAt: null,
            }))).map((item, index) => {
              const status = item.status || "pending";
              const st = SMM_STATUS_MAP[status] || { label: status, pill: "ink" };
              const cartIdx = typeof item.cartIndex === "number" ? item.cartIndex : index;
              const isEditing = editingBf?.cartIndex === cartIdx;
              const canRetry = status === "failed" || status === "canceled";
              const canTopUp = status === "partial" || status === "canceled";
              return (
                <div
                  className="smm-row"
                  key={`${item.bfOrderId || "smm"}-${cartIdx}`}
                  style={{ flexWrap: "wrap", rowGap: 6 }}
                >
                  <span className={"pill " + st.pill}>
                    <span className="dot" />
                    {st.label}
                  </span>
                  <strong>{getServiceLabel(item.service)}</strong>
                  <span>{formatQty(item.qty)} unités</span>

                  {isEditing ? (
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        placeholder="BF order ID"
                        value={editingBf.value}
                        onChange={(e) => onChangeBf(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: 120, padding: "4px 8px", fontSize: 12 }}
                      />
                      <input
                        className="input"
                        type="number"
                        min="0"
                        placeholder="Service"
                        value={editingBf.serviceValue}
                        onChange={(e) => onChangeBfService(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: 90, padding: "4px 8px", fontSize: 12 }}
                        title="BF service ID (optionnel)"
                      />
                      <button
                        type="button"
                        className="btn primary"
                        onClick={(e) => { e.stopPropagation(); onSaveBf(order.id); }}
                        disabled={smmBusy}
                        style={{ padding: "4px 10px", fontSize: 11 }}
                      >
                        {Ic.check()}
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={(e) => { e.stopPropagation(); onCancelBf(); }}
                        style={{ padding: "4px 10px", fontSize: 11 }}
                      >
                        {Ic.x()}
                      </button>
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <span className="mono" style={{ fontSize: 12 }}>BF #{item.bfOrderId || "-"}</span>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={(e) => { e.stopPropagation(); onStartEditBf(cartIdx, item.bfOrderId ? String(item.bfOrderId) : "", item.bfServiceId ? String(item.bfServiceId) : ""); }}
                        title="Éditer le BulkFollows order ID"
                        style={{ width: 24, height: 24, borderRadius: 6 }}
                      >
                        {Ic.edit()}
                      </button>
                      {item.bfOrderId ? (
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={(e) => { e.stopPropagation(); onClearBf(order.id, cartIdx); }}
                          disabled={smmBusy}
                          title="Détacher le BF order ID"
                          style={{ width: 24, height: 24, borderRadius: 6 }}
                        >
                          {Ic.x()}
                        </button>
                      ) : null}
                    </span>
                  )}

                  <span style={{ fontSize: 12, color: "var(--a-ink-3)" }}>Service #{item.bfServiceId || "-"}</span>
                  {item.charge ? (
                    <span style={{ fontSize: 12 }}>{item.charge.toFixed(4)} USD</span>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--a-ink-3)" }}>Coût à venir</span>
                  )}

                  {canRetry ? (
                    <button
                      type="button"
                      className="btn"
                      onClick={(e) => { e.stopPropagation(); onRetrySub(order.id, cartIdx, item.bfServiceId || 0); }}
                      disabled={smmBusy}
                      style={{ padding: "4px 10px", fontSize: 11 }}
                      title="Relance cette sous-commande via BulkFollows — choisis un service ID one-off ou laisse vide pour celui du config global"
                    >
                      {Ic.refresh()} Retry
                    </button>
                  ) : null}

                  {canTopUp ? (
                    <button
                      type="button"
                      className="btn primary"
                      onClick={(e) => { e.stopPropagation(); onTopUpSub(order.id, cartIdx, item.qty || 0, item.bfServiceId || 0); }}
                      disabled={smmBusy}
                      style={{ padding: "4px 10px", fontSize: 11 }}
                      title="Place une nouvelle commande BulkFollows pour combler le reliquat (en plus de l'originale, audit trail conservé)"
                    >
                      {Ic.zap()} Compléter la livraison
                    </button>
                  ) : null}

                  {item.error ? (
                    <em title={item.error} style={{ flexBasis: "100%", color: "#E14444", fontSize: 12 }}>
                      {item.error}
                    </em>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="order-empty">Aucune ligne dans le panier de cette commande.</div>
        )}
      </section>

      {order.stripe_payment_intent_id ? (
        <div className="order-technical-strip">
          <span>Payment Intent</span>
          <code>{order.stripe_payment_intent_id}</code>
        </div>
      ) : null}

      <JsonDetails cart={order.cart} smmOrders={order.smm_orders} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--a-line)" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn"
            onClick={(e) => { e.stopPropagation(); onProfileNotFound(order.id); }}
            disabled={profileNotFoundBusy || !order.email}
            style={{
              background: "rgba(198,138,25,0.10)",
              border: "1px solid rgba(198,138,25,0.35)",
              color: "#b45309",
              fontWeight: 700,
              padding: "8px 14px",
              fontSize: 12,
            }}
            title={`Envoie au client un email (langue : ${(order.lang || "fr").toUpperCase()}) pour réclamer les infos manquantes. Le contenu s'adapte au produit acheté (username / lien du post / URL du live). Sa réponse arrivera dans Support.`}
          >
            {profileNotFoundBusy ? "Envoi..." : "Demander les infos au client"}
          </button>
          {(order.platform === "instagram" || order.platform === "tiktok") && (
            <button
              type="button"
              className="btn"
              onClick={(e) => { e.stopPropagation(); onPrivateAccount(order.id); }}
              disabled={profileNotFoundBusy || !order.email}
              style={{
                background: "rgba(82,96,230,0.10)",
                border: "1px solid rgba(82,96,230,0.35)",
                color: "#5260e6",
                fontWeight: 700,
                padding: "8px 14px",
                fontSize: 12,
              }}
              title={`Envoie au client un email (langue : ${(order.lang || "fr").toUpperCase()}) lui demandant de passer son compte ${order.platform} en public. Sa réponse arrivera dans Support.`}
            >
              {profileNotFoundBusy ? "Envoi..." : `Compte ${order.platform} en privé`}
            </button>
          )}
        </div>
        <button
          type="button"
          className="btn"
          onClick={(e) => { e.stopPropagation(); onDeleteOrder(order.id); }}
          style={{
            background: "rgba(225,68,68,0.10)",
            border: "1px solid rgba(225,68,68,0.35)",
            color: "#E14444",
            fontWeight: 700,
            padding: "8px 14px",
            fontSize: 12,
          }}
          title="Supprime définitivement la commande de la base"
        >
          Supprimer la commande
        </button>
      </div>
    </div>
  );
}

export default function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [experiments, setExperiments] = useState<PricingExperiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionRequired, setActionRequired] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>("");
  const [editingCost, setEditingCost] = useState<string>("0.00");
  const [saving, setSaving] = useState(false);
  const [smmBusy, setSmmBusy] = useState(false);
  const [smmMessage, setSmmMessage] = useState<{ kind: "info" | "error"; text: string } | null>(null);
  const [editingBf, setEditingBf] = useState<BfEditState>(null);
  const [profileNotFoundBusy, setProfileNotFoundBusy] = useState(false);

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
      setActionRequired(Number(data.actionRequired) || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetch("/api/pricing-experiments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.experiments)) setExperiments(data.experiments as PricingExperiment[]);
      })
      .catch(() => {});
  }, []);

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
      setEditingCost((order.cost_cents / 100).toFixed(2));
      setSmmMessage(null);
      setEditingBf(null);
    }
  };

  const callSmmEndpoint = async (
    path: string,
    body: Record<string, unknown>,
    successMsg: (data: Record<string, unknown>) => string,
  ) => {
    setSmmBusy(true);
    setSmmMessage(null);
    const token = localStorage.getItem("admin_pw") || "";
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setSmmMessage({ kind: "info", text: successMsg(data) });
      await fetchOrders();
      return true;
    } catch (err) {
      setSmmMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "Erreur lors de l'appel BulkFollows",
      });
      return false;
    } finally {
      setSmmBusy(false);
    }
  };

  const handleRunSmm = async (orderId: number) => {
    await callSmmEndpoint(
      "/api/admin/orders/run-smm",
      { orderId },
      (data) => {
        const summary = (data?.summary || {}) as Record<string, number>;
        const placed = summary.placed ?? 0;
        const failed = summary.failed ?? 0;
        const skipped = summary.skipped ?? 0;
        return `BulkFollows lancé : ${placed} envoyée(s), ${skipped} déjà traitée(s), ${failed} en erreur.`;
      },
    );
  };

  const handleRefreshSmm = async (orderId: number) => {
    await callSmmEndpoint(
      "/api/admin/orders/refresh-smm",
      { orderId },
      (data) => {
        const summary = (data?.summary || {}) as Record<string, number>;
        const completed = summary.completed ?? 0;
        const inProgress = summary.inProgress ?? 0;
        const failed = summary.failed ?? 0;
        return `Statuts rafraîchis : ${completed} terminée(s), ${inProgress} en cours, ${failed} en erreur.`;
      },
    );
  };

  const handleRetrySub = async (orderId: number, cartIndex: number, currentServiceId: number) => {
    const suggestion = currentServiceId > 0 ? String(currentServiceId) : "";
    const raw = window.prompt(
      `Retry de la sous-commande #${cartIndex}.\n\n` +
      `BulkFollows service ID à utiliser ?\n` +
      `(Laisse vide pour utiliser celui du smm_config global. ` +
      `Entre une valeur pour faire un retry one-off avec un service précis.)`,
      suggestion,
    );
    if (raw === null) return; // user canceled
    const trimmed = raw.trim();
    const body: Record<string, unknown> = { orderId, cartIndex };
    if (trimmed) {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n <= 0) {
        setSmmMessage({ kind: "error", text: "Service ID invalide." });
        return;
      }
      body.serviceId = n;
    }
    await callSmmEndpoint(
      "/api/admin/orders/retry-smm",
      body,
      (data) => {
        const retried = (data?.retried || {}) as Record<string, unknown>;
        const status = String(retried?.status || "inconnu");
        const sid = retried?.bfServiceId ? ` · service #${retried.bfServiceId}` : "";
        return `Sous-commande #${cartIndex} relancée (statut : ${status})${sid}.`;
      },
    );
  };

  const handleTopUpSub = async (orderId: number, cartIndex: number, originalQty: number, bfServiceId: number) => {
    const qtySuggestion = originalQty > 0 ? String(originalQty) : "";
    const rawQty = window.prompt(
      `Compléter la livraison de la sous-commande #${cartIndex}.\n\n` +
      `1/2 — Quelle quantité re-livrer via BulkFollows ?`,
      qtySuggestion,
    );
    if (rawQty === null) return;
    const quantity = Number(rawQty);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setSmmMessage({ kind: "error", text: "Quantité invalide." });
      return;
    }

    const svcSuggestion = bfServiceId > 0 ? String(bfServiceId) : "";
    const rawSvc = window.prompt(
      `Compléter la livraison de la sous-commande #${cartIndex}.\n\n` +
      `2/2 — BulkFollows service ID à utiliser ?\n` +
      `(Laisse vide pour réutiliser le service de l'originale. ` +
      `Entre une valeur pour faire un top-up one-off avec un service précis.)`,
      svcSuggestion,
    );
    if (rawSvc === null) return;
    const body: Record<string, unknown> = { orderId, cartIndex, quantity };
    const trimmed = rawSvc.trim();
    if (trimmed) {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n <= 0) {
        setSmmMessage({ kind: "error", text: "Service ID invalide." });
        return;
      }
      body.serviceId = n;
    }

    await callSmmEndpoint(
      "/api/admin/orders/top-up-smm",
      body,
      (data) => {
        const sub = (data?.newSub || {}) as Record<string, unknown>;
        const sid = sub?.bfServiceId ? ` · service #${sub.bfServiceId}` : "";
        return `Top-up envoyé : ${quantity} unités via BF #${String(sub?.bfOrderId || "?")}${sid}. Commande repassée en processing.`;
      },
    );
  };

  const handleStartEditBf = (cartIndex: number, currentBf: string, currentService: string) => {
    setEditingBf({ cartIndex, value: currentBf, serviceValue: currentService });
    setSmmMessage(null);
  };

  const handleChangeBf = (value: string) => {
    setEditingBf((prev) => (prev ? { ...prev, value } : prev));
  };

  const handleChangeBfService = (value: string) => {
    setEditingBf((prev) => (prev ? { ...prev, serviceValue: value } : prev));
  };

  const handleCancelBf = () => setEditingBf(null);

  const handleSaveBf = async (orderId: number) => {
    if (!editingBf) return;
    const raw = editingBf.value.trim();
    if (!raw) {
      setSmmMessage({ kind: "error", text: "Renseigne un BF order ID (ou utilise la croix pour le détacher)." });
      return;
    }
    const bfOrderId = Number(raw);
    if (!Number.isFinite(bfOrderId) || bfOrderId <= 0) {
      setSmmMessage({ kind: "error", text: "BF order ID invalide." });
      return;
    }
    const serviceRaw = editingBf.serviceValue.trim();
    const bfServiceId = serviceRaw ? Number(serviceRaw) : undefined;
    if (serviceRaw && (!Number.isFinite(bfServiceId) || (bfServiceId as number) < 0)) {
      setSmmMessage({ kind: "error", text: "BF service ID invalide." });
      return;
    }
    const ok = await callSmmEndpoint(
      "/api/admin/orders/set-bf-id",
      { orderId, cartIndex: editingBf.cartIndex, bfOrderId, ...(bfServiceId ? { bfServiceId } : {}) },
      () => `BF #${bfOrderId} associé à la sous-commande #${editingBf.cartIndex}.`,
    );
    if (ok) setEditingBf(null);
  };

  const handleClearBf = async (orderId: number, cartIndex: number) => {
    if (!confirm("Détacher le BulkFollows order ID de cette sous-commande ?")) return;
    await callSmmEndpoint(
      "/api/admin/orders/set-bf-id",
      { orderId, cartIndex, bfOrderId: null },
      () => `BF détaché de la sous-commande #${cartIndex}.`,
    );
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm(`Supprimer définitivement la commande #${orderId} ? Cette action est irréversible.`)) return;
    setSaving(true);
    const token = localStorage.getItem("admin_pw") || "";
    try {
      const res = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setExpandedId(null);
      await fetchOrders();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setSaving(false);
    }
  };

  const handlePrivateAccount = async (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const lang = (order.lang || "fr").toUpperCase();
    if (!confirm(
      `Envoyer un email (en ${lang}) à ${order.email} pour lui demander de passer son compte ${order.platform} en public ? (Commande #${orderId})\n\nSa réponse arrivera dans Support.`,
    )) return;

    setProfileNotFoundBusy(true);
    setSmmMessage(null);
    const token = localStorage.getItem("admin_pw") || "";
    try {
      const res = await fetch("/api/admin/orders/profile-not-found", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, askKind: "private" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setSmmMessage({ kind: "info", text: `Email "compte privé" envoyé à ${order.email} (langue : ${lang}). Sa réponse arrivera dans Support.` });
    } catch (err) {
      setSmmMessage({ kind: "error", text: err instanceof Error ? err.message : "Erreur lors de l'envoi" });
    } finally {
      setProfileNotFoundBusy(false);
    }
  };

  const handleProfileNotFound = async (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const lang = (order.lang || "fr").toUpperCase();
    if (!confirm(
      `Envoyer un email (en ${lang}) à ${order.email} pour demander les infos manquantes pour la commande #${orderId} ?\n\nLe texte s'adapte au produit acheté (username / lien du post / URL du live).\nSa réponse arrivera dans Support.`,
    )) return;

    setProfileNotFoundBusy(true);
    setSmmMessage(null);
    const token = localStorage.getItem("admin_pw") || "";
    try {
      const res = await fetch("/api/admin/orders/profile-not-found", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      const askLabel = data?.askKind === "post"
        ? "lien du post"
        : data?.askKind === "live"
        ? "URL du live"
        : "username";
      setSmmMessage({ kind: "info", text: `Email envoyé à ${order.email} (langue : ${lang}, demande : ${askLabel}). Sa réponse arrivera dans Support.` });
    } catch (err) {
      setSmmMessage({ kind: "error", text: err instanceof Error ? err.message : "Erreur lors de l'envoi" });
    } finally {
      setProfileNotFoundBusy(false);
    }
  };

  const handleSaveStatus = async (orderId: number) => {
    const costValue = Number(editingCost);
    if (!Number.isFinite(costValue) || costValue < 0) {
      alert("Le coût doit être un montant positif.");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("admin_pw") || "";
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: orderId,
          status: editingStatus,
          cost_cents: Math.round(costValue * 100),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
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

  const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return "Non renseignée";
    return formatDate(dateStr);
  };

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div>
      {actionRequired > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 18px",
            marginBottom: 14,
            background: "linear-gradient(90deg, rgba(225,68,68,0.06), rgba(198,138,25,0.06))",
            border: "1px solid rgba(225,68,68,0.30)",
            borderRadius: 12,
            color: "var(--a-ink)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--a-red)", color: "white", display: "grid", placeItems: "center", fontSize: 16, fontWeight: 800, flexShrink: 0 }}>!</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>
              {actionRequired} commande{actionRequired > 1 ? "s" : ""} en attente d&apos;action
            </div>
            <div style={{ fontSize: 12, color: "var(--a-ink-3)", marginTop: 2 }}>
              Livraison BulkFollows partielle ou annulée — décide si tu complètes via &quot;Compléter la livraison&quot; ou si tu rembourses via Stripe.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn"
              style={{ padding: "6px 12px", fontSize: 12 }}
              onClick={() => setStatusFilter("partial")}
            >
              Voir partielles
            </button>
            <button
              className="btn"
              style={{ padding: "6px 12px", fontSize: 12 }}
              onClick={() => setStatusFilter("canceled")}
            >
              Voir annulées
            </button>
          </div>
        </div>
      )}

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
              ["delivered", "Livrées"],
              ["partial", "Partielles"],
              ["canceled", "Annulées"],
              ["failed", "Échouées"],
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
            {Ic.refresh()} Rafraîchir
          </button>
        </div>
      </div>

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
          <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>Chargement...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>Aucune commande trouvée.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Client</th>
                <th>Plateforme</th>
                <th>Pays</th>
                <th className="num">Montant</th>
                <th className="num">Coût</th>
                <th>Statut</th>
                <th>Test A/B</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const st = STATUS_MAP[o.status] || { label: o.status, pill: "" };
                const isExpanded = expandedId === o.id;
                const ab = resolveAbInfo(o, experiments);
                return (
                  <Fragment key={o.id}>
                    <tr
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
                        {(() => {
                          const n = o.customer_order_number || 0;
                          const total = o.customer_total_orders || 0;
                          if (n <= 0) {
                            return <span style={{ fontSize: 12, color: "var(--a-ink-3)" }}>—</span>;
                          }
                          if (n === 1 && total <= 1) {
                            return (
                              <span
                                className="pill"
                                title="Première commande de ce client"
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: "rgba(34,197,94,0.10)",
                                  color: "#16a34a",
                                  border: "1px solid rgba(34,197,94,0.30)",
                                }}
                              >
                                🆕 Nouveau
                              </span>
                            );
                          }
                          return (
                            <span
                              className="pill"
                              title={`${n}ème commande de ce client (${total} au total)`}
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                background: "rgba(82,96,230,0.10)",
                                color: "#5260e6",
                                border: "1px solid rgba(82,96,230,0.30)",
                              }}
                            >
                              🔁 #{n}
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: 12, textTransform: "capitalize" }}>
                          {o.platform}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }} title={o.country || "Inconnu"}>
                          <span style={{ fontSize: 18, lineHeight: 1 }}>{countryFlag(o.country) || "🏳️"}</span>
                          <span style={{ color: "var(--a-ink-3)", fontWeight: 600 }}>{(o.country || "—").toUpperCase()}</span>
                        </span>
                      </td>
                      <td className="num" style={{ fontWeight: 700, color: "var(--a-ink)" }}>
                        {formatMoneyDual(o.total_cents, o.currency, o.total_cents_eur)}
                      </td>
                      <td className="num" style={{ color: "var(--a-ink-3)" }}>
                        {formatMoneyDual(o.cost_cents, o.currency, o.cost_cents_eur)}
                      </td>
                      <td>
                        <span className={"pill " + st.pill}>
                          <span className="dot" />
                          {st.label}
                        </span>
                      </td>
                      <td>
                        {ab ? (
                          <span
                            className="pill"
                            title={`Expérience : ${ab.experimentLabel}${ab.pricingStrategy ? ` · ${ab.pricingStrategy}` : ""}`}
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              background: "rgba(82, 96, 230, 0.08)",
                              color: "#5260e6",
                              border: "1px solid rgba(82, 96, 230, 0.25)",
                            }}
                          >
                            {ab.variantLabel}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--a-ink-3)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: "var(--a-ink-3)" }}>{formatDate(o.created_at)}</span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={10} className="order-detail-cell">
                          <OrderDetail
                            order={o}
                            ab={ab}
                            editingStatus={editingStatus}
                            editingCost={editingCost}
                            saving={saving}
                            formatDate={formatDate}
                            formatShortDate={formatShortDate}
                            onStatusChange={setEditingStatus}
                            onCostChange={setEditingCost}
                            onSaveStatus={handleSaveStatus}
                            smmBusy={smmBusy}
                            smmMessage={smmMessage}
                            editingBf={editingBf}
                            onRunSmm={handleRunSmm}
                            onRefreshSmm={handleRefreshSmm}
                            onRetrySub={handleRetrySub}
                            onTopUpSub={handleTopUpSub}
                            onStartEditBf={handleStartEditBf}
                            onChangeBf={handleChangeBf}
                            onChangeBfService={handleChangeBfService}
                            onSaveBf={handleSaveBf}
                            onCancelBf={handleCancelBf}
                            onClearBf={handleClearBf}
                            onDeleteOrder={handleDeleteOrder}
                            onProfileNotFound={handleProfileNotFound}
                            onPrivateAccount={handlePrivateAccount}
                            profileNotFoundBusy={profileNotFoundBusy}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}

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
              {startItem}-{endItem} sur {total} commandes
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                className="btn ghost"
                style={{ padding: "6px 12px" }}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
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
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
