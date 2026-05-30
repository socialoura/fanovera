"use client";

import { useEffect, useMemo, useState } from "react";
import {
  assignPricingVariant,
  type PricingAssignment,
  type PricingExperiment,
  type PricingSegment,
} from "./pricingExperiments";

const ANONYMOUS_ID_KEY = "fanovera_anonymous_id";

// Shared, deduped cache for the global experiments list. The endpoint returns
// ALL experiments (assignment filters by product area client-side), so every
// variant hook on a page can share a single fetch. This makes the experiment
// gate ready for all variants at once → switching product variant never shows
// a loading skeleton.
const EXPERIMENTS_TTL = 5 * 60 * 1000;
let experimentsCache: { data: PricingExperiment[]; ts: number } | null = null;
let experimentsPromise: Promise<PricingExperiment[]> | null = null;

function getCachedExperiments(): PricingExperiment[] | null {
  if (experimentsCache && Date.now() - experimentsCache.ts <= EXPERIMENTS_TTL) {
    return experimentsCache.data;
  }
  return null;
}

function fetchExperimentsShared(): Promise<PricingExperiment[]> {
  const cached = getCachedExperiments();
  if (cached) return Promise.resolve(cached);
  if (experimentsPromise) return experimentsPromise;

  experimentsPromise = fetch("/api/pricing-experiments")
    .then(async (res) => {
      if (!res.ok) throw new Error("pricing_experiments_unavailable");
      const data = await res.json().catch(() => ({}));
      const list = Array.isArray(data.experiments) ? (data.experiments as PricingExperiment[]) : [];
      experimentsCache = { data: list, ts: Date.now() };
      return list;
    })
    .catch(() => {
      experimentsCache = { data: [], ts: Date.now() };
      return [];
    })
    .finally(() => {
      experimentsPromise = null;
    });

  return experimentsPromise;
}

function createAnonymousId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateAnonymousId() {
  if (typeof window === "undefined") return null;
  const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);
  if (existing) return existing;
  const next = createAnonymousId();
  window.localStorage.setItem(ANONYMOUS_ID_KEY, next);
  return next;
}

const EXPOSURE_SENT_KEY = "fanovera_pricing_exposures_v1";

function hasSentExposure(key: string) {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(EXPOSURE_SENT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Record<string, true>;
    return Boolean(parsed[key]);
  } catch {
    return false;
  }
}

function markExposureSent(key: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(EXPOSURE_SENT_KEY);
    const parsed = raw ? JSON.parse(raw) as Record<string, true> : {};
    parsed[key] = true;
    window.sessionStorage.setItem(EXPOSURE_SENT_KEY, JSON.stringify(parsed));
  } catch {
  }
}

export function usePricingExperiment(productArea: string, segment: PricingSegment = {}) {
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  const [experiments, setExperiments] = useState<PricingExperiment[] | null>(() => getCachedExperiments());
  const segmentKey = JSON.stringify(segment);

  useEffect(() => {
    setAnonymousId(getOrCreateAnonymousId());
  }, []);

  useEffect(() => {
    if (experiments !== null) return;
    let cancelled = false;
    fetchExperimentsShared().then((list) => {
      if (!cancelled) setExperiments(list);
    });
    return () => {
      cancelled = true;
    };
  }, [experiments]);

  const assignment = useMemo<PricingAssignment>(() => {
    return assignPricingVariant({
      anonymousId,
      productArea,
      segment,
      experiments: experiments || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anonymousId, experiments, productArea, segmentKey]);

  useEffect(() => {
    if (!anonymousId) return;
    if (!assignment.experimentId || assignment.reason !== "assigned") return;
    const exposureKey = `${anonymousId}:${assignment.experimentId}:${assignment.variantId}:${productArea}`;
    if (hasSentExposure(exposureKey)) return;
    markExposureSent(exposureKey);
    void fetch("/api/pricing-experiments/expose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        anonymousId,
        experimentId: assignment.experimentId,
        variantId: assignment.variantId,
        pricingStrategy: assignment.pricingStrategy,
        productArea,
        plan: segment.plan,
        locale: segment.locale,
        country: segment.country,
      }),
    }).catch(() => {});
  }, [anonymousId, assignment, productArea, segment.plan, segment.locale, segment.country]);

  return { anonymousId, assignment, ready: experiments !== null };
}
