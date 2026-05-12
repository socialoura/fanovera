"use client";

import { useEffect, useRef, useState } from "react";
import {
  CURRENCY_LABELS,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "../lib/pricingCurrency";
import {
  setAutoCurrency,
  setManualCurrency,
  useCurrencyPreference,
} from "../lib/useCurrencyPricing";

export default function CurrencySelector({ compact = false }: { compact?: boolean }) {
  const { currency, mode, country } = useCurrencyPreference();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const value = mode === "manual" ? currency : "auto";

  const handleChange = (next: string) => {
    if (next === "auto") {
      setAutoCurrency();
      setOpen(false);
      return;
    }
    setManualCurrency(next);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={"currency-select" + (compact ? " compact" : "")}>
      <button
        type="button"
        className="currency-trigger"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((next) => !next);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          setOpen((next) => !next);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Choisir la devise"
        title={mode === "auto" && country ? `Detection auto: ${country}` : "Devise manuelle"}
      >
        <span className="currency-select-label">Devise</span>
        <span className="currency-trigger-value" aria-hidden="true">
          <span>{currency}</span>
          <span>{mode === "auto" ? "Auto" : "Manuel"}</span>
        </span>
        <span className="currency-chevron" aria-hidden />
      </button>

      {open && (
        <div className="currency-menu" role="listbox" aria-label="Devise">
          <div className="currency-menu-title">
            <span>Devise</span>
            <span>{mode === "auto" ? "Auto" : "Manuel"}</span>
          </div>
          <button
            type="button"
            className={"currency-option" + (value === "auto" ? " active" : "")}
            onClick={() => handleChange("auto")}
            role="option"
            aria-selected={value === "auto"}
          >
            <span className="currency-code">Auto</span>
            <span className="currency-name">Selon votre position</span>
            <span className="currency-meta">{currency}</span>
          </button>
          {SUPPORTED_CURRENCIES.map((code: SupportedCurrency) => (
            <button
              type="button"
              key={code}
              className={"currency-option" + (value === code ? " active" : "")}
              onClick={() => handleChange(code)}
              role="option"
              aria-selected={value === code}
            >
              <span className="currency-code">{code}</span>
              <span className="currency-name">{CURRENCY_LABELS[code]}</span>
              <span className="currency-meta">{value === code ? "Actif" : ""}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
