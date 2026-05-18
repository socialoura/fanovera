"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  SUPPORTED_CURRENCIES,
  buildCurrencyFormatter,
  setDisplayCurrency,
  type SupportedCurrency,
} from "./pricingCurrency";
import { applyPricingAssignment } from "./pricingExperiments";
import { ALL_PRICING_SERVICES, getProductAreaForService } from "./productCatalog";
import { usePricingExperiment } from "./usePricingExperiment";

type PricingPack = { qty: number; price: number; popular?: boolean };
type PricingStatus = "loading" | "ready" | "error";
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
const PRICING_CACHE_MAX_AGE = 5 * 60 * 1000;
const PRICING_CACHE_KEY = "fanovera_pricing_cache_v1";

const pricingMemoryCache = new Map<string, { packs: PricingPack[]; ts: number; promise?: Promise<PricingPack[]> }>();
const pricingBatchPromises = new Map<string, Promise<void>>();

function pricingCacheKey(service: string, currency: string) {
  return `${service}:${currency.toUpperCase()}`;
}

function cleanPricingPacks(value: unknown): PricingPack[] {
  const packs: PricingPack[] = Array.isArray((value as { packs?: unknown })?.packs)
    ? ((value as { packs: PricingPack[] }).packs)
    : [];

  return packs.flatMap((pack) => {
    const qty = Number(pack.qty);
    const price = Number(pack.price);
    if (!Number.isFinite(qty) || !Number.isFinite(price) || qty <= 0 || price < 0) return [];
    return [{ qty, price, popular: Boolean(pack.popular) }];
  });
}

function readPricingStorage(key: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PRICING_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, { packs: PricingPack[]; ts: number }>;
    const entry = parsed[key];
    if (!entry || Date.now() - entry.ts > PRICING_CACHE_MAX_AGE) return null;
    return entry.packs;
  } catch {
    return null;
  }
}

function writePricingStorage(key: string, packs: PricingPack[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(PRICING_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) as Record<string, { packs: PricingPack[]; ts: number }> : {};
    parsed[key] = { packs, ts: Date.now() };
    window.sessionStorage.setItem(PRICING_CACHE_KEY, JSON.stringify(parsed));
  } catch {
  }
}

function storePricingPacks(service: string, currency: string, packs: PricingPack[]) {
  const key = pricingCacheKey(service, currency);
  pricingMemoryCache.set(key, { packs, ts: Date.now() });
  writePricingStorage(key, packs);
}

export function getCachedPricingPacks(service: string, currency: string) {
  const key = pricingCacheKey(service, currency);
  const memory = pricingMemoryCache.get(key);
  if (memory && Date.now() - memory.ts <= PRICING_CACHE_MAX_AGE) return memory.packs;

  const stored = readPricingStorage(key);
  if (stored) {
    pricingMemoryCache.set(key, { packs: stored, ts: Date.now() });
    return stored;
  }

  return null;
}

export async function fetchPricingPacks(service: string, currency: string) {
  const key = pricingCacheKey(service, currency);
  const cached = getCachedPricingPacks(service, currency);
  if (cached) return cached;

  const pending = pricingMemoryCache.get(key)?.promise;
  if (pending) return pending;

  const promise = fetch(`/api/pricing?service=${encodeURIComponent(service)}&currency=${encodeURIComponent(currency)}`)
    .then(async (pricingRes) => {
      if (!pricingRes.ok) throw new Error(`pricing_${pricingRes.status}`);
      const pricing = await pricingRes.json().catch(() => ({}));
      const packs = cleanPricingPacks(pricing);
      if (packs.length === 0) throw new Error("pricing_empty");
      storePricingPacks(service, currency, packs);
      return packs;
    })
    .catch((error) => {
      pricingMemoryCache.delete(key);
      throw error;
    });

  pricingMemoryCache.set(key, { packs: [], ts: Date.now(), promise });
  return promise;
}

export function prefetchProductPricing(currency: string) {
  const upperCurrency = currency.toUpperCase();
  const services = [...ALL_PRICING_SERVICES];
  const missingServices = services.filter((service) => !getCachedPricingPacks(service, upperCurrency));
  if (missingServices.length === 0) return Promise.resolve();

  const pending = pricingBatchPromises.get(upperCurrency);
  if (pending) return pending;

  const promise = fetch(`/api/pricing/all?currency=${encodeURIComponent(upperCurrency)}`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`pricing_all_${res.status}`);
      const payload = await res.json().catch(() => ({}));
      const serviceMap = payload?.services && typeof payload.services === "object"
        ? payload.services as Record<string, unknown>
        : {};

      for (const service of services) {
        const packs = cleanPricingPacks({ packs: serviceMap[service] });
        if (packs.length > 0) storePricingPacks(service, upperCurrency, packs);
      }
    })
    .catch(async () => {
      await Promise.allSettled(missingServices.map((service) => fetchPricingPacks(service, upperCurrency)));
    })
    .finally(() => {
      pricingBatchPromises.delete(upperCurrency);
    });

  pricingBatchPromises.set(upperCurrency, promise);
  return promise;
}

