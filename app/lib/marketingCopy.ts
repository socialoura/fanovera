import type { MarketingSurface, SurfaceMarketingMode } from "./marketingModeTypes";

export type MarketingCopy = {
  hero: {
    titleBefore: string;
    titleHighlight: string;
    titleAfter: string;
    subtitle: string;
    cta: string;
  };
  faqEmphasis?: string;
  metaTitle: string;
  metaDescription: string;
  reassurance: string;
};

type CopyLocale = "fr" | "en";

// ── Helper to generate product-level copy across all 3 modes ──

function productSurface(
  product: string,
  fr: { wh: MarketingCopy; gh: MarketingCopy; bh: MarketingCopy },
  en: { wh: MarketingCopy; gh: MarketingCopy; bh: MarketingCopy },
): Record<SurfaceMarketingMode, Record<CopyLocale, MarketingCopy>> {
  return {
    whitehat: { fr: fr.wh, en: en.wh },
    greyhat: { fr: fr.gh, en: en.gh },
    blackhat: { fr: fr.bh, en: en.bh },
  };
}

// ── HOME ──

const HOME: Record<SurfaceMarketingMode, Record<CopyLocale, MarketingCopy>> = {
  whitehat: {
    fr: {
      hero: { titleBefore: "Une présence en ligne ", titleHighlight: "plus claire", titleAfter: ", sans promesses artificielles.", subtitle: "Structurez votre visibilité avec un audit, une stratégie de contenu et un suivi clair.", cta: "Commencer" },
      metaTitle: "Fanovera - Présence en ligne accompagnée par IA",
      metaDescription: "Structurez votre présence en ligne avec un audit, une stratégie de contenu, un calendrier éditorial et un suivi clair, sans promesses artificielles.",
      reassurance: "Audit public - Stratégie de contenu - Aucun accès au compte demandé",
    },
    en: {
      hero: { titleBefore: "A ", titleHighlight: "clearer", titleAfter: " online presence, without artificial promises.", subtitle: "Structure your visibility with an audit, content strategy, and clear tracking.", cta: "Get started" },
      metaTitle: "Fanovera - AI-assisted online presence",
      metaDescription: "Structure your online presence with an audit, content strategy, editorial calendar and clear tracking, without artificial promises.",
      reassurance: "Public audit - Content strategy - No account access required",
    },
  },
  greyhat: {
    fr: {
      hero: { titleBefore: "Donnez à votre profil ", titleHighlight: "le signal social", titleAfter: " qu'il mérite, sans mot de passe.", subtitle: "Campagnes de visibilité pour créateurs, artistes et marques — paiement sécurisé, suivi inclus.", cta: "Lancer une campagne" },
      metaTitle: "Fanovera - Boost social rapide sans mot de passe",
      metaDescription: "Lancez des campagnes de visibilité pour Instagram, TikTok, YouTube, Spotify et plus, avec paiement sécurisé, livraison progressive et suivi inclus.",
      reassurance: "Sans mot de passe - Paiement sécurisé - Suivi inclus",
    },
    en: {
      hero: { titleBefore: "Give your profile ", titleHighlight: "the social proof", titleAfter: " it deserves, with no password.", subtitle: "Visibility campaigns for creators, artists and brands — secure payment, tracking included.", cta: "Launch a campaign" },
      metaTitle: "Fanovera - Fast social proof without passwords",
      metaDescription: "Launch visibility campaigns for Instagram, TikTok, YouTube, Spotify and more, with secure payment, progressive delivery and tracking included.",
      reassurance: "No password - Secure payment - Tracking included",
    },
  },
  blackhat: {
    fr: {
      hero: { titleBefore: "Explosez votre compteur — ", titleHighlight: "+10K abonnés", titleAfter: " en quelques heures, garantis.", subtitle: "Abonnés réels et actifs livrés en express sur tous vos réseaux. Résultats visibles immédiatement.", cta: "Commander maintenant" },
      faqEmphasis: "Résultats garantis ou relivraison offerte",
      metaTitle: "Fanovera - +10K abonnés garantis en quelques heures",
      metaDescription: "Commandez des abonnés réels et actifs pour Instagram, TikTok, YouTube, Spotify. Livraison express, résultats garantis, paiement sécurisé.",
      reassurance: "Livraison express - Abonnés réels actifs - Garantie relivraison",
    },
    en: {
      hero: { titleBefore: "Blow up your counter — ", titleHighlight: "+10K followers", titleAfter: " in hours, guaranteed.", subtitle: "Real active followers delivered fast across all your networks. Results visible immediately.", cta: "Order now" },
      faqEmphasis: "Guaranteed results or free redelivery",
      metaTitle: "Fanovera - +10K guaranteed followers in hours",
      metaDescription: "Order real active followers for Instagram, TikTok, YouTube, Spotify. Express delivery, guaranteed results, secure payment.",
      reassurance: "Express delivery - Real active followers - Redelivery guarantee",
    },
  },
};

