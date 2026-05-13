export const SUPPORTED_CURRENCIES = [
  "EUR",
  "USD",
  "GBP",
  "BRL",
  "TRY",
  "CAD",
  "AUD",
  "CHF",
  "MXN",
  "SEK",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  EUR: "Euro",
  USD: "US Dollar",
  GBP: "Livre sterling",
  BRL: "Real brésilien",
  TRY: "Livre turque",
  CAD: "Dollar canadien",
  AUD: "Dollar australien",
  CHF: "Franc suisse",
  MXN: "Peso mexicain",
  SEK: "Couronne suédoise",
};

type CurrencyState = {
  currency: SupportedCurrency;
  locale: string;
};

const state: CurrencyState = {
  currency: "EUR",
  locale: "fr-FR",
};

export function setDisplayCurrency(currency: string, locale?: string) {
  const upper = (currency || "EUR").toUpperCase() as SupportedCurrency;
  if (SUPPORTED_CURRENCIES.includes(upper)) {
    state.currency = upper;
  } else {
    state.currency = "EUR";
  }
  if (locale) state.locale = locale;
}

export function getDisplayCurrency(): SupportedCurrency {
  return state.currency;
}

export function getDisplayLocale(): string {
  return state.locale;
}

export function formatMoney(amount: number): string {
  try {
    return new Intl.NumberFormat(state.locale || "fr-FR", {
      style: "currency",
      currency: state.currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${state.currency}`;
  }
}

export function currencyDbColumn(currency: string): string {
  const c = currency.toUpperCase();
  if (c === "EUR") return "price";
  return `price_${c.toLowerCase()}`;
}

export function mapCountryToCurrency(countryCode?: string): SupportedCurrency {
  const cc = (countryCode || "").toUpperCase();
  if (["US"].includes(cc)) return "USD";
  if (["GB"].includes(cc)) return "GBP";
  if (["BR"].includes(cc)) return "BRL";
  if (["TR"].includes(cc)) return "TRY";
  if (["CA"].includes(cc)) return "CAD";
  if (["AU"].includes(cc)) return "AUD";
  if (["CH"].includes(cc)) return "CHF";
  if (["MX"].includes(cc)) return "MXN";
  if (["SE"].includes(cc)) return "SEK";
  return "EUR";
}

export function mapCountryToLocale(countryCode?: string): string {
  const cc = (countryCode || "").toUpperCase();
  if (cc === "US") return "en-US";
  if (cc === "GB") return "en-GB";
  if (cc === "BR") return "pt-BR";
  if (cc === "TR") return "tr-TR";
  if (cc === "CA") return "en-CA";
  if (cc === "AU") return "en-AU";
  if (cc === "CH") return "de-CH";
  if (cc === "MX") return "es-MX";
  if (cc === "SE") return "sv-SE";
  return "fr-FR";
}

export function mapCurrencyToLocale(currency?: string): string {
  const c = (currency || "").toUpperCase();
  if (c === "USD") return "en-US";
  if (c === "GBP") return "en-GB";
  if (c === "BRL") return "pt-BR";
  if (c === "TRY") return "tr-TR";
  if (c === "CAD") return "en-CA";
  if (c === "AUD") return "en-AU";
  if (c === "CHF") return "de-CH";
  if (c === "MXN") return "es-MX";
  if (c === "SEK") return "sv-SE";
  return "fr-FR";
}
