"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useI18n } from "../i18n/I18nProvider";
import { buildCurrencyFormatter, getDisplayCurrency, SUPPORTED_CURRENCIES, type SupportedCurrency } from "../lib/pricingCurrency";
import { getProductConfig, normalizePlatform } from "../lib/productCatalog";
import { usePricingExperiment } from "../lib/usePricingExperiment";
import { currentAttributionProperties, trackEvent } from "../lib/analytics";
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

// Furthest point the user reached inside the checkout view. Reported up from the
// child payment components so `checkout_abandoned` can carry the last step and
// we can tell silent abandoners (saw the form, never tried) apart from users who
// attempted and failed. "paid" is terminal and suppresses the abandon event.
type CheckoutStep =
  | "checkout_viewed"
  | "payment_form_shown"
  | "payment_attempted"
  | "payment_failed"
  | "paid";

export type StripeCheckoutProps = {
  amount: number; // in cents
  currency?: string;
  email: string;
  username: string;
  platform: string;
  cart?: unknown;
  promoCode?: string;
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
  promoCode?: string;
  followersBefore?: number;
  enabled?: boolean;
  /** Bumping this nonce forces a fresh PaymentIntent fetch (e.g. user-clicked retry). */
  retryNonce?: number;
}) {
  const { amount, currency = "eur", email, username, platform, cart, promoCode, followersBefore, enabled = true, retryNonce = 0 } = args;
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

  // Metadata-only values: must be readable at fetch time but MUST NOT trigger
  // a new PaymentIntent on every keystroke / async profile load. Previously
  // they were in the effect deps and caused dozens of PaymentIntents per
  // checkout (one per character typed in email/username, plus one when the
  // profile preview loaded `followersBefore`). We read them via ref at the
  // moment fetch fires; the actual customer-facing email is captured at
  // confirm-time via `billing_details` and forwarded to /api/confirm-order.
  const metadataRef = useRef({ email, username, followersBefore });
  metadataRef.current = { email, username, followersBefore };
  const localeRef = useRef(locale);
  localeRef.current = locale;
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // Depend on the assignment primitives (not the object reference) so the
  // effect doesn't refetch when `usePricingExperiment` returns a new object
  // identity for unchanged values (e.g. after experiments load).
  const experimentId = experiment.assignment.experimentId;
  const variantId = experiment.assignment.variantId;
  const pricingStrategy = experiment.assignment.pricingStrategy;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !amount || amount < 50 || !experiment.anonymousId) return;
    let aborted = false;
    setClientSecret(null);
    setError(null);
    const { email: emailNow, username: usernameNow, followersBefore: followersNow } = metadataRef.current;
    const localeNow = localeRef.current;
    const pathnameNow = pathnameRef.current;
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientAmount: amount,
        currency,
        email: emailNow,
        username: usernameNow,
        platform,
        cart: cartRef.current,
        promoCode,
        locale: localeNow,
        sourcePage: pathnameNow ? `${pathnameNow}${window.location.search || ""}` : pathnameNow,
        attribution: currentAttributionProperties(),
        anonymousId: experiment.anonymousId,
        experimentId,
        variantId,
        pricingStrategy,
        followersBefore: typeof followersNow === "number" && followersNow > 0 ? followersNow : 0,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (aborted) return;
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else {
          const fallback = getPublicCopy(localeRef.current).payment.paymentError;
          setError(data.error || fallback);
          trackEvent("checkout_failed", { platform, product_area: productArea, reason: data.error || "payment_intent_error" });
        }
      })
      .catch(() => {
        if (!aborted) {
          setError(getPublicCopy(localeRef.current).payment.networkError);
          trackEvent("checkout_failed", { platform, product_area: productArea, reason: "payment_intent_network_error" });
        }
      });
    return () => {
      aborted = true;
    };
  }, [enabled, amount, currency, platform, cartKey, promoCode, productArea, experiment.anonymousId, experimentId, variantId, pricingStrategy, retryNonce]);

  return { clientSecret, error };
}

