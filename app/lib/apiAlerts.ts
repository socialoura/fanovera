/**
 * RapidAPI upstream failure alerting.
 *
 * Fires a Discord alert when a third-party provider returns a hard failure
 * that needs human attention: quota exhausted (429) or revoked/expired key
 * (401/403). Transient 5xx and timeouts are *not* alerted on by design — they
 * recover on their own and would flood the channel.
 *
 * Throttled per (platform, endpoint, kind) so a sustained outage produces one
 * ping every 5 minutes, not one ping per request. Fire-and-forget by design:
 * the caller passes the result of `fetch`, we never throw.
 */

const THROTTLE_MS = 5 * 60 * 1000;
const lastAlertByKey = new Map<string, number>();

type AlertKind = "rate_limit" | "auth";

const TITLES: Record<AlertKind, string> = {
  rate_limit: "🚨 Quota API atteint",
  auth: "🔒 Authentification API rejetée",
};

const COLORS: Record<AlertKind, number> = {
  rate_limit: 0xef4444,
  auth: 0xdc2626,
};

function classify(status: number): AlertKind | null {
  if (status === 429) return "rate_limit";
  if (status === 401 || status === 403) return "auth";
  return null;
}

function shouldFire(key: string): boolean {
  const last = lastAlertByKey.get(key) ?? 0;
  if (Date.now() - last < THROTTLE_MS) return false;
  lastAlertByKey.set(key, Date.now());
  return true;
}

export type ApiAlertOptions = {
  platform: string;
  endpoint: string;
  provider: string;
  status: number;
  detail?: string;
};

export async function notifyApiFailure(opts: ApiAlertOptions): Promise<void> {
  const kind = classify(opts.status);
  if (!kind) return;

  const key = `${opts.platform}:${opts.endpoint}:${kind}`;
  if (!shouldFire(key)) return;

  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "@here",
        embeds: [
          {
            title: TITLES[kind],
            color: COLORS[kind],
            fields: [
              { name: "Plateforme", value: opts.platform, inline: true },
              { name: "Statut HTTP", value: String(opts.status), inline: true },
              { name: "Endpoint", value: opts.endpoint, inline: false },
              { name: "Provider", value: opts.provider, inline: false },
              ...(opts.detail
                ? [{ name: "Détails", value: opts.detail.slice(0, 500), inline: false }]
                : []),
            ],
            footer: { text: "Throttle 5 min · alerte unique" },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (err) {
    console.error("[apiAlerts] Discord error:", err);
  }
}
