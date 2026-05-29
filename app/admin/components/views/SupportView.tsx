"use client";

import { useEffect, useState } from "react";

type Reply = {
  id: number;
  email: string;
  message: string;
  created_at: string;
  sender_type: "client" | "admin";
};

type Thread = {
  id: number;
  email: string;
  message: string;
  created_at: string;
  replied: boolean;
  reply_text?: string;
  replies?: Reply[];
};

/** Compact order shape for the inline "customer orders" panel (#10). */
type OrderLite = {
  id: number;
  platform: string;
  status: string;
  total_cents: number;
  currency: string;
  total_cents_eur: number;
  created_at: string;
};

type TplLang = "fr" | "en";

// Canned replies (#11) — one-click starters in the customer's language.
const REPLY_TEMPLATES: Record<TplLang, { label: string; text: string }[]> = {
  fr: [
    { label: "Délai de livraison", text: "Bonjour,\n\nMerci pour ton message ! Ta commande est bien en cours : la livraison se fait progressivement sous 24–72h pour rester 100 % naturelle. Tu peux suivre l'avancement depuis ton espace commande.\n\nL'équipe Fanovera" },
    { label: "Refill / baisse", text: "Bonjour,\n\nPas d'inquiétude — en cas de baisse, on recharge ta commande gratuitement. On vient de la relancer de notre côté, le compte devrait remonter sous peu.\n\nL'équipe Fanovera" },
    { label: "Compte privé", text: "Bonjour,\n\nOn n'arrive pas à livrer car ton compte est en privé. Peux-tu le passer en public le temps de la livraison, puis nous répondre pour confirmer ? Une fois terminé, tu pourras le remettre en privé.\n\nL'équipe Fanovera" },
    { label: "Remerciement", text: "Bonjour,\n\nMerci beaucoup pour ta confiance ! N'hésite pas si tu as la moindre question, on est là.\n\nL'équipe Fanovera" },
  ],
  en: [
    { label: "Delivery time", text: "Hi,\n\nThanks for reaching out! Your order is on its way — delivery rolls out gradually over 24–72h to stay 100% natural. You can follow the progress from your order page.\n\nThe Fanovera team" },
    { label: "Refill / drop", text: "Hi,\n\nNo worries — if there's a drop, we top your order back up for free. We just relaunched it on our side, the count should recover shortly.\n\nThe Fanovera team" },
    { label: "Private account", text: "Hi,\n\nWe can't deliver because your account is set to private. Could you switch it to public until delivery is complete, then reply to confirm? Once it's done you can switch it back.\n\nThe Fanovera team" },
    { label: "Thank you", text: "Hi,\n\nThank you so much for your trust! Let us know if you have any question, we're here.\n\nThe Fanovera team" },
  ],
};

