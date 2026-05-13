"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "../i18n/I18nProvider";
import { getPublicCopy } from "../components/publicCopy";

type ConfirmState = "idle" | "loading" | "ok" | "error";

function OrderSuccessContent() {
  const search = useSearchParams();
  const { locale } = useI18n();
  const copy = getPublicCopy(locale).order;
  const [state, setState] = useState<ConfirmState>("idle");
  const [orderId, setOrderId] = useState<string>(search.get("orderId") || "");
  const [error, setError] = useState<string>("");

  const paymentIntentId = useMemo(() => {
    return search.get("payment_intent") || "";
  }, [search]);

  useEffect(() => {
    if (orderId || !paymentIntentId) return;

    let cancelled = false;
    const run = async () => {
      setState("loading");
      setError("");
      try {
        const res = await fetch("/api/confirm-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.orderId) {
          throw new Error(data?.error || copy.confirmError);
        }
        if (!cancelled) {
          setOrderId(String(data.orderId));
          setState("ok");
        }
      } catch (e) {
        if (!cancelled) {
          setState("error");
          setError(e instanceof Error ? e.message : copy.unexpected);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [copy.confirmError, copy.unexpected, orderId, paymentIntentId]);

  const done = !!orderId;

  return (
    <main style={{ maxWidth: 760, margin: "48px auto", padding: "0 20px" }}>
      <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: 16, padding: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>{copy.title}</h1>
        <p style={{ color: "var(--ink-2)", marginTop: 10 }}>{copy.thanks}</p>

        {!done && state !== "error" && (
          <p style={{ marginTop: 14, color: "var(--ink-3)" }}>
            {state === "loading" ? copy.finalizing : copy.verifying}
          </p>
        )}

        {state === "error" && <p style={{ marginTop: 14, color: "#b42318" }}>{error || copy.fallbackError}</p>}

        {done && (
          <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href={`/track/${encodeURIComponent(orderId)}`}
              style={{
                display: "inline-block",
                padding: "10px 14px",
                background: "var(--ink)",
                color: "white",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              {copy.track(orderId)}
            </Link>
            <Link
              href="/"
              style={{
                display: "inline-block",
                padding: "10px 14px",
                background: "white",
                color: "var(--ink)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              {copy.home}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function OrderSuccessClient() {
  return (
    <Suspense fallback={null}>
      <OrderSuccessContent />
    </Suspense>
  );
}
