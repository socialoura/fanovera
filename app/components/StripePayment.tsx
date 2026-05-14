"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useI18n } from "../i18n/I18nProvider";
import { getDisplayCurrency } from "../lib/pricingCurrency";
import { getProductConfig, normalizePlatform } from "../lib/productCatalog";
import { usePricingExperiment } from "../lib/usePricingExperiment";
import { trackEvent } from "../lib/analytics";
import { gtagBeginCheckout } from "../lib/gtag";
import { getPublicCopy } from "./publicCopy";
import { humanizeStripeError } from "../lib/stripeErrors";

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
}

function paymentIntentIdFromClientSecret(clientSecret: string): string {
  return clientSecret.split("_secret_")[0] || "";
}

export type StripeCheckoutProps = {
  amount: number; // in cents
  currency?: string;
  email: string;
  username: string;
  platform: string;
  cart?: unknown;
  /**
   * Audience size at checkout time (followers / subscribers / monthly listeners,
   * depending on the platform). Captured from the live profile preview so we can
   * persist a baseline against which delivery progress is measured later.
   */
  followersBefore?: number;
  onSuccess?: () => void;
  brandColor?: string; // CSS color for the pay button (e.g. "var(--ig-2)")
  clientSecret?: string | null; // optional pre-fetched secret
};

/** Pre-fetch a PaymentIntent so the Elements UI is instant when Step 3 renders. */
export function usePaymentIntent(args: {
  amount: number;
  currency?: string;
  email: string;
  username: string;
  platform: string;
  cart?: unknown;
  followersBefore?: number;
  enabled?: boolean;
  /** Bumping this nonce forces a fresh PaymentIntent fetch (e.g. user-clicked retry). */
  retryNonce?: number;
}) {
  const { amount, currency = "eur", email, username, platform, cart, followersBefore, enabled = true, retryNonce = 0 } = args;
  const { locale, country } = useI18n();
  const pathname = usePathname();
  const normalizedPlatform = normalizePlatform(platform);
  const productArea = normalizedPlatform ? getProductConfig(normalizedPlatform).productArea : platform;
  const experiment = usePricingExperiment(productArea, { locale, country, page: pathname || platform });
  const cartKey = useMemo(() => {
    try {
      return JSON.stringify(cart ?? null);
    } catch {
      return String(cart ?? "");
    }
  }, [cart]);
  const cartRef = useRef(cart);
  const lastCartKeyRef = useRef(cartKey);
  if (lastCartKeyRef.current !== cartKey) {
    cartRef.current = cart;
    lastCartKeyRef.current = cartKey;
  }
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !amount || amount < 100 || !experiment.anonymousId) return;
    let aborted = false;
    setClientSecret(null);
    setError(null);
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientAmount: amount,
        currency,
        email,
        username,
        platform,
        cart: cartRef.current,
        locale,
        sourcePage: pathname,
        anonymousId: experiment.anonymousId,
        experimentId: experiment.assignment.experimentId,
        variantId: experiment.assignment.variantId,
        pricingStrategy: experiment.assignment.pricingStrategy,
        followersBefore: typeof followersBefore === "number" && followersBefore > 0 ? followersBefore : 0,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (aborted) return;
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else {
          const fallback = getPublicCopy(locale).payment.paymentError;
          setError(data.error || fallback);
          trackEvent("checkout_failed", { platform, product_area: productArea, reason: data.error || "payment_intent_error" });
        }
      })
      .catch(() => {
        if (!aborted) {
          setError(getPublicCopy(locale).payment.networkError);
          trackEvent("checkout_failed", { platform, product_area: productArea, reason: "payment_intent_network_error" });
        }
      });
    return () => {
      aborted = true;
    };
  }, [enabled, amount, currency, email, username, platform, cartKey, locale, pathname, productArea, experiment.anonymousId, experiment.assignment, followersBefore, retryNonce]);

  return { clientSecret, error };
}

