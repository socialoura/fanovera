import Image from "next/image";
import Link from "next/link";
import CurrencySelector from "./CurrencySelector";
import NetIcon from "./NetIcon";
import { NETWORKS } from "../lib/networks";

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
  return (
    <div style={{ padding: "24px 0" }}>
      <div className="container header-row">
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
          <span
            aria-hidden
            style={{
              width: 1,
              height: 18,
              background: "var(--line)",
              margin: "0 4px",
            }}
          />
          <Link href="/track">Suivi</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="header-cta-group" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CurrencySelector compact />
          <a
            href="#start"
            className="btn-primary hide-md"
            style={{ padding: "10px 20px", fontSize: 14 }}
          >
            Commencer
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