export function usePrefetchProductPricing() {
  const { currency } = useCurrencyPreference();

  useEffect(() => {
    void prefetchProductPricing(currency);
  }, [currency]);
}

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
  const [pricingStatus, setPricingStatus] = useState<PricingStatus>(() =>
    getCachedPricingPacks(service, "EUR") ? "ready" : "loading",
  );
  const [priceByQty, setPriceByQty] = useState<Record<number, number>>(() => {
    const cached = getCachedPricingPacks(service, "EUR") || [];
    return Object.fromEntries(cached.map((pack) => [pack.qty, pack.price]));
  });
  const [dbPacks, setDbPacks] = useState<PricingPack[]>(() => getCachedPricingPacks(service, "EUR") || []);
  const experimentSegment = useMemo(
    () => ({ country, locale, page: service }),
    [country, locale, service],
  );
  const experiment = usePricingExperiment(getProductAreaForService(service), experimentSegment);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const cached = getCachedPricingPacks(service, currency);
        if (cached) {
          const map = Object.fromEntries(cached.map((pack) => [pack.qty, pack.price]));
          setPriceByQty(map);
          setDbPacks(cached);
          setPricingStatus("ready");
          return;
        }

        setPricingStatus("loading");
        const cleanPacks = await fetchPricingPacks(service, currency);
        if (cancelled) return;

        const map = Object.fromEntries(cleanPacks.map((pack) => [pack.qty, pack.price]));
        setPriceByQty(map);
        setDbPacks(cleanPacks);
        setPricingStatus("ready");
      } catch {
        if (!cancelled) setPricingStatus("error");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [currency, service]);

  const formatter = useMemo(() => buildCurrencyFormatter(currency, locale), [currency, locale]);

  const resolvePrice = useCallback((qty: number, fallback: number) => {
    const fromDb = priceByQty[qty];
    const basePrice = typeof fromDb === "number" && Number.isFinite(fromDb) && fromDb >= 0
      ? fromDb
      : fallback;
    return applyPricingAssignment(basePrice, experiment.assignment);
  }, [experiment.assignment, priceByQty]);

  const resolvePacks = useCallback(<T extends PackLike>(fallbackPacks: readonly T[]): T[] => {
    if (dbPacks.length === 0) {
      return fallbackPacks.map((pack) => ({
        ...pack,
        price: resolvePrice(pack.qty, pack.price),
      }));
    }

    const fallbackByQty = new Map(fallbackPacks.map((pack) => [pack.qty, pack]));

    // Resolve which qty should carry the "popular" / "best" highlight.
    // Only ONE pack gets each badge — picking by qty keeps the highlight
    // consistent even when DB pricing reorders or replaces qtys.
    const dbPopularQty = dbPacks.find((p) => p.popular)?.qty ?? null;
    const fallbackPopularQty = fallbackPacks.find((p) => p.popular)?.qty ?? null;
    const dbQtySet = new Set(dbPacks.map((p) => p.qty));
    const popularQty =
      dbPopularQty ??
      (fallbackPopularQty !== null && dbQtySet.has(fallbackPopularQty) ? fallbackPopularQty : null);
    const fallbackBestQty = fallbackPacks.find((p) => p.best)?.qty ?? null;
    const bestQty =
      fallbackBestQty !== null && dbQtySet.has(fallbackBestQty) ? fallbackBestQty : null;

    return dbPacks.map((dbPack, index) => {
      const matchedFallback = fallbackByQty.get(dbPack.qty);
      const fallback = matchedFallback ?? fallbackPacks[index] ?? fallbackPacks[0];
      const old = fallback
        ? Math.max(fallback.old, roundPrice(dbPack.price * 1.35))
        : roundPrice(dbPack.price * 2.5);

      return {
        ...(fallback ?? {}),
        qty: dbPack.qty,
        price: applyPricingAssignment(dbPack.price, experiment.assignment),
        old,
        bonus: fallback?.bonus ?? derivedBonus(dbPack.qty, fallbackPacks),
        popular: dbPack.qty === popularQty,
        best: dbPack.qty === bestQty,
      } as T;
    });
  }, [dbPacks, experiment.assignment, resolvePrice]);

  const hasDatabasePricing = pricingStatus === "ready" && dbPacks.length > 0;
  const canDisplayPricing = experiment.ready && (hasDatabasePricing || pricingStatus === "error");

  return {
    currency,
    locale,
    mode,
    country,
    formatter,
    resolvePrice,
    resolvePacks,
    dbPacks,
    experiment,
    pricingStatus,
    hasDatabasePricing,
    canDisplayPricing,
  };
}

export function useApplyCurrencyPricing<T extends PackLike>(
  service: string,
  targetPacks: T[],
  fallbackPacks: readonly T[],
) {
  const [version, setVersion] = useState(0);
  const pricing = useCurrencyPricing(service);
  const { canDisplayPricing, currency, locale, resolvePacks } = pricing;

  useLayoutEffect(() => {
    if (!canDisplayPricing) return;
    setDisplayCurrency(currency, locale);
    const resolved = resolvePacks(fallbackPacks);

    targetPacks.splice(0, targetPacks.length, ...resolved);
    setVersion((current) => current + 1);
  }, [canDisplayPricing, currency, fallbackPacks, locale, resolvePacks, targetPacks]);

  return { ...pricing, version };
}
