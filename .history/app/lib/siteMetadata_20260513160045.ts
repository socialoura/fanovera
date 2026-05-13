import type { Metadata } from "next";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/app/i18n/types";
import { getEffectiveMarketingMode, type MarketingMode } from "./marketingModeTypes";

export const SITE_NAME = "Fanovera";
export const DEFAULT_LOCALE: SupportedLocale = "fr";
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://fanovera.com").replace(/\/$/, "");

export type PublicRouteId =
  | "home"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "spotify"
  | "twitch"
  | "facebook"
  | "linkedin"
  | "twitter"
  | "orderSuccess"
  | "track";

type RouteConfig = {
  id: PublicRouteId;
  path: string;
  pageType: "home" | "product" | "checkout" | "support";
  productArea?: string;
  index: boolean;
};

type MetadataCopy = {
  title: string;
  description: string;
  keywords: string[];
};

type ProductRouteId = Exclude<PublicRouteId, "home" | "orderSuccess" | "track">;

export const PUBLIC_ROUTES: Record<PublicRouteId, RouteConfig> = {
  home: { id: "home", path: "", pageType: "home", index: true },
  instagram: { id: "instagram", path: "instagram", pageType: "product", productArea: "instagram", index: true },
  tiktok: { id: "tiktok", path: "tiktok", pageType: "product", productArea: "tiktok", index: true },
  youtube: { id: "youtube", path: "youtube", pageType: "product", productArea: "youtube", index: true },
  spotify: { id: "spotify", path: "spotify", pageType: "product", productArea: "spotify", index: true },
  twitch: { id: "twitch", path: "twitch", pageType: "product", productArea: "twitch", index: true },
  facebook: { id: "facebook", path: "facebook", pageType: "product", productArea: "facebook", index: true },
  linkedin: { id: "linkedin", path: "linkedin", pageType: "product", productArea: "linkedin", index: true },
  twitter: { id: "twitter", path: "twitter", pageType: "product", productArea: "twitter", index: true },
  orderSuccess: { id: "orderSuccess", path: "order-success", pageType: "checkout", index: false },
  track: { id: "track", path: "track", pageType: "support", index: false },
};

const HOME_COPY: Record<SupportedLocale, MetadataCopy> = {
  fr: {
    title: "Fanovera - Présence en ligne accompagnée par IA",
    description:
      "Structurez votre présence en ligne avec un audit, une stratégie de contenu, un calendrier éditorial et un suivi clair, sans promesses artificielles.",
    keywords: ["présence en ligne", "stratégie social media", "audit réseaux sociaux", "Fanovera"],
  },
  en: {
    title: "Fanovera - AI-assisted online presence",
    description:
      "Structure your online presence with an audit, content strategy, editorial calendar and clear tracking, without artificial promises.",
    keywords: ["online presence", "social media strategy", "social media audit", "Fanovera"],
  },
  es: {
    title: "Fanovera - Presencia online asistida por IA",
    description:
      "Estructura tu presencia online con auditoría, estrategia de contenidos, calendario editorial y seguimiento claro, sin promesas artificiales.",
    keywords: ["presencia online", "estrategia social media", "auditoría redes sociales", "Fanovera"],
  },
  pt: {
    title: "Fanovera - Presença online assistida por IA",
    description:
      "Estruture sua presença online com auditoria, estratégia de conteúdo, calendário editorial e acompanhamento claro, sem promessas artificiais.",
    keywords: ["presença online", "estratégia social media", "auditoria redes sociais", "Fanovera"],
  },
  de: {
    title: "Fanovera - KI-gestützte Online-Präsenz",
    description:
      "Strukturiere deine Online-Präsenz mit Audit, Content-Strategie, Redaktionsplan und klarem Tracking, ohne künstliche Versprechen.",
    keywords: ["Online-Präsenz", "Social-Media-Strategie", "Social-Media-Audit", "Fanovera"],
  },
  it: {
    title: "Fanovera - Presenza online assistita dall'IA",
    description:
      "Struttura la tua presenza online con audit, strategia di contenuto, calendario editoriale e monitoraggio chiaro, senza promesse artificiali.",
    keywords: ["presenza online", "strategia social media", "audit social", "Fanovera"],
  },
  tr: {
    title: "Fanovera - Yapay zeka destekli online varlık",
    description:
      "Online varlığınızı denetim, içerik stratejisi, yayın takvimi ve net takip ile yapılandırın; yapay vaatler olmadan.",
    keywords: ["online varlık", "sosyal medya stratejisi", "sosyal medya denetimi", "Fanovera"],
  },
};

