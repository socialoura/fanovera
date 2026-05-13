import type { SupportedLocale } from "../i18n/types";

export const ADMIN_TRANSLATION_TARGET_LOCALES = ["es", "pt", "de", "it", "tr"] as const;

export type AdminTranslationTargetLocale = (typeof ADMIN_TRANSLATION_TARGET_LOCALES)[number];

export const ADMIN_TRANSLATION_LANGUAGE_NAMES: Record<AdminTranslationTargetLocale, string> = {
  es: "Spanish",
  pt: "Portuguese",
  de: "German",
  it: "Italian",
  tr: "Turkish",
};

export type MissingTranslationEntry = {
  source: string;
  english: string;
};

export type LocaleMissingTranslations = {
  locale: AdminTranslationTargetLocale;
  exact: MissingTranslationEntry[];
  fragments: MissingTranslationEntry[];
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeTsString(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\n");
}

function readExactEntries(fileText: string): MissingTranslationEntry[] {
  const exactBlock = fileText.match(/exact:\s*\{([\s\S]*?)\n\s*\},\n\s*fragments:/)?.[1] || "";
  const entries: MissingTranslationEntry[] = [];
  const re = /"([^"]+)":\s*"([^"]*)"/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(exactBlock))) {
    entries.push({ source: match[1], english: match[2] });
  }

  return entries;
}

function readFragmentEntries(fileText: string): MissingTranslationEntry[] {
  const fragmentsBlock = fileText.match(/fragments:\s*\[([\s\S]*?)\]\s*\}?\s*;?\n\nexport default/)?.[1] || "";
  const entries: MissingTranslationEntry[] = [];
  const re = /\[\s*"([^"]+)",\s*"([^"]*)"\s*\]/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(fragmentsBlock))) {
    entries.push({ source: match[1], english: match[2] });
  }

  return entries;
}

function ownExactSources(fileText: string) {
  return new Set(readExactEntries(fileText).map((entry) => entry.source));
}

function ownFragmentSources(fileText: string) {
  return new Set(readFragmentEntries(fileText).map((entry) => entry.source));
}

export function findMissingLocaleTranslations(
  sourceLocaleFile: string,
  targetLocaleFile: string,
  locale: AdminTranslationTargetLocale,
): LocaleMissingTranslations {
  const sourceExact = readExactEntries(sourceLocaleFile);
  const sourceFragments = readFragmentEntries(sourceLocaleFile);
  const targetExact = ownExactSources(targetLocaleFile);
  const targetFragments = ownFragmentSources(targetLocaleFile);

  return {
    locale,
    exact: sourceExact.filter((entry) => !targetExact.has(entry.source)),
    fragments: sourceFragments.filter((entry) => !targetFragments.has(entry.source)),
  };
}

export function appendLocaleTranslations(
  localeFile: string,
  translations: {
    exact?: Record<string, string>;
    fragments?: Record<string, string>;
  },
) {
  let next = localeFile;
  const exactEntries = Object.entries(translations.exact || {});
  const fragmentEntries = Object.entries(translations.fragments || {});

  if (exactEntries.length > 0) {
    const lines = exactEntries
      .map(([source, translated]) => `    "${escapeTsString(source)}": "${escapeTsString(translated)}",`)
      .join("\n");

    next = next.replace(/(\n\s*\},\n\s*fragments:)/, `\n${lines}$1`);
  }

  if (fragmentEntries.length > 0) {
    const lines = fragmentEntries
      .map(([source, translated]) => `    ["${escapeTsString(source)}", "${escapeTsString(translated)}"],`)
      .join("\n");

    next = next.replace(/(\n\s*\]\s*\}?\s*;\n\nexport default)/, `\n${lines}$1`);
  }

  return next;
}

export function filterTranslationsToMissing(
  missing: LocaleMissingTranslations,
  translated: {
    exact?: Record<string, string>;
    fragments?: Record<string, string>;
  },
) {
  const exactMissing = new Set(missing.exact.map((entry) => entry.source));
  const fragmentMissing = new Set(missing.fragments.map((entry) => entry.source));

  return {
    exact: Object.fromEntries(
      Object.entries(translated.exact || {}).filter(([source, value]) => exactMissing.has(source) && value.trim()),
    ),
    fragments: Object.fromEntries(
      Object.entries(translated.fragments || {}).filter(([source, value]) => fragmentMissing.has(source) && value.trim()),
    ),
  };
}

export function isAdminTranslationTargetLocale(locale: string): locale is AdminTranslationTargetLocale {
  return (ADMIN_TRANSLATION_TARGET_LOCALES as readonly string[]).includes(locale);
}

export function sourceKeyAppearsInFile(fileText: string, source: string) {
  return new RegExp(`"${escapeRegExp(escapeTsString(source))}"`).test(fileText);
}

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return ["fr", "en", ...ADMIN_TRANSLATION_TARGET_LOCALES].includes(locale);
}
