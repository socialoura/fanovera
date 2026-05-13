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

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

function getStoredLocale() {
  if (typeof window === "undefined") {
    return { mode: "auto" as LocaleMode, locale: null as SupportedLocale | null };
  }

  const storedMode = localStorage.getItem(LOCALE_MODE_KEY) || getCookie(LOCALE_MODE_KEY);
  const storedLocale = localStorage.getItem(LOCALE_KEY) || getCookie(LOCALE_KEY);
  const mode = storedMode === "manual" ? "manual" : "auto";
  const locale = normalizeLocale(storedLocale);
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

export function useLocalePreference(initialLocale: SupportedLocale = "fr") {
  const [state, setState] = useState<LocaleState>({
    locale: initialLocale,
    mode: "auto",
    country: null,
    source: initialLocale === "fr" ? "fallback" : "route",
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
