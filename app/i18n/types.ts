export const SUPPORTED_LOCALES = ["fr", "en", "es", "pt", "de", "it", "tr"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type LocaleMode = "auto" | "manual";

export type LocaleOption = {
  code: SupportedLocale;
  name: string;
  short: string;
};

export type LocaleDictionary = {
  code: SupportedLocale;
  htmlLang: string;
  name: string;
  selector: {
    label: string;
    aria: string;
    titleAuto: string;
    titleManual: string;
    menuTitle: string;
    auto: string;
    autoHint: string;
    autoMeta: string;
    manualMeta: string;
    active: string;
  };
  status: {
    operational: string;
    asOf: string;
  };
  seo: {
    title: string;
    description: string;
  };
  css: {
    popular: string;
    bestValue: string;
  };
  exact: Record<string, string>;
  fragments: Array<[string, string]>;
};
