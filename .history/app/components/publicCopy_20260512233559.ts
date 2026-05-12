import { deepTranslateCopy } from "../i18n/deepTranslate";
import type { SupportedLocale } from "../i18n/types";

type PublicCopy = {
  header: {
    track: string;
    faq: string;
    contact: string;
    start: string;
  };
  hero: {
    stars: { q: string; a: string }[];
    newCampaign: string;
    menu: string[];
    activeNetworks: string;
    campaign: string;
    campaignMeta: string;
    stats: { l: string; v: string; d: string }[];
    chartTitle: string;
    cardLabel: string;
    cardCta: string;
    titleBefore: string;
    titleHighlight: string;
    titleAfter: string;
    rating: string;
    reviews: string;
    tiktokLabel: string;
    tiktokValue: string;
    spotifyTitle: string;
    spotifyMeta: string;
    reviewsMeta: string;
    youtubeTitle: string;
    youtubeMeta: string;
  };
  how: {
    eyebrow: string;
    titleBefore: string;
    titleHighlight: string;
    titleAfter: string;
    steps: { title: string; body: string }[];
  };
  testimonials: {
    eyebrow: string;
    titleBefore: string;
    titleHighlight: string;
    titleAfter: string;
    stats: { n: string; l: string }[];
    items: { q: string; n: string; r: string }[];
  };
  faq: {
    eyebrow: string;
    titleBefore: string;
    titleHighlight: string;
    titleAfter: string;
    items: { q: string; a: string }[];
    contactText: string;
  };
  cta: {
    titleBefore: string;
    titleHighlight: string;
    titleAfter: string;
    body: string;
    footer: string;
  };
  footer: {
    description: string;
    product: string;
    company: string;
    links: {
      how: string;
      track: string;
      testimonials: string;
      faq: string;
      legal: string;
      terms: string;
      privacy: string;
      contact: string;
    };
    madeIn: string;
  };
  chat: {
    invalidEmail: string;
    shortMessage: string;
    retry: string;
    networkRetry: string;
    open: string;
    question: string;
    sentHeader: string;
    online: string;
    greeting: string;
    emailLabel: string;
    continue: string;
    messageLabel: string;
    messagePlaceholder: string;
    sending: string;
    send: string;
    thanks: string;
    reply: (email: string) => string;
    close: string;
    privacy: string;
  };
  order: {
    confirmError: string;
    unexpected: string;
    title: string;
    thanks: string;
    finalizing: string;
    verifying: string;
    fallbackError: string;
    track: (id: string) => string;
    home: string;
  };
  track: {
    notFound: string;
    unexpected: string;
    title: string;
    loading: string;
    summary: (id: number, platform: string, status: string) => string;
    delivered: string;
    remaining: string;
  };
};

