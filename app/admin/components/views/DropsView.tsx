"use client";

import { useCallback, useEffect, useState } from "react";
import { Ic } from "../icons";

interface SmmRollup {
  completed: number;
  placed: number;
  partial: number;
  failed: number;
  canceled: number;
}
type DropKind = "drop" | "undelivered" | "both" | "ok";
interface DropRow {
  orderId: number;
  username: string;
  email: string | null;
  lang: string | null;
  status: string;
  date: string;
  before: number;
  baseline: number;
  baselineSource: "live" | "snapshot";
  ordered: number;
  delivered: number;
  deliveredApprox: boolean;
  undelivered: number;
  expected: number;
  current: number | null;
  currentSource: "live" | "cache" | null;
  currentCheckedAt: string | null;
  lost: number;
  pctDrop: number;
  pctOfDelivered: number;
  pctUndelivered: number;
  kind: DropKind;
  refundedCents: number;
  videoUrl: string | null;
  smm: SmmRollup;
  refillNoticeSentAt: string | null;
  lastRefillAt: string | null;
  lastTopupAt: string | null;
  topUp: { cartIndex: number; quantity: number } | null;
  error?: string;
}
type DropMetric = "followers" | "likes" | "views";
interface DropAnalysis {
  metric: DropMetric;
  flagged: DropRow[];
  ok: DropRow[];
  errors: DropRow[];
  summary: {
    accountsScanned: number;
    flaggedCount: number;
    dropCount: number;
    undeliveredCount: number;
    threshold: number;
    followersLost: number;
    followersUndelivered: number;
  };
  provider: string;
  balance: { balance: number | null; error: string | null };
}

const KIND_BADGE: Record<Exclude<DropKind, "ok">, { label: string; bg: string; fg: string }> = {
  drop: { label: "DROP", bg: "rgba(224,74,140,0.15)", fg: "var(--a-accent)" },
  undelivered: { label: "NON LIVRÉ", bg: "rgba(234,179,8,0.15)", fg: "#eab308" },
  both: { label: "DROP + NON LIVRÉ", bg: "rgba(224,74,140,0.15)", fg: "var(--a-accent)" },
};

