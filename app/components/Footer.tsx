import { Logo } from "./Header";
import NetIcon from "./NetIcon";
import { NETWORKS } from "../lib/networks";

function FootCol({
  title,
  links,
}: {
  title: string;
  links: { l: string; h: string }[];
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          marginBottom: 16,
          minHeight: 16,
        }}
      >
        {title}
      </div>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {links.map((l, i) => (
          <li key={i}>
            <a href={l.h} style={{ fontSize: 14, color: "var(--ink-2)" }}>
              {l.l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer style={{ padding: "48px 0 24px" }}>
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: 40,
            marginBottom: 28,
            paddingBottom: 28,
            borderBottom: "1px solid var(--line)",
          }}
          className="footer-grid"
        >
          <div>
            <Logo />
            <p
              style={{
                marginTop: 14,
                fontSize: 13,
                lineHeight: 1.55,
                color: "var(--ink-2)",
                maxWidth: 320,
              }}
            >
              Croissance social media propulsée par IA. 100% whitehat, vrais comptes.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              {NETWORKS.map((n) => (
                <a
                  key={n.id}
                  href={`/${n.id}`}
                  aria-label={n.name}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "white",
                    border: "1px solid var(--line)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <NetIcon kind={n.icon} color={n.color} size={18} />
                </a>
              ))}
            </div>
          </div>
          <FootCol
            title="Produit"
            links={[
              { l: "Fonctionnement", h: "#how" },
              { l: "Témoignages", h: "#proof" },
              { l: "FAQ", h: "#faq" },
              { l: "Affiliation", h: "#aff" },
            ]}
          />
          <FootCol
            title="Société"
            links={[
              { l: "Mentions légales", h: "#legal" },
              { l: "CGU", h: "#cgu" },
              { l: "Confidentialité", h: "#privacy" },
              { l: "Contact", h: "mailto:hello@fanovera.com" },
            ]}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 13,
            color: "var(--ink-3)",
          }}
        >
          <div>© Fanovera SAS 2026 · Made in Paris</div>
          <div>hello@fanovera.com · 17 rue de Paradis · 75010 Paris</div>
        </div>
      </div>
    </footer>
  );
}
