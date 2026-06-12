"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { Ic } from "../icons";
import AdminModal, { type AdminModalConfig } from "../AdminModal";
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
  refunded_amount_cents?: number;
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
  admin_tags?: string[];
}

// Predefined internal tag catalog (operator-only). Editable from the Orders view.
interface OrderTag {
  id: number;
  label: string;
  color: string;
  sort_order: number;
}

const TAG_COLORS = ["amber", "violet", "red", "green", "blue", "ink"] as const;

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
  // Internal-only — masked as "processing" on every customer-facing surface
  // (see api/order/[id], orders-by-email, account/orders). Used when BF
  // refuses to deliver because the target account is private/suspended/etc.
  account_unavailable: { label: "Compte non dispo", pill: "amber" },
};

const STATUSES = ["pending", "paid", "processing", "delivered", "partial", "canceled", "account_unavailable", "failed"] as const;

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
  // Multi-video distribution (tiktok-2 likes/views): the pack is split across
  // these videos at fulfillment (one BulkFollows sub-order per URL).
  postUrls?: string[];
  link?: string;
  scheduledStartAt?: string;
  upsell?: boolean;
  upsellId?: number;
  priceCents?: number;
  label?: string;
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

// admin_tags arrives as a JSONB array (already parsed) but stay defensive in
// case it comes back as a JSON string from some code paths.
function asTags(value: unknown): string[] {
  const arr = asArray<unknown>(value);
  return arr.map((t) => String(t || "").trim()).filter(Boolean);
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

function getProfileUrl(platform: string | null | undefined, username: string | null | undefined): string | null {
  if (!platform || !username) return null;
  const handle = username.trim().replace(/^@/, "");
  if (!handle) return null;
  const encoded = encodeURIComponent(handle);
  switch (platform.toLowerCase()) {
    case "instagram":
      return `https://www.instagram.com/${encoded}/`;
    case "tiktok":
      return `https://www.tiktok.com/@${encoded}`;
    case "twitch":
      return `https://www.twitch.tv/${encoded}`;
    case "youtube":
      return `https://www.youtube.com/@${encoded}`;
    case "twitter":
    case "x":
      return `https://x.com/${encoded}`;
    case "facebook":
      return `https://www.facebook.com/${encoded}`;
    case "linkedin":
      return `https://www.linkedin.com/in/${encoded}`;
    case "spotify":
      return `https://open.spotify.com/user/${encoded}`;
    default:
      return null;
  }
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
  onRefillSmm,
  onRetrySub,
  onTopUpSub,
  onStartEditBf,
  onChangeBf,
  onChangeBfService,
  onSaveBf,
  onCancelBf,
  onClearBf,
  onDeleteOrder,
  onRefund,
  onProfileNotFound,
  onPrivateAccount,
  onRefillNotice,
  profileNotFoundBusy,
  tagCatalog,
  onToggleTag,
  tagBusy,
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
  onRefillSmm: (orderId: number) => void;
  onRetrySub: (orderId: number, cartIndex: number, currentServiceId: number) => void;
  onTopUpSub: (orderId: number, cartIndex: number, originalQty: number, bfServiceId: number) => void;
  onStartEditBf: (cartIndex: number, currentBf: string, currentService: string) => void;
  onChangeBf: (value: string) => void;
  onChangeBfService: (value: string) => void;
  onSaveBf: (orderId: number) => void;
  onCancelBf: () => void;
  onClearBf: (orderId: number, cartIndex: number) => void;
  onDeleteOrder: (orderId: number) => void;
  onRefund: (orderId: number) => void;
  onProfileNotFound: (orderId: number) => void;
  onPrivateAccount: (orderId: number) => void;
  onRefillNotice: (orderId: number) => void;
  profileNotFoundBusy: boolean;
  tagCatalog: OrderTag[];
  onToggleTag: (orderId: number, label: string) => void;
  tagBusy: boolean;
}) {
  const cart = asArray<CartItem>(order.cart);
  const activeTags = asTags(order.admin_tags);
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
                  <div
                    className="order-item-card"
                    key={`${service}-${index}`}
                    style={item.upsell ? { borderColor: "#16a34a", background: "rgba(34,197,94,0.04)" } : undefined}
                  >
                    {item.upsell && (
                      <div
                        style={{
                          marginBottom: 8,
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "#16a34a",
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "rgba(34,197,94,0.12)",
                        }}
                      >
                        ⚡ Upsell {item.priceCents ? `· +${(item.priceCents / 100).toFixed(2)} €` : ""}
                      </div>
                    )}
                    <div className="order-item-main">
                      <div className="order-item-icon">{getInitial(service)}</div>
                      <div>
                        <strong>{item.label || getServiceLabel(service)}</strong>
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
                    {(item.postUrl || item.link) && !(Array.isArray(item.postUrls) && item.postUrls.length) && (
                      <a className="order-link" href={(item.postUrl || item.link) as string} target="_blank" rel="noreferrer">
                        Voir le lien {Ic.external()}
                      </a>
                    )}
                    {Array.isArray(item.postUrls) && item.postUrls.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--a-ink)", marginBottom: 4 }}>
                          Réparti sur {item.postUrls.length} vidéo{item.postUrls.length > 1 ? "s" : ""}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {item.postUrls.map((url, i) => (
                            <a key={i} className="order-link" href={url} target="_blank" rel="noreferrer">
                              Vidéo {i + 1} {Ic.external()}
                            </a>
                          ))}
                        </div>
                      </div>
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
            <h3>Commentaires internes</h3>
            <p>Tags privés (jamais visibles par le client). Clique pour activer/désactiver.</p>
          </div>
        </div>
        {(() => {
          const colorByLabel = new Map(tagCatalog.map((t) => [t.label, t.color]));
          // Show catalog labels + any tag the order still carries that has since
          // been removed from the catalog (so the operator can untoggle it).
          const orphanTags = activeTags.filter((t) => !colorByLabel.has(t));
          const allLabels = [...tagCatalog.map((t) => t.label), ...orphanTags];
          if (allLabels.length === 0) {
            return (
              <div className="order-empty">
                Aucun libellé défini. Ajoute-en via « Gérer les libellés » en haut de la liste.
              </div>
            );
          }
          return (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allLabels.map((label) => {
                const isActive = activeTags.includes(label);
                const color = colorByLabel.get(label) || "ink";
                return (
                  <button
                    key={label}
                    type="button"
                    className={isActive ? "pill " + color : "pill"}
                    onClick={(e) => { e.stopPropagation(); onToggleTag(order.id, label); }}
                    disabled={tagBusy}
                    title={isActive ? "Cliquer pour retirer ce tag" : "Cliquer pour ajouter ce tag"}
                    style={{
                      cursor: tagBusy ? "wait" : "pointer",
                      border: isActive ? undefined : "1px dashed var(--a-line)",
                      background: isActive ? undefined : "transparent",
                      color: isActive ? undefined : "var(--a-ink-3)",
                      opacity: tagBusy ? 0.6 : 1,
                      fontWeight: 700,
                    }}
                  >
                    {isActive ? "✓ " : "+ "}{label}
                  </button>
                );
              })}
            </div>
          );
        })()}
      </section>

      <section className="order-panel">
        <div className="order-panel-head">
          <div>
            <h3>Commandes SMM</h3>
            <p>Suivi des sous-commandes envoyées au fournisseur</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn primary"
              onClick={(e) => { e.stopPropagation(); onRunSmm(order.id); }}
              disabled={smmBusy || cart.length === 0}
              title="Lance ou relance les sous-commandes manquantes via le fournisseur SMM"
            >
              {smmBusy ? "..." : Ic.zap()} Lancer SMM
            </button>
            <button
              type="button"
              className="btn"
              onClick={(e) => { e.stopPropagation(); onRefreshSmm(order.id); }}
              disabled={smmBusy || smmOrders.length === 0}
              title="Rafraîchit les statuts SMM et recalcule le coût"
            >
              {Ic.refresh()} Rafraîchir statuts
            </button>
            <button
              type="button"
              className="btn"
              onClick={(e) => { e.stopPropagation(); onRefillSmm(order.id); }}
              disabled={smmBusy || cart.length === 0}
              title="Refill : relance TOUTE la commande de zéro sur un service BulkFollows que tu choisis (re-commande chaque ligne à sa quantité complète, en sous-commandes neuves)."
            >
              {smmBusy ? "..." : Ic.refresh()} Refill (relancer de 0)
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
                      <span className="mono" style={{ fontSize: 12 }}>{item.provider === "dripfeedpanel" ? "DF" : "BF"} #{item.bfOrderId || "-"}</span>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={(e) => { e.stopPropagation(); onStartEditBf(cartIdx, item.bfOrderId ? String(item.bfOrderId) : "", item.bfServiceId ? String(item.bfServiceId) : ""); }}
                        title="Éditer le SMM order ID"
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
                      title="Relance cette sous-commande via le fournisseur SMM — choisis un service ID one-off ou laisse vide pour celui du config global"
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
                      title="Place une nouvelle commande SMM pour combler le reliquat (en plus de l'originale, audit trail conservé)"
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
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(198,138,25,0.10)",
              border: "1px solid rgba(198,138,25,0.35)",
              color: "#b45309",
              fontWeight: 700,
              padding: "8px 14px",
              fontSize: 12,
            }}
            title={`Envoie au client un email (langue : ${(order.lang || "fr").toUpperCase()}) pour réclamer les infos manquantes. Le contenu s'adapte au produit acheté (username / lien du post / URL du live). Sa réponse arrivera dans Support.`}
          >
            {Ic.mail()} {profileNotFoundBusy ? "Envoi..." : "Demander les infos au client"}
          </button>
          {(order.platform === "instagram" || order.platform === "tiktok" || order.platform === "twitter") && (
            <button
              type="button"
              className="btn"
              onClick={(e) => { e.stopPropagation(); onPrivateAccount(order.id); }}
              disabled={profileNotFoundBusy || !order.email}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(82,96,230,0.10)",
                border: "1px solid rgba(82,96,230,0.35)",
                color: "#5260e6",
                fontWeight: 700,
                padding: "8px 14px",
                fontSize: 12,
              }}
              title={`Envoie au client un email (langue : ${(order.lang || "fr").toUpperCase()}) lui demandant de rendre son compte ${order.platform === "twitter" ? "X" : order.platform} public. Sa réponse arrivera dans Support.`}
            >
              {Ic.mail()} {profileNotFoundBusy ? "Envoi..." : order.platform === "twitter" ? "Compte X protégé" : `Compte ${order.platform} en privé`}
            </button>
          )}
          <button
            type="button"
            className="btn"
            onClick={(e) => { e.stopPropagation(); onRefillNotice(order.id); }}
            disabled={profileNotFoundBusy || !order.email}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(22,163,74,0.10)",
              border: "1px solid rgba(22,163,74,0.35)",
              color: "#16a34a",
              fontWeight: 700,
              padding: "8px 14px",
              fontSize: 12,
            }}
            title={`Envoie au client un email de fidélité (langue : ${(order.lang || "fr").toUpperCase()}) l'informant qu'on vient de relancer gratuitement sa commande suite à une baisse de followers / likes. Pense à relancer la livraison avant.`}
          >
            {Ic.mail()} {profileNotFoundBusy ? "Envoi..." : "Relance fidélité"}
          </button>
          {order.stripe_payment_intent_id && order.status !== "refunded" ? (
            <button
              type="button"
              className="btn"
              onClick={(e) => { e.stopPropagation(); onRefund(order.id); }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(220,38,38,0.08)",
                border: "1px solid rgba(220,38,38,0.35)",
                color: "#dc2626",
                fontWeight: 700,
                padding: "8px 14px",
                fontSize: 12,
              }}
              title="Rembourse la commande via Stripe (total ou partiel) sans quitter l'admin."
            >
              {Ic.refresh()} Rembourser
            </button>
          ) : null}
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