function ExpressCheckout({
  platform,
  clientSecret,
  onSuccess,
}: {
  platform: string;
  clientSecret: string;
  onSuccess?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { locale } = useI18n();
  const paymentCopy = getPublicCopy(locale).payment;
  const [err, setErr] = useState<string | null>(null);

  if (!stripe || !elements) return null;

  return (
    <div>
      <ExpressCheckoutElement
        options={{
          buttonHeight: 48,
          buttonTheme: { applePay: "black", googlePay: "black", paypal: "gold" },
        }}
        onConfirm={async () => {
          trackEvent("pricing_cta_clicked", { platform, feature_name: "express_checkout" });
          const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: `${window.location.origin}/order-success?platform=${platform}`,
            },
            redirect: "if_required",
          });
          if (error) {
            setErr(humanizeStripeError(error, locale));
            trackEvent("checkout_failed", { platform, reason: error.code || error.message || "express_checkout_error" });
          }
          else {
            const paymentIntentId = paymentIntentIdFromClientSecret(clientSecret);
            if (paymentIntentId) {
              try {
                const res = await fetch("/api/confirm-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ paymentIntentId }),
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok && data?.orderId) {
                  trackEvent("payment_succeeded", { platform, product_area: platform, orderId: String(data.orderId), method: "express_checkout" });
                  trackEvent("checkout_completed", { platform, orderId: String(data.orderId), feature_name: "express_checkout" });
                  window.location.href = `/order-success?platform=${encodeURIComponent(platform)}&orderId=${encodeURIComponent(String(data.orderId))}`;
                  return;
                }
              } catch {
              }
            }
            onSuccess?.();
          }
        }}
      />
      {err && (
        <div style={{ marginTop: 8, fontSize: 13, color: "var(--ig-2)" }}>{err}</div>
      )}
    </div>
  );
}