// ── PROMO ──

const PROMO: Record<SurfaceMarketingMode, Record<CopyLocale, MarketingCopy>> = {
  whitehat: {
    fr: {
      hero: { titleBefore: "Optimisez votre ", titleHighlight: "visibilité", titleAfter: " sur les réseaux sociaux.", subtitle: "Approche claire, mesurable et alignée avec les règles des plateformes.", cta: "Voir les services" },
      metaTitle: "Fanovera - Optimisez votre visibilité digitale",
      metaDescription: "Approche structurée pour développer votre présence sur les réseaux sociaux de manière cohérente et mesurable.",
      reassurance: "Processus clair - Suivi mesurable - Approche responsable",
    },
    en: {
      hero: { titleBefore: "Optimize your ", titleHighlight: "visibility", titleAfter: " on social media.", subtitle: "A clear, measurable approach aligned with platform rules.", cta: "View services" },
      metaTitle: "Fanovera - Optimize your digital visibility",
      metaDescription: "A structured approach to grow your social media presence in a consistent and measurable way.",
      reassurance: "Clear process - Measurable tracking - Responsible approach",
    },
  },
  greyhat: {
    fr: {
      hero: { titleBefore: "Boostez votre profil avec ", titleHighlight: "le code FANO5", titleAfter: " — -5% sur tout.", subtitle: "Campagnes de visibilité sur 8 réseaux. Vrais profils audités, livraison progressive.", cta: "Utiliser le code FANO5" },
      metaTitle: "Fanovera Promo - Code FANO5 -5% sur vos campagnes",
      metaDescription: "Profitez de -5% avec le code FANO5 sur toutes les campagnes de visibilité Fanovera. Vrais profils, livraison suivie.",
      reassurance: "-5% avec FANO5 - Paiement sécurisé - Suivi inclus",
    },
    en: {
      hero: { titleBefore: "Boost your profile with ", titleHighlight: "code FANO5", titleAfter: " — 5% off everything.", subtitle: "Visibility campaigns on 8 networks. Real audited profiles, progressive delivery.", cta: "Use code FANO5" },
      metaTitle: "Fanovera Promo - Code FANO5 5% off campaigns",
      metaDescription: "Get 5% off with code FANO5 on all Fanovera visibility campaigns. Real profiles, tracked delivery.",
      reassurance: "5% off with FANO5 - Secure payment - Tracking included",
    },
  },
  blackhat: {
    fr: {
      hero: { titleBefore: "Offre flash — ", titleHighlight: "+10K abonnés", titleAfter: " à prix cassé avec FANO5.", subtitle: "Abonnés réels livrés en express. Code -5% cumulable. Résultats garantis.", cta: "Profiter de l'offre" },
      faqEmphasis: "Offre limitée — stock de profils réservé",
      metaTitle: "Fanovera Promo Flash - +10K abonnés garantis à prix réduit",
      metaDescription: "Offre flash Fanovera : +10K abonnés réels et actifs à prix réduit avec le code FANO5. Livraison express garantie.",
      reassurance: "Offre flash - Abonnés réels - Résultats garantis",
    },
    en: {
      hero: { titleBefore: "Flash deal — ", titleHighlight: "+10K followers", titleAfter: " at a discounted price with FANO5.", subtitle: "Real followers delivered express. 5% code stackable. Guaranteed results.", cta: "Grab the deal" },
      faqEmphasis: "Limited offer — reserved profile stock",
      metaTitle: "Fanovera Flash Promo - +10K guaranteed followers at discount",
      metaDescription: "Fanovera flash offer: +10K real active followers at a reduced price with code FANO5. Guaranteed express delivery.",
      reassurance: "Flash deal - Real followers - Guaranteed results",
    },
  },
};

// ── INSTAGRAM ──

