"use client";

import { useEffect, useRef, useState } from "react";

export type AdminModalConfig = {
  title: string;
  /** Body text (supports line breaks via \n). */
  message?: string;
  /** When set, renders a text input pre-filled with this value. */
  input?: {
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    /** Validate the trimmed value; return an error string to block confirm. */
    validate?: (value: string) => string | null;
  };
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual emphasis for destructive / money actions. */
  danger?: boolean;
  /** Called with the trimmed input value (empty string when no input). */
  onConfirm: (value: string) => void;
};

/**
 * Controlled modal replacing native window.confirm / window.prompt for admin
 * actions — styled, validated, and not blocked when the browser disables
 * popups. Render once per view and drive it via a config-or-null state.
 */
export default function AdminModal({
  config,
  onClose,
}: {
  config: AdminModalConfig | null;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (config) {
      setValue(config.input?.defaultValue ?? "");
      setError(null);
      // Focus the input (or rely on the confirm button) once mounted.
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [config]);

  useEffect(() => {
    if (!config) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [config, onClose]);

  if (!config) return null;

  const submit = () => {
    const trimmed = value.trim();
    if (config.input?.validate) {
      const err = config.input.validate(trimmed);
      if (err) {
        setError(err);
        return;
      }
    }
    config.onConfirm(trimmed);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,15,20,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          padding: 24,
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 17, color: "#111827", marginBottom: 8 }}>
          {config.title}
        </div>
        {config.message ? (
          <div style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.55, whiteSpace: "pre-line", marginBottom: config.input ? 16 : 20 }}>
            {config.message}
          </div>
        ) : null}
        {config.input ? (
          <div style={{ marginBottom: 20 }}>
            {config.input.label ? (
              <label className="label" style={{ display: "block", marginBottom: 6 }}>{config.input.label}</label>
            ) : null}
            <input
              ref={inputRef}
              className="input"
              value={value}
              placeholder={config.input.placeholder}
              onChange={(e) => { setValue(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              style={{ width: "100%" }}
            />
            {error ? <div style={{ color: "#dc2626", fontSize: 12, marginTop: 6 }}>{error}</div> : null}
          </div>
        ) : null}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn" onClick={onClose} style={{ fontWeight: 700 }}>
            {config.cancelLabel || "Annuler"}
          </button>
          <button
            type="button"
            className={"btn " + (config.danger ? "" : "primary")}
            onClick={submit}
            style={config.danger ? { fontWeight: 700, background: "#dc2626", color: "#fff", border: "1px solid #dc2626" } : { fontWeight: 700 }}
          >
            {config.confirmLabel || "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}