// Inline editor for the predefined tag catalog (add / recolor / delete).
// Mutates server-side then asks the parent to refetch via onChanged.
function TagManager({
  tags,
  onChanged,
  onClose,
}: {
  tags: OrderTag[];
  onChanged: () => void;
  onClose: () => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState<string>("amber");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authed = (path: string, init: RequestInit) => {
    const token = localStorage.getItem("admin_pw") || "";
    return fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers || {}) },
    });
  };

  const runMutation = async (fn: () => Promise<Response>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      onChanged();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async () => {
    const label = newLabel.trim();
    if (!label) return;
    const ok = await runMutation(() =>
      authed("/api/admin/order-tags", {
        method: "POST",
        body: JSON.stringify({ label, color: newColor, sort_order: (tags.length + 1) * 10 }),
      }),
    );
    if (ok) setNewLabel("");
  };

  const handleRecolor = (id: number, color: string) =>
    runMutation(() => authed("/api/admin/order-tags", { method: "PUT", body: JSON.stringify({ id, color }) }));

  const handleDelete = (id: number) =>
    runMutation(() => authed(`/api/admin/order-tags?id=${id}`, { method: "DELETE" }));

  return (
    <div className="card" style={{ padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>Libellés de commentaires</div>
        <button className="btn ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={onClose}>
          {Ic.x()} Fermer
        </button>
      </div>

      {error && (
        <div style={{ padding: "8px 12px", marginBottom: 10, borderRadius: 8, background: "rgba(225,68,68,0.1)", border: "1px solid rgba(225,68,68,0.3)", color: "#E14444", fontSize: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {tags.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--a-ink-3)" }}>Aucun libellé pour l&apos;instant.</div>
        ) : (
          tags.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span className={"pill " + t.color} style={{ fontWeight: 700 }}>{t.label}</span>
              <select
                className="input"
                value={t.color}
                onChange={(e) => handleRecolor(t.id, e.target.value)}
                disabled={busy}
                style={{ width: 110, padding: "4px 8px", fontSize: 12 }}
                aria-label={`Couleur de ${t.label}`}
              >
                {TAG_COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="button"
                className="icon-btn"
                onClick={() => handleDelete(t.id)}
                disabled={busy}
                title="Supprimer ce libellé du catalogue"
                style={{ width: 28, height: 28, borderRadius: 6, marginLeft: "auto" }}
              >
                {Ic.x()}
              </button>
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", borderTop: "1px solid var(--a-line)", paddingTop: 12 }}>
        <input
          className="input"
          placeholder="Nouveau libellé (ex. Compte suspendu)"
          value={newLabel}
          maxLength={80}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          style={{ flex: 1, minWidth: 200, padding: "6px 10px", fontSize: 13 }}
        />
        <select
          className="input"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          style={{ width: 110, padding: "6px 10px", fontSize: 13 }}
          aria-label="Couleur du nouveau libellé"
        >
          {TAG_COLORS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button className="btn primary" onClick={handleAdd} disabled={busy || !newLabel.trim()}>
          {busy ? "..." : "Ajouter"}
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
  const [bfSearch, setBfSearch] = useState("");
  const [bfSearchInput, setBfSearchInput] = useState("");
  const [modal, setModal] = useState<AdminModalConfig | null>(null);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>("");
  const [editingCost, setEditingCost] = useState<string>("0.00");
  const [saving, setSaving] = useState(false);
  const [smmBusy, setSmmBusy] = useState(false);
  const [smmMessage, setSmmMessage] = useState<{ kind: "info" | "error"; text: string } | null>(null);
  const [editingBf, setEditingBf] = useState<BfEditState>(null);
  const [profileNotFoundBusy, setProfileNotFoundBusy] = useState(false);

  const [tagCatalog, setTagCatalog] = useState<OrderTag[]>([]);
  const [tagBusy, setTagBusy] = useState(false);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);

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
    if (bfSearch) params.set("bfOrderId", bfSearch);
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
  }, [page, statusFilter, search, bfSearch]);

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

  const fetchTagCatalog = useCallback(async () => {
    const token = localStorage.getItem("admin_pw") || "";
    try {
      const res = await fetch("/api/admin/order-tags", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.tags)) setTagCatalog(data.tags as OrderTag[]);
    } catch {
      /* non-blocking — the orders list still works without the catalog */
    }
  }, []);

  useEffect(() => {
    fetchTagCatalog();
  }, [fetchTagCatalog]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, bfSearch]);

  const handleSearch = () => {
    setSearch(searchInput.trim());
  };

  const handleBfSearch = () => {
    // Allow either a raw integer or accidentally-pasted prefixes ("BF #1234",
    // "Order 1234") — extract the first integer chunk so the admin can paste
    // whatever's on screen without trimming.
    const digits = bfSearchInput.match(/\d+/)?.[0] || "";
    setBfSearchInput(digits);
    setBfSearch(digits);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleBfKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleBfSearch();
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
        text: err instanceof Error ? err.message : "Erreur lors de l'appel SMM",
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
        return `SMM lancé : ${placed} envoyée(s), ${skipped} déjà traitée(s), ${failed} en erreur.`;
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

  const handleRefillSmm = (orderId: number) => {
    setModal({
      title: `Refill — commande #${orderId}`,
      message:
        "Relance TOUTE la commande de zéro : re-commande chaque ligne du panier à sa quantité complète sur le service ci-dessous, en sous-commandes neuves. L'ancienne livraison n'est pas écrasée.",
      input: {
        label: "SMM service ID",
        placeholder: "ex. 16635",
        validate: (v) => {
          const n = Number(v);
          return Number.isFinite(n) && n > 0 ? null : "Service ID invalide.";
        },
      },
      confirmLabel: "Lancer le refill",
      onConfirm: async (v) => {
        const n = Number(v);
        await callSmmEndpoint(
          "/api/admin/orders/refill-smm",
          { orderId, serviceId: n },
          (data) => {
            const summary = (data?.summary || {}) as Record<string, number>;
            const placed = summary.placed ?? 0;
            const failed = summary.failed ?? 0;
            return `Refill lancé sur le service #${n} : ${placed} sous-commande(s) relancée(s), ${failed} en erreur.`;
          },
        );
      },
    });
  };

  const handleRetrySub = async (orderId: number, cartIndex: number, currentServiceId: number) => {
    const suggestion = currentServiceId > 0 ? String(currentServiceId) : "";
    const raw = window.prompt(
      `Retry de la sous-commande #${cartIndex}.\n\n` +
      `SMM service ID à utiliser ?\n` +
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
      `1/2 — Quelle quantité re-livrer via SMM ?`,
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
      `2/2 — SMM service ID à utiliser ?\n` +
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
        return `Top-up envoyé : ${quantity} unités via #${String(sub?.bfOrderId || "?")}${sid}. Commande repassée en processing.`;
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
      () => `#${bfOrderId} associé à la sous-commande #${editingBf.cartIndex}.`,
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

  const handleRefund = (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const total = Number(order.total_cents) || 0;
    const already = Number(order.refunded_amount_cents) || 0;
    const remaining = Math.max(0, total - already);
    const currency = String(order.currency || "EUR").toUpperCase();
    const remainingMajor = (remaining / 100).toFixed(2);
    const parse = (v: string) => Number(v.replace(",", ".").trim());

    setModal({
      title: `Rembourser la commande #${orderId}`,
      message:
        `Remboursement via Stripe. Restant remboursable : ${remainingMajor} ${currency}.\n` +
        `Laisse le montant complet pour un remboursement total, ou réduis-le pour un partiel.`,
      input: {
        label: `Montant à rembourser (${currency})`,
        defaultValue: remainingMajor,
        validate: (v) => {
          const n = parse(v);
          if (!Number.isFinite(n) || n <= 0) return "Montant invalide.";
          if (Math.round(n * 100) > remaining) return `Maximum ${remainingMajor} ${currency}.`;
          return null;
        },
      },
      confirmLabel: "Rembourser",
      danger: true,
      onConfirm: async (v) => {
        const amountCents = Math.round(parse(v) * 100);
        setSaving(true);
        setSmmMessage(null);
        const token = localStorage.getItem("admin_pw") || "";
        try {
          const res = await fetch("/api/admin/orders/refund", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ orderId, amountCents }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
          const refunded = (Number(data.refundedNow) || 0) / 100;
          setSmmMessage({
            kind: "info",
            text: `Remboursé ${refunded.toFixed(2)} ${currency}${data.fullyRefunded ? " (total)" : " (partiel)"}.`,
          });
          await fetchOrders();
        } catch (err) {
          setSmmMessage({ kind: "error", text: err instanceof Error ? err.message : "Erreur lors du remboursement" });
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleDeleteOrder = (orderId: number) => {
    setModal({
      title: `Supprimer la commande #${orderId} ?`,
      message: "Cette action est irréversible — la commande et ses emails programmés seront définitivement supprimés.",
      confirmLabel: "Supprimer",
      danger: true,
      onConfirm: async () => {
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
          setSmmMessage({ kind: "error", text: err instanceof Error ? err.message : "Erreur lors de la suppression" });
        } finally {
          setSaving(false);
        }
      },
    });
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

  const handleRefillNotice = async (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const lang = (order.lang || "fr").toUpperCase();
    if (!confirm(
      `Envoyer un email de fidélité (en ${lang}) à ${order.email} pour l'informer qu'on vient de relancer gratuitement sa commande #${orderId} suite à une baisse ?\n\nPense à avoir relancé la livraison (Retry / Lancer BulkFollows) avant.`,
    )) return;

    setProfileNotFoundBusy(true);
    setSmmMessage(null);
    const token = localStorage.getItem("admin_pw") || "";
    try {
      const res = await fetch("/api/admin/orders/refill-notice", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setSmmMessage({ kind: "info", text: `Email de fidélité (relance) envoyé à ${order.email} (langue : ${lang}).` });
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

  const handleToggleTag = async (orderId: number, label: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const current = asTags(order.admin_tags);
    const next = current.includes(label)
      ? current.filter((t) => t !== label)
      : [...current, label];

    setTagBusy(true);
    const token = localStorage.getItem("admin_pw") || "";
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: orderId, admin_tags: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      // Patch locally so the expanded panel stays open (no full refetch).
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, admin_tags: next } : o)));
    } catch (err) {
      setSmmMessage({ kind: "error", text: err instanceof Error ? err.message : "Erreur lors de la mise à jour des tags" });
    } finally {
      setTagBusy(false);
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
  const tagColorByLabel = new Map(tagCatalog.map((t) => [t.label, t.color]));

  return (
    <div>
      <AdminModal config={modal} onClose={() => setModal(null)} />
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
              Livraison SMM partielle ou annulée — décide si tu complètes via &quot;Compléter la livraison&quot; ou si tu rembourses via Stripe.
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
        <div className="search-box" style={{ width: 220 }}>
          {Ic.search()}
          <input
            placeholder="ID SMM..."
            value={bfSearchInput}
            onChange={(e) => setBfSearchInput(e.target.value)}
            onKeyDown={handleBfKeyDown}
            onBlur={handleBfSearch}
            inputMode="numeric"
          />
        </div>
        <div className="tabs" style={{ padding: 3 }}>
          {(
            [
              ["all", "Tous"],
              ["needs_action", "À traiter"],
              ["pending", "Pending"],
              ["paid", "Paid"],
              ["processing", "En cours"],
              ["delivered", "Livrées"],
              ["partial", "Partielles"],
              ["canceled", "Annulées"],
              ["account_unavailable", "Compte non dispo"],
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
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            className={"btn " + (tagManagerOpen ? "primary" : "")}
            onClick={() => setTagManagerOpen((v) => !v)}
            title="Ajouter / modifier les libellés de commentaires prédéfinis"
          >
            {Ic.edit()} Gérer les libellés
          </button>
          <button className="btn" onClick={fetchOrders}>
            {Ic.refresh()} Rafraîchir
          </button>
        </div>
      </div>

      {tagManagerOpen && (
        <TagManager tags={tagCatalog} onChanged={fetchTagCatalog} onClose={() => setTagManagerOpen(false)} />
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
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 12, textTransform: "capitalize" }}>
                            {o.platform}
                          </span>
                          {(() => {
                            const cleanHandle = (o.username || "").trim().replace(/^@/, "");
                            if (!cleanHandle) return null;
                            const url = getProfileUrl(o.platform, o.username);
                            const label = `- @${cleanHandle}`;
                            if (!url) {
                              return (
                                <span style={{ fontSize: 12, color: "var(--a-ink-3)", fontWeight: 600 }}>
                                  {label}
                                </span>
                              );
                            }
                            return (
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title={`Voir le profil @${cleanHandle} sur ${o.platform}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  color: "var(--a-ink-3)",
                                  textDecoration: "none",
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                {label}
                                {Ic.external(12)}
                              </a>
                            );
                          })()}
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
                        {(() => {
                          const tags = asTags(o.admin_tags);
                          if (tags.length === 0) return null;
                          return (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                              {tags.map((label) => (
                                <span
                                  key={label}
                                  className={"pill " + (tagColorByLabel.get(label) || "ink")}
                                  style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px" }}
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
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
                            onRefillSmm={handleRefillSmm}
                            onRetrySub={handleRetrySub}
                            onTopUpSub={handleTopUpSub}
                            onStartEditBf={handleStartEditBf}
                            onChangeBf={handleChangeBf}
                            onChangeBfService={handleChangeBfService}
                            onSaveBf={handleSaveBf}
                            onCancelBf={handleCancelBf}
                            onClearBf={handleClearBf}
                            onDeleteOrder={handleDeleteOrder}
                            onRefund={handleRefund}
                            onProfileNotFound={handleProfileNotFound}
                            onPrivateAccount={handlePrivateAccount}
                            onRefillNotice={handleRefillNotice}
                            profileNotFoundBusy={profileNotFoundBusy}
                            tagCatalog={tagCatalog}
                            onToggleTag={handleToggleTag}
                            tagBusy={tagBusy}
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
