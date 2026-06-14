/**
 * Follower-drop analysis.
 *
 * For every order on a platform that bought "followers" within a date range,
 * compare what the customer SHOULD have against their CURRENT live follower
 * count, and split the gap into two very different problems:
 *
 *   • DROP        — we delivered the followers and they later vanished
 *                   (upstream provider reversed/purged) → action: refill.
 *   • NON LIVRÉ   — we never delivered the full quantity (failed/partial
 *                   sub-order) → action: compléter la livraison, pas refill.
 *
 * The key to telling them apart is the provider's per-sub-order `remains` and
 * `start_count`: `delivered = qty − remains`, and `start_count` is the live
 * follower count when the provider started — a far more reliable baseline than
 * the `followers_before` snapshot we took at checkout.
 *
 *   delivered = Σ (qty − remains)   over the follower sub-orders
 *   baseline  = earliest start_count (else followers_before fallback)
 *   expected  = baseline + delivered
 *   lost      = expected − current        → the DROP
 *   undelivered = ordered − delivered     → the NON-LIVRÉ shortfall
 */
import { sql, ensureDropOpsSchema, ensureLiveCacheSchema } from "./db";
import {
  getMultipleOrderStatus,
  type BfOrderStatus,
  type SmmProvider,
  type SmmSubOrder,
} from "./smm";

export type DropKind = "drop" | "undelivered" | "both" | "ok";

export interface DropRow {
  orderId: number;
  username: string;
  email: string | null;
  lang: string | null;
  status: string;
  date: string; // YYYY-MM-DD
  before: number; // followers_before snapshot (reference)
  baseline: number; // baseline actually used for `expected`
  baselineSource: "live" | "snapshot";
  ordered: number; // qty + bonus from the cart
  delivered: number; // qty − remains, from the provider
  deliveredApprox: boolean; // true when live status was unavailable and we guessed
  undelivered: number; // ordered − delivered (never received)
  expected: number; // baseline + delivered
  current: number | null;
  currentSource: "live" | "cache" | null; // where the current count came from
  currentCheckedAt: string | null; // ISO timestamp of the count
  lost: number; // expected − current (the drop); can be negative if it grew
  pctDrop: number; // lost / expected, % — what vanished after delivery
  pctOfDelivered: number; // lost / delivered, %
  pctUndelivered: number; // undelivered / ordered, %
  kind: DropKind;
  refundedCents: number; // partial refund on the order (full refunds are excluded upstream)
  videoUrl: string | null; // set for likes/views rows (per-video), null for followers
  smm: { completed: number; placed: number; partial: number; failed: number; canceled: number };
  // Anti-double-action stamps (ISO strings) — set by the refill/notice/top-up routes.
  refillNoticeSentAt: string | null;
  lastRefillAt: string | null;
  lastTopupAt: string | null;
  // Suggested top-up target for "Compléter" (NON LIVRÉ rows): which follower
  // sub-order to extend and by how much. Null when there's nothing to top up.
  topUp: { cartIndex: number; quantity: number } | null;
  error?: string;
}

export type DropMetric = "followers" | "likes" | "views";

export interface DropAnalysis {
  metric: DropMetric;
  flagged: DropRow[]; // any problem row (drop and/or undelivered), worst first
  ok: DropRow[];
  errors: DropRow[];
  summary: {
    accountsScanned: number;
    flaggedCount: number;
    dropCount: number;
    undeliveredCount: number;
    threshold: number;
    followersLost: number; // total dropped over flagged rows
    followersUndelivered: number; // total never delivered over flagged rows
  };
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

function asSubOrders(smmOrders: unknown): SmmSubOrder[] {
  return Array.isArray(smmOrders) ? (smmOrders as SmmSubOrder[]) : [];
}

/**
 * Fetch live provider status (remains + start_count) for every follower
 * sub-order across all orders, batched per provider. Returns a map keyed by
 * `bfOrderId`. Provider failures degrade gracefully (missing entries → caller
 * falls back to a status heuristic).
 */
const ALL_PROVIDERS: SmmProvider[] = ["bulkfollows", "dripfeedpanel"];

async function fetchDeliveryStatuses(
  rows: Array<{ smm_orders?: unknown }>,
  service: string,
): Promise<Map<number, BfOrderStatus>> {
  // Which providers to ask for each id. Sub-orders placed before provider
  // stamping store provider=null; the id exists on exactly one panel, so for
  // those we query BOTH and keep whichever returns a real status (the wrong
  // panel answers "Incorrect order ID" per-id, which we skip).
  const byProvider = new Map<SmmProvider, Set<number>>();
  for (const p of ALL_PROVIDERS) byProvider.set(p, new Set());
  for (const r of rows) {
    for (const sub of asSubOrders(r.smm_orders)) {
      if (sub.service !== service || sub.bfOrderId == null) continue;
      const targets = sub.provider ? [sub.provider as SmmProvider] : ALL_PROVIDERS;
      for (const p of targets) byProvider.get(p)!.add(sub.bfOrderId);
    }
  }

  const map = new Map<number, BfOrderStatus>();
  for (const [provider, idSet] of byProvider) {
    const ids = [...idSet];
    // Provider API caps multi-status at 100 ids per call.
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      try {
        const statuses = await getMultipleOrderStatus(chunk, provider);
        for (const [k, v] of Object.entries(statuses)) {
          const id = Number(k);
          // Skip per-id error objects ({ error: "Incorrect order ID" }) and
          // anything already resolved on the correct provider.
          if (Number.isNaN(id) || !v || (v as { error?: string }).error || !v.status) continue;
          if (!map.has(id)) map.set(id, v);
        }
      } catch {
        // whole chunk failed (e.g. single bad id throws top-level) → heuristic
      }
    }
  }
  return map;
}