const INSTAGRAM = productSurface("Instagram",
  {
    wh: {
      hero: { titleBefore: "Une visibilité Instagram ", titleHighlight: "ciblée", titleAfter: " et progressive.", subtitle: "Campagnes de visibilité avec audience ciblée, déploiement progressif et suivi clair.", cta: "Choisir un pack" },
      metaTitle: "Fanovera - Visibilité Instagram ciblée",
      metaDescription: "Campagnes de visibilité Instagram avec audience ciblée, déploiement progressif, paiement sécurisé et aucun accès au compte demandé.",
      reassurance: "Sans engagement · Aucun mot de passe · Démarrage sous 1–6 h",
    },
    gh: {
      hero: { titleBefore: "Boost Instagram ", titleHighlight: "rapide", titleAfter: " et suivi.", subtitle: "Vrais profils audités, livraison progressive, paiement sécurisé. Aucun mot de passe.", cta: "Lancer la campagne" },
      metaTitle: "Fanovera - Boost Instagram rapide et suivi",
      metaDescription: "Commandez un pack Instagram avec lancement rapide, livraison progressive, paiement sécurisé, suivi clair et aucun mot de passe demandé.",
      reassurance: "Sans mot de passe - Livraison progressive - Support inclus",
    },
    bh: {
      hero: { titleBefore: "+10K followers Instagram ", titleHighlight: "en 1h", titleAfter: " — abonnés réels actifs.", subtitle: "Livraison express garantie. Profils réels qui interagissent. Résultats visibles immédiatement.", cta: "Commander +10K maintenant" },
      faqEmphasis: "Garantie relivraison si perte sous 30 jours",
      metaTitle: "Fanovera - +10K followers Instagram en 1h garantis",
      metaDescription: "+10K abonnés Instagram réels et actifs livrés en 1 heure. Résultats garantis, paiement sécurisé, relivraison offerte.",
      reassurance: "Livraison 1h - Abonnés réels actifs - Garantie 30 jours",
    },
  },
  {
    wh: {
      hero: { titleBefore: "Targeted Instagram ", titleHighlight: "visibility", titleAfter: ", progressive and clear.", subtitle: "Visibility campaigns with targeted audience, progressive delivery and clear tracking.", cta: "Choose a pack" },
      metaTitle: "Fanovera - Targeted Instagram visibility",
      metaDescription: "Instagram visibility campaigns with targeted audience, progressive delivery, secure payment and no account access requested.",
      reassurance: "No commitment · No password · Starts in 1–6 h",
    },
    gh: {
      hero: { titleBefore: "Fast Instagram ", titleHighlight: "boost", titleAfter: ", tracked and secure.", subtitle: "Real audited profiles, progressive delivery, secure payment. No password needed.", cta: "Launch campaign" },
      metaTitle: "Fanovera - Fast tracked Instagram boost",
      metaDescription: "Order an Instagram pack with fast launch, progressive delivery, secure payment, clear tracking and no password requested.",
      reassurance: "No password - Progressive delivery - Support included",
    },
    bh: {
      hero: { titleBefore: "+10K Instagram followers ", titleHighlight: "in 1 hour", titleAfter: " — real active followers.", subtitle: "Guaranteed express delivery. Real profiles that engage. Results visible immediately.", cta: "Order +10K now" },
      faqEmphasis: "Redelivery guarantee if drop within 30 days",
      metaTitle: "Fanovera - +10K Instagram followers in 1h guaranteed",
      metaDescription: "+10K real active Instagram followers delivered in 1 hour. Guaranteed results, secure payment, free redelivery.",
      reassurance: "1h delivery - Real active followers - 30-day guarantee",
    },
  },
);

// ── TIKTOK ──

