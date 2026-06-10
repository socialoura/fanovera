"use client";

import { useSearchParams } from "next/navigation";
import NetIcon from "./NetIcon";
import { useI18n } from "../i18n/I18nProvider";
import { useMarketingMode } from "../marketing/MarketingModeProvider";
import { NETWORKS, NET_META, networkPath } from "../lib/networks";
import { getPublicCopy } from "./publicCopy";
import { trackEvent } from "../lib/analytics";
import { hrefWithPromoAttribution } from "../lib/promoAttribution";
import { detectTargetNetworkFromParams } from "../lib/detectTargetNetwork";

export default function CTABlock() {
  const { locale } = useI18n();
  const { mode, surfaceMode } = useMarketingMode();
  const searchParams = useSearchParams();
  const copy = getPublicCopy(locale, mode, surfaceMode).cta;
  const isPromo = mode === "promo";
  const targetedNetwork = isPromo ? detectTargetNetworkFromParams(searchParams) : null;

  return (
    <section id="start" style={{ padding: "clamp(56px, 8vw, 100px) 0", position: "relative" }}>
      <div className="container">
        <div
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--primary-2))",
            borderRadius: 28,
            padding: "60px 48px",
            color: "white",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="dot-pattern" style={{ position: "absolute", inset: 0, opacity: 0.2 }}></div>
          <div style={{ position: "relative" }}>
            <h2
              className="display"
              style={{
                fontSize: "clamp(36px, 4.6vw, 60px)",
                margin: "0 0 16px",
                color: "white",
              }}
            >
              {copy.titleBefore}<span style={{ color: "var(--yellow)" }}>{copy.titleHighlight}</span>{copy.titleAfter}
            </h2>
            <p
              style={{
                maxWidth: 540,
                margin: "0 auto 32px",
                fontSize: 17,
                opacity: 0.9,
              }}
            >
              {copy.body}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 40,
              }}
            >
              {NETWORKS.map((n) => {
                const isMatched = targetedNetwork === n.id;
                const meta = NET_META[n.id];
                const size = isMatched ? 72 : 48;
                const iconSize = isMatched ? 38 : 24;
                const matchedLabel = (locale || "fr").toLowerCase().startsWith("en")
                  ? "★ For you"
                  : "★ Pour vous";
                return (
                  <a
                    key={n.id}
                    href={isPromo ? hrefWithPromoAttribution(networkPath(n.id), searchParams, n.id) : networkPath(n.id)}
                    aria-label={n.name}
                    title={n.name}
                    data-matched={isMatched ? "true" : undefined}
                    className={isMatched ? "cta-net-matched" : undefined}
                    onClick={() => {
                      if (!isPromo) return;
                      trackEvent("cta_clicked", {
                        page_type: "promo",
                        entry_surface: "promo",
                        product_area: n.id,
                        destination_network: n.id,
                        destination_path: networkPath(n.id),
                        feature_name: "promo_network_selector",
                        cta_location: "bottom_network_icon",
                        targeted_match: isMatched,
                        targeted_network: targetedNetwork || undefined,
                      });
                    }}
                    style={{
                      ["--brand" as string]: meta.brand,
                      position: isMatched ? "relative" : undefined,
                      width: size,
                      height: size,
                      borderRadius: isMatched ? 18 : 14,
                      background: "white",
                      display: "grid",
                      placeItems: "center",
                      transition: "transform .25s",
                      overflow: isMatched ? "visible" : undefined,
                      order: isMatched ? -1 : 0,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "translateY(-4px) rotate(-3deg)")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
                  >
                    <NetIcon kind={n.icon} color={n.color} size={iconSize} />
                    {isMatched && (
                      <span
                        style={{
                          position: "absolute",
                          top: "calc(100% + 6px)",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: "0.04em",
                          color: "white",
                          background: meta.brand,
                          padding: "3px 9px",
                          borderRadius: 999,
                          whiteSpace: "nowrap",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.28)",
                        }}
                      >
                        {matchedLabel}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              {copy.footer}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
