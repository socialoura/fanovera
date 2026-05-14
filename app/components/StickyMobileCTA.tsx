"use client";

import { useEffect, useState } from "react";

type Props = {
  visible: boolean;
  label: string;          // e.g. "Continuer" / "Continue"
  priceLabel?: string;    // e.g. formatted price for Step1 ; omit on Step2
  subLabel?: string;      // e.g. "1 000 abonnés + 200 inclus" — short context line
  accent?: string;        // brand color, e.g. "var(--ig-2)"
  onClick: () => void;
  disabled?: boolean;
  /** Show the bar only after the user has scrolled this many pixels past the top.
   *  Default 280 — enough that it doesn't fight the primary in-card CTA above the fold. */
  showAfterScroll?: number;
};

/**
 * Mobile-only sticky bottom bar that surfaces the primary CTA when the user
 * scrolls past the in-card "Continuer" button (typically to read the FAQ).
 * Desktop is hidden via the existing `show-md-only` utility class.
 */
export default function StickyMobileCTA({
  visible,
  label,
  priceLabel,
  subLabel,
  accent = "var(--ig-2)",
  onClick,
  disabled = false,
  showAfterScroll = 280,
}: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const onScroll = () => setScrolled(window.scrollY > showAfterScroll);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [visible, showAfterScroll]);

  if (!visible) return null;

  const shouldShow = scrolled;

  return (
    <div
      className="show-md-only"
      aria-hidden={!shouldShow}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        padding: "10px 14px calc(10px + env(safe-area-inset-bottom, 0px))",
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "saturate(140%) blur(8px)",
        WebkitBackdropFilter: "saturate(140%) blur(8px)",
        borderTop: "1px solid var(--line)",
        boxShadow: "0 -8px 24px -12px rgba(0,0,0,0.12)",
        transform: shouldShow ? "translateY(0)" : "translateY(110%)",
        transition: "transform 220ms ease",
        pointerEvents: shouldShow ? "auto" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {priceLabel && (
          <div style={{ minWidth: 0, flex: "0 1 auto" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: accent, lineHeight: 1, letterSpacing: "-0.01em" }}>
              {priceLabel}
            </div>
            {subLabel && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-3)",
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 160,
                }}
              >
                {subLabel}
              </div>
            )}
          </div>
        )}
        <button
          onClick={onClick}
          disabled={disabled}
          className="btn-primary"
          style={{
            flex: 1,
            padding: "14px 18px",
            fontSize: 15,
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
            background: accent,
            color: "white",
          }}
        >
          {label}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 6, verticalAlign: "-2px" }}>
            <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
