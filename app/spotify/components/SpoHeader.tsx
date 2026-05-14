import Link from "next/link";
import CurrencySelector from "../../components/CurrencySelector";
// import LanguageSelector from "../../components/LanguageSelector";
import { Logo } from "../../components/Header";
import { useSpotifyCopy } from "../i18n";
import { withDynamicReviewCount } from "../../lib/reviewCount";

export default function SpoHeader() {
  const t = useSpotifyCopy().header;
  return (
    <div data-i18n-skip className="spo-header" style={{ padding: "24px 0" }}>
      <div className="container pf-header">
        <Logo />
        <nav className="nav-pill">
          <Link href="/instagram">Instagram</Link>
          <Link href="/tiktok">TikTok</Link>
          <Link href="/youtube">YouTube</Link>
          <Link href="/spotify" className="active">Spotify</Link>
          <Link href="/#networks">{t.allNetworks}</Link>
          <Link href="/track">{t.tracking}</Link>
        </nav>
        <div className="pf-header-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* <LanguageSelector compact /> */}
          <CurrencySelector compact />
          <div
            className="hide-md"
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--ink-2)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--yellow)">
              <path d="M7 1l1.8 4 4.2.6-3 3 .7 4.2L7 10.8 3.3 12.8 4 8.6 1 5.6l4.2-.6z" />
            </svg>
            <span style={{ fontWeight: 700 }}>4,9</span>
            <span>· {withDynamicReviewCount(t.ratingText)}</span>
          </div>
          <Link
            href="/"
            className="hide-md"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "white",
              border: "1px solid var(--line)",
              display: "grid",
              placeItems: "center",
              position: "relative",
            }}
            aria-label={t.home}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5h2l2.4 11.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.5L21 8H6" />
              <circle cx="9" cy="21" r="1" />
              <circle cx="18" cy="21" r="1" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
