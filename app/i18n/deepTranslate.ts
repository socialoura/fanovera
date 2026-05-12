import { translateVisibleText } from "./dictionaries";
import type { SupportedLocale } from "./types";

export function deepTranslateCopy<T>(copy: T, locale: SupportedLocale): T {
  if (locale === "fr") return copy;
  if (typeof copy === "string") return translateVisibleText(copy, locale) as T;
  if (Array.isArray(copy)) return copy.map((item) => deepTranslateCopy(item, locale)) as T;
  if (copy && typeof copy === "object") {
    return Object.fromEntries(
      Object.entries(copy).map(([key, value]) => [key, deepTranslateCopy(value, locale)]),
    ) as T;
  }
  return copy;
}