export const PUBLIC_COPY: Record<SupportedLocale, PublicCopy> = {
  fr: {
    header: { track: "Suivi", faq: "FAQ", contact: "Contact", start: "Commencer" },
    hero: {
      stars: [
        { q: "Audit clair et plan actionnable", a: "Lea M., musicienne" },
        { q: "Service serieux, suivi lisible", a: "Karim T., fondateur DTC" },
        { q: "Un vrai cadre pour publier mieux", a: "Studio Metrique" },
      ],
      newCampaign: "+ Nouvelle campagne",
      menu: ["Tableau de bord", "Campagnes", "Audience IA", "Statistiques", "Reseaux", "Facturation"],
      activeNetworks: "RESEAUX ACTIFS",
      campaign: "Campagne #042",
      campaignMeta: "Active - Jour 18 sur 30",
      stats: [
        { l: "Audit", v: "32 pts", d: "priorises" },
        { l: "Contenus", v: "18 idees", d: "pretes" },
        { l: "Planning", v: "30 j", d: "cadence" },
      ],
      chartTitle: "Plan de visibilite - 30 jours",
      cardLabel: "Audit et strategie",
      cardCta: "Voir la solution",
      titleBefore: "Une presence en ligne ",
      titleHighlight: "plus claire",
      titleAfter: ", sans promesses artificielles.",
      rating: "Note 4,9/5",
      reviews: "2 348 avis",
      tiktokLabel: "TIKTOK",
      tiktokValue: "audit",
      spotifyTitle: "Audit Spotify",
      spotifyMeta: "plan de lancement",
      reviewsMeta: "2 348 avis",
      youtubeTitle: "SEO video",
      youtubeMeta: "titres et calendrier",
    },
    how: {
      eyebrow: "★ Comment ca marche",
      titleBefore: "Trois etapes pour une presence ",
      titleHighlight: "durable",
      titleAfter: ".",
      steps: [
        { title: "Audit de votre presence", body: "On analyse votre profil public, vos contenus, votre positionnement et vos objectifs. Aucun mot de passe, aucun acces demande." },
        { title: "Plan editorial cible", body: "Vous recevez une feuille de route claire : angles de contenu, plateformes prioritaires, calendrier et pistes d'amelioration." },
        { title: "Suivi et optimisation", body: "On suit les signaux utiles, on ajuste les recommandations et on garde une progression coherente avec votre marque." },
      ],
    },
    testimonials: {
      eyebrow: "★ Ils nous font confiance",
      titleBefore: "Ils nous font ",
      titleHighlight: "confiance",
      titleAfter: ".",
      stats: [
        { n: "32", l: "points d'audit" },
        { n: "8", l: "plateformes couvertes" },
        { n: "4,9/5", l: "note moyenne" },
        { n: "30j", l: "plan d'action" },
      ],
      items: [
        { q: "Fanovera m'a aidee a clarifier ma ligne editoriale et a organiser mes sorties sans courir apres les chiffres.", n: "Lea Marchetti", r: "Musicienne - strategie de lancement" },
        { q: "L'audit etait concret : quoi publier, quand le publier, et comment mieux raconter mon travail.", n: "Thomas Durand", r: "Photographe - calendrier contenu" },
        { q: "On a pose une vraie methode autour de mes formats courts. Le suivi est simple, lisible et utile.", n: "Sofia Ramos", r: "Creatrice - accompagnement TikTok" },
      ],
    },
    faq: {
      eyebrow: "★ FAQ",
      titleBefore: "Vos questions, ",
      titleHighlight: "nos reponses",
      titleAfter: ".",
      items: [
        { q: "Comment fonctionne votre service ?", a: "Nous analysons votre presence publique, vos contenus et vos objectifs pour preparer un plan de visibilite concret et progressif." },
        { q: "Faut-il vous donner mes mots de passe ?", a: "Jamais. Fanovera fonctionne a partir des informations publiques que vous nous indiquez. Aucun acces au compte n'est demande." },
        { q: "Que vais-je recevoir ?", a: "Un audit, une strategie de contenu, des recommandations par plateforme et un cadre de suivi pour piloter votre visibilite." },
        { q: "Promettez-vous des chiffres precis ?", a: "Non. Nous aidons a structurer votre presence et vos campagnes, sans promettre de volume artificiel ni de resultat garanti." },
      ],
      contactText: "Une autre question ? Ecrivez-nous",
    },
    cta: {
      titleBefore: "Pret a structurer ",
      titleHighlight: "votre presence",
      titleAfter: " en ligne ?",
      body: "Choisissez votre plateforme et preparez un plan de visibilite adapte a vos contenus.",
      footer: "Audit public - Strategie de contenu - Aucun acces au compte demande",
    },
    footer: {
      description: "Strategie de presence en ligne propulsee par IA : audit, calendrier de contenu et suivi de visibilite.",
      product: "Produit",
      company: "Societe",
      links: { how: "Fonctionnement", track: "Suivi", testimonials: "Temoignages", faq: "FAQ", legal: "Mentions legales", terms: "CGV", privacy: "Confidentialite", contact: "Contact" },
      madeIn: "Made in Paris",
    },
    chat: {
      invalidEmail: "Email invalide.",
      shortMessage: "Message trop court.",
      retry: "Erreur, reessayez.",
      networkRetry: "Erreur reseau, reessayez.",
      open: "Ouvrir le chat",
      question: "Une question ?",
      sentHeader: "Message envoye !",
      online: "Support - en ligne",
      greeting: "Bonjour ! Comment pouvons-nous vous aider ? Entrez votre email pour commencer.",
      emailLabel: "Votre email",
      continue: "Continuer",
      messageLabel: "Votre message",
      messagePlaceholder: "Decrivez votre demande...",
      sending: "Envoi...",
      send: "Envoyer le message",
      thanks: "Merci !",
      reply: (email) => `On vous repondra a ${email} dans les plus brefs delais.`,
      close: "Fermer",
      privacy: "Vos donnees sont protegees et chiffrees",
    },
    order: {
      confirmError: "Impossible de confirmer votre commande.",
      unexpected: "Erreur inattendue.",
      title: "Commande confirmee",
      thanks: "Merci pour votre achat. Votre commande a bien ete prise en compte.",
      finalizing: "Finalisation de la commande...",
      verifying: "Verification du paiement...",
      fallbackError: "Nous n'avons pas pu finaliser automatiquement votre commande.",
      track: (id) => `Suivre ma commande #${id}`,
      home: "Retour a l'accueil",
    },
    track: {
      notFound: "Commande introuvable.",
      unexpected: "Erreur inattendue.",
      title: "Suivi de commande",
      loading: "Chargement...",
      summary: (id, platform, status) => `Commande #${id} - ${platform} - statut global ${status}`,
      delivered: "Livre",
      remaining: "Restant",
    },
  },
  en: {
    header: { track: "Track", faq: "FAQ", contact: "Contact", start: "Start" },
    hero: {
      stars: [
        { q: "Clear audit and actionable plan", a: "Lea M., musician" },
        { q: "Serious service, clear follow-up", a: "Karim T., DTC founder" },
        { q: "A real framework to publish better", a: "Studio Metrique" },
      ],
      newCampaign: "+ New campaign",
      menu: ["Dashboard", "Campaigns", "AI audience", "Analytics", "Networks", "Billing"],
      activeNetworks: "ACTIVE NETWORKS",
      campaign: "Campaign #042",
      campaignMeta: "Active - Day 18 of 30",
      stats: [
        { l: "Audit", v: "32 pts", d: "prioritized" },
        { l: "Content", v: "18 ideas", d: "ready" },
        { l: "Schedule", v: "30 d", d: "cadence" },
      ],
      chartTitle: "Visibility plan - 30 days",
      cardLabel: "Audit and strategy",
      cardCta: "See solution",
      titleBefore: "A ",
      titleHighlight: "clearer",
      titleAfter: " online presence, without artificial promises.",
      rating: "Rated 4.9/5",
      reviews: "2,348 reviews",
      tiktokLabel: "TIKTOK",
      tiktokValue: "audit",
      spotifyTitle: "Spotify audit",
      spotifyMeta: "launch plan",
      reviewsMeta: "2,348 reviews",
      youtubeTitle: "Video SEO",
      youtubeMeta: "titles and calendar",
    },
    how: {
      eyebrow: "★ How it works",
      titleBefore: "Three steps toward a ",
      titleHighlight: "lasting",
      titleAfter: " presence.",
      steps: [
        { title: "Audit your presence", body: "We review your public profile, content, positioning and goals. No password and no account access required." },
        { title: "Targeted editorial plan", body: "You receive a clear roadmap: content angles, priority platforms, calendar and improvement ideas." },
        { title: "Tracking and optimization", body: "We track useful signals, adjust recommendations and keep progress aligned with your brand." },
      ],
    },
    testimonials: {
      eyebrow: "★ Trusted by creators",
      titleBefore: "Creators ",
      titleHighlight: "trust us",
      titleAfter: ".",
      stats: [
        { n: "32", l: "audit points" },
        { n: "8", l: "platforms covered" },
        { n: "4.9/5", l: "average rating" },
        { n: "30d", l: "action plan" },
      ],
      items: [
        { q: "Fanovera helped me clarify my editorial line and organize releases without chasing numbers.", n: "Lea Marchetti", r: "Musician - launch strategy" },
        { q: "The audit was concrete: what to publish, when to publish it, and how to tell my work better.", n: "Thomas Durand", r: "Photographer - content calendar" },
        { q: "We built a real method around my short-form formats. The follow-up is simple, readable and useful.", n: "Sofia Ramos", r: "Creator - TikTok support" },
      ],
    },
    faq: {
      eyebrow: "★ FAQ",
      titleBefore: "Your questions, ",
      titleHighlight: "our answers",
      titleAfter: ".",
      items: [
        { q: "How does your service work?", a: "We analyze your public presence, content and goals to prepare a concrete, progressive visibility plan." },
        { q: "Do I need to share my passwords?", a: "Never. Fanovera works from the public information you provide. No account access is requested." },
        { q: "What will I receive?", a: "An audit, a content strategy, platform-specific recommendations and a follow-up framework to manage your visibility." },
        { q: "Do you promise specific numbers?", a: "No. We help structure your presence and campaigns without promising artificial volume or guaranteed results." },
      ],
      contactText: "Another question? Write to us",
    },
    cta: { titleBefore: "Ready to structure ", titleHighlight: "your presence", titleAfter: " online?", body: "Choose your platform and prepare a visibility plan tailored to your content.", footer: "Public audit - Content strategy - No account access required" },
    footer: {
      description: "AI-powered online presence strategy: audit, content calendar and visibility tracking.",
      product: "Product",
      company: "Company",
      links: { how: "How it works", track: "Tracking", testimonials: "Testimonials", faq: "FAQ", legal: "Legal notice", terms: "Terms", privacy: "Privacy", contact: "Contact" },
      madeIn: "Made in Paris",
    },
    chat: {
      invalidEmail: "Invalid email.",
      shortMessage: "Message is too short.",
      retry: "Error, please try again.",
      networkRetry: "Network error, please try again.",
      open: "Open chat",
      question: "A question?",
      sentHeader: "Message sent!",
      online: "Support - online",
      greeting: "Hello! How can we help? Enter your email to get started.",
      emailLabel: "Your email",
      continue: "Continue",
      messageLabel: "Your message",
      messagePlaceholder: "Describe your request...",
      sending: "Sending...",
      send: "Send message",
      thanks: "Thank you!",
      reply: (email) => `We will reply to ${email} as soon as possible.`,
      close: "Close",
      privacy: "Your data is protected and encrypted",
    },
    order: {
      confirmError: "Unable to confirm your order.",
      unexpected: "Unexpected error.",
      title: "Order confirmed",
      thanks: "Thank you for your purchase. Your order has been received.",
      finalizing: "Finalizing order...",
      verifying: "Verifying payment...",
      fallbackError: "We could not finalize your order automatically.",
      track: (id) => `Track my order #${id}`,
      home: "Back to home",
    },
    track: {
      notFound: "Order not found.",
      unexpected: "Unexpected error.",
      title: "Order tracking",
      loading: "Loading...",
      summary: (id, platform, status) => `Order #${id} - ${platform} - overall status ${status}`,
      delivered: "Delivered",
      remaining: "Remaining",
    },
  },
  es: {} as PublicCopy,
  pt: {} as PublicCopy,
  de: {} as PublicCopy,
  it: {} as PublicCopy,
  tr: {} as PublicCopy,
};

