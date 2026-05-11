"use client";

import { useEffect, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
}

export type StripeCheckoutProps = {
  amount: number; // in cents
  email: string;
  username: string;
  platform: string;
  cart?: unknown;
  onSuccess?: () => void;
  brandColor?: string; // CSS color for the pay button (e.g. "var(--ig-2)")
};

function ExpressCheckout({
  platform,
  onSuccess,
}: {
  platform: string;
  onSuccess?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
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
          const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: `${window.location.origin}/order-success?platform=${platform}`,
            },
            redirect: "if_required",
          });
          if (error) setErr(error.message || "Erreur de paiement");
          else onSuccess?.();
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
  brandColor,
  onSuccess,
}: {
  email: string;
  platform: string;
  amount: number;
  brandColor?: string;
  onSuccess?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setErr(null);
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
    if (error) setErr(error.message || "Erreur de paiement");
    else onSuccess?.();
    setSubmitting(false);
  };

  return (
    <div>
      <PaymentElement
        options={{
          layout: "tabs",
          paymentMethodOrder: ["card"],
          fields: { billingDetails: { email: email ? "never" : "auto" } },
        }}
      />
      {err && (
        <div style={{ marginTop: 10, fontSize: 13, color: "var(--ig-2)" }}>{err}</div>
      )}
      <button
        onClick={submit}
        disabled={submitting}
        className="btn-primary"
        style={{
          width: "100%",
          marginTop: 16,
          padding: "16px 26px",
          fontSize: 16,
          background: brandColor || "var(--primary)",
          border: "none",
          color: "white",
          borderRadius: 999,
          fontWeight: 700,
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.7 : 1,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{ marginRight: 8, verticalAlign: "middle" }}
        >
          <path
            d="M3.5 6.5V4a3.5 3.5 0 1 1 7 0v2.5M2.5 6.5h9v6h-9z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {submitting
          ? "Paiement en cours…"
          : `Payer ${(amount / 100).toFixed(2).replace(".", ",")} €`}
      </button>
    </div>
  );
}

export default function StripeCheckout({
  amount,
  email,
  username,
  platform,
  cart,
  onSuccess,
  brandColor,
}: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!amount || amount < 100) return;
    let aborted = false;
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency: "eur", email, username, platform, cart }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (aborted) return;
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setError(data.error || "Erreur de paiement");
      })
      .catch(() => {
        if (!aborted) setError("Connexion impossible au service de paiement");
      });
    return () => {
      aborted = true;
    };
  }, [amount, email, username, platform, cart]);

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
        Chargement du paiement sécurisé…
      </div>
    );
  }

  return (
    <Elements
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
      <ExpressCheckout platform={platform} onSuccess={onSuccess} />
      <div style={{ textAlign: "center", margin: "16px 0" }}>
        <span style={{ color: "var(--ink-3)", fontSize: 12 }}>ou payer par carte</span>
      </div>
      <CardPayment
        email={email}
        platform={platform}
        amount={amount}
        brandColor={brandColor}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}
