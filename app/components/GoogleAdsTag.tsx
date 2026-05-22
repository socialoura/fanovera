"use client";

import Script from "next/script";

const GADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID; // e.g. "AW-XXXXXXXXX"

export default function GoogleAdsTag() {
  if (!GADS_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GADS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GADS_ID}', {
            send_page_view: true,
            allow_enhanced_conversions: true
          });
        `}
      </Script>
    </>
  );
}
