"use client";

import Script from "next/script";

const GADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID; // e.g. "AW-XXXXXXXXX"

/**
 * Google Ads gtag loader.
 *
 * Strategy: `lazyOnload` defers the 175 KiB / ~650ms script until the
 * browser is idle, so it does not contribute to LCP/TBT on the landing
 * page. Conversion events fired before the script loads (`begin_checkout`
 * on Step 3, `purchase` on /order-success) push into `dataLayer` first
 * and gtag.js consumes the queue once it boots — no events are lost.
 *
 * The tiny init snippet stays at `afterInteractive` so `dataLayer` and
 * the `gtag()` shim exist before any other code can call them.
 */
export default function GoogleAdsTag() {
  if (!GADS_ID) return null;

  return (
    <>
      <Script id="gtag-bootstrap" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){dataLayer.push(arguments);};
          gtag('js', new Date());
          gtag('config', '${GADS_ID}', {
            send_page_view: true,
            allow_enhanced_conversions: true
          });
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GADS_ID}`}
        strategy="lazyOnload"
      />
    </>
  );
}
