import { Logo } from "../../components/Header";
import NetIcon from "../../components/NetIcon";
import { NETWORKS } from "../../lib/networks";
import { useXCopy } from "../i18n";

function FootCol({ title, links }: { title: string; links: { l: string; h: string }[] }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 16, minHeight: 16 }}>{title}</div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {links.map((l, i) => (
          <li key={i}>
            <a href={l.h} style={{ fontSize: 14, color: "var(--ink-2)" }}>{l.l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function XFooter() {
  const t = useXCopy().footer;
  return (
    <footer data-i18n-skip style={{ padding: "60px 0 32px" }}>
      <div className="container">
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 40, marginBottom: 40, paddingBottom: 40, borderBottom: "1px solid var(--line)" }}>
          <div>
            <Logo />
            <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 280 }}>
              {t.desc}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
              {NETWORKS.map((n) => (
                <a key={n.id} href={"/" + n.id} aria-label={n.name} title={n.name} className={`net-icon ${n.id === "twitter" ? "active" : ""}`}>
                  <NetIcon kind={n.icon} color={n.id === "twitter" ? "white" : "currentColor"} size={18} />
                </a>
              ))}
            </div>
          </div>
          <FootCol title={t.networks} links={NETWORKS.slice(0, 4).map((n) => ({ l: n.name, h: "/" + n.id }))} />
          <FootCol title=" " links={NETWORKS.slice(4, 8).map((n) => ({ l: n.name, h: "/" + n.id }))} />
          <FootCol title={t.help} links={[
            { l: t.how, h: "#how" },
            { l: t.support, h: "#guarantee" },
            { l: "Contact", h: "mailto:hello@fanovera.com" },
            { l: t.tracking, h: "/track" },
          ]} />
          <FootCol title={t.legal} links={[
            { l: t.legalNotice, h: "/mentions-legales" },
            { l: "CGV", h: "/cgv" },
            { l: t.privacy, h: "/confidentialite" },
            { l: t.cookies, h: "/cookies" },
          ]} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontSize: 13, color: "var(--ink-3)" }}>
          <div>© Fanovera SAS 2026 · {t.madeIn} · 17 rue de Paradis · 75010 Paris</div>
          <div>hello@fanovera.com</div>
        </div>
      </div>
    </footer>
  );
}
