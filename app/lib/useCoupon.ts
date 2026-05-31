"use client";

import { useEffect, useRef, useState } from "react";
import { calculatePromoPricing, normalizePromoCode, type PromoPricing } from "./promoCodes";
import { usePromoFromUrl } from "./usePromoFromUrl";

export type UseCouponResult = {
  coupon: string;
  setCoupon: (v: string) => void;
  couponApplied: boolean;
  setCouponApplied: (v: boolean) => void;
  /** Resolved pricing for the applied code (sync for FANO codes, async for DB codes). */
  promo: PromoPricing;
  /** True while a DB-managed code is being validated server-side. */
  validating: boolean;
  /** True when the applied code was rejected (unknown / expired / exhausted). */
  invalid: boolean;
  /** Seed for CouponField's initiallyExpanded (a `?promo=` code landed applied). */
  initiallyExpanded: boolean;
};

/**
 * Shared checkout coupon state. Centralizes the hybrid promo resolution so all 8
 * platform Step3Checkout components behave identically:
 *
 *  - Empty input or a recognized hardcoded FANO code → resolved SYNCHRONOUSLY via
 *    calculatePromoPricing (no network, no flicker — unchanged legacy behavior).
 *  - Any other applied code → validated against /api/promo/validate (admin-managed
 *    promo_codes). While the round-trip is in flight, no discount is shown; the
 *    server stays authoritative on the charged amount regardless.
 *
 * `subtotalCents` is the cart subtotal in cents (pre-discount, pre-upsell).
 */
export function useCoupon(subtotalCents: number): UseCouponResult {
  const initial = usePromoFromUrl();
  const [coupon, setCoupon] = useState(initial.code);
  const [couponApplied, setCouponApplied] = useState(initial.applied);
  const [remote, setRemote] = useState<{ key: string; promo: PromoPricing } | null>(null);
  const [validating, setValidating] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const fetchedKeyRef = useRef<string | null>(null);

  const safeSubtotal = Math.max(0, Math.round(subtotalCents));
  const normalized = normalizePromoCode(coupon);

  // Synchronous resolution for empty / hardcoded codes. Also the no-discount
  // baseline (type "none") while a DB code is still validating.
  const local = calculatePromoPricing({
    subtotalCents: safeSubtotal,
    promoCode: couponApplied ? normalized : "",
    allowTestPromo: true,
  });

  // A DB lookup is only needed for an applied code the local resolver doesn't know.
  const needsRemote = couponApplied && normalized !== "" && local.type === "none";
  const remoteKey = `${normalized}|${safeSubtotal}`;

  useEffect(() => {
    if (!needsRemote) {
      fetchedKeyRef.current = null;
      setValidating(false);
      setInvalid(false);
      setRemote(null);
      return;
    }
    if (fetchedKeyRef.current === remoteKey) return; // already resolved this key
    fetchedKeyRef.current = remoteKey;

    let cancelled = false;
    setValidating(true);
    setInvalid(false);
    fetch("/api/promo/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: normalized, subtotalCents: safeSubtotal }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: { valid?: boolean; code?: string; type?: string; amountCents?: number; discountCents?: number }) => {
        if (cancelled) return;
        if (data?.valid) {
          setRemote({
            key: remoteKey,
            promo: {
              code: String(data.code || normalized),
              type: data.type === "fixed" ? "fixed" : "percent",
              amountCents: Number(data.amountCents) || safeSubtotal,
              discountCents: Math.max(0, Number(data.discountCents) || 0),
              isTestPromo: false,
            },
          });
          setInvalid(false);
        } else {
          setRemote(null);
          setInvalid(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setRemote(null);
        setInvalid(true);
      })
      .finally(() => {
        if (!cancelled) setValidating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [needsRemote, remoteKey, normalized, safeSubtotal]);

  const promo = needsRemote && remote && remote.key === remoteKey ? remote.promo : local;

  return {
    coupon,
    setCoupon,
    couponApplied,
    setCouponApplied,
    promo,
    validating,
    invalid,
    initiallyExpanded: initial.applied,
  };
}
