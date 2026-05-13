"use client";

import { useEffect, useState } from "react";
import { Ic } from "../icons";

type LocaleSummary = {
  locale: string;
  exact: number;
  fragments: number;
  total: number;
  samples: string[];
};

type SyncSummary = {
  locales: LocaleSummary[];
  total: number;
};

type SyncResult = {
  ok: boolean;
  before: SyncSummary;
  after: SyncSummary;
  translated: Array<{ locale: string; exact: number; fragments: number }>;
};

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("admin_pw") || ""}`,
  };
}

export default function I18nSyncView() {
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/i18n-sync", { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const runSync = async () => {
    if (!confirm("Traduire et écrire les clés manquantes dans les fichiers de locales ?")) return;

    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/i18n-sync", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
      setSummary(data.after);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Synchronisation impossible");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="i18n-admin">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head" style={{ marginBottom: 0 }}>
          <div>
            <div className="card-title">Traductions automatiques</div>
            <div className="card-sub">
              Détecte les entrées héritées de l&apos;anglais dans es, pt, de, it et tr, puis les pré-remplit avec OpenAI.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn" onClick={loadSummary} disabled={loading || running}>
              {Ic.refresh()} Analyser
            </button>
            <button className="btn primary" onClick={runSync} disabled={running || loading || !summary?.total}>
              {running ? "Traduction..." : "Traduire les clés manquantes"}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="admin-alert error">{error}</div>
      ) : null}

      {result ? (
        <div className="admin-alert success">
          Synchronisation terminée. Avant: {result.before.total} entrée(s), après: {result.after.total} entrée(s).
        </div>
      ) : null}

      {loading ? (
        <div style={{ padding: 32, color: "var(--a-ink-3)" }}>Analyse des locales...</div>
      ) : summary ? (
        <div className="grid-3">
          {summary.locales.map((locale) => (
            <div className="card" key={locale.locale}>
              <div className="card-head">
                <div>
                  <div className="card-title" style={{ textTransform: "uppercase" }}>{locale.locale}</div>
                  <div className="card-sub">
                    {locale.exact} exact · {locale.fragments} fragments
                  </div>
                </div>
                <span className={"pill " + (locale.total ? "amber" : "green")}>
                  <span className="dot" />
                  {locale.total}
                </span>
              </div>

              {locale.samples.length ? (
                <div className="i18n-samples">
                  {locale.samples.map((sample) => (
                    <code key={sample}>{sample}</code>
                  ))}
                </div>
              ) : (
                <div className="order-empty">Aucune clé manquante.</div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Configuration</div>
        <div className="card-sub" style={{ marginTop: 6 }}>
          Utilise <code>OPENAI_API_KEY</code> côté serveur. Optionnel: <code>OPENAI_TRANSLATION_MODEL</code>.
        </div>
      </div>
    </div>
  );
}
