"use client";

import { useMemo, useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { formatMoney } from "../lib/pricingCurrency";

/**
 * ROI calculator: compares the cost of acquiring N followers via Meta Ads
 * (Page Likes / Reels boost) versus a Fanovera pack of equivalent volume.
 *
 * Cost-per-follower (CPF) assumptions:
 * The default 0.50 EUR is a conservative midpoint of public 2024 Meta Ads
 * benchmarks (Wordstream, AdEspresso, Hootsuite reports place B2C CPF in
 * the 0.20-1.00 EUR range across IG/FB lookalike campaigns; niche/B2B can
 * exceed 1.50 EUR). The slider lets the visitor pick their own assumption,
 * we never hardcode a single "headline" number.
 *
 * Fanovera price uses a public benchmark grid (matching Instagram packs)
 * rather than fetching live currency to keep the calc deterministic.
 */

const FANOVERA_GRID: { qty: number; price: number }[] = [
  { qty: 100, price: 2.79 },
  { qty: 250, price: 5.49 },
  { qty: 500, price: 8.99 },
  { qty: 1000, price: 14.99 },
  { qty: 2500, price: 32.99 },
  { qty: 5000, price: 59.99 },
  { qty: 10000, price: 109.99 },
  { qty: 25000, price: 249.99 },
  { qty: 50000, price: 449.99 },
  { qty: 100000, price: 799.99 },
];

const COPY: Record<
  string,
  {
    title: string;
    subtitle: string;
    qtyLabel: string;
    cpfLabel: string;
    cpfHint: string;
    metaCost: string;
    fanoveraCost: string;
    savings: string;
    cta: string;
    disclaimerTitle: string;
    disclaimer: string;
    locale: string;
  }
> = {
  fr: {
    title: "Combien coute la croissance organique payee ?",
    subtitle: "Comparez le cout d'une campagne Meta Ads (Likes / Reels boost) avec un pack equivalent.",
    qtyLabel: "Cible : abonnes a obtenir",
    cpfLabel: "Cout par abonne via Meta Ads",
    cpfHint: "Benchmark public 2024 : 0,20 a 1,00 EUR selon secteur / pays. Ajustez selon votre realite.",
    metaCost: "Estimation Meta Ads",
    fanoveraCost: "Pack Fanovera equivalent",
    savings: "Difference",
    cta: "Commencer",
    disclaimerTitle: "Methodologie",
    disclaimer:
      "Source CPF : moyennes Meta Ads publiees par Wordstream/AdEspresso/Hootsuite (B2C IG/FB, marche EU/US). Le pack Fanovera correspond au palier le plus proche du volume cible. Note honnete : un abonne acquis via Meta Ads est cible/qualifie ; la nature des audiences peut differer. Ce calcul compare des couts d'acquisition, pas la qualite de l'audience.",
    locale: "fr-FR",
  },
  en: {
    title: "How much does paid organic growth really cost?",
    subtitle: "Compare a Meta Ads campaign (Likes / Reels boost) against an equivalent pack.",
    qtyLabel: "Target: followers to get",
    cpfLabel: "Cost per follower via Meta Ads",
    cpfHint: "Public 2024 benchmark: 0.20 to 1.00 EUR depending on industry / country. Adjust to your reality.",
    metaCost: "Meta Ads estimate",
    fanoveraCost: "Equivalent Fanovera pack",
    savings: "Difference",
    cta: "Get started",
    disclaimerTitle: "Methodology",
    disclaimer:
      "CPF source: Meta Ads averages from Wordstream/AdEspresso/Hootsuite (B2C IG/FB, EU/US market). Fanovera pack matches the closest tier to your target volume. Honest note: a Meta Ads-acquired follower is targeted/qualified; audience nature may differ. This compares acquisition cost, not audience quality.",
    locale: "en-US",
  },
  es: {
    title: "Cuanto cuesta el crecimiento organico pagado?",
    subtitle: "Compara el coste de una campana Meta Ads frente a un pack equivalente.",
    qtyLabel: "Objetivo: seguidores a obtener",
    cpfLabel: "Coste por seguidor via Meta Ads",
    cpfHint: "Benchmark publico 2024: 0,20 a 1,00 EUR segun sector / pais.",
    metaCost: "Estimacion Meta Ads",
    fanoveraCost: "Pack Fanovera equivalente",
    savings: "Diferencia",
    cta: "Empezar",
    disclaimerTitle: "Metodologia",
    disclaimer:
      "Fuente CPF: promedios Meta Ads de Wordstream/AdEspresso/Hootsuite (B2C IG/FB, mercado EU/US). El pack Fanovera coincide con el nivel mas cercano. Nota honesta: un seguidor obtenido via Meta Ads esta segmentado/cualificado; la naturaleza de las audiencias puede diferir.",
    locale: "es-ES",
  },
  pt: {
    title: "Quanto custa o crescimento organico pago?",
    subtitle: "Compare uma campanha Meta Ads com um pack equivalente.",
    qtyLabel: "Meta: seguidores",
    cpfLabel: "Custo por seguidor via Meta Ads",
    cpfHint: "Benchmark publico 2024: 0,20 a 1,00 EUR conforme setor / pais.",
    metaCost: "Estimativa Meta Ads",
    fanoveraCost: "Pack Fanovera equivalente",
    savings: "Diferenca",
    cta: "Comecar",
    disclaimerTitle: "Metodologia",
    disclaimer:
      "Fonte CPF: medias Meta Ads de Wordstream/AdEspresso/Hootsuite. O pack Fanovera escolhe o nivel mais proximo. Nota honesta: um seguidor adquirido via Meta Ads e segmentado; a natureza das audiencias pode diferir.",
    locale: "pt-PT",
  },
  de: {
    title: "Was kostet bezahltes organisches Wachstum?",
    subtitle: "Vergleiche eine Meta Ads Kampagne mit einem aequivalenten Paket.",
    qtyLabel: "Ziel: gewuenschte Follower",
    cpfLabel: "Kosten pro Follower via Meta Ads",
    cpfHint: "Oeffentliche Benchmark 2024: 0,20 bis 1,00 EUR je nach Branche.",
    metaCost: "Meta Ads Schaetzung",
    fanoveraCost: "Aequivalentes Fanovera-Paket",
    savings: "Differenz",
    cta: "Starten",
    disclaimerTitle: "Methodik",
    disclaimer:
      "CPF-Quelle: Meta Ads Durchschnittswerte von Wordstream/AdEspresso/Hootsuite. Das Fanovera-Paket entspricht der naechsten Stufe. Ehrliche Anmerkung: Ein via Meta Ads erworbener Follower ist gezielt; die Art der Zielgruppe kann sich unterscheiden.",
    locale: "de-DE",
  },
  it: {
    title: "Quanto costa la crescita organica a pagamento?",
    subtitle: "Confronta una campagna Meta Ads con un pacchetto equivalente.",
    qtyLabel: "Obiettivo: follower da ottenere",
    cpfLabel: "Costo per follower con Meta Ads",
    cpfHint: "Benchmark pubblico 2024: 0,20 a 1,00 EUR secondo settore / paese.",
    metaCost: "Stima Meta Ads",
    fanoveraCost: "Pacchetto Fanovera equivalente",
    savings: "Differenza",
    cta: "Inizia",
    disclaimerTitle: "Metodologia",
    disclaimer:
      "Fonte CPF: medie Meta Ads di Wordstream/AdEspresso/Hootsuite. Il pacchetto Fanovera e il livello piu vicino. Nota onesta: un follower acquisito via Meta Ads e mirato; la natura delle audience puo differire.",
    locale: "it-IT",
  },
  tr: {
    title: "Ucretli organik buyume ne kadara mal olur?",
    subtitle: "Bir Meta Ads kampanyasini esdeger bir paketle karsilastirin.",
    qtyLabel: "Hedef: kazanilacak takipci",
    cpfLabel: "Meta Ads ile takipci basina maliyet",
    cpfHint: "Kamuya acik 2024 referansi: sektore / ulkeye gore 0,20 - 1,00 EUR.",
    metaCost: "Meta Ads tahmini",
    fanoveraCost: "Esdeger Fanovera paketi",
    savings: "Fark",
    cta: "Basla",
    disclaimerTitle: "Metodoloji",
    disclaimer:
      "CPF kaynagi: Wordstream/AdEspresso/Hootsuite Meta Ads ortalamalari. Fanovera paketi en yakin kademedir. Durust not: Meta Ads ile edinilen takipci hedeflenmistir; izleyici dogasi farkli olabilir.",
    locale: "tr-TR",
  },
};

function pickClosestPack(qty: number) {
  let best = FANOVERA_GRID[0];
  let bestDiff = Math.abs(FANOVERA_GRID[0].qty - qty);
  for (const p of FANOVERA_GRID) {
    const diff = Math.abs(p.qty - qty);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = p;
    }
  }
  return best;
}