const PRODUCT_COPY: Record<ProductRouteId, Record<SupportedLocale, MetadataCopy>> = {
  instagram: productCopy("Instagram", {
    fr: "Campagnes de visibilité Instagram avec audience ciblée, déploiement progressif, paiement sécurisé et aucun accès au compte demandé.",
    en: "Instagram visibility campaigns with targeted audience, progressive delivery, secure payment and no account access requested.",
    es: "Campañas de visibilidad para Instagram con audiencia dirigida, despliegue progresivo, pago seguro y sin acceso a la cuenta.",
    pt: "Campanhas de visibilidade para Instagram com público segmentado, entrega progressiva, pagamento seguro e sem acesso à conta.",
    de: "Instagram-Sichtbarkeitskampagnen mit gezielter Zielgruppe, progressiver Umsetzung, sicherer Zahlung und ohne Kontozugriff.",
    it: "Campagne di visibilità Instagram con pubblico mirato, distribuzione progressiva, pagamento sicuro e nessun accesso all'account.",
    tr: "Hedefli kitle, kademeli teslimat, güvenli ödeme ve hesap erişimi olmadan Instagram görünürlük kampanyaları.",
  }),
  tiktok: productCopy("TikTok", {
    fr: "Campagnes de visibilité TikTok avec audience ciblée, déploiement progressif, paiement sécurisé et aucun accès au compte demandé.",
    en: "TikTok visibility campaigns with targeted audience, progressive delivery, secure payment and no account access requested.",
    es: "Campañas de visibilidad para TikTok con audiencia dirigida, despliegue progresivo, pago seguro y sin acceso a la cuenta.",
    pt: "Campanhas de visibilidade para TikTok com público segmentado, entrega progressiva, pagamento seguro e sem acesso à conta.",
    de: "TikTok-Sichtbarkeitskampagnen mit gezielter Zielgruppe, progressiver Umsetzung, sicherer Zahlung und ohne Kontozugriff.",
    it: "Campagne di visibilità TikTok con pubblico mirato, distribuzione progressiva, pagamento sicuro e nessun accesso all'account.",
    tr: "Hedefli kitle, kademeli teslimat, güvenli ödeme ve hesap erişimi olmadan TikTok görünürlük kampanyaları.",
  }),
  youtube: productCopy("YouTube", {
    fr: "Campagnes de visibilité YouTube pour vidéos publiques ou non répertoriées, avec suivi clair et paiement sécurisé.",
    en: "YouTube visibility campaigns for public or unlisted videos, with clear tracking and secure payment.",
    es: "Campañas de visibilidad para videos de YouTube públicos o no listados, con seguimiento claro y pago seguro.",
    pt: "Campanhas de visibilidade para vídeos do YouTube públicos ou não listados, com acompanhamento claro e pagamento seguro.",
    de: "YouTube-Sichtbarkeitskampagnen für öffentliche oder nicht gelistete Videos, mit klarem Tracking und sicherer Zahlung.",
    it: "Campagne di visibilità YouTube per video pubblici o non in elenco, con monitoraggio chiaro e pagamento sicuro.",
    tr: "Herkese açık veya liste dışı YouTube videoları için net takip ve güvenli ödeme ile görünürlük kampanyaları.",
  }),
  spotify: productCopy("Spotify", {
    fr: "Campagnes de visibilité Spotify pour morceaux publics, avec progression mesurée, suivi clair et aucun accès artiste demandé.",
    en: "Spotify visibility campaigns for public tracks, with measured progress, clear tracking and no artist access requested.",
    es: "Campañas de visibilidad para canciones de Spotify, con progreso medido, seguimiento claro y sin acceso de artista.",
    pt: "Campanhas de visibilidade para faixas do Spotify, com progresso medido, acompanhamento claro e sem acesso de artista.",
    de: "Spotify-Sichtbarkeitskampagnen für öffentliche Tracks, mit messbarem Fortschritt, klarem Tracking und ohne Künstlerzugriff.",
    it: "Campagne di visibilità Spotify per brani pubblici, con progresso misurato, monitoraggio chiaro e nessun accesso artista.",
    tr: "Herkese açık Spotify parçaları için ölçülü ilerleme, net takip ve sanatçı erişimi olmadan görünürlük kampanyaları.",
  }),
  twitch: productCopy("Twitch", {
    fr: "Campagnes de visibilité Twitch pour chaînes publiques, avec audience ciblée, déploiement progressif et paiement sécurisé.",
    en: "Twitch visibility campaigns for public channels, with targeted audience, progressive delivery and secure payment.",
    es: "Campañas de visibilidad para canales de Twitch públicos, con audiencia dirigida, despliegue progresivo y pago seguro.",
    pt: "Campanhas de visibilidade para canais públicos da Twitch, com público segmentado, entrega progressiva e pagamento seguro.",
    de: "Twitch-Sichtbarkeitskampagnen für öffentliche Kanäle, mit gezielter Zielgruppe, progressiver Umsetzung und sicherer Zahlung.",
    it: "Campagne di visibilità Twitch per canali pubblici, con pubblico mirato, distribuzione progressiva e pagamento sicuro.",
    tr: "Herkese açık Twitch kanalları için hedefli kitle, kademeli teslimat ve güvenli ödeme ile görünürlük kampanyaları.",
  }),
  facebook: productCopy("Facebook", {
    fr: "Campagnes de visibilité Facebook pour pages publiques, avec audience ciblée, suivi clair et aucun accès administrateur demandé.",
    en: "Facebook visibility campaigns for public pages, with targeted audience, clear tracking and no admin access requested.",
    es: "Campañas de visibilidad para páginas públicas de Facebook, con audiencia dirigida, seguimiento claro y sin acceso administrador.",
    pt: "Campanhas de visibilidade para páginas públicas do Facebook, com público segmentado, acompanhamento claro e sem acesso administrativo.",
    de: "Facebook-Sichtbarkeitskampagnen für öffentliche Seiten, mit gezielter Zielgruppe, klarem Tracking und ohne Admin-Zugriff.",
    it: "Campagne di visibilità Facebook per pagine pubbliche, con pubblico mirato, monitoraggio chiaro e nessun accesso amministratore.",
    tr: "Herkese açık Facebook sayfaları için hedefli kitle, net takip ve yönetici erişimi olmadan görünürlük kampanyaları.",
  }),
  linkedin: productCopy("LinkedIn", {
    fr: "Campagnes de visibilité LinkedIn pour profils publics, avec audience B2B ciblée, suivi clair et aucun mot de passe demandé.",
    en: "LinkedIn visibility campaigns for public profiles, with targeted B2B audience, clear tracking and no password requested.",
    es: "Campañas de visibilidad para perfiles públicos de LinkedIn, con audiencia B2B dirigida, seguimiento claro y sin contraseña.",
    pt: "Campanhas de visibilidade para perfis públicos do LinkedIn, com público B2B segmentado, acompanhamento claro e sem senha.",
    de: "LinkedIn-Sichtbarkeitskampagnen für öffentliche Profile, mit gezielter B2B-Zielgruppe, klarem Tracking und ohne Passwort.",
    it: "Campagne di visibilità LinkedIn per profili pubblici, con pubblico B2B mirato, monitoraggio chiaro e nessuna password.",
    tr: "Herkese açık LinkedIn profilleri için hedefli B2B kitle, net takip ve şifre istemeden görünürlük kampanyaları.",
  }),
  twitter: productCopy("X", {
    fr: "Campagnes de visibilité X avec audience ciblée, déploiement progressif, paiement sécurisé et aucun accès au compte demandé.",
    en: "X visibility campaigns with targeted audience, progressive delivery, secure payment and no account access requested.",
    es: "Campañas de visibilidad para X con audiencia dirigida, despliegue progresivo, pago seguro y sin acceso a la cuenta.",
    pt: "Campanhas de visibilidade para X com público segmentado, entrega progressiva, pagamento seguro e sem acesso à conta.",
    de: "X-Sichtbarkeitskampagnen mit gezielter Zielgruppe, progressiver Umsetzung, sicherer Zahlung und ohne Kontozugriff.",
    it: "Campagne di visibilità X con pubblico mirato, distribuzione progressiva, pagamento sicuro e nessun accesso all'account.",
    tr: "Hedefli kitle, kademeli teslimat, güvenli ödeme ve hesap erişimi olmadan X görünürlük kampanyaları.",
  }),
};

