"use client";

import { useCallback, useState } from "react";
import { Ic } from "../icons";

interface SmmRollup {
  completed: number;
  placed: number;
  partial: number;
  failed: number;
  canceled: number;
}
interface DropRow {
  orderId: number;
  username: string;
  email: string | null;
  lang: string | null;
  status: string;
  date: string;
  before: number;
  ordered: number;
  expected: number;
  current: number | null;
  lost: number;
  pctVsExpected: number;
  pctVsOrdered: number;
  smm: SmmRollup;
  error?: string;
}
interface DropAnalysis {
  flagged: DropRow[];
  ok: DropRow[];
  errors: DropRow[];
  summary: { accountsScanned: number; flaggedCount: number; followersLost: number; threshold: number };
  provider: string;
  balance: { balance: number | null; error: string | null };
}

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
type RowState = { busy?: "refill" | "email" | "refresh"; msg?: string; tone?: "ok" | "err" };

export default function DropsView() {
  const [platform, setPlatform] = useState("tiktok");
  const [since, setSince] = useState(daysAgo(7));
  const [until, setUntil] = useState(new Date().toISOString().slice(0, 10));
  const [threshold, setThreshold] = useState(20);
  const [data, setData] = useState<DropAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowState, setRowState] = useState<Record<number, RowState>>({});
  // Remembered DripFeedPanel service ID for one-click refills.
  const [serviceId, setServiceId] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("dfp_refill_service_id") || "" : "",
  );

  const setRow = (id: number, s: RowState) => setRowState((p) => ({ ...p, [id]: s }));

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ platform, since, until, threshold: String(threshold), provider: "dripfeedpanel" });
      const res = await fetch(`/api/admin/drops?${qs}`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erreur " + res.status);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [platform, since, until, threshold]);

  const refill = async (row: DropRow) => {
    const sid = Number(serviceId);
    if (!Number.isFinite(sid) || sid <= 0) {
      setRow(row.orderId, { msg: "Renseigne l'ID service DripFeedPanel en haut", tone: "err" });
      return;
    }
    if (!confirm(`Relancer la commande #${row.orderId} (@${row.username}) — ${row.ordered} followers via DripFeedPanel #${sid} ?`)) return;
    localStorage.setItem("dfp_refill_service_id", String(sid));
    setRow(row.orderId, { busy: "refill" });
    try {
      const res = await fetch("/api/admin/orders/refill-smm", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ orderId: row.orderId, serviceId: sid, provider: "dripfeedpanel" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erreur " + res.status);
      setRow(row.orderId, {
        msg: `Relancé : ${json.summary.placed} ok / ${json.summary.failed} échec`,
        tone: json.summary.failed ? "err" : "ok",
      });
    } catch (e) {
      setRow(row.orderId, { msg: e instanceof Error ? e.message : "Échec refill", tone: "err" });
    }
  };

  const sendEmail = async (row: DropRow) => {
    if (!row.email) {
      setRow(row.orderId, { msg: "Pas d'email sur cette commande", tone: "err" });
      return;
    }
    if (!confirm(`Envoyer l'email de relance (langue: ${row.lang || "fr"}) à ${row.email} ?`)) return;
    setRow(row.orderId, { busy: "email" });
    try {
      const res = await fetch("/api/admin/orders/refill-notice", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ orderId: row.orderId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail || json?.error || "Erreur " + res.status);
      setRow(row.orderId, { msg: "Email envoyé ✓", tone: "ok" });
    } catch (e) {
      setRow(row.orderId, { msg: e instanceof Error ? e.message : "Échec email", tone: "err" });
    }
  };

  const refresh = async (row: DropRow) => {
    setRow(row.orderId, { busy: "refresh" });
    try {
      const res = await fetch("/api/admin/orders/refresh-smm", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ orderId: row.orderId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erreur " + res.status);
      const s = json.summary;
      setRow(row.orderId, { msg: `Suivi : ${s.completed} fini / ${s.inProgress} en cours / ${s.failed} ko`, tone: "ok" });
    } catch (e) {
      setRow(row.orderId, { msg: e instanceof Error ? e.message : "Échec refresh", tone: "err" });
    }
  };

  const bal = data?.balance;

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
            ⚠️ {data.summary.flaggedCount} compte{data.summary.flaggedCount > 1 ? "s" : ""} {">"} {data.summary.threshold}% de perte
            <span style={{ fontWeight: 600, color: "var(--a-ink-3)" }}> · {data.summary.followersLost.toLocaleString("fr-FR")} followers évaporés · {data.summary.accountsScanned} comptes scannés</span>
          </div>

          <div style={{ ...cardStyle, overflow: "auto", marginBottom: 18 }}>
            <table className="table" style={{ width: "100%", minWidth: 980 }}>
              <thead>
                <tr>
                  {["Compte", "Cmd", "Avant", "Commandé", "Attendu", "Actuel", "Perdu", "Perte", "Suivi SMM", "Actions"].map((h) => (
                    <th key={h} style={{ color: "var(--a-ink-3)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.flagged.map((r) => {
                  const st = rowState[r.orderId] || {};
                  return (
                    <tr key={r.orderId}>
                      <td style={{ fontWeight: 700, color: "var(--a-ink)" }}>
                        @{r.username}
                        <div style={{ fontSize: 11, color: "var(--a-ink-3)", fontWeight: 400 }}>{r.email || "—"} · {r.lang || "fr"} · {r.date}</div>
                      </td>
                      <td className="mono" style={{ color: "var(--a-ink-3)" }}>#{r.orderId}</td>
                      <td style={num}>{r.before.toLocaleString("fr-FR")}</td>
                      <td style={num}>{r.ordered.toLocaleString("fr-FR")}</td>
                      <td style={num}>{r.expected.toLocaleString("fr-FR")}</td>
                      <td style={num}>{r.current?.toLocaleString("fr-FR")}</td>
                      <td style={{ ...num, fontWeight: 700, color: "var(--a-accent)" }}>{r.lost.toLocaleString("fr-FR")}</td>
                      <td style={{ ...num, fontWeight: 800, color: "var(--a-accent)" }}>
                        -{r.pctVsExpected.toFixed(1)}%
                        <div style={{ fontSize: 10, color: "var(--a-ink-3)", fontWeight: 400 }}>-{r.pctVsOrdered.toFixed(0)}% du livré</div>
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
                          <button className="btn" disabled={!!st.busy} onClick={() => refill(r)} style={miniBtn}>
                            {st.busy === "refill" ? "…" : "Refill"}
                          </button>
                          <button className="btn" disabled={!!st.busy} onClick={() => sendEmail(r)} style={miniBtn}>
                            {st.busy === "email" ? "…" : "Email"}
                          </button>
                          <button className="btn" disabled={!!st.busy} onClick={() => refresh(r)} style={miniBtn}>
                            {st.busy === "refresh" ? "…" : "Suivi"}
                          </button>
                        </div>
                        {st.msg && (
                          <div style={{ fontSize: 11, marginTop: 4, color: st.tone === "err" ? "var(--a-accent)" : "#22c55e" }}>{st.msg}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {data.flagged.length === 0 && (
                  <tr><td colSpan={10} style={{ textAlign: "center", color: "var(--a-ink-3)", padding: 30 }}>Aucun compte au-dessus du seuil 🎉</td></tr>
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
                <div key={r.orderId}>@{r.username} — attendu {r.expected.toLocaleString("fr-FR")} / actuel {r.current?.toLocaleString("fr-FR")} ({r.pctVsExpected > 0 ? "-" : "+"}{Math.abs(r.pctVsExpected).toFixed(1)}%)</div>
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
