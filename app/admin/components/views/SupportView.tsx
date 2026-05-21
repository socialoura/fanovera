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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SupportView() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

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
        body: JSON.stringify({ id }),
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
          const awaitingAdmin = lastEntry.sender_type === "client";

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

              {replyId === thread.id ? (
                <div style={{ marginTop: 14 }}>
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
                      onClick={() => { setReplyId(null); setReplyText(""); setDraftError(null); }}
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
                <button
                  onClick={() => { setReplyId(thread.id); setReplyText(""); setDraftError(null); }}
                  style={{
                    marginTop: 14,
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
