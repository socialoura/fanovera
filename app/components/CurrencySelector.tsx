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
import { useI18n } from "../i18n/I18nProvider";

const CURRENCY_COPY = {
  fr: { label: "Devise", aria: "Choisir la devise", auto: "Auto", manual: "Manuel", titleAuto: "Detection auto", titleManual: "Devise manuelle", menu: "Devise", hint: "Selon votre position", active: "Actif" },
  en: { label: "Currency", aria: "Choose currency", auto: "Auto", manual: "Manual", titleAuto: "Auto detection", titleManual: "Manual currency", menu: "Currency", hint: "Based on your location", active: "Active" },
  es: { label: "Divisa", aria: "Elegir divisa", auto: "Auto", manual: "Manual", titleAuto: "Deteccion automatica", titleManual: "Divisa manual", menu: "Divisa", hint: "Segun tu ubicacion", active: "Activo" },
  pt: { label: "Moeda", aria: "Escolher moeda", auto: "Auto", manual: "Manual", titleAuto: "Deteccao automatica", titleManual: "Moeda manual", menu: "Moeda", hint: "Com base na sua localizacao", active: "Ativo" },
  de: { label: "Wahrung", aria: "Wahrung wahlen", auto: "Auto", manual: "Manuell", titleAuto: "Automatische Erkennung", titleManual: "Manuelle Wahrung", menu: "Wahrung", hint: "Nach deinem Standort", active: "Aktiv" },
  it: { label: "Valuta", aria: "Scegli valuta", auto: "Auto", manual: "Manuale", titleAuto: "Rilevamento automatico", titleManual: "Valuta manuale", menu: "Valuta", hint: "In base alla tua posizione", active: "Attiva" },
  tr: { label: "Para", aria: "Para birimi sec", auto: "Auto", manual: "Manuel", titleAuto: "Otomatik algilama", titleManual: "Manuel para birimi", menu: "Para", hint: "Konumunuza gore", active: "Aktif" },
} as const;

export default function CurrencySelector({ compact = false }: { compact?: boolean }) {
  const { currency, mode, country } = useCurrencyPreference();
  const { locale } = useI18n();
  const t = CURRENCY_COPY[locale] || CURRENCY_COPY.fr;
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
        aria-label={t.aria}
        title={mode === "auto" && country ? `${t.titleAuto}: ${country}` : t.titleManual}
      >
        <span className="currency-select-label">{t.label}</span>
        <span className="currency-trigger-value" aria-hidden="true">
          <span>{currency}</span>
          <span>{mode === "auto" ? t.auto : t.manual}</span>
        </span>
        <span className="currency-chevron" aria-hidden />
      </button>

      {open && (
        <div className="currency-menu" role="listbox" aria-label={t.menu}>
          <div className="currency-menu-title">
            <span>{t.menu}</span>
            <span>{mode === "auto" ? t.auto : t.manual}</span>
          </div>
          <button
            type="button"
            className={"currency-option" + (value === "auto" ? " active" : "")}
            onClick={() => handleChange("auto")}
            role="option"
            aria-selected={value === "auto"}
          >
            <span className="currency-code">{t.auto}</span>
            <span className="currency-name">{t.hint}</span>
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
              <span className="currency-meta">{value === code ? t.active : ""}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