PUBLIC_COPY.es = {
  ...PUBLIC_COPY.en,
  header: { track: "Seguimiento", faq: "FAQ", contact: "Contacto", start: "Empezar" },
  hero: { ...PUBLIC_COPY.en.hero, titleBefore: "Una presencia online ", titleHighlight: "mas clara", titleAfter: ", sin promesas artificiales.", cardLabel: "Auditoria y estrategia", cardCta: "Ver solucion", rating: "Nota 4,9/5", reviews: "2.348 reseñas" },
  how: { ...PUBLIC_COPY.en.how, eyebrow: "★ Como funciona", titleBefore: "Tres pasos para una presencia ", titleHighlight: "duradera", titleAfter: ".", steps: [
    { title: "Auditoria de tu presencia", body: "Analizamos tu perfil publico, contenidos, posicionamiento y objetivos. Sin contraseñas ni acceso a la cuenta." },
    { title: "Plan editorial enfocado", body: "Recibes una hoja de ruta clara: angulos de contenido, plataformas prioritarias, calendario e ideas de mejora." },
    { title: "Seguimiento y optimizacion", body: "Seguimos las señales utiles, ajustamos recomendaciones y mantenemos una progresion coherente con tu marca." },
  ] },
  faq: { ...PUBLIC_COPY.en.faq, titleBefore: "Tus preguntas, ", titleHighlight: "nuestras respuestas", items: [
    { q: "Como funciona el servicio?", a: "Analizamos tu presencia publica, contenidos y objetivos para preparar un plan de visibilidad concreto y progresivo." },
    { q: "Debo dar mis contraseñas?", a: "Nunca. Fanovera funciona con la informacion publica que nos indicas. No pedimos acceso a la cuenta." },
    { q: "Que recibire?", a: "Una auditoria, una estrategia de contenido, recomendaciones por plataforma y un marco de seguimiento." },
    { q: "Prometen cifras concretas?", a: "No. Ayudamos a estructurar tu presencia y campañas sin prometer volumen artificial ni resultados garantizados." },
  ], contactText: "Otra pregunta? Escribenos" },
  cta: { titleBefore: "Listo para estructurar ", titleHighlight: "tu presencia", titleAfter: " online?", body: "Elige tu plataforma y prepara un plan de visibilidad adaptado a tus contenidos.", footer: "Auditoria publica - Estrategia de contenido - Sin acceso a la cuenta" },
  footer: { ...PUBLIC_COPY.en.footer, product: "Producto", company: "Empresa", description: "Estrategia de presencia online con IA: auditoria, calendario de contenido y seguimiento de visibilidad.", links: { how: "Funcionamiento", track: "Seguimiento", testimonials: "Testimonios", faq: "FAQ", legal: "Aviso legal", terms: "Condiciones", privacy: "Privacidad", contact: "Contacto" } },
  chat: { ...PUBLIC_COPY.en.chat, invalidEmail: "Email no valido.", shortMessage: "Mensaje demasiado corto.", open: "Abrir chat", question: "Una pregunta?", online: "Soporte - en linea", greeting: "Hola! Como podemos ayudarte? Introduce tu email para empezar.", emailLabel: "Tu email", continue: "Continuar", messageLabel: "Tu mensaje", messagePlaceholder: "Describe tu solicitud...", sending: "Enviando...", send: "Enviar mensaje", thanks: "Gracias!", reply: (email) => `Te responderemos a ${email} lo antes posible.`, close: "Cerrar", privacy: "Tus datos estan protegidos y cifrados" },
  order: { ...PUBLIC_COPY.en.order, confirmError: "No se pudo confirmar tu pedido.", unexpected: "Error inesperado.", title: "Pedido confirmado", thanks: "Gracias por tu compra. Hemos recibido tu pedido.", finalizing: "Finalizando el pedido...", verifying: "Verificando el pago...", fallbackError: "No pudimos finalizar tu pedido automaticamente.", track: (id) => `Seguir mi pedido #${id}`, home: "Volver al inicio" },
  track: { ...PUBLIC_COPY.en.track, notFound: "Pedido no encontrado.", unexpected: "Error inesperado.", title: "Seguimiento del pedido", loading: "Cargando...", summary: (id, platform, status) => `Pedido #${id} - ${platform} - estado global ${status}`, delivered: "Entregado", remaining: "Restante" },
};

