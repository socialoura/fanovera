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

// Currencies whose default symbol is just "$" or otherwise reads as USD/EUR
// to non-local users. Forcing currencyDisplay="code" shows the ISO code
// (e.g. "19,00 CAD") so customers cannot mistake CAD for USD.
const AMBIGUOUS_CURRENCIES = new Set(["CAD", "AUD", "MXN"]);

function currencyFormatOptions(currency: SupportedCurrency): Intl.NumberFormatOptions {
  return {
    style: "currency",
    currency,
    currencyDisplay: AMBIGUOUS_CURRENCIES.has(currency) ? "code" : "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
}

export function buildCurrencyFormatter(currency: SupportedCurrency, locale: string) {
  return new Intl.NumberFormat(locale || "fr-FR", currencyFormatOptions(currency));
}

export function formatMoney(amount: number): string {
  try {
    return buildCurrencyFormatter(state.currency, state.locale).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${state.currency}`;
  }
}

export function currencyDbColumn(currency: string): string {
  const c = currency.toUpperCase();
  if (c === "EUR") return "price";
  return `price_${c.toLowerCase()}`;
}

// Unmapped countries that should still see EUR rather than the USD global
// default: the eurozone (EUR is literally their money) plus nearby European
// markets that are euro-familiar. Everything NOT listed here and not explicitly
// mapped above falls back to USD — the global default that reads far better than
// EUR for non-European visitors (e.g. NZ, the Gulf, Asia).
const EUR_FALLBACK_COUNTRIES = new Set([
  // Eurozone
  "AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT",
  "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES",
  // European, non-euro but euro-adjacent (familiar with the euro)
  "NO", "DK", "PL", "CZ", "HU", "RO", "BG", "IS", "LI",
  // Euro-using microstates
  "MC", "SM", "VA", "AD",
]);

export function mapCountryToCurrency(countryCode?: string): SupportedCurrency {
  const cc = (countryCode || "").toUpperCase();
  if (cc === "US") return "USD";
  if (cc === "GB") return "GBP";
  if (cc === "BR") return "BRL";
  if (cc === "TR") return "TRY";
  if (cc === "CA") return "CAD";
  if (cc === "AU") return "AUD";
  if (cc === "CH") return "CHF";
  if (cc === "MX") return "MXN";
  if (cc === "SE") return "SEK";
  if (EUR_FALLBACK_COUNTRIES.has(cc)) return "EUR";
  return "USD";
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
  if (EUR_FALLBACK_COUNTRIES.has(cc)) return "fr-FR";
  return "en-US";
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
