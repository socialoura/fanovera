"use client";

import { useEffect, useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { getDictionary } from "../i18n/dictionaries";

export default function StatusBadge() {
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const { locale } = useI18n();
  const dict = getDictionary(locale);

  useEffect(() => {
    // Best-effort fetch — failures and zero counts both result in the
    // ticker not rendering (see render guard below), so the page never
    // shows "0 commandes livrées" on a slow morning or DB hiccup.
    let cancelled = false;
    fetch("/api/today-stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        // Accept the new field name (ordersLast7Days) and fall back to the
        // legacy one (ordersToday) so an in-flight CDN cache from before
        // the rename doesn't leave the pill stuck at null until expiry.
        const n = Number(data.ordersLast7Days ?? data.ordersToday);
        if (Number.isFinite(n) && n > 0) setOrdersCount(n);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const formattedCount =
    ordersCount !== null
      ? new Intl.NumberFormat(dict.htmlLang).format(ordersCount)
      : null;
  const [ordersBefore = "", ordersAfter = ""] = (
    formattedCount && dict.status.ordersThisWeek ? dict.status.ordersThisWeek : ""
  ).split("{count}");
  const showOrders = formattedCount !== null && dict.status.ordersThisWeek;

  if (!showOrders) return null;

  return (
    <div
      className="status-badge-wrap"
      style={{
        display: "flex",
        justifyContent: "center",
        marginBottom: 22,
      }}
    >
      <div
        className="status-badge"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "7px 16px 7px 14px",
          background:
            "linear-gradient(180deg, rgba(77,191,138,0.14) 0%, rgba(77,191,138,0.08) 100%)",
          border: "1px solid rgba(77,191,138,0.34)",
          borderRadius: 999,
          fontSize: 13,
          color: "var(--ink)",
          fontWeight: 500,
          maxWidth: "100%",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.6) inset, 0 6px 18px -10px rgba(77,191,138,0.45)",
          backdropFilter: "saturate(140%)",
          WebkitBackdropFilter: "saturate(140%)",
        }}
      >
        {/* Live pulse instead of a static check — signals real-time activity
            and matches the visual language of "operational" status pills the
            visitor sees on banking apps, Stripe Checkout, etc. */}
        <span
          className="ping-dot"
          aria-hidden
          style={{ width: 8, height: 8 }}
        />
        <span data-i18n-skip style={{ lineHeight: 1.2 }}>
          {ordersBefore}
          <strong
            style={{
              color: "var(--ink)",
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums",
              fontSize: 14,
              letterSpacing: "-0.01em",
            }}
          >
            {formattedCount}
          </strong>
          {ordersAfter}
        </span>
      </div>
    </div>
  );
}