const TIKTOK = productSurface("TikTok",
  {
    wh: {
      hero: { titleBefore: "Une visibilité TikTok ", titleHighlight: "ciblée", titleAfter: " et progressive.", subtitle: "Campagnes de visibilité avec audience ciblée et suivi mesuré.", cta: "Choisir un pack" },
      metaTitle: "Fanovera - Visibilité TikTok ciblée",
      metaDescription: "Campagnes de visibilité TikTok avec audience ciblée, déploiement progressif, paiement sécurisé et aucun accès au compte demandé.",
      reassurance: "Sans engagement · Aucun mot de passe · Démarrage sous 1–6 h",
    },
    gh: {
      hero: { titleBefore: "Boost TikTok ", titleHighlight: "rapide", titleAfter: " et suivi.", subtitle: "Vrais profils audités, livraison progressive. Aucun mot de passe demandé.", cta: "Lancer la campagne" },
      metaTitle: "Fanovera - Boost TikTok rapide et suivi",
      metaDescription: "Commandez un pack TikTok avec lancement rapide, livraison progressive, paiement sécurisé et suivi clair.",
      reassurance: "Sans mot de passe - Livraison progressive - Support inclus",
    },
    bh: {
      hero: { titleBefore: "+10K followers TikTok ", titleHighlight: "en 1h", titleAfter: " — abonnés réels actifs.", subtitle: "Livraison express. Profils réels qui likent et commentent. Résultats immédiats.", cta: "Commander +10K maintenant" },
      faqEmphasis: "Garantie relivraison si perte sous 30 jours",
      metaTitle: "Fanovera - +10K followers TikTok en 1h garantis",
      metaDescription: "+10K abonnés TikTok réels livrés en 1 heure. Résultats garantis, paiement sécurisé.",
      reassurance: "Livraison 1h - Abonnés réels actifs - Garantie 30 jours",
    },
  },
  {
    wh: {
      hero: { titleBefore: "Targeted TikTok ", titleHighlight: "visibility", titleAfter: ", progressive and clear.", subtitle: "Visibility campaigns with targeted audience and measured tracking.", cta: "Choose a pack" },
      metaTitle: "Fanovera - Targeted TikTok visibility",
      metaDescription: "TikTok visibility campaigns with targeted audience, progressive delivery, secure payment and no account access requested.",
      reassurance: "No commitment · No password · Starts in 1–6 h",
    },
    gh: {
      hero: { titleBefore: "Fast TikTok ", titleHighlight: "boost", titleAfter: ", tracked and secure.", subtitle: "Real audited profiles, progressive delivery. No password needed.", cta: "Launch campaign" },
      metaTitle: "Fanovera - Fast tracked TikTok boost",
      metaDescription: "Order a TikTok pack with fast launch, progressive delivery, secure payment and clear tracking.",
      reassurance: "No password - Progressive delivery - Support included",
    },
    bh: {
      hero: { titleBefore: "+10K TikTok followers ", titleHighlight: "in 1 hour", titleAfter: " — real active followers.", subtitle: "Express delivery. Real profiles that like and comment. Immediate results.", cta: "Order +10K now" },
      faqEmphasis: "Redelivery guarantee if drop within 30 days",
      metaTitle: "Fanovera - +10K TikTok followers in 1h guaranteed",
      metaDescription: "+10K real TikTok followers delivered in 1 hour. Guaranteed results, secure payment.",
      reassurance: "1h delivery - Real active followers - 30-day guarantee",
    },
  },
);

// ── TWITTER / X ──

const TWITTER = productSurface("X",
  {
    wh: {
      hero: { titleBefore: "Une visibilité X ", titleHighlight: "ciblée", titleAfter: " et progressive.", subtitle: "Campagnes de visibilité avec audience ciblée et suivi clair.", cta: "Choisir un pack" },
      metaTitle: "Fanovera - Visibilité X ciblée",
      metaDescription: "Campagnes de visibilité X avec audience ciblée, déploiement progressif, paiement sécurisé et aucun accès au compte demandé.",
      reassurance: "Sans engagement · Aucun mot de passe · Démarrage sous 1–6 h",
    },
    gh: {
      hero: { titleBefore: "Boost X ", titleHighlight: "rapide", titleAfter: " et suivi.", subtitle: "Vrais profils audités, livraison progressive. Zéro mot de passe.", cta: "Lancer la campagne" },
      metaTitle: "Fanovera - Boost X rapide et suivi",
      metaDescription: "Commandez un pack X avec lancement rapide, livraison progressive, paiement sécurisé et suivi clair.",
      reassurance: "Sans mot de passe - Livraison progressive - Support inclus",
    },
    bh: {
      hero: { titleBefore: "+10K followers X ", titleHighlight: "en 1h", titleAfter: " — abonnés réels actifs.", subtitle: "Livraison express garantie. Profils réels. Résultats visibles immédiatement.", cta: "Commander +10K maintenant" },
      faqEmphasis: "Garantie relivraison si perte sous 30 jours",
      metaTitle: "Fanovera - +10K followers X en 1h garantis",
      metaDescription: "+10K abonnés X réels livrés en 1 heure. Résultats garantis, paiement sécurisé.",
      reassurance: "Livraison 1h - Abonnés réels actifs - Garantie 30 jours",
    },
  },
  {
    wh: {
      hero: { titleBefore: "Targeted X ", titleHighlight: "visibility", titleAfter: ", progressive and clear.", subtitle: "Visibility campaigns with targeted audience and clear tracking.", cta: "Choose a pack" },
      metaTitle: "Fanovera - Targeted X visibility",
      metaDescription: "X visibility campaigns with targeted audience, progressive delivery, secure payment and no account access requested.",
      reassurance: "No commitment · No password · Starts in 1–6 h",
    },
    gh: {
      hero: { titleBefore: "Fast X ", titleHighlight: "boost", titleAfter: ", tracked and secure.", subtitle: "Real audited profiles, progressive delivery. No password.", cta: "Launch campaign" },
      metaTitle: "Fanovera - Fast tracked X boost",
      metaDescription: "Order an X pack with fast launch, progressive delivery, secure payment and clear tracking.",
      reassurance: "No password - Progressive delivery - Support included",
    },
    bh: {
      hero: { titleBefore: "+10K X followers ", titleHighlight: "in 1 hour", titleAfter: " — real active followers.", subtitle: "Guaranteed express delivery. Real profiles. Results visible immediately.", cta: "Order +10K now" },
      faqEmphasis: "Redelivery guarantee if drop within 30 days",
      metaTitle: "Fanovera - +10K X followers in 1h guaranteed",
      metaDescription: "+10K real X followers delivered in 1 hour. Guaranteed results, secure payment.",
      reassurance: "1h delivery - Real active followers - 30-day guarantee",
    },
  },
);