PUBLIC_COPY.pt = { ...PUBLIC_COPY.es, header: { track: "Acompanhar", faq: "FAQ", contact: "Contato", start: "Comecar" }, hero: { ...PUBLIC_COPY.es.hero, titleBefore: "Uma presenca online ", titleHighlight: "mais clara", titleAfter: ", sem promessas artificiais.", cardCta: "Ver solucao", reviews: "2.348 avaliacoes" }, cta: { titleBefore: "Pronto para estruturar ", titleHighlight: "sua presenca", titleAfter: " online?", body: "Escolha sua plataforma e prepare um plano de visibilidade adaptado aos seus conteudos.", footer: "Auditoria publica - Estrategia de conteudo - Sem acesso a conta" }, order: { ...PUBLIC_COPY.es.order, title: "Pedido confirmado", track: (id) => `Acompanhar meu pedido #${id}`, home: "Voltar ao inicio" }, track: { ...PUBLIC_COPY.es.track, title: "Acompanhamento do pedido", delivered: "Entregue", remaining: "Restante" } };
PUBLIC_COPY.de = { ...PUBLIC_COPY.en, header: { track: "Tracking", faq: "FAQ", contact: "Kontakt", start: "Starten" }, hero: { ...PUBLIC_COPY.en.hero, titleBefore: "Eine ", titleHighlight: "klarere", titleAfter: " Online-Prasenz, ohne kunstliche Versprechen.", cardLabel: "Audit und Strategie", cardCta: "Losung ansehen" }, cta: { titleBefore: "Bereit, ", titleHighlight: "deine Prasenz", titleAfter: " online zu strukturieren?", body: "Wahle deine Plattform und erstelle einen Sichtbarkeitsplan passend zu deinen Inhalten.", footer: "Offentliches Audit - Content-Strategie - Kein Kontozugriff erforderlich" }, footer: { ...PUBLIC_COPY.en.footer, product: "Produkt", company: "Unternehmen", links: { ...PUBLIC_COPY.en.footer.links, how: "So funktioniert es", track: "Tracking", legal: "Impressum", terms: "AGB", privacy: "Datenschutz", contact: "Kontakt" } }, order: { ...PUBLIC_COPY.en.order, title: "Bestellung bestatigt", track: (id) => `Meine Bestellung #${id} verfolgen`, home: "Zur Startseite" }, track: { ...PUBLIC_COPY.en.track, title: "Bestellverfolgung", delivered: "Geliefert", remaining: "Verbleibend" } };
PUBLIC_COPY.it = { ...PUBLIC_COPY.es, header: { track: "Traccia", faq: "FAQ", contact: "Contatto", start: "Inizia" }, hero: { ...PUBLIC_COPY.es.hero, titleBefore: "Una presenza online ", titleHighlight: "piu chiara", titleAfter: ", senza promesse artificiali.", cardLabel: "Audit e strategia", cardCta: "Vedi soluzione" }, cta: { titleBefore: "Pronto a strutturare ", titleHighlight: "la tua presenza", titleAfter: " online?", body: "Scegli la piattaforma e prepara un piano di visibilita adatto ai tuoi contenuti.", footer: "Audit pubblico - Strategia di contenuto - Nessun accesso all'account" }, order: { ...PUBLIC_COPY.es.order, title: "Ordine confermato", track: (id) => `Traccia il mio ordine #${id}`, home: "Torna alla home" }, track: { ...PUBLIC_COPY.es.track, title: "Tracciamento ordine", delivered: "Consegnato", remaining: "Rimanente" } };
PUBLIC_COPY.tr = { ...PUBLIC_COPY.en, header: { track: "Takip", faq: "SSS", contact: "Iletisim", start: "Basla" }, hero: { ...PUBLIC_COPY.en.hero, titleBefore: "Yapay vaatler olmadan ", titleHighlight: "daha net", titleAfter: " bir online varlik.", cardLabel: "Denetim ve strateji", cardCta: "Cozumu gor" }, how: { ...PUBLIC_COPY.en.how, eyebrow: "★ Nasil calisir", titleBefore: "Kalici bir varlik icin ", titleHighlight: "uc adim", titleAfter: ".", steps: [
  { title: "Varliginizi denetleyin", body: "Herkese acik profilinizi, iceriklerinizi, konumlandirmanizi ve hedeflerinizi inceleriz. Sifre ya da hesap erisimi istemeyiz." },
  { title: "Hedefli editorial plan", body: "Icerik acilari, oncelikli platformlar, takvim ve iyilestirme fikirleri iceren net bir yol haritasi alirsiniz." },
  { title: "Takip ve optimizasyon", body: "Yararli sinyalleri izler, onerileri ayarlar ve ilerlemeyi markanizla uyumlu tutariz." },
] }, cta: { titleBefore: "Online ", titleHighlight: "varliginizi", titleAfter: " duzenlemeye hazir misiniz?", body: "Platformunuzu secin ve iceriklerinize uygun bir gorunurluk plani hazirlayin.", footer: "Herkese acik denetim - Icerik stratejisi - Hesap erisimi gerekmez" }, footer: { ...PUBLIC_COPY.en.footer, product: "Urun", company: "Sirket", links: { ...PUBLIC_COPY.en.footer.links, how: "Nasil calisir", track: "Takip", testimonials: "Yorumlar", legal: "Yasal bilgiler", terms: "Kosullar", privacy: "Gizlilik", contact: "Iletisim" } }, chat: { ...PUBLIC_COPY.en.chat, open: "Sohbeti ac", question: "Bir sorunuz mu var?", emailLabel: "E-posta adresiniz", continue: "Devam", messageLabel: "Mesajiniz", send: "Mesaji gonder", close: "Kapat" }, order: { ...PUBLIC_COPY.en.order, title: "Siparis onaylandi", track: (id) => `Siparisimi takip et #${id}`, home: "Ana sayfaya don" }, track: { ...PUBLIC_COPY.en.track, title: "Siparis takibi", delivered: "Teslim edildi", remaining: "Kalan" } };

for (const locale of ["es", "pt", "de", "it", "tr"] as const) {
  PUBLIC_COPY[locale] = {
    ...PUBLIC_COPY[locale],
    hero: deepTranslateCopy(PUBLIC_COPY.fr.hero, locale),
    how: deepTranslateCopy(PUBLIC_COPY.fr.how, locale),
    testimonials: deepTranslateCopy(PUBLIC_COPY.fr.testimonials, locale),
    faq: deepTranslateCopy(PUBLIC_COPY.fr.faq, locale),
    cta: deepTranslateCopy(PUBLIC_COPY.fr.cta, locale),
    footer: deepTranslateCopy(PUBLIC_COPY.fr.footer, locale),
  };
}

export function getPublicCopy(locale: SupportedLocale) {
  return PUBLIC_COPY[locale] || PUBLIC_COPY.fr;
}