function CardPayment({
  email,
  platform,
  amount,
  currency,
  clientSecret,
  brandColor,
  onSuccess,
}: {
  email: string;
  platform: string;
  amount: number;
  currency: string;
  clientSecret: string;
  brandColor?: string;
  onSuccess?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { locale } = useI18n();
  const paymentCopy = getPublicCopy(locale).payment;
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const formattedAmount = new Intl.NumberFormat(locale === "en" ? "en-US" : locale, {
    style: "currency",
    currency: (currency || "eur").toUpperCase(),
  }).format((amount || 0) / 100);

  const submit = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setErr(null);
    trackEvent("pricing_cta_clicked", { platform, amount, currency, feature_name: "card_checkout" });
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-success?platform=${platform}`,
        payment_method_data: email
          ? { billing_details: { email } }
          : undefined,
      },
      redirect: "if_required",
    });
    if (error) {
      setErr(humanizeStripeError(error, locale));
      trackEvent("checkout_failed", { platform, amount, currency, reason: error.code || error.message || "card_checkout_error" });
    }
    else {
      const paymentIntentId = paymentIntentIdFromClientSecret(clientSecret);
      if (paymentIntentId) {
        try {
          const res = await fetch("/api/confirm-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentIntentId }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.orderId) {
            trackEvent("payment_succeeded", { platform, product_area: platform, amount, currency, orderId: String(data.orderId), method: "card_checkout" });
            trackEvent("checkout_completed", { platform, amount, currency, orderId: String(data.orderId), feature_name: "card_checkout" });
            window.location.href = `/order-success?platform=${encodeURIComponent(platform)}&orderId=${encodeURIComponent(String(data.orderId))}`;
            return;
          }
        } catch {
        }
      }
      onSuccess?.();
    }
    setSubmitting(false);
  };

  return (
    <div>
      <div data-testid="stripe-payment-element">
        <PaymentElement
          options={{
            layout: "tabs",
            paymentMethodOrder: ["card"],
            fields: { billingDetails: { email: email ? "never" : "auto" } },
          }}
        />
      </div>
      {err && (
        <div style={{ marginTop: 10, fontSize: 13, color: "var(--ig-2)" }}>{err}</div>
      )}
      <button
        onClick={submit}
        disabled={submitting}
        data-testid="stripe-card-submit"
        className="stripe-pay-btn"
        style={{ ["--brand" as string]: brandColor || "#5260e6" } as React.CSSProperties}
      >
        {submitting ? (
          <>
            <span className="pay-spinner" />
            <span>{paymentCopy.paying}</span>
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path
                d="M5 8V5.5a4 4 0 0 1 8 0V8M4 8h10v7H4z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{paymentCopy.pay}</span>
            <span className="pay-amount">
              {formattedAmount}
            </span>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M3 7h8M7 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}

export default function StripeCheckout({
  amount,
  currency,
  email,
  username,
  platform,
  cart,
  followersBefore,
  onSuccess,
  brandColor,
  clientSecret: prefetchedSecret,
}: StripeCheckoutProps) {
  const { locale } = useI18n();
  const paymentCopy = getPublicCopy(locale).payment;
  const effectiveCurrency = (currency || getDisplayCurrency() || "EUR").toLowerCase();
  const usesPrefetchedSecret = prefetchedSecret !== undefined;
  const [retryNonce, setRetryNonce] = useState(0);

  // If a pre-fetched secret is provided, use it directly; otherwise fetch locally.
  const { clientSecret: fetchedSecret, error: fetchError } = usePaymentIntent({
    amount,
    currency: effectiveCurrency,
    email,
    username,
    platform,
    cart,
    followersBefore,
    enabled: !usesPrefetchedSecret,
    retryNonce,
  });
  const clientSecret = usesPrefetchedSecret ? prefetchedSecret : fetchedSecret;
  const error = usesPrefetchedSecret ? null : fetchError;

  // Fire `payment_initiated` exactly once per checkout session — when the
  // Stripe Elements wrapper is about to render with a usable clientSecret.
  // This is the moment the user actually sees the payment form, distinct
  // from `checkout_started` (intent created server-side).
  const paymentInitiatedRef = useRef(false);
  useEffect(() => {
    if (!clientSecret || paymentInitiatedRef.current) return;
    paymentInitiatedRef.current = true;
    trackEvent("payment_initiated", {
      platform,
      product_area: platform,
      amount,
      currency: effectiveCurrency,
    });
    gtagBeginCheckout({
      value: amount / 100,
      currency: effectiveCurrency,
      platform,
    });
  }, [amount, clientSecret, effectiveCurrency, platform]);

  if (error) {
    // Localized retry label — kept inline to avoid threading a new key
    // through the 7-locale publicCopy.ts. The error itself is already
    // localized upstream by `usePaymentIntent`.
    const retryLabel: Record<string, string> = {
      fr: "Réessayer", en: "Retry", es: "Reintentar", pt: "Tentar de novo",
      de: "Erneut versuchen", it: "Riprova", tr: "Tekrar dene",
    };
    const localeKey = (locale || "fr").toLowerCase().split("-")[0];
    const retryText = retryLabel[localeKey] || retryLabel.fr;

    return (
      <div
        role="alert"
        style={{
          padding: 24,
          background: "rgba(214,41,118,0.08)",
          color: "var(--ig-2)",
          fontSize: 14,
          borderRadius: 12,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden style={{ color: "var(--ig-2)" }}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <div style={{ fontWeight: 600 }}>{error}</div>
        <button
          type="button"
          onClick={() => setRetryNonce((n) => n + 1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            background: "var(--ig-2)",
            color: "white",
            border: "none",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            transition: "transform 0.18s ease, box-shadow 0.18s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M21 12a9 9 0 1 1-3.5-7.1M21 4v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {retryText}
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "var(--ink-3)",
          fontSize: 14,
        }}
      >
        <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
        {paymentCopy.loading}
      </div>
    );
  }

  return (
    <Elements
      key={clientSecret}
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#5260e6",
            colorBackground: "#ffffff",
            colorText: "#1d1d2c",
            colorDanger: "#d62976",
            fontFamily: "system-ui, -apple-system, sans-serif",
            borderRadius: "12px",
          },
        },
      }}
    >
      <ExpressCheckout platform={platform} clientSecret={clientSecret} onSuccess={onSuccess} />
      <div style={{ textAlign: "center", margin: "16px 0" }}>
        <span style={{ color: "var(--ink-3)", fontSize: 12 }}>{paymentCopy.orPayByCard}</span>
      </div>
      <CardPayment
        email={email}
        platform={platform}
        amount={amount}
        currency={effectiveCurrency}
        clientSecret={clientSecret}
        brandColor={brandColor}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}