// ── TWITCH ──

const TWITCH = productSurface("Twitch",
  {
    wh: {
      hero: { titleBefore: "Une visibilité Twitch ", titleHighlight: "ciblée", titleAfter: " et progressive.", subtitle: "Campagnes de visibilité pour chaînes publiques avec audience ciblée.", cta: "Choisir un pack" },
      metaTitle: "Fanovera - Visibilité Twitch ciblée",
      metaDescription: "Campagnes de visibilité Twitch pour chaînes publiques, avec audience ciblée, déploiement progressif et paiement sécurisé.",
      reassurance: "Sans engagement · Aucun mot de passe · Démarrage sous 1–6 h",
    },
    gh: {
      hero: { titleBefore: "Boost Twitch ", titleHighlight: "rapide", titleAfter: " et suivi.", subtitle: "Viewers et followers audités, livraison progressive. Aucun accès au compte.", cta: "Lancer la campagne" },
      metaTitle: "Fanovera - Boost Twitch rapide et suivi",
      metaDescription: "Commandez un pack Twitch avec lancement rapide, livraison progressive et suivi clair.",
      reassurance: "Sans mot de passe - Livraison progressive - Support inclus",
    },
    bh: {
      hero: { titleBefore: "+5K viewers Twitch ", titleHighlight: "en live", titleAfter: " — spectateurs réels actifs.", subtitle: "Viewers réels livrés en express pour vos streams. Boost instantané garanti.", cta: "Commander des viewers" },
      faqEmphasis: "Spectateurs actifs pendant tout le stream",
      metaTitle: "Fanovera - +5K viewers Twitch en live garantis",
      metaDescription: "+5K viewers Twitch réels livrés en live. Spectateurs actifs, résultats garantis, paiement sécurisé.",
      reassurance: "Viewers en live - Spectateurs réels - Résultats garantis",
    },
  },
  {
    wh: {
      hero: { titleBefore: "Targeted Twitch ", titleHighlight: "visibility", titleAfter: ", progressive and clear.", subtitle: "Visibility campaigns for public channels with targeted audience.", cta: "Choose a pack" },
      metaTitle: "Fanovera - Targeted Twitch visibility",
      metaDescription: "Twitch visibility campaigns for public channels, with targeted audience, progressive delivery and secure payment.",
      reassurance: "No commitment · No password · Starts in 1–6 h",
    },
    gh: {
      hero: { titleBefore: "Fast Twitch ", titleHighlight: "boost", titleAfter: ", tracked and secure.", subtitle: "Audited viewers and followers, progressive delivery. No account access.", cta: "Launch campaign" },
      metaTitle: "Fanovera - Fast tracked Twitch boost",
      metaDescription: "Order a Twitch pack with fast launch, progressive delivery and clear tracking.",
      reassurance: "No password - Progressive delivery - Support included",
    },
    bh: {
      hero: { titleBefore: "+5K Twitch viewers ", titleHighlight: "live now", titleAfter: " — real active viewers.", subtitle: "Real viewers delivered express for your streams. Instant boost guaranteed.", cta: "Order viewers" },
      faqEmphasis: "Active viewers throughout the stream",
      metaTitle: "Fanovera - +5K live Twitch viewers guaranteed",
      metaDescription: "+5K real Twitch viewers delivered live. Active viewers, guaranteed results, secure payment.",
      reassurance: "Live viewers - Real viewers - Guaranteed results",
    },
  },
);

// ── YOUTUBE ──

