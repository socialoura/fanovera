"use client";

import { useEffect, useState } from "react";
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

type TrackResponse = {
  id: number;
  username: string;
  platform: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  deliveredAt: string | null;
  services: ServiceStatus[];
};

const STATUS_LABELS_FR: Record<string, string> = {
  paid: "Payée",
  processing: "En cours",
  placed: "En cours",
  pending: "En attente",
  delivered: "Livrée",
  completed: "Livrée",
  partial: "Partielle",
  canceled: "Annulée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

const STATUS_LABELS_EN: Record<string, string> = {
  paid: "Paid",
  processing: "Processing",
  placed: "Processing",
  pending: "Pending",
  delivered: "Delivered",
  completed: "Delivered",
  partial: "Partial",
  canceled: "Canceled",
  cancelled: "Canceled",
  refunded: "Refunded",
};

function translateStatus(raw: string | null | undefined, locale: string): string {
  if (!raw) return "—";
  const lower = raw.toLowerCase();
  // UX: never expose "failed" — show as "paid" instead
  const normalized = lower === "failed" ? "paid" : lower;
  const map = locale === "en" ? STATUS_LABELS_EN : STATUS_LABELS_FR;
  return map[normalized] || raw;
}

export default function TrackOrderClient() {
  const params = useParams<{ id: string }>();
  const { locale } = useI18n();
  const copy = getPublicCopy(locale).track;
  const [data, setData] = useState<TrackResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/order/${encodeURIComponent(params.id)}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error || copy.notFound);
        }
        if (!cancelled) setData(json as TrackResponse);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : copy.unexpected);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [copy.notFound, copy.unexpected, params.id]);

  return (
    <main style={{ maxWidth: 860, margin: "48px auto", padding: "0 20px" }}>
      <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: 16, padding: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>{copy.title}</h1>

        {loading && <p style={{ marginTop: 12, color: "var(--ink-3)" }}>{copy.loading}</p>}

        {error && !loading && <p style={{ marginTop: 12, color: "#b42318" }}>{error}</p>}

        {!loading && data && (
          <>
            <p style={{ marginTop: 10, color: "var(--ink-2)" }}>{copy.summary(data.id, data.platform, translateStatus(data.status, locale))}</p>

            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              {data.services.map((service, idx) => (
                <div key={`${service.service}-${idx}`} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <strong>{service.service}</strong>
                    <span style={{ color: "var(--ink-2)" }}>{translateStatus(service.status, locale)}</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: "var(--ink-2)" }}>
                    {copy.delivered}: {service.delivered}/{service.qty} ({service.pct}%)
                    {typeof service.remains === "number" ? ` - ${copy.remaining}: ${service.remains}` : ""}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      height: 8,
                      background: "var(--paper-2)",
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ width: `${Math.max(0, Math.min(100, service.pct))}%`, height: "100%", background: "var(--ink)" }} />
                  </div>
                  {service.error ? <div style={{ marginTop: 8, color: "#b42318", fontSize: 12 }}>{service.error}</div> : null}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
