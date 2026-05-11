"use client";

import { useEffect, useState } from "react";

type Message = {
  id: number;
  email: string;
  message: string;
  created_at: string;
  replied: boolean;
  reply_text?: string;
};

export default function SupportView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/admin/support", {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_pw") || ""}` },
      });
      if (res.ok) setMessages(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

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
        fetchMessages();
      }
    } catch { /* ignore */ }
    setSending(false);
  };

  if (loading) return <div style={{ padding: 32, color: "var(--a-ink-3)" }}>Chargement…</div>;

  return (
    <div>
      <div style={{ marginBottom: 20, fontSize: 14, color: "var(--a-ink-3)" }}>
        {messages.length} message{messages.length !== 1 ? "s" : ""} de support
      </div>

      {messages.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>
          Aucun message pour le moment.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              background: "var(--a-card)",
              border: "1px solid var(--a-line)",
              borderRadius: 14,
              padding: 18,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{msg.email}</div>
                <div style={{ fontSize: 11, color: "var(--a-ink-3)", marginTop: 2 }}>
                  {new Date(msg.created_at).toLocaleString("fr-FR")}
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: msg.replied ? "rgba(34,197,94,0.12)" : "rgba(234,179,8,0.12)",
                  color: msg.replied ? "#16a34a" : "#ca8a04",
                }}
              >
                {msg.replied ? "Répondu" : "En attente"}
              </span>
            </div>

            <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--a-ink)", whiteSpace: "pre-wrap" }}>
              {msg.message}
            </div>

            {msg.replied && msg.reply_text && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(82,96,230,0.06)", borderRadius: 10, borderLeft: "3px solid var(--a-accent)" }}>
                <div style={{ fontSize: 11, color: "var(--a-ink-3)", marginBottom: 4, fontWeight: 600 }}>Votre réponse :</div>
                <div style={{ fontSize: 13, color: "var(--a-ink)", whiteSpace: "pre-wrap" }}>{msg.reply_text}</div>
              </div>
            )}

            {!msg.replied && (
              <>
                {replyId === msg.id ? (
                  <div style={{ marginTop: 12 }}>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Votre réponse…"
                      rows={3}
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
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => handleReply(msg.id)}
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
                        onClick={() => { setReplyId(null); setReplyText(""); }}
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
                  </div>
                ) : (
                  <button
                    onClick={() => { setReplyId(msg.id); setReplyText(""); }}
                    style={{
                      marginTop: 12,
                      padding: "7px 14px",
                      borderRadius: 8,
                      background: "var(--a-accent)",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 12,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Répondre
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