function productCopy(product: string, descriptions: Record<SupportedLocale, string>): Record<SupportedLocale, MetadataCopy> {
  return {
    fr: {
      title: `Fanovera - Visibilité ${product} ciblée`,
      description: descriptions.fr,
      keywords: [`visibilité ${product}`, `campagne ${product}`, "audience ciblée", "Fanovera"],
    },
    en: {
      title: `Fanovera - Targeted ${product} visibility`,
      description: descriptions.en,
      keywords: [`${product} visibility`, `${product} campaign`, "targeted audience", "Fanovera"],
    },
    es: {
      title: `Fanovera - Visibilidad ${product} dirigida`,
      description: descriptions.es,
      keywords: [`visibilidad ${product}`, `campaña ${product}`, "audiencia dirigida", "Fanovera"],
    },
    pt: {
      title: `Fanovera - Visibilidade ${product} segmentada`,
      description: descriptions.pt,
      keywords: [`visibilidade ${product}`, `campanha ${product}`, "público segmentado", "Fanovera"],
    },
    de: {
      title: `Fanovera - Gezielte ${product}-Sichtbarkeit`,
      description: descriptions.de,
      keywords: [`${product}-Sichtbarkeit`, `${product}-Kampagne`, "gezielte Zielgruppe", "Fanovera"],
    },
    it: {
      title: `Fanovera - Visibilità ${product} mirata`,
      description: descriptions.it,
      keywords: [`visibilità ${product}`, `campagna ${product}`, "pubblico mirato", "Fanovera"],
    },
    tr: {
      title: `Fanovera - Hedefli ${product} görünürlüğü`,
      description: descriptions.tr,
      keywords: [`${product} görünürlüğü`, `${product} kampanyası`, "hedefli kitle", "Fanovera"],
    },
  };
}

