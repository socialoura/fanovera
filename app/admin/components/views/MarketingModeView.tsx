"use client";

import { useEffect, useState } from "react";
import type { MarketingMode } from "@/app/lib/marketingModeTypes";
import { Ic } from "../icons";

type ApiResponse = {
  mode?: MarketingMode;
  error?: string;
};

const OPTIONS: { mode: MarketingMode; title: string; body: string; badge: string }[] = [
  {
    mode: "clean",
    title: "Clean",
    body: "Copy actuelle, plus prudente pour SEO, Stripe et communication long terme. Active sur toutes les langues.",
    badge: "Mode par défaut",
  },
  {
    mode: "performance",
    title: "Performance FR/EN",
    body: "Adcopy plus directe et orientée conversion sur l'accueil, les pages produit et les metadata. Les autres langues restent en clean.",
    badge: "FR + EN uniquement",
  },
];

export default function MarketingModeView() {
  const [mode, setMode] = useState<MarketingMode>("clean");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<MarketingMode | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("admin_pw") || ""}`,
  });

  useEffect(() => {
    fetch("/api/admin/marketing-mode", { headers: authHeaders() })
      .then(async (res) => {
        const data = (await res.json()) as ApiResponse;
        if (!res.ok || !data.mode) throw new Error(data.error || "Chargement impossible.");
        setMode(data.mode);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, []);

  const updateMode = async (nextMode: MarketingMode) => {
    setSaving(nextMode);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/marketing-mode", {
        method: "PUT",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: nextMode }),
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.mode) throw new Error(data.error || "Sauvegarde impossible.");
      setMode(data.mode);
      setMessage(
        data.mode === "performance"
          ? "Mode performance activé. Les visiteurs FR/EN verront la nouvelle adcopy au prochain rendu."
          : "Mode clean réactivé. Toutes les langues reviennent sur la copy standard.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sauvegarde impossible.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="marketing-mode-view">
      {error ? <div className="admin-alert error">{error}</div> : null}
      {message ? <div className="admin-alert success">{message}</div> : null}

      <div className="grid-2">
        <section className="card marketing-mode-hero">
          <div className="card-head">
            <div>
              <div className="card-title">Positionnement du site</div>
              <div className="card-sub">Un clic pour changer la copy publique FR/EN sans toucher aux packs ni aux prix.</div>
            </div>
            <span className={"pill " + (mode === "performance" ? "violet" : "green")}>
              <span className="dot" />
              {mode === "performance" ? "Performance" : "Clean"}
            </span>
          </div>

          <div className="marketing-mode-options">
            {OPTIONS.map((option) => {
              const active = option.mode === mode;
              const pending = saving === option.mode;
              return (
                <button
                  key={option.mode}
                  type="button"
                  className={"marketing-mode-card " + (active ? "active" : "")}
                  onClick={() => updateMode(option.mode)}
                  disabled={loading || Boolean(saving) || active}
                >
                  <span className="marketing-mode-card-top">
                    <span>
                      <strong>{option.title}</strong>
                      <em>{option.badge}</em>
                    </span>
                    <span className={"toggle " + (active ? "on" : "")} aria-hidden="true" />
                  </span>
                  <span>{option.body}</span>
                  <span className="marketing-mode-action">
                    {pending ? "Activation..." : active ? "Actif" : "Activer"}
                    {active ? Ic.check() : Ic.chevronRight()}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="card">
          <div className="card-title">Ce qui change</div>
          <div className="marketing-mode-list">
            <div><strong>Accueil</strong><span>Hero, CTA, FAQ, reassurance, footer.</span></div>
            <div><strong>Pages produit</strong><span>Titres, wording packs, étapes, FAQ, blocs de confiance.</span></div>
            <div><strong>SEO FR/EN</strong><span>Title, description, Open Graph, Twitter et JSON-LD produit.</span></div>
            <div><strong>Limite langues</strong><span>ES, PT, DE, IT et TR restent automatiquement en clean.</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
