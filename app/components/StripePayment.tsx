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
import { getPublicCopy } from "./publicCopy";

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
  enabled?: boolean;
}) {
  const { amount, currency = "eur", email, username, platform, cart, enabled = true } = args;
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
          setError("Connexion impossible au service de paiement");
          trackEvent("checkout_failed", { platform, product_area: productArea, reason: "payment_intent_network_error" });
        }
      });
    return () => {
      aborted = true;
    };
  }, [enabled, amount, currency, email, username, platform, cartKey, locale, pathname, productArea, experiment.anonymousId, experiment.assignment]);

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
            setErr(error.message || paymentCopy.paymentError);
            trackEvent("checkout_failed", { platform, reason: error.message || "express_checkout_error" });
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
      setErr(error.message || paymentCopy.paymentError);
      trackEvent("checkout_failed", { platform, amount, currency, reason: error.message || "card_checkout_error" });
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
  onSuccess,
  brandColor,
  clientSecret: prefetchedSecret,
}: StripeCheckoutProps) {
  const { locale } = useI18n();
  const paymentCopy = getPublicCopy(locale).payment;
  const effectiveCurrency = (currency || getDisplayCurrency() || "EUR").toLowerCase();
  const usesPrefetchedSecret = prefetchedSecret !== undefined;

  // If a pre-fetched secret is provided, use it directly; otherwise fetch locally.
  const { clientSecret: fetchedSecret, error: fetchError } = usePaymentIntent({
    amount,
    currency: effectiveCurrency,
    email,
    username,
    platform,
    cart,
    enabled: !usesPrefetchedSecret,
  });
  const clientSecret = usesPrefetchedSecret ? prefetchedSecret : fetchedSecret;
  const error = usesPrefetchedSecret ? null : fetchError;

  if (error) {
    return (
      <div
        style={{
          padding: 20,
          background: "rgba(214,41,118,0.08)",
          color: "var(--ig-2)",
          fontSize: 14,
          borderRadius: 12,
          textAlign: "center",
        }}
      >
        {error}
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