const SUPPORT_COPY: Record<"orderSuccess" | "track", Record<SupportedLocale, MetadataCopy>> = {
  orderSuccess: {
    fr: { title: "Commande confirmée - Fanovera", description: "Votre commande Fanovera est confirmée. Retrouvez votre lien de suivi.", keywords: ["commande Fanovera"] },
    en: { title: "Order confirmed - Fanovera", description: "Your Fanovera order is confirmed. Find your tracking link.", keywords: ["Fanovera order"] },
    es: { title: "Pedido confirmado - Fanovera", description: "Tu pedido Fanovera está confirmado. Encuentra tu enlace de seguimiento.", keywords: ["pedido Fanovera"] },
    pt: { title: "Pedido confirmado - Fanovera", description: "Seu pedido Fanovera foi confirmado. Encontre seu link de acompanhamento.", keywords: ["pedido Fanovera"] },
    de: { title: "Bestellung bestätigt - Fanovera", description: "Deine Fanovera-Bestellung ist bestätigt. Hier findest du deinen Tracking-Link.", keywords: ["Fanovera Bestellung"] },
    it: { title: "Ordine confermato - Fanovera", description: "Il tuo ordine Fanovera è confermato. Trova il link di monitoraggio.", keywords: ["ordine Fanovera"] },
    tr: { title: "Sipariş onaylandı - Fanovera", description: "Fanovera siparişiniz onaylandı. Takip bağlantınızı bulun.", keywords: ["Fanovera siparişi"] },
  },
  track: {
    fr: { title: "Suivi de commande - Fanovera", description: "Suivez l'état de votre commande Fanovera et la progression de votre campagne.", keywords: ["suivi commande Fanovera"] },
    en: { title: "Order tracking - Fanovera", description: "Track your Fanovera order status and campaign progress.", keywords: ["Fanovera order tracking"] },
    es: { title: "Seguimiento del pedido - Fanovera", description: "Sigue el estado de tu pedido Fanovera y el progreso de tu campaña.", keywords: ["seguimiento pedido Fanovera"] },
    pt: { title: "Acompanhamento do pedido - Fanovera", description: "Acompanhe o status do seu pedido Fanovera e o progresso da campanha.", keywords: ["acompanhamento pedido Fanovera"] },
    de: { title: "Bestellstatus - Fanovera", description: "Verfolge den Status deiner Fanovera-Bestellung und den Kampagnenfortschritt.", keywords: ["Fanovera Bestellstatus"] },
    it: { title: "Monitoraggio ordine - Fanovera", description: "Segui lo stato del tuo ordine Fanovera e il progresso della campagna.", keywords: ["monitoraggio ordine Fanovera"] },
    tr: { title: "Sipariş takibi - Fanovera", description: "Fanovera sipariş durumunuzu ve kampanya ilerlemesini takip edin.", keywords: ["Fanovera sipariş takibi"] },
  },
};

