"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import NetIcon from "../components/NetIcon";
import { NETWORKS, type NetworkId } from "../lib/networks";
import type { SupportedLocale } from "../i18n/types";

type LiveService = {
  service: string;
  platform: string;
  qty: number;
  status: string;
  delivered: number;
  remains: number | null;
  pct: number;
  error?: string | null;
};

type LiveOrder = {
  id: number;
  status: string;
  services: LiveService[];
};

type LiveState =
  | { kind: "loading" }
  | { kind: "ready"; data: LiveOrder }
  | { kind: "error" };

type OrderSummary = {
  id: number;
  username: string | null;
  platform: string | null;
  total_cents: number | null;
  status: string | null;
  created_at: string | null;
  currency: string | null;
};

type LookupCopy = {
  badge: string;
  title: string;
  titleFocus: string;
  titleAfter: string;
  intro: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailHint: string;
  submit: string;
  loading: string;
  searching: string;
  empty: string;
  emptyHint: string;
  found: (count: number) => string;
  track: string;
  order: (id: number) => string;
  status: string;
  amount: string;
  date: string;
  recipient: string;
  invalidEmail: string;
  unexpected: string;
  trust1: string;
  trust2: string;
  trust3: string;
  syncing: string;
  progressLabel: string;
  helpTitle: string;
  helpBody: string;
  helpCta: string;
  statusLabels: Record<string, string>;
};