const YOUTUBE = productSurface("YouTube",
  {
    wh: {
      hero: { titleBefore: "Une visibilité YouTube ", titleHighlight: "ciblée", titleAfter: " et progressive.", subtitle: "Campagnes de visibilité pour vidéos publiques avec suivi clair.", cta: "Choisir un pack" },
      metaTitle: "Fanovera - Visibilité YouTube ciblée",
      metaDescription: "Campagnes de visibilité YouTube pour vidéos publiques ou non répertoriées, avec suivi clair et paiement sécurisé.",
      reassurance: "Sans engagement · Aucun mot de passe · Démarrage sous 1–6 h",
    },
    gh: {
      hero: { titleBefore: "Boost YouTube ", titleHighlight: "rapide", titleAfter: " et suivi.", subtitle: "Vues et abonnés audités, livraison progressive, suivi clair.", cta: "Lancer la campagne" },
      metaTitle: "Fanovera - Boost YouTube rapide et suivi",
      metaDescription: "Commandez un pack YouTube avec lancement rapide, livraison progressive, paiement sécurisé et suivi clair.",
      reassurance: "Sans mot de passe - Livraison progressive - Support inclus",
    },
    bh: {
      hero: { titleBefore: "+100K vues YouTube ", titleHighlight: "en 24h", titleAfter: " — vues réelles haute rétention.", subtitle: "Vues réelles avec rétention élevée livrées en express. Monétisation compatible.", cta: "Commander des vues" },
      faqEmphasis: "Haute rétention — compatible monétisation",
      metaTitle: "Fanovera - +100K vues YouTube en 24h garanties",
      metaDescription: "+100K vues YouTube haute rétention livrées en 24h. Résultats garantis, paiement sécurisé.",
      reassurance: "Livraison 24h - Haute rétention - Compatible monétisation",
    },
  },
  {
    wh: {
      hero: { titleBefore: "Targeted YouTube ", titleHighlight: "visibility", titleAfter: ", progressive and clear.", subtitle: "Visibility campaigns for public videos with clear tracking.", cta: "Choose a pack" },
      metaTitle: "Fanovera - Targeted YouTube visibility",
      metaDescription: "YouTube visibility campaigns for public or unlisted videos, with clear tracking and secure payment.",
      reassurance: "No commitment · No password · Starts in 1–6 h",
    },
    gh: {
      hero: { titleBefore: "Fast YouTube ", titleHighlight: "boost", titleAfter: ", tracked and secure.", subtitle: "Audited views and subscribers, progressive delivery, clear tracking.", cta: "Launch campaign" },
      metaTitle: "Fanovera - Fast tracked YouTube boost",
      metaDescription: "Order a YouTube pack with fast launch, progressive delivery, secure payment and clear tracking.",
      reassurance: "No password - Progressive delivery - Support included",
    },
    bh: {
      hero: { titleBefore: "+100K YouTube views ", titleHighlight: "in 24h", titleAfter: " — real high-retention views.", subtitle: "Real high-retention views delivered express. Monetization-safe.", cta: "Order views" },
      faqEmphasis: "High retention — monetization compatible",
      metaTitle: "Fanovera - +100K YouTube views in 24h guaranteed",
      metaDescription: "+100K high-retention YouTube views delivered in 24h. Guaranteed results, secure payment.",
      reassurance: "24h delivery - High retention - Monetization compatible",
    },
  },
);

// ── SPOTIFY ──

const SPOTIFY = productSurface("Spotify",
  {
    wh: {
      hero: { titleBefore: "Une visibilité Spotify ", titleHighlight: "ciblée", titleAfter: " et progressive.", subtitle: "Campagnes de visibilité pour morceaux publics avec progression mesurée.", cta: "Choisir un pack" },
      metaTitle: "Fanovera - Visibilité Spotify ciblée",
      metaDescription: "Campagnes de visibilité Spotify pour morceaux publics, avec progression mesurée, suivi clair et aucun accès artiste demandé.",
      reassurance: "Sans engagement · Aucun mot de passe · Démarrage sous 1–6 h",
    },
    gh: {
      hero: { titleBefore: "Boost Spotify ", titleHighlight: "rapide", titleAfter: " et suivi.", subtitle: "Écoutes auditées, livraison progressive. Aucun accès artiste demandé.", cta: "Lancer la campagne" },
      metaTitle: "Fanovera - Boost Spotify rapide et suivi",
      metaDescription: "Commandez un pack Spotify avec lancement rapide, livraison progressive et suivi clair.",
      reassurance: "Sans mot de passe - Livraison progressive - Support inclus",
    },
    bh: {
      hero: { titleBefore: "+100K streams Spotify ", titleHighlight: "en 48h", titleAfter: " — écoutes réelles organiques.", subtitle: "Streams réels livrés en express. Compatible Spotify for Artists. Résultats garantis.", cta: "Commander des streams" },
      faqEmphasis: "Compatible Spotify for Artists — pas de flag",
      metaTitle: "Fanovera - +100K streams Spotify en 48h garantis",
      metaDescription: "+100K streams Spotify réels livrés en 48h. Compatible Spotify for Artists, résultats garantis.",
      reassurance: "Livraison 48h - Streams réels - Compatible S4A",
    },
  },
  {
    wh: {
      hero: { titleBefore: "Targeted Spotify ", titleHighlight: "visibility", titleAfter: ", progressive and clear.", subtitle: "Visibility campaigns for public tracks with measured progress.", cta: "Choose a pack" },
      metaTitle: "Fanovera - Targeted Spotify visibility",
      metaDescription: "Spotify visibility campaigns for public tracks, with measured progress, clear tracking and no artist access requested.",
      reassurance: "No commitment · No password · Starts in 1–6 h",
    },
    gh: {
      hero: { titleBefore: "Fast Spotify ", titleHighlight: "boost", titleAfter: ", tracked and secure.", subtitle: "Audited streams, progressive delivery. No artist access needed.", cta: "Launch campaign" },
      metaTitle: "Fanovera - Fast tracked Spotify boost",
      metaDescription: "Order a Spotify pack with fast launch, progressive delivery and clear tracking.",
      reassurance: "No password - Progressive delivery - Support included",
    },
    bh: {
      hero: { titleBefore: "+100K Spotify streams ", titleHighlight: "in 48h", titleAfter: " — real organic streams.", subtitle: "Real streams delivered express. Spotify for Artists compatible. Guaranteed results.", cta: "Order streams" },
      faqEmphasis: "Spotify for Artists compatible — no flags",
      metaTitle: "Fanovera - +100K Spotify streams in 48h guaranteed",
      metaDescription: "+100K real Spotify streams delivered in 48h. Spotify for Artists compatible, guaranteed results.",
      reassurance: "48h delivery - Real streams - S4A compatible",
    },
  },
);