const PRODUCT_LABELS: Record<ProductRouteId, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  spotify: "Spotify",
  twitch: "Twitch",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  twitter: "X",
};

const PERFORMANCE_HOME_COPY: Record<"fr" | "en", MetadataCopy> = {
  fr: {
    title: "Fanovera - Boost social rapide sans mot de passe",
    description:
      "Lancez des campagnes de visibilité pour Instagram, TikTok, YouTube, Spotify et plus, avec paiement sécurisé, livraison progressive et suivi inclus.",
    keywords: ["boost réseaux sociaux", "visibilité Instagram", "boost TikTok", "Fanovera"],
  },
  en: {
    title: "Fanovera - Fast social proof without passwords",
    description:
      "Launch visibility campaigns for Instagram, TikTok, YouTube, Spotify and more, with secure payment, progressive delivery and tracking included.",
    keywords: ["social media boost", "Instagram visibility", "TikTok boost", "Fanovera"],
  },
};

function performanceProductCopy(routeId: ProductRouteId, locale: "fr" | "en"): MetadataCopy {
  const product = PRODUCT_LABELS[routeId];
  return locale === "fr"
    ? {
        title: `Fanovera - Boost ${product} rapide et suivi`,
        description: `Commandez un pack ${product} avec lancement rapide, livraison progressive, paiement sécurisé, suivi clair et aucun mot de passe demandé.`,
        keywords: [`boost ${product}`, `acheter visibilité ${product}`, `pack ${product}`, "Fanovera"],
      }
    : {
        title: `Fanovera - Fast tracked ${product} boost`,
        description: `Order a ${product} pack with fast launch, progressive delivery, secure payment, clear tracking and no password requested.`,
        keywords: [`${product} boost`, `buy ${product} visibility`, `${product} pack`, "Fanovera"],
      };
}

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return Boolean(value && SUPPORTED_LOCALES.includes(value as SupportedLocale));
}

