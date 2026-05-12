"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LOCALE_EVENT,
  LOCALE_KEY,
  LOCALE_MODE_KEY,
  isSupportedLocale,
  normalizeLocale,
} from "./locale";
import type { LocaleMode, SupportedLocale } from "./types";

type LocaleState = {
  locale: SupportedLocale;
  mode: LocaleMode;
  country: string | null;
  source: string;
};

function setCookie(name: string, value: string, maxAge = 60 * 60 * 24 * 180) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

function getStoredLocale() {
  if (typeof window === "undefined") {
    return { mode: "auto" as LocaleMode, locale: null as SupportedLocale | null };
  }

  const mode = localStorage.getItem(LOCALE_MODE_KEY) === "manual" ? "manual" : "auto";
  const locale = normalizeLocale(localStorage.getItem(LOCALE_KEY));
  return {
    mode: mode === "manual" && locale ? "manual" as const : "auto" as const,
    locale,
  };
}

function emitLocaleChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LOCALE_EVENT));
}

export function setManualLocale(locale: string) {
  if (typeof window === "undefined") return;
  const clean = normalizeLocale(locale);
  if (!clean || !isSupportedLocale(clean)) return;

  localStorage.setItem(LOCALE_MODE_KEY, "manual");
  localStorage.setItem(LOCALE_KEY, clean);
  setCookie(LOCALE_MODE_KEY, "manual");
  setCookie(LOCALE_KEY, clean);
  emitLocaleChange();
}

export function setAutoLocale() {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCALE_MODE_KEY, "auto");
  localStorage.removeItem(LOCALE_KEY);
  setCookie(LOCALE_MODE_KEY, "auto");
  setCookie(LOCALE_KEY, "", 0);
  emitLocaleChange();
}

export function useLocalePreference() {
  const [state, setState] = useState<LocaleState>({
    locale: "fr",
    mode: "auto",
    country: null,
    source: "fallback",
  });

  const refresh = useCallback(async () => {
    const pref = getStoredLocale();
    const browser = typeof navigator !== "undefined" ? navigator.language : "";
    const url =
      pref.mode === "manual" && pref.locale
        ? `/api/geo-locale?locale=${encodeURIComponent(pref.locale)}`
        : `/api/geo-locale?mode=auto&browser=${encodeURIComponent(browser)}`;

    try {
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      const locale = normalizeLocale(data?.locale) || "fr";

      setState({
        locale,
        mode: data?.mode === "manual" ? "manual" : pref.mode,
        country: typeof data?.country === "string" ? data.country : null,
        source: typeof data?.source === "string" ? data.source : "fallback",
      });
    } catch {
      setState({
        locale: pref.locale || "fr",
        mode: pref.mode,
        country: null,
        source: "fallback",
      });
    }
  }, []);

  useEffect(() => {
    refresh();

    const handleChange = () => refresh();
    window.addEventListener(LOCALE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(LOCALE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, [refresh]);

  return {
    ...state,
    setManualLocale,
    setAutoLocale,
  };
}