// ── FACEBOOK ──

const FACEBOOK = productSurface("Facebook",
  {
    wh: {
      hero: { titleBefore: "Une visibilité Facebook ", titleHighlight: "ciblée", titleAfter: " et progressive.", subtitle: "Campagnes de visibilité pour pages publiques avec audience ciblée.", cta: "Choisir un pack" },
      metaTitle: "Fanovera - Visibilité Facebook ciblée",
      metaDescription: "Campagnes de visibilité Facebook pour pages publiques, avec audience ciblée, suivi clair et aucun accès administrateur demandé.",
      reassurance: "Sans engagement · Aucun mot de passe · Démarrage sous 1–6 h",
    },
    gh: {
      hero: { titleBefore: "Boost Facebook ", titleHighlight: "rapide", titleAfter: " et suivi.", subtitle: "Vrais profils audités, livraison progressive. Aucun accès admin.", cta: "Lancer la campagne" },
      metaTitle: "Fanovera - Boost Facebook rapide et suivi",
      metaDescription: "Commandez un pack Facebook avec lancement rapide, livraison progressive et suivi clair.",
      reassurance: "Sans mot de passe - Livraison progressive - Support inclus",
    },
    bh: {
      hero: { titleBefore: "+10K likes Facebook ", titleHighlight: "en 2h", titleAfter: " — abonnés et likes réels.", subtitle: "Followers et likes réels livrés en express. Résultats garantis.", cta: "Commander maintenant" },
      faqEmphasis: "Likes et followers réels — pas de bots",
      metaTitle: "Fanovera - +10K likes Facebook en 2h garantis",
      metaDescription: "+10K likes et followers Facebook réels livrés en 2 heures. Résultats garantis, paiement sécurisé.",
      reassurance: "Livraison 2h - Profils réels - Résultats garantis",
    },
  },
  {
    wh: {
      hero: { titleBefore: "Targeted Facebook ", titleHighlight: "visibility", titleAfter: ", progressive and clear.", subtitle: "Visibility campaigns for public pages with targeted audience.", cta: "Choose a pack" },
      metaTitle: "Fanovera - Targeted Facebook visibility",
      metaDescription: "Facebook visibility campaigns for public pages, with targeted audience, clear tracking and no admin access requested.",
      reassurance: "No commitment · No password · Starts in 1–6 h",
    },
    gh: {
      hero: { titleBefore: "Fast Facebook ", titleHighlight: "boost", titleAfter: ", tracked and secure.", subtitle: "Real audited profiles, progressive delivery. No admin access.", cta: "Launch campaign" },
      metaTitle: "Fanovera - Fast tracked Facebook boost",
      metaDescription: "Order a Facebook pack with fast launch, progressive delivery and clear tracking.",
      reassurance: "No password - Progressive delivery - Support included",
    },
    bh: {
      hero: { titleBefore: "+10K Facebook likes ", titleHighlight: "in 2 hours", titleAfter: " — real followers and likes.", subtitle: "Real followers and likes delivered express. Guaranteed results.", cta: "Order now" },
      faqEmphasis: "Real likes and followers — no bots",
      metaTitle: "Fanovera - +10K Facebook likes in 2h guaranteed",
      metaDescription: "+10K real Facebook likes and followers delivered in 2 hours. Guaranteed results, secure payment.",
      reassurance: "2h delivery - Real profiles - Guaranteed results",
    },
  },
);

