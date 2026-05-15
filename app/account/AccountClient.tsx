"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "../i18n/I18nProvider";

type CartItem = { service?: string; qty?: number; quantity?: number };

type AccountOrder = {
  id: number;
  username: string;
  platform: string;
  cart: CartItem[] | string;
  total_cents: number;
  currency: string;
  status: string;
  followers_before: number;
  created_at: string;
  delivered_at: string | null;
};

type Props = { initialEmail: string | null };

const COPY: Record<string, {
  signedOut: { title: string; intro: string; placeholder: string; cta: string; sending: string; sent: string; sentDetail: string; expired: string; error: string };
  signedIn: { title: (email: string) => string; logout: string; empty: string; emptyCta: string; viewOrder: string; status: Record<string, string>; placedOn: string; total: string; followers: string };
}> = {
  fr: {
    signedOut: {
      title: "Accédez à vos commandes",
      intro: "Entrez votre email — nous vous envoyons un lien sécurisé pour retrouver l'historique et le suivi de toutes vos commandes Fanovera.",
      placeholder: "vous@exemple.com",
      cta: "Envoyer le lien",
      sending: "Envoi…",
      sent: "Email envoyé !",
      sentDetail: "Vérifiez votre boîte mail (et les indésirables). Le lien expire dans 15 minutes.",
      expired: "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau ci-dessous.",
      error: "Email invalide. Essayez à nouveau.",
    },
    signedIn: {
      title: (email) => `Bonjour ${email}`,
      logout: "Se déconnecter",
      empty: "Vous n'avez pas encore de commande.",
      emptyCta: "Découvrir les plateformes",
      viewOrder: "Voir le suivi →",
      status: { paid: "Payée", pending: "En attente", processing: "En cours", placed: "En cours", delivered: "Livrée", completed: "Livrée", partial: "Partielle", canceled: "Annulée", cancelled: "Annulée", refunded: "Remboursée", failed: "Payée" },
      placedOn: "Passée le",
      total: "Total",
      followers: "Audience initiale",
    },
  },
  en: {
    signedOut: {
      title: "Access your orders",
      intro: "Enter your email — we'll send you a secure link to view the history and live tracking of all your Fanovera orders.",
      placeholder: "you@example.com",
      cta: "Send the link",
      sending: "Sending…",
      sent: "Email sent!",
      sentDetail: "Check your inbox (and spam). The link expires in 15 minutes.",
      expired: "This link has expired or already been used. Request a new one below.",
      error: "Invalid email. Please try again.",
    },
    signedIn: {
      title: (email) => `Hi ${email}`,
      logout: "Sign out",
      empty: "You don't have any orders yet.",
      emptyCta: "Browse platforms",
      viewOrder: "View tracking →",
      status: { paid: "Paid", pending: "Pending", processing: "Processing", placed: "Processing", delivered: "Delivered", completed: "Delivered", partial: "Partial", canceled: "Canceled", cancelled: "Canceled", refunded: "Refunded", failed: "Paid" },
      placedOn: "Placed on",
      total: "Total",
      followers: "Starting audience",
    },
  },
  es: {
    signedOut: {
      title: "Accede a tus pedidos",
      intro: "Introduce tu email — te enviaremos un enlace seguro para consultar el historial y el seguimiento de todos tus pedidos Fanovera.",
      placeholder: "tu@ejemplo.com",
      cta: "Enviar el enlace",
      sending: "Enviando…",
      sent: "¡Email enviado!",
      sentDetail: "Revisa tu bandeja (y spam). El enlace caduca en 15 minutos.",
      expired: "Este enlace ha caducado o ya se usó. Solicita uno nuevo abajo.",
      error: "Email inválido. Inténtalo de nuevo.",
    },
    signedIn: {
      title: (email) => `Hola ${email}`,
      logout: "Cerrar sesión",
      empty: "Aún no tienes pedidos.",
      emptyCta: "Explorar plataformas",
      viewOrder: "Ver seguimiento →",
      status: { paid: "Pagado", pending: "Pendiente", processing: "En curso", placed: "En curso", delivered: "Entregado", completed: "Entregado", partial: "Parcial", canceled: "Cancelado", cancelled: "Cancelado", refunded: "Reembolsado", failed: "Pagado" },
      placedOn: "Realizado el",
      total: "Total",
      followers: "Audiencia inicial",
    },
  },
  pt: {
    signedOut: {
      title: "Acede aos teus pedidos",
      intro: "Introduz o teu email — enviamos-te um link seguro para ver o histórico e o acompanhamento de todos os teus pedidos Fanovera.",
      placeholder: "tu@exemplo.com",
      cta: "Enviar o link",
      sending: "A enviar…",
      sent: "Email enviado!",
      sentDetail: "Verifica a tua caixa (e o spam). O link expira em 15 minutos.",
      expired: "Este link expirou ou já foi usado. Pede um novo abaixo.",
      error: "Email inválido. Tenta novamente.",
    },
    signedIn: {
      title: (email) => `Olá ${email}`,
      logout: "Terminar sessão",
      empty: "Ainda não tens pedidos.",
      emptyCta: "Explorar plataformas",
      viewOrder: "Ver acompanhamento →",
      status: { paid: "Pago", pending: "Pendente", processing: "Em curso", placed: "Em curso", delivered: "Entregue", completed: "Entregue", partial: "Parcial", canceled: "Cancelado", cancelled: "Cancelado", refunded: "Reembolsado", failed: "Pago" },
      placedOn: "Efetuado em",
      total: "Total",
      followers: "Audiência inicial",
    },
  },
  de: {
    signedOut: {
      title: "Zugriff auf deine Bestellungen",
      intro: "Gib deine E-Mail ein — wir senden dir einen sicheren Link, mit dem du den Verlauf und den Live-Status all deiner Fanovera-Bestellungen einsehen kannst.",
      placeholder: "du@beispiel.com",
      cta: "Link senden",
      sending: "Wird gesendet…",
      sent: "E-Mail gesendet!",
      sentDetail: "Prüfe dein Postfach (und Spam). Der Link läuft in 15 Minuten ab.",
      expired: "Dieser Link ist abgelaufen oder wurde bereits verwendet. Fordere unten einen neuen an.",
      error: "Ungültige E-Mail. Bitte erneut versuchen.",
    },
    signedIn: {
      title: (email) => `Hallo ${email}`,
      logout: "Abmelden",
      empty: "Du hast noch keine Bestellungen.",
      emptyCta: "Plattformen entdecken",
      viewOrder: "Tracking ansehen →",
      status: { paid: "Bezahlt", pending: "Ausstehend", processing: "In Bearbeitung", placed: "In Bearbeitung", delivered: "Geliefert", completed: "Geliefert", partial: "Teilweise", canceled: "Storniert", cancelled: "Storniert", refunded: "Erstattet", failed: "Bezahlt" },
      placedOn: "Aufgegeben am",
      total: "Gesamt",
      followers: "Anfangs-Audience",
    },
  },
  it: {
    signedOut: {
      title: "Accedi ai tuoi ordini",
      intro: "Inserisci la tua email — ti inviamo un link sicuro per consultare la cronologia e il tracciamento di tutti i tuoi ordini Fanovera.",
      placeholder: "tu@esempio.com",
      cta: "Invia il link",
      sending: "Invio in corso…",
      sent: "Email inviata!",
      sentDetail: "Controlla la tua casella (e lo spam). Il link scade tra 15 minuti.",
      expired: "Questo link è scaduto o è già stato usato. Richiedine uno nuovo qui sotto.",
      error: "Email non valida. Riprova.",
    },
    signedIn: {
      title: (email) => `Ciao ${email}`,
      logout: "Esci",
      empty: "Non hai ancora ordini.",
      emptyCta: "Esplora le piattaforme",
      viewOrder: "Vedi tracciamento →",
      status: { paid: "Pagato", pending: "In attesa", processing: "In corso", placed: "In corso", delivered: "Consegnato", completed: "Consegnato", partial: "Parziale", canceled: "Annullato", cancelled: "Annullato", refunded: "Rimborsato", failed: "Pagato" },
      placedOn: "Effettuato il",
      total: "Totale",
      followers: "Audience iniziale",
    },
  },
  tr: {
    signedOut: {
      title: "Siparişlerine eriş",
      intro: "E-postanı gir — tüm Fanovera siparişlerinin geçmişini ve canlı takibini görmen için güvenli bir bağlantı göndereceğiz.",
      placeholder: "sen@ornek.com",
      cta: "Bağlantıyı gönder",
      sending: "Gönderiliyor…",
      sent: "E-posta gönderildi!",
      sentDetail: "Gelen kutunu (ve spam) kontrol et. Bağlantı 15 dakika içinde sona erer.",
      expired: "Bu bağlantının süresi doldu veya zaten kullanıldı. Aşağıdan yeni bir bağlantı iste.",
      error: "Geçersiz e-posta. Tekrar deneyin.",
    },
    signedIn: {
      title: (email) => `Merhaba ${email}`,
      logout: "Çıkış yap",
      empty: "Henüz siparişin yok.",
      emptyCta: "Platformları keşfet",
      viewOrder: "Takibi gör →",
      status: { paid: "Ödendi", pending: "Beklemede", processing: "İşleniyor", placed: "İşleniyor", delivered: "Teslim edildi", completed: "Teslim edildi", partial: "Kısmi", canceled: "İptal edildi", cancelled: "İptal edildi", refunded: "İade edildi", failed: "Ödendi" },
      placedOn: "Verildi",
      total: "Toplam",
      followers: "Başlangıç kitlesi",
    },
  },
};

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", facebook: "Facebook",
  spotify: "Spotify", twitch: "Twitch", twitter: "X", x: "X", linkedin: "LinkedIn",
};

