import type { SupportedLocale } from "../i18n/types";
import { applyPerformancePublicCopy, applyBlackhatPublicCopy } from "../lib/performanceCopy";
import type { MarketingMode, SurfaceMarketingMode } from "../lib/marketingModeTypes";

export type PublicCopy = {
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
  payment: {
    paying: string;
    pay: string;
    loading: string;
    paymentError: string;
    orPayByCard: string;
    networkError: string;
  };
};

export const PUBLIC_COPY: Record<SupportedLocale, PublicCopy> = {
  fr: {
    header: { track: "Suivi", faq: "FAQ", contact: "Contact", start: "Commencer" },
    hero: {
      stars: [
        { q: "Audit clair et plan actionnable", a: "Léa M., musicienne" },
        { q: "Service sérieux, suivi lisible", a: "Karim T., fondateur DTC" },
        { q: "Un vrai cadre pour publier mieux", a: "Studio Métrique" },
      ],
      newCampaign: "+ Nouvelle campagne",
      menu: ["Tableau de bord", "Campagnes", "Audience IA", "Statistiques", "Réseaux", "Facturation"],
      activeNetworks: "RÉSEAUX ACTIFS",
      campaign: "Campagne #042",
      campaignMeta: "Active - Jour 18 sur 30",
      stats: [
        { l: "Audit", v: "32 pts", d: "priorisés" },
        { l: "Contenus", v: "18 idées", d: "prêtes" },
        { l: "Planning", v: "30 j", d: "cadence" },
      ],
      chartTitle: "Plan de visibilité - 30 jours",
      cardLabel: "Audit et stratégie",
      cardCta: "Voir la solution",
      titleBefore: "Une présence en ligne ",
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
      eyebrow: "★ Comment ça marche",
      titleBefore: "Trois étapes pour une présence ",
      titleHighlight: "durable",
      titleAfter: ".",
      steps: [
        { title: "Audit de votre présence", body: "On analyse votre profil public, vos contenus, votre positionnement et vos objectifs. Aucun mot de passe, aucun accès demandé." },
        { title: "Plan éditorial ciblé", body: "Vous recevez une feuille de route claire : angles de contenu, plateformes prioritaires, calendrier et pistes d'amélioration." },
        { title: "Suivi et optimisation", body: "On suit les signaux utiles, on ajuste les recommandations et on garde une progression cohérente avec votre marque." },
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
        { q: "Fanovera m'a aidée à clarifier ma ligne éditoriale et à organiser mes sorties sans courir après les chiffres.", n: "Léa Marchetti", r: "Musicienne - stratégie de lancement" },
        { q: "L'audit était concret : quoi publier, quand le publier, et comment mieux raconter mon travail.", n: "Thomas Durand", r: "Photographe - calendrier contenu" },
        { q: "On a posé une vraie méthode autour de mes formats courts. Le suivi est simple, lisible et utile.", n: "Sofia Ramos", r: "Créatrice - accompagnement TikTok" },
      ],
    },
    faq: {
      eyebrow: "★ FAQ",
      titleBefore: "Vos questions, ",
      titleHighlight: "nos réponses",
      titleAfter: ".",
      items: [
        { q: "Comment fonctionne votre service ?", a: "Nous analysons votre présence publique, vos contenus et vos objectifs pour préparer un plan de visibilité concret et progressif." },
        { q: "Faut-il vous donner mes mots de passe ?", a: "Jamais. Fanovera fonctionne à partir des informations publiques que vous nous indiquez. Aucun accès au compte n'est demandé." },
        { q: "Que vais-je recevoir ?", a: "Un audit, une stratégie de contenu, des recommandations par plateforme et un cadre de suivi pour piloter votre visibilité." },
        { q: "Promettez-vous des chiffres précis ?", a: "Non. Nous aidons à structurer votre présence et vos campagnes, sans promettre de volume artificiel ni de résultat garanti." },
      ],
      contactText: "Une autre question ? Écrivez-nous",
    },
    cta: {
      titleBefore: "Prêt à structurer ",
      titleHighlight: "votre présence",
      titleAfter: " en ligne ?",
      body: "Choisissez votre plateforme et préparez un plan de visibilité adapté à vos contenus.",
      footer: "Audit public - Stratégie de contenu - Aucun accès au compte demandé",
    },
    footer: {
      description: "Stratégie de présence en ligne propulsée par IA : audit, calendrier de contenu et suivi de visibilité.",
      product: "Produit",
      company: "Société",
      links: { how: "Fonctionnement", track: "Suivi", testimonials: "Témoignages", faq: "FAQ", legal: "Mentions légales", terms: "CGV", privacy: "Confidentialité", contact: "Contact" },
      madeIn: "Made in Paris",
    },
    chat: {
      invalidEmail: "Email invalide.",
      shortMessage: "Message trop court.",
      retry: "Erreur, réessayez.",
      networkRetry: "Erreur réseau, réessayez.",
      open: "Ouvrir le chat",
      question: "Une question ?",
      sentHeader: "Message envoyé !",
      online: "Support - en ligne",
      greeting: "Bonjour ! Comment pouvons-nous vous aider ? Entrez votre email pour commencer.",
      emailLabel: "Votre email",
      continue: "Continuer",
      messageLabel: "Votre message",
      messagePlaceholder: "Décrivez votre demande...",
      sending: "Envoi...",
      send: "Envoyer le message",
      thanks: "Merci !",
      reply: (email) => `On vous répondra à ${email} dans les plus brefs délais.`,
      close: "Fermer",
      privacy: "Vos données sont protégées et chiffrées",
    },
    order: {
      confirmError: "Impossible de confirmer votre commande.",
      unexpected: "Erreur inattendue.",
      title: "Commande confirmée",
      thanks: "Merci pour votre achat. Votre commande a bien été prise en compte.",
      finalizing: "Finalisation de la commande...",
      verifying: "Vérification du paiement...",
      fallbackError: "Nous n'avons pas pu finaliser automatiquement votre commande.",
      track: (id) => `Suivre ma commande #${id}`,
      home: "Retour à l'accueil",
    },
    track: {
      notFound: "Commande introuvable.",
      unexpected: "Erreur inattendue.",
      title: "Suivi de commande",
      loading: "Chargement...",
      summary: (id, platform, status) => `Commande #${id} - ${platform} - statut global ${status}`,
      delivered: "Livré",
      remaining: "Restant",
    },
    payment: {
      paying: "Paiement en cours…",
      pay: "Payer",
      loading: "Chargement du paiement sécurisé…",
      paymentError: "Erreur de paiement",
      orPayByCard: "ou payer par carte",
      networkError: "Connexion impossible au service de paiement.",
    },
  },
  en: {
    header: { track: "Track", faq: "FAQ", contact: "Contact", start: "Start" },
    hero: {
      stars: [
        { q: "Clear audit and actionable plan", a: "Léa M., musician" },
        { q: "Serious service, clear follow-up", a: "Karim T., DTC founder" },
        { q: "A real framework to publish better", a: "Studio Métrique" },
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
        { q: "Fanovera helped me clarify my editorial line and organize releases without chasing numbers.", n: "Léa Marchetti", r: "Musician - launch strategy" },
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
    payment: {
      paying: "Processing payment…",
      pay: "Pay",
      loading: "Loading secure payment…",
      paymentError: "Payment error",
      orPayByCard: "or pay by card",
      networkError: "Cannot reach the payment service.",
    },
  },
  es: {
    header: { track: "Seguimiento", faq: "FAQ", contact: "Contacto", start: "Empezar" },
    hero: {
      stars: [
        { q: "Auditoría clara y plan accionable", a: "Léa M., música" },
        { q: "Servicio serio, seguimiento legible", a: "Karim T., fundador DTC" },
        { q: "Un marco real para publicar mejor", a: "Studio Métrique" },
      ],
      newCampaign: "+ Nueva campaña",
      menu: ["Panel", "Campañas", "Audiencia IA", "Estadísticas", "Redes", "Facturación"],
      activeNetworks: "REDES ACTIVAS",
      campaign: "Campaña #042",
      campaignMeta: "Activa - Día 18 de 30",
      stats: [
        { l: "Auditoría", v: "32 pts", d: "priorizados" },
        { l: "Contenidos", v: "18 ideas", d: "listas" },
        { l: "Planning", v: "30 d", d: "ritmo" },
      ],
      chartTitle: "Plan de visibilidad - 30 días",
      cardLabel: "Auditoría y estrategia",
      cardCta: "Ver la solución",
      titleBefore: "Una presencia online ",
      titleHighlight: "más clara",
      titleAfter: ", sin promesas artificiales.",
      rating: "Nota 4,9/5",
      reviews: "2.348 reseñas",
      tiktokLabel: "TIKTOK",
      tiktokValue: "auditoría",
      spotifyTitle: "Auditoría Spotify",
      spotifyMeta: "plan de lanzamiento",
      reviewsMeta: "2.348 reseñas",
      youtubeTitle: "SEO vídeo",
      youtubeMeta: "títulos y calendario",
    },
    how: {
      eyebrow: "★ Cómo funciona",
      titleBefore: "Tres pasos para una presencia ",
      titleHighlight: "duradera",
      titleAfter: ".",
      steps: [
        { title: "Auditoría de tu presencia", body: "Analizamos tu perfil público, tus contenidos, tu posicionamiento y tus objetivos. Sin contraseñas, sin acceso a la cuenta." },
        { title: "Plan editorial enfocado", body: "Recibes una hoja de ruta clara: ángulos de contenido, plataformas prioritarias, calendario y pistas de mejora." },
        { title: "Seguimiento y optimización", body: "Seguimos las señales útiles, ajustamos las recomendaciones y mantenemos un progreso coherente con tu marca." },
      ],
    },
    testimonials: {
      eyebrow: "★ Confían en nosotros",
      titleBefore: "Ellos ",
      titleHighlight: "confían en nosotros",
      titleAfter: ".",
      stats: [
        { n: "32", l: "puntos de auditoría" },
        { n: "8", l: "plataformas cubiertas" },
        { n: "4,9/5", l: "nota media" },
        { n: "30d", l: "plan de acción" },
      ],
      items: [
        { q: "Fanovera me ayudó a clarificar mi línea editorial y a organizar mis publicaciones sin perseguir cifras.", n: "Léa Marchetti", r: "Música - estrategia de lanzamiento" },
        { q: "La auditoría fue concreta: qué publicar, cuándo publicarlo y cómo contar mejor mi trabajo.", n: "Thomas Durand", r: "Fotógrafo - calendario de contenido" },
        { q: "Construimos un método real alrededor de mis formatos cortos. El seguimiento es simple, legible y útil.", n: "Sofia Ramos", r: "Creadora - acompañamiento TikTok" },
      ],
    },
    faq: {
      eyebrow: "★ FAQ",
      titleBefore: "Tus preguntas, ",
      titleHighlight: "nuestras respuestas",
      titleAfter: ".",
      items: [
        { q: "¿Cómo funciona vuestro servicio?", a: "Analizamos tu presencia pública, contenidos y objetivos para preparar un plan de visibilidad concreto y progresivo." },
        { q: "¿Debo dar mis contraseñas?", a: "Nunca. Fanovera funciona con la información pública que nos indicas. No pedimos acceso a la cuenta." },
        { q: "¿Qué recibiré?", a: "Una auditoría, una estrategia de contenido, recomendaciones por plataforma y un marco de seguimiento para gestionar tu visibilidad." },
        { q: "¿Prometéis cifras concretas?", a: "No. Ayudamos a estructurar tu presencia y campañas sin prometer volumen artificial ni resultados garantizados." },
      ],
      contactText: "¿Otra pregunta? Escríbenos",
    },
    cta: { titleBefore: "¿Listo para estructurar ", titleHighlight: "tu presencia", titleAfter: " online?", body: "Elige tu plataforma y prepara un plan de visibilidad adaptado a tus contenidos.", footer: "Auditoría pública - Estrategia de contenido - Sin acceso a la cuenta" },
    footer: {
      description: "Estrategia de presencia online impulsada por IA: auditoría, calendario de contenido y seguimiento de visibilidad.",
      product: "Producto",
      company: "Empresa",
      links: { how: "Cómo funciona", track: "Seguimiento", testimonials: "Testimonios", faq: "FAQ", legal: "Aviso legal", terms: "Condiciones", privacy: "Privacidad", contact: "Contacto" },
      madeIn: "Made in Paris",
    },
    chat: { invalidEmail: "Email no válido.", shortMessage: "Mensaje demasiado corto.", retry: "Error, inténtalo de nuevo.", networkRetry: "Error de red, inténtalo de nuevo.", open: "Abrir el chat", question: "¿Una pregunta?", sentHeader: "¡Mensaje enviado!", online: "Soporte - en línea", greeting: "¡Hola! ¿Cómo podemos ayudarte? Introduce tu email para empezar.", emailLabel: "Tu email", continue: "Continuar", messageLabel: "Tu mensaje", messagePlaceholder: "Describe tu solicitud...", sending: "Enviando...", send: "Enviar mensaje", thanks: "¡Gracias!", reply: (email) => `Te responderemos a ${email} lo antes posible.`, close: "Cerrar", privacy: "Tus datos están protegidos y cifrados" },
    order: { confirmError: "No se pudo confirmar tu pedido.", unexpected: "Error inesperado.", title: "Pedido confirmado", thanks: "Gracias por tu compra. Hemos recibido tu pedido.", finalizing: "Finalizando el pedido...", verifying: "Verificando el pago...", fallbackError: "No pudimos finalizar tu pedido automáticamente.", track: (id) => `Seguir mi pedido #${id}`, home: "Volver al inicio" },
    track: { notFound: "Pedido no encontrado.", unexpected: "Error inesperado.", title: "Seguimiento del pedido", loading: "Cargando...", summary: (id, platform, status) => `Pedido #${id} - ${platform} - estado global ${status}`, delivered: "Entregado", remaining: "Restante" },
    payment: { paying: "Procesando pago…", pay: "Pagar", loading: "Cargando pago seguro…", paymentError: "Error de pago", orPayByCard: "o paga con tarjeta", networkError: "No se puede conectar al servicio de pago." },
  },
  pt: {
    header: { track: "Acompanhar", faq: "FAQ", contact: "Contato", start: "Começar" },
    hero: {
      stars: [
        { q: "Auditoria clara e plano acionável", a: "Léa M., música" },
        { q: "Serviço sério, acompanhamento legível", a: "Karim T., fundador DTC" },
        { q: "Um verdadeiro quadro para publicar melhor", a: "Studio Métrique" },
      ],
      newCampaign: "+ Nova campanha",
      menu: ["Painel", "Campanhas", "Audiência IA", "Estatísticas", "Redes", "Faturamento"],
      activeNetworks: "REDES ATIVAS",
      campaign: "Campanha #042",
      campaignMeta: "Ativa - Dia 18 de 30",
      stats: [
        { l: "Auditoria", v: "32 pts", d: "priorizados" },
        { l: "Conteúdos", v: "18 ideias", d: "prontas" },
        { l: "Planejamento", v: "30 d", d: "ritmo" },
      ],
      chartTitle: "Plano de visibilidade - 30 dias",
      cardLabel: "Auditoria e estratégia",
      cardCta: "Ver a solução",
      titleBefore: "Uma presença online ",
      titleHighlight: "mais clara",
      titleAfter: ", sem promessas artificiais.",
      rating: "Nota 4,9/5",
      reviews: "2.348 avaliações",
      tiktokLabel: "TIKTOK",
      tiktokValue: "auditoria",
      spotifyTitle: "Auditoria Spotify",
      spotifyMeta: "plano de lançamento",
      reviewsMeta: "2.348 avaliações",
      youtubeTitle: "SEO vídeo",
      youtubeMeta: "títulos e calendário",
    },
    how: {
      eyebrow: "★ Como funciona",
      titleBefore: "Três passos para uma presença ",
      titleHighlight: "duradoura",
      titleAfter: ".",
      steps: [
        { title: "Auditoria da sua presença", body: "Analisamos seu perfil público, conteúdos, posicionamento e objetivos. Sem senhas, sem acesso à conta." },
        { title: "Plano editorial focado", body: "Você recebe um roteiro claro: ângulos de conteúdo, plataformas prioritárias, calendário e ideias de melhoria." },
        { title: "Acompanhamento e otimização", body: "Acompanhamos os sinais úteis, ajustamos as recomendações e mantemos um progresso coerente com sua marca." },
      ],
    },
    testimonials: {
      eyebrow: "★ Eles confiam em nós",
      titleBefore: "Eles ",
      titleHighlight: "confiam em nós",
      titleAfter: ".",
      stats: [
        { n: "32", l: "pontos de auditoria" },
        { n: "8", l: "plataformas cobertas" },
        { n: "4,9/5", l: "nota média" },
        { n: "30d", l: "plano de ação" },
      ],
      items: [
        { q: "A Fanovera me ajudou a clarificar minha linha editorial e a organizar minhas publicações sem perseguir números.", n: "Léa Marchetti", r: "Música - estratégia de lançamento" },
        { q: "A auditoria foi concreta: o que publicar, quando publicar e como contar melhor meu trabalho.", n: "Thomas Durand", r: "Fotógrafo - calendário de conteúdo" },
        { q: "Construímos um método real em torno dos meus formatos curtos. O acompanhamento é simples, legível e útil.", n: "Sofia Ramos", r: "Criadora - acompanhamento TikTok" },
      ],
    },
    faq: {
      eyebrow: "★ FAQ",
      titleBefore: "Suas perguntas, ",
      titleHighlight: "nossas respostas",
      titleAfter: ".",
      items: [
        { q: "Como funciona o serviço?", a: "Analisamos sua presença pública, conteúdos e objetivos para preparar um plano de visibilidade concreto e progressivo." },
        { q: "Preciso fornecer minhas senhas?", a: "Nunca. A Fanovera funciona com as informações públicas que você nos indica. Não pedimos acesso à conta." },
        { q: "O que vou receber?", a: "Uma auditoria, uma estratégia de conteúdo, recomendações por plataforma e um quadro de acompanhamento para gerir sua visibilidade." },
        { q: "Prometem números específicos?", a: "Não. Ajudamos a estruturar sua presença e campanhas sem prometer volume artificial nem resultados garantidos." },
      ],
      contactText: "Outra pergunta? Escreva-nos",
    },
    cta: { titleBefore: "Pronto para estruturar ", titleHighlight: "sua presença", titleAfter: " online?", body: "Escolha sua plataforma e prepare um plano de visibilidade adaptado aos seus conteúdos.", footer: "Auditoria pública - Estratégia de conteúdo - Sem acesso à conta" },
    footer: {
      description: "Estratégia de presença online com IA: auditoria, calendário de conteúdo e acompanhamento de visibilidade.",
      product: "Produto",
      company: "Empresa",
      links: { how: "Como funciona", track: "Acompanhar", testimonials: "Depoimentos", faq: "FAQ", legal: "Aviso legal", terms: "Termos", privacy: "Privacidade", contact: "Contato" },
      madeIn: "Made in Paris",
    },
    chat: { invalidEmail: "Email inválido.", shortMessage: "Mensagem muito curta.", retry: "Erro, tente novamente.", networkRetry: "Erro de rede, tente novamente.", open: "Abrir o chat", question: "Uma pergunta?", sentHeader: "Mensagem enviada!", online: "Suporte - online", greeting: "Olá! Como podemos ajudar? Insira seu email para começar.", emailLabel: "Seu email", continue: "Continuar", messageLabel: "Sua mensagem", messagePlaceholder: "Descreva sua solicitação...", sending: "Enviando...", send: "Enviar mensagem", thanks: "Obrigado!", reply: (email) => `Responderemos a ${email} o mais breve possível.`, close: "Fechar", privacy: "Seus dados estão protegidos e criptografados" },
    order: { confirmError: "Não foi possível confirmar seu pedido.", unexpected: "Erro inesperado.", title: "Pedido confirmado", thanks: "Obrigado pela sua compra. Recebemos seu pedido.", finalizing: "Finalizando o pedido...", verifying: "Verificando o pagamento...", fallbackError: "Não conseguimos finalizar seu pedido automaticamente.", track: (id) => `Acompanhar meu pedido #${id}`, home: "Voltar ao início" },
    track: { notFound: "Pedido não encontrado.", unexpected: "Erro inesperado.", title: "Acompanhamento do pedido", loading: "Carregando...", summary: (id, platform, status) => `Pedido #${id} - ${platform} - status global ${status}`, delivered: "Entregue", remaining: "Restante" },
    payment: { paying: "Processando pagamento…", pay: "Pagar", loading: "Carregando pagamento seguro…", paymentError: "Erro de pagamento", orPayByCard: "ou pague com cartão", networkError: "Não foi possível conectar ao serviço de pagamento." },
  },
  de: {
    header: { track: "Tracking", faq: "FAQ", contact: "Kontakt", start: "Starten" },
    hero: {
      stars: [
        { q: "Klares Audit und umsetzbarer Plan", a: "Léa M., Musikerin" },
        { q: "Seriöser Service, klare Nachverfolgung", a: "Karim T., DTC-Gründer" },
        { q: "Ein echter Rahmen, um besser zu veröffentlichen", a: "Studio Métrique" },
      ],
      newCampaign: "+ Neue Kampagne",
      menu: ["Dashboard", "Kampagnen", "KI-Zielgruppe", "Statistiken", "Netzwerke", "Abrechnung"],
      activeNetworks: "AKTIVE NETZWERKE",
      campaign: "Kampagne #042",
      campaignMeta: "Aktiv - Tag 18 von 30",
      stats: [
        { l: "Audit", v: "32 Pkt.", d: "priorisiert" },
        { l: "Inhalte", v: "18 Ideen", d: "bereit" },
        { l: "Planung", v: "30 T", d: "Rhythmus" },
      ],
      chartTitle: "Sichtbarkeitsplan - 30 Tage",
      cardLabel: "Audit und Strategie",
      cardCta: "Lösung ansehen",
      titleBefore: "Eine ",
      titleHighlight: "klarere",
      titleAfter: " Online-Präsenz, ohne künstliche Versprechen.",
      rating: "Bewertung 4,9/5",
      reviews: "2.348 Bewertungen",
      tiktokLabel: "TIKTOK",
      tiktokValue: "Audit",
      spotifyTitle: "Spotify-Audit",
      spotifyMeta: "Launch-Plan",
      reviewsMeta: "2.348 Bewertungen",
      youtubeTitle: "Video-SEO",
      youtubeMeta: "Titel und Kalender",
    },
    how: {
      eyebrow: "★ So funktioniert es",
      titleBefore: "Drei Schritte zu einer ",
      titleHighlight: "nachhaltigen",
      titleAfter: " Präsenz.",
      steps: [
        { title: "Audit deiner Präsenz", body: "Wir analysieren dein öffentliches Profil, deine Inhalte, deine Positionierung und deine Ziele. Kein Passwort, kein Kontozugriff." },
        { title: "Zielgerichteter Content-Plan", body: "Du erhältst eine klare Roadmap: Content-Winkel, priorisierte Plattformen, Kalender und Verbesserungsideen." },
        { title: "Tracking und Optimierung", body: "Wir verfolgen die nützlichen Signale, passen die Empfehlungen an und halten den Fortschritt mit deiner Marke im Einklang." },
      ],
    },
    testimonials: {
      eyebrow: "★ Sie vertrauen uns",
      titleBefore: "Sie ",
      titleHighlight: "vertrauen uns",
      titleAfter: ".",
      stats: [
        { n: "32", l: "Audit-Punkte" },
        { n: "8", l: "abgedeckte Plattformen" },
        { n: "4,9/5", l: "Durchschnittsbewertung" },
        { n: "30T", l: "Aktionsplan" },
      ],
      items: [
        { q: "Fanovera hat mir geholfen, meine redaktionelle Linie zu klären und meine Veröffentlichungen zu organisieren, ohne Zahlen hinterherzulaufen.", n: "Léa Marchetti", r: "Musikerin - Launch-Strategie" },
        { q: "Das Audit war konkret: was veröffentlichen, wann veröffentlichen und wie meine Arbeit besser erzählen.", n: "Thomas Durand", r: "Fotograf - Content-Kalender" },
        { q: "Wir haben eine echte Methode rund um meine Short-Formate aufgebaut. Die Nachverfolgung ist einfach, lesbar und nützlich.", n: "Sofia Ramos", r: "Creatorin - TikTok-Begleitung" },
      ],
    },
    faq: {
      eyebrow: "★ FAQ",
      titleBefore: "Deine Fragen, ",
      titleHighlight: "unsere Antworten",
      titleAfter: ".",
      items: [
        { q: "Wie funktioniert euer Service?", a: "Wir analysieren deine öffentliche Präsenz, deine Inhalte und deine Ziele, um einen konkreten und progressiven Sichtbarkeitsplan zu erstellen." },
        { q: "Muss ich meine Passwörter teilen?", a: "Niemals. Fanovera arbeitet mit den öffentlichen Informationen, die du uns gibst. Es wird kein Kontozugriff angefordert." },
        { q: "Was werde ich erhalten?", a: "Ein Audit, eine Content-Strategie, plattformspezifische Empfehlungen und einen Tracking-Rahmen, um deine Sichtbarkeit zu steuern." },
        { q: "Versprecht ihr konkrete Zahlen?", a: "Nein. Wir helfen, deine Präsenz und Kampagnen zu strukturieren, ohne künstliches Volumen oder garantierte Ergebnisse zu versprechen." },
      ],
      contactText: "Eine weitere Frage? Schreib uns",
    },
    cta: { titleBefore: "Bereit, ", titleHighlight: "deine Präsenz", titleAfter: " online zu strukturieren?", body: "Wähle deine Plattform und erstelle einen auf deine Inhalte zugeschnittenen Sichtbarkeitsplan.", footer: "Öffentliches Audit - Content-Strategie - Kein Kontozugriff erforderlich" },
    footer: {
      description: "KI-gestützte Online-Präsenzstrategie: Audit, Content-Kalender und Sichtbarkeits-Tracking.",
      product: "Produkt",
      company: "Unternehmen",
      links: { how: "So funktioniert es", track: "Tracking", testimonials: "Stimmen", faq: "FAQ", legal: "Impressum", terms: "AGB", privacy: "Datenschutz", contact: "Kontakt" },
      madeIn: "Made in Paris",
    },
    chat: { invalidEmail: "Ungültige E-Mail.", shortMessage: "Nachricht zu kurz.", retry: "Fehler, bitte erneut versuchen.", networkRetry: "Netzwerkfehler, bitte erneut versuchen.", open: "Chat öffnen", question: "Eine Frage?", sentHeader: "Nachricht gesendet!", online: "Support - online", greeting: "Hallo! Wie können wir helfen? Gib deine E-Mail ein, um zu starten.", emailLabel: "Deine E-Mail", continue: "Weiter", messageLabel: "Deine Nachricht", messagePlaceholder: "Beschreibe dein Anliegen...", sending: "Wird gesendet...", send: "Nachricht senden", thanks: "Danke!", reply: (email) => `Wir antworten dir an ${email} so schnell wie möglich.`, close: "Schließen", privacy: "Deine Daten sind geschützt und verschlüsselt" },
    order: { confirmError: "Bestellung konnte nicht bestätigt werden.", unexpected: "Unerwarteter Fehler.", title: "Bestellung bestätigt", thanks: "Danke für deinen Kauf. Deine Bestellung ist eingegangen.", finalizing: "Bestellung wird abgeschlossen...", verifying: "Zahlung wird überprüft...", fallbackError: "Wir konnten deine Bestellung nicht automatisch abschließen.", track: (id) => `Meine Bestellung #${id} verfolgen`, home: "Zur Startseite" },
    track: { notFound: "Bestellung nicht gefunden.", unexpected: "Unerwarteter Fehler.", title: "Bestellverfolgung", loading: "Wird geladen...", summary: (id, platform, status) => `Bestellung #${id} - ${platform} - Gesamtstatus ${status}`, delivered: "Geliefert", remaining: "Verbleibend" },
    payment: { paying: "Zahlung wird verarbeitet…", pay: "Bezahlen", loading: "Sichere Zahlung wird geladen…", paymentError: "Zahlungsfehler", orPayByCard: "oder mit Karte bezahlen", networkError: "Verbindung zum Zahlungsdienst nicht möglich." },
  },
  it: {
    header: { track: "Tracciamento", faq: "FAQ", contact: "Contatto", start: "Inizia" },
    hero: {
      stars: [
        { q: "Audit chiaro e piano azionabile", a: "Léa M., musicista" },
        { q: "Servizio serio, monitoraggio leggibile", a: "Karim T., founder DTC" },
        { q: "Un vero quadro per pubblicare meglio", a: "Studio Métrique" },
      ],
      newCampaign: "+ Nuova campagna",
      menu: ["Dashboard", "Campagne", "Audience IA", "Statistiche", "Reti", "Fatturazione"],
      activeNetworks: "RETI ATTIVE",
      campaign: "Campagna #042",
      campaignMeta: "Attiva - Giorno 18 di 30",
      stats: [
        { l: "Audit", v: "32 pt", d: "prioritarizzati" },
        { l: "Contenuti", v: "18 idee", d: "pronte" },
        { l: "Pianificazione", v: "30 g", d: "ritmo" },
      ],
      chartTitle: "Piano di visibilità - 30 giorni",
      cardLabel: "Audit e strategia",
      cardCta: "Vedi la soluzione",
      titleBefore: "Una presenza online ",
      titleHighlight: "più chiara",
      titleAfter: ", senza promesse artificiali.",
      rating: "Valutazione 4,9/5",
      reviews: "2.348 recensioni",
      tiktokLabel: "TIKTOK",
      tiktokValue: "audit",
      spotifyTitle: "Audit Spotify",
      spotifyMeta: "piano di lancio",
      reviewsMeta: "2.348 recensioni",
      youtubeTitle: "SEO video",
      youtubeMeta: "titoli e calendario",
    },
    how: {
      eyebrow: "★ Come funziona",
      titleBefore: "Tre passi per una presenza ",
      titleHighlight: "duratura",
      titleAfter: ".",
      steps: [
        { title: "Audit della tua presenza", body: "Analizziamo il tuo profilo pubblico, i tuoi contenuti, il tuo posizionamento e i tuoi obiettivi. Nessuna password, nessun accesso all'account." },
        { title: "Piano editoriale mirato", body: "Ricevi una roadmap chiara: angoli di contenuto, piattaforme prioritarie, calendario e idee di miglioramento." },
        { title: "Monitoraggio e ottimizzazione", body: "Monitoriamo i segnali utili, regoliamo le raccomandazioni e manteniamo un progresso coerente con il tuo brand." },
      ],
    },
    testimonials: {
      eyebrow: "★ Si fidano di noi",
      titleBefore: "Si ",
      titleHighlight: "fidano di noi",
      titleAfter: ".",
      stats: [
        { n: "32", l: "punti di audit" },
        { n: "8", l: "piattaforme coperte" },
        { n: "4,9/5", l: "valutazione media" },
        { n: "30g", l: "piano d'azione" },
      ],
      items: [
        { q: "Fanovera mi ha aiutata a chiarire la mia linea editoriale e a organizzare le mie uscite senza inseguire i numeri.", n: "Léa Marchetti", r: "Musicista - strategia di lancio" },
        { q: "L'audit era concreto: cosa pubblicare, quando pubblicarlo e come raccontare meglio il mio lavoro.", n: "Thomas Durand", r: "Fotografo - calendario contenuti" },
        { q: "Abbiamo costruito un vero metodo intorno ai miei formati brevi. Il monitoraggio è semplice, leggibile e utile.", n: "Sofia Ramos", r: "Creatrice - supporto TikTok" },
      ],
    },
    faq: {
      eyebrow: "★ FAQ",
      titleBefore: "Le tue domande, ",
      titleHighlight: "le nostre risposte",
      titleAfter: ".",
      items: [
        { q: "Come funziona il vostro servizio?", a: "Analizziamo la tua presenza pubblica, i contenuti e gli obiettivi per preparare un piano di visibilità concreto e progressivo." },
        { q: "Devo darvi le mie password?", a: "Mai. Fanovera funziona con le informazioni pubbliche che ci indichi. Non viene richiesto alcun accesso all'account." },
        { q: "Cosa riceverò?", a: "Un audit, una strategia di contenuto, raccomandazioni per piattaforma e un quadro di monitoraggio per gestire la tua visibilità." },
        { q: "Promettete numeri precisi?", a: "No. Aiutiamo a strutturare la tua presenza e le campagne senza promettere volumi artificiali né risultati garantiti." },
      ],
      contactText: "Un'altra domanda? Scrivici",
    },
    cta: { titleBefore: "Pronto a strutturare ", titleHighlight: "la tua presenza", titleAfter: " online?", body: "Scegli la tua piattaforma e prepara un piano di visibilità adatto ai tuoi contenuti.", footer: "Audit pubblico - Strategia di contenuto - Nessun accesso all'account" },
    footer: {
      description: "Strategia di presenza online con IA: audit, calendario contenuti e monitoraggio di visibilità.",
      product: "Prodotto",
      company: "Azienda",
      links: { how: "Come funziona", track: "Tracciamento", testimonials: "Testimonianze", faq: "FAQ", legal: "Note legali", terms: "Termini", privacy: "Privacy", contact: "Contatto" },
      madeIn: "Made in Paris",
    },
    chat: { invalidEmail: "Email non valida.", shortMessage: "Messaggio troppo corto.", retry: "Errore, riprova.", networkRetry: "Errore di rete, riprova.", open: "Apri la chat", question: "Una domanda?", sentHeader: "Messaggio inviato!", online: "Supporto - online", greeting: "Ciao! Come possiamo aiutarti? Inserisci la tua email per iniziare.", emailLabel: "La tua email", continue: "Continua", messageLabel: "Il tuo messaggio", messagePlaceholder: "Descrivi la tua richiesta...", sending: "Invio in corso...", send: "Invia messaggio", thanks: "Grazie!", reply: (email) => `Ti risponderemo a ${email} il prima possibile.`, close: "Chiudi", privacy: "I tuoi dati sono protetti e crittografati" },
    order: { confirmError: "Impossibile confermare il tuo ordine.", unexpected: "Errore imprevisto.", title: "Ordine confermato", thanks: "Grazie per il tuo acquisto. Il tuo ordine è stato ricevuto.", finalizing: "Finalizzazione dell'ordine...", verifying: "Verifica del pagamento...", fallbackError: "Non siamo riusciti a finalizzare automaticamente il tuo ordine.", track: (id) => `Traccia il mio ordine #${id}`, home: "Torna alla home" },
    track: { notFound: "Ordine non trovato.", unexpected: "Errore imprevisto.", title: "Tracciamento ordine", loading: "Caricamento...", summary: (id, platform, status) => `Ordine #${id} - ${platform} - stato globale ${status}`, delivered: "Consegnato", remaining: "Rimanente" },
    payment: { paying: "Elaborazione pagamento…", pay: "Paga", loading: "Caricamento pagamento sicuro…", paymentError: "Errore di pagamento", orPayByCard: "o paga con carta", networkError: "Impossibile connettersi al servizio di pagamento." },
  },
  tr: {
    header: { track: "Takip", faq: "SSS", contact: "İletişim", start: "Başla" },
    hero: {
      stars: [
        { q: "Net denetim ve uygulanabilir plan", a: "Léa M., müzisyen" },
        { q: "Ciddi hizmet, okunabilir takip", a: "Karim T., DTC kurucusu" },
        { q: "Daha iyi yayınlamak için gerçek bir çerçeve", a: "Studio Métrique" },
      ],
      newCampaign: "+ Yeni kampanya",
      menu: ["Panel", "Kampanyalar", "AI hedef kitle", "İstatistikler", "Ağlar", "Faturalandırma"],
      activeNetworks: "AKTİF AĞLAR",
      campaign: "Kampanya #042",
      campaignMeta: "Aktif - 30 günden 18'i",
      stats: [
        { l: "Denetim", v: "32 pt", d: "öncelikli" },
        { l: "İçerikler", v: "18 fikir", d: "hazır" },
        { l: "Planlama", v: "30 g", d: "ritim" },
      ],
      chartTitle: "Görünürlük planı - 30 gün",
      cardLabel: "Denetim ve strateji",
      cardCta: "Çözümü gör",
      titleBefore: "Yapay vaatler olmadan ",
      titleHighlight: "daha net",
      titleAfter: " bir online varlık.",
      rating: "Puan 4,9/5",
      reviews: "2.348 yorum",
      tiktokLabel: "TIKTOK",
      tiktokValue: "denetim",
      spotifyTitle: "Spotify denetimi",
      spotifyMeta: "lansman planı",
      reviewsMeta: "2.348 yorum",
      youtubeTitle: "Video SEO",
      youtubeMeta: "başlıklar ve takvim",
    },
    how: {
      eyebrow: "★ Nasıl çalışır",
      titleBefore: "Kalıcı bir varlık için ",
      titleHighlight: "üç adım",
      titleAfter: ".",
      steps: [
        { title: "Varlığınızın denetimi", body: "Herkese açık profilinizi, içeriklerinizi, konumlandırmanızı ve hedeflerinizi inceleriz. Şifre yok, hesap erişimi yok." },
        { title: "Hedefli editöryal plan", body: "Net bir yol haritası alırsınız: içerik açıları, öncelikli platformlar, takvim ve iyileştirme fikirleri." },
        { title: "Takip ve optimizasyon", body: "Yararlı sinyalleri izler, önerileri ayarlar ve markanızla uyumlu bir ilerleme sürdürürüz." },
      ],
    },
    testimonials: {
      eyebrow: "★ Bize güveniyorlar",
      titleBefore: "Bize ",
      titleHighlight: "güveniyorlar",
      titleAfter: ".",
      stats: [
        { n: "32", l: "denetim noktası" },
        { n: "8", l: "kapsanan platform" },
        { n: "4,9/5", l: "ortalama puan" },
        { n: "30g", l: "eylem planı" },
      ],
      items: [
        { q: "Fanovera editöryal çizgimi netleştirmemde ve sayıların peşinde koşmadan paylaşımlarımı düzenlememde yardımcı oldu.", n: "Léa Marchetti", r: "Müzisyen - lansman stratejisi" },
        { q: "Denetim somuttu: ne yayınlamalı, ne zaman yayınlamalı ve işimi nasıl daha iyi anlatmalı.", n: "Thomas Durand", r: "Fotoğrafçı - içerik takvimi" },
        { q: "Kısa formatlarım etrafında gerçek bir yöntem oluşturduk. Takip basit, okunabilir ve faydalı.", n: "Sofia Ramos", r: "İçerik üreticisi - TikTok desteği" },
      ],
    },
    faq: {
      eyebrow: "★ SSS",
      titleBefore: "Sorularınız, ",
      titleHighlight: "cevaplarımız",
      titleAfter: ".",
      items: [
        { q: "Hizmetiniz nasıl çalışır?", a: "Somut ve aşamalı bir görünürlük planı hazırlamak için herkese açık varlığınızı, içeriklerinizi ve hedeflerinizi inceleriz." },
        { q: "Şifremi vermem gerekiyor mu?", a: "Asla. Fanovera bize ilettiğiniz herkese açık bilgilerle çalışır. Hesap erişimi talep edilmez." },
        { q: "Ne alacağım?", a: "Görünürlüğünüzü yönetmek için bir denetim, içerik stratejisi, platforma özel öneriler ve bir takip çerçevesi." },
        { q: "Belirli rakamlar vaat ediyor musunuz?", a: "Hayır. Yapay hacim veya garantili sonuç vaat etmeden varlığınızı ve kampanyalarınızı yapılandırmaya yardımcı oluyoruz." },
      ],
      contactText: "Başka bir soru? Bize yazın",
    },
    cta: { titleBefore: "Online ", titleHighlight: "varlığınızı", titleAfter: " yapılandırmaya hazır mısınız?", body: "Platformunuzu seçin ve içeriklerinize uygun bir görünürlük planı hazırlayın.", footer: "Herkese açık denetim - İçerik stratejisi - Hesap erişimi gerekmez" },
    footer: {
      description: "AI destekli online varlık stratejisi: denetim, içerik takvimi ve görünürlük takibi.",
      product: "Ürün",
      company: "Şirket",
      links: { how: "Nasıl çalışır", track: "Takip", testimonials: "Yorumlar", faq: "SSS", legal: "Yasal bilgiler", terms: "Koşullar", privacy: "Gizlilik", contact: "İletişim" },
      madeIn: "Made in Paris",
    },
    chat: { invalidEmail: "Geçersiz e-posta.", shortMessage: "Mesaj çok kısa.", retry: "Hata, tekrar deneyin.", networkRetry: "Ağ hatası, tekrar deneyin.", open: "Sohbeti aç", question: "Bir sorunuz mu var?", sentHeader: "Mesaj gönderildi!", online: "Destek - çevrimiçi", greeting: "Merhaba! Size nasıl yardımcı olabiliriz? Başlamak için e-postanızı girin.", emailLabel: "E-posta adresiniz", continue: "Devam", messageLabel: "Mesajınız", messagePlaceholder: "Talebinizi açıklayın...", sending: "Gönderiliyor...", send: "Mesajı gönder", thanks: "Teşekkürler!", reply: (email) => `Size en kısa sürede ${email} adresinden yanıt vereceğiz.`, close: "Kapat", privacy: "Verileriniz korunur ve şifrelenir" },
    order: { confirmError: "Siparişiniz onaylanamadı.", unexpected: "Beklenmeyen hata.", title: "Sipariş onaylandı", thanks: "Satın aldığınız için teşekkürler. Siparişiniz alındı.", finalizing: "Sipariş sonlandırılıyor...", verifying: "Ödeme doğrulanıyor...", fallbackError: "Siparişinizi otomatik olarak sonlandıramadık.", track: (id) => `Siparişimi takip et #${id}`, home: "Ana sayfaya dön" },
    track: { notFound: "Sipariş bulunamadı.", unexpected: "Beklenmeyen hata.", title: "Sipariş takibi", loading: "Yükleniyor...", summary: (id, platform, status) => `Sipariş #${id} - ${platform} - genel durum ${status}`, delivered: "Teslim edildi", remaining: "Kalan" },
    payment: { paying: "Ödeme işleniyor…", pay: "Öde", loading: "Güvenli ödeme yükleniyor…", paymentError: "Ödeme hatası", orPayByCard: "veya kartla öde", networkError: "Ödeme hizmetine bağlanılamadı." },
  },
};

export function getPublicCopy(locale: SupportedLocale, marketingMode: MarketingMode = "clean", surfaceMode: SurfaceMarketingMode = "whitehat") {
  const base = applyPerformancePublicCopy(locale, marketingMode, PUBLIC_COPY[locale] || PUBLIC_COPY.fr);
  return applyBlackhatPublicCopy(locale, surfaceMode, base);
}
