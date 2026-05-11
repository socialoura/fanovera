import Image from "next/image";
import NetIcon from "./NetIcon";
import { NETWORKS } from "../lib/networks";

export function Logo() {
  return (
    <a href="/" className="logo" aria-label="Fanovera">
      <Image
        src="/fanovera-logo.png"
        alt="Fanovera"
        width={752}
        height={252}
        priority
        style={{ height: 36, width: "auto", display: "block" }}
      />
    </a>
  );
}

export default function Header() {
  return (
    <div style={{ padding: "24px 0" }}>
      <div className="container header-row">
        <Logo />
        <nav className="nav-pill">
          {NETWORKS.map((n) => (
            <a
              key={n.id}
              href={`/${n.id}`}
              aria-label={n.name}
              title={n.name}
              className="nav-pill-icon"
            >
              <NetIcon kind={n.icon} color={n.color} size={18} />
            </a>
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
          <a href="/track">Suivi</a>
          <a href="/#faq">FAQ</a>
          <a href="/contact">Contact</a>
        </nav>
        <div className="header-cta-group" style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
