"use client";

import { useEffect, useRef, useState } from "react";
import { getDictionary } from "../i18n/dictionaries";
import { SUPPORTED_LOCALES, type LocaleOption, type SupportedLocale } from "../i18n/types";
import { setAutoLocale, setManualLocale, useLocalePreference } from "../i18n/useLocale";
import { trackEvent } from "../lib/analytics";

const OPTIONS: Record<SupportedLocale, LocaleOption> = {
  fr: { code: "fr", name: "Français", short: "FR" },
  en: { code: "en", name: "English", short: "EN" },
  es: { code: "es", name: "Español", short: "ES" },
  pt: { code: "pt", name: "Português", short: "PT" },
  de: { code: "de", name: "Deutsch", short: "DE" },
  it: { code: "it", name: "Italiano", short: "IT" },
  tr: { code: "tr", name: "Türkçe", short: "TR" },
};

export default function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, mode, country } = useLocalePreference();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dict = getDictionary(locale);
  const value = mode === "manual" ? locale : "auto";
  const current = OPTIONS[locale];

  const handleChange = (next: string) => {
    if (next === "auto") {
      setAutoLocale();
      trackEvent("locale_changed", { locale, next_locale: "auto", mode: "auto" });
      setOpen(false);
      return;
    }
    setManualLocale(next);
    trackEvent("locale_changed", { locale, next_locale: next, mode: "manual" });
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
    <div
      ref={rootRef}
      className={"currency-select language-select" + (compact ? " compact" : "")}
      data-i18n-skip
    >
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
        aria-label={dict.selector.aria}
        title={mode === "auto" && country ? `${dict.selector.titleAuto}: ${country}` : dict.selector.titleManual}
      >
        <span className="currency-select-label">{dict.selector.label}</span>
        <span className="currency-trigger-value" aria-hidden="true">
          <span>{current.short}</span>
          <span>{mode === "auto" ? dict.selector.autoMeta : dict.selector.manualMeta}</span>
        </span>
        <span className="currency-chevron" aria-hidden />
      </button>

      {open && (
        <div className="currency-menu language-menu" role="listbox" aria-label={dict.selector.menuTitle}>
          <div className="currency-menu-title">
            <span>{dict.selector.menuTitle}</span>
            <span>{mode === "auto" ? dict.selector.autoMeta : dict.selector.manualMeta}</span>
          </div>
          <button
            type="button"
            className={"currency-option" + (value === "auto" ? " active" : "")}
            onClick={() => handleChange("auto")}
            role="option"
            aria-selected={value === "auto"}
          >
            <span className="currency-code">{dict.selector.auto}</span>
            <span className="currency-name">{dict.selector.autoHint}</span>
            <span className="currency-meta">{current.short}</span>
          </button>
          {SUPPORTED_LOCALES.map((code) => (
            <button
              type="button"
              key={code}
              className={"currency-option" + (value === code ? " active" : "")}
              onClick={() => handleChange(code)}
              role="option"
              aria-selected={value === code}
            >
              <span className="currency-code">{OPTIONS[code].short}</span>
              <span className="currency-name">{OPTIONS[code].name}</span>
              <span className="currency-meta">{value === code ? dict.selector.active : ""}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