function getToken() {
  return localStorage.getItem("admin_pw") ?? "";
}
function authHeaders(): HeadersInit {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Per-row action feedback ("refill ok", "email envoyé", error…).
type RowState = { busy?: "refill" | "email" | "refresh" | "topup"; msg?: string; tone?: "ok" | "err" };

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}
function ageMin(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
}
function usd(n: number): string {
  return "$" + n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
// A media order has one row per video, so rows aren't unique by orderId alone.
function rowKey(r: { orderId: number; videoUrl: string | null }): string {
  return `${r.orderId}:${r.videoUrl ?? ""}`;
}

export default function DropsView() {
  const [platform, setPlatform] = useState("tiktok");
  const [metric, setMetric] = useState<DropMetric>("followers");
  const [sortBy, setSortBy] = useState<"pct" | "abs">("pct");
  const [since, setSince] = useState(daysAgo(7));
  const [until, setUntil] = useState(new Date().toISOString().slice(0, 10));
  const [threshold, setThreshold] = useState(20);
  const [data, setData] = useState<DropAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  // Remembered DripFeedPanel service ID for one-click refills.
  const [serviceId, setServiceId] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("dfp_refill_service_id") || "" : "",
  );
  const [bulkBusy, setBulkBusy] = useState<string | null>(null);
  const [force, setForce] = useState(false);
  // Rate (USD per 1000) of the entered DripFeedPanel service, for cost preview.
  const [svc, setSvc] = useState<{ rate: number; name: string } | null>(null);

  // Look up the service rate when the operator enters/changes the service ID.
  useEffect(() => {
    const sid = Number(serviceId);
    if (!Number.isFinite(sid) || sid <= 0) { setSvc(null); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/smm/services?provider=dripfeedpanel&id=${sid}`, { headers: authHeaders() });
        const json = await res.json();
        if (cancelled) return;
        setSvc(json?.service ? { rate: Number(json.service.rate), name: String(json.service.name || "") } : null);
      } catch {
        if (!cancelled) setSvc(null);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [serviceId]);

  const setRow = (id: string, s: RowState) => setRowState((p) => ({ ...p, [id]: s }));

  // Optimistically patch a flagged row in place so the "emailé/refillé/complété"
  // badges update without a full re-analyse.
  const patchRow = (id: number, patch: Partial<DropRow>) =>
    setData((d) => (d ? { ...d, flagged: d.flagged.map((r) => (r.orderId === id ? { ...r, ...patch } : r)) } : d));

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ platform, metric, since, until, threshold: String(threshold), provider: "dripfeedpanel" });
      if (force) qs.set("fresh", "1");
      const res = await fetch(`/api/admin/drops?${qs}`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erreur " + res.status);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [platform, metric, since, until, threshold, force]);

  // Each action returns true on success so the bulk runners can tally results.
  // `silent` skips the per-row confirm (the bulk runner confirms once up front).

  const refill = async (row: DropRow, silent = false): Promise<boolean> => {
    const sid = Number(serviceId);
    if (!Number.isFinite(sid) || sid <= 0) {
      setRow(rowKey(row), { msg: "Renseigne l'ID service DripFeedPanel en haut", tone: "err" });
      return false;
    }
    if (!silent) {
      const warn = row.lastRefillAt ? `\n⚠️ Déjà refillé le ${fmtDate(row.lastRefillAt)}.` : "";
      if (!confirm(`Relancer #${row.orderId} (@${row.username}) — ${row.ordered} followers via DripFeedPanel #${sid} ?${warn}`)) return false;
    }
    localStorage.setItem("dfp_refill_service_id", String(sid));
    setRow(rowKey(row), { busy: "refill" });
    try {
      const res = await fetch("/api/admin/orders/refill-smm", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ orderId: row.orderId, serviceId: sid, provider: "dripfeedpanel" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erreur " + res.status);
      patchRow(row.orderId, { lastRefillAt: new Date().toISOString() });
      setRow(rowKey(row), {
        msg: `Relancé : ${json.summary.placed} ok / ${json.summary.failed} échec`,
        tone: json.summary.failed ? "err" : "ok",
      });
      return !json.summary.failed;
    } catch (e) {
      setRow(rowKey(row), { msg: e instanceof Error ? e.message : "Échec refill", tone: "err" });
      return false;
    }
  };

  const topUp = async (row: DropRow, silent = false): Promise<boolean> => {
    if (!row.topUp) {
      setRow(rowKey(row), { msg: "Rien à compléter (aucun sous-ordre)", tone: "err" });
      return false;
    }
    const sid = Number(serviceId);
    if (!silent) {
      const warn = row.lastTopupAt ? `\n⚠️ Déjà complété le ${fmtDate(row.lastTopupAt)}.` : "";
      const via = sid > 0 ? `DripFeedPanel #${sid}` : "le service d'origine";
      if (!confirm(`Compléter #${row.orderId} (@${row.username}) — livrer les ${row.topUp.quantity} followers manquants via ${via} ?${warn}`)) return false;
    }
    if (sid > 0) localStorage.setItem("dfp_refill_service_id", String(sid));
    setRow(rowKey(row), { busy: "topup" });
    try {
      const res = await fetch("/api/admin/orders/top-up-smm", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          orderId: row.orderId,
          cartIndex: row.topUp.cartIndex,
          quantity: row.topUp.quantity,
          provider: "dripfeedpanel",
          ...(sid > 0 ? { serviceId: sid } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erreur " + res.status);
      patchRow(row.orderId, { lastTopupAt: new Date().toISOString() });
      setRow(rowKey(row), { msg: `Complété : +${row.topUp.quantity} lancés`, tone: "ok" });
      return true;
    } catch (e) {
      setRow(rowKey(row), { msg: e instanceof Error ? e.message : "Échec complétion", tone: "err" });
      return false;
    }
  };

  const sendEmail = async (row: DropRow, silent = false): Promise<boolean> => {
    if (!row.email) {
      setRow(rowKey(row), { msg: "Pas d'email sur cette commande", tone: "err" });
      return false;
    }
    if (!silent) {
      const warn = row.refillNoticeSentAt ? `\n⚠️ Déjà emailé le ${fmtDate(row.refillNoticeSentAt)}.` : "";
      if (!confirm(`Envoyer l'email de relance (langue: ${row.lang || "fr"}) à ${row.email} ?${warn}`)) return false;
    }
    setRow(rowKey(row), { busy: "email" });
    try {
      const res = await fetch("/api/admin/orders/refill-notice", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ orderId: row.orderId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail || json?.error || "Erreur " + res.status);
      patchRow(row.orderId, { refillNoticeSentAt: new Date().toISOString() });
      setRow(rowKey(row), { msg: "Email envoyé ✓", tone: "ok" });
      return true;
    } catch (e) {
      setRow(rowKey(row), { msg: e instanceof Error ? e.message : "Échec email", tone: "err" });
      return false;
    }
  };

  // ── Bulk runners ──────────────────────────────────────────────────────────
  // Run sequentially (gentle on the provider/RapidAPI) and skip rows already
  // actioned, so re-running after a partial pass never double-charges/-emails.

  const runBulk = async (
    label: string,
    rows: DropRow[],
    fn: (r: DropRow) => Promise<boolean>,
    confirmMsg: string,
  ) => {
    if (rows.length === 0) return;
    if (!confirm(confirmMsg)) return;
    setBulkBusy(label);
    let ok = 0;
    for (const r of rows) {
      if (await fn(r)) ok++;
    }
    setBulkBusy(null);
    alert(`${label} : ${ok}/${rows.length} réussis.`);
  };

  const emailAll = () => {
    const rows = (data?.flagged ?? []).filter((r) => r.email && !r.refillNoticeSentAt);
    void runBulk("Email tout", rows, (r) => sendEmail(r, true),
      `Envoyer l'email de relance à ${rows.length} client(s) non encore emailé(s) ?`);
  };
  const refillAll = () => {
    const sid = Number(serviceId);
    if (!Number.isFinite(sid) || sid <= 0) { alert("Renseigne l'ID service DripFeedPanel en haut."); return; }
    const rows = (data?.flagged ?? []).filter((r) => (r.kind === "drop" || r.kind === "both") && !r.lastRefillAt);
    void runBulk("Refill tout", rows, (r) => refill(r, true),
      `Relancer ${rows.length} commande(s) DROP non encore refillée(s) via DripFeedPanel #${sid} ? (re-facturé)`);
  };
  const topUpAll = () => {
    const rows = (data?.flagged ?? []).filter((r) => r.topUp && !r.lastTopupAt);
    void runBulk("Compléter tout", rows, (r) => topUp(r, true),
      `Compléter ${rows.length} commande(s) (livrer le manquant/perdu) ? (re-facturé)`);
  };

  const refresh = async (row: DropRow) => {
    setRow(rowKey(row), { busy: "refresh" });
    try {
      const res = await fetch("/api/admin/orders/refresh-smm", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ orderId: row.orderId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erreur " + res.status);
      const s = json.summary;
      setRow(rowKey(row), { msg: `Suivi : ${s.completed} fini / ${s.inProgress} en cours / ${s.failed} ko`, tone: "ok" });
    } catch (e) {
      setRow(rowKey(row), { msg: e instanceof Error ? e.message : "Échec refresh", tone: "err" });
    }
  };

  const bal = data?.balance;

  // ── Cost preview (#5) ──
  const isFollowers = (data?.metric ?? "followers") === "followers";
  const rate = svc?.rate ?? null; // USD per 1000
  const costOf = (qty: number) => (rate != null ? (qty / 1000) * rate : null);
  // Sorted view (#3): by loss % or by absolute followers/likes/views lost.
  const flagged = [...(data?.flagged ?? [])].sort((a, b) =>
    sortBy === "abs"
      ? (b.lost > 0 ? b.lost : 0) - (a.lost > 0 ? a.lost : 0) || b.undelivered - a.undelivered
      : Math.max(b.pctDrop, b.pctUndelivered) - Math.max(a.pctDrop, a.pctUndelivered),
  );
  // What a "refill all / complete all" would actually spend (skips already-done).
  // Refill is followers-only (media uses per-video top-up to avoid over-buying).
  const refillQty = isFollowers
    ? flagged.filter((r) => (r.kind === "drop" || r.kind === "both") && !r.lastRefillAt).reduce((s, r) => s + r.ordered, 0)
    : 0;
  const topUpQty = flagged
    .filter((r) => r.topUp && !r.lastTopupAt)
    .reduce((s, r) => s + (r.topUp?.quantity ?? 0), 0);
  const refillCost = costOf(refillQty);
  const topUpCost = costOf(topUpQty);
  const totalCost = rate != null ? (refillCost ?? 0) + (topUpCost ?? 0) : null;
  const balNum = bal?.balance ?? null;
  const overBudget = totalCost != null && balNum != null && totalCost > balNum;

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12, marginBottom: 18 }}>
        <Field label="Plateforme">
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={inputStyle}>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
          </select>
        </Field>
        <Field label="Métrique">
          <select value={metric} onChange={(e) => setMetric(e.target.value as DropMetric)} style={inputStyle}>
            <option value="followers">Followers</option>
            <option value="likes">Likes</option>
            <option value="views">Vues</option>
          </select>
        </Field>
        <Field label="Trier par">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "pct" | "abs")} style={inputStyle}>
            <option value="pct">Perte %</option>
            <option value="abs">Perdus (absolu)</option>
          </select>
        </Field>
        <Field label="Depuis">
          <input type="date" value={since} onChange={(e) => setSince(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Jusqu'à">
          <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Seuil de perte %">
          <input
            type="number"
            min={1}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            style={{ ...inputStyle, width: 80 }}
          />
        </Field>
        <button className="btn" onClick={analyze} disabled={loading} style={{ height: 36, opacity: loading ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
          {Ic.refresh()} {loading ? "Analyse…" : "Analyser"}
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--a-ink-3)", height: 36, cursor: "pointer" }} title="Ignore le cache des comptes (12 min) et recompte tout via l'API">
          <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
          Forcer (ignorer cache)
        </label>
        <Field label="ID service DripFeedPanel (refill)">
          <input
            type="text"
            inputMode="numeric"
            placeholder="ex. 16635"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value.replace(/[^0-9]/g, ""))}
            style={{ ...inputStyle, width: 120 }}
          />
        </Field>
      </div>

      {/* DripFeedPanel balance */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 18, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(224,74,140,0.15)", color: "var(--a-accent)", display: "grid", placeItems: "center" }}>
          {Ic.wallet()}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--a-ink-3)" }}>SOLDE DRIPFEEDPANEL</div>
          {bal == null ? (
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--a-ink-3)" }}>— <span style={{ fontSize: 12 }}>(lance une analyse)</span></div>
          ) : bal.error ? (
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--a-accent)" }}>⚠️ {bal.error}</div>
          ) : (
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--a-ink)", fontVariantNumeric: "tabular-nums" }}>
              {bal.balance?.toFixed(2)} <span style={{ fontSize: 14, color: "var(--a-ink-3)" }}>$</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ ...cardStyle, padding: 16, marginBottom: 18, color: "var(--a-accent)", border: "1px solid rgba(224,74,140,0.4)" }}>{error}</div>
      )}

      {data && (
        <>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--a-ink)", margin: "0 0 12px" }}>
            ⚠️ {data.summary.flaggedCount} {isFollowers ? "compte" : "vidéo"}{data.summary.flaggedCount > 1 ? "s" : ""} en problème ({">"} {data.summary.threshold}%)
            <span style={{ fontWeight: 600, color: "var(--a-ink-3)" }}>
              {" "}· <span style={{ color: "var(--a-accent)" }}>{data.summary.dropCount} drop</span> ({data.summary.followersLost.toLocaleString("fr-FR")} évaporés)
              {" "}· <span style={{ color: "#eab308" }}>{data.summary.undeliveredCount} non livré</span> ({data.summary.followersUndelivered.toLocaleString("fr-FR")} manquants)
              {" "}· {data.summary.accountsScanned} scannés
            </span>
          </div>

          {flagged.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--a-ink-3)" }}>Actions groupées :</span>
              <button className="btn" disabled={!!bulkBusy} onClick={emailAll} style={{ fontSize: 12 }}>
                {bulkBusy === "Email tout" ? "Envoi…" : "✉️ Email tout (non emailés)"}
              </button>
              {isFollowers && (
                <button className="btn" disabled={!!bulkBusy} onClick={refillAll} style={{ fontSize: 12 }}>
                  {bulkBusy === "Refill tout" ? "Refill…" : "🔁 Refill tout (drops)"}
                </button>
              )}
              <button className="btn" disabled={!!bulkBusy} onClick={topUpAll} style={{ fontSize: 12 }}>
                {bulkBusy === "Compléter tout" ? "Complétion…" : "➕ Compléter tout (manquant/perdu)"}
              </button>
            </div>
          )}

          {/* Cost preview vs balance */}
          {flagged.length > 0 && (
            <div style={{
              ...cardStyle, padding: "10px 14px", marginBottom: 16, fontSize: 13,
              border: overBudget ? "1px solid rgba(224,74,140,0.5)" : "1px solid var(--a-line)",
              display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center",
            }}>
              {rate == null ? (
                <span style={{ color: "var(--a-ink-3)" }}>💡 Renseigne l&apos;ID service DripFeedPanel pour estimer le coût du refill.</span>
              ) : (
                <>
                  <span style={{ color: "var(--a-ink-3)" }}>Coût estimé ({svc?.name ? svc.name.slice(0, 28) : `#${serviceId}`} · {usd(rate)}/1k) :</span>
                  <span style={{ color: "var(--a-ink)" }}>Refill tout <b>{refillCost != null ? usd(refillCost) : "—"}</b> <span style={{ color: "var(--a-ink-3)" }}>({refillQty.toLocaleString("fr-FR")})</span></span>
                  <span style={{ color: "var(--a-ink)" }}>Compléter tout <b>{topUpCost != null ? usd(topUpCost) : "—"}</b> <span style={{ color: "var(--a-ink-3)" }}>({topUpQty.toLocaleString("fr-FR")})</span></span>
                  <span style={{ fontWeight: 800, color: overBudget ? "var(--a-accent)" : "var(--a-ink)" }}>
                    Total {totalCost != null ? usd(totalCost) : "—"} / solde {balNum != null ? usd(balNum) : "—"}
                  </span>
                  {overBudget && <span style={{ color: "var(--a-accent)", fontWeight: 700 }}>⚠️ Solde insuffisant — recharge avant de lancer</span>}
                </>
              )}
            </div>
          )}

          <div style={{ ...cardStyle, overflow: "auto", marginBottom: 18 }}>
            <table className="table" style={{ width: "100%", minWidth: 980 }}>
              <thead>
                <tr>
                  {["Compte", "Cmd", "Type", "Base", "Commandé", "Livré", "Attendu", "Actuel", "Perdu", "Perte", "Suivi SMM", "Actions"].map((h) => (
                    <th key={h} style={{ color: "var(--a-ink-3)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flagged.map((r) => {
                  const st = rowState[rowKey(r)] || {};
                  const badge = r.kind !== "ok" ? KIND_BADGE[r.kind] : null;
                  return (
                    <tr key={rowKey(r)}>
                      <td style={{ fontWeight: 700, color: "var(--a-ink)" }}>
                        @{r.username}
                        {r.videoUrl && (
                          <> · <a href={r.videoUrl} target="_blank" rel="noreferrer" style={{ color: "var(--a-accent)", fontWeight: 600, fontSize: 12 }}>vidéo ↗</a></>
                        )}
                        {r.refundedCents > 0 && (
                          <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: "rgba(234,179,8,0.15)", color: "#eab308" }}>
                            remb. {usd(r.refundedCents / 100)}
                          </span>
                        )}
                        <div style={{ fontSize: 11, color: "var(--a-ink-3)", fontWeight: 400 }}>{r.email || "—"} · {r.lang || "fr"} · {r.date}</div>
                      </td>
                      <td className="mono" style={{ color: "var(--a-ink-3)" }}>#{r.orderId}</td>
                      <td>
                        {badge && (
                          <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 6, fontSize: 10, fontWeight: 800, background: badge.bg, color: badge.fg, whiteSpace: "nowrap" }}>
                            {badge.label}
                          </span>
                        )}
                      </td>
                      <td style={num}>
                        {r.baseline.toLocaleString("fr-FR")}
                        <div style={{ fontSize: 10, color: "var(--a-ink-3)", fontWeight: 400 }}>{r.baselineSource === "live" ? "live" : "snapshot"}</div>
                      </td>
                      <td style={num}>{r.ordered.toLocaleString("fr-FR")}</td>
                      <td style={num}>
                        {r.delivered.toLocaleString("fr-FR")}{r.deliveredApprox ? "≈" : ""}
                        {r.undelivered > 0 && (
                          <div style={{ fontSize: 10, color: "#eab308", fontWeight: 600 }}>−{r.undelivered.toLocaleString("fr-FR")} manquant</div>
                        )}
                      </td>
                      <td style={num}>{r.expected.toLocaleString("fr-FR")}</td>
                      <td style={num}>
                        {r.current?.toLocaleString("fr-FR")}
                        {r.currentSource && (
                          <div style={{ fontSize: 10, color: "var(--a-ink-3)", fontWeight: 400 }}>
                            {r.currentSource === "cache" ? `cache ${ageMin(r.currentCheckedAt) ?? "?"}min` : "live"}
                          </div>
                        )}
                      </td>
                      <td style={{ ...num, fontWeight: 700, color: r.lost > 0 ? "var(--a-accent)" : "var(--a-ink-3)" }}>{r.lost > 0 ? r.lost.toLocaleString("fr-FR") : "—"}</td>
                      <td style={{ ...num, fontWeight: 800, color: "var(--a-accent)" }}>
                        {r.pctDrop > 0 ? `-${r.pctDrop.toFixed(1)}%` : "—"}
                        {r.delivered > 0 && r.lost > 0 && (
                          <div style={{ fontSize: 10, color: "var(--a-ink-3)", fontWeight: 400 }}>-{r.pctOfDelivered.toFixed(0)}% du livré</div>
                        )}
                      </td>
                      <td style={{ fontSize: 11, color: "var(--a-ink-3)", whiteSpace: "nowrap" }}>
                        {r.smm.completed ? `${r.smm.completed}✓ ` : ""}
                        {r.smm.placed ? `${r.smm.placed}⏳ ` : ""}
                        {r.smm.partial ? `${r.smm.partial}½ ` : ""}
                        {r.smm.failed ? `${r.smm.failed}✗ ` : ""}
                        {r.smm.canceled ? `${r.smm.canceled}⊘` : ""}
                        {!r.smm.completed && !r.smm.placed && !r.smm.partial && !r.smm.failed && !r.smm.canceled ? "—" : ""}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {isFollowers && (r.kind === "drop" || r.kind === "both") && (
                            <button className="btn" disabled={!!st.busy} onClick={() => refill(r)} style={{ ...miniBtn, opacity: r.lastRefillAt ? 0.6 : 1 }} title={costOf(r.ordered) != null ? `≈ ${usd(costOf(r.ordered)!)}` : undefined}>
                              {st.busy === "refill" ? "…" : (costOf(r.ordered) != null ? `Refill (${usd(costOf(r.ordered)!)})` : "Refill")}
                            </button>
                          )}
                          {r.topUp && (
                            <button className="btn" disabled={!!st.busy} onClick={() => topUp(r)} style={{ ...miniBtn, opacity: r.lastTopupAt ? 0.6 : 1 }} title={costOf(r.topUp.quantity) != null ? `≈ ${usd(costOf(r.topUp.quantity)!)}` : undefined}>
                              {st.busy === "topup" ? "…" : (costOf(r.topUp.quantity) != null ? `Compléter (${usd(costOf(r.topUp.quantity)!)})` : "Compléter")}
                            </button>
                          )}
                          <button className="btn" disabled={!!st.busy} onClick={() => sendEmail(r)} style={{ ...miniBtn, opacity: r.refillNoticeSentAt ? 0.6 : 1 }}>
                            {st.busy === "email" ? "…" : "Email"}
                          </button>
                          <button className="btn" disabled={!!st.busy} onClick={() => refresh(r)} style={miniBtn}>
                            {st.busy === "refresh" ? "…" : "Suivi"}
                          </button>
                        </div>
                        {(r.refillNoticeSentAt || r.lastRefillAt || r.lastTopupAt) && (
                          <div style={{ fontSize: 10, marginTop: 4, color: "var(--a-ink-3)", display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {r.lastRefillAt && <span>🔁 {fmtDate(r.lastRefillAt)}</span>}
                            {r.lastTopupAt && <span>➕ {fmtDate(r.lastTopupAt)}</span>}
                            {r.refillNoticeSentAt && <span>✉️ {fmtDate(r.refillNoticeSentAt)}</span>}
                          </div>
                        )}
                        {st.msg && (
                          <div style={{ fontSize: 11, marginTop: 4, color: st.tone === "err" ? "var(--a-accent)" : "#22c55e" }}>{st.msg}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {flagged.length === 0 && (
                  <tr><td colSpan={12} style={{ textAlign: "center", color: "var(--a-ink-3)", padding: 30 }}>Aucun compte au-dessus du seuil 🎉</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {data.errors.length > 0 && (
            <details style={{ ...cardStyle, padding: 14, marginBottom: 14 }}>
              <summary style={{ cursor: "pointer", color: "var(--a-ink)", fontWeight: 700 }}>❓ {data.errors.length} non vérifiables (API)</summary>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--a-ink-3)" }}>
                {data.errors.map((e) => (
                  <div key={e.orderId}>@{e.username} #{e.orderId} — {e.error} (attendu {e.expected.toLocaleString("fr-FR")})</div>
                ))}
              </div>
            </details>
          )}

          <details style={{ ...cardStyle, padding: 14 }}>
            <summary style={{ cursor: "pointer", color: "var(--a-ink)", fontWeight: 700 }}>✅ {data.ok.length} comptes OK (perte ≤ {data.summary.threshold}%)</summary>
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--a-ink-3)" }}>
              {data.ok.map((r) => (
                <div key={r.orderId}>@{r.username} — attendu {r.expected.toLocaleString("fr-FR")} / actuel {r.current?.toLocaleString("fr-FR")} ({r.pctDrop > 0 ? "-" : "+"}{Math.abs(r.pctDrop).toFixed(1)}%)</div>
              ))}
            </div>
          </details>
        </>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: "var(--a-card)", border: "1px solid var(--a-line)", borderRadius: 12 };
const inputStyle: React.CSSProperties = { padding: "7px 10px", borderRadius: 8, border: "1px solid var(--a-line)", background: "var(--a-card)", color: "var(--a-ink)", fontSize: 13, height: 36 };
const miniBtn: React.CSSProperties = { padding: "4px 10px", fontSize: 11 };
const num: React.CSSProperties = { textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--a-ink)" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: "var(--a-ink-3)" }}>{label}</label>
      {children}
    </div>
  );
}