const STATUS_TINT: Record<string, string> = {
  delivered: "#16a34a",
  processing: "#ca8a04",
  paid: "#2563eb",
  partial: "#ea580c",
  failed: "#dc2626",
  canceled: "#dc2626",
  refunded: "#6b7280",
  account_unavailable: "#ea580c",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtEurCents(cents: number): string {
  return ((Number(cents) || 0) / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function SupportView() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftContext, setDraftContext] = useState("");
  // #10: lazy-loaded orders per thread email. "loading" while in flight.
  const [customerOrders, setCustomerOrders] = useState<Record<number, OrderLite[] | "loading">>({});
  const [tplLang, setTplLang] = useState<TplLang>("fr");

  const loadCustomerOrders = async (threadId: number, email: string) => {
    // Toggle off if already shown.
    if (customerOrders[threadId] && customerOrders[threadId] !== "loading") {
      setCustomerOrders((prev) => {
        const next = { ...prev };
        delete next[threadId];
        return next;
      });
      return;
    }
    setCustomerOrders((prev) => ({ ...prev, [threadId]: "loading" }));
    try {
      // refresh=0 opts out of the heavy per-order BulkFollows auto-refresh.
      const res = await fetch(
        `/api/admin/orders?search=${encodeURIComponent(email)}&refresh=0&limit=20`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("admin_pw") || ""}` } },
      );
      const data = await res.json().catch(() => ({}));
      const orders: OrderLite[] = Array.isArray(data?.orders) ? data.orders : [];
      setCustomerOrders((prev) => ({ ...prev, [threadId]: orders }));
    } catch {
      setCustomerOrders((prev) => ({ ...prev, [threadId]: [] }));
    }
  };

  const fetchThreads = async () => {
    try {
      const res = await fetch("/api/admin/support", {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_pw") || ""}` },
      });
      if (res.ok) setThreads(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchThreads(); }, []);

  const handleDraft = async (id: number) => {
    setDrafting(true);
    setDraftError(null);
    try {
      const res = await fetch("/api/admin/support/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_pw") || ""}`,
        },
        body: JSON.stringify({
          id,
          additionalContext: draftContext.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.draft) {
        setReplyText(data.draft);
      } else {
        setDraftError(data.error || "Échec du brouillon IA");
      }
    } catch {
      setDraftError("Échec du brouillon IA");
    }
    setDrafting(false);
  };

  const handleToggleResolved = async (id: number, resolved: boolean) => {
    setResolvingId(id);
    try {
      await fetch("/api/admin/support", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_pw") || ""}`,
        },
        body: JSON.stringify({ id, resolved }),
      });
      await fetchThreads();
    } catch { /* ignore */ }
    setResolvingId(null);
  };

  const handleReply = async (id: number) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_pw") || ""}`,
        },
        body: JSON.stringify({ id, replyText }),
      });
      if (res.ok) {
        setReplyId(null);
        setReplyText("");
        setDraftContext("");
        fetchThreads();
      }
    } catch { /* ignore */ }
    setSending(false);
  };

  if (loading) return <div style={{ padding: 32, color: "var(--a-ink-3)" }}>Chargement…</div>;

  return (
    <div>
      <div style={{ marginBottom: 20, fontSize: 14, color: "var(--a-ink-3)" }}>
        {threads.length} conversation{threads.length !== 1 ? "s" : ""} de support
      </div>

      {threads.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>
          Aucun message pour le moment.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {threads.map((thread) => {
          // Build chronological timeline from initial message + replies.
          // Fall back to legacy reply_text (pre-thread schema) if no admin reply rows exist.
          const replies = thread.replies || [];
          const hasAdminReplyRow = replies.some((r) => r.sender_type === "admin");
          const legacyAdminEntry: Reply[] = !hasAdminReplyRow && thread.reply_text
            ? [{
                id: -1,
                email: "",
                message: thread.reply_text,
                created_at: thread.created_at,
                sender_type: "admin",
              }]
            : [];

          const timeline: Reply[] = [
            { id: thread.id, email: thread.email, message: thread.message, created_at: thread.created_at, sender_type: "client" as const },
            ...legacyAdminEntry,
            ...replies.map((r) => ({ ...r, sender_type: (r.sender_type === "admin" ? "admin" : "client") as "admin" | "client" })),
          ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

          const lastEntry = timeline[timeline.length - 1];
          const awaitingAdmin = lastEntry.sender_type === "client" && !thread.replied;

          return (
            <div
              key={thread.id}
              style={{
                background: "var(--a-card)",
                border: "1px solid var(--a-line)",
                borderRadius: 14,
                padding: 18,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{thread.email}</div>
                  <div style={{ fontSize: 11, color: "var(--a-ink-3)", marginTop: 2 }}>
                    {timeline.length} message{timeline.length !== 1 ? "s" : ""} · début {formatDate(thread.created_at)}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: awaitingAdmin ? "rgba(234,179,8,0.12)" : "rgba(34,197,94,0.12)",
                    color: awaitingAdmin ? "#ca8a04" : "#16a34a",
                  }}
                >
                  {awaitingAdmin ? "En attente" : "Répondu"}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {timeline.map((entry, idx) => {
                  const isAdmin = entry.sender_type === "admin";
                  return (
                    <div
                      key={`${entry.id}-${idx}`}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: isAdmin ? "rgba(82,96,230,0.06)" : "var(--a-bg)",
                        borderLeft: `3px solid ${isAdmin ? "var(--a-accent)" : "rgba(234,179,8,0.5)"}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ fontSize: 11, color: "var(--a-ink-3)", fontWeight: 600 }}>
                          {isAdmin ? "Vous" : "Client"}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--a-ink-3)" }}>
                          {formatDate(entry.created_at)}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--a-ink)", whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
                        {entry.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {customerOrders[thread.id] ? (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "var(--a-bg)", border: "1px solid var(--a-line)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--a-ink-3)", marginBottom: 8 }}>
                    Commandes de ce client
                  </div>
                  {customerOrders[thread.id] === "loading" ? (
                    <div style={{ fontSize: 12, color: "var(--a-ink-3)" }}>Chargement…</div>
                  ) : (customerOrders[thread.id] as OrderLite[]).length === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--a-ink-3)" }}>Aucune commande pour cet email.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {(customerOrders[thread.id] as OrderLite[]).map((o) => (
                        <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 12 }}>
                          <span style={{ fontWeight: 700, minWidth: 44 }}>#{o.id}</span>
                          <span style={{ color: "var(--a-ink-3)", flex: 1, textTransform: "capitalize" }}>{o.platform}</span>
                          <span style={{ fontWeight: 700, color: STATUS_TINT[o.status] || "var(--a-ink-3)" }}>{o.status}</span>
                          <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 64, textAlign: "right" }}>{fmtEurCents(o.total_cents_eur)}</span>
                          <span style={{ color: "var(--a-ink-3)", minWidth: 92, textAlign: "right" }}>{formatDate(o.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {replyId === thread.id ? (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--a-ink-3)", fontWeight: 600 }}>Réponses types :</span>
                    {REPLY_TEMPLATES[tplLang].map((t) => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => setReplyText(t.text)}
                        style={{ padding: "4px 10px", borderRadius: 7, background: "var(--a-card)", border: "1px solid var(--a-line)", color: "var(--a-ink)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                      >
                        {t.label}
                      </button>
                    ))}
                    <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                      {(["fr", "en"] as TplLang[]).map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setTplLang(l)}
                          style={{ padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", border: "1px solid var(--a-line)", background: tplLang === l ? "var(--a-accent)" : "var(--a-card)", color: tplLang === l ? "#fff" : "var(--a-ink-3)" }}
                        >
                          {l.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Votre réponse…"
                    rows={4}
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid var(--a-line)",
                      fontSize: 13,
                      resize: "vertical",
                      fontFamily: "inherit",
                      background: "var(--a-bg)",
                      color: "var(--a-ink)",
                      boxSizing: "border-box",
                    }}
                  />
                  {replyText.trim() && (
                    <div style={{ marginTop: 8 }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--a-ink-3)", marginBottom: 4 }}>
                        Consigne pour la régénération (optionnel)
                      </label>
                      <textarea
                        value={draftContext}
                        onChange={(e) => setDraftContext(e.target.value)}
                        placeholder="Ex: plus court, ton apaisant, mentionne un refund de 5€…"
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px dashed var(--a-line)",
                          fontSize: 12,
                          resize: "vertical",
                          fontFamily: "inherit",
                          background: "var(--a-bg)",
                          color: "var(--a-ink)",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleReply(thread.id)}
                      disabled={sending || !replyText.trim()}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        background: "var(--a-accent)",
                        color: "white",
                        fontWeight: 700,
                        fontSize: 12,
                        border: "none",
                        cursor: sending ? "not-allowed" : "pointer",
                        opacity: sending ? 0.7 : 1,
                      }}
                    >
                      {sending ? "Envoi…" : "Envoyer par email"}
                    </button>
                    <button
                      onClick={() => handleDraft(thread.id)}
                      disabled={drafting || sending}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        background: "var(--a-card)",
                        border: "1px solid var(--a-accent)",
                        color: "var(--a-accent)",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: drafting ? "not-allowed" : "pointer",
                        opacity: drafting ? 0.7 : 1,
                      }}
                    >
                      {drafting ? "Génération…" : replyText.trim() ? "Régénérer IA" : "Brouillon IA"}
                    </button>
                    <button
                      onClick={() => { setReplyId(null); setReplyText(""); setDraftError(null); setDraftContext(""); }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        background: "var(--a-card)",
                        border: "1px solid var(--a-line)",
                        color: "var(--a-ink-3)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                  {draftError && (
                    <div style={{ marginTop: 6, fontSize: 11, color: "#dc2626" }}>{draftError}</div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => { setReplyId(thread.id); setReplyText(""); setDraftError(null); setDraftContext(""); }}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      background: awaitingAdmin ? "#000" : "var(--a-card)",
                      color: awaitingAdmin ? "white" : "var(--a-ink)",
                      border: awaitingAdmin ? "none" : "1px solid var(--a-line)",
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {awaitingAdmin ? "Répondre" : "Relancer"}
                  </button>
                  <button
                    onClick={() => handleToggleResolved(thread.id, awaitingAdmin)}
                    disabled={resolvingId === thread.id}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      background: "var(--a-card)",
                      color: "var(--a-ink-3)",
                      border: "1px solid var(--a-line)",
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: resolvingId === thread.id ? "not-allowed" : "pointer",
                      opacity: resolvingId === thread.id ? 0.6 : 1,
                    }}
                  >
                    {resolvingId === thread.id
                      ? "…"
                      : awaitingAdmin
                        ? "Marquer comme traité"
                        : "Rouvrir"}
                  </button>
                  <button
                    onClick={() => loadCustomerOrders(thread.id, thread.email)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      background: "var(--a-card)",
                      color: "var(--a-ink-3)",
                      border: "1px solid var(--a-line)",
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {customerOrders[thread.id] ? "Masquer ses commandes" : "Commandes du client"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
