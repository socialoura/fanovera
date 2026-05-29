"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useI18n } from "../../i18n/I18nProvider";
import { getPublicCopy } from "../../components/publicCopy";

type ServiceStatus = {
  service: string;
  platform: string;
  qty: number;
  status: "delivered" | "processing" | "partial" | "canceled" | "failed" | "pending";
  delivered: number;
  remains: number | null;
  pct: number;
  error?: string | null;
};

type CartItem = {
  service?: string;
  qty?: number;
  quantity?: number;
  bonus?: number;
  price?: number;
};

type TrackResponse = {
  id: number;
  username: string;
  platform: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  deliveredAt: string | null;
  followersBefore: number;
  cart: CartItem[];
  services: ServiceStatus[];
};

const STATUS_LABELS: Record<string, Record<string, string>> = {
  fr: { paid: "Payée", processing: "En cours", placed: "En cours", pending: "En attente", delivered: "Livrée", completed: "Livrée", partial: "Partielle", canceled: "Annulée", cancelled: "Annulée", refunded: "Remboursée" },
  en: { paid: "Paid", processing: "Processing", placed: "Processing", pending: "Pending", delivered: "Delivered", completed: "Delivered", partial: "Partial", canceled: "Canceled", cancelled: "Canceled", refunded: "Refunded" },
  es: { paid: "Pagado", processing: "En curso", placed: "En curso", pending: "Pendiente", delivered: "Entregado", completed: "Entregado", partial: "Parcial", canceled: "Cancelado", cancelled: "Cancelado", refunded: "Reembolsado" },
  pt: { paid: "Pago", processing: "Em andamento", placed: "Em andamento", pending: "Pendente", delivered: "Entregue", completed: "Entregue", partial: "Parcial", canceled: "Cancelado", cancelled: "Cancelado", refunded: "Reembolsado" },
  de: { paid: "Bezahlt", processing: "In Bearbeitung", placed: "In Bearbeitung", pending: "Ausstehend", delivered: "Geliefert", completed: "Geliefert", partial: "Teilweise", canceled: "Storniert", cancelled: "Storniert", refunded: "Erstattet" },
  it: { paid: "Pagato", processing: "In corso", placed: "In corso", pending: "In attesa", delivered: "Consegnato", completed: "Consegnato", partial: "Parziale", canceled: "Annullato", cancelled: "Annullato", refunded: "Rimborsato" },
  tr: { paid: "Ödendi", processing: "İşleniyor", placed: "İşleniyor", pending: "Beklemede", delivered: "Teslim edildi", completed: "Teslim edildi", partial: "Kısmi", canceled: "İptal edildi", cancelled: "İptal edildi", refunded: "İade edildi" },
};

type EnrichedCopy = {
  yourProgress: string;
  before: string;
  current: string;
  target: string;
  delivered: string;
  inProgress: string;
  perService: string;
  buyMore: string;
  buyMoreSub: string;
  myOrders: string;
  estimatedDelivery: string;
  estimatedHours: (h: number) => string;
};

