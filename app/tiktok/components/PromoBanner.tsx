"use client";

import { useEffect, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";

const LABELS: Record<string, { offer: string; applied: string }> = {
  fr: { offer: "⚡ Offre du moment", applied: "remise appliquée au paiement" },
  en: { offer: "⚡ Limited-time offer", applied: "discount applied at checkout" },
};

// Cosmetic urgency banner with a looping countdown. It intentionally does NOT
// assert a fixed percentage: the real discount comes from the server-validated
// coupon in step 4, so the charged total always matches what's displayed.
export default function PromoBanner() {
  const { locale } = useI18n();
  const l = LABELS[locale] || LABELS.en;
  const [t, setT] = useState({ h: 0, m: 11, s: 47 });

  useEffect(() => {
    const id = setInterval(() => {
      setT((p) => {
        let { h, m, s } = p;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 0; m = 11; s = 47; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const chip: React.CSSProperties = { background: "rgba(255,255,255,0.14)", padding: "2px 8px", borderRadius: 6 };

  return (
    <div className="tt2-promo-banner" data-i18n-skip>
      <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "0 16px" }}>
        <span style={{ fontWeight: 800 }}>{l.offer}</span>
        <span style={{ opacity: 0.9 }}>{l.applied}</span>
        <div style={{ display: "flex", gap: 4, fontFamily: "monospace", fontWeight: 700 }}>
          <span style={chip}>{pad(t.h)}h</span>
          <span style={chip}>{pad(t.m)}m</span>
          <span style={chip}>{pad(t.s)}s</span>
        </div>
      </div>
    </div>
  );
}
