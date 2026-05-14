"use client";

/**
 * Google Ads conversion tracking helpers.
 *
 * Required env vars (set in Vercel):
 *   NEXT_PUBLIC_GOOGLE_ADS_ID          — e.g. "AW-XXXXXXXXX"
 *   NEXT_PUBLIC_GADS_CONVERSION_PURCHASE — e.g. "AW-XXXXXXXXX/YYYYYYY" (purchase label)
 *   NEXT_PUBLIC_GADS_CONVERSION_BEGIN_CHECKOUT — (optional) begin_checkout label
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag(...args);
}

const GADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";
const PURCHASE_LABEL = process.env.NEXT_PUBLIC_GADS_CONVERSION_PURCHASE || "";
const BEGIN_CHECKOUT_LABEL = process.env.NEXT_PUBLIC_GADS_CONVERSION_BEGIN_CHECKOUT || "";

/**
 * Fire a Google Ads "purchase" conversion.
 * Called on /order-success when the orderId is confirmed.
 */
export function gtagPurchase(params: {
  orderId: string;
  value: number;      // in the display currency (e.g. 9.50)
  currency?: string;
  email?: string;
}) {
  if (!GADS_ID || !PURCHASE_LABEL) return;

  // Enhanced Conversions: send hashed email for better attribution
  if (params.email) {
    gtag("set", "user_data", { email: params.email });
  }

  gtag("event", "conversion", {
    send_to: PURCHASE_LABEL,
    value: params.value,
    currency: (params.currency || "EUR").toUpperCase(),
    transaction_id: params.orderId,
  });
}

/**
 * Fire a Google Ads "begin_checkout" event.
 * Called when Step 3 (Stripe payment form) renders.
 */
export function gtagBeginCheckout(params: {
  value: number;      // cart value in display currency
  currency?: string;
  platform: string;
}) {
  if (!GADS_ID) return;

  const eventParams: Record<string, unknown> = {
    value: params.value,
    currency: (params.currency || "EUR").toUpperCase(),
    items: [{ item_name: params.platform }],
  };

  // If a specific conversion label is set for begin_checkout, send it
  if (BEGIN_CHECKOUT_LABEL) {
    eventParams.send_to = BEGIN_CHECKOUT_LABEL;
    gtag("event", "conversion", eventParams);
  } else {
    // Standard GA4-style event (still useful for audiences)
    gtag("event", "begin_checkout", eventParams);
  }
}
