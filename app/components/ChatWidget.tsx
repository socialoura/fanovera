"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "../i18n/I18nProvider";
import { getPublicCopy } from "./publicCopy";

type Step = "closed" | "email" | "message" | "sent";

export default function ChatWidget() {
  const pathname = usePathname();
  const { locale } = useI18n();
  const copy = getPublicCopy(locale).chat;
  const [step, setStep] = useState<Step>("closed");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  if (pathname?.startsWith("/admin")) return null;

  const handleEmailSubmit = () => {
    if (!emailValid) {
      setError(copy.invalidEmail);
      return;
    }
    setError("");
    setStep("message");
  };

  const handleSend = async () => {
    if (!message.trim() || message.trim().length < 3) {
      setError(copy.shortMessage);
      return;
    }
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/chat-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), message: message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || copy.retry);
      } else {
        setStep("sent");
      }
    } catch {
      setError(copy.networkRetry);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setStep("closed");
    setMessage("");
    setError("");
  };

  if (step === "closed") {
    return (
      <button
        onClick={() => setStep("email")}
        aria-label={copy.open}
        className="chat-fab"
      >
        <span className="chat-fab-text">{copy.question}</span>
        <span className="chat-fab-dot" />
      </button>
    );
  }

  return (
    <div className="chat-widget">
      {/* Header */}
      <div className="chat-widget-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/fanovera-logo.png" alt="Fanovera" style={{ height: 22 }} />
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
            {step === "sent" ? copy.sentHeader : copy.online}
          </div>
        </div>
        <button onClick={reset} className="chat-widget-close">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 3l8 8M11 3l-8 8" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="chat-widget-body">
        {step === "email" && (
          <>
            <div className="chat-widget-bubble">
              {copy.greeting}
            </div>
            <label className="chat-widget-label">{copy.emailLabel}</label>
            <input
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
              autoFocus
              className="chat-widget-input"
            />
            {error && <div className="chat-widget-error">{error}</div>}
            <button onClick={handleEmailSubmit} className="chat-widget-btn">
              {copy.continue}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7h8M7 3l4 4-4 4" />
              </svg>
            </button>
          </>
        )}

        {step === "message" && (
          <>
            <div className="chat-widget-email-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4h16v16H4zM22 6l-10 7L2 6" />
              </svg>
              {email}
            </div>
            <label className="chat-widget-label">{copy.messageLabel}</label>
            <textarea
              placeholder={copy.messagePlaceholder}
              value={message}
              onChange={(e) => { setMessage(e.target.value); setError(""); }}
              autoFocus
              rows={4}
              className="chat-widget-textarea"
            />
            {error && <div className="chat-widget-error">{error}</div>}
            <button
              onClick={handleSend}
              disabled={sending}
              className="chat-widget-btn"
              style={{ opacity: sending ? 0.7 : 1 }}
            >
              {sending ? copy.sending : copy.send}
              {!sending && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
                </svg>
              )}
            </button>
          </>
        )}

        {step === "sent" && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div className="chat-widget-success-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 14 }}>
              {copy.thanks}
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "8px 0 0", lineHeight: 1.5 }}>
              {copy.reply(email)}
            </p>
            <button onClick={reset} className="chat-widget-btn-soft" style={{ marginTop: 18 }}>
              {copy.close}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="chat-widget-footer">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        {copy.privacy}
      </div>
    </div>
  );
}
