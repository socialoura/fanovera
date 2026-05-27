import Link from "next/link";
import CurrencySelector from "../../components/CurrencySelector";
import LanguageSelector from "../../components/LanguageSelector";
import { Logo } from "../../components/Header";
import NetIcon from "../../components/NetIcon";
import { getPublicCopy } from "../../components/publicCopy";
import { useI18n } from "../../i18n/I18nProvider";
import { NETWORKS } from "../../lib/networks";
import { useLinkedinCopy } from "../i18n";
import { withDynamicReviewCount } from "../../lib/reviewCount";

export default function LiHeader() {
  const t = useLinkedinCopy();
  const { locale } = useI18n();
  const publicHeader = getPublicCopy(locale).header;
  return (
    <div className="li-header" data-i18n-skip style={{ padding: "24px 0" }}>
      <div className="container pf-header">
        <Logo />
        <nav className="nav-pill">
          {NETWORKS.map((n) => (
            <Link
              key={n.id}
              href={`/${n.id}`}
              aria-label={n.name}
              title={n.name}
              className="nav-pill-icon"
            >
              <NetIcon kind={n.icon} color={n.color} size={18} />
            </Link>
          ))}
          <span aria-hidden style={{ width: 1, height: 18, background: "var(--line)", margin: "0 4px" }} />
          <Link href="/track">{publicHeader.track}</Link>
          <Link href="/#faq">{publicHeader.faq}</Link>
          <Link href="/contact">{publicHeader.contact}</Link>
        </nav>
        <div className="pf-header-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LanguageSelector compact />
          <CurrencySelector compact />
          <div className="hide-md" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--ink-2)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--yellow)">
              <path d="M7 1l1.8 4 4.2.6-3 3 .7 4.2L7 10.8 3.3 12.8 4 8.6 1 5.6l4.2-.6z" />
            </svg>
            <span style={{ fontWeight: 700 }}>4,9</span>
            <span>- {withDynamicReviewCount(t.header.ratingText)}</span>
          </div>
          <Link href="/" className="hide-md" style={{ width: 40, height: 40, borderRadius: 12, background: "white", border: "1px solid var(--line)", display: "grid", placeItems: "center", position: "relative" }} aria-label={t.header.home}>
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
