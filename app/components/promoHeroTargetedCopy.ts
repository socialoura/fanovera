import type { NetworkId } from "../lib/networks";

type Title = {
  titleBefore: string;
  titleHighlight: string;
  titleAfter: string;
  /** Short label shown above the H1 to give a second confirmation cue. */
  eyebrow: string;
};

/**
 * Hero copy that swaps in when a visitor lands on /promo with a UTM signal
 * naming one of the 8 networks (e.g. `utm_term=buy+tiktok+followers`).
 *
 * Goals:
 *  - Confirm intent within the LCP: the network name appears in the H1 so
 *    the visitor immediately sees they're "on the right page".
 *  - Stay compliant with Google Ads: the page is still /promo, the rest of
 *    the multi-network grid below remains intact — we only tune the H1.
 *
 * Only FR and EN are populated (the locales we currently buy ads in). Other
 * locales fall back to the generic copy in publicCopy.ts via the caller.
 */
export const PROMO_HERO_TARGETED_COPY: Partial<Record<string, Partial<Record<NetworkId, Title>>>> = {
  // Eyebrows are intentionally NON-QUANTITATIVE and avoid product names
  // ("followers", "likes", "views", "streams", "subscribers"). The /promo
  // page is the URL Google Ads sees + scans for policy compliance; even
  // descriptive product mentions can trigger a strike on a fragile account.
  // Descriptors here stay at the "visibility / presence / growth" level —
  // the product specifics live on /{platform} which the visitor reaches by
  // their own click (visitor-initiated navigation = out of ad policy scope).
  fr: {
    instagram: {
      eyebrow: "Instagram · Visibilité progressive",
      titleBefore: "Boostez votre ",
      titleHighlight: "Instagram",
      titleAfter: ", en quelques clics.",
    },
    tiktok: {
      eyebrow: "TikTok · Présence ciblée",
      titleBefore: "Boostez votre ",
      titleHighlight: "TikTok",
      titleAfter: ", en quelques clics.",
    },
    youtube: {
      eyebrow: "YouTube · Croissance de chaîne",
      titleBefore: "Boostez votre chaîne ",
      titleHighlight: "YouTube",
      titleAfter: ", en quelques clics.",
    },
    spotify: {
      eyebrow: "Spotify · Visibilité musicale",
      titleBefore: "Boostez vos titres ",
      titleHighlight: "Spotify",
      titleAfter: ", en quelques clics.",
    },
    twitter: {
      eyebrow: "Twitter / X · Présence sociale",
      titleBefore: "Boostez votre compte ",
      titleHighlight: "Twitter / X",
      titleAfter: ", en quelques clics.",
    },
    facebook: {
      eyebrow: "Facebook · Visibilité de page",
      titleBefore: "Boostez votre page ",
      titleHighlight: "Facebook",
      titleAfter: ", en quelques clics.",
    },
    linkedin: {
      eyebrow: "LinkedIn · Présence professionnelle",
      titleBefore: "Boostez votre profil ",
      titleHighlight: "LinkedIn",
      titleAfter: ", en quelques clics.",
    },
    twitch: {
      eyebrow: "Twitch · Visibilité de chaîne",
      titleBefore: "Boostez votre chaîne ",
      titleHighlight: "Twitch",
      titleAfter: ", en quelques clics.",
    },
  },
  en: {
    instagram: {
      eyebrow: "Instagram · Progressive visibility",
      titleBefore: "Grow your ",
      titleHighlight: "Instagram",
      titleAfter: " Followers in just a few clicks.",
    },
    tiktok: {
      eyebrow: "TikTok · Targeted presence",
      titleBefore: "Grow your ",
      titleHighlight: "TikTok",
      titleAfter: " in just a few clicks.",
    },
    youtube: {
      eyebrow: "YouTube · Channel growth",
      titleBefore: "Grow your ",
      titleHighlight: "YouTube",
      titleAfter: " channel in just a few clicks.",
    },
    spotify: {
      eyebrow: "Spotify · Music visibility",
      titleBefore: "Grow your ",
      titleHighlight: "Spotify",
      titleAfter: " presence in just a few clicks.",
    },
    twitter: {
      eyebrow: "Twitter / X · Social presence",
      titleBefore: "Grow your ",
      titleHighlight: "Twitter / X",
      titleAfter: " account in just a few clicks.",
    },
    facebook: {
      eyebrow: "Facebook · Page visibility",
      titleBefore: "Grow your ",
      titleHighlight: "Facebook",
      titleAfter: " page in just a few clicks.",
    },
    linkedin: {
      eyebrow: "LinkedIn · Professional presence",
      titleBefore: "Grow your ",
      titleHighlight: "LinkedIn",
      titleAfter: " profile in just a few clicks.",
    },
    twitch: {
      eyebrow: "Twitch · Channel visibility",
      titleBefore: "Grow your ",
      titleHighlight: "Twitch",
      titleAfter: " channel in just a few clicks.",
    },
  },
};

export function getTargetedHeroTitle(locale: string, network: NetworkId | null): Title | null {
  if (!network) return null;
  const localeKey = (locale || "").toLowerCase().split("-")[0];
  const byLocale = PROMO_HERO_TARGETED_COPY[localeKey];
  return byLocale?.[network] || null;
}
