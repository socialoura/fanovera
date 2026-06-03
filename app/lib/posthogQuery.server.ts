// Minimal server-side PostHog query client (read-only) used by admin result
// panels. Requires a PostHog **personal** API key with query scope:
//   POSTHOG_PERSONAL_API_KEY=phx_...
//   POSTHOG_PROJECT_ID=172344            (defaults to the Fanovera project)
//   POSTHOG_QUERY_HOST=https://eu.posthog.com  (EU instance app host, not the
//                                               eu.i.posthog.com ingest host)

const HOST = (process.env.POSTHOG_QUERY_HOST || "https://eu.posthog.com").replace(/\/$/, "");
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "172344";

export function posthogQueryConfigured(): boolean {
  return Boolean(process.env.POSTHOG_PERSONAL_API_KEY);
}

export async function runHogQL(
  query: string,
): Promise<{ columns: string[]; results: Array<Array<string | number | null>> }> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!key) throw new Error("POSTHOG_PERSONAL_API_KEY not set");

  const res = await fetch(`${HOST}/api/projects/${PROJECT_ID}/query/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    // Admin panel data — never cache.
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PostHog query ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { columns?: string[]; results?: Array<Array<string | number | null>> };
  return { columns: data.columns || [], results: data.results || [] };
}