const COPY: Record<SupportedLocale, LookupCopy> = {
  fr: {
    badge: "Suivi de commande",
    title: "Retrouvez votre",
    titleFocus: "commande",
    titleAfter: " en un instant.",
    intro:
      "Entrez l'e-mail utilisé au paiement, on retrouve l'ensemble de vos commandes Fanovera et leur avancement en temps réel.",
    emailLabel: "E-mail de la commande",
    emailPlaceholder: "vous@exemple.com",
    emailHint: "On ne stocke rien : votre e-mail sert uniquement à retrouver vos commandes.",
    submit: "Rechercher mes commandes",
    loading: "Recherche…",
    searching: "On cherche vos commandes…",
    empty: "Aucune commande trouvée pour cet e-mail.",
    emptyHint:
      "Vérifiez l'orthographe ou utilisez l'e-mail exact saisi au paiement (souvent celui qui a reçu la facture).",
    found: (count) => `${count} commande${count > 1 ? "s" : ""} trouvée${count > 1 ? "s" : ""}.`,
    track: "Voir le suivi",
    order: (id) => `Commande #${id}`,
    status: "Statut",
    amount: "Montant",
    date: "Date",
    recipient: "Cible",
    invalidEmail: "Veuillez entrer un e-mail valide.",
    unexpected: "Une erreur est survenue. Réessayez dans quelques instants.",
    trust1: "Paiement sécurisé",
    trust2: "Aucun mot de passe requis",
    trust3: "Suivi inclus",
    syncing: "Synchronisation…",
    progressLabel: "Livré",
    helpTitle: "Vous ne trouvez pas votre commande ?",
    helpBody:
      "Si vous avez utilisé un autre e-mail au paiement ou si vous ne recevez plus la facture, notre équipe peut vous aider en moins de 24 h.",
    helpCta: "Contacter le support",
    statusLabels: {
      paid: "Payée",
      processing: "En cours",
      placed: "En cours",
      pending: "En attente",
      delivered: "Livrée",
      completed: "Livrée",
      partial: "Partielle",
      failed: "Échec",
      canceled: "Annulée",
      cancelled: "Annulée",
      refunded: "Remboursée",
    },
  },
  en: {
    badge: "Order tracking",
    title: "Find your",
    titleFocus: "order",
    titleAfter: " in a second.",
    intro:
      "Enter the e-mail used at checkout — we'll pull up all your Fanovera orders and their live progress.",
    emailLabel: "Order e-mail",
    emailPlaceholder: "you@example.com",
    emailHint: "We don't store anything: your e-mail is only used to look up your orders.",
    submit: "Look up my orders",
    loading: "Searching…",
    searching: "Searching for your orders…",
    empty: "No order found for this e-mail.",
    emptyHint:
      "Check the spelling or try the exact e-mail used at checkout (usually the one that received the invoice).",
    found: (count) => `${count} order${count > 1 ? "s" : ""} found.`,
    track: "View tracking",
    order: (id) => `Order #${id}`,
    status: "Status",
    amount: "Amount",
    date: "Date",
    recipient: "Target",
    invalidEmail: "Please enter a valid e-mail.",
    unexpected: "Something went wrong. Please try again shortly.",
    trust1: "Secure payment",
    trust2: "No password required",
    trust3: "Tracking included",
    syncing: "Syncing…",
    progressLabel: "Delivered",
    helpTitle: "Can't find your order?",
    helpBody:
      "If you used a different e-mail at checkout, or if the invoice never arrived, our team can help within 24 h.",
    helpCta: "Contact support",
    statusLabels: {
      paid: "Paid",
      processing: "Processing",
      placed: "Processing",
      pending: "Pending",
      delivered: "Delivered",
      completed: "Delivered",
      partial: "Partial",
      failed: "Failed",
      canceled: "Canceled",
      cancelled: "Canceled",
      refunded: "Refunded",
    },
  },
  es: {
    badge: "Seguimiento de pedido",
    title: "Encuentra tu",
    titleFocus: "pedido",
    titleAfter: " en un instante.",
    intro: "Introduce el correo usado al pagar y recuperamos todos tus pedidos Fanovera con su progreso en tiempo real.",
    emailLabel: "Correo del pedido",
    emailPlaceholder: "tu@ejemplo.com",
    emailHint: "No guardamos nada: tu correo solo se usa para localizar tus pedidos.",
    submit: "Buscar mis pedidos",
    loading: "Buscando…",
    searching: "Buscando tus pedidos…",
    empty: "No se encontró ningún pedido para este correo.",
    emptyHint: "Verifica la ortografía o usa el correo exacto del pago (suele ser el que recibió la factura).",
    found: (count) => `${count} pedido${count > 1 ? "s" : ""} encontrado${count > 1 ? "s" : ""}.`,
    track: "Ver seguimiento",
    order: (id) => `Pedido #${id}`,
    status: "Estado",
    amount: "Importe",
    date: "Fecha",
    recipient: "Cuenta",
    invalidEmail: "Introduce un correo válido.",
    unexpected: "Algo salió mal. Inténtalo de nuevo en unos instantes.",
    trust1: "Pago seguro",
    trust2: "Sin contraseña",
    trust3: "Seguimiento incluido",
    syncing: "Sincronizando…",
    progressLabel: "Entregado",
    helpTitle: "¿No encuentras tu pedido?",
    helpBody: "Si usaste otro correo al pagar o no recibiste la factura, nuestro equipo te ayuda en menos de 24 h.",
    helpCta: "Contactar soporte",
    statusLabels: {
      paid: "Pagado", processing: "En curso", placed: "En curso", pending: "Pendiente",
      delivered: "Entregado", completed: "Entregado", partial: "Parcial", failed: "Fallido",
      canceled: "Cancelado", cancelled: "Cancelado", refunded: "Reembolsado",
    },
  },
  pt: {
    badge: "Acompanhamento de pedido",
    title: "Encontre o seu",
    titleFocus: "pedido",
    titleAfter: " num instante.",
    intro: "Insira o e-mail usado no pagamento — vamos buscar todos os seus pedidos Fanovera com o progresso em tempo real.",
    emailLabel: "E-mail do pedido",
    emailPlaceholder: "voce@exemplo.com",
    emailHint: "Não guardamos nada: o seu e-mail serve apenas para localizar os seus pedidos.",
    submit: "Pesquisar os meus pedidos",
    loading: "A pesquisar…",
    searching: "A procurar os seus pedidos…",
    empty: "Nenhum pedido encontrado para este e-mail.",
    emptyHint: "Verifique a ortografia ou use o e-mail exato do pagamento (normalmente o que recebeu a fatura).",
    found: (count) => `${count} pedido${count > 1 ? "s" : ""} encontrado${count > 1 ? "s" : ""}.`,
    track: "Ver acompanhamento",
    order: (id) => `Pedido #${id}`,
    status: "Estado",
    amount: "Valor",
    date: "Data",
    recipient: "Conta",
    invalidEmail: "Introduza um e-mail válido.",
    unexpected: "Algo correu mal. Tente novamente em instantes.",
    trust1: "Pagamento seguro",
    trust2: "Sem palavra-passe",
    trust3: "Acompanhamento incluído",
    syncing: "A sincronizar…",
    progressLabel: "Entregue",
    helpTitle: "Não encontra o seu pedido?",
    helpBody: "Se usou outro e-mail no pagamento ou não recebeu a fatura, a nossa equipa ajuda em menos de 24 h.",
    helpCta: "Contactar o suporte",
    statusLabels: {
      paid: "Pago", processing: "Em andamento", placed: "Em andamento", pending: "Pendente",
      delivered: "Entregue", completed: "Entregue", partial: "Parcial", failed: "Falhou",
      canceled: "Cancelado", cancelled: "Cancelado", refunded: "Reembolsado",
    },
  },
  de: {
    badge: "Bestellverfolgung",
    title: "Finde deine",
    titleFocus: "Bestellung",
    titleAfter: " in Sekunden.",
    intro: "Gib die beim Bezahlen verwendete E-Mail ein — wir holen alle deine Fanovera-Bestellungen mit ihrem aktuellen Status.",
    emailLabel: "Bestell-E-Mail",
    emailPlaceholder: "du@beispiel.de",
    emailHint: "Wir speichern nichts: deine E-Mail dient nur dazu, deine Bestellungen zu finden.",
    submit: "Bestellungen suchen",
    loading: "Suche läuft…",
    searching: "Bestellungen werden gesucht…",
    empty: "Keine Bestellung für diese E-Mail gefunden.",
    emptyHint: "Überprüfe die Schreibweise oder nutze die exakte E-Mail vom Bezahlvorgang (meist die, an die die Rechnung ging).",
    found: (count) => `${count} Bestellung${count > 1 ? "en" : ""} gefunden.`,
    track: "Verfolgung ansehen",
    order: (id) => `Bestellung #${id}`,
    status: "Status",
    amount: "Betrag",
    date: "Datum",
    recipient: "Konto",
    invalidEmail: "Bitte gib eine gültige E-Mail ein.",
    unexpected: "Etwas ist schiefgelaufen. Bitte versuche es gleich erneut.",
    trust1: "Sichere Zahlung",
    trust2: "Kein Passwort nötig",
    trust3: "Tracking inklusive",
    syncing: "Synchronisierung…",
    progressLabel: "Geliefert",
    helpTitle: "Findest du deine Bestellung nicht?",
    helpBody: "Wenn du eine andere E-Mail beim Bezahlen verwendet hast oder die Rechnung nicht ankam, hilft unser Team in unter 24 Stunden.",
    helpCta: "Support kontaktieren",
    statusLabels: {
      paid: "Bezahlt", processing: "In Bearbeitung", placed: "In Bearbeitung", pending: "Ausstehend",
      delivered: "Geliefert", completed: "Geliefert", partial: "Teilweise", failed: "Fehlgeschlagen",
      canceled: "Storniert", cancelled: "Storniert", refunded: "Erstattet",
    },
  },
  it: {
    badge: "Tracciamento ordine",
    title: "Trova il tuo",
    titleFocus: "ordine",
    titleAfter: " in un attimo.",
    intro: "Inserisci l'e-mail usata al pagamento — recuperiamo tutti i tuoi ordini Fanovera con l'avanzamento in tempo reale.",
    emailLabel: "E-mail dell'ordine",
    emailPlaceholder: "tu@esempio.com",
    emailHint: "Non conserviamo nulla: la tua e-mail serve solo a ritrovare i tuoi ordini.",
    submit: "Cerca i miei ordini",
    loading: "Ricerca…",
    searching: "Stiamo cercando i tuoi ordini…",
    empty: "Nessun ordine trovato per questa e-mail.",
    emptyHint: "Controlla l'ortografia o usa l'e-mail esatta del pagamento (in genere quella che ha ricevuto la fattura).",
    found: (count) => `${count} ordine${count > 1 ? "i" : ""} trovato${count > 1 ? "i" : ""}.`,
    track: "Vedi tracciamento",
    order: (id) => `Ordine #${id}`,
    status: "Stato",
    amount: "Importo",
    date: "Data",
    recipient: "Account",
    invalidEmail: "Inserisci un'e-mail valida.",
    unexpected: "Qualcosa è andato storto. Riprova tra un momento.",
    trust1: "Pagamento sicuro",
    trust2: "Nessuna password richiesta",
    trust3: "Tracciamento incluso",
    syncing: "Sincronizzazione…",
    progressLabel: "Consegnato",
    helpTitle: "Non trovi il tuo ordine?",
    helpBody: "Se hai usato un'altra e-mail al pagamento o se non hai ricevuto la fattura, il nostro team ti aiuta entro 24 h.",
    helpCta: "Contatta il supporto",
    statusLabels: {
      paid: "Pagato", processing: "In corso", placed: "In corso", pending: "In attesa",
      delivered: "Consegnato", completed: "Consegnato", partial: "Parziale", failed: "Fallito",
      canceled: "Annullato", cancelled: "Annullato", refunded: "Rimborsato",
    },
  },
  tr: {
    badge: "Sipariş takibi",
    title: "Siparişini",
    titleFocus: "anında",
    titleAfter: " bul.",
    intro: "Ödemede kullandığın e-postayı gir — tüm Fanovera siparişlerini ve canlı ilerlemelerini getiriyoruz.",
    emailLabel: "Sipariş e-postası",
    emailPlaceholder: "sen@ornek.com",
    emailHint: "Hiçbir şey saklamıyoruz: e-postan yalnızca siparişlerini bulmak için kullanılır.",
    submit: "Siparişlerimi ara",
    loading: "Aranıyor…",
    searching: "Siparişlerin aranıyor…",
    empty: "Bu e-posta için sipariş bulunamadı.",
    emptyHint: "Yazımı kontrol et veya ödemede kullandığın tam e-postayı dene (genellikle faturayı alan e-posta).",
    found: (count) => `${count} sipariş bulundu.`,
    track: "Takibi gör",
    order: (id) => `Sipariş #${id}`,
    status: "Durum",
    amount: "Tutar",
    date: "Tarih",
    recipient: "Hesap",
    invalidEmail: "Geçerli bir e-posta gir.",
    unexpected: "Bir şeyler ters gitti. Lütfen birazdan tekrar dene.",
    trust1: "Güvenli ödeme",
    trust2: "Şifre gerekmez",
    trust3: "Takip dahildir",
    syncing: "Senkronize ediliyor…",
    progressLabel: "Teslim edildi",
    helpTitle: "Siparişini bulamıyor musun?",
    helpBody: "Ödemede başka bir e-posta kullandıysan veya faturayı almadıysan, ekibimiz 24 saatten kısa sürede yardım eder.",
    helpCta: "Destekle iletişime geç",
    statusLabels: {
      paid: "Ödendi", processing: "İşleniyor", placed: "İşleniyor", pending: "Beklemede",
      delivered: "Teslim edildi", completed: "Teslim edildi", partial: "Kısmi", failed: "Başarısız",
      canceled: "İptal edildi", cancelled: "İptal edildi", refunded: "İade edildi",
    },
  },
};

