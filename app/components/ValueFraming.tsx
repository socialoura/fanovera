"use client";

import { useI18n } from "../i18n/I18nProvider";
import { formatMoney } from "../lib/pricingCurrency";

/**
 * Reframes the cart price as a small concrete equivalent ("coffees")
 * to fight price objection at the point of decision.
 * Anchored to a 3 EUR per-coffee baseline (Paris/Berlin avg). Conservative
 * by design - we floor to 1 coffee minimum, never round up generously.
 */

const COFFEE_BASE_EUR = 3;

const COPY: Record<string, (n: number, price: string, qty: string) => string> = {
  fr: (n, price, qty) => `${price} - environ ${n} ${n === 1 ? "cafe" : "cafes"} pour ${qty} abonnes livres en 1-6 h.`,
  en: (n, price, qty) => `${price} - about ${n} ${n === 1 ? "coffee" : "coffees"} for ${qty} followers delivered in 1-6 h.`,
  es: (n, price, qty) => `${price} - unos ${n} ${n === 1 ? "cafe" : "cafes"} para ${qty} seguidores en 1-6 h.`,
  pt: (n, price, qty) => `${price} - cerca de ${n} ${n === 1 ? "cafe" : "cafes"} para ${qty} seguidores em 1-6 h.`,
  de: (n, price, qty) => `${price} - rund ${n} ${n === 1 ? "Kaffee" : "Kaffees"} fur ${qty} Follower in 1-6 h.`,
  it: (n, price, qty) => `${price} - circa ${n} ${n === 1 ? "caffe" : "caffe"} per ${qty} follower in 1-6 h.`,
  tr: (n, price, qty) => `${price} - yaklasik ${n} kahve ile ${qty} takipci 1-6 saatte.`,
};

function formatQtyForLocale(qty: number, locale: string) {
  try {
    return qty.toLocaleString(locale === "en" ? "en-US" : locale);
  } catch {
    return String(qty);
  }
}

type Props = {
  priceEur: number;
  qty: number;
  className?: string;
  style?: React.CSSProperties;
};

export default function ValueFraming({ priceEur, qty, className, style }: Props) {
  const { locale } = useI18n();
  const coffees = Math.max(1, Math.round(priceEur / COFFEE_BASE_EUR));
  const priceLabel = formatMoney(priceEur);
  const qtyLabel = formatQtyForLocale(qty, locale);
  const renderer = COPY[locale] || COPY.fr;
  const text = renderer(coffees, priceLabel, qtyLabel);
  return (
    <div
      className={className}
      data-testid="value-framing"
      style={{
        textAlign: "center",
        marginTop: 8,
        fontSize: 12,
        color: "var(--ink-3)",
        fontStyle: "italic",
        ...style,
      }}
    >
      {text}
    </div>
  );
}