/** Compute real delivered + provider baseline from a row's follower sub-orders. */
function computeDelivery(
  smmOrders: unknown,
  service: string,
  statusMap: Map<number, BfOrderStatus>,
): { delivered: number; approx: boolean; baselineStart: number | null } {
  const subs = asSubOrders(smmOrders)
    .filter((s) => s.service === service)
    .sort((a, b) => (a.placedAt || "").localeCompare(b.placedAt || ""));

  let delivered = 0;
  let approx = false;
  let baselineStart: number | null = null;

  for (const s of subs) {
    if (s.status === "failed" || s.status === "canceled") continue; // delivered 0
    const qty = Number(s.qty || 0);
    const st = s.bfOrderId != null ? statusMap.get(s.bfOrderId) : undefined;
    if (st) {
      const remains = Number(st.remains);
      delivered += Number.isFinite(remains) ? Math.max(0, qty - remains) : qty;
      const sc = Number(st.start_count);
      if (baselineStart == null && Number.isFinite(sc) && sc > 0) baselineStart = sc;
    } else {
      // No live status — best effort. "completed" is safe; "partial"/"placed"
      // without a remains figure is a guess, so flag it.
      delivered += qty;
      if (s.status !== "completed") approx = true;
    }
  }

  return { delivered, approx, baselineStart };
}

/**
 * Pick which follower sub-order a "Compléter" top-up should extend: the
 * original cart line (smallest cartIndex), which top-up-smm reuses for the
 * service ID + target link. Returns null when there's no follower sub at all
 * (the order never ran SMM → use Refill, not top-up).
 */
function topUpCartIndex(smmOrders: unknown, service: string): number | null {
  const subs = asSubOrders(smmOrders).filter((s) => s.service === service);
  if (subs.length === 0) return null;
  return subs.reduce((min, s) => (s.cartIndex < min ? s.cartIndex : min), subs[0].cartIndex);
}

