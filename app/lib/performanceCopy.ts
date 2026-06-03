import type { SupportedLocale } from "../i18n/types";
import { getEffectiveMarketingMode, type MarketingMode } from "./marketingModeTypes";
import type { SurfaceMarketingMode } from "./marketingModeTypes";

type ProductOverrides = {
  locale: SupportedLocale;
  mode: MarketingMode;
  product: string;
  audience: string;
  /** Locale-correct audience label override (e.g. Twitch "Abonnés" vs "Viewers"). */
  audienceLabel?: string;
};

type Pair = readonly [string, string];

function applyPairItems(value: unknown, items: Pair[]) {
  return Array.isArray(value) ? items : value;
}

function objectSection(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

function getAudienceLabel(product: string, locale: SupportedLocale, fallback: string) {
  const labels: Record<string, Record<SupportedLocale, string>> = {
    Instagram: { fr: "Followers", en: "Followers", es: "Seguidores", pt: "Seguidores", de: "Follower", it: "Follower", tr: "Takipçi" },
    TikTok: { fr: "Followers", en: "Followers", es: "Seguidores", pt: "Seguidores", de: "Follower", it: "Follower", tr: "Takipçi" },
    Facebook: { fr: "Followers", en: "Followers", es: "Seguidores", pt: "Seguidores", de: "Follower", it: "Follower", tr: "Takipçi" },
    X: { fr: "Followers", en: "Followers", es: "Seguidores", pt: "Seguidores", de: "Follower", it: "Follower", tr: "Takipçi" },
    YouTube: { fr: "Vues", en: "Views", es: "Vistas", pt: "Visualizações", de: "Aufrufe", it: "Visualizzazioni", tr: "İzlenme" },
    Spotify: { fr: "Écoutes", en: "Streams", es: "Reproducciones", pt: "Streams", de: "Streams", it: "Stream", tr: "Stream" },
    Twitch: { fr: "Viewers", en: "Viewers", es: "Espectadores", pt: "Espectadores", de: "Zuschauer", it: "Spettatori", tr: "İzleyici" },
    LinkedIn: { fr: "Followers", en: "Followers", es: "Seguidores", pt: "Seguidores", de: "Follower", it: "Follower", tr: "Takipçi" },
  };
  return labels[product]?.[locale] || fallback;
}

export function applyPerformancePublicCopy<T extends Record<string, unknown>>(
  locale: SupportedLocale,
  mode: MarketingMode,
  base: T,
): T {
  const effective = getEffectiveMarketingMode(locale, mode);
  if (effective === "promo") return applyPromoPublicCopy(locale, base);
  if (effective !== "performance") return base;

  const hero = objectSection(base.hero);
  const how = objectSection(base.how);
  const testimonials = objectSection(base.testimonials);
  const faq = objectSection(base.faq);
  const cta = objectSection(base.cta);
  const footer = objectSection(base.footer);

  return {
    ...base,
    hero: {
      ...hero,
      newCampaign: loc(locale, { fr: "+ Campagne active", en: "+ Active campaign", es: "+ Campaña activa", pt: "+ Campanha ativa", de: "+ Aktive Kampagne", it: "+ Campagna attiva", tr: "+ Aktif kampanya" }),
      activeNetworks: loc(locale, { fr: "RÉSEAUX PRÊTS", en: "NETWORKS READY", es: "REDES LISTAS", pt: "REDES PRONTAS", de: "NETZWERKE BEREIT", it: "RETI PRONTE", tr: "AĞLAR HAZIR" }),
      campaign: loc(locale, { fr: "Lancement #042", en: "Launch #042", es: "Lanzamiento #042", pt: "Lançamento #042", de: "Start #042", it: "Lancio #042", tr: "Başlatma #042" }),
      campaignMeta: loc(locale, { fr: "Traction progressive - suivi live", en: "Progressive traction - live tracking", es: "Tracción progresiva - seguimiento en vivo", pt: "Tração progressiva - acompanhamento ao vivo", de: "Progressive Traktion - Live-Tracking", it: "Trazione progressiva - monitoraggio live", tr: "Aşamalı çekim - canlı takip" }),
      cardLabel: loc(locale, { fr: "Visibilité rapide", en: "Fast visibility", es: "Visibilidad rápida", pt: "Visibilidade rápida", de: "Schnelle Sichtbarkeit", it: "Visibilità rapida", tr: "Hızlı görünürlük" }),
      cardCta: loc(locale, { fr: "Choisir un réseau", en: "Choose a network", es: "Elegir una red", pt: "Escolher uma rede", de: "Netzwerk wählen", it: "Scegli una rete", tr: "Bir ağ seç" }),
      titleBefore: loc(locale, { fr: "Donnez à votre profil ", en: "Give your profile ", es: "Dale a tu perfil ", pt: "Dê ao seu perfil ", de: "Verleihe deinem Profil ", it: "Dai al tuo profilo ", tr: "Profiline " }),
      titleHighlight: loc(locale, { fr: "le signal social", en: "the social proof", es: "la prueba social", pt: "a prova social", de: "die soziale Bestätigung", it: "la prova sociale", tr: "sosyal kanıtı" }),
      titleAfter: loc(locale, { fr: " qu'il mérite, sans mot de passe.", en: " it deserves, with no password.", es: " que merece, sin contraseña.", pt: " que ele merece, sem senha.", de: " — die es verdient, ohne Passwort.", it: " che merita, senza password.", tr: " hak ettiğini kazandır — şifresiz." }),
      rating: loc(locale, { fr: "4,9/5 par les créateurs", en: "4.9/5 from creators", es: "4,9/5 por los creadores", pt: "4,9/5 pelos criadores", de: "4,9/5 von Creatorn", it: "4,9/5 dai creator", tr: "Yaratıcılardan 4,9/5" }),
      tiktokValue: loc(locale, { fr: "traction", en: "traction", es: "tracción", pt: "tração", de: "Traktion", it: "trazione", tr: "çekim" }),
      spotifyTitle: loc(locale, { fr: "Boost Spotify", en: "Spotify boost", es: "Boost Spotify", pt: "Boost Spotify", de: "Spotify-Boost", it: "Boost Spotify", tr: "Spotify boost" }),
      spotifyMeta: loc(locale, { fr: "écoutes progressives", en: "progressive streams", es: "reproducciones progresivas", pt: "streams progressivos", de: "progressive Streams", it: "stream progressivi", tr: "aşamalı stream'ler" }),
      youtubeTitle: loc(locale, { fr: "Vues YouTube", en: "YouTube views", es: "Vistas YouTube", pt: "Visualizações YouTube", de: "YouTube-Aufrufe", it: "Visualizzazioni YouTube", tr: "YouTube izlenme" }),
      youtubeMeta: loc(locale, { fr: "campagne suivie", en: "tracked campaign", es: "campaña con seguimiento", pt: "campanha acompanhada", de: "verfolgte Kampagne", it: "campagna monitorata", tr: "takip edilen kampanya" }),
    },
    how: {
      ...how,
      eyebrow: loc(locale, { fr: "Comment ça se lance", en: "How it starts", es: "Cómo se lanza", pt: "Como se lança", de: "So startet es", it: "Come si avvia", tr: "Nasıl başlar" }),
      titleBefore: loc(locale, { fr: "Trois étapes pour gagner ", en: "Three steps to gain ", es: "Tres pasos para ganar ", pt: "Três passos para ganhar ", de: "In drei Schritten ", it: "Tre passi per guadagnare ", tr: "Üç adımda " }),
      titleHighlight: loc(locale, { fr: "de la traction", en: "traction", es: "tracción", pt: "tração", de: "Traktion gewinnen", it: "trazione", tr: "çekim kazan" }),
      titleAfter: loc(locale, { fr: " vite et proprement.", en: " quickly and cleanly.", es: " rápido y limpio.", pt: " rápido e limpo.", de: " — schnell und sauber.", it: " velocemente e in modo pulito.", tr: " hızlı ve temiz." }),
      steps: loc<readonly { title: string; body: string }[]>(locale, {
        fr: [
          { title: "Choisissez le réseau", body: "Sélectionnez Instagram, TikTok, YouTube, Spotify ou un autre produit, puis choisissez le volume adapté." },
          { title: "Indiquez le profil public", body: "Aucun mot de passe. On travaille uniquement avec le lien ou l'identifiant public que vous renseignez." },
          { title: "Suivez la livraison", body: "La campagne démarre après paiement, avance progressivement et reste suivie par le support." },
        ],
        en: [
          { title: "Choose the network", body: "Pick Instagram, TikTok, YouTube, Spotify or another product, then select the right volume." },
          { title: "Enter the public profile", body: "No password. We only use the public link or handle you provide." },
          { title: "Track delivery", body: "The campaign starts after payment, progresses gradually and stays monitored by support." },
        ],
        es: [
          { title: "Elige la red", body: "Selecciona Instagram, TikTok, YouTube, Spotify u otro producto, luego elige el volumen adecuado." },
          { title: "Indica el perfil público", body: "Sin contraseña. Trabajamos solo con el enlace o el identificador público que indiques." },
          { title: "Sigue la entrega", body: "La campaña empieza tras el pago, avanza progresivamente y es supervisada por el soporte." },
        ],
        pt: [
          { title: "Escolha a rede", body: "Selecione Instagram, TikTok, YouTube, Spotify ou outro produto, depois escolha o volume adequado." },
          { title: "Indique o perfil público", body: "Sem senha. Trabalhamos apenas com o link ou identificador público que você fornece." },
          { title: "Acompanhe a entrega", body: "A campanha começa após o pagamento, avança progressivamente e fica acompanhada pelo suporte." },
        ],
        de: [
          { title: "Wähle das Netzwerk", body: "Wähle Instagram, TikTok, YouTube, Spotify oder ein anderes Produkt und das passende Volumen." },
          { title: "Gib das öffentliche Profil an", body: "Kein Passwort. Wir arbeiten nur mit dem öffentlichen Link oder Handle, den du angibst." },
          { title: "Verfolge die Lieferung", body: "Die Kampagne startet nach Zahlung, läuft progressiv und wird vom Support überwacht." },
        ],
        it: [
          { title: "Scegli la rete", body: "Seleziona Instagram, TikTok, YouTube, Spotify o un altro prodotto, poi scegli il volume adatto." },
          { title: "Indica il profilo pubblico", body: "Nessuna password. Lavoriamo solo con il link o handle pubblico che fornisci." },
          { title: "Segui la consegna", body: "La campagna inizia dopo il pagamento, avanza progressivamente e resta monitorata dal supporto." },
        ],
        tr: [
          { title: "Ağı seç", body: "Instagram, TikTok, YouTube, Spotify veya başka bir ürün seç, sonra uygun hacmi belirle." },
          { title: "Genel profili belirt", body: "Şifre yok. Sadece sağladığınız herkese açık bağlantı veya kullanıcı adıyla çalışıyoruz." },
          { title: "Teslimatı takip et", body: "Kampanya ödemeden sonra başlar, aşamalı ilerler ve destek tarafından izlenir." },
        ],
      }),
    },
    testimonials: {
      ...testimonials,
      eyebrow: loc(locale, { fr: "Preuve sociale", en: "Social proof", es: "Prueba social", pt: "Prova social", de: "Soziale Bestätigung", it: "Prova sociale", tr: "Sosyal kanıt" }),
      titleBefore: loc(locale, { fr: "Des créateurs qui voulaient ", en: "Creators who wanted ", es: "Creadores que querían ", pt: "Criadores que queriam ", de: "Creator, die ", it: "Creator che volevano ", tr: "Daha fazla momentum isteyen " }),
      titleHighlight: loc(locale, { fr: "passer un cap", en: "more momentum", es: "más impulso", pt: "mais impulso", de: "mehr Momentum wollten", it: "più slancio", tr: "yaratıcılar" }),
      titleAfter: ".",
    },
    faq: {
      ...faq,
      eyebrow: "FAQ",
      titleBefore: loc(locale, { fr: "Avant de lancer, ", en: "Before you launch, ", es: "Antes de lanzar, ", pt: "Antes de lançar, ", de: "Vor dem Start ", it: "Prima di lanciare, ", tr: "Başlatmadan önce, " }),
      titleHighlight: loc(locale, { fr: "les réponses utiles", en: "useful answers", es: "las respuestas útiles", pt: "as respostas úteis", de: "die nützlichen Antworten", it: "le risposte utili", tr: "yararlı cevaplar" }),
      titleAfter: ".",
      items: loc<readonly { q: string; a: string }[]>(locale, {
        fr: [
          { q: "Est-ce que je dois donner mon mot de passe ?", a: "Non. Fanovera demande uniquement un lien ou identifiant public pour préparer la campagne." },
          { q: "Quand la campagne démarre-t-elle ?", a: "Elle démarre après confirmation du paiement, avec une progression suivie pour éviter un pic artificiel." },
          { q: "Puis-je choisir plusieurs réseaux ?", a: "Oui. Vous pouvez lancer un pack sur un réseau puis ajouter d'autres plateformes selon votre objectif." },
          { q: "Que se passe-t-il si le volume n'est pas atteint ?", a: "Le support vérifie la campagne et peut prolonger la livraison sans frais supplémentaires." },
        ],
        en: [
          { q: "Do I need to share my password?", a: "No. Fanovera only asks for a public link or handle to prepare the campaign." },
          { q: "When does the campaign start?", a: "It starts after payment confirmation, with monitored progress to avoid an artificial spike." },
          { q: "Can I choose several networks?", a: "Yes. You can launch one network pack and add other platforms depending on your goal." },
          { q: "What happens if the volume is not reached?", a: "Support reviews the campaign and can extend delivery at no extra cost." },
        ],
        es: [
          { q: "¿Debo darte mi contraseña?", a: "No. Fanovera solo pide un enlace o identificador público para preparar la campaña." },
          { q: "¿Cuándo empieza la campaña?", a: "Empieza tras la confirmación del pago, con un progreso supervisado para evitar un pico artificial." },
          { q: "¿Puedo elegir varias redes?", a: "Sí. Puedes lanzar un pack en una red y luego añadir otras plataformas según tu objetivo." },
          { q: "¿Qué pasa si no se alcanza el volumen?", a: "El soporte revisa la campaña y puede prolongar la entrega sin coste adicional." },
        ],
        pt: [
          { q: "Preciso fornecer minha senha?", a: "Não. A Fanovera pede apenas um link ou identificador público para preparar a campanha." },
          { q: "Quando a campanha começa?", a: "Começa após a confirmação do pagamento, com um progresso acompanhado para evitar um pico artificial." },
          { q: "Posso escolher várias redes?", a: "Sim. Você pode lançar um pack em uma rede e adicionar outras plataformas conforme seu objetivo." },
          { q: "O que acontece se o volume não for atingido?", a: "O suporte revisa a campanha e pode estender a entrega sem custos adicionais." },
        ],
        de: [
          { q: "Muss ich mein Passwort teilen?", a: "Nein. Fanovera benötigt nur einen öffentlichen Link oder Handle, um die Kampagne vorzubereiten." },
          { q: "Wann startet die Kampagne?", a: "Sie startet nach Zahlungsbestätigung, mit überwachtem Fortschritt, um einen künstlichen Peak zu vermeiden." },
          { q: "Kann ich mehrere Netzwerke wählen?", a: "Ja. Du kannst ein Paket in einem Netzwerk starten und je nach Ziel weitere Plattformen ergänzen." },
          { q: "Was passiert, wenn das Volumen nicht erreicht wird?", a: "Der Support prüft die Kampagne und kann die Lieferung kostenlos verlängern." },
        ],
        it: [
          { q: "Devo darti la mia password?", a: "No. Fanovera chiede solo un link o handle pubblico per preparare la campagna." },
          { q: "Quando inizia la campagna?", a: "Inizia dopo la conferma del pagamento, con un avanzamento monitorato per evitare un picco artificiale." },
          { q: "Posso scegliere più reti?", a: "Sì. Puoi lanciare un pacchetto su una rete e poi aggiungere altre piattaforme secondo il tuo obiettivo." },
          { q: "Cosa succede se il volume non viene raggiunto?", a: "Il supporto verifica la campagna e può prolungare la consegna senza costi aggiuntivi." },
        ],
        tr: [
          { q: "Şifremi paylaşmalı mıyım?", a: "Hayır. Fanovera kampanyayı hazırlamak için sadece herkese açık bir bağlantı veya kullanıcı adı ister." },
          { q: "Kampanya ne zaman başlar?", a: "Ödeme onayından sonra başlar, yapay bir tepe noktasını önlemek için ilerleme takip edilir." },
          { q: "Birden fazla ağ seçebilir miyim?", a: "Evet. Bir ağda paket başlatıp hedefine göre başka platformlar ekleyebilirsin." },
          { q: "Hacme ulaşılmazsa ne olur?", a: "Destek kampanyayı inceler ve teslimatı ek ücretsiz uzatabilir." },
        ],
      }),
    },
    cta: {
      ...cta,
      titleBefore: loc(locale, { fr: "Prêt à rendre votre profil ", en: "Ready to make your profile ", es: "¿Listo para hacer tu perfil ", pt: "Pronto para tornar seu perfil ", de: "Bereit, dein Profil ", it: "Pronto a rendere il tuo profilo ", tr: "Profilini " }),
      titleHighlight: loc(locale, { fr: "plus crédible", en: "more credible", es: "más creíble", pt: "mais credível", de: "glaubwürdiger zu machen", it: "più credibile", tr: "daha güvenilir yapmaya" }),
      titleAfter: loc(locale, { fr: " aujourd'hui ?", en: " today?", es: " hoy?", pt: " hoje?", de: " — heute?", it: " oggi?", tr: " hazır mısın bugün?" }),
      body: loc(locale, {
        fr: "Choisissez un réseau, lancez une campagne progressive et suivez chaque étape depuis Fanovera.",
        en: "Choose a network, launch a progressive campaign and track every step from Fanovera.",
        es: "Elige una red, lanza una campaña progresiva y sigue cada paso desde Fanovera.",
        pt: "Escolha uma rede, lance uma campanha progressiva e acompanhe cada etapa pela Fanovera.",
        de: "Wähle ein Netzwerk, starte eine progressive Kampagne und verfolge jeden Schritt über Fanovera.",
        it: "Scegli una rete, lancia una campagna progressiva e segui ogni passo da Fanovera.",
        tr: "Bir ağ seç, aşamalı bir kampanya başlat ve her adımı Fanovera'dan takip et.",
      }),
      footer: loc(locale, { fr: "Sans mot de passe - Paiement sécurisé - Suivi inclus", en: "No password - Secure payment - Tracking included", es: "Sin contraseña - Pago seguro - Seguimiento incluido", pt: "Sem senha - Pagamento seguro - Acompanhamento incluído", de: "Kein Passwort - Sichere Zahlung - Tracking inklusive", it: "Senza password - Pagamento sicuro - Monitoraggio incluso", tr: "Şifresiz - Güvenli ödeme - Takip dahil" }),
    },
    footer: {
      ...footer,
      description: loc(locale, {
        fr: "Campagnes de visibilité pour créateurs, artistes et marques : réseaux sociaux, musique, vidéo et profils publics.",
        en: "Visibility campaigns for creators, artists and brands: social networks, music, video and public profiles.",
        es: "Campañas de visibilidad para creadores, artistas y marcas: redes sociales, música, vídeo y perfiles públicos.",
        pt: "Campanhas de visibilidade para criadores, artistas e marcas: redes sociais, música, vídeo e perfis públicos.",
        de: "Sichtbarkeitskampagnen für Creator, Künstler und Marken: soziale Netzwerke, Musik, Video und öffentliche Profile.",
        it: "Campagne di visibilità per creator, artisti e brand: social network, musica, video e profili pubblici.",
        tr: "Yaratıcılar, sanatçılar ve markalar için görünürlük kampanyaları: sosyal ağlar, müzik, video ve herkese açık profiller.",
      }),
    },
  } as T;
}

export function applyPerformanceProductCopy<T>(
  base: T,
  { locale, mode, product, audience, audienceLabel: audienceLabelOverride }: ProductOverrides,
): T {
  if (getEffectiveMarketingMode(locale, mode) !== "performance") return base;

  const source = objectSection(base);
  const step1 = objectSection(source.step1);
  const step2 = objectSection(source.step2);
  const step3 = objectSection(source.step3);
  const why = objectSection(source.why);
  const faq = objectSection(source.faq);
  const footer = objectSection(source.footer);
  const reviews = objectSection(source.reviews);

  const audienceLabel = audienceLabelOverride || getAudienceLabel(product, locale, audience);
  const lowerAudience = audienceLabel.toLowerCase();

  return {
    ...source,
    step1: {
      ...step1,
      titleBefore: `Boost ${product}`,
      titleFocus: loc(locale, { fr: "rapide", en: "fast", es: "rápido", pt: "rápido", de: "schnell", it: "rapido", tr: "hızlı" }),
      titleAfter: loc(locale, { fr: "et suivi.", en: "and tracked.", es: "y supervisado.", pt: "e acompanhado.", de: "und überwacht.", it: "e monitorato.", tr: "ve takipli." }),
      volume: loc(locale, { fr: "Combien voulez-vous ajouter ?", en: "How much do you want to add?", es: "¿Cuánto quieres añadir?", pt: "Quanto você quer adicionar?", de: "Wie viel möchtest du hinzufügen?", it: "Quanto vuoi aggiungere?", tr: "Ne kadar eklemek istiyorsun?" }),
      audience: audienceLabel,
      selectedPack: loc(locale, { fr: "Pack choisi", en: "Chosen pack", es: "Pack elegido", pt: "Pack escolhido", de: "Gewähltes Paket", it: "Pacchetto scelto", tr: "Seçilen paket" }),
      visibilityPack: loc(locale, {
        fr: `Pack ${product}`,
        en: `${product} pack`,
        es: `Pack ${product}`,
        pt: `Pack ${product}`,
        de: `${product}-Paket`,
        it: `Pacchetto ${product}`,
        tr: `${product} paketi`,
      }),
      continue: loc(locale, { fr: "Lancer la campagne", en: "Launch campaign", es: "Lanzar la campaña", pt: "Lançar campanha", de: "Kampagne starten", it: "Avvia campagna", tr: "Kampanyayı başlat" }),
      reassurance: loc(locale, { fr: "Sans mot de passe - Livraison progressive - Support inclus", en: "No password - Progressive delivery - Support included", es: "Sin contraseña - Entrega progresiva - Soporte incluido", pt: "Sem senha - Entrega progressiva - Suporte incluído", de: "Kein Passwort - Progressive Lieferung - Support inklusive", it: "Senza password - Consegna progressiva - Supporto incluso", tr: "Şifresiz - Aşamalı teslimat - Destek dahil" }),
    },
    step2: {
      ...step2,
      titleBefore: loc(locale, { fr: "Quel profil", en: "Which profile", es: "¿Qué perfil", pt: "Qual perfil", de: "Welches Profil", it: "Quale profilo", tr: "Hangi profili" }),
      titleFocus: loc(locale, { fr: "booster", en: "to boost", es: "impulsar", pt: "impulsionar", de: "pushen", it: "potenziare", tr: "öne çıkar" }),
      titleAfter: "?",
      intro: loc(locale, {
        fr: `Indiquez votre lien ou identifiant ${product} public. Aucun mot de passe, aucun accès au compte.`,
        en: `Enter your public ${product} link or handle. No password, no account access.`,
        es: `Indica el enlace o identificador público de ${product}. Sin contraseña, sin acceso a la cuenta.`,
        pt: `Indique o link ou identificador público de ${product}. Sem senha, sem acesso à conta.`,
        de: `Gib deinen öffentlichen ${product}-Link oder Handle ein. Kein Passwort, kein Kontozugriff.`,
        it: `Indica il tuo link o handle pubblico ${product}. Nessuna password, nessun accesso all'account.`,
        tr: `${product} herkese açık bağlantı veya kullanıcı adınızı belirtin. Şifre yok, hesap erişimi yok.`,
      }),
      pay: loc(locale, { fr: "Continuer vers le paiement", en: "Continue to payment", es: "Continuar al pago", pt: "Continuar para o pagamento", de: "Weiter zur Zahlung", it: "Continua al pagamento", tr: "Ödemeye devam" }),
    },
    step3: {
      ...step3,
      subtitle: loc(locale, {
        fr: "Paiement sécurisé - lancement après confirmation - suivi de livraison inclus.",
        en: "Secure payment - launch after confirmation - delivery tracking included.",
        es: "Pago seguro - lanzamiento tras la confirmación - seguimiento de entrega incluido.",
        pt: "Pagamento seguro - lançamento após confirmação - acompanhamento de entrega incluído.",
        de: "Sichere Zahlung - Start nach Bestätigung - Lieferverfolgung inklusive.",
        it: "Pagamento sicuro - avvio dopo conferma - monitoraggio consegna incluso.",
        tr: "Güvenli ödeme - onaydan sonra başlatma - teslimat takibi dahil.",
      }),
      legalAfter: loc(locale, { fr: "Aucun abonnement caché. Aucun mot de passe demandé.", en: "No hidden subscription. No password requested.", es: "Sin suscripción oculta. Sin contraseña requerida.", pt: "Sem assinatura oculta. Sem senha solicitada.", de: "Kein verstecktes Abonnement. Kein Passwort verlangt.", it: "Nessun abbonamento nascosto. Nessuna password richiesta.", tr: "Gizli abonelik yok. Şifre istenmez." }),
    },
    why: {
      ...why,
      eyebrow: loc(locale, { fr: "Pourquoi ça convertit", en: "Why it converts", es: "Por qué convierte", pt: "Por que converte", de: "Warum es konvertiert", it: "Perché converte", tr: "Neden dönüşüm sağlar" }),
      title1: loc(locale, {
        fr: `${product} plus`,
        en: "More",
        es: `${product} más`,
        pt: `${product} mais`,
        de: `${product} —`,
        it: `${product} più`,
        tr: `${product} daha`,
      }),
      title2: loc(locale, {
        fr: "crédible",
        en: `credible ${product}`,
        es: "creíble",
        pt: "credível",
        de: "glaubwürdiger",
        it: "credibile",
        tr: "güvenilir",
      }),
      title3: loc(locale, { fr: "dès le premier regard.", en: "at first glance.", es: "desde la primera mirada.", pt: "desde o primeiro olhar.", de: "auf den ersten Blick.", it: "al primo sguardo.", tr: "ilk bakışta." }),
      items: applyPairItems(why.items, [
        [
          loc(locale, { fr: "Preuve sociale visible", en: "Visible social proof", es: "Prueba social visible", pt: "Prova social visível", de: "Sichtbare soziale Bestätigung", it: "Prova sociale visibile", tr: "Görünür sosyal kanıt" }),
          loc(locale, {
            fr: `Une présence plus solide aide vos contenus ${product} à paraître plus établis.`,
            en: `A stronger presence helps your ${product} content look more established.`,
            es: `Una presencia más sólida ayuda a que tu contenido de ${product} parezca más establecido.`,
            pt: `Uma presença mais sólida ajuda seu conteúdo de ${product} a parecer mais estabelecido.`,
            de: `Eine stärkere Präsenz lässt deine ${product}-Inhalte etablierter wirken.`,
            it: `Una presenza più solida aiuta i tuoi contenuti ${product} a sembrare più affermati.`,
            tr: `Daha güçlü bir varlık, ${product} içeriklerinizin daha köklü görünmesine yardımcı olur.`,
          }),
        ],
        [
          loc(locale, { fr: "Progression suivie", en: "Tracked progress", es: "Progreso con seguimiento", pt: "Progresso acompanhado", de: "Verfolgter Fortschritt", it: "Progresso monitorato", tr: "Takip edilen ilerleme" }),
          loc(locale, {
            fr: `Les ${lowerAudience} sont ajoutés progressivement avec un suivi clair de la campagne.`,
            en: `${audience} are added progressively with clear campaign tracking.`,
            es: `Los ${lowerAudience} se añaden progresivamente con un seguimiento claro de la campaña.`,
            pt: `Os ${lowerAudience} são adicionados progressivamente com acompanhamento claro da campanha.`,
            de: `${audience} werden progressiv hinzugefügt — mit klarer Kampagnenverfolgung.`,
            it: `I ${lowerAudience} vengono aggiunti progressivamente con un monitoraggio chiaro della campagna.`,
            tr: `${audience} aşamalı olarak eklenir, net kampanya takibi ile.`,
          }),
        ],
        [
          loc(locale, { fr: "Compte protégé", en: "Protected account", es: "Cuenta protegida", pt: "Conta protegida", de: "Geschütztes Konto", it: "Account protetto", tr: "Korunan hesap" }),
          loc(locale, { fr: "Aucun accès au compte, aucune publication à votre place, aucune action directe sur votre profil.", en: "No account access, no posting on your behalf and no direct action on your profile.", es: "Sin acceso a la cuenta, sin publicaciones en tu nombre, sin acciones directas en tu perfil.", pt: "Sem acesso à conta, sem publicações em seu nome, sem ações diretas no seu perfil.", de: "Kein Kontozugriff, keine Beiträge in deinem Namen, keine direkten Aktionen auf deinem Profil.", it: "Nessun accesso all'account, nessuna pubblicazione al tuo posto, nessuna azione diretta sul tuo profilo.", tr: "Hesap erişimi yok, sizin adınıza paylaşım yok, profilinizde doğrudan eylem yok." }),
        ],
        [
          loc(locale, { fr: "Support inclus", en: "Support included", es: "Soporte incluido", pt: "Suporte incluído", de: "Support inklusive", it: "Supporto incluso", tr: "Destek dahil" }),
          loc(locale, { fr: "Si le volume prévu n'est pas atteint, le support vérifie et prolonge la campagne.", en: "If the planned volume is not reached, support reviews and extends the campaign.", es: "Si no se alcanza el volumen previsto, el soporte revisa y prolonga la campaña.", pt: "Se o volume previsto não for atingido, o suporte revisa e estende a campanha.", de: "Wenn das geplante Volumen nicht erreicht wird, prüft und verlängert der Support die Kampagne.", it: "Se il volume previsto non viene raggiunto, il supporto verifica e prolunga la campagna.", tr: "Planlanan hacme ulaşılmazsa, destek kampanyayı inceler ve uzatır." }),
        ],
      ]),
    },
    reviews: {
      ...reviews,
      eyebrow: loc(locale, { fr: "Ils ont gagné en traction", en: "They gained traction", es: "Ganaron tracción", pt: "Ganharam tração", de: "Sie haben an Traktion gewonnen", it: "Hanno guadagnato slancio", tr: "Çekim kazandılar" }),
    },
    faq: {
      ...faq,
      titleBefore: loc(locale, { fr: "Avant de commander,", en: "Before ordering,", es: "Antes de pedir,", pt: "Antes de pedir,", de: "Vor der Bestellung,", it: "Prima di ordinare,", tr: "Sipariş öncesi," }),
      titleFocus: loc(locale, { fr: "l'essentiel", en: "the essentials", es: "lo esencial", pt: "o essencial", de: "das Wesentliche", it: "l'essenziale", tr: "temel bilgiler" }),
      items: applyPairItems(faq.items, [
        [
          loc(locale, { fr: "Dois-je partager mon mot de passe ?", en: "Do I need to share my password?", es: "¿Debo compartir mi contraseña?", pt: "Preciso compartilhar minha senha?", de: "Muss ich mein Passwort teilen?", it: "Devo condividere la mia password?", tr: "Şifremi paylaşmalı mıyım?" }),
          loc(locale, { fr: "Non. Nous demandons seulement un lien ou identifiant public pour lancer la campagne.", en: "No. We only ask for a public link or handle to launch the campaign.", es: "No. Solo pedimos un enlace o identificador público para lanzar la campaña.", pt: "Não. Apenas pedimos um link ou identificador público para lançar a campanha.", de: "Nein. Wir bitten nur um einen öffentlichen Link oder Handle, um die Kampagne zu starten.", it: "No. Chiediamo solo un link o handle pubblico per avviare la campagna.", tr: "Hayır. Kampanyayı başlatmak için sadece herkese açık bir bağlantı veya kullanıcı adı istiyoruz." }),
        ],
        [
          loc(locale, { fr: "Quand la livraison démarre-t-elle ?", en: "When does delivery start?", es: "¿Cuándo empieza la entrega?", pt: "Quando começa a entrega?", de: "Wann startet die Lieferung?", it: "Quando inizia la consegna?", tr: "Teslimat ne zaman başlar?" }),
          loc(locale, { fr: "Après confirmation du paiement. La progression est suivie et peut s'étaler sur plusieurs jours selon le volume.", en: "After payment confirmation. Progress is monitored and can span several days depending on volume.", es: "Tras la confirmación del pago. El progreso se supervisa y puede durar varios días según el volumen.", pt: "Após a confirmação do pagamento. O progresso é acompanhado e pode durar vários dias conforme o volume.", de: "Nach Zahlungsbestätigung. Der Fortschritt wird überwacht und kann je nach Volumen mehrere Tage dauern.", it: "Dopo la conferma del pagamento. L'avanzamento è monitorato e può durare diversi giorni in base al volume.", tr: "Ödeme onayından sonra. İlerleme takip edilir ve hacme göre birkaç gün sürebilir." }),
        ],
        [
          loc(locale, { fr: "Est-ce adapté à un nouveau profil ?", en: "Is it suitable for a new profile?", es: "¿Es adecuado para un perfil nuevo?", pt: "É adequado para um perfil novo?", de: "Ist es für ein neues Profil geeignet?", it: "È adatto a un nuovo profilo?", tr: "Yeni bir profil için uygun mu?" }),
          loc(locale, { fr: "Oui, le but est de renforcer la preuve sociale tout en gardant une progression crédible.", en: "Yes, the goal is to strengthen social proof while keeping progress credible.", es: "Sí, el objetivo es reforzar la prueba social manteniendo un progreso creíble.", pt: "Sim, o objetivo é reforçar a prova social mantendo um progresso credível.", de: "Ja, das Ziel ist, soziale Bestätigung zu stärken — bei glaubwürdigem Fortschritt.", it: "Sì, l'obiettivo è rafforzare la prova sociale mantenendo un progresso credibile.", tr: "Evet, amaç sosyal kanıtı güçlendirmek ve aynı zamanda güvenilir bir ilerleme sağlamak." }),
        ],
        [
          loc(locale, { fr: "Que faire si tout n'est pas livré ?", en: "What if everything is not delivered?", es: "¿Qué hacer si no se entrega todo?", pt: "E se tudo não for entregue?", de: "Was, wenn nicht alles geliefert wird?", it: "Cosa fare se non tutto viene consegnato?", tr: "Her şey teslim edilmezse ne yapmalı?" }),
          loc(locale, { fr: "Le support vérifie la campagne et peut prolonger la livraison sans frais supplémentaires.", en: "Support reviews the campaign and can extend delivery at no extra cost.", es: "El soporte revisa la campaña y puede prolongar la entrega sin coste adicional.", pt: "O suporte revisa a campanha e pode estender a entrega sem custos adicionais.", de: "Der Support prüft die Kampagne und kann die Lieferung kostenlos verlängern.", it: "Il supporto verifica la campagna e può prolungare la consegna senza costi aggiuntivi.", tr: "Destek kampanyayı inceler ve teslimatı ek ücretsiz uzatabilir." }),
        ],
      ]),
    },
    footer: {
      ...footer,
      desc: loc(locale, {
        fr: `Campagnes ${product} avec lancement rapide, livraison progressive et suivi clair.`,
        en: `${product} campaigns with fast launch, progressive delivery and clear tracking.`,
        es: `Campañas ${product} con lanzamiento rápido, entrega progresiva y seguimiento claro.`,
        pt: `Campanhas ${product} com lançamento rápido, entrega progressiva e acompanhamento claro.`,
        de: `${product}-Kampagnen mit schnellem Start, progressiver Lieferung und klarer Nachverfolgung.`,
        it: `Campagne ${product} con avvio rapido, consegna progressiva e monitoraggio chiaro.`,
        tr: `${product} kampanyaları: hızlı başlangıç, aşamalı teslimat ve net takip.`,
      }),
    },
  } as T;
}

/* ─── Promo / Google Ads landing copy ─── */
function applyPromoPublicCopy<T extends Record<string, unknown>>(
  locale: SupportedLocale,
  base: T,
): T {
  const hero = objectSection(base.hero);
  const how = objectSection(base.how);
  const testimonials = objectSection(base.testimonials);
  const faq = objectSection(base.faq);
  const cta = objectSection(base.cta);
  const footer = objectSection(base.footer);

  return {
    ...base,
    hero: {
      ...hero,
      newCampaign: loc(locale, { fr: "Code de bienvenue : FANO5", en: "Welcome code: FANO5", es: "Código de bienvenida: FANO5", pt: "Código de boas-vindas: FANO5", de: "Willkommens-Code: FANO5", it: "Codice di benvenuto: FANO5", tr: "Hoşgeldin kodu: FANO5" }),
      activeNetworks: loc(locale, { fr: "TOUS LES SERVICES", en: "ALL SERVICES", es: "TODOS LOS SERVICIOS", pt: "TODOS OS SERVIÇOS", de: "ALLE DIENSTE", it: "TUTTI I SERVIZI", tr: "TÜM HİZMETLER" }),
      campaign: loc(locale, { fr: "Campagne active", en: "Active campaign", es: "Campaña activa", pt: "Campanha ativa", de: "Aktive Kampagne", it: "Campagna attiva", tr: "Aktif kampanya" }),
      campaignMeta: loc(locale, { fr: "Livraison progressive - suivi live", en: "Progressive delivery - live tracking", es: "Entrega progresiva - seguimiento en vivo", pt: "Entrega progressiva - acompanhamento ao vivo", de: "Progressive Lieferung - Live-Tracking", it: "Consegna progressiva - monitoraggio live", tr: "Aşamalı teslimat - canlı takip" }),
      cardLabel: loc(locale, { fr: "À partir de", en: "Starting at", es: "Desde", pt: "A partir de", de: "Ab", it: "Da", tr: "Şu fiyattan" }),
      // cardCta is overridden at render time in Hero.tsx with the network's
      // lowest pack price. Keep a localized fallback so the type stays valid
      // and any non-promo surface still gets a sensible label.
      cardCta: loc(locale, { fr: "Voir les packs", en: "View packs", es: "Ver packs", pt: "Ver packs", de: "Pakete ansehen", it: "Vedi pacchetti", tr: "Paketler" }),
      titleBefore: loc(locale, { fr: "Optimisez votre ", en: "Optimize your ", es: "Optimiza tu ", pt: "Otimize sua ", de: "Optimiere deine ", it: "Ottimizza la tua ", tr: "Sosyal medyadaki " }),
      titleHighlight: loc(locale, { fr: "visibilité", en: "visibility", es: "visibilidad", pt: "visibilidade", de: "Sichtbarkeit", it: "visibilità", tr: "görünürlüğünü" }),
      titleAfter: loc(locale, { fr: " sur les réseaux sociaux", en: " on social media", es: " en las redes sociales", pt: " nas redes sociais", de: " in sozialen Netzwerken", it: " sui social media", tr: " optimize et" }),
      rating: loc(locale, { fr: "4,9/5 par les créateurs", en: "4.9/5 from creators", es: "4,9/5 por los creadores", pt: "4,9/5 pelos criadores", de: "4,9/5 von Creatorn", it: "4,9/5 dai creator", tr: "Yaratıcılardan 4,9/5" }),
      tiktokValue: loc(locale, { fr: "services", en: "services", es: "servicios", pt: "serviços", de: "Dienste", it: "servizi", tr: "hizmetler" }),
      spotifyTitle: "Spotify",
      spotifyMeta: loc(locale, { fr: "Services", en: "Services", es: "Servicios", pt: "Serviços", de: "Dienste", it: "Servizi", tr: "Hizmetler" }),
      youtubeTitle: "YouTube",
      youtubeMeta: loc(locale, { fr: "Services", en: "Services", es: "Servicios", pt: "Serviços", de: "Dienste", it: "Servizi", tr: "Hizmetler" }),
    },
    how: {
      ...how,
      eyebrow: loc(locale, { fr: "CONFIANCE & TRANSPARENCE", en: "TRUST & TRANSPARENCY", es: "CONFIANZA Y TRANSPARENCIA", pt: "CONFIANÇA E TRANSPARÊNCIA", de: "VERTRAUEN & TRANSPARENZ", it: "FIDUCIA E TRASPARENZA", tr: "GÜVEN & ŞEFFAFLIK" }),
      titleBefore: loc(locale, { fr: "Optimisez votre visibilité digitale avec une ", en: "Optimize your digital visibility with a ", es: "Optimiza tu visibilidad digital con un ", pt: "Otimize sua visibilidade digital com uma ", de: "Optimiere deine digitale Sichtbarkeit mit einem ", it: "Ottimizza la tua visibilità digitale con un ", tr: "Dijital görünürlüğünü " }),
      titleHighlight: loc(locale, { fr: "approche claire", en: "clear approach", es: "enfoque claro", pt: "abordagem clara", de: "klaren Ansatz", it: "approccio chiaro", tr: "net bir yaklaşımla" }),
      titleAfter: ".",
      steps: loc<readonly { title: string; body: string }[]>(locale, {
        fr: [
          { title: "Processus clair et suivi", body: "Des étapes lisibles et un suivi simple pour comprendre ce qui est mis en place, à tout moment." },
          { title: "Aligné avec les règles", body: "Une approche responsable, conçue pour respecter les standards et politiques des plateformes." },
          { title: "Contrôle et flexibilité", body: "Des options ajustables pour garder la main sur vos paramètres et priorités selon vos besoins." },
        ],
        en: [
          { title: "Clear process and tracking", body: "Readable steps and simple tracking to understand what is being done, at any time." },
          { title: "Aligned with platform rules", body: "A responsible approach, designed to respect platform standards and policies." },
          { title: "Control and flexibility", body: "Adjustable options to keep control over your settings and priorities based on your needs." },
        ],
        es: [
          { title: "Proceso claro y seguimiento", body: "Etapas legibles y un seguimiento simple para entender lo que se hace, en todo momento." },
          { title: "Alineado con las reglas", body: "Un enfoque responsable, diseñado para respetar los estándares y políticas de las plataformas." },
          { title: "Control y flexibilidad", body: "Opciones ajustables para mantener el control de tus parámetros y prioridades según tus necesidades." },
        ],
        pt: [
          { title: "Processo claro e acompanhamento", body: "Etapas legíveis e um acompanhamento simples para entender o que está sendo feito, a qualquer momento." },
          { title: "Alinhado com as regras", body: "Uma abordagem responsável, projetada para respeitar os padrões e políticas das plataformas." },
          { title: "Controle e flexibilidade", body: "Opções ajustáveis para manter o controle dos seus parâmetros e prioridades conforme suas necessidades." },
        ],
        de: [
          { title: "Klarer Prozess und Tracking", body: "Lesbare Schritte und einfaches Tracking, um jederzeit zu verstehen, was umgesetzt wird." },
          { title: "Im Einklang mit den Regeln", body: "Ein verantwortungsvoller Ansatz, der die Standards und Richtlinien der Plattformen respektiert." },
          { title: "Kontrolle und Flexibilität", body: "Anpassbare Optionen, damit du Einstellungen und Prioritäten nach deinen Bedürfnissen behältst." },
        ],
        it: [
          { title: "Processo chiaro e monitoraggio", body: "Passaggi leggibili e un monitoraggio semplice per capire cosa viene fatto, in qualsiasi momento." },
          { title: "Allineato con le regole", body: "Un approccio responsabile, progettato per rispettare gli standard e le politiche delle piattaforme." },
          { title: "Controllo e flessibilità", body: "Opzioni regolabili per mantenere il controllo su parametri e priorità in base alle tue esigenze." },
        ],
        tr: [
          { title: "Net süreç ve takip", body: "Okunabilir adımlar ve basit takip ile her an ne yapıldığını anlayın." },
          { title: "Kurallarla uyumlu", body: "Platform standartlarına ve politikalarına saygı gösterecek şekilde tasarlanmış sorumlu bir yaklaşım." },
          { title: "Kontrol ve esneklik", body: "İhtiyaçlarınıza göre parametreler ve öncelikler üzerinde kontrolü korumak için ayarlanabilir seçenekler." },
        ],
      }),
    },
    testimonials: {
      ...testimonials,
      eyebrow: loc(locale, { fr: "Indicateurs lisibles", en: "Readable indicators", es: "Indicadores legibles", pt: "Indicadores legíveis", de: "Lesbare Indikatoren", it: "Indicatori leggibili", tr: "Okunabilir göstergeler" }),
      titleBefore: loc(locale, { fr: "Progression ", en: "Structured ", es: "Progreso ", pt: "Progresso ", de: "Strukturierter ", it: "Progresso ", tr: "Yapılandırılmış " }),
      titleHighlight: loc(locale, { fr: "structurée", en: "progress", es: "estructurado", pt: "estruturado", de: "Fortschritt", it: "strutturato", tr: "ilerleme" }),
      titleAfter: ".",
      stats: [
        { n: "8", l: loc(locale, { fr: "plateformes", en: "platforms", es: "plataformas", pt: "plataformas", de: "Plattformen", it: "piattaforme", tr: "platform" }) },
        { n: loc(locale, { fr: "4,9/5", en: "4.9/5", es: "4,9/5", pt: "4,9/5", de: "4,9/5", it: "4,9/5", tr: "4,9/5" }), l: loc(locale, { fr: "note moyenne", en: "average rating", es: "puntuación media", pt: "avaliação média", de: "Durchschnittsbewertung", it: "valutazione media", tr: "ortalama puan" }) },
        { n: "24/7", l: loc(locale, { fr: "support", en: "support", es: "soporte", pt: "suporte", de: "Support", it: "supporto", tr: "destek" }) },
        { n: "100%", l: loc(locale, { fr: "mesurable", en: "measurable", es: "medible", pt: "mensurável", de: "messbar", it: "misurabile", tr: "ölçülebilir" }) },
      ],
      items: loc<readonly { q: string; n: string; r: string }[]>(locale, {
        fr: [
          { q: "Des repères clairs pour suivre l'évolution et prendre des décisions sur des bases mesurables.", n: "Mesure & Analyse", r: "Indicateurs lisibles" },
          { q: "Une démarche cohérente pour améliorer votre présence en ligne, sans promesses excessives.", n: "Structure & Cohérence", r: "Progression structurée" },
          { q: "Planification claire, paramètres maîtrisés et suivi mesurable pour vos objectifs digitaux.", n: "Clarté & Contrôle", r: "Démarrer simplement" },
        ],
        en: [
          { q: "Clear benchmarks to track progress and make decisions on measurable grounds.", n: "Measure & Analysis", r: "Readable indicators" },
          { q: "A coherent approach to improve your online presence, without excessive promises.", n: "Structure & Coherence", r: "Structured progress" },
          { q: "Clear planning, controlled settings and measurable tracking for your digital goals.", n: "Clarity & Control", r: "Start simply" },
        ],
        es: [
          { q: "Indicadores claros para seguir la evolución y tomar decisiones sobre bases medibles.", n: "Medida y Análisis", r: "Indicadores legibles" },
          { q: "Un enfoque coherente para mejorar tu presencia online, sin promesas excesivas.", n: "Estructura y Coherencia", r: "Progreso estructurado" },
          { q: "Planificación clara, parámetros controlados y seguimiento medible para tus objetivos digitales.", n: "Claridad y Control", r: "Empieza con simplicidad" },
        ],
        pt: [
          { q: "Indicadores claros para acompanhar a evolução e tomar decisões em bases mensuráveis.", n: "Medição e Análise", r: "Indicadores legíveis" },
          { q: "Uma abordagem coerente para melhorar sua presença online, sem promessas excessivas.", n: "Estrutura e Coerência", r: "Progresso estruturado" },
          { q: "Planejamento claro, parâmetros controlados e acompanhamento mensurável para seus objetivos digitais.", n: "Clareza e Controle", r: "Começar simplesmente" },
        ],
        de: [
          { q: "Klare Kennzahlen, um den Fortschritt zu verfolgen und Entscheidungen auf messbarer Grundlage zu treffen.", n: "Messung & Analyse", r: "Lesbare Indikatoren" },
          { q: "Ein kohärenter Ansatz, um deine Online-Präsenz zu verbessern — ohne übertriebene Versprechen.", n: "Struktur & Kohärenz", r: "Strukturierter Fortschritt" },
          { q: "Klare Planung, kontrollierte Einstellungen und messbares Tracking für deine digitalen Ziele.", n: "Klarheit & Kontrolle", r: "Einfach starten" },
        ],
        it: [
          { q: "Indicatori chiari per seguire l'evoluzione e prendere decisioni su basi misurabili.", n: "Misura e Analisi", r: "Indicatori leggibili" },
          { q: "Un approccio coerente per migliorare la tua presenza online, senza promesse eccessive.", n: "Struttura e Coerenza", r: "Progresso strutturato" },
          { q: "Pianificazione chiara, parametri controllati e monitoraggio misurabile per i tuoi obiettivi digitali.", n: "Chiarezza e Controllo", r: "Inizia semplicemente" },
        ],
        tr: [
          { q: "Gelişimi takip etmek ve ölçülebilir temellerde kararlar almak için net göstergeler.", n: "Ölçüm & Analiz", r: "Okunabilir göstergeler" },
          { q: "Online varlığınızı geliştirmek için tutarlı bir yaklaşım, abartılı vaatler olmadan.", n: "Yapı & Tutarlılık", r: "Yapılandırılmış ilerleme" },
          { q: "Dijital hedefleriniz için net planlama, kontrollü parametreler ve ölçülebilir takip.", n: "Netlik & Kontrol", r: "Basit başla" },
        ],
      }),
    },
    faq: {
      ...faq,
      eyebrow: loc(locale, { fr: "À QUI CELA CONVIENT ?", en: "WHO IS THIS FOR?", es: "¿A QUIÉN VA DIRIGIDO?", pt: "PARA QUEM É?", de: "FÜR WEN IST DAS?", it: "A CHI È RIVOLTO?", tr: "KİMLER İÇİN?" }),
      titleBefore: loc(locale, { fr: "Conçu pour ceux qui veulent ", en: "Designed for those who want ", es: "Diseñado para quienes quieren ", pt: "Projetado para quem deseja ", de: "Für alle, die ", it: "Pensato per chi vuole ", tr: "İsteyenler için tasarlandı: " }),
      titleHighlight: loc(locale, { fr: "une visibilité durable", en: "lasting visibility", es: "una visibilidad duradera", pt: "uma visibilidade duradoura", de: "nachhaltige Sichtbarkeit", it: "una visibilità duratura", tr: "kalıcı görünürlük" }),
      titleAfter: ".",
      items: loc<readonly { q: string; a: string }[]>(locale, {
        fr: [
          { q: "Marques cherchant une visibilité durable en ligne", a: "Une approche structurée pour développer votre présence sur les réseaux sociaux de manière cohérente et mesurable." },
          { q: "Créateurs et entreprises voulant structurer leur présence digitale", a: "Des outils et un accompagnement pour organiser vos publications, cibler votre audience et suivre vos progrès." },
          { q: "Projets souhaitant une approche claire et responsable", a: "Une méthodologie basée sur les données, durable et alignée avec les règles des plateformes." },
        ],
        en: [
          { q: "Brands seeking lasting online visibility", a: "A structured approach to grow your social media presence in a consistent and measurable way." },
          { q: "Creators and businesses wanting to structure their digital presence", a: "Tools and guidance to organize your posts, target your audience and track your progress." },
          { q: "Projects looking for a clear and responsible approach", a: "A data-driven methodology, sustainable and aligned with platform rules." },
        ],
        es: [
          { q: "Marcas que buscan una visibilidad duradera online", a: "Un enfoque estructurado para desarrollar tu presencia en redes sociales de forma coherente y medible." },
          { q: "Creadores y empresas que quieren estructurar su presencia digital", a: "Herramientas y acompañamiento para organizar tus publicaciones, segmentar tu audiencia y seguir tus progresos." },
          { q: "Proyectos que buscan un enfoque claro y responsable", a: "Una metodología basada en los datos, sostenible y alineada con las reglas de las plataformas." },
        ],
        pt: [
          { q: "Marcas em busca de visibilidade duradoura online", a: "Uma abordagem estruturada para desenvolver sua presença nas redes sociais de forma coerente e mensurável." },
          { q: "Criadores e empresas que querem estruturar sua presença digital", a: "Ferramentas e acompanhamento para organizar suas publicações, segmentar sua audiência e acompanhar seus progressos." },
          { q: "Projetos buscando uma abordagem clara e responsável", a: "Uma metodologia baseada em dados, sustentável e alinhada com as regras das plataformas." },
        ],
        de: [
          { q: "Marken auf der Suche nach nachhaltiger Online-Sichtbarkeit", a: "Ein strukturierter Ansatz, um deine Präsenz in sozialen Netzwerken kohärent und messbar zu entwickeln." },
          { q: "Creator und Unternehmen, die ihre digitale Präsenz strukturieren möchten", a: "Tools und Begleitung, um deine Beiträge zu organisieren, deine Zielgruppe anzusprechen und deine Fortschritte zu verfolgen." },
          { q: "Projekte mit einem klaren und verantwortungsvollen Ansatz", a: "Eine datengetriebene Methodik, nachhaltig und im Einklang mit den Regeln der Plattformen." },
        ],
        it: [
          { q: "Brand alla ricerca di visibilità duratura online", a: "Un approccio strutturato per sviluppare la tua presenza sui social media in modo coerente e misurabile." },
          { q: "Creator e aziende che vogliono strutturare la loro presenza digitale", a: "Strumenti e accompagnamento per organizzare le tue pubblicazioni, mirare alla tua audience e seguire i tuoi progressi." },
          { q: "Progetti che cercano un approccio chiaro e responsabile", a: "Una metodologia basata sui dati, sostenibile e allineata con le regole delle piattaforme." },
        ],
        tr: [
          { q: "Kalıcı online görünürlük arayan markalar", a: "Sosyal medya varlığınızı tutarlı ve ölçülebilir bir şekilde geliştirmek için yapılandırılmış bir yaklaşım." },
          { q: "Dijital varlıklarını yapılandırmak isteyen yaratıcılar ve şirketler", a: "Paylaşımlarınızı organize etmek, kitlenizi hedeflemek ve ilerlemenizi takip etmek için araçlar ve rehberlik." },
          { q: "Net ve sorumlu bir yaklaşım arayan projeler", a: "Veriye dayalı, sürdürülebilir ve platform kurallarına uygun bir metodoloji." },
        ],
      }),
      contactText: loc(locale, { fr: "Une question ? Contactez-nous", en: "A question? Contact us", es: "¿Una pregunta? Contáctanos", pt: "Uma pergunta? Fale conosco", de: "Eine Frage? Kontaktiere uns", it: "Una domanda? Contattaci", tr: "Sorunuz mu var? Bize ulaşın" }),
    },
    cta: {
      ...cta,
      titleBefore: loc(locale, { fr: "Prêt à optimiser votre ", en: "Ready to optimize your ", es: "¿Listo para optimizar tu ", pt: "Pronto para otimizar sua ", de: "Bereit, deine ", it: "Pronto a ottimizzare la tua ", tr: "Görünürlüğünü " }),
      titleHighlight: loc(locale, { fr: "visibilité", en: "visibility", es: "visibilidad", pt: "visibilidade", de: "Sichtbarkeit zu optimieren", it: "visibilità", tr: "optimize etmeye" }),
      titleAfter: loc(locale, { fr: " dès aujourd'hui ?", en: " today?", es: " hoy mismo?", pt: " hoje?", de: " — heute?", it: " oggi?", tr: " bugün hazır mısın?" }),
      body: loc(locale, {
        fr: "Choisissez votre réseau, utilisez le code FANO5 et lancez votre campagne de visibilité.",
        en: "Choose your network, use code FANO5 and launch your visibility campaign.",
        es: "Elige tu red, usa el código FANO5 y lanza tu campaña de visibilidad.",
        pt: "Escolha sua rede, use o código FANO5 e lance sua campanha de visibilidade.",
        de: "Wähle dein Netzwerk, nutze den Code FANO5 und starte deine Sichtbarkeitskampagne.",
        it: "Scegli la tua rete, usa il codice FANO5 e avvia la tua campagna di visibilità.",
        tr: "Ağını seç, FANO5 kodunu kullan ve görünürlük kampanyanı başlat.",
      }),
      footer: loc(locale, { fr: "-5% avec le code FANO5 - Paiement sécurisé - Suivi inclus", en: "-5% with code FANO5 - Secure payment - Tracking included", es: "-5% con el código FANO5 - Pago seguro - Seguimiento incluido", pt: "-5% com o código FANO5 - Pagamento seguro - Acompanhamento incluído", de: "-5% mit Code FANO5 - Sichere Zahlung - Tracking inklusive", it: "-5% con il codice FANO5 - Pagamento sicuro - Monitoraggio incluso", tr: "FANO5 koduyla -5% - Güvenli ödeme - Takip dahil" }),
    },
    footer: {
      ...footer,
      description: loc(locale, {
        fr: "Campagnes de visibilité pour créateurs, artistes et marques sur tous les réseaux sociaux.",
        en: "Visibility campaigns for creators, artists and brands across all social networks.",
        es: "Campañas de visibilidad para creadores, artistas y marcas en todas las redes sociales.",
        pt: "Campanhas de visibilidade para criadores, artistas e marcas em todas as redes sociais.",
        de: "Sichtbarkeitskampagnen für Creator, Künstler und Marken in allen sozialen Netzwerken.",
        it: "Campagne di visibilità per creator, artisti e brand su tutti i social network.",
        tr: "Yaratıcılar, sanatçılar ve markalar için tüm sosyal ağlarda görünürlük kampanyaları.",
      }),
    },
  } as T;
}

/* ─── Blackhat copy — aggressive "acheter des abonnés" theme ─── */

type BlackhatProductOverrides = {
  locale: SupportedLocale;
  product: string;
  audience: string;
  /** Full locale-correct audience phrase override, e.g. "abonnés Twitch" / "viewers Twitch". */
  bhAudience?: string;
  /** Short locale-correct noun for the "X 100% réels" bullet, e.g. "Abonnés" / "Viewers". */
  audienceNoun?: string;
};

const BH_AUDIENCES: Record<string, Record<SupportedLocale, string>> = {
  Instagram: { fr: "followers Instagram", en: "Instagram followers", es: "seguidores de Instagram", pt: "seguidores Instagram", de: "Instagram-Follower", it: "follower Instagram", tr: "Instagram takipçisi" },
  TikTok: { fr: "followers TikTok", en: "TikTok followers", es: "seguidores de TikTok", pt: "seguidores TikTok", de: "TikTok-Follower", it: "follower TikTok", tr: "TikTok takipçisi" },
  Facebook: { fr: "likes Facebook", en: "Facebook likes", es: "me gusta de Facebook", pt: "curtidas Facebook", de: "Facebook-Likes", it: "mi piace Facebook", tr: "Facebook beğenisi" },
  X: { fr: "followers X", en: "X followers", es: "seguidores de X", pt: "seguidores X", de: "X-Follower", it: "follower X", tr: "X takipçisi" },
  YouTube: { fr: "vues YouTube", en: "YouTube views", es: "vistas de YouTube", pt: "visualizações YouTube", de: "YouTube-Aufrufe", it: "visualizzazioni YouTube", tr: "YouTube izlenmesi" },
  Spotify: { fr: "streams & followers Spotify", en: "Spotify streams & followers", es: "streams y seguidores de Spotify", pt: "streams e seguidores Spotify", de: "Spotify Streams & Follower", it: "stream e follower Spotify", tr: "Spotify stream ve takipçileri" },
  Twitch: { fr: "viewers Twitch", en: "Twitch viewers", es: "espectadores de Twitch", pt: "espectadores Twitch", de: "Twitch-Zuschauer", it: "spettatori Twitch", tr: "Twitch izleyicisi" },
  LinkedIn: { fr: "connexions LinkedIn", en: "LinkedIn connections", es: "conexiones de LinkedIn", pt: "conexões LinkedIn", de: "LinkedIn-Kontakte", it: "connessioni LinkedIn", tr: "LinkedIn bağlantısı" },
};

/** Pick the right translation for `locale`, fallback to EN. */
function loc<T>(locale: SupportedLocale, table: Record<SupportedLocale, T>): T {
  return table[locale] ?? table.en;
}

/* ─── Universal "no commitment / no subscription" FAQ entry ───
 * Appended to every product's FAQ in every marketing mode (clean / greyhat /
 * blackhat) via appendNoCommitmentFaq(), called at the end of each product hook
 * so it post-processes the final copy whatever mode produced it. */
const NO_COMMITMENT_FAQ: Record<SupportedLocale, readonly [string, string]> = {
  fr: ["Y a-t-il un engagement ou un abonnement ?", "Non, aucun. C'est un paiement unique, sans engagement ni abonnement caché : vous payez une seule fois, c'est tout."],
  en: ["Is there any commitment or subscription?", "None at all. It's a one-time payment — no commitment and no hidden subscription. You pay once, that's it."],
  es: ["¿Hay algún compromiso o suscripción?", "Ninguno. Es un pago único, sin compromiso ni suscripción oculta: pagas una sola vez y listo."],
  pt: ["Existe algum compromisso ou assinatura?", "Nenhum. É um pagamento único, sem compromisso nem assinatura oculta: você paga uma vez e pronto."],
  de: ["Gibt es eine Verpflichtung oder ein Abo?", "Nein, keine. Es ist eine einmalige Zahlung – keine Verpflichtung, kein verstecktes Abo. Du zahlst einmal, fertig."],
  it: ["C'è un impegno o un abbonamento?", "Nessuno. È un pagamento unico, senza impegno né abbonamento nascosto: paghi una volta e basta."],
  tr: ["Herhangi bir taahhüt veya abonelik var mı?", "Hayır, hiç yok. Tek seferlik bir ödeme — taahhüt yok, gizli abonelik yok. Bir kez ödersin, o kadar."],
};

export function appendNoCommitmentFaq<T>(copy: T, locale: SupportedLocale): T {
  const source = objectSection(copy);
  const faq = objectSection(source.faq);
  const items = Array.isArray(faq.items) ? (faq.items as unknown[]) : [];
  const qa = NO_COMMITMENT_FAQ[locale] || NO_COMMITMENT_FAQ.en;
  if (items.some((it) => Array.isArray(it) && it[0] === qa[0])) return copy; // idempotent
  return { ...source, faq: { ...faq, items: [...items, qa] } } as T;
}

export function applyBlackhatProductCopy<T>(
  base: T,
  surfaceMode: SurfaceMarketingMode,
  { locale, product, audience, bhAudience: bhAudienceOverride, audienceNoun }: BlackhatProductOverrides,
): T {
  if (surfaceMode !== "blackhat") return base;

  const source = objectSection(base);
  const step1 = objectSection(source.step1);
  const step2 = objectSection(source.step2);
  const step3 = objectSection(source.step3);
  const why = objectSection(source.why);
  const faq = objectSection(source.faq);
  const footer = objectSection(source.footer);
  const reviews = objectSection(source.reviews);

  const bhAudience = bhAudienceOverride || BH_AUDIENCES[product]?.[locale] || audience.toLowerCase();
  const isSpotify = product === "Spotify";
  const isYouTube = product === "YouTube";

  // why.items[0]: "Real followers/streams" + description that differs for Spotify and YouTube
  const realsFirstTitle = audienceNoun
    ? ({
        fr: `${audienceNoun} 100% réels`,
        en: `100% real ${audienceNoun.toLowerCase()}`,
        es: `${audienceNoun} 100% reales`,
        pt: `${audienceNoun} 100% reais`,
        de: `100% echte ${audienceNoun}`,
        it: `${audienceNoun} 100% reali`,
        tr: `%100 gerçek ${audienceNoun.toLowerCase()}`,
      }[locale] ?? `100% real ${audienceNoun.toLowerCase()}`)
    : loc(locale, {
        fr: isSpotify ? "Streams & followers réels" : "Abonnés 100% réels",
        en: isSpotify ? "Real streams & followers" : "100% real followers",
        es: isSpotify ? "Streams y seguidores reales" : "Seguidores 100% reales",
        pt: isSpotify ? "Streams e seguidores reais" : "Seguidores 100% reais",
        de: isSpotify ? "Echte Streams & Follower" : "100% echte Follower",
        it: isSpotify ? "Stream e follower reali" : "Follower 100% reali",
        tr: isSpotify ? "Gerçek stream ve takipçiler" : "%100 gerçek takipçiler",
      });
  const realsFirstBody = audienceNoun
    ? ({
        fr: "Chaque profil livré est réel, avec photo, bio et activité récente.",
        en: "Every delivered profile is real, with a photo, bio and recent activity.",
        es: "Cada perfil entregado es real, con foto, biografía y actividad reciente.",
        pt: "Cada perfil entregue é real, com foto, bio e atividade recente.",
        de: "Jedes gelieferte Profil ist echt — mit Foto, Bio und aktueller Aktivität.",
        it: "Ogni profilo consegnato è reale, con foto, bio e attività recente.",
        tr: "Teslim edilen her profil gerçek; fotoğraf, biyografi ve güncel aktiviteyle.",
      }[locale] ?? "Every delivered profile is real, with a photo, bio and recent activity.")
    : loc(locale, {
    fr: isSpotify
      ? "Chaque écoute et chaque follower provient d'un compte réel avec activité récente."
      : `Chaque ${isYouTube ? "vue" : "abonné"} est un profil réel avec photo, bio et activité récente.`,
    en: isSpotify
      ? "Every stream and follower comes from a real account with recent activity."
      : `Every ${isYouTube ? "view" : "follower"} is a real profile with a photo, bio and recent activity.`,
    es: isSpotify
      ? "Cada reproducción y cada seguidor proviene de una cuenta real con actividad reciente."
      : `Cada ${isYouTube ? "visualización" : "seguidor"} es un perfil real con foto, biografía y actividad reciente.`,
    pt: isSpotify
      ? "Cada stream e cada seguidor vem de uma conta real com atividade recente."
      : `Cada ${isYouTube ? "visualização" : "seguidor"} é um perfil real com foto, bio e atividade recente.`,
    de: isSpotify
      ? "Jeder Stream und jeder Follower stammt von einem echten Konto mit aktueller Aktivität."
      : `Jede${isYouTube ? "r Aufruf" : "r Follower"} ist ein echtes Profil mit Foto, Bio und aktueller Aktivität.`,
    it: isSpotify
      ? "Ogni stream e ogni follower proviene da un account reale con attività recente."
      : `Ogni ${isYouTube ? "visualizzazione" : "follower"} è un profilo reale con foto, bio e attività recente.`,
    tr: isSpotify
      ? "Her stream ve her takipçi, son zamanlarda aktif olan gerçek bir hesaptan gelir."
      : `Her ${isYouTube ? "izlenme" : "takipçi"} fotoğraflı, biyografili ve son zamanlarda aktif gerçek bir profildir.`,
  });

  // FAQ items: 4 Q/A pairs, differ for Spotify
  const faqItems: Pair[] = isSpotify
    ? [
        [
          loc(locale, { fr: "Les streams et followers sont-ils réels ?", en: "Are the streams and followers real?", es: "¿Los streams y seguidores son reales?", pt: "Os streams e seguidores são reais?", de: "Sind die Streams und Follower echt?", it: "Gli stream e i follower sono reali?", tr: "Stream ve takipçiler gerçek mi?" }),
          loc(locale, { fr: "Oui, 100% de comptes réels et actifs. Aucun bot. Vérifiable directement sur votre profil Spotify.", en: "Yes, 100% real and active accounts. No bots. Verifiable directly on your Spotify profile.", es: "Sí, 100% cuentas reales y activas. Sin bots. Verificable directamente en tu perfil de Spotify.", pt: "Sim, 100% contas reais e ativas. Sem bots. Verificável diretamente no seu perfil do Spotify.", de: "Ja, 100% echte und aktive Konten. Keine Bots. Direkt in deinem Spotify-Profil überprüfbar.", it: "Sì, 100% di account reali e attivi. Nessun bot. Verificabile direttamente sul tuo profilo Spotify.", tr: "Evet, %100 gerçek ve aktif hesaplar. Bot yok. Spotify profilinizden doğrudan doğrulanabilir." }),
        ],
        [
          loc(locale, { fr: "En combien de temps je reçois ?", en: "How fast is the delivery?", es: "¿En cuánto tiempo recibo?", pt: "Em quanto tempo recebo?", de: "Wie schnell erhalte ich die Lieferung?", it: "In quanto tempo ricevo?", tr: "Ne kadar sürede alırım?" }),
          loc(locale, { fr: "La livraison démarre immédiatement et se termine en 1 à 6 heures selon le volume commandé.", en: "Delivery starts immediately and completes within 1 to 6 hours depending on the volume ordered.", es: "La entrega empieza de inmediato y termina en 1 a 6 horas según el volumen pedido.", pt: "A entrega começa imediatamente e termina em 1 a 6 horas conforme o volume pedido.", de: "Die Lieferung startet sofort und ist je nach Bestellvolumen in 1 bis 6 Stunden abgeschlossen.", it: "La consegna inizia immediatamente e termina in 1-6 ore in base al volume ordinato.", tr: "Teslimat hemen başlar ve sipariş hacmine göre 1-6 saat içinde tamamlanır." }),
        ],
        [
          loc(locale, { fr: "Mon compte risque-t-il quelque chose ?", en: "Is my account at risk?", es: "¿Mi cuenta corre algún riesgo?", pt: "Minha conta corre algum risco?", de: "Riskiert mein Konto etwas?", it: "Il mio account è a rischio?", tr: "Hesabım risk altında mı?" }),
          loc(locale, { fr: "Non. Nous n'avons pas accès à votre compte. La livraison est externe et progressive.", en: "No. We don't have access to your account. Delivery is external and progressive.", es: "No. No tenemos acceso a tu cuenta. La entrega es externa y progresiva.", pt: "Não. Não temos acesso à sua conta. A entrega é externa e progressiva.", de: "Nein. Wir haben keinen Zugriff auf dein Konto. Die Lieferung erfolgt extern und progressiv.", it: "No. Non abbiamo accesso al tuo account. La consegna è esterna e progressiva.", tr: "Hayır. Hesabınıza erişimimiz yok. Teslimat dışsal ve kademeli." }),
        ],
        [
          loc(locale, { fr: "Que se passe-t-il si les streams ou followers baissent ?", en: "What if streams or followers drop?", es: "¿Qué pasa si los streams o seguidores bajan?", pt: "O que acontece se os streams ou seguidores caírem?", de: "Was passiert, wenn Streams oder Follower zurückgehen?", it: "Cosa succede se stream o follower scendono?", tr: "Stream veya takipçi düşerse ne olur?" }),
          loc(locale, { fr: "Garantie relivraison 30 jours. Si le compteur baisse, on recharge gratuitement.", en: "30-day redelivery guarantee. If the count drops, we top up for free.", es: "Garantía de reposición 30 días. Si el contador baja, recargamos gratis.", pt: "Garantia de reposição 30 dias. Se o contador cair, recarregamos grátis.", de: "30-Tage-Nachlieferungsgarantie. Bei Rückgang füllen wir kostenlos auf.", it: "Garanzia rifornimento 30 giorni. Se il contatore scende, ricarichiamo gratis.", tr: "30 gün yeniden teslim garantisi. Sayı düşerse ücretsiz yeniden yükleriz." }),
        ],
      ]
    : [
        [
          loc(locale, { fr: "Les abonnés sont-ils réels ?", en: "Are the followers real?", es: "¿Los seguidores son reales?", pt: "Os seguidores são reais?", de: "Sind die Follower echt?", it: "I follower sono reali?", tr: "Takipçiler gerçek mi?" }),
          loc(locale, { fr: "Oui, 100% de profils réels et actifs. Aucun bot, aucun faux compte. Vérifiable directement sur votre profil.", en: "Yes, 100% real and active profiles. No bots, no fake accounts. Verifiable directly on your profile.", es: "Sí, 100% perfiles reales y activos. Sin bots ni cuentas falsas. Verificable directamente en tu perfil.", pt: "Sim, 100% perfis reais e ativos. Sem bots, sem contas falsas. Verificável diretamente no seu perfil.", de: "Ja, 100% echte und aktive Profile. Keine Bots, keine Fake-Konten. Direkt in deinem Profil überprüfbar.", it: "Sì, 100% di profili reali e attivi. Nessun bot, nessun account falso. Verificabile direttamente sul tuo profilo.", tr: "Evet, %100 gerçek ve aktif profiller. Bot veya sahte hesap yok. Profilinizden doğrudan doğrulanabilir." }),
        ],
        [
          loc(locale, { fr: "En combien de temps je reçois ?", en: "How fast is the delivery?", es: "¿En cuánto tiempo recibo?", pt: "Em quanto tempo recebo?", de: "Wie schnell erhalte ich die Lieferung?", it: "In quanto tempo ricevo?", tr: "Ne kadar sürede alırım?" }),
          loc(locale, { fr: "La livraison démarre immédiatement et se termine en 1 à 6 heures selon le volume commandé.", en: "Delivery starts immediately and completes within 1 to 6 hours depending on the volume ordered.", es: "La entrega empieza de inmediato y termina en 1 a 6 horas según el volumen pedido.", pt: "A entrega começa imediatamente e termina em 1 a 6 horas conforme o volume pedido.", de: "Die Lieferung startet sofort und ist je nach Bestellvolumen in 1 bis 6 Stunden abgeschlossen.", it: "La consegna inizia immediatamente e termina in 1-6 ore in base al volume ordinato.", tr: "Teslimat hemen başlar ve sipariş hacmine göre 1-6 saat içinde tamamlanır." }),
        ],
        [
          loc(locale, { fr: "Mon compte risque-t-il quelque chose ?", en: "Is my account at risk?", es: "¿Mi cuenta corre algún riesgo?", pt: "Minha conta corre algum risco?", de: "Riskiert mein Konto etwas?", it: "Il mio account è a rischio?", tr: "Hesabım risk altında mı?" }),
          loc(locale, { fr: "Non. Nous n'avons pas accès à votre compte. La livraison est externe et progressive.", en: "No. We don't have access to your account. Delivery is external and progressive.", es: "No. No tenemos acceso a tu cuenta. La entrega es externa y progresiva.", pt: "Não. Não temos acesso à sua conta. A entrega é externa e progressiva.", de: "Nein. Wir haben keinen Zugriff auf dein Konto. Die Lieferung erfolgt extern und progressiv.", it: "No. Non abbiamo accesso al tuo account. La consegna è esterna e progressiva.", tr: "Hayır. Hesabınıza erişimimiz yok. Teslimat dışsal ve kademeli." }),
        ],
        [
          loc(locale, { fr: "Que se passe-t-il si les abonnés partent ?", en: "What if followers drop?", es: "¿Qué pasa si los seguidores se van?", pt: "O que acontece se os seguidores saírem?", de: "Was passiert, wenn Follower zurückgehen?", it: "Cosa succede se i follower diminuiscono?", tr: "Takipçiler giderse ne olur?" }),
          loc(locale, { fr: "Garantie relivraison 30 jours. Si le compteur baisse, on recharge gratuitement.", en: "30-day redelivery guarantee. If the count drops, we top up for free.", es: "Garantía de reposición 30 días. Si el contador baja, recargamos gratis.", pt: "Garantia de reposição 30 dias. Se o contador cair, recarregamos grátis.", de: "30-Tage-Nachlieferungsgarantie. Bei Rückgang füllen wir kostenlos auf.", it: "Garanzia rifornimento 30 giorni. Se il contatore scende, ricarichiamo gratis.", tr: "30 gün yeniden teslim garantisi. Sayı düşerse ücretsiz yeniden yükleriz." }),
        ],
      ];

  return {
    ...source,
    step1: {
      ...step1,
      titleBefore: loc(locale, {
        fr: `Acheter des ${bhAudience} — `,
        en: `Buy ${bhAudience} — `,
        es: `Comprar ${bhAudience} — `,
        pt: `Comprar ${bhAudience} — `,
        de: `${bhAudience} kaufen — `,
        it: `Comprare ${bhAudience} — `,
        tr: `${bhAudience} satın al — `,
      }),
      titleFocus: loc(locale, { fr: "livraison express", en: "express delivery", es: "entrega rápida", pt: "entrega rápida", de: "Express-Lieferung", it: "consegna rapida", tr: "hızlı teslimat" }),
      titleAfter: loc(locale, { fr: " garantie.", en: " guaranteed.", es: " garantizada.", pt: " garantida.", de: " garantiert.", it: " garantita.", tr: " garantili." }),
      volume: loc(locale, { fr: "Combien voulez-vous acheter ?", en: "How many do you want to buy?", es: "¿Cuántos quieres comprar?", pt: "Quantos você quer comprar?", de: "Wie viele möchtest du kaufen?", it: "Quanti vuoi comprare?", tr: "Kaç tane satın almak istiyorsun?" }),
      audience: audienceNoun || audience,
      selectedPack: loc(locale, { fr: "Pack choisi", en: "Chosen pack", es: "Pack elegido", pt: "Pack escolhido", de: "Gewähltes Paket", it: "Pacchetto scelto", tr: "Seçilen paket" }),
      visibilityPack: bhAudience,
      continue: loc(locale, { fr: "Commander maintenant", en: "Order now", es: "Pedir ahora", pt: "Pedir agora", de: "Jetzt bestellen", it: "Ordina ora", tr: "Şimdi sipariş ver" }),
      reassurance: audienceNoun
        ? ({
            fr: `Livraison express · ${audienceNoun} réels actifs · Garantie relivraison 30j`,
            en: `Express delivery · Real active ${audienceNoun.toLowerCase()} · 30-day redelivery guarantee`,
            es: `Entrega rápida · ${audienceNoun} reales activos · Garantía de reposición 30 días`,
            pt: `Entrega rápida · ${audienceNoun} reais ativos · Garantia de reposição 30 dias`,
            de: `Express-Lieferung · Echte aktive ${audienceNoun} · 30-Tage-Nachlieferungsgarantie`,
            it: `Consegna rapida · ${audienceNoun} reali attivi · Garanzia rifornimento 30 giorni`,
            tr: `Hızlı teslimat · Gerçek aktif ${audienceNoun.toLowerCase()} · 30 gün yeniden teslim garantisi`,
          }[locale] ?? `Express delivery · Real active ${audienceNoun.toLowerCase()} · 30-day redelivery guarantee`)
        : loc(locale, {
        fr: isSpotify ? "Livraison express · Streams & followers réels · Garantie relivraison 30j" : "Livraison express · Abonnés réels actifs · Garantie relivraison 30j",
        en: isSpotify ? "Express delivery · Real streams & followers · 30-day redelivery guarantee" : "Express delivery · Real active followers · 30-day redelivery guarantee",
        es: isSpotify ? "Entrega rápida · Streams y seguidores reales · Garantía de reposición 30 días" : "Entrega rápida · Seguidores reales activos · Garantía de reposición 30 días",
        pt: isSpotify ? "Entrega rápida · Streams e seguidores reais · Garantia de reposição 30 dias" : "Entrega rápida · Seguidores reais ativos · Garantia de reposição 30 dias",
        de: isSpotify ? "Express-Lieferung · Echte Streams & Follower · 30-Tage-Nachlieferungsgarantie" : "Express-Lieferung · Echte aktive Follower · 30-Tage-Nachlieferungsgarantie",
        it: isSpotify ? "Consegna rapida · Stream e follower reali · Garanzia rifornimento 30 giorni" : "Consegna rapida · Follower reali attivi · Garanzia rifornimento 30 giorni",
        tr: isSpotify ? "Hızlı teslimat · Gerçek stream ve takipçiler · 30 gün yeniden teslim garantisi" : "Hızlı teslimat · Gerçek aktif takipçiler · 30 gün yeniden teslim garantisi",
      }),
    },
    step2: {
      ...step2,
      titleBefore: loc(locale, { fr: "Sur quel compte livrer les", en: "Which account to deliver", es: "¿A qué cuenta entregar los", pt: "Para qual conta entregar os", de: "An welches Konto liefern wir die", it: "A quale account consegnare i", tr: "Hangi hesaba teslim edelim" }),
      titleFocus: bhAudience,
      titleAfter: "?",
      intro: loc(locale, {
        fr: `Entrez votre identifiant ${product}. Aucun mot de passe requis. Livraison en quelques heures.`,
        en: `Enter your ${product} handle. No password required. Delivery in hours.`,
        es: `Introduce tu nombre de usuario de ${product}. Sin contraseña. Entrega en pocas horas.`,
        pt: `Insira seu usuário do ${product}. Sem senha. Entrega em poucas horas.`,
        de: `Gib deinen ${product}-Handle ein. Kein Passwort nötig. Lieferung in wenigen Stunden.`,
        it: `Inserisci il tuo handle ${product}. Nessuna password. Consegna in poche ore.`,
        tr: `${product} kullanıcı adınızı girin. Şifre gerekmez. Birkaç saatte teslimat.`,
      }),
      pay: loc(locale, { fr: "Payer et recevoir", en: "Pay and receive", es: "Pagar y recibir", pt: "Pagar e receber", de: "Bezahlen und erhalten", it: "Paga e ricevi", tr: "Öde ve al" }),
    },
    step3: {
      ...step3,
      subtitle: loc(locale, { fr: "Paiement sécurisé · livraison express après confirmation · résultats garantis.", en: "Secure payment · express delivery after confirmation · guaranteed results.", es: "Pago seguro · entrega rápida tras confirmación · resultados garantizados.", pt: "Pagamento seguro · entrega rápida após confirmação · resultados garantidos.", de: "Sichere Zahlung · Express-Lieferung nach Bestätigung · garantierte Ergebnisse.", it: "Pagamento sicuro · consegna rapida dopo conferma · risultati garantiti.", tr: "Güvenli ödeme · onaydan sonra hızlı teslimat · garantili sonuçlar." }),
      legalAfter: loc(locale, { fr: "Aucun abonnement caché. Résultats garantis ou relivraison offerte.", en: "No hidden subscription. Guaranteed results or free redelivery.", es: "Sin suscripción oculta. Resultados garantizados o reposición gratuita.", pt: "Sem assinatura oculta. Resultados garantidos ou reposição grátis.", de: "Kein verstecktes Abonnement. Garantierte Ergebnisse oder kostenlose Nachlieferung.", it: "Nessun abbonamento nascosto. Risultati garantiti o rifornimento gratuito.", tr: "Gizli abonelik yok. Garantili sonuçlar veya ücretsiz yeniden teslim." }),
    },
    why: {
      ...why,
      eyebrow: loc(locale, { fr: "Pourquoi nous choisir", en: "Why choose us", es: "Por qué elegirnos", pt: "Por que nos escolher", de: "Warum uns wählen", it: "Perché sceglierci", tr: "Neden bizi seçmelisin" }),
      title1: loc(locale, {
        fr: `Des ${bhAudience}`,
        en: `Real ${bhAudience}`,
        es: `${bhAudience.charAt(0).toUpperCase()}${bhAudience.slice(1)}`,
        pt: `${bhAudience.charAt(0).toUpperCase()}${bhAudience.slice(1)}`,
        de: `Echte ${bhAudience}`,
        it: `${bhAudience.charAt(0).toUpperCase()}${bhAudience.slice(1)}`,
        tr: `${bhAudience.charAt(0).toLocaleUpperCase("tr-TR")}${bhAudience.slice(1)}`,
      }),
      title2: loc(locale, { fr: "réels et actifs", en: "active and engaged", es: "reales y activos", pt: "reais e ativos", de: "aktiv und engagiert", it: "reali e attivi", tr: "gerçek ve aktif" }),
      title3: loc(locale, { fr: "livrés en quelques heures.", en: "delivered in hours.", es: "entregados en pocas horas.", pt: "entregues em poucas horas.", de: "in wenigen Stunden geliefert.", it: "consegnati in poche ore.", tr: "birkaç saatte teslim." }),
      items: applyPairItems(why.items, [
        [realsFirstTitle, realsFirstBody],
        [
          loc(locale, { fr: "Livraison express", en: "Express delivery", es: "Entrega rápida", pt: "Entrega rápida", de: "Express-Lieferung", it: "Consegna rapida", tr: "Hızlı teslimat" }),
          loc(locale, {
            fr: `Vos ${bhAudience} sont livrés en 1 à 6 heures après paiement, avec suivi en temps réel.`,
            en: `Your ${bhAudience} are delivered within 1 to 6 hours after payment, with real-time tracking.`,
            es: `Tus ${bhAudience} se entregan en 1 a 6 horas tras el pago, con seguimiento en tiempo real.`,
            pt: `Seus ${bhAudience} são entregues em 1 a 6 horas após o pagamento, com acompanhamento em tempo real.`,
            de: `Deine ${bhAudience} werden 1 bis 6 Stunden nach Zahlung mit Echtzeit-Tracking geliefert.`,
            it: `I tuoi ${bhAudience} vengono consegnati in 1-6 ore dopo il pagamento, con monitoraggio in tempo reale.`,
            tr: `${bhAudience} ödemeden sonra 1-6 saat içinde gerçek zamanlı takip ile teslim edilir.`,
          }),
        ],
        [
          loc(locale, { fr: "Garantie 30 jours", en: "30-day guarantee", es: "Garantía 30 días", pt: "Garantia 30 dias", de: "30-Tage-Garantie", it: "Garanzia 30 giorni", tr: "30 gün garanti" }),
          loc(locale, { fr: "Si le nombre baisse dans les 30 jours, on recharge automatiquement et gratuitement.", en: "If the count drops within 30 days, we automatically top up for free.", es: "Si el número baja en 30 días, reponemos automáticamente y gratis.", pt: "Se o número cair em 30 dias, recarregamos automaticamente e grátis.", de: "Wenn die Zahl innerhalb von 30 Tagen sinkt, füllen wir kostenlos automatisch auf.", it: "Se il numero scende entro 30 giorni, ricarichiamo automaticamente e gratis.", tr: "Sayı 30 gün içinde düşerse otomatik olarak ücretsiz yeniden yükleriz." }),
        ],
        [
          loc(locale, { fr: "Paiement sécurisé", en: "Secure payment", es: "Pago seguro", pt: "Pagamento seguro", de: "Sichere Zahlung", it: "Pagamento sicuro", tr: "Güvenli ödeme" }),
          loc(locale, { fr: "Stripe, Apple Pay, Google Pay. Transaction chiffrée. Aucune donnée stockée.", en: "Stripe, Apple Pay, Google Pay. Encrypted transaction. No data stored.", es: "Stripe, Apple Pay, Google Pay. Transacción cifrada. Sin datos almacenados.", pt: "Stripe, Apple Pay, Google Pay. Transação criptografada. Sem dados armazenados.", de: "Stripe, Apple Pay, Google Pay. Verschlüsselte Transaktion. Keine Daten gespeichert.", it: "Stripe, Apple Pay, Google Pay. Transazione crittografata. Nessun dato memorizzato.", tr: "Stripe, Apple Pay, Google Pay. Şifreli işlem. Veri saklanmaz." }),
        ],
      ]),
    },
    reviews: {
      ...reviews,
      eyebrow: loc(locale, { fr: "Résultats prouvés", en: "Proven results", es: "Resultados probados", pt: "Resultados comprovados", de: "Bewiesene Ergebnisse", it: "Risultati comprovati", tr: "Kanıtlanmış sonuçlar" }),
    },
    faq: {
      ...faq,
      titleBefore: loc(locale, { fr: "Questions sur l'achat de", en: "Questions about buying", es: "Preguntas sobre la compra de", pt: "Perguntas sobre a compra de", de: "Fragen zum Kauf von", it: "Domande sull'acquisto di", tr: "Satın alma hakkında sorular —" }),
      titleFocus: bhAudience,
      items: applyPairItems(faq.items, faqItems),
    },
    footer: {
      ...footer,
      desc: loc(locale, {
        fr: `Acheter des ${bhAudience} réels — livraison express, paiement sécurisé, résultats garantis.`,
        en: `Buy real ${bhAudience} — express delivery, secure payment, guaranteed results.`,
        es: `Comprar ${bhAudience} reales — entrega rápida, pago seguro, resultados garantizados.`,
        pt: `Comprar ${bhAudience} reais — entrega rápida, pagamento seguro, resultados garantidos.`,
        de: `Echte ${bhAudience} kaufen — Express-Lieferung, sichere Zahlung, garantierte Ergebnisse.`,
        it: `Comprare ${bhAudience} reali — consegna rapida, pagamento sicuro, risultati garantiti.`,
        tr: `Gerçek ${bhAudience} satın al — hızlı teslimat, güvenli ödeme, garantili sonuçlar.`,
      }),
    },
  } as T;
}

export function applyBlackhatPublicCopy<T extends Record<string, unknown>>(
  locale: SupportedLocale,
  surfaceMode: SurfaceMarketingMode,
  base: T,
): T {
  if (surfaceMode !== "blackhat") return base;

  const hero = objectSection(base.hero);
  const how = objectSection(base.how);
  const testimonials = objectSection(base.testimonials);
  const faq = objectSection(base.faq);
  const cta = objectSection(base.cta);
  const footer = objectSection(base.footer);

  return {
    ...base,
    hero: {
      ...hero,
      newCampaign: loc(locale, { fr: "🔥 Livraison express", en: "🔥 Express delivery", es: "🔥 Entrega rápida", pt: "🔥 Entrega rápida", de: "🔥 Express-Lieferung", it: "🔥 Consegna rapida", tr: "🔥 Hızlı teslimat" }),
      activeNetworks: loc(locale, { fr: "TOUS LES RÉSEAUX", en: "ALL NETWORKS", es: "TODAS LAS REDES", pt: "TODAS AS REDES", de: "ALLE NETZWERKE", it: "TUTTE LE RETI", tr: "TÜM AĞLAR" }),
      campaign: loc(locale, { fr: "Commande #042", en: "Order #042", es: "Pedido #042", pt: "Pedido #042", de: "Bestellung #042", it: "Ordine #042", tr: "Sipariş #042" }),
      campaignMeta: loc(locale, { fr: "Livraison en cours - résultats garantis", en: "Delivery in progress - guaranteed results", es: "Entrega en curso - resultados garantizados", pt: "Entrega em curso - resultados garantidos", de: "Lieferung läuft - garantierte Ergebnisse", it: "Consegna in corso - risultati garantiti", tr: "Teslimat sürüyor - garantili sonuçlar" }),
      cardLabel: loc(locale, { fr: "Acheter maintenant", en: "Buy now", es: "Comprar ahora", pt: "Comprar agora", de: "Jetzt kaufen", it: "Compra ora", tr: "Şimdi satın al" }),
      cardCta: loc(locale, { fr: "Voir les packs", en: "View packs", es: "Ver packs", pt: "Ver packs", de: "Pakete ansehen", it: "Vedi i pacchetti", tr: "Paketleri gör" }),
      titleBefore: loc(locale, { fr: "Achetez des abonnés réels — ", en: "Buy real followers — ", es: "Compra seguidores reales — ", pt: "Compre seguidores reais — ", de: "Echte Follower kaufen — ", it: "Compra follower reali — ", tr: "Gerçek takipçi satın al — " }),
      titleHighlight: loc(locale, { fr: "+10K garantis", en: "+10K guaranteed", es: "+10K garantizados", pt: "+10K garantidos", de: "+10K garantiert", it: "+10K garantiti", tr: "+10K garantili" }),
      titleAfter: loc(locale, { fr: " en quelques heures.", en: " in hours.", es: " en pocas horas.", pt: " em poucas horas.", de: " in wenigen Stunden.", it: " in poche ore.", tr: " birkaç saatte." }),
      rating: loc(locale, { fr: "4,9/5 · 2 348 avis", en: "4.9/5 · 2,348 reviews", es: "4,9/5 · 2.348 reseñas", pt: "4,9/5 · 2.348 avaliações", de: "4,9/5 · 2.348 Bewertungen", it: "4,9/5 · 2.348 recensioni", tr: "4,9/5 · 2.348 yorum" }),
      tiktokValue: "+10K",
      spotifyTitle: loc(locale, { fr: "Streams Spotify", en: "Spotify streams", es: "Streams de Spotify", pt: "Streams Spotify", de: "Spotify Streams", it: "Stream Spotify", tr: "Spotify stream" }),
      spotifyMeta: loc(locale, { fr: "livraison express", en: "express delivery", es: "entrega rápida", pt: "entrega rápida", de: "Express-Lieferung", it: "consegna rapida", tr: "hızlı teslimat" }),
      youtubeTitle: loc(locale, { fr: "Vues YouTube", en: "YouTube views", es: "Vistas YouTube", pt: "Visualizações YouTube", de: "YouTube-Aufrufe", it: "Visualizzazioni YouTube", tr: "YouTube izlenme" }),
      youtubeMeta: loc(locale, { fr: "résultats garantis", en: "guaranteed results", es: "resultados garantizados", pt: "resultados garantidos", de: "garantierte Ergebnisse", it: "risultati garantiti", tr: "garantili sonuçlar" }),
    },
    how: {
      ...how,
      eyebrow: loc(locale, { fr: "Comment ça marche", en: "How it works", es: "Cómo funciona", pt: "Como funciona", de: "So funktioniert es", it: "Come funziona", tr: "Nasıl çalışır" }),
      titleBefore: loc(locale, { fr: "Trois étapes pour recevoir vos ", en: "Three steps to receive your ", es: "Tres pasos para recibir tus ", pt: "Três passos para receber seus ", de: "In drei Schritten zu deinen ", it: "Tre passi per ricevere i tuoi ", tr: "Üç adımda gerçek takipçilerini al — " }),
      titleHighlight: loc(locale, { fr: "abonnés réels", en: "real followers", es: "seguidores reales", pt: "seguidores reais", de: "echten Followern", it: "follower reali", tr: "gerçek takipçiler" }),
      titleAfter: ".",
      steps: loc<readonly { title: string; body: string }[]>(locale, {
        fr: [
          { title: "Choisissez le réseau et le volume", body: "Instagram, TikTok, YouTube, Spotify et plus. Sélectionnez le pack adapté à votre objectif." },
          { title: "Entrez votre identifiant", body: "Aucun mot de passe demandé. On livre directement sur votre profil public en quelques heures." },
          { title: "Recevez vos abonnés", body: "Livraison express garantie. Profils 100% réels. Garantie relivraison 30 jours si perte." },
        ],
        en: [
          { title: "Choose the network and volume", body: "Instagram, TikTok, YouTube, Spotify and more. Select the pack that fits your goal." },
          { title: "Enter your handle", body: "No password needed. We deliver directly to your public profile within hours." },
          { title: "Receive your followers", body: "Guaranteed express delivery. 100% real profiles. 30-day redelivery guarantee if any drop." },
        ],
        es: [
          { title: "Elige la red y el volumen", body: "Instagram, TikTok, YouTube, Spotify y más. Selecciona el pack adaptado a tu objetivo." },
          { title: "Introduce tu nombre de usuario", body: "Sin contraseña. Entregamos directamente en tu perfil público en pocas horas." },
          { title: "Recibe tus seguidores", body: "Entrega rápida garantizada. Perfiles 100% reales. Garantía de reposición 30 días si caen." },
        ],
        pt: [
          { title: "Escolha a rede e o volume", body: "Instagram, TikTok, YouTube, Spotify e mais. Selecione o pack adaptado ao seu objetivo." },
          { title: "Insira seu usuário", body: "Sem senha. Entregamos diretamente no seu perfil público em poucas horas." },
          { title: "Receba seus seguidores", body: "Entrega rápida garantida. Perfis 100% reais. Garantia de reposição 30 dias se cair." },
        ],
        de: [
          { title: "Wähle Netzwerk und Volumen", body: "Instagram, TikTok, YouTube, Spotify und mehr. Wähle das passende Paket für dein Ziel." },
          { title: "Gib deinen Handle ein", body: "Kein Passwort nötig. Wir liefern direkt auf dein öffentliches Profil in wenigen Stunden." },
          { title: "Erhalte deine Follower", body: "Garantierte Express-Lieferung. 100% echte Profile. 30-Tage-Nachlieferungsgarantie bei Verlust." },
        ],
        it: [
          { title: "Scegli la rete e il volume", body: "Instagram, TikTok, YouTube, Spotify e altri. Seleziona il pacchetto adatto al tuo obiettivo." },
          { title: "Inserisci il tuo handle", body: "Nessuna password. Consegniamo direttamente sul tuo profilo pubblico in poche ore." },
          { title: "Ricevi i tuoi follower", body: "Consegna rapida garantita. Profili 100% reali. Garanzia rifornimento 30 giorni in caso di perdita." },
        ],
        tr: [
          { title: "Ağı ve hacmi seç", body: "Instagram, TikTok, YouTube, Spotify ve daha fazlası. Hedefine uygun paketi seç." },
          { title: "Kullanıcı adını gir", body: "Şifre gerekmez. Genel profiline birkaç saat içinde doğrudan teslim ederiz." },
          { title: "Takipçilerini al", body: "Garantili hızlı teslimat. %100 gerçek profiller. Kayıp durumunda 30 gün yeniden teslim garantisi." },
        ],
      }),
    },
    testimonials: {
      ...testimonials,
      eyebrow: loc(locale, { fr: "Résultats prouvés", en: "Proven results", es: "Resultados probados", pt: "Resultados comprovados", de: "Bewiesene Ergebnisse", it: "Risultati comprovati", tr: "Kanıtlanmış sonuçlar" }),
      titleBefore: loc(locale, { fr: "Des milliers de clients ", en: "Thousands of clients ", es: "Miles de clientes ", pt: "Milhares de clientes ", de: "Tausende zufriedener ", it: "Migliaia di clienti ", tr: "Binlerce müşteri " }),
      titleHighlight: loc(locale, { fr: "satisfaits", en: "satisfied", es: "satisfechos", pt: "satisfeitos", de: "Kunden", it: "soddisfatti", tr: "memnun" }),
      titleAfter: ".",
    },
    faq: {
      ...faq,
      eyebrow: "FAQ",
      titleBefore: loc(locale, { fr: "Questions sur l'achat ", en: "Questions about buying ", es: "Preguntas sobre la compra ", pt: "Perguntas sobre a compra ", de: "Fragen zum Kauf ", it: "Domande sull'acquisto ", tr: "Takipçi alımı hakkında " }),
      titleHighlight: loc(locale, { fr: "d'abonnés", en: "followers", es: "de seguidores", pt: "de seguidores", de: "von Followern", it: "di follower", tr: "sorular" }),
      titleAfter: ".",
      items: loc<readonly { q: string; a: string }[]>(locale, {
        fr: [
          { q: "Les abonnés sont-ils réels ?", a: "Oui, 100% de profils réels et actifs avec photo, bio et activité. Aucun bot." },
          { q: "En combien de temps je reçois ?", a: "Livraison en 1 à 6 heures selon le volume. Progression visible en temps réel sur votre profil." },
          { q: "Mon compte risque-t-il quelque chose ?", a: "Non. Nous n'avons aucun accès à votre compte. La livraison est 100% externe." },
          { q: "Que se passe-t-il si les abonnés partent ?", a: "Garantie relivraison 30 jours incluse. On recharge automatiquement et gratuitement." },
        ],
        en: [
          { q: "Are the followers real?", a: "Yes, 100% real and active profiles with photos, bios and activity. No bots." },
          { q: "How fast is the delivery?", a: "Delivery within 1 to 6 hours depending on volume. Progress visible in real time on your profile." },
          { q: "Is my account at risk?", a: "No. We have no access to your account. Delivery is 100% external." },
          { q: "What if followers drop?", a: "30-day redelivery guarantee included. We automatically top up for free." },
        ],
        es: [
          { q: "¿Los seguidores son reales?", a: "Sí, 100% perfiles reales y activos con foto, bio y actividad. Sin bots." },
          { q: "¿En cuánto tiempo recibo?", a: "Entrega en 1 a 6 horas según el volumen. Progreso visible en tiempo real en tu perfil." },
          { q: "¿Mi cuenta corre algún riesgo?", a: "No. No tenemos acceso a tu cuenta. La entrega es 100% externa." },
          { q: "¿Qué pasa si los seguidores se van?", a: "Garantía de reposición 30 días incluida. Recargamos automáticamente y gratis." },
        ],
        pt: [
          { q: "Os seguidores são reais?", a: "Sim, 100% perfis reais e ativos com foto, bio e atividade. Sem bots." },
          { q: "Em quanto tempo recebo?", a: "Entrega em 1 a 6 horas conforme o volume. Progresso visível em tempo real no seu perfil." },
          { q: "Minha conta corre algum risco?", a: "Não. Não temos acesso à sua conta. A entrega é 100% externa." },
          { q: "O que acontece se os seguidores saírem?", a: "Garantia de reposição 30 dias incluída. Recarregamos automaticamente e grátis." },
        ],
        de: [
          { q: "Sind die Follower echt?", a: "Ja, 100% echte und aktive Profile mit Foto, Bio und Aktivität. Keine Bots." },
          { q: "Wie schnell erhalte ich die Lieferung?", a: "Lieferung in 1 bis 6 Stunden je nach Volumen. Fortschritt in Echtzeit auf deinem Profil sichtbar." },
          { q: "Riskiert mein Konto etwas?", a: "Nein. Wir haben keinen Zugriff auf dein Konto. Die Lieferung ist 100% extern." },
          { q: "Was passiert, wenn Follower zurückgehen?", a: "30-Tage-Nachlieferungsgarantie inklusive. Wir füllen automatisch und kostenlos auf." },
        ],
        it: [
          { q: "I follower sono reali?", a: "Sì, 100% di profili reali e attivi con foto, bio e attività. Nessun bot." },
          { q: "In quanto tempo ricevo?", a: "Consegna in 1-6 ore in base al volume. Avanzamento visibile in tempo reale sul tuo profilo." },
          { q: "Il mio account è a rischio?", a: "No. Non abbiamo accesso al tuo account. La consegna è 100% esterna." },
          { q: "Cosa succede se i follower diminuiscono?", a: "Garanzia rifornimento 30 giorni inclusa. Ricarichiamo automaticamente e gratis." },
        ],
        tr: [
          { q: "Takipçiler gerçek mi?", a: "Evet, %100 gerçek ve aktif profiller, fotoğraf, biyografi ve aktivite ile. Bot yok." },
          { q: "Ne kadar sürede alırım?", a: "Hacme göre 1-6 saatte teslimat. Profilinde gerçek zamanlı ilerleme görünür." },
          { q: "Hesabım risk altında mı?", a: "Hayır. Hesabınıza erişimimiz yok. Teslimat %100 dışsal." },
          { q: "Takipçiler giderse ne olur?", a: "30 gün yeniden teslim garantisi dahil. Otomatik olarak ücretsiz yeniden yükleriz." },
        ],
      }),
    },
    cta: {
      ...cta,
      titleBefore: loc(locale, { fr: "Prêt à acheter des ", en: "Ready to buy ", es: "¿Listo para comprar ", pt: "Pronto para comprar ", de: "Bereit, ", it: "Pronto a comprare ", tr: "Gerçek takipçi " }),
      titleHighlight: loc(locale, { fr: "abonnés réels", en: "real followers", es: "seguidores reales", pt: "seguidores reais", de: "echte Follower zu kaufen", it: "follower reali", tr: "satın almaya" }),
      titleAfter: loc(locale, { fr: " maintenant ?", en: " now?", es: " ahora?", pt: " agora?", de: " — jetzt?", it: " ora?", tr: " hazır mısın?" }),
      body: loc(locale, {
        fr: "Choisissez un réseau, passez commande et recevez vos abonnés en quelques heures. Paiement sécurisé, résultats garantis.",
        en: "Choose a network, place your order and receive your followers within hours. Secure payment, guaranteed results.",
        es: "Elige una red, haz tu pedido y recibe tus seguidores en pocas horas. Pago seguro, resultados garantizados.",
        pt: "Escolha uma rede, faça seu pedido e receba seus seguidores em poucas horas. Pagamento seguro, resultados garantidos.",
        de: "Wähle ein Netzwerk, gib deine Bestellung auf und erhalte deine Follower in wenigen Stunden. Sichere Zahlung, garantierte Ergebnisse.",
        it: "Scegli una rete, ordina e ricevi i tuoi follower in poche ore. Pagamento sicuro, risultati garantiti.",
        tr: "Bir ağ seç, sipariş ver ve takipçilerini birkaç saatte al. Güvenli ödeme, garantili sonuçlar.",
      }),
      footer: loc(locale, {
        fr: "Livraison express · Profils réels · Garantie 30 jours · Paiement sécurisé",
        en: "Express delivery · Real profiles · 30-day guarantee · Secure payment",
        es: "Entrega rápida · Perfiles reales · Garantía 30 días · Pago seguro",
        pt: "Entrega rápida · Perfis reais · Garantia 30 dias · Pagamento seguro",
        de: "Express-Lieferung · Echte Profile · 30-Tage-Garantie · Sichere Zahlung",
        it: "Consegna rapida · Profili reali · Garanzia 30 giorni · Pagamento sicuro",
        tr: "Hızlı teslimat · Gerçek profiller · 30 gün garanti · Güvenli ödeme",
      }),
    },
    footer: {
      ...footer,
      description: loc(locale, {
        fr: "Acheter des abonnés réels pour Instagram, TikTok, YouTube, Spotify et plus. Livraison express garantie.",
        en: "Buy real followers for Instagram, TikTok, YouTube, Spotify and more. Guaranteed express delivery.",
        es: "Comprar seguidores reales para Instagram, TikTok, YouTube, Spotify y más. Entrega rápida garantizada.",
        pt: "Comprar seguidores reais para Instagram, TikTok, YouTube, Spotify e mais. Entrega rápida garantida.",
        de: "Echte Follower für Instagram, TikTok, YouTube, Spotify und mehr kaufen. Garantierte Express-Lieferung.",
        it: "Comprare follower reali per Instagram, TikTok, YouTube, Spotify e altri. Consegna rapida garantita.",
        tr: "Instagram, TikTok, YouTube, Spotify ve daha fazlası için gerçek takipçi satın al. Garantili hızlı teslimat.",
      }),
    },
  } as T;
}
