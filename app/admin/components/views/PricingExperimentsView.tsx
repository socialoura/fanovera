"use client";

import { useEffect, useState } from "react";
import { DEFAULT_EXPERIMENTS, type PricingExperiment, type PricingVariant } from "@/app/lib/pricingExperiments";
import { Ic } from "../icons";

const PRODUCT_AREAS = ["instagram", "tiktok", "youtube", "spotify", "twitch", "facebook", "linkedin", "twitter"];
const LOCALES = ["fr", "en", "es", "pt", "de", "it", "tr"];

type SettingsResponse = {
  enabled: boolean;
  experiments: PricingExperiment[];
  source?: string;
  error?: string;
};

type ResultsResponse = {
  days: number;
  variants: Array<{
    experimentId: string;
    variantId: string;
    pricingStrategy: string;
    visitors: number;
    exposures: number;
    checkoutStarted: number;
    orders: number;
    revenueCents: number;
    costCents: number;
    profitCents: number;
    averageOrderValueCents: number;
    visitorConversionRate: number;
    checkoutConversionRate: number;
  }>;
  error?: string;
};

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("admin_pw") || ""}`,
    "Content-Type": "application/json",
  };
}

function newVariant(): PricingVariant {
  return {
    id: `variant_${Date.now().toString(36)}`,
    label: "Nouvelle variante",
    traffic: 50,
    priceMultiplier: 1,
    pricingStrategy: "custom",
    paused: false,
  };
}

function newExperiment(): PricingExperiment {
  return {
    id: `pricing_${Date.now().toString(36)}`,
    enabled: false,
    traffic: 100,
    seed: `fanovera-${Date.now().toString(36)}`,
    productAreas: ["instagram"],
    locales: ["fr"],
    variants: [
      { id: "control", label: "Prix actuel", traffic: 50, priceMultiplier: 1, pricingStrategy: "standard" },
      { id: "premium_10", label: "Prix +10%", traffic: 50, priceMultiplier: 1.1, pricingStrategy: "premium_positioning" },
    ],
  };
}

function toggleListValue(list: string[] | undefined, value: string) {
  const next = new Set(list || []);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return Array.from(next);
}

export default function PricingExperimentsView() {
  const [enabled, setEnabled] = useState(false);
  const [experiments, setExperiments] = useState<PricingExperiment[]>(DEFAULT_EXPERIMENTS);
  const [source, setSource] = useState("default");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resultsDays, setResultsDays] = useState(30);
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  const loadResults = async (days = resultsDays) => {
    setResultsLoading(true);
    try {
      const res = await fetch(`/api/admin/pricing-experiments/results?days=${days}`, { headers: authHeaders() });
      const data = (await res.json()) as ResultsResponse;
      if (!res.ok) throw new Error(data.error || "Résultats indisponibles.");
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Résultats indisponibles.");
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/admin/pricing-experiments", { headers: authHeaders() })
      .then(async (res) => {
        const data = (await res.json()) as SettingsResponse;
        if (!res.ok) throw new Error(data.error || "Chargement impossible.");
        setEnabled(Boolean(data.enabled));
        setExperiments(data.experiments?.length ? data.experiments : DEFAULT_EXPERIMENTS);
        setSource(data.source || "default");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) void loadResults(resultsDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const updateExperiment = (index: number, patch: Partial<PricingExperiment>) => {
    setExperiments((current) => current.map((experiment, i) => i === index ? { ...experiment, ...patch } : experiment));
  };

  const updateVariant = (experimentIndex: number, variantIndex: number, patch: Partial<PricingVariant>) => {
    setExperiments((current) =>
      current.map((experiment, i) => {
        if (i !== experimentIndex) return experiment;
        return {
          ...experiment,
          variants: experiment.variants.map((variant, j) => j === variantIndex ? { ...variant, ...patch } : variant),
        };
      }),
    );
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/pricing-experiments", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ enabled, experiments }),
      });
      const data = (await res.json()) as SettingsResponse;
      if (!res.ok) throw new Error(data.error || "Sauvegarde impossible.");
      setEnabled(Boolean(data.enabled));
      setExperiments(data.experiments);
      setSource(data.source || "database");
      setSuccess("Configuration A/B sauvegardée. Elle est prise en compte au prochain chargement de page et au checkout.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sauvegarde impossible.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card">Chargement des A/B tests...</div>;

  return (
    <div className="ab-pricing-view">
      {error ? <div className="admin-alert error">{error}</div> : null}
      {success ? <div className="admin-alert success">{success}</div> : null}

      <section className="card ab-pricing-hero">
        <div>
          <div className="card-title">A/B tests de prix</div>
          <div className="card-sub">
            Configure les variantes sans toucher aux variables Vercel. Source actuelle : <strong>{source}</strong>.
          </div>
        </div>
        <div className="ab-pricing-switch">
          <span>{enabled ? "Tests actifs" : "Tests désactivés"}</span>
          <button type="button" className={"toggle " + (enabled ? "on" : "")} onClick={() => setEnabled((v) => !v)} aria-label="Activer les tests A/B" />
        </div>
      </section>

      <div className="ab-pricing-actions">
        <button className="btn" type="button" onClick={() => setExperiments((current) => [...current, newExperiment()])}>
          {Ic.plus()} Ajouter une expérience
        </button>
        <button className="btn primary" type="button" onClick={save} disabled={saving}>
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>

      <section className="card ab-results-card">
        <div className="ab-variants-head">
          <div>
            <div className="card-title">Résultats par variante</div>
            <div className="card-sub">Basé sur les checkouts démarrés et les commandes payées stockés en BDD.</div>
          </div>
          <div className="ab-results-actions">
            <select
              className="input"
              value={resultsDays}
              onChange={(event) => {
                const next = Number(event.target.value);
                setResultsDays(next);
                void loadResults(next);
              }}
            >
              <option value={7}>7 jours</option>
              <option value={30}>30 jours</option>
              <option value={90}>90 jours</option>
              <option value={365}>365 jours</option>
            </select>
            <button className="btn" type="button" onClick={() => loadResults()} disabled={resultsLoading}>
              {Ic.refresh()} {resultsLoading ? "Chargement..." : "Rafraîchir"}
            </button>
          </div>
        </div>

        <div className="ab-results-table-wrap">
          <table className="table ab-results-table">
            <thead>
              <tr>
                <th>Expérience</th>
                <th>Variante</th>
                <th>Visiteurs</th>
                <th>Checkouts</th>
                <th>Commandes</th>
                <th>Conv. visiteur</th>
                <th>Conv. checkout</th>
                <th>CA</th>
                <th>Panier moy.</th>
                <th>Profit brut</th>
              </tr>
            </thead>
            <tbody>
              {(results?.variants || []).map((row) => (
                <tr key={`${row.experimentId}-${row.variantId}-${row.pricingStrategy}`}>
                  <td><strong>{row.experimentId}</strong></td>
                  <td>
                    <span className="pill violet">{row.variantId}</span>
                    <div className="card-sub">{row.pricingStrategy}</div>
                  </td>
                  <td>{row.visitors}</td>
                  <td>{row.checkoutStarted}</td>
                  <td>{row.orders}</td>
                  <td>{(row.visitorConversionRate * 100).toFixed(1)}%</td>
                  <td>{(row.checkoutConversionRate * 100).toFixed(1)}%</td>
                  <td>{formatMoney(row.revenueCents)}</td>
                  <td>{formatMoney(row.averageOrderValueCents)}</td>
                  <td>{formatMoney(row.profitCents)}</td>
                </tr>
              ))}
              {!resultsLoading && (!results || results.variants.length === 0) ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", color: "var(--a-ink-3)", padding: 18 }}>
                    Aucun résultat pour cette période. Les prochaines commandes avec A/B test apparaîtront ici.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {experiments.map((experiment, experimentIndex) => {
        const variantTraffic = experiment.variants.reduce((sum, variant) => sum + (Number(variant.traffic) || 0), 0);
        return (
          <section className="card ab-experiment-card" key={`${experiment.id}-${experimentIndex}`}>
            <div className="ab-experiment-head">
              <div>
                <input
                  className="input ab-title-input"
                  value={experiment.id}
                  onChange={(event) => updateExperiment(experimentIndex, { id: event.target.value })}
                />
                <div className="card-sub">Trafic variantes : {variantTraffic}%</div>
              </div>
              <div className="ab-experiment-head-actions">
                <button
                  type="button"
                  className={"toggle " + (experiment.enabled ? "on" : "")}
                  onClick={() => updateExperiment(experimentIndex, { enabled: !experiment.enabled })}
                  aria-label="Activer cette expérience"
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setExperiments((current) => current.filter((_, i) => i !== experimentIndex))}
                  aria-label="Supprimer l'expérience"
                >
                  {Ic.trash()}
                </button>
              </div>
            </div>

            <div className="ab-grid">
              <label className="label">Trafic exposé (%)
                <input className="input" type="number" min={0} max={100} value={experiment.traffic} onChange={(event) => updateExperiment(experimentIndex, { traffic: Number(event.target.value) })} />
              </label>
              <label className="label">Seed stable
                <input className="input" value={experiment.seed} onChange={(event) => updateExperiment(experimentIndex, { seed: event.target.value })} />
              </label>
              <label className="label">Pays ciblés optionnels
                <input className="input" placeholder="FR,BE,CH ou vide" value={(experiment.countries || []).join(",")} onChange={(event) => updateExperiment(experimentIndex, { countries: event.target.value.split(",").map((v) => v.trim()).filter(Boolean) })} />
              </label>
            </div>

            <div className="ab-check-section">
              <div className="label">Produits</div>
              <div className="ab-check-grid">
                {PRODUCT_AREAS.map((product) => (
                  <label key={product} className="chip">
                    <input
                      type="checkbox"
                      checked={experiment.productAreas.includes(product)}
                      onChange={() => updateExperiment(experimentIndex, { productAreas: toggleListValue(experiment.productAreas, product) })}
                    />
                    {product}
                  </label>
                ))}
              </div>
            </div>

            <div className="ab-check-section">
              <div className="label">Langues</div>
              <div className="ab-check-grid">
                {LOCALES.map((locale) => (
                  <label key={locale} className="chip">
                    <input
                      type="checkbox"
                      checked={(experiment.locales || []).includes(locale)}
                      onChange={() => updateExperiment(experimentIndex, { locales: toggleListValue(experiment.locales, locale) })}
                    />
                    {locale}
                  </label>
                ))}
              </div>
            </div>

            <div className="ab-variants">
              <div className="ab-variants-head">
                <div className="label">Variantes</div>
                <button
                  className="btn"
                  type="button"
                  onClick={() => updateExperiment(experimentIndex, { variants: [...experiment.variants, newVariant()] })}
                >
                  {Ic.plus()} Variante
                </button>
              </div>
              {experiment.variants.map((variant, variantIndex) => (
                <div
                  className="ab-variant-row"
                  key={`${variant.id}-${variantIndex}`}
                  style={variant.paused ? { opacity: 0.55 } : undefined}
                >
                  <input className="input" value={variant.id} onChange={(event) => updateVariant(experimentIndex, variantIndex, { id: event.target.value })} placeholder="id" />
                  <input className="input" value={variant.label} onChange={(event) => updateVariant(experimentIndex, variantIndex, { label: event.target.value })} placeholder="Label" />
                  <label>Trafic <input className="input" type="number" min={0} max={100} value={variant.traffic} onChange={(event) => updateVariant(experimentIndex, variantIndex, { traffic: Number(event.target.value) })} /></label>
                  <label>Prix x <input className="input" type="number" step="0.01" value={variant.priceMultiplier} onChange={(event) => updateVariant(experimentIndex, variantIndex, { priceMultiplier: Number(event.target.value) })} /></label>
                  <input className="input" value={variant.pricingStrategy} onChange={(event) => updateVariant(experimentIndex, variantIndex, { pricingStrategy: event.target.value })} placeholder="strategy" />
                  <button
                    type="button"
                    className={"toggle " + (variant.paused ? "" : "on")}
                    onClick={() => updateVariant(experimentIndex, variantIndex, { paused: !variant.paused })}
                    aria-label={variant.paused ? "Reprendre la variante" : "Mettre en pause la variante"}
                    title={variant.paused ? "Reprendre — les utilisateurs de ce bucket reverront cette variante" : "Mettre en pause — les utilisateurs de ce bucket retombent sur le contrôle"}
                  />
                  <button
                    className="icon-btn"
                    type="button"
                    onClick={() => updateExperiment(experimentIndex, { variants: experiment.variants.filter((_, i) => i !== variantIndex) })}
                    aria-label="Supprimer la variante"
                    disabled={experiment.variants.length <= 1}
                  >
                    {Ic.trash()}
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format((Number(cents) || 0) / 100);
}