// ── LINKEDIN ──

const LINKEDIN = productSurface("LinkedIn",
  {
    wh: {
      hero: { titleBefore: "Une visibilité LinkedIn ", titleHighlight: "ciblée", titleAfter: " et progressive.", subtitle: "Campagnes de visibilité pour profils publics avec audience B2B ciblée.", cta: "Choisir un pack" },
      metaTitle: "Fanovera - Visibilité LinkedIn ciblée",
      metaDescription: "Campagnes de visibilité LinkedIn pour profils publics, avec audience B2B ciblée, suivi clair et aucun mot de passe demandé.",
      reassurance: "Sans engagement · Aucun mot de passe · Démarrage sous 1–6 h",
    },
    gh: {
      hero: { titleBefore: "Boost LinkedIn ", titleHighlight: "rapide", titleAfter: " et suivi.", subtitle: "Profils B2B audités, livraison progressive. Aucun mot de passe.", cta: "Lancer la campagne" },
      metaTitle: "Fanovera - Boost LinkedIn rapide et suivi",
      metaDescription: "Commandez un pack LinkedIn avec lancement rapide, livraison progressive et suivi clair.",
      reassurance: "Sans mot de passe - Livraison progressive - Support inclus",
    },
    bh: {
      hero: { titleBefore: "+5K connexions LinkedIn ", titleHighlight: "en 24h", titleAfter: " — profils B2B réels.", subtitle: "Connexions et followers B2B réels livrés en express. Crédibilité immédiate.", cta: "Commander des connexions" },
      faqEmphasis: "Profils B2B vérifiés — crédibilité immédiate",
      metaTitle: "Fanovera - +5K connexions LinkedIn en 24h garanties",
      metaDescription: "+5K connexions LinkedIn B2B réelles livrées en 24h. Résultats garantis, paiement sécurisé.",
      reassurance: "Livraison 24h - Profils B2B réels - Crédibilité garantie",
    },
  },
  {
    wh: {
      hero: { titleBefore: "Targeted LinkedIn ", titleHighlight: "visibility", titleAfter: ", progressive and clear.", subtitle: "Visibility campaigns for public profiles with targeted B2B audience.", cta: "Choose a pack" },
      metaTitle: "Fanovera - Targeted LinkedIn visibility",
      metaDescription: "LinkedIn visibility campaigns for public profiles, with targeted B2B audience, clear tracking and no password requested.",
      reassurance: "No commitment · No password · Starts in 1–6 h",
    },
    gh: {
      hero: { titleBefore: "Fast LinkedIn ", titleHighlight: "boost", titleAfter: ", tracked and secure.", subtitle: "Audited B2B profiles, progressive delivery. No password needed.", cta: "Launch campaign" },
      metaTitle: "Fanovera - Fast tracked LinkedIn boost",
      metaDescription: "Order a LinkedIn pack with fast launch, progressive delivery and clear tracking.",
      reassurance: "No password - Progressive delivery - Support included",
    },
    bh: {
      hero: { titleBefore: "+5K LinkedIn connections ", titleHighlight: "in 24h", titleAfter: " — real B2B profiles.", subtitle: "Real B2B connections and followers delivered express. Instant credibility.", cta: "Order connections" },
      faqEmphasis: "Verified B2B profiles — instant credibility",
      metaTitle: "Fanovera - +5K LinkedIn connections in 24h guaranteed",
      metaDescription: "+5K real LinkedIn B2B connections delivered in 24h. Guaranteed results, secure payment.",
      reassurance: "24h delivery - Real B2B profiles - Guaranteed credibility",
    },
  },
);

// ── Master copy map ──

export const SURFACE_MARKETING_COPY: Record<
  MarketingSurface,
  Record<SurfaceMarketingMode, Record<CopyLocale, MarketingCopy>>
> = {
  home: HOME,
  promo: PROMO,
  instagram: INSTAGRAM,
  tiktok: TIKTOK,
  twitter: TWITTER,
  twitch: TWITCH,
  youtube: YOUTUBE,
  spotify: SPOTIFY,
  facebook: FACEBOOK,
  linkedin: LINKEDIN,
};

export function getSurfaceMarketingCopy(
  surface: MarketingSurface,
  mode: SurfaceMarketingMode,
  locale: "fr" | "en",
): MarketingCopy {
  return SURFACE_MARKETING_COPY[surface]?.[mode]?.[locale]
    ?? SURFACE_MARKETING_COPY[surface]?.whitehat?.[locale]
    ?? SURFACE_MARKETING_COPY[surface]?.whitehat?.fr;
}
