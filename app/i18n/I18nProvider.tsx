"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { getDictionary, translateVisibleText } from "./dictionaries";
import type { SupportedLocale } from "./types";
import { useLocalePreference } from "./useLocale";

type I18nContextValue = ReturnType<typeof useLocalePreference> & {
  t: (value: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const SKIP_SELECTOR =
  "script,style,noscript,textarea,input,select,option,.currency-select,.language-select,[data-i18n-skip]";

function shouldSkip(node: Node) {
  const parent = node.parentElement;
  if (!parent) return true;
  return Boolean(parent.closest(SKIP_SELECTOR));
}

function translateAttributes(element: Element, locale: SupportedLocale) {
  if (element.closest(SKIP_SELECTOR)) {
    return;
  }

  for (const attr of ["placeholder", "aria-label", "title", "alt"]) {
    const value = element.getAttribute(attr);
    if (!value) continue;
    const originalAttr = `data-i18n-original-${attr}`;
    const original = element.getAttribute(originalAttr) || value;
    if (!element.hasAttribute(originalAttr)) element.setAttribute(originalAttr, original);
    element.setAttribute(attr, translateVisibleText(original, locale));
  }
}

export function I18nProvider({
  children,
  initialLocale = "fr",
}: {
  children: React.ReactNode;
  initialLocale?: SupportedLocale;
}) {
  const preference = useLocalePreference(initialLocale);
  const originals = useRef<WeakMap<Text, string>>(new WeakMap());

  const t = useMemo(() => {
    return (value: string) => translateVisibleText(value, preference.locale);
  }, [preference.locale]);

  useEffect(() => {
    const dict = getDictionary(preference.locale);
    document.documentElement.lang = dict.htmlLang;
    document.title = dict.seo.title;
    document.documentElement.style.setProperty("--i18n-popular-label", JSON.stringify(dict.css.popular));
    document.documentElement.style.setProperty("--i18n-best-value-label", JSON.stringify(dict.css.bestValue));
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (meta) meta.content = dict.seo.description;
  }, [preference.locale]);

  useEffect(() => {
    const translateRoot = (root: ParentNode) => {
      if (root instanceof Element) translateAttributes(root, preference.locale);
      if ("querySelectorAll" in root) {
        root.querySelectorAll("[placeholder],[aria-label],[title],[alt]").forEach((element) => {
          translateAttributes(element, preference.locale);
        });
      }

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let current = walker.nextNode();

      while (current) {
        const textNode = current as Text;
        if (!shouldSkip(textNode)) {
          const original = originals.current.get(textNode) ?? textNode.nodeValue ?? "";
          originals.current.set(textNode, original);
          textNode.nodeValue = translateVisibleText(original, preference.locale);
        }
        current = walker.nextNode();
      }
    };

    translateRoot(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.TEXT_NODE && !shouldSkip(node)) {
            const textNode = node as Text;
            const original = originals.current.get(textNode) ?? textNode.nodeValue ?? "";
            originals.current.set(textNode, original);
            textNode.nodeValue = translateVisibleText(original, preference.locale);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            translateRoot(node as Element);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [preference.locale]);

  const value = useMemo<I18nContextValue>(() => ({ ...preference, t }), [preference, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: "fr" as SupportedLocale,
      mode: "auto" as const,
      country: null,
      source: "fallback",
      setManualLocale: () => {},
      setAutoLocale: () => {},
      t: (value: string) => value,
    };
  }
  return context;
}
