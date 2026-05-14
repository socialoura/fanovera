"use client";

import { useEffect, useMemo, useState } from "react";
import {
  assignPricingVariant,
  type PricingAssignment,
  type PricingExperiment,
  type PricingSegment,
} from "./pricingExperiments";

const ANONYMOUS_ID_KEY = "fanovera_anonymous_id";

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
  const [experiments, setExperiments] = useState<PricingExperiment[] | null>(null);
  const segmentKey = JSON.stringify(segment);

  useEffect(() => {
    setAnonymousId(getOrCreateAnonymousId());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/pricing-experiments")
      .then(async (res) => {
        if (!res.ok) throw new Error("pricing_experiments_unavailable");
        const data = await res.json().catch(() => ({}));
        if (!cancelled && Array.isArray(data.experiments)) setExperiments(data.experiments);
      })
      .catch(() => {
        if (!cancelled) setExperiments([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