const INTL_LOCALE: Record<string, string> = {
  fr: "fr-FR", en: "en-US", es: "es-ES", pt: "pt-PT", de: "de-DE", it: "it-IT", tr: "tr-TR",
};

function formatPrice(cents: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(INTL_LOCALE[locale] || "fr-FR", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function formatQty(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(INTL_LOCALE[locale] || "fr-FR", {
      year: "numeric", month: "short", day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export default function AccountClient({ initialEmail }: Props) {
  const { locale } = useI18n();
  const localeKey = locale.toLowerCase().split("-")[0];
  const c = COPY[localeKey] || COPY.fr;
  const search = useSearchParams();
  const linkExpired = search.get("error") === "expired";

  const [email, setEmail] = useState(initialEmail || "");
  const [phase, setPhase] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [orders, setOrders] = useState<AccountOrder[] | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(!!initialEmail);

  useEffect(() => {
    if (!initialEmail) return;
    let cancelled = false;
    fetch("/api/account/orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (Array.isArray(json?.orders)) setOrders(json.orders as AccountOrder[]);
        else setOrders([]);
      })
      .catch(() => { if (!cancelled) setOrders([]); })
      .finally(() => { if (!cancelled) setLoadingOrders(false); });
    return () => { cancelled = true; };
  }, [initialEmail]);

  const onRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === "sending") return;
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setPhase("error");
      return;
    }
    setPhase("sending");
    try {
      const res = await fetch("/api/account/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, locale }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 400 || (res.status === 200 && json?.ok === false)) {
        setPhase("error");
      } else {
        setPhase("sent");
      }
    } catch {
      setPhase("error");
    }
  };

  const onLogout = async () => {
    try {
      await fetch("/api/account/logout", { method: "POST" });
    } catch { /* ignore */ }
    window.location.href = "/account";
  };

  // ── Signed-out view ──
  if (!initialEmail) {
    return (
      <main className="account-main">
        <div className="account-card">
          <div className="account-icon" aria-hidden>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="14" width="32" height="22" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M10 18l14 9 14-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="account-title">{c.signedOut.title}</h1>
          <p className="account-intro">{c.signedOut.intro}</p>

          {linkExpired && phase !== "sent" && <div className="account-banner account-banner-warn">{c.signedOut.expired}</div>}

          {phase === "sent" ? (
            <div className="account-banner account-banner-ok">
              <strong>{c.signedOut.sent}</strong>
              <div className="account-banner-detail">{c.signedOut.sentDetail}</div>
            </div>
          ) : (
            <form className="account-form" onSubmit={onRequest}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder={c.signedOut.placeholder}
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (phase === "error") setPhase("idle"); }}
                className="account-input"
                disabled={phase === "sending"}
              />
              <button type="submit" className="btn-primary account-submit" disabled={phase === "sending"}>
                {phase === "sending" ? c.signedOut.sending : c.signedOut.cta}
              </button>
              {phase === "error" && <div className="account-error">{c.signedOut.error}</div>}
            </form>
          )}
        </div>
        <style jsx>{styleString}</style>
      </main>
    );
  }

  // ── Signed-in view ──
  return (
    <main className="account-main">
      <div className="account-header">
        <div>
          <h1 className="account-title">{c.signedIn.title(initialEmail)}</h1>
        </div>
        <button className="account-logout" onClick={onLogout}>{c.signedIn.logout}</button>
      </div>

      {loadingOrders && <div className="account-card account-state">…</div>}

      {!loadingOrders && orders && orders.length === 0 && (
        <div className="account-card account-empty">
          <p>{c.signedIn.empty}</p>
          <Link href="/" className="btn-primary account-submit">{c.signedIn.emptyCta}</Link>
        </div>
      )}

      {!loadingOrders && orders && orders.length > 0 && (
        <div className="account-orders">
          {orders.map((order) => {
            const cart: CartItem[] = Array.isArray(order.cart)
              ? order.cart
              : (() => { try { return JSON.parse(order.cart || "[]"); } catch { return []; } })();
            const totalQty = cart.reduce((acc, it) => acc + (it.qty || it.quantity || 0), 0);
            const platformLabel = PLATFORM_LABEL[order.platform] || order.platform;
            const statusLabel = c.signedIn.status[order.status?.toLowerCase() || "paid"] || order.status || "—";
            return (
              <div key={order.id} className="account-order">
                <div className="account-order-head">
                  <div>
                    <div className="account-order-platform">{platformLabel}</div>
                    <div className="account-order-handle">@{order.username}</div>
                  </div>
                  <span className={`account-pill account-pill-${order.status?.toLowerCase() || "paid"}`}>{statusLabel}</span>
                </div>
                <div className="account-order-grid">
                  <div>
                    <div className="account-kv-label">{c.signedIn.placedOn}</div>
                    <div className="account-kv-value">{formatDate(order.created_at, localeKey)}</div>
                  </div>
                  <div>
                    <div className="account-kv-label">+{formatQty(totalQty)}</div>
                    <div className="account-kv-value">{c.signedIn.followers}: {formatQty(order.followers_before || 0)}</div>
                  </div>
                  <div>
                    <div className="account-kv-label">{c.signedIn.total}</div>
                    <div className="account-kv-value">{formatPrice(order.total_cents, order.currency, localeKey)}</div>
                  </div>
                </div>
                <Link href={`/track/${order.id}`} className="account-order-cta">{c.signedIn.viewOrder}</Link>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{styleString}</style>
    </main>
  );
}

const styleString = `
.account-main { max-width: 760px; margin: 48px auto; padding: 0 20px; }
.account-card {
  background: white;
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 40px 28px;
  box-shadow: 0 16px 40px -24px rgba(20, 22, 50, 0.12);
  text-align: center;
}
.account-icon {
  margin: 0 auto 16px;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: rgba(82, 96, 230, 0.08);
  color: #5260e6;
  display: flex;
  align-items: center;
  justify-content: center;
}
.account-title { margin: 0 0 8px; font-size: 26px; font-weight: 800; letter-spacing: -0.01em; }
.account-intro { margin: 0 auto 24px; color: var(--ink-2); font-size: 15px; line-height: 1.55; max-width: 480px; }
.account-form { display: flex; flex-direction: column; gap: 12px; max-width: 420px; margin: 0 auto; }
.account-input {
  padding: 14px 16px;
  font-size: 15px;
  border: 1px solid var(--line);
  border-radius: 12px;
  outline: none;
  transition: border-color 0.18s ease;
}
.account-input:focus { border-color: #5260e6; }
.account-submit { padding: 14px 18px; font-size: 15px; font-weight: 700; }
.account-error { color: #b42318; font-size: 13px; }
.account-banner {
  margin: 0 auto 20px;
  max-width: 480px;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
}
.account-banner-ok { background: rgba(34, 197, 94, 0.1); color: #15803d; }
.account-banner-warn { background: rgba(234, 179, 8, 0.14); color: #92400e; }
.account-banner-detail { margin-top: 4px; font-size: 13px; opacity: 0.85; }

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
.account-logout {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--ink-2);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease;
}
.account-logout:hover { border-color: var(--ink); color: var(--ink); }
.account-state { color: var(--ink-3); }
.account-empty { padding: 56px 28px; }
.account-empty p { margin: 0 0 16px; color: var(--ink-2); font-size: 15px; }
.account-orders { display: grid; gap: 12px; }
.account-order {
  background: white;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 24px -16px rgba(20, 22, 50, 0.08);
}
.account-order-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}
.account-order-platform { font-weight: 700; font-size: 16px; letter-spacing: -0.01em; }
.account-order-handle { color: var(--ink-3); font-size: 13px; margin-top: 2px; }
.account-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  letter-spacing: 0.02em;
}
.account-pill-paid, .account-pill-failed, .account-pill-pending { background: rgba(20, 22, 50, 0.06); color: var(--ink-2); }
.account-pill-processing, .account-pill-placed { background: rgba(82, 96, 230, 0.12); color: #5260e6; }
.account-pill-delivered, .account-pill-completed { background: rgba(34, 197, 94, 0.12); color: #16a34a; }
.account-pill-partial { background: rgba(234, 179, 8, 0.14); color: #b45309; }
.account-pill-canceled, .account-pill-cancelled, .account-pill-refunded { background: rgba(239, 68, 68, 0.10); color: #b42318; }
.account-order-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  margin-bottom: 14px;
}
.account-kv-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 4px;
}
.account-kv-value { font-size: 14px; font-weight: 600; color: var(--ink); }
.account-order-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #5260e6;
  text-decoration: none;
}
.account-order-cta:hover { text-decoration: underline; }

@media (max-width: 600px) {
  .account-card { padding: 28px 20px; }
  .account-order-grid { grid-template-columns: 1fr 1fr; }
  .account-order-grid > div:nth-child(3) { grid-column: span 2; }
}
`;
