"use client";

import { useEffect, useState } from "react";

export type CheckoutUpsellItem = {
  id: number;
  service: string;
  qty: number;
  label: string;
  price_cents: number;
};

type Copy = { eyebrow: string; cta: (price: string) => string; addedNote: string };

const COPY: Record<string, Copy> = {
  fr: {
    eyebrow: "+ Boostez encore plus",
    cta: (p) => `Ajouter pour ${p}`,
    addedNote: "Ajouté à votre commande",
  },
  en: {
    eyebrow: "+ Boost it even more",
    cta: (p) => `Add for ${p}`,
    addedNote: "Added to your order",
  },
  es: { eyebrow: "+ Potencia aún más", cta: (p) => `Añadir por ${p}`, addedNote: "Añadido a tu pedido" },
  pt: { eyebrow: "+ Impulsione ainda mais", cta: (p) => `Adicionar por ${p}`, addedNote: "Adicionado ao pedido" },
  de: { eyebrow: "+ Noch mehr boosten", cta: (p) => `Für ${p} hinzufügen`, addedNote: "Hinzugefügt" },
  it: { eyebrow: "+ Potenzia ancora", cta: (p) => `Aggiungi per ${p}`, addedNote: "Aggiunto all'ordine" },
  tr: { eyebrow: "+ Daha da güçlendir", cta: (p) => `${p} ekle`, addedNote: "Siparişe eklendi" },
};

function fmtPrice(cents: number, locale: string, currency: string) {
  const value = cents / 100;
  const safeCurrency = (currency || "EUR").toUpperCase();
  try {
    return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: value < 10 ? 2 : 0,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${safeCurrency}`;
  }
}

function fmtQty(n: number, locale: string) {
  try {
    return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US").format(n);
  } catch {
    return String(n);
  }
}

export default function CheckoutUpsell({
  platform,
  baseService,
  locale,
  accentColor,
  currency = "EUR",
  onChange,
}: {
  platform: string;
  baseService: string;
  locale: string;
  accentColor: string;
  currency?: string;
  onChange: (item: CheckoutUpsellItem | null) => void;
}) {
  const [upsell, setUpsell] = useState<CheckoutUpsellItem | null>(null);
  const [selected, setSelected] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setSelected(false);
    setUpsell(null);
    onChange(null);
    fetch(`/api/upsells/match?platform=${encodeURIComponent(platform)}&service=${encodeURIComponent(baseService)}&currency=${encodeURIComponent(currency)}`)
      .then((res) => (res.ok ? res.json() : { upsell: null }))
      .then((data: { upsell: (CheckoutUpsellItem & { label_en?: string }) | null }) => {
        if (cancelled) return;
        if (data.upsell) {
          const label = locale === "fr" ? data.upsell.label : (data.upsell.label_en || data.upsell.label);
          setUpsell({
            id: data.upsell.id,
            service: data.upsell.service,
            qty: data.upsell.qty,
            label,
            price_cents: data.upsell.price_cents,
          });
        }
        setLoaded(true);
      })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
    // onChange intentionally omitted: a new function ref each render would
    // re-fire this effect, causing infinite refetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, baseService, locale, currency]);

  const toggle = () => {
    if (!upsell) return;
    const next = !selected;
    setSelected(next);
    onChange(next ? upsell : null);
  };

  if (!loaded || !upsell) return null;

  const copy = COPY[locale] || COPY.fr;
  const priceLabel = fmtPrice(upsell.price_cents, locale, currency);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
      style={{
        marginTop: 14,
        padding: 14,
        borderRadius: 14,
        border: `2px solid ${selected ? accentColor : "var(--line)"}`,
        background: selected ? `color-mix(in srgb, ${accentColor} 6%, white)` : "white",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "border-color 0.18s ease, background 0.18s ease",
      }}
    >
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: 6,
          border: `2px solid ${selected ? accentColor : "var(--line)"}`,
          background: selected ? accentColor : "white",
          display: "grid",
          placeItems: "center",
          transition: "background 0.18s ease",
        }}
      >
        {selected ? (
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: accentColor, marginBottom: 2 }}>
          {copy.eyebrow}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", lineHeight: 1.35 }}>
          {upsell.label || `+${fmtQty(upsell.qty, locale)} ${upsell.service}`}
        </div>
        {selected && (
          <div style={{ marginTop: 4, fontSize: 11, color: "var(--green, #16a34a)", fontWeight: 700 }}>
            ✓ {copy.addedNote}
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          +{priceLabel}
        </div>
        <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>
          {copy.cta(priceLabel).replace(priceLabel, "").trim()}
        </div>
      </div>
    </div>
  );
}