const ENRICHED_COPY: Record<string, EnrichedCopy> = {
  fr: {
    yourProgress: "Votre progression",
    before: "Avant",
    current: "Actuel",
    target: "Objectif",
    delivered: "livrés",
    inProgress: "en cours",
    perService: "Détail par service",
    buyMore: "Booster encore plus",
    buyMoreSub: "Continuez sur votre lancée avec un nouveau pack",
    myOrders: "Toutes mes commandes",
    estimatedDelivery: "Livraison estimée",
    estimatedHours: (h) => h <= 1 ? "moins d'1 h" : `~ ${h} h restantes`,
  },
  en: {
    yourProgress: "Your progress",
    before: "Before",
    current: "Now",
    target: "Target",
    delivered: "delivered",
    inProgress: "in progress",
    perService: "Per-service breakdown",
    buyMore: "Get an extra boost",
    buyMoreSub: "Keep the momentum going with another pack",
    myOrders: "All my orders",
    estimatedDelivery: "Estimated delivery",
    estimatedHours: (h) => h <= 1 ? "less than 1 h" : `~ ${h} h remaining`,
  },
  es: {
    yourProgress: "Tu progreso", before: "Antes", current: "Ahora", target: "Meta",
    delivered: "entregados", inProgress: "en curso", perService: "Detalle por servicio",
    buyMore: "Conseguir otro boost", buyMoreSub: "Mantén el impulso con otro pack",
    myOrders: "Todos mis pedidos", estimatedDelivery: "Entrega estimada",
    estimatedHours: (h) => h <= 1 ? "menos de 1 h" : `~ ${h} h restantes`,
  },
  pt: {
    yourProgress: "Seu progresso", before: "Antes", current: "Agora", target: "Meta",
    delivered: "entregues", inProgress: "em andamento", perService: "Detalhe por serviço",
    buyMore: "Pegar outro boost", buyMoreSub: "Mantenha o ritmo com outro pacote",
    myOrders: "Todos os meus pedidos", estimatedDelivery: "Entrega estimada",
    estimatedHours: (h) => h <= 1 ? "menos de 1 h" : `~ ${h} h restantes`,
  },
  de: {
    yourProgress: "Dein Fortschritt", before: "Vorher", current: "Jetzt", target: "Ziel",
    delivered: "geliefert", inProgress: "in Bearbeitung", perService: "Aufschlüsselung",
    buyMore: "Weiteren Boost holen", buyMoreSub: "Bleib in Bewegung mit einem neuen Paket",
    myOrders: "Alle meine Bestellungen", estimatedDelivery: "Geschätzte Lieferung",
    estimatedHours: (h) => h <= 1 ? "unter 1 Std" : `~ ${h} Std verbleibend`,
  },
  it: {
    yourProgress: "I tuoi progressi", before: "Prima", current: "Ora", target: "Obiettivo",
    delivered: "consegnati", inProgress: "in corso", perService: "Dettaglio per servizio",
    buyMore: "Aggiungi un boost", buyMoreSub: "Continua lo slancio con un altro pack",
    myOrders: "Tutti i miei ordini", estimatedDelivery: "Consegna stimata",
    estimatedHours: (h) => h <= 1 ? "meno di 1 h" : `~ ${h} h rimanenti`,
  },
  tr: {
    yourProgress: "İlerlemen", before: "Önce", current: "Şimdi", target: "Hedef",
    delivered: "teslim edildi", inProgress: "devam ediyor", perService: "Hizmet detayı",
    buyMore: "Yeni bir boost al", buyMoreSub: "İvmeyi koru, yeni bir paket ekle",
    myOrders: "Tüm siparişlerim", estimatedDelivery: "Tahmini teslimat",
    estimatedHours: (h) => h <= 1 ? "1 saatten az" : `~ ${h} saat kaldı`,
  },
};

function translateStatus(raw: string | null | undefined, locale: string): string {
  if (!raw) return "—";
  const lower = raw.toLowerCase();
  const normalized = lower === "failed" ? "paid" : lower;
  const short = locale.toLowerCase().split("-")[0];
  const map = STATUS_LABELS[short] || STATUS_LABELS.fr;
  return map[normalized] || raw;
}

function formatQty(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", facebook: "Facebook",
  spotify: "Spotify", twitch: "Twitch", twitter: "X", x: "X", linkedin: "LinkedIn",
};