export default function RoiCalculator({ ctaHref = "/instagram" }: { ctaHref?: string }) {
  const { locale } = useI18n();
  const c = COPY[locale] || COPY.fr;

  const [qty, setQty] = useState<number>(10000);
  const [cpf, setCpf] = useState<number>(0.5);

  const fanoveraPack = useMemo(() => pickClosestPack(qty), [qty]);
  const metaCost = useMemo(() => qty * cpf, [qty, cpf]);
  const savings = Math.max(0, metaCost - fanoveraPack.price);
  const ratio = fanoveraPack.price > 0 ? metaCost / fanoveraPack.price : 0;

  return (
    <section
      data-testid="roi-calculator"
      style={{
        background: "white",
        border: "1px solid var(--line)",
        borderRadius: 22,
        padding: 28,
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <h2 className="display" style={{ fontSize: "clamp(24px, 3vw, 32px)", margin: "0 0 8px" }}>
        {c.title}
      </h2>
      <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 24px", lineHeight: 1.55 }}>
        {c.subtitle}
      </p>

      <label style={{ display: "block", marginBottom: 18 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          {c.qtyLabel}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="range"
            min={100}
            max={100000}
            step={100}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            style={{ flex: 1 }}
            aria-label={c.qtyLabel}
          />
          <div style={{ minWidth: 100, textAlign: "right", fontWeight: 800, fontSize: 18 }}>
            {qty.toLocaleString(c.locale)}
          </div>
        </div>
      </label>

      <label style={{ display: "block", marginBottom: 18 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          {c.cpfLabel}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="range"
            min={0.2}
            max={1.5}
            step={0.05}
            value={cpf}
            onChange={(e) => setCpf(Number(e.target.value))}
            style={{ flex: 1 }}
            aria-label={c.cpfLabel}
          />
          <div style={{ minWidth: 80, textAlign: "right", fontWeight: 800, fontSize: 18 }}>
            {formatMoney(cpf)}
          </div>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: "var(--ink-3)" }}>{c.cpfHint}</div>
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>
        <div style={{ padding: 16, background: "var(--paper-2)", borderRadius: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {c.metaCost}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, color: "var(--ink-3)", textDecoration: "line-through" }}>
            {formatMoney(metaCost)}
          </div>
        </div>
        <div style={{ padding: 16, background: "rgba(82,96,230,0.08)", borderRadius: 14, border: "1px solid rgba(82,96,230,0.25)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {c.fanoveraCost}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, color: "var(--primary)" }}>
            {formatMoney(fanoveraPack.price)}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
            {fanoveraPack.qty.toLocaleString(c.locale)}
          </div>
        </div>
      </div>

      {savings > 0 && (
        <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--green-soft, rgba(34,197,94,0.08))", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "var(--green, #16a34a)" }}>
          {c.savings} : {formatMoney(savings)} ({ratio >= 2 ? `~${Math.round(ratio)}x` : `${ratio.toFixed(1)}x`})
        </div>
      )}

      <a
        href={ctaHref}
        className="btn-primary"
        style={{ display: "inline-flex", marginTop: 20, padding: "14px 26px", fontSize: 16, fontWeight: 700 }}
      >
        {c.cta}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>

      <details style={{ marginTop: 24, fontSize: 12, color: "var(--ink-3)" }}>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>{c.disclaimerTitle}</summary>
        <p style={{ marginTop: 8, lineHeight: 1.55 }}>{c.disclaimer}</p>
      </details>
    </section>
  );
}
