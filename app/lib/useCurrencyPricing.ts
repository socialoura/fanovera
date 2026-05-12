"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SUPPORTED_CURRENCIES,
  setDisplayCurrency,
  type SupportedCurrency,
} from "./pricingCurrency";

type PricingPack = { qty: number; price: number; popular?: boolean };
type CurrencyMode = "auto" | "manual";

type PackLike = {
  qty: number;
  price: number;
  old: number;
  bonus: number;
  popular?: boolean;
  best?: boolean;
};

function roundPrice(value: number) {
  return Math.round(value * 100) / 100;
}

function derivedBonus(qty: number, fallbackPacks: readonly PackLike[]) {
  const nearest = fallbackPacks.reduce<PackLike | null>((best, pack) => {
    if (!best) return pack;
    return Math.abs(pack.qty - qty) < Math.abs(best.qty - qty) ? pack : best;
  }, null);

  if (nearest && nearest.qty > 0) {
    return Math.max(0, Math.round(qty * (nearest.bonus / nearest.qty)));
  }

  return Math.max(0, Math.round(qty * 0.2));
}

const CURRENCY_EVENT = "fanovera:currency-change";
const MODE_KEY = "fanovera_currency_mode";
const CURRENCY_KEY = "fanovera_currency";

function isSupportedCurrency(value: string): value is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(value.toUpperCase() as SupportedCurrency);
}

function getStoredPreference(): { mode: CurrencyMode; currency: SupportedCurrency | null } {
  if (typeof window === "undefined") return { mode: "auto", currency: null };

  const mode = localStorage.getItem(MODE_KEY) === "manual" ? "manual" : "auto";
  const rawCurrency = (localStorage.getItem(CURRENCY_KEY) || "").toUpperCase();
  const currency = isSupportedCurrency(rawCurrency) ? rawCurrency : null;

  return {
    mode: currency && mode === "manual" ? "manual" : "auto",
    currency,
  };
}

function setCookie(name: string, value: string, maxAge = 60 * 60 * 24 * 30) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

function emitCurrencyChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CURRENCY_EVENT));
}

export function setManualCurrency(currency: string) {
  if (typeof window === "undefined") return;
  const upper = currency.toUpperCase();
  if (!isSupportedCurrency(upper)) return;

  localStorage.setItem(MODE_KEY, "manual");
  localStorage.setItem(CURRENCY_KEY, upper);
  setCookie("currency_mode", "manual");
  setCookie("currency", upper);
  emitCurrencyChange();
}

export function setAutoCurrency() {
  if (typeof window === "undefined") return;
  localStorage.setItem(MODE_KEY, "auto");
  localStorage.removeItem(CURRENCY_KEY);
  setCookie("currency_mode", "auto");
  setCookie("currency", "", 0);
  emitCurrencyChange();
}

export function useCurrencyPreference() {
  const [currency, setCurrency] = useState<SupportedCurrency>("EUR");
  const [locale, setLocale] = useState("fr-FR");
  const [mode, setMode] = useState<CurrencyMode>("auto");
  const [country, setCountry] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const pref = getStoredPreference();
    const url = pref.mode === "manual" && pref.currency
      ? `/api/geo-currency?currency=${encodeURIComponent(pref.currency)}`
      : "/api/geo-currency?mode=auto";

    try {
      const geoRes = await fetch(url);
      const geo = await geoRes.json().catch(() => ({}));

      const nextCurrency = typeof geo?.currency === "string" && isSupportedCurrency(geo.currency)
        ? geo.currency.toUpperCase() as SupportedCurrency
        : "EUR";
      const nextLocale = typeof geo?.locale === "string" ? geo.locale : "fr-FR";
      const nextMode = geo?.mode === "manual" ? "manual" : pref.mode;

      setCurrency(nextCurrency);
      setLocale(nextLocale);
      setMode(nextMode);
      setCountry(typeof geo?.country === "string" ? geo.country : null);
      setDisplayCurrency(nextCurrency, nextLocale);
    } catch {
      setCurrency(pref.currency || "EUR");
      setLocale("fr-FR");
      setMode(pref.mode);
    }
  }, []);

  useEffect(() => {
    refresh();

    const handleChange = () => refresh();
    window.addEventListener(CURRENCY_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(CURRENCY_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, [refresh]);

  return {
    currency,
    locale,
    mode,
    country,
    setManualCurrency,
    setAutoCurrency,
  };
}

export function useCurrencyPricing(service: string) {
  const { currency, locale, mode, country } = useCurrencyPreference();
  const [priceByQty, setPriceByQty] = useState<Record<number, number>>({});
  const [dbPacks, setDbPacks] = useState<PricingPack[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const pricingRes = await fetch(
          `/api/pricing?service=${encodeURIComponent(service)}&currency=${encodeURIComponent(currency)}`,
        );
        const pricing = await pricingRes.json().catch(() => ({}));
        if (cancelled) return;

        const map: Record<number, number> = {};
        const packs: PricingPack[] = Array.isArray(pricing?.packs) ? pricing.packs : [];
        const cleanPacks: PricingPack[] = [];
        for (const p of packs) {
          const qty = Number(p.qty);
          const price = Number(p.price);
          if (Number.isFinite(qty) && Number.isFinite(price) && qty > 0 && price >= 0) {
            map[qty] = price;
            cleanPacks.push({ qty, price, popular: Boolean(p.popular) });
          }
        }
        setPriceByQty(map);
        setDbPacks(cleanPacks);
      } catch {
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [currency, service]);

  const formatter = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [currency, locale]);

  const resolvePrice = useCallback((qty: number, fallback: number) => {
    const fromDb = priceByQty[qty];
    if (typeof fromDb === "number" && Number.isFinite(fromDb) && fromDb >= 0) {
      return fromDb;
    }
    return fallback;
  }, [priceByQty]);

  const resolvePacks = useCallback(<T extends PackLike>(fallbackPacks: readonly T[]): T[] => {
    if (dbPacks.length === 0) {
      return fallbackPacks.map((pack) => ({
        ...pack,
        price: resolvePrice(pack.qty, pack.price),
      }));
    }

    const fallbackByQty = new Map(fallbackPacks.map((pack) => [pack.qty, pack]));

    return dbPacks.map((dbPack, index) => {
      const fallback = fallbackByQty.get(dbPack.qty) ?? fallbackPacks[index] ?? fallbackPacks[0];
      const old = fallback
        ? Math.max(fallback.old, roundPrice(dbPack.price * 1.35))
        : roundPrice(dbPack.price * 2.5);

      return {
        ...(fallback ?? {}),
        qty: dbPack.qty,
        price: dbPack.price,
        old,
        bonus: fallback?.bonus ?? derivedBonus(dbPack.qty, fallbackPacks),
        popular: dbPack.popular || fallback?.popular || false,
        best: fallback?.best || false,
      } as T;
    });
  }, [dbPacks, resolvePrice]);

  return { currency, locale, mode, country, formatter, resolvePrice, resolvePacks, dbPacks };
}

export function useApplyCurrencyPricing<T extends PackLike>(
  service: string,
  targetPacks: T[],
  fallbackPacks: readonly T[],
) {
  const [version, setVersion] = useState(0);
  const pricing = useCurrencyPricing(service);
  const { currency, locale, resolvePacks } = pricing;

  useEffect(() => {
    setDisplayCurrency(currency, locale);
    const resolved = resolvePacks(fallbackPacks);

    targetPacks.splice(0, targetPacks.length, ...resolved);
    setVersion((current) => current + 1);
  }, [currency, fallbackPacks, locale, resolvePacks, targetPacks]);

  return { ...pricing, version };
}