function toIso(v: unknown): string | null {
  if (!v) return null;
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
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

/** Live-count cache TTL — re-runs within this window reuse the stored count. */
const LIVE_CACHE_TTL_MIN = 12;

export async function analyzeFollowerDrops(opts: {
  platform: string;
  since: string; // YYYY-MM-DD
  until?: string; // YYYY-MM-DD (inclusive end-of-day); defaults to now
  threshold?: number; // percent, default 20
  force?: boolean; // bypass the live-count cache
}): Promise<DropAnalysis> {
  const platform = opts.platform;
  const service = FOLLOWER_SERVICE[platform];
  if (!service) throw new Error(`Unsupported platform for drop analysis: ${platform}`);
  const threshold = opts.threshold ?? 20;
  // Inclusive end: bump to the next day at midnight. Default far-future when no
  // `until` given. (neon parametrizes interpolations, so we keep a single
  // template instead of composing sql fragments.)
  const until = opts.until || "2999-01-01";

  await ensureDropOpsSchema();
  await ensureLiveCacheSchema();

  // Latest follower order per username in the window. followers_before on the
  // most-recent order already reflects any earlier delivery, so taking only the
  // latest avoids double-counting customers who ordered twice.
  const rows = await sql`
    SELECT DISTINCT ON (LOWER(username))
           id, LOWER(username) AS username, followers_before, status, created_at,
           cart, smm_orders, email, lang,
           refill_notice_sent_at, last_refill_at, last_topup_at,
           COALESCE(refunded_amount_cents, 0) AS refunded_cents
    FROM orders
    WHERE platform = ${platform}
      AND created_at >= ${opts.since}::date
      AND created_at < (${until}::date + INTERVAL '1 day')
      AND status IN ('paid','processing','delivered','partial')
      AND cart::text LIKE ${'%' + service + '%'}
      -- Skip fully-refunded orders: no refill owed.
      AND COALESCE(refunded_amount_cents, 0) < GREATEST(COALESCE(total_cents, 0), 1)
    ORDER BY LOWER(username), created_at DESC
  `;

  const scannable = rows
    .map((r) => ({ row: r, ordered: orderedFollowers(r.cart, service) }))
    .filter((x) => x.ordered > 0 && x.row.username);

  // One batched provider call up front gives us remains + start_count for every
  // follower sub-order, so the per-account loop stays a pure computation.
  const statusMap = await fetchDeliveryStatuses(scannable.map((s) => s.row), service);

  // Live-count cache: load any non-stale counts so we skip RapidAPI for them.
  const usernames = scannable.map((s) => s.row.username as string);
  const cacheMap = new Map<string, { followers: number; checkedAt: string }>();
  if (!opts.force && usernames.length > 0) {
    const cached = await sql`
      SELECT username, followers, checked_at
      FROM live_follower_cache
      WHERE platform = ${platform}
        AND username = ANY(${usernames})
        AND checked_at > NOW() - (${LIVE_CACHE_TTL_MIN} * INTERVAL '1 minute')
    `;
    for (const c of cached) {
      cacheMap.set(String(c.username), { followers: Number(c.followers), checkedAt: new Date(c.checked_at).toISOString() });
    }
  }
  // Freshly-fetched counts to persist after the loop (single-threaded → safe push).
  const toUpsert: Array<{ username: string; followers: number }> = [];

  const results = await mapPool(scannable, 5, async ({ row, ordered }): Promise<DropRow> => {
    const before = Number(row.followers_before || 0);
    const { delivered, approx, baselineStart } = computeDelivery(row.smm_orders, service, statusMap);
    const baseline = baselineStart ?? before;
    const baselineSource: "live" | "snapshot" = baselineStart != null ? "live" : "snapshot";
    const expected = baseline + delivered;
    const undelivered = Math.max(0, ordered - delivered);
    const pctUndelivered = ordered > 0 ? (undelivered / ordered) * 100 : 0;
    const cartIndex = topUpCartIndex(row.smm_orders, service);

    const base = {
      orderId: row.id,
      username: row.username,
      email: row.email ?? null,
      lang: row.lang ?? null,
      status: row.status,
      date: new Date(row.created_at).toISOString().slice(0, 10),
      before,
      baseline,
      baselineSource,
      ordered,
      delivered,
      deliveredApprox: approx,
      undelivered,
      pctUndelivered,
      expected,
      smm: rollupSmm(row.smm_orders),
      refundedCents: Number(row.refunded_cents || 0),
      videoUrl: null,
      refillNoticeSentAt: toIso(row.refill_notice_sent_at),
      lastRefillAt: toIso(row.last_refill_at),
      lastTopupAt: toIso(row.last_topup_at),
      topUp: cartIndex != null && undelivered > 0 ? { cartIndex, quantity: undelivered } : null,
    };

    // Use the cached count when fresh; otherwise hit RapidAPI and queue a write.
    const hit = cacheMap.get(row.username);
    let current: number;
    let currentSource: "live" | "cache";
    let currentCheckedAt: string;
    if (hit) {
      current = hit.followers;
      currentSource = "cache";
      currentCheckedAt = hit.checkedAt;
    } else {
      const live = await liveFollowers(platform, row.username);
      if ("error" in live) {
        return {
          ...base,
          current: null,
          currentSource: null,
          currentCheckedAt: null,
          lost: 0,
          pctDrop: 0,
          pctOfDelivered: 0,
          kind: "ok",
          error: live.error,
        };
      }
      current = live.followers;
      currentSource = "live";
      currentCheckedAt = new Date().toISOString();
      toUpsert.push({ username: row.username, followers: current });
    }

    const lost = expected - current;
    const pctDrop = expected > 0 ? (lost / expected) * 100 : 0;
    const pctOfDelivered = delivered > 0 ? (lost / delivered) * 100 : 0;

    const isDrop = delivered > 0 && pctDrop > threshold;
    const isUndelivered = pctUndelivered > threshold;
    const kind: DropKind = isDrop && isUndelivered ? "both" : isDrop ? "drop" : isUndelivered ? "undelivered" : "ok";

    return { ...base, current, currentSource, currentCheckedAt, lost, pctDrop, pctOfDelivered, kind };
  });

  // Persist freshly-fetched counts (one statement, ON CONFLICT upsert).
  if (toUpsert.length > 0) {
    const names = toUpsert.map((u) => u.username);
    const counts = toUpsert.map((u) => u.followers);
    await sql`
      INSERT INTO live_follower_cache (platform, username, followers, checked_at)
      SELECT ${platform}, u.username, u.followers, NOW()
      FROM UNNEST(${names}::text[], ${counts}::int[]) AS u(username, followers)
      ON CONFLICT (platform, username)
      DO UPDATE SET followers = EXCLUDED.followers, checked_at = EXCLUDED.checked_at
    `;
  }

  const flagged: DropRow[] = [];
  const ok: DropRow[] = [];
  const errors: DropRow[] = [];
  for (const r of results) {
    if (r.error) errors.push(r);
    else if (r.kind === "ok") ok.push(r);
    else flagged.push(r);
  }
  // Worst first by the dominant problem (drop or shortfall).
  const severity = (r: DropRow) => Math.max(r.pctDrop, r.pctUndelivered);
  flagged.sort((a, b) => severity(b) - severity(a));
  ok.sort((a, b) => b.pctDrop - a.pctDrop);

  const dropCount = flagged.filter((r) => r.kind === "drop" || r.kind === "both").length;
  const undeliveredCount = flagged.filter((r) => r.kind === "undelivered" || r.kind === "both").length;

  return {
    metric: "followers",
    flagged,
    ok,
    errors,
    summary: {
      accountsScanned: results.length,
      flaggedCount: flagged.length,
      dropCount,
      undeliveredCount,
      threshold,
      followersLost: flagged.reduce((s, f) => s + (f.lost > 0 ? f.lost : 0), 0),
      followersUndelivered: flagged.reduce((s, f) => s + f.undelivered, 0),
    },
  };
}

// ─── Media drops (likes / views) — per-video instead of per-account ──────────
// Each likes/views order spreads its quantity across the videos the buyer
// selected, one SMM sub-order per video. The drop unit is therefore the
// sub-order: baseline = the provider's `start_count` (the video's like/view
// count when delivery started), delivered = qty − remains, current = the live
// diggCount/playCount. Refilling the whole order would over-buy, so media rows
// expose "Compléter" (a precise per-video top-up) rather than "Refill".

const MEDIA_SERVICE: Record<DropMetric, Record<string, string>> = {
  followers: {},
  likes: { tiktok: "tt_likes" },
  views: { tiktok: "tt_views" },
};

/** Extract a TikTok numeric video id from a post URL (or a bare id). */
function extractTtVideoId(input: string): string | null {
  const t = (input || "").trim();
  if (/^\d{6,25}$/.test(t)) return t;
  const m = t.match(/tiktok\.com\/(?:@[^/?#]+\/)?(?:video|v)\/(\d+)/i);
  return m ? m[1] : null;
}

/** Live like/view count for one TikTok video, or an error code. */
async function liveMedia(
  videoId: string,
  metric: DropMetric,
): Promise<{ count: number } | { error: string }> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return { error: "no_rapidapi_key" };
  const host = "tiktok-api23.p.rapidapi.com";
  try {
    const res = await fetch(`https://${host}/api/post/detail?videoId=${encodeURIComponent(videoId)}`, {
      headers: { "x-rapidapi-host": host, "x-rapidapi-key": key },
      signal: AbortSignal.timeout(12000),
    });
    if (res.status === 404) return { error: "not_found" };
    if (res.status === 429) return { error: "rate_limited" };
    if (!res.ok) return { error: `http_${res.status}` };
    const j = await res.json();
    const item = j?.itemInfo?.itemStruct ?? j?.itemStruct ?? j;
    if (!item || (j?.statusCode && j.statusCode !== 0)) return { error: "not_found" };
    const stats = item?.statsV2 ?? item?.stats ?? {};
    const raw = metric === "likes" ? stats.diggCount : stats.playCount;
    const count = Number(raw);
    if (!Number.isFinite(count)) return { error: "no_stat" };
    return { count };
  } catch (e) {
    return { error: e instanceof Error && e.name === "TimeoutError" ? "timeout" : "fetch_error" };
  }
}

export async function analyzeMediaDrops(opts: {
  platform: string;
  metric: DropMetric;
  since: string;
  until?: string;
  threshold?: number;
  force?: boolean;
}): Promise<DropAnalysis> {
  const platform = opts.platform;
  const service = MEDIA_SERVICE[opts.metric]?.[platform];
  if (!service) throw new Error(`Unsupported ${opts.metric} drop analysis for ${platform}`);
  const threshold = opts.threshold ?? 20;
  const until = opts.until || "2999-01-01";

  await ensureDropOpsSchema();
  await ensureLiveCacheSchema();

  const rows = await sql`
    SELECT id, LOWER(username) AS username, status, created_at, smm_orders, email, lang,
           refill_notice_sent_at, last_refill_at, last_topup_at,
           COALESCE(refunded_amount_cents, 0) AS refunded_cents
    FROM orders
    WHERE platform = ${platform}
      AND created_at >= ${opts.since}::date
      AND created_at < (${until}::date + INTERVAL '1 day')
      AND status IN ('paid','processing','delivered','partial')
      AND cart::text LIKE ${'%' + service + '%'}
      AND COALESCE(refunded_amount_cents, 0) < GREATEST(COALESCE(total_cents, 0), 1)
    ORDER BY created_at DESC
  `;

  // Flatten to one entry per media sub-order that targets a resolvable video.
  type MediaUnit = { row: (typeof rows)[number]; sub: SmmSubOrder; videoId: string };
  const units: MediaUnit[] = [];
  for (const row of rows) {
    for (const sub of asSubOrders(row.smm_orders)) {
      if (sub.service !== service) continue;
      const vid = sub.postUrl ? extractTtVideoId(sub.postUrl) : null;
      if (!vid) continue;
      units.push({ row, sub, videoId: vid });
    }
  }

  const statusMap = await fetchDeliveryStatuses(rows, service);

  // Live counts, cached per video+metric (12 min TTL) to spare RapidAPI.
  const cacheKey = (vid: string) => `${vid}:${opts.metric}`;
  const uniqueVideoIds = [...new Set(units.map((u) => u.videoId))];
  const countMap = new Map<string, { count: number; checkedAt: string; source: "live" | "cache" }>();
  if (!opts.force && uniqueVideoIds.length > 0) {
    const keys = uniqueVideoIds.map(cacheKey);
    const cached = await sql`
      SELECT username, followers, checked_at FROM live_follower_cache
      WHERE platform = ${platform} AND username = ANY(${keys})
        AND checked_at > NOW() - (${LIVE_CACHE_TTL_MIN} * INTERVAL '1 minute')
    `;
    for (const c of cached) {
      const vid = String(c.username).split(":")[0];
      countMap.set(vid, { count: Number(c.followers), checkedAt: new Date(c.checked_at).toISOString(), source: "cache" });
    }
  }
  const toFetch = uniqueVideoIds.filter((vid) => !countMap.has(vid));
  const fetchErrors = new Map<string, string>();
  await mapPool(toFetch, 4, async (vid) => {
    const r = await liveMedia(vid, opts.metric);
    if ("error" in r) fetchErrors.set(vid, r.error);
    else countMap.set(vid, { count: r.count, checkedAt: new Date().toISOString(), source: "live" });
  });
  // Persist freshly fetched counts.
  const fresh = uniqueVideoIds.filter((vid) => countMap.get(vid)?.source === "live");
  if (fresh.length > 0) {
    const keys = fresh.map(cacheKey);
    const counts = fresh.map((vid) => countMap.get(vid)!.count);
    await sql`
      INSERT INTO live_follower_cache (platform, username, followers, checked_at)
      SELECT ${platform}, u.username, u.followers, NOW()
      FROM UNNEST(${keys}::text[], ${counts}::int[]) AS u(username, followers)
      ON CONFLICT (platform, username)
      DO UPDATE SET followers = EXCLUDED.followers, checked_at = EXCLUDED.checked_at
    `;
  }

  const flagged: DropRow[] = [];
  const ok: DropRow[] = [];
  const errors: DropRow[] = [];

  for (const { row, sub, videoId } of units) {
    const qty = Number(sub.qty || 0);
    const st = sub.bfOrderId != null ? statusMap.get(sub.bfOrderId) : undefined;
    const remains = st ? Number(st.remains) : NaN;
    const delivered = st && Number.isFinite(remains)
      ? Math.max(0, qty - remains)
      : sub.status === "completed" ? qty : 0;
    const startCount = st ? Number(st.start_count) : NaN;
    const haveBaseline = Number.isFinite(startCount) && startCount >= 0;

    const hit = countMap.get(videoId);
    const base = {
      orderId: row.id,
      username: row.username,
      email: row.email ?? null,
      lang: row.lang ?? null,
      status: row.status,
      date: new Date(row.created_at).toISOString().slice(0, 10),
      deliveredApprox: !st && sub.status !== "completed" ? false : !st,
      ordered: qty,
      delivered,
      smm: rollupSmm(row.smm_orders),
      refundedCents: Number(row.refunded_cents || 0),
      videoUrl: sub.postUrl ?? `https://www.tiktok.com/video/${videoId}`,
      refillNoticeSentAt: toIso(row.refill_notice_sent_at),
      lastRefillAt: toIso(row.last_refill_at),
      lastTopupAt: toIso(row.last_topup_at),
    };

    if (!hit) {
      errors.push({
        ...base, baseline: 0, baselineSource: "snapshot", before: 0,
        undelivered: Math.max(0, qty - delivered), pctUndelivered: 0,
        expected: 0, current: null, currentSource: null, currentCheckedAt: null,
        lost: 0, pctDrop: 0, pctOfDelivered: 0, kind: "ok", topUp: null,
        error: fetchErrors.get(videoId) || "no_live",
      });
      continue;
    }

    const current = hit.count;
    const baseline = haveBaseline ? startCount : Math.max(0, current - delivered);
    const expected = baseline + delivered;
    const undelivered = Math.max(0, qty - delivered);
    const pctUndelivered = qty > 0 ? (undelivered / qty) * 100 : 0;
    const lost = expected - current;
    const pctDrop = haveBaseline && expected > 0 ? (lost / expected) * 100 : 0;
    const pctOfDelivered = haveBaseline && delivered > 0 ? (lost / delivered) * 100 : 0;
    // Make the customer whole to what they paid for on this video.
    const makeWhole = Math.max(0, baseline + qty - current);

    const isDrop = haveBaseline && delivered > 0 && pctDrop > threshold;
    const isUndelivered = pctUndelivered > threshold;
    const kind: DropKind = isDrop && isUndelivered ? "both" : isDrop ? "drop" : isUndelivered ? "undelivered" : "ok";

    const rowOut: DropRow = {
      ...base,
      before: baseline,
      baseline,
      baselineSource: haveBaseline ? "live" : "snapshot",
      undelivered,
      pctUndelivered,
      expected,
      current,
      currentSource: hit.source,
      currentCheckedAt: hit.checkedAt,
      lost,
      pctDrop,
      pctOfDelivered,
      kind,
      topUp: makeWhole > 0 ? { cartIndex: sub.cartIndex, quantity: makeWhole } : null,
    };
    if (kind === "ok") ok.push(rowOut);
    else flagged.push(rowOut);
  }

  const severity = (r: DropRow) => Math.max(r.pctDrop, r.pctUndelivered);
  flagged.sort((a, b) => severity(b) - severity(a));
  ok.sort((a, b) => b.pctDrop - a.pctDrop);

  return {
    metric: opts.metric,
    flagged,
    ok,
    errors,
    summary: {
      accountsScanned: units.length,
      flaggedCount: flagged.length,
      dropCount: flagged.filter((r) => r.kind === "drop" || r.kind === "both").length,
      undeliveredCount: flagged.filter((r) => r.kind === "undelivered" || r.kind === "both").length,
      threshold,
      followersLost: flagged.reduce((s, f) => s + (f.lost > 0 ? f.lost : 0), 0),
      followersUndelivered: flagged.reduce((s, f) => s + f.undelivered, 0),
    },
  };
}

/** Dispatch to the per-account (followers) or per-video (likes/views) analyzer. */
export function analyzeDrops(opts: {
  platform: string;
  metric: DropMetric;
  since: string;
  until?: string;
  threshold?: number;
  force?: boolean;
}): Promise<DropAnalysis> {
  return opts.metric === "followers"
    ? analyzeFollowerDrops(opts)
    : analyzeMediaDrops(opts);
}
