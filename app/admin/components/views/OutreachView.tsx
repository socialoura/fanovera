"use client";

import { useEffect, useMemo, useState } from "react";

type Reply = {
  id: number;
  recipient_id: number;
  from_email: string | null;
  message: string;
  created_at: string;
};

type Recipient = {
  id: number;
  campaign_id: number;
  email: string;
  status: "pending" | "sent" | "error";
  send_error: string | null;
  sent_at: string | null;
  created_at: string;
  replies?: Reply[];
};

type Campaign = {
  id: number;
  subject: string;
  body: string;
  created_at: string;
  recipients?: Recipient[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_TINT: Record<string, { bg: string; fg: string; label: string }> = {
  sent: { bg: "rgba(34,197,94,0.12)", fg: "#16a34a", label: "Envoyé" },
  pending: { bg: "rgba(234,179,8,0.12)", fg: "#ca8a04", label: "En attente" },
  error: { bg: "rgba(220,38,38,0.12)", fg: "#dc2626", label: "Échec" },
};

export default function OutreachView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [emails, setEmails] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const token = () => localStorage.getItem("admin_pw") || "";

  const validEmailCount = useMemo(() => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const seen = new Set<string>();
    for (const raw of emails.split(/[\n,;]+/)) {
      const e = raw.trim().toLowerCase();
      if (e && re.test(e)) seen.add(e);
    }
    return seen.size;
  }, [emails]);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/admin/outreach", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setCampaigns(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
    // Poll so replies surface without a manual refresh.
    const id = window.setInterval(fetchCampaigns, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || validEmailCount === 0) return;
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/outreach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ subject, emails, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNotice(`${data.sent}/${data.total} envoyé(s)${data.failed ? ` · ${data.failed} échec(s)` : ""}.`);
        setSubject("");
        setEmails("");
        setBody("");
        setShowForm(false);
        fetchCampaigns();
      } else {
        setError(data.error || "Échec de l'envoi");
      }
    } catch {
      setError("Échec de l'envoi");
    }
    setSending(false);
  };

  const handleRetry = async (recipientId: number) => {
    setRetryingId(recipientId);
    try {
      const res = await fetch("/api/admin/outreach", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ recipientId }),
      });
      await fetchCampaigns();
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Renvoi échoué");
      }
    } catch {
      setError("Renvoi échoué");
    }
    setRetryingId(null);
  };

  if (loading) return <div style={{ padding: 32, color: "var(--a-ink-3)" }}>Chargement…</div>;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--a-line)",
    fontSize: 13,
    fontFamily: "inherit",
    background: "var(--a-bg)",
    color: "var(--a-ink)",
    boxSizing: "border-box",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, color: "var(--a-ink-3)" }}>
          {campaigns.length} campagne{campaigns.length !== 1 ? "s" : ""} d&apos;emailing
        </div>
        <button
          onClick={() => { setShowForm((s) => !s); setError(null); setNotice(null); }}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: showForm ? "var(--a-card)" : "#000",
            color: showForm ? "var(--a-ink)" : "#fff",
            border: showForm ? "1px solid var(--a-line)" : "none",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {showForm ? "Annuler" : "Nouvelle campagne"}
        </button>
      </div>

      {notice && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(34,197,94,0.1)", color: "#16a34a", fontSize: 13, fontWeight: 600 }}>
          {notice}
        </div>
      )}

      {showForm && (
        <div style={{ background: "var(--a-card)", border: "1px solid var(--a-line)", borderRadius: 14, padding: 18, marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--a-ink-3)", marginBottom: 6 }}>
            Destinataires (un email par ligne, ou séparés par virgule)
          </label>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder={"contact@exemple.com\nhello@autre.com"}
            rows={4}
            style={{ ...inputStyle, resize: "vertical", marginBottom: 4 }}
          />
          <div style={{ fontSize: 11, color: "var(--a-ink-3)", marginBottom: 14 }}>
            {validEmailCount} adresse{validEmailCount !== 1 ? "s" : ""} valide{validEmailCount !== 1 ? "s" : ""} détectée{validEmailCount !== 1 ? "s" : ""}
          </div>

          <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--a-ink-3)", marginBottom: 6 }}>
            Objet
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Objet de l'email"
            style={{ ...inputStyle, marginBottom: 14 }}
          />

          <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--a-ink-3)", marginBottom: 6 }}>
            Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Bonjour,&#10;&#10;Je gère Fanovera…"
            rows={8}
            style={{ ...inputStyle, resize: "vertical", marginBottom: 14 }}
          />

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim() || validEmailCount === 0}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                background: "var(--a-accent)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                border: "none",
                cursor: sending ? "not-allowed" : "pointer",
                opacity: sending || !subject.trim() || !body.trim() || validEmailCount === 0 ? 0.6 : 1,
              }}
            >
              {sending ? "Envoi…" : `Envoyer à ${validEmailCount} destinataire${validEmailCount !== 1 ? "s" : ""}`}
            </button>
            {error && <span style={{ fontSize: 12, color: "#dc2626" }}>{error}</span>}
          </div>
        </div>
      )}

      {campaigns.length === 0 && !showForm && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--a-ink-3)" }}>
          Aucune campagne pour le moment.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {campaigns.map((c) => {
          const recipients = c.recipients || [];
          const totalReplies = recipients.reduce((n, r) => n + (r.replies?.length || 0), 0);
          const sentCount = recipients.filter((r) => r.status === "sent").length;
          return (
            <div key={c.id} style={{ background: "var(--a-card)", border: "1px solid var(--a-line)", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.subject}</div>
                  <div style={{ fontSize: 11, color: "var(--a-ink-3)", marginTop: 2 }}>
                    {formatDate(c.created_at)} · {sentCount}/{recipients.length} envoyé(s) · {totalReplies} réponse{totalReplies !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: "var(--a-ink-3)", whiteSpace: "pre-wrap", lineHeight: 1.5, background: "var(--a-bg)", borderRadius: 10, padding: "10px 12px", marginBottom: 14, maxHeight: 120, overflow: "auto" }}>
                {c.body}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recipients.map((r) => {
                  const tint = STATUS_TINT[r.status] || STATUS_TINT.pending;
                  const replies = r.replies || [];
                  return (
                    <div key={r.id} style={{ borderTop: "1px solid var(--a-line)", paddingTop: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--a-ink)" }}>{r.email}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {replies.length > 0 && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--a-accent)" }}>
                              {replies.length} réponse{replies.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: tint.bg, color: tint.fg }}>
                            {tint.label}
                          </span>
                        </span>
                      </div>

                      {r.status === "error" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                          {r.send_error && (
                            <span style={{ fontSize: 11, color: "#dc2626", flex: 1, minWidth: 180 }}>{r.send_error}</span>
                          )}
                          <button
                            onClick={() => handleRetry(r.id)}
                            disabled={retryingId === r.id}
                            style={{
                              padding: "4px 12px",
                              borderRadius: 7,
                              background: "#000",
                              color: "#fff",
                              border: "none",
                              fontWeight: 700,
                              fontSize: 11,
                              cursor: retryingId === r.id ? "not-allowed" : "pointer",
                              opacity: retryingId === r.id ? 0.6 : 1,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {retryingId === r.id ? "Renvoi…" : "Renvoyer"}
                          </button>
                        </div>
                      )}

                      {replies.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8, marginLeft: 8 }}>
                          {replies.map((rep) => (
                            <div
                              key={rep.id}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 10,
                                background: "rgba(82,96,230,0.06)",
                                borderLeft: "3px solid var(--a-accent)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--a-ink-3)" }}>
                                  {rep.from_email || r.email}
                                </span>
                                <span style={{ fontSize: 10, color: "var(--a-ink-3)" }}>{formatDate(rep.created_at)}</span>
                              </div>
                              <div style={{ fontSize: 13, color: "var(--a-ink)", whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
                                {rep.message}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