export function normalizeRouteLocale(value: string | null | undefined): SupportedLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

export function getRoutePath(routeId: PublicRouteId) {
  return PUBLIC_ROUTES[routeId].path;
}

export function localizedPath(locale: SupportedLocale, routeId: PublicRouteId, extraPath = "") {
  const routePath = getRoutePath(routeId);
  const suffix = [routePath, extraPath.replace(/^\/+/, "")].filter(Boolean).join("/");
  return suffix ? `/${locale}/${suffix}` : `/${locale}`;
}

export function localizedUrl(locale: SupportedLocale, routeId: PublicRouteId, extraPath = "") {
  return `${SITE_URL}${localizedPath(locale, routeId, extraPath)}`;
}

export function alternateLanguages(routeId: PublicRouteId, extraPath = "") {
  return Object.fromEntries([
    ...SUPPORTED_LOCALES.map((locale) => [locale, localizedUrl(locale, routeId, extraPath)]),
    ["x-default", localizedUrl(DEFAULT_LOCALE, routeId, extraPath)],
  ]);
}

export function getMetadataCopy(routeId: PublicRouteId, locale: SupportedLocale, marketingMode: MarketingMode = "clean"): MetadataCopy {
  const effectiveMode = getEffectiveMarketingMode(locale, marketingMode);
  if (effectiveMode === "performance" && (locale === "fr" || locale === "en")) {
    if (routeId === "home") return PERFORMANCE_HOME_COPY[locale];
    if (routeId !== "orderSuccess" && routeId !== "track") return performanceProductCopy(routeId, locale);
  }
  if (routeId === "home") return HOME_COPY[locale];
  if (routeId === "orderSuccess" || routeId === "track") return SUPPORT_COPY[routeId][locale];
  return PRODUCT_COPY[routeId][locale];
}

export function buildPageMetadata(
  routeId: PublicRouteId,
  localeInput?: string | null,
  extraPath = "",
  marketingMode: MarketingMode = "clean",
): Metadata {
  const locale = normalizeRouteLocale(localeInput);
  const route = PUBLIC_ROUTES[routeId];
  const copy = getMetadataCopy(routeId, locale, marketingMode);
  const canonical = localizedUrl(locale, routeId, extraPath);
  const ogImage = `${SITE_URL}/fanovera-logo.png`;

  return {
    metadataBase: new URL(SITE_URL),
    title: copy.title,
    description: copy.description,
    keywords: copy.keywords,
    alternates: {
      canonical,
      languages: alternateLanguages(routeId, extraPath),
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale,
      title: copy.title,
      description: copy.description,
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [ogImage],
    },
    robots: route.index
      ? { index: true, follow: true }
      : { index: false, follow: false, googleBot: { index: false, follow: false } },
    icons: {
      icon: [
        { url: "/icon.png", type: "image/png", sizes: "any" },
        { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon-192.png", type: "image/png", sizes: "192x192" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
      shortcut: ["/icon.png"],
    },
    manifest: "/site.webmanifest",
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/fanovera-logo.png`,
  };
}

export function websiteJsonLd(locale: SupportedLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: localizedUrl(locale, "home"),
    inLanguage: locale,
  };
}

export function productJsonLd(routeId: PublicRouteId, locale: SupportedLocale, marketingMode: MarketingMode = "clean") {
  const route = PUBLIC_ROUTES[routeId];
  if (route.pageType !== "product") return null;
  const copy = getMetadataCopy(routeId, locale, marketingMode);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: copy.title.replace("Fanovera - ", ""),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: copy.description,
    url: localizedUrl(locale, routeId),
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export const INDEXABLE_ROUTE_IDS = (Object.keys(PUBLIC_ROUTES) as PublicRouteId[]).filter(
  (routeId) => PUBLIC_ROUTES[routeId].index,
);