export default function TrackOrderClient() {
  const params = useParams<{ id: string }>();
  const { locale } = useI18n();
  const copy = getPublicCopy(locale).track;
  const localeKey = locale.toLowerCase().split("-")[0];
  const e = ENRICHED_COPY[localeKey] || ENRICHED_COPY.fr;
  const [data, setData] = useState<TrackResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      try {
        const res = await fetch(`/api/order/${encodeURIComponent(params.id)}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || copy.notFound);
        if (cancelled) return;
        setData(json as TrackResponse);
        setError("");

        // Auto-refresh while delivery is still in progress (every 30s).
        const stillRunning = (json as TrackResponse).services?.some(
          (s) => s.status === "processing" || s.status === "pending",
        );
        if (stillRunning && !cancelled) {
          pollTimer = setTimeout(run, 30_000);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : copy.unexpected);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    run();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [copy.notFound, copy.unexpected, params.id]);

  // ── Aggregates for the hero progress bar ──
  const aggregate = useMemo(() => {
    if (!data) return null;
    const before = Math.max(0, data.followersBefore || 0);
    const totalQty = data.services.reduce((acc, s) => acc + (s.qty || 0), 0);
    const totalDelivered = data.services.reduce((acc, s) => acc + (s.delivered || 0), 0);
    const cartBonus = (data.cart || []).reduce((acc, it) => acc + (it.bonus || 0), 0);
    const target = before + totalQty + cartBonus;
    const current = before + totalDelivered;
    const pct = target > before ? Math.min(100, Math.round(((current - before) / (target - before)) * 100)) : 0;
    const someRemains = data.services.some((s) => (s.remains ?? 0) > 0 || s.status === "processing" || s.status === "pending");
    // Crude ETA: BulkFollows usually finishes 1-6h post-placement; once delivery starts we extrapolate.
    let etaHours: number | null = null;
    if (someRemains && totalQty > 0) {
      const placedAt = new Date(data.createdAt).getTime();
      const elapsedH = Math.max(0.1, (Date.now() - placedAt) / (1000 * 60 * 60));
      if (totalDelivered > 0) {
        const ratePerH = totalDelivered / elapsedH;
        const remainingQty = totalQty - totalDelivered;
        etaHours = ratePerH > 0 ? Math.max(1, Math.round(remainingQty / ratePerH)) : 6;
      } else {
        etaHours = 6;
      }
    }
    return { before, current, target, pct, etaHours, someRemains };
  }, [data]);

  const platformLabel = data ? PLATFORM_LABEL[data.platform] || data.platform : "";
  const platformHref = data ? `/${data.platform}` : "/";
  // Only show the progress bar once the order is fully delivered.
  const isDelivered = !!data && ["delivered", "completed"].includes(data.status.toLowerCase());

  return (
    <main className="track-main">
      <div className="track-card">
        <h1 className="track-title">{copy.title}</h1>

        {loading && <p className="track-state">{copy.loading}</p>}
        {error && !loading && <p className="track-error">{error}</p>}

        {!loading && data && aggregate && (
          <>
            <div className="track-meta">
              <div className="track-summary">{copy.summary(data.id, platformLabel, translateStatus(data.status, locale))}</div>
              {data.username ? <div className="track-handle">@{data.username}</div> : null}
            </div>

            {/* Hero progress */}
            <section className="track-hero">
              <div className="track-hero-label">{e.yourProgress}</div>
              <div className="track-hero-stats">
                <div className="track-stat">
                  <div className="track-stat-num track-stat-num-muted">{formatQty(aggregate.before)}</div>
                  <div className="track-stat-label">{e.before}</div>
                </div>
                <div className="track-stat">
                  <div className="track-stat-num track-stat-num-current">{formatQty(aggregate.current)}</div>
                  <div className="track-stat-label">{e.current}</div>
                </div>
                <div className="track-stat">
                  <div className="track-stat-num">{formatQty(aggregate.target)}</div>
                  <div className="track-stat-label">{e.target}</div>
                </div>
              </div>
              {isDelivered && (
                <div className="track-hero-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={aggregate.pct}>
                  <div className="track-hero-bar-fill" style={{ width: `${aggregate.pct}%` }} />
                </div>
              )}
              <div className="track-hero-footer">
                <span>
                  <strong>{formatQty(Math.max(0, aggregate.current - aggregate.before))}</strong> / {formatQty(Math.max(0, aggregate.target - aggregate.before))} {e.delivered}
                </span>
                {aggregate.etaHours !== null && (
                  <span className="track-eta">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    {e.estimatedDelivery}: {e.estimatedHours(aggregate.etaHours)}
                  </span>
                )}
              </div>
            </section>

            {/* Per-service breakdown */}
            {data.services.length > 0 && (
              <section className="track-services">
                <h2 className="track-section-title">{e.perService}</h2>
                <div className="track-service-grid">
                  {data.services.map((service, idx) => (
                    <div key={`${service.service}-${idx}`} className="track-service">
                      <div className="track-service-head">
                        <strong className="track-service-name">{service.service}</strong>
                        <span className={`track-pill track-pill-${service.status}`}>
                          {translateStatus(service.status, locale)}
                        </span>
                      </div>
                      <div className="track-service-meta">
                        {copy.delivered}: {service.delivered}/{service.qty} ({service.pct}%)
                        {typeof service.remains === "number" ? ` · ${copy.remaining}: ${service.remains}` : ""}
                      </div>
                      <div className="track-service-bar">
                        <div className="track-service-bar-fill" style={{ width: `${Math.max(0, Math.min(100, service.pct))}%` }} />
                      </div>
                      {service.error ? <div className="track-service-error">{service.error}</div> : null}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Cross-sell + account links */}
            <section className="track-actions">
              <Link href={platformHref} className="track-cta-primary">
                <div>
                  <div className="track-cta-title">{e.buyMore}</div>
                  <div className="track-cta-sub">{e.buyMoreSub}</div>
                </div>
                <svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/account" className="track-cta-secondary">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M2 12V4l5-2 5 2v8l-5 2-5-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
                {e.myOrders}
              </Link>
            </section>
          </>
        )}
      </div>

      <style jsx>{`
        .track-main { max-width: 860px; margin: 48px auto; padding: 0 20px; }
        .track-card {
          background: white;
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 16px 40px -24px rgba(20, 22, 50, 0.12);
        }
        .track-title { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.01em; }
        .track-state { margin-top: 12px; color: var(--ink-3); }
        .track-error { margin-top: 12px; color: #b42318; font-weight: 600; }
        .track-meta {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 8px;
        }
        .track-summary { color: var(--ink-2); font-size: 14px; }
        .track-handle { color: var(--ink-3); font-size: 13px; font-weight: 600; }

        .track-hero {
          margin-top: 20px;
          padding: 24px;
          background: linear-gradient(135deg, rgba(82, 96, 230, 0.06), rgba(34, 197, 94, 0.04));
          border: 1px solid var(--line);
          border-radius: 16px;
        }
        .track-hero-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-3);
          margin-bottom: 14px;
        }
        .track-hero-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 18px;
        }
        .track-stat { text-align: center; }
        .track-stat-num {
          font-size: 28px;
          font-weight: 800;
          color: var(--ink);
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .track-stat-num-muted { color: var(--ink-3); }
        .track-stat-num-current {
          background: linear-gradient(90deg, #5260e6, #22c55e);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .track-stat-label {
          margin-top: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ink-3);
        }
        .track-hero-bar {
          height: 12px;
          background: rgba(20, 22, 50, 0.06);
          border-radius: 999px;
          overflow: hidden;
        }
        .track-hero-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #5260e6, #22c55e);
          border-radius: 999px;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .track-hero-footer {
          margin-top: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 13px;
          color: var(--ink-2);
        }
        .track-eta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--ink-3);
        }

        .track-services { margin-top: 28px; }
        .track-section-title {
          margin: 0 0 12px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ink-3);
        }
        .track-service-grid { display: grid; gap: 10px; }
        .track-service {
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 14px;
        }
        .track-service-head {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .track-service-name { font-size: 14px; }
        .track-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
          letter-spacing: 0.02em;
        }
        .track-pill-delivered { background: rgba(34, 197, 94, 0.12); color: #16a34a; }
        .track-pill-processing { background: rgba(82, 96, 230, 0.12); color: #5260e6; }
        .track-pill-pending { background: rgba(20, 22, 50, 0.06); color: var(--ink-2); }
        .track-pill-partial { background: rgba(234, 179, 8, 0.14); color: #b45309; }
        .track-pill-canceled, .track-pill-failed {
          background: rgba(239, 68, 68, 0.10); color: #b42318;
        }
        .track-service-meta { margin-top: 8px; font-size: 13px; color: var(--ink-2); }
        .track-service-bar {
          margin-top: 8px;
          height: 6px;
          background: rgba(20, 22, 50, 0.06);
          border-radius: 999px;
          overflow: hidden;
        }
        .track-service-bar-fill {
          height: 100%;
          background: var(--ink);
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .track-service-error { margin-top: 8px; color: #b42318; font-size: 12px; }

        .track-actions {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .track-cta-primary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 20px;
          background: linear-gradient(135deg, #5260e6, #6b7df5);
          color: white;
          border-radius: 14px;
          text-decoration: none;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          box-shadow: 0 12px 28px -16px rgba(82, 96, 230, 0.6);
        }
        .track-cta-primary:hover { transform: translateY(-1px); box-shadow: 0 18px 36px -18px rgba(82, 96, 230, 0.7); }
        .track-cta-title { font-weight: 700; font-size: 15px; }
        .track-cta-sub { font-size: 12px; opacity: 0.8; margin-top: 2px; }
        .track-cta-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: white;
          border: 1px solid var(--line);
          border-radius: 12px;
          color: var(--ink-2);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          align-self: flex-start;
          transition: border-color 0.18s ease, color 0.18s ease;
        }
        .track-cta-secondary:hover { border-color: var(--ink); color: var(--ink); }

        @media (max-width: 600px) {
          .track-card { padding: 20px; }
          .track-hero { padding: 18px; }
          .track-stat-num { font-size: 22px; }
        }
      `}</style>
    </main>
  );
}
