/**
 * Follower-drop analysis.
 *
 * For every order on a platform that bought "followers" within a date range,
 * compare what the customer SHOULD have (snapshot taken at checkout +
 * the quantity we delivered) against their CURRENT live follower count.
 * Flags accounts that dropped more than `threshold` percent — the typical
 * signature of an upstream provider whose delivery got reversed/purged.
 *
 * Live counts come from the same RapidAPI host the public site uses, so the
 * numbers line up with what the customer sees on their profile.
 */
import { sql } from "./db";

export interface DropRow {
  orderId: number;
  username: string;
  email: string | null;
  lang: string | null;
  status: string;
  date: string; // YYYY-MM-DD
  before: number;
  ordered: number;
  expected: number;
  current: number | null;
  lost: number;
  pctVsExpected: number; // % of the expected total that vanished
  pctVsOrdered: number; // % of what we delivered that vanished
  /** Roll-up of the order's SMM sub-orders so the UI can show refill progress. */
  smm: { completed: number; placed: number; partial: number; failed: number; canceled: number };
  error?: string; // set when the live count couldn't be fetched
}

export interface DropAnalysis {
  flagged: DropRow[];
  ok: DropRow[];
  errors: DropRow[];
  summary: { accountsScanned: number; flaggedCount: number; followersLost: number; threshold: number };
}

const FOLLOWER_SERVICE: Record<string, string> = {
  tiktok: "tt_followers",
  instagram: "ig_followers",
};

const RAPID_HOSTS: Record<string, string> = {
  tiktok: "tiktok-api23.p.rapidapi.com",
};

/** Live follower count for one handle, or an error code. */
async function liveFollowers(
  platform: string,
  username: string,
): Promise<{ followers: number } | { error: string }> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return { error: "no_rapidapi_key" };
  const u = username.trim().toLowerCase().replace(/^@/, "");

  if (platform === "tiktok") {
    const host = RAPID_HOSTS.tiktok;
    try {
      const res = await fetch(
        `https://${host}/api/user/info?uniqueId=${encodeURIComponent(u)}`,
        {
          headers: { "x-rapidapi-host": host, "x-rapidapi-key": key },
          signal: AbortSignal.timeout(10000),
        },
      );
      if (res.status === 404) return { error: "not_found" };
      if (res.status === 429) return { error: "rate_limited" };
      if (!res.ok) return { error: `http_${res.status}` };
      const j = await res.json();
      const user = j.userInfo?.user ?? j.user;
      const stats = j.userInfo?.stats ?? j.stats;
      if (!user) return { error: "not_found" };
      if (user.privateAccount) return { error: "private" };
      return { followers: Number(stats?.followerCount ?? 0) };
    } catch (e) {
      return { error: e instanceof Error && e.name === "TimeoutError" ? "timeout" : "fetch_error" };
    }
  }
  return { error: "platform_unsupported" };
}

/** Sum the followers quantity (qty + bonus) across a cart's follower lines. */
function orderedFollowers(cart: unknown, service: string): number {
  const arr = Array.isArray(cart) ? cart : [];
  return arr
    .filter((i: { service?: string }) => i?.service === service)
    .reduce(
      (s: number, i: { qty?: number; quantity?: number; bonus?: number }) =>
        s + Number(i.qty || i.quantity || 0) + Number(i.bonus || 0),
      0,
    );
}

function rollupSmm(smmOrders: unknown) {
  const r = { completed: 0, placed: 0, partial: 0, failed: 0, canceled: 0 };
  const arr = Array.isArray(smmOrders) ? smmOrders : [];
  for (const s of arr as Array<{ status?: string }>) {
    if (s.status && s.status in r) (r as Record<string, number>)[s.status]++;
  }
  return r;
}

/** Run pooled async work with a concurrency cap. */
async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function analyzeFollowerDrops(opts: {
  platform: string;
  since: string; // YYYY-MM-DD
  until?: string; // YYYY-MM-DD (inclusive end-of-day); defaults to now
  threshold?: number; // percent, default 20
}): Promise<DropAnalysis> {
  const platform = opts.platform;
  const service = FOLLOWER_SERVICE[platform];
  if (!service) throw new Error(`Unsupported platform for drop analysis: ${platform}`);
  const threshold = opts.threshold ?? 20;
  // Inclusive end: bump to the next day at midnight. Default far-future when no
  // `until` given. (neon parametrizes interpolations, so we keep a single
  // template instead of composing sql fragments.)
  const until = opts.until || "2999-01-01";

  // Latest follower order per username in the window. followers_before on the
  // most-recent order already reflects any earlier delivery, so taking only the
  // latest avoids double-counting customers who ordered twice.
  const rows = await sql`
    SELECT DISTINCT ON (LOWER(username))
           id, LOWER(username) AS username, followers_before, status, created_at,
           cart, smm_orders, email, lang
    FROM orders
    WHERE platform = ${platform}
      AND created_at >= ${opts.since}::date
      AND created_at < (${until}::date + INTERVAL '1 day')
      AND status IN ('paid','processing','delivered','partial')
      AND cart::text LIKE ${'%' + service + '%'}
    ORDER BY LOWER(username), created_at DESC
  `;

  const scannable = rows
    .map((r) => ({ row: r, ordered: orderedFollowers(r.cart, service) }))
    .filter((x) => x.ordered > 0 && x.row.username);

  const results = await mapPool(scannable, 5, async ({ row, ordered }): Promise<DropRow> => {
    const before = Number(row.followers_before || 0);
    const expected = before + ordered;
    const live = await liveFollowers(platform, row.username);
    const base: Omit<DropRow, "current" | "lost" | "pctVsExpected" | "pctVsOrdered" | "error"> = {
      orderId: row.id,
      username: row.username,
      email: row.email ?? null,
      lang: row.lang ?? null,
      status: row.status,
      date: new Date(row.created_at).toISOString().slice(0, 10),
      before,
      ordered,
      expected,
      smm: rollupSmm(row.smm_orders),
    };
    if ("error" in live) {
      return { ...base, current: null, lost: 0, pctVsExpected: 0, pctVsOrdered: 0, error: live.error };
    }
    const current = live.followers;
    const lost = expected - current;
    return {
      ...base,
      current,
      lost,
      pctVsExpected: expected > 0 ? (lost / expected) * 100 : 0,
      pctVsOrdered: ordered > 0 ? (lost / ordered) * 100 : 0,
    };
  });

  const flagged: DropRow[] = [];
  const ok: DropRow[] = [];
  const errors: DropRow[] = [];
  for (const r of results) {
    if (r.error) errors.push(r);
    else if (r.pctVsExpected > threshold) flagged.push(r);
    else ok.push(r);
  }
  flagged.sort((a, b) => b.pctVsExpected - a.pctVsExpected);
  ok.sort((a, b) => b.pctVsExpected - a.pctVsExpected);

  return {
    flagged,
    ok,
    errors,
    summary: {
      accountsScanned: results.length,
      flaggedCount: flagged.length,
      followersLost: flagged.reduce((s, f) => s + f.lost, 0),
      threshold,
    },
  };
}