const STORAGE_KEY = "fanovera_track_email";
const NETWORK_BY_ID = new Map<string, (typeof NETWORKS)[number]>(
  NETWORKS.map((n) => [n.id, n]),
);

function statusTone(status: string | null): { bg: string; fg: string } {
  const s = (status || "").toLowerCase();
  if (s.includes("deliver") || s.includes("complet")) return { bg: "rgba(77,191,138,0.12)", fg: "var(--green)" };
  if (s.includes("partial")) return { bg: "rgba(255,138,76,0.14)", fg: "#c4621c" };
  if (s.includes("fail") || s.includes("cancel")) return { bg: "rgba(225,64,126,0.10)", fg: "#b42367" };
  if (s.includes("process") || s.includes("placed") || s.includes("pending")) return { bg: "rgba(82,96,230,0.10)", fg: "var(--primary)" };
  if (s.includes("paid")) return { bg: "rgba(77,191,138,0.12)", fg: "var(--green)" };
  return { bg: "var(--paper-2)", fg: "var(--ink-2)" };
}

const INTL_LOCALE: Record<string, string> = {
  fr: "fr-FR", en: "en-US", es: "es-ES", pt: "pt-PT", de: "de-DE", it: "it-IT", tr: "tr-TR",
};

function formatAmount(cents: number | null, currency: string | null, locale: string) {
  if (typeof cents !== "number") return "—";
  const normalizedCurrency = (currency || "eur").toUpperCase();
  try {
    return new Intl.NumberFormat(INTL_LOCALE[locale] || "fr-FR", {
      style: "currency",
      currency: normalizedCurrency,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${normalizedCurrency}`;
  }
}

function formatDate(value: string | null, locale: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(INTL_LOCALE[locale] || "fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function platformMeta(platform: string | null) {
  if (!platform) return { name: "Fanovera", color: "var(--primary)", icon: null as NetworkId | null };
  const key = platform.toLowerCase();
  const network = NETWORK_BY_ID.get(key);
  if (network) return { name: network.name, color: network.color, icon: network.icon };
  return { name: platform, color: "var(--primary)", icon: null };
}

function SkeletonCard() {
  return (
    <div
      aria-hidden
      style={{
        border: "1px solid var(--line)",
        borderRadius: 18,
        padding: 20,
        background: "white",
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--paper-2)" }} />
        <div style={{ flex: 1, display: "grid", gap: 8 }}>
          <div style={{ height: 14, width: "40%", background: "var(--paper-2)", borderRadius: 8 }} />
          <div style={{ height: 11, width: "60%", background: "var(--paper-2)", borderRadius: 8 }} />
        </div>
        <div style={{ height: 36, width: 110, background: "var(--paper-2)", borderRadius: 999 }} />
      </div>
      <div style={{ display: "flex", gap: 18 }}>
        <div style={{ height: 10, width: 80, background: "var(--paper-2)", borderRadius: 6 }} />
        <div style={{ height: 10, width: 80, background: "var(--paper-2)", borderRadius: 6 }} />
        <div style={{ height: 10, width: 80, background: "var(--paper-2)", borderRadius: 6 }} />
      </div>
    </div>
  );
}

export default function TrackLookupClient() {
  const { locale } = useI18n();
  const copy = COPY[locale] || COPY.fr;
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [liveById, setLiveById] = useState<Record<number, LiveState>>({});

  const emailIsValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);

  // Pre-fill from previous search
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setEmail(saved);
    } catch {
      /* noop */
    }
  }, []);

  // Fetch live status (from BulkFollows via /api/order/[id]) for every order in parallel
  useEffect(() => {
    if (orders.length === 0) {
      setLiveById({});
      return;
    }
    const controller = new AbortController();
    // Mark all as loading
    setLiveById(() => {
      const init: Record<number, LiveState> = {};
      for (const o of orders) init[o.id] = { kind: "loading" };
      return init;
    });
    orders.forEach((order) => {
      fetch(`/api/order/${encodeURIComponent(String(order.id))}`, { signal: controller.signal })
        .then(async (res) => {
          if (!res.ok) throw new Error(String(res.status));
          const json = (await res.json()) as LiveOrder;
          setLiveById((prev) => ({ ...prev, [order.id]: { kind: "ready", data: json } }));
        })
        .catch((err) => {
          if ((err as Error)?.name === "AbortError") return;
          setLiveById((prev) => ({ ...prev, [order.id]: { kind: "error" } }));
        });
    });
    return () => controller.abort();
  }, [orders]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setTouched(true);

    if (!emailIsValid) {
      setError(copy.invalidEmail);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(false);
    try {
      const response = await fetch("/api/orders-by-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json?.error || copy.unexpected);

      const list: OrderSummary[] = Array.isArray(json?.orders) ? json.orders : [];
      setOrders(list);
      setSearched(true);

      // Persist the last successful e-mail for convenience
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, email.trim());
        }
      } catch {
        /* noop */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.unexpected);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="slide-in" style={{ padding: "32px 0 64px", position: "relative" }}>
      <div className="container" style={{ maxWidth: 920, position: "relative", zIndex: 1 }}>
        {/* Hero */}
        <header style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 28px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "white",
              border: "1px solid var(--line)",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              marginBottom: 18,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M7 1v3M7 10v3M13 7h-3M4 7H1M11.2 2.8L9.1 4.9M4.9 9.1L2.8 11.2M11.2 11.2L9.1 9.1M4.9 4.9L2.8 2.8" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            {copy.badge}
          </span>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 48px)", margin: "0 0 14px", lineHeight: 1.1 }}>
            {copy.title} <span className="squiggle">{copy.titleFocus}</span>
            {copy.titleAfter}
          </h1>
          <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55, margin: 0 }}>
            {copy.intro}
          </p>
        </header>

        {/* Search card */}
        <section
          style={{
            background: "white",
            border: "1px solid var(--line)",
            borderRadius: 24,
            padding: "28px 28px 24px",
            boxShadow: "0 14px 40px -20px rgba(15, 23, 42, 0.18)",
            marginTop: 8,
          }}
        >
          <form onSubmit={submit} noValidate>
            <label
              htmlFor="track-email"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginBottom: 10,
              }}
            >
              {copy.emailLabel}
            </label>
            <div className="track-input-row">
              <div className="input-shell" style={{ flex: 1, paddingLeft: 14 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ color: "var(--ink-3)" }}>
                  <path d="M3 8l9 6 9-6M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  id="track-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder={copy.emailPlaceholder}
                  autoComplete="email"
                  spellCheck={false}
                  autoCapitalize="none"
                  inputMode="email"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ minHeight: 56, padding: "0 26px", whiteSpace: "nowrap" }}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" aria-hidden />
                    {copy.loading}
                  </>
                ) : (
                  <>
                    {copy.submit}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            {touched && email && !emailIsValid && !error && (
              <div style={{ marginTop: 10, fontSize: 13, color: "#b42318" }}>
                {copy.invalidEmail}
              </div>
            )}
            {error && (
              <div
                role="alert"
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  background: "rgba(180,35,24,0.08)",
                  border: "1px solid rgba(180,35,24,0.20)",
                  borderRadius: 12,
                  fontSize: 13,
                  color: "#b42318",
                }}
              >
                {error}
              </div>
            )}

            <p style={{ marginTop: 12, fontSize: 12, color: "var(--ink-3)" }}>{copy.emailHint}</p>
          </form>

        </section>

        {/* Loading */}
        {loading && (
          <section style={{ marginTop: 28, display: "grid", gap: 12 }} aria-live="polite">
            <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>{copy.searching}</p>
            <SkeletonCard />
            <SkeletonCard />
          </section>
        )}

        {/* Results / empty */}
        {!loading && searched && (
          <section style={{ marginTop: 28 }} aria-live="polite">
            {orders.length === 0 ? (
              <div
                style={{
                  background: "white",
                  border: "1px dashed var(--line)",
                  borderRadius: 20,
                  padding: "32px 28px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "var(--paper-2)",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 14px",
                  }}
                  aria-hidden
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="var(--ink-3)" strokeWidth="1.8" />
                    <path d="M20 20l-3.5-3.5" stroke="var(--ink-3)" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{copy.empty}</div>
                <p style={{ margin: 0, fontSize: 14, color: "var(--ink-2)", maxWidth: 460, marginInline: "auto" }}>
                  {copy.emptyHint}
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                    {copy.found(orders.length)}
                  </div>
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {orders.map((order) => {
                    const meta = platformMeta(order.platform);
                    const live = liveById[order.id];
                    const liveReady = live && live.kind === "ready" ? live.data : null;
                    const isLiveLoading = live && live.kind === "loading";

                    // Pick the freshest status: live overall status if available, else DB status
                    const rawStatus = liveReady?.status ?? order.status ?? null;
                    // UX: never expose a "failed" status to the customer — show "paid" instead
                    const effectiveStatus = (rawStatus || "").toLowerCase() === "failed" ? "paid" : rawStatus;
                    const statusKey = (effectiveStatus || "").toLowerCase();
                    const statusLabel = copy.statusLabels[statusKey] || (effectiveStatus || "—");
                    const tone = statusTone(effectiveStatus);

                    // Aggregate progress from services (live)
                    let totalQty = 0;
                    let totalDelivered = 0;
                    if (liveReady?.services?.length) {
                      for (const s of liveReady.services) {
                        totalQty += s.qty || 0;
                        totalDelivered += s.delivered || 0;
                      }
                    }
                    const overallPct = totalQty > 0 ? Math.max(0, Math.min(100, Math.round((totalDelivered / totalQty) * 100))) : 0;
                    const showProgress = liveReady !== null && totalQty > 0;

                    return (
                      <article
                        key={order.id}
                        className="order-card"
                        style={{
                          background: "white",
                          border: "1px solid var(--line)",
                          borderRadius: 18,
                          padding: 20,
                          display: "grid",
                          gap: 14,
                        }}
                      >
                        <div className="order-card-top">
                          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                background: `${meta.color}14`,
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                              }}
                              aria-hidden
                            >
                              {meta.icon ? (
                                <NetIcon kind={meta.icon} color={meta.color} size={22} />
                              ) : (
                                <span style={{ fontWeight: 800, color: meta.color, fontSize: 18 }}>F</span>
                              )}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>
                                {copy.order(order.id)}
                              </div>
                              <div
                                style={{
                                  marginTop: 4,
                                  fontSize: 13,
                                  color: "var(--ink-2)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {meta.name}
                                {order.username ? <> · @{order.username.replace(/^@/, "")}</> : null}
                              </div>
                            </div>
                          </div>
                          {isLiveLoading ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 12px",
                                background: "var(--paper-2)",
                                color: "var(--ink-3)",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              <span
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: "50%",
                                  border: "2px solid rgba(82,96,230,0.25)",
                                  borderTopColor: "var(--primary)",
                                  animation: "spin .8s linear infinite",
                                }}
                                aria-hidden
                              />
                              {copy.syncing}
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 14px",
                                background: tone.bg,
                                color: tone.fg,
                                borderRadius: 999,
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: tone.fg }} />
                              {statusLabel}
                            </span>
                          )}
                        </div>

                        {showProgress && (
                          <div style={{ display: "grid", gap: 6 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: 12,
                                color: "var(--ink-2)",
                                fontWeight: 600,
                              }}
                            >
                              <span>
                                {copy.progressLabel} · {totalDelivered.toLocaleString(INTL_LOCALE[locale] || "fr-FR")} / {totalQty.toLocaleString(INTL_LOCALE[locale] || "fr-FR")}
                              </span>
                              <span style={{ color: tone.fg, fontWeight: 800 }}>{overallPct}%</span>
                            </div>
                            <div
                              style={{
                                height: 8,
                                background: "var(--paper-2)",
                                borderRadius: 999,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${overallPct}%`,
                                  height: "100%",
                                  background: tone.fg,
                                  transition: "width .4s ease-out",
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                            paddingTop: 14,
                            borderTop: "1px dashed var(--line)",
                          }}
                          className="order-card-meta"
                        >
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>
                              {copy.amount}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>
                              {formatAmount(order.total_cents, order.currency, locale)}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>
                              {copy.date}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>
                              {formatDate(order.created_at, locale)}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {/* Help */}
        <aside
          style={{
            marginTop: 36,
            padding: "22px 26px",
            background: "linear-gradient(135deg, rgba(82,96,230,0.06), rgba(214,41,118,0.06))",
            border: "1px solid var(--line)",
            borderRadius: 20,
            display: "flex",
            gap: 18,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "white",
              border: "1px solid var(--line)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
            aria-hidden
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="var(--primary)" strokeWidth="1.7" />
              <path d="M12 8v4M12 16h.01" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{copy.helpTitle}</div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>{copy.helpBody}</p>
          </div>
          <a
            href="mailto:support@fanovera.com"
            className="btn-soft"
            style={{ padding: "10px 18px", fontSize: 14 }}
          >
            {copy.helpCta}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </aside>
      </div>

      <style jsx>{`
        .track-input-row {
          display: flex;
          gap: 12px;
          align-items: stretch;
        }
        .order-card:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 18px 40px -22px rgba(82, 96, 230, 0.35);
        }
        .order-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        @media (max-width: 640px) {
          .track-input-row {
            flex-direction: column;
          }
          .order-card-top {
            flex-direction: column;
            align-items: stretch;
          }
          .order-card-meta {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