function ExpressCheckout({
  platform,
  amount,
  currency,
  clientSecret,
  onSuccess,
  onCheckoutStep,
  checkoutContext,
}: {
  platform: string;
  amount: number;
  currency: string;
  clientSecret: string;
  onSuccess?: () => void;
  onCheckoutStep?: (step: CheckoutStep) => void;
  checkoutContext: { email: string; username: string; followersBefore?: number };
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
          onCheckoutStep?.("payment_attempted");
          trackEvent("pricing_cta_clicked", { platform, amount, currency, feature_name: "express_checkout" });
          const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: `${window.location.origin}/order-success?platform=${platform}`,
            },
            redirect: "if_required",
          });
          if (error) {
            onCheckoutStep?.("payment_failed");
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
                  body: JSON.stringify({ paymentIntentId, ...checkoutContext }),
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok && data?.orderId) {
                  onCheckoutStep?.("paid");
                  trackEvent("payment_succeeded", { platform, product_area: platform, amount, currency, orderId: String(data.orderId), method: "express_checkout" });
                  trackEvent("checkout_completed", { platform, amount, currency, orderId: String(data.orderId), feature_name: "express_checkout" });
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
  onCheckoutStep,
  checkoutContext,
}: {
  email: string;
  platform: string;
  amount: number;
  currency: string;
  clientSecret: string;
  brandColor?: string;
  onSuccess?: () => void;
  onCheckoutStep?: (step: CheckoutStep) => void;
  checkoutContext: { email: string; username: string; followersBefore?: number };
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { locale } = useI18n();
  const paymentCopy = getPublicCopy(locale).payment;
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Brief lock after a failed attempt. Re-enabling the pay button instantly lets
  // anxious users hammer it, which trips Stripe.js's client-side "Too many
  // requests" throttle and surfaces a confusing extra error (observed: a few
  // users firing 5 confirmPayment calls in ~6s). A short cooldown prevents that
  // and reinforces the "wait a moment, then retry" guidance.
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const t = setTimeout(() => forceTick((n) => n + 1), cooldownUntil - Date.now());
    return () => clearTimeout(t);
  }, [cooldownUntil]);
  const inCooldown = cooldownUntil > Date.now();

  const upperCurrency = (currency || "eur").toUpperCase();
  const safeCurrency: SupportedCurrency = (SUPPORTED_CURRENCIES as readonly string[]).includes(upperCurrency)
    ? (upperCurrency as SupportedCurrency)
    : "EUR";
  const formattedAmount = buildCurrencyFormatter(safeCurrency, locale === "en" ? "en-US" : locale).format(
    (amount || 0) / 100,
  );

  const submit = async () => {
    if (!stripe || !elements) return;
    if (submitting || Date.now() < cooldownUntil) return;
    onCheckoutStep?.("payment_attempted");
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
      onCheckoutStep?.("payment_failed");
      setErr(humanizeStripeError(error, locale));
      trackEvent("checkout_failed", { platform, amount, currency, reason: error.code || error.message || "card_checkout_error" });
      setCooldownUntil(Date.now() + 3000);
    }
    else {
      const paymentIntentId = paymentIntentIdFromClientSecret(clientSecret);
      if (paymentIntentId) {
        try {
          const res = await fetch("/api/confirm-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentIntentId, ...checkoutContext }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.orderId) {
            onCheckoutStep?.("paid");
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
            // Express wallets (Apple/Google Pay) live in the ExpressCheckout
            // block above; this PaymentElement is card-only. The "tabs" layout
            // wastes a row on a single-method tab that suggests choices the
            // visitor can't actually make. Accordion with radios off + open
            // by default renders the card form flat — no chrome.
            layout: { type: "accordion", defaultCollapsed: false, radios: "never", spacedAccordionItems: false },
            paymentMethodOrder: ["card"],
            fields: { billingDetails: { email: email ? "never" : "auto" } },
          }}
        />
      </div>
      {err && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            padding: "10px 12px",
            fontSize: 13,
            lineHeight: 1.45,
            color: "#b42318",
            background: "rgba(180, 35, 24, 0.08)",
            border: "1px solid rgba(180, 35, 24, 0.25)",
            borderRadius: 10,
          }}
        >
          {err}
        </div>
      )}
      <button
        onClick={submit}
        disabled={submitting || inCooldown}
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
  promoCode,
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
    promoCode,
    followersBefore,
    enabled: !usesPrefetchedSecret,
    retryNonce,
  });
  const clientSecret = usesPrefetchedSecret ? prefetchedSecret : fetchedSecret;
  const error = usesPrefetchedSecret ? null : fetchError;

  // Funnel measurement (client-side, keyed by PostHog person_id):
  //  - `checkout_started`: fired exactly once when the user reaches this
  //    checkout view. Replaces the noisy server-side intent event as the
  //    funnel-grade "reached checkout" step (1 per view, not ~3.4 per intent).
  //  - `checkout_abandoned`: fired once on leave (SPA unmount or tab/page hide)
  //    when no payment succeeded, carrying the furthest `last_step` reached.
  // Live props are mirrored into a ref so both events carry current amount /
  // currency without putting them in the mount effect's deps (which would
  // re-run the effect — and fire a false abandon — on every currency switch).
  const funnelMetaRef = useRef({ platform, amount, currency: effectiveCurrency });
  funnelMetaRef.current = { platform, amount, currency: effectiveCurrency };
  const checkoutStartedRef = useRef(false);
  const paidRef = useRef(false);
  const abandonReportedRef = useRef(false);
  // True while a confirmPayment() call is in flight. Redirect-based methods
  // (3DS, iDEAL…) navigate away mid-attempt, which would otherwise fire a false
  // `checkout_abandoned` on pagehide even though the payment may still succeed
  // on /order-success. We suppress abandon while an attempt is pending; an
  // inline failure clears it so a later tab-close is still counted.
  const attemptInFlightRef = useRef(false);
  const lastStepRef = useRef<CheckoutStep>("checkout_viewed");

  const stepOrder: Record<CheckoutStep, number> = {
    checkout_viewed: 0,
    payment_form_shown: 1,
    payment_attempted: 2,
    payment_failed: 3,
    paid: 4,
  };
  const reportCheckoutStep = (step: CheckoutStep) => {
    if (step === "paid") {
      paidRef.current = true;
      attemptInFlightRef.current = false;
      return;
    }
    if (step === "payment_attempted") attemptInFlightRef.current = true;
    if (step === "payment_failed") attemptInFlightRef.current = false;
    // Only ever advance forward, so a late re-render can't rewind the funnel.
    if (stepOrder[step] > stepOrder[lastStepRef.current]) lastStepRef.current = step;
  };
  const reportAbandon = () => {
    if (
      !checkoutStartedRef.current
      || paidRef.current
      || abandonReportedRef.current
      || attemptInFlightRef.current
    ) return;
    abandonReportedRef.current = true;
    const { platform: p, amount: a, currency: c } = funnelMetaRef.current;
    trackEvent("checkout_abandoned", {
      platform: p,
      product_area: p,
      amount: a,
      currency: c,
      last_step: lastStepRef.current,
    });
  };

  useEffect(() => {
    if (!checkoutStartedRef.current) {
      checkoutStartedRef.current = true;
      const { platform: p, amount: a, currency: c } = funnelMetaRef.current;
      trackEvent("checkout_started", { platform: p, product_area: p, amount: a, currency: c });
    }
    // pagehide covers tab close / hard navigation (e.g. the redirect to
    // /order-success on success — guarded by paidRef); the cleanup covers
    // in-app (SPA) unmount when the user navigates back or changes step.
    const onVisibility = () => {
      if (document.visibilityState === "hidden") reportAbandon();
    };
    window.addEventListener("pagehide", reportAbandon);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", reportAbandon);
      document.removeEventListener("visibilitychange", onVisibility);
      reportAbandon();
    };
    // Fire once on mount / clean up once on unmount only — live values come
    // from refs, so amount/currency/platform must NOT be deps here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire `payment_initiated` exactly once per checkout session — when the
  // Stripe Elements wrapper is about to render with a usable clientSecret.
  // This is the moment the user actually sees the payment form.
  const paymentInitiatedRef = useRef(false);
  useEffect(() => {
    if (!clientSecret || paymentInitiatedRef.current) return;
    paymentInitiatedRef.current = true;
    reportCheckoutStep("payment_form_shown");
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
    // reportCheckoutStep only mutates refs; intentionally not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <ExpressCheckout
        platform={platform}
        amount={amount}
        currency={effectiveCurrency}
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onCheckoutStep={reportCheckoutStep}
        checkoutContext={{ email, username, followersBefore }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "28px 0 22px",
        }}
        aria-hidden
      >
        <hr style={{ flex: 1, border: 0, borderTop: "1px solid var(--line)", margin: 0 }} />
        <span
          style={{
            color: "var(--ink-2)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "5px 12px",
            background: "var(--paper-2)",
            border: "1px solid var(--line)",
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          {paymentCopy.orPayByCard}
        </span>
        <hr style={{ flex: 1, border: 0, borderTop: "1px solid var(--line)", margin: 0 }} />
      </div>
      <CardPayment
        email={email}
        platform={platform}
        amount={amount}
        currency={effectiveCurrency}
        clientSecret={clientSecret}
        brandColor={brandColor}
        onSuccess={onSuccess}
        onCheckoutStep={reportCheckoutStep}
        checkoutContext={{ email, username, followersBefore }}
      />
    </Elements>
  );
}
