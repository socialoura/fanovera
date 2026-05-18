 "use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CurrencySelector from "./CurrencySelector";
import LanguageSelector from "./LanguageSelector";
import NetIcon from "./NetIcon";
import { useI18n } from "../i18n/I18nProvider";
import { useMarketingMode } from "../marketing/MarketingModeProvider";
import { NETWORKS } from "../lib/networks";
import { getPublicCopy } from "./publicCopy";
import { trackEvent } from "../lib/analytics";
import { hrefWithPromoAttribution } from "../lib/promoAttribution";

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Fanovera">
      <Image
        src="/fanovera-logo.png"
        alt="Fanovera"
        width={752}
        height={252}
        priority
        style={{ height: 36, width: "auto", display: "block" }}
      />
    </Link>
  );
}

export default function Header() {
  const { locale } = useI18n();
  const { mode, surfaceMode } = useMarketingMode();
  const searchParams = useSearchParams();
  const copy = getPublicCopy(locale, mode, surfaceMode).header;
  const isPromo = mode === "promo";

  return (
    <div style={{ padding: "24px 0" }}>
      <div className="container header-row">
        <span className="header-lang-mobile"><LanguageSelector compact /></span>
        <Logo />
        <nav className="nav-pill">
          {NETWORKS.map((n) => (
            <Link
              key={n.id}
              href={isPromo ? hrefWithPromoAttribution(`/${n.id}`, searchParams) : `/${n.id}`}
              aria-label={n.name}
              title={n.name}
              className="nav-pill-icon"
              onClick={() => {
                if (!isPromo) return;
                trackEvent("cta_clicked", {
                  page_type: "promo",
                  entry_surface: "promo",
                  product_area: n.id,
                  destination_network: n.id,
                  destination_path: `/${n.id}`,
                  feature_name: "promo_network_selector",
                  cta_location: "header_network_icon",
                });
              }}
            >
              <NetIcon kind={n.icon} color={n.color} size={18} />
            </Link>
          ))}
          <span
            aria-hidden
            style={{
              width: 1,
              height: 18,
              background: "var(--line)",
              margin: "0 4px",
            }}
          />
          <Link href="/track">{copy.track}</Link>
          <Link href="/#faq">{copy.faq}</Link>
          <Link href="/contact">{copy.contact}</Link>
        </nav>
        <div className="header-cta-group" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="header-lang-desktop-only"><LanguageSelector compact /></span>
          <CurrencySelector compact />
          <a
            href="#start"
            className="btn-primary hide-md"
            onClick={() => {
              if (!isPromo) return;
              trackEvent("cta_clicked", {
                page_type: "promo",
                entry_surface: "promo",
                feature_name: "promo_start_anchor",
                cta_location: "header_start",
              });
            }}
            style={{ padding: "10px 20px", fontSize: 14 }}
          >
            {copy.start}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 7h8M7 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
