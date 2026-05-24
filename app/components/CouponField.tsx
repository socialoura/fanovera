"use client";

import { useState } from "react";

/**
 * Collapsed-by-default promo-code field for the checkout. Prevents the
 * classic "coupon-induced abandonment" pattern where a visible empty input
 * makes the buyer leave to hunt for a code.
 *
 * Expanded automatically when:
 *  - the visitor arrived with `?promo=` already applied (intent is clear)
 *  - the visitor manually expanded it once during this session
 *
 * Stays whitehat-friendly: when collapsed, only a small text link is
 * visible — nothing that triggers urgency or suggests discounts exist.
 */
export type CouponFieldLabels = {
  /** Collapsed CTA, e.g. "J'ai un code promo" */
  haveCoupon: string;
  /** Field label, e.g. "Code promo" */
  coupon: string;
  /** Input placeholder, e.g. "CODE PROMO" */
  couponPlaceholder: string;
  /** Apply-button label when not applied, e.g. "Appliquer" */
  apply: string;
  /** Apply-button label when applied, e.g. "✓ Appliqué" */
  applied: string;
};

export type CouponFieldProps = {
  coupon: string;
  setCoupon: (v: string) => void;
  couponApplied: boolean;
  setCouponApplied: (v: boolean) => void;
  /** True when ?promo= URL param landed a valid code — expand by default. */
  initiallyExpanded: boolean;
  labels: CouponFieldLabels;
  /** Optional success block rendered below the input when applied. */
  successMessage?: React.ReactNode;
  /** Brand accent color (e.g. "var(--ig-2)") for the collapsed text link. */
  accentColor?: string;
};

export default function CouponField({
  coupon,
  setCoupon,
  couponApplied,
  setCouponApplied,
  initiallyExpanded,
  labels,
  successMessage,
  accentColor = "var(--primary)",
}: CouponFieldProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  if (!expanded) {
    return (
      <div style={{ padding: "14px 0", borderBottom: "1px dashed var(--line)", display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: accentColor,
            textDecoration: "underline",
            textUnderlineOffset: 3,
            padding: 0,
          }}
        >
          + {labels.haveCoupon}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "14px 0", borderBottom: "1px dashed var(--line)" }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--ink-3)",
          marginBottom: 8,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {labels.coupon}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div className="input-shell" style={{ flex: 1, padding: "4px 12px" }}>
          <input
            type="text"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            placeholder={labels.couponPlaceholder}
            style={{ textTransform: "uppercase", fontSize: 14 }}
            autoFocus
          />
        </div>
        <button
          type="button"
          onClick={() => setCouponApplied(!couponApplied)}
          style={{
            padding: "10px 16px",
            background: couponApplied ? "var(--green)" : "var(--paper-2)",
            color: couponApplied ? "white" : "var(--ink)",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            border: "none",
          }}
        >
          {couponApplied ? labels.applied : labels.apply}
        </button>
      </div>
      {successMessage}
    </div>
  );
}
