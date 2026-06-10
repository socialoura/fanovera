/**
 * Multi-provider SMM API client
 * Supports any SMM panel v2 API (BulkFollows, DripFeedPanel, etc.)
 *
 * Every call goes through `smmPost` which handles auth + error wrapping.
 */

import { sql } from "./db";
import { bulkFollowsCostCents, estimateBulkFollowsCharge, resolveBulkFollowsCharge } from "./smmCost";
import { getUsdToCurrencyRate } from "./fxRates";
import { captureServerEvent } from "./analytics.server";
import { extractHandleFromUrl, type ExtractPlatform } from "./extractHandle";

// ── Provider registry ──

export type SmmProvider = "bulkfollows" | "dripfeedpanel";

interface ProviderConfig {
  url: string;
  keyEnv: string;
}

const PROVIDERS: Record<SmmProvider, ProviderConfig> = {
  bulkfollows: { url: "https://bulkfollows.com/api/v2", keyEnv: "BULKFOLLOWS_API_KEY" },
  dripfeedpanel: { url: "https://dripfeedpanel.com/api/v2", keyEnv: "DRIPFEEDPANEL_API_KEY" },
};

const DEFAULT_PROVIDER: SmmProvider = "bulkfollows";

function getProviderKey(provider: SmmProvider): string {
  const cfg = PROVIDERS[provider];
  if (!cfg) throw new Error(`Unknown SMM provider: ${provider}`);
  const k = process.env[cfg.keyEnv];
  if (!k) throw new Error(`${cfg.keyEnv} is not set`);
  return k;
}

function getProviderUrl(provider: SmmProvider): string {
  const cfg = PROVIDERS[provider];
  if (!cfg) throw new Error(`Unknown SMM provider: ${provider}`);
  return cfg.url;
}

// Legacy helper for code that still calls without a provider
function apiKey(): string {
  return getProviderKey("bulkfollows");
}

const BF_URL = "https://bulkfollows.com/api/v2";

// ── Low-level request ──

/**
 * Mark transient errors raised by `bfPost` so the high-level retry loop can
 * tell them apart from definitive ones. Transient = worth retrying with
 * exponential backoff (network blip, 429, 5xx). Definitive = service
 * inactive, invalid link, insufficient funds — retrying is pointless.
 */
class BfTransientError extends Error {
  isTransient = true as const;
}

const TRANSIENT_BF_MESSAGES = [
  "rate limit",
  "too many requests",
  "timeout",
  "temporarily",
  "try again",
  "try later",
  "internal server",
  "bad gateway",
  "service unavailable",
  "gateway timeout",
];

function isTransientBfMessage(msg: string): boolean {
  const lower = (msg || "").toLowerCase();
  return TRANSIENT_BF_MESSAGES.some((needle) => lower.includes(needle));
}

async function smmPost<T = Record<string, unknown>>(
  params: Record<string, unknown>,
  provider: SmmProvider = DEFAULT_PROVIDER,
): Promise<T> {
  const url = getProviderUrl(provider);
  const key = getProviderKey(provider);
  const label = provider;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, ...params }),
    });
  } catch (err) {
    throw new BfTransientError(
      `${label} network: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (res.status === 429 || res.status >= 500) {
    let body = "";
    try { body = await res.text(); } catch { /* ignore */ }
    throw new BfTransientError(
      `${label} HTTP ${res.status}: ${body.slice(0, 200) || res.statusText}`,
    );
  }

  let data: { error?: string } & Record<string, unknown>;
  try {
    data = await res.json();
  } catch (err) {
    throw new BfTransientError(
      `${label} malformed response: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (data.error) {
    const msg = String(data.error);
    if (isTransientBfMessage(msg)) throw new BfTransientError(`${label}: ${msg}`);
    throw new Error(`${label}: ${msg}`);
  }
  return data as T;
}

async function bfPost<T = Record<string, unknown>>(
  params: Record<string, unknown>,
): Promise<T> {
  return smmPost<T>(params, "bulkfollows");
}

/** Retry an async operation with exponential backoff on transient errors. */
async function withBfRetry<T>(
  op: () => Promise<T>,
  opts: { maxAttempts?: number; baseDelayMs?: number; label?: string } = {},
): Promise<T> {
  const max = opts.maxAttempts ?? 3;
  const base = opts.baseDelayMs ?? 600;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      return await op();
    } catch (err) {
      lastErr = err;
      const transient = err instanceof BfTransientError;
      if (!transient || attempt === max) break;
      // Exponential backoff with full jitter: 0..base*2^(attempt-1).
      const cap = base * Math.pow(2, attempt - 1);
      const delay = Math.floor(Math.random() * cap);
      if (opts.label) {
        console.warn(`[smm] ${opts.label} transient (attempt ${attempt}/${max}, retry in ${delay}ms):`, err instanceof Error ? err.message : err);
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ── Public helpers ──

/** Account balance (USD) */
export async function getBalance(provider: SmmProvider = DEFAULT_PROVIDER): Promise<number> {
  const data = await smmPost<{ balance: string }>({ action: "balance" }, provider);
  return parseFloat(data.balance);
}

/** Place an order — returns the provider order ID */
export async function placeOrder(params: {
  serviceId: number;
  link: string;
  quantity: number;
  provider?: SmmProvider;
}): Promise<{ orderId: number }> {
  const data = await smmPost<{ order: number }>({
    action: "add",
    service: params.serviceId,
    link: params.link,
    quantity: params.quantity,
  }, params.provider || DEFAULT_PROVIDER);
  return { orderId: data.order };
}

/** Check status of one order */
export interface BfOrderStatus {
  charge: string;
  start_count: string;
  status: string; // Pending | In progress | Processing | Completed | Partial | Canceled
  remains: string;
  currency: string;
}
export async function getOrderStatus(orderId: number, provider: SmmProvider = DEFAULT_PROVIDER): Promise<BfOrderStatus> {
  return smmPost<BfOrderStatus>({ action: "status", order: orderId }, provider);
}

/** Check status of multiple orders at once (max 100) */
export async function getMultipleOrderStatus(
  orderIds: number[],
  provider: SmmProvider = DEFAULT_PROVIDER,
): Promise<Record<string, BfOrderStatus>> {
  return smmPost<Record<string, BfOrderStatus>>({
    action: "status",
    orders: orderIds.join(","),
  }, provider);
}

// ─── Cache layer for BulkFollows status ──────────────────────────────────────
// Customers hitting refresh on /track every few seconds would otherwise hammer
// the BulkFollows API. We cache per-bfOrderId statuses for 30s in-memory.
//
// Caveat: Vercel serverless instances are isolated, so the actual rate to BF
// is capped at (1 / 30s) × concurrent_instances. Acceptable trade-off; swap
// to Redis if you need a hard global cap.

const STATUS_CACHE_TTL_MS = 30_000;
type StatusCacheEntry = { value: BfOrderStatus; expires: number };
const statusCache = new Map<number, StatusCacheEntry>();

/**
 * Cached variant of {@link getMultipleOrderStatus} — fetches only the BF order
 * IDs whose cached value is stale or missing, and returns the merged result.
 */
export async function getMultipleOrderStatusCached(
  orderIds: number[],
): Promise<Record<string, BfOrderStatus>> {
  const now = Date.now();
  const merged: Record<string, BfOrderStatus> = {};
  const toFetch: number[] = [];

  for (const id of orderIds) {
    const hit = statusCache.get(id);
    if (hit && hit.expires > now) {
      merged[String(id)] = hit.value;
    } else {
      toFetch.push(id);
    }
  }

  if (toFetch.length === 0) return merged;

  const fresh = await getMultipleOrderStatus(toFetch);
  for (const [k, v] of Object.entries(fresh)) {
    merged[k] = v;
    const idNum = Number(k);
    if (!Number.isNaN(idNum)) {
      statusCache.set(idNum, { value: v, expires: now + STATUS_CACHE_TTL_MS });
    }
  }

  // Opportunistic cleanup if the cache grows too large.
  if (statusCache.size > 1000) {
    for (const [k, entry] of statusCache) {
      if (entry.expires <= now) statusCache.delete(k);
    }
  }

  return merged;
}

/** Fetch all services with their rates from a provider */
export interface BfService {
  service: number;
  name: string;
  type: string;
  rate: string; // price per 1000 in USD
  min: string;
  max: string;
  category: string;
}
export async function getServices(provider: SmmProvider = DEFAULT_PROVIDER): Promise<BfService[]> {
  const data = await smmPost<BfService[] | Record<string, BfService>>({
    action: "services",
  }, provider);
  // API returns either an array or { "1": {...}, "2": {...} }
  if (Array.isArray(data)) return data;
  return Object.values(data);
}

// ── High-level: place SMM sub-orders for an internal order ──

export interface SmmSubOrder {
  cartIndex: number;
  service: string;
  platform: string;
  qty: number;
  bfServiceId: number;
  bfOrderId: number | null;
  status: "pending" | "placed" | "completed" | "partial" | "failed" | "canceled";
  charge: number | null; // USD cost charged by provider
  error: string | null;
  placedAt: string | null;
  provider?: SmmProvider;
  postUrl?: string;
}

/**
 * Split a total quantity into `n` whole-number parts that sum back to `total`,
 * giving the remainder to the first parts. Used to spread a likes/views pack
 * evenly across the posts the buyer selected. e.g. splitQty(1000, 3) →
 * [334, 333, 333].
 */
function splitQty(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  let remainder = total - base * n;
  return Array.from({ length: n }, () => base + (remainder-- > 0 ? 1 : 0));
}

// One BulkFollows placement target derived from a cart line.
type SmmTarget = { link: string; qty: number; postUrl?: string };

/**
 * Best-effort check that a URL is reachable before we spend BulkFollows
 * credit on it. Conservative: only returns false when we're SURE the URL is
 * dead (malformed, DNS fail, 404/410). 403/429/timeouts/network blips assume
 * OK — social sites often block our HEAD request even when the URL is real.
 */
async function isUrlReachable(rawUrl: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(rawUrl);
    if (!/^https?:$/.test(url.protocol)) return false;
  } catch {
    return false;
  }
  try {
    const res = await fetch(url.toString(), {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FanoveraBot/1.0; +https://fanovera.com)",
      },
    });
    if (res.status === 404 || res.status === 410) return false;
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : "";
    // DNS failure → host doesn't exist → URL is dead.
    if (msg.includes("enotfound") || msg.includes("getaddrinfo")) return false;
    // Timeout / network blip / TLS issue → assume OK, don't block legit orders.
    return true;
  }
}

/**
 * Build the profile link for a given platform + username.
 */
function buildLink(platform: string, username: string, postUrl?: string): string {
  if (postUrl) return postUrl;

  const raw = username.trim();

  // Defensive: if the username is already a full URL (user pasted a profile
  // link instead of a handle), return it as-is. Without this guard we'd wrap
  // the URL again — e.g. youtube would produce
  // `https://www.youtube.com/@https://youtube.com/@foo?si=...` which BulkFollows
  // rejects as unreachable.
  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      // Strip YouTube share-tracking params that some BF parsers choke on.
      if (platform === "youtube") {
        u.searchParams.delete("si");
        u.searchParams.delete("feature");
        u.hash = "";
      }
      return u.toString();
    } catch {
      return raw;
    }
  }

  const clean = raw.replace(/^@/, "").trim();
  switch (platform) {
    case "instagram":
      return `https://www.instagram.com/${clean}`;
    case "tiktok":
      return `https://www.tiktok.com/@${clean}`;
    case "youtube":
      return `https://www.youtube.com/@${clean}`;
    case "x":
    case "twitter":
      return `https://x.com/${clean}`;
    case "facebook":
      return `https://www.facebook.com/${clean}`;
    case "spotify":
      return clean; // Spotify links are full URLs in cart
    case "twitch":
      return `https://www.twitch.tv/${clean}`;
    case "linkedin":
      // username may be a bare handle ("foo" → assume personal profile, legacy)
      // or a path like "in/foo" / "company/acme" / "school/bar" (new format
      // emitted by extractLinkedinHandle so company pages are supported).
      return clean.includes("/")
        ? `https://www.linkedin.com/${clean}`
        : `https://www.linkedin.com/in/${clean}`;
    default:
      return clean;
  }
}

const HANDLE_RECOVERABLE_PLATFORMS = new Set<string>([
  "instagram", "tiktok", "x", "twitter", "twitch", "facebook", "linkedin",
]);

// TikTok "Share → Copy link" produces short links that don't embed the @handle
// (e.g. https://www.tiktok.com/t/ZTBh4dK13/ or https://vm.tiktok.com/ZMabc/).
// They must be followed to the canonical .../@handle/... URL.
const TIKTOK_SHORT_LINK = /^https?:\/\/(?:vm\.tiktok\.com\/|(?:www\.)?tiktok\.com\/t\/)/i;

/** Follow redirects to the final URL (6s timeout). Returns the input on failure. */
async function expandUrl(url: string): Promise<string> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15" },
    });
    clearTimeout(timer);
    return res.url || url;
  } catch {
    return url;
  }
}

/**
 * Resolve the profile handle for an order. Normally `order.username` holds it,
 * but for media orders (TikTok views/likes, etc.) the handle can be empty when
 * the live media preview failed to resolve at checkout — the customer only
 * pasted a video link. A profile-targeted line (e.g. a "+followers" upsell on a
 * views order) would then build `https://www.tiktok.com/@` and fail on
 * BulkFollows. Recover the handle from any cart item's postUrl, which embeds it
 * (https://www.tiktok.com/@handle/video/123) — expanding short links if needed.
 */
async function resolveOrderUsername(
  rawUsername: string,
  platform: string,
  cart: Array<{ postUrl?: string; postUrls?: string[] }>,
): Promise<string> {
  const direct = (rawUsername || "").trim();
  if (direct) return direct;
  if (!HANDLE_RECOVERABLE_PLATFORMS.has(platform)) return "";
  for (const item of cart) {
    const candidates = [
      typeof item?.postUrl === "string" ? item.postUrl : "",
      ...(Array.isArray(item?.postUrls) ? item.postUrls.filter((u) => typeof u === "string") : []),
    ];
    for (const postUrl of candidates) {
      if (!postUrl) continue;
      let handle = extractHandleFromUrl(platform as ExtractPlatform, postUrl);
      if (!handle && platform === "tiktok" && TIKTOK_SHORT_LINK.test(postUrl)) {
        handle = extractHandleFromUrl(platform as ExtractPlatform, await expandUrl(postUrl));
      }
      if (handle) return handle;
    }
  }
  return "";
}

/**
 * For a given order, read its cart and place all corresponding BulkFollows
 * sub-orders. Updates the DB row with smm_orders + cost_cents.
 *
 * Returns the list of sub-orders placed.
 */
export async function runSmmForOrder(orderId: number): Promise<SmmSubOrder[]> {
  // Fetch order
  const rows = await sql`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`;
  const order = rows[0];
  if (!order) throw new Error(`Order ${orderId} not found`);

  // Parse existing smm_orders (so we can resume / skip already-placed ones)
  const existing: SmmSubOrder[] = Array.isArray(order.smm_orders)
    ? order.smm_orders
    : JSON.parse(order.smm_orders || "[]");

  const cart: Array<{
    service?: string;
    qty?: number;
    quantity?: number;
    bonus?: number;
    platform?: string;
    postUrl?: string;
    postUrls?: string[];
  }> = Array.isArray(order.cart) ? order.cart : JSON.parse(order.cart || "[]");

  const platform = order.platform || "instagram";
  const username = await resolveOrderUsername(order.username, platform, cart);

  // Fetch active SMM config mappings
  const configs = await sql`SELECT * FROM smm_config WHERE enabled = true`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configMap = new Map<string, Record<string, any>>();
  for (const c of configs) {
    configMap.set(`${c.platform}:${c.service}`, c);
  }

  // Legacy alias: the DB historically stores Twitter under platform="x" while
  // productCatalog now emits platform="twitter". Look both up so existing rows
  // keep working without a manual SQL migration.
  const platformAliases: Record<string, string[]> = {
    twitter: ["x"],
    x: ["twitter"],
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lookupConfig = (p: string, s: string): Record<string, any> | undefined => {
    const exact = configMap.get(`${p}:${s}`);
    if (exact) return exact;
    for (const alias of platformAliases[p] || []) {
      const hit = configMap.get(`${alias}:${s}`);
      if (hit) return hit;
    }
    return undefined;
  };

  const subOrders: SmmSubOrder[] = [];

  for (let i = 0; i < cart.length; i++) {
    const item = cart[i];
    const svc = item.service || "followers";
    const baseQty = Number(item.qty || item.quantity || 0);
    const bonus = Number(item.bonus || 0);
    // Send qty + bonus to BulkFollows so the customer gets the promised total.
    const totalQty = baseQty + bonus;
    const itemPlatform = item.platform || platform;

    const config = lookupConfig(itemPlatform, svc);

    // Build placement targets. A line with `postUrls` distributes its qty+bonus
    // evenly across the selected videos (one BF sub-order per video); otherwise
    // it's a single profile/post target (legacy behavior).
    const distrib = Array.isArray(item.postUrls)
      ? item.postUrls.filter((u): u is string => typeof u === "string" && !!u.trim())
      : [];
    const isDistributed = distrib.length > 0;
    const targets: SmmTarget[] = isDistributed
      ? splitQty(totalQty, distrib.length).map((q, k) => ({
          link: buildLink(itemPlatform, username, distrib[k]),
          qty: q,
          postUrl: distrib[k],
        }))
      : [{ link: buildLink(itemPlatform, username, item.postUrl), qty: totalQty, postUrl: item.postUrl }];

    for (const target of targets) {
      // Skip targets already successfully placed. For distributed lines the
      // resume key is cartIndex + postUrl; legacy single-target lines key on
      // cartIndex only so in-flight pre-upgrade orders still resume.
      const prev = existing.find(
        (e) =>
          e.cartIndex === i &&
          (!isDistributed || (e.postUrl || undefined) === (target.postUrl || undefined)) &&
          (e.status === "placed" || e.status === "completed"),
      );
      if (prev) {
        subOrders.push(prev);
        continue;
      }

      if (!config || !config.bulkfollows_service_id || config.bulkfollows_service_id === 0) {
        subOrders.push({
          cartIndex: i,
          service: svc,
          platform: itemPlatform,
          qty: target.qty,
          bfServiceId: 0,
          bfOrderId: null,
          status: "failed",
          charge: null,
          error: `No SMM service ID configured for ${itemPlatform}:${svc}`,
          placedAt: null,
          postUrl: target.postUrl,
        });
        continue;
      }

      const provider = (config.provider || DEFAULT_PROVIDER) as SmmProvider;
      const link = target.link;

      if (!(await isUrlReachable(link))) {
        subOrders.push({
          cartIndex: i,
          service: svc,
          platform: itemPlatform,
          qty: target.qty,
          bfServiceId: config.bulkfollows_service_id,
          bfOrderId: null,
          status: "failed",
          charge: null,
          error: `URL not reachable: ${link}`,
          placedAt: null,
          postUrl: target.postUrl,
        });
        continue;
      }

      try {
        const result = await withBfRetry(
          () => placeOrder({
            serviceId: config.bulkfollows_service_id,
            link,
            quantity: target.qty,
            provider,
          }),
          { maxAttempts: 3, baseDelayMs: 600, label: `placeOrder ${itemPlatform}:${svc}` },
        );

        const estimatedCharge = estimateBulkFollowsCharge(config.rate_per_1k, target.qty);
        let charge: number | null = estimatedCharge;
        try {
          const st = await withBfRetry(
            () => getOrderStatus(result.orderId, provider),
            { maxAttempts: 2, baseDelayMs: 400, label: `getOrderStatus ${result.orderId}` },
          );
          charge = resolveBulkFollowsCharge(st.charge, estimatedCharge);
        } catch {
          // non-critical — charge will be picked up on status refresh
        }

        subOrders.push({
          cartIndex: i,
          service: svc,
          platform: itemPlatform,
          qty: target.qty,
          bfServiceId: config.bulkfollows_service_id,
          bfOrderId: result.orderId,
          status: "placed",
          charge,
          error: null,
          placedAt: new Date().toISOString(),
          provider,
          postUrl: target.postUrl,
        });
      } catch (err) {
        subOrders.push({
          cartIndex: i,
          service: svc,
          platform: itemPlatform,
          qty: target.qty,
          bfServiceId: config.bulkfollows_service_id,
          bfOrderId: null,
          status: "failed",
          charge: null,
          error: err instanceof Error ? err.message : String(err),
          placedAt: null,
          provider,
          postUrl: target.postUrl,
        });
      }
    }
  }

  // BF charges are in USD — convert to the client's currency so cost_cents
  // and total_cents stay in the same currency (per-order margin calc works).
  const fxRate = await getUsdToCurrencyRate(order.currency || "EUR");
  const costCents = bulkFollowsCostCents(subOrders.map((sub) => sub.charge), fxRate);

  // Determine overall status
  const allPlacedOrDone = subOrders.every(
    (s) => s.status === "placed" || s.status === "completed",
  );
  const newStatus = allPlacedOrDone ? "processing" : "paid"; // keep paid if some failed

  await sql`
    UPDATE orders
    SET smm_orders = ${JSON.stringify(subOrders)}::jsonb,
        cost_cents = ${costCents},
        status = ${newStatus}
    WHERE id = ${orderId}
  `;

  return subOrders;
}

/**
 * Full "refill" / relaunch from scratch with an operator-chosen BulkFollows
 * service ID. Unlike {@link runSmmForOrder} (which skips lines already placed),
 * this ALWAYS re-places every cart line at its full quantity (qty + bonus) as
 * fresh sub-orders, regardless of prior delivery — used when a delivery dropped
 * and the admin wants to re-buy the whole order on a (possibly different)
 * service. No URL pre-flight: the admin is explicitly forcing the relaunch.
 *
 * New sub-orders are appended with synthetic cartIndex (1000+) so the original
 * audit trail and cost stay intact (same convention as the top-up route).
 */
export async function refillOrderFromScratch(
  orderId: number,
  serviceId: number,
  provider: SmmProvider = DEFAULT_PROVIDER,
): Promise<{ subOrders: SmmSubOrder[]; placed: number; failed: number }> {
  const rows = await sql`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`;
  const order = rows[0];
  if (!order) throw new Error("Order not found");

  const cart: Array<{
    service?: string;
    qty?: number;
    quantity?: number;
    bonus?: number;
    platform?: string;
    postUrl?: string;
    postUrls?: string[];
  }> = Array.isArray(order.cart) ? order.cart : JSON.parse(order.cart || "[]");
  if (cart.length === 0) throw new Error("Order has an empty cart");

  const existing: SmmSubOrder[] = Array.isArray(order.smm_orders)
    ? order.smm_orders
    : JSON.parse(order.smm_orders || "[]");

  const platform = order.platform || "instagram";
  const username = await resolveOrderUsername(order.username, platform, cart);

  const newSubs: SmmSubOrder[] = [];
  let synthetic = 1000 + existing.filter((s) => s.cartIndex >= 1000).length;

  for (let i = 0; i < cart.length; i++) {
    const item = cart[i];
    const svc = item.service || "followers";
    const totalQty = Number(item.qty || item.quantity || 0) + Number(item.bonus || 0);
    const itemPlatform = item.platform || platform;

    // Same distribution logic as runSmmForOrder: one fresh sub-order per
    // selected video when the line carries postUrls, else a single target.
    const distrib = Array.isArray(item.postUrls)
      ? item.postUrls.filter((u): u is string => typeof u === "string" && !!u.trim())
      : [];
    const targets: SmmTarget[] = distrib.length > 0
      ? splitQty(totalQty, distrib.length).map((q, k) => ({
          link: buildLink(itemPlatform, username, distrib[k]),
          qty: q,
          postUrl: distrib[k],
        }))
      : [{ link: buildLink(itemPlatform, username, item.postUrl), qty: totalQty, postUrl: item.postUrl }];

    for (const target of targets) {
      const cartIndex = synthetic++;

      if (target.qty <= 0) {
        newSubs.push({
          cartIndex, service: svc, platform: itemPlatform, qty: target.qty,
          bfServiceId: serviceId, bfOrderId: null, status: "failed",
          charge: null, error: "Quantity is 0 — nothing to relaunch", placedAt: null,
          postUrl: target.postUrl,
        });
        continue;
      }

      try {
        const result = await withBfRetry(
          () => placeOrder({ serviceId, link: target.link, quantity: target.qty, provider }),
          { maxAttempts: 3, baseDelayMs: 600, label: `refill ${itemPlatform}:${svc}` },
        );
        let charge: number | null = null;
        try {
          const st = await withBfRetry(
            () => getOrderStatus(result.orderId, provider),
            { maxAttempts: 2, baseDelayMs: 400, label: `getOrderStatus ${result.orderId}` },
          );
          charge = resolveBulkFollowsCharge(st.charge, 0);
        } catch {
          /* non-critical — charge picked up on refresh */
        }
        newSubs.push({
          cartIndex, service: svc, platform: itemPlatform, qty: target.qty,
          bfServiceId: serviceId, bfOrderId: result.orderId, status: "placed",
          charge, error: null, placedAt: new Date().toISOString(),
          postUrl: target.postUrl,
        });
      } catch (err) {
        newSubs.push({
          cartIndex, service: svc, platform: itemPlatform, qty: target.qty,
          bfServiceId: serviceId, bfOrderId: null, status: "failed",
          charge: null, error: err instanceof Error ? err.message : String(err), placedAt: null,
          postUrl: target.postUrl,
        });
      }
    }
  }

  const allSubs = [...existing, ...newSubs];
  const fxRate = await getUsdToCurrencyRate(order.currency || "EUR");
  const costCents = bulkFollowsCostCents(allSubs.map((s) => s.charge), fxRate);

  await sql`
    UPDATE orders
    SET smm_orders = ${JSON.stringify(allSubs)}::jsonb,
        cost_cents = ${costCents},
        status = 'processing',
        delivered_at = NULL
    WHERE id = ${orderId}
  `;

  return {
    subOrders: allSubs,
    placed: newSubs.filter((s) => s.status === "placed").length,
    failed: newSubs.filter((s) => s.status === "failed").length,
  };
}

/**
 * Retry a specific failed sub-order within an order.
 *
 * `opts.serviceId` overrides the BulkFollows service ID for this retry only —
 * useful when the smm_config row is wrong, when the operator wants to try a
 * different BF service (better rate, working service, etc.), or when a
 * specific commande needs a one-off service ID without touching global config.
 */
export async function retrySmmSubOrder(
  orderId: number,
  cartIndex: number,
  opts: { serviceId?: number } = {},
): Promise<SmmSubOrder[]> {
  const rows = await sql`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`;
  const order = rows[0];
  if (!order) throw new Error(`Order ${orderId} not found`);

  const subOrders: SmmSubOrder[] = Array.isArray(order.smm_orders)
    ? order.smm_orders
    : JSON.parse(order.smm_orders || "[]");

  const idx = subOrders.findIndex((s) => s.cartIndex === cartIndex);
  if (idx === -1) throw new Error(`Sub-order cartIndex=${cartIndex} not found`);

  const sub = subOrders[idx];
  if (sub.status !== "failed" && sub.status !== "canceled") {
    throw new Error(`Sub-order cartIndex=${cartIndex} is not in a retryable state (${sub.status})`);
  }

  // Resolve which BF service ID + rate to use. Priority:
  //   1. Explicit override via opts.serviceId — the operator picks per-retry
  //      (no rate available, use the existing sub charge as proxy).
  //   2. The smm_config row for this platform:service.
  const aliasPlatforms = [sub.platform, ...(sub.platform === "twitter" ? ["x"] : sub.platform === "x" ? ["twitter"] : [])];
  const configs = await sql`
    SELECT * FROM smm_config
    WHERE platform = ANY(${aliasPlatforms}) AND service = ${sub.service} AND enabled = true
    LIMIT 1
  `;
  const config = configs[0];

  const provider = (config?.provider || DEFAULT_PROVIDER) as SmmProvider;

  let serviceId: number;
  let ratePer1k: number;
  if (opts.serviceId && Number.isFinite(opts.serviceId) && opts.serviceId > 0) {
    serviceId = opts.serviceId;
    ratePer1k = config?.rate_per_1k ? Number(config.rate_per_1k) : 0;
  } else {
    if (!config || !config.bulkfollows_service_id || config.bulkfollows_service_id === 0) {
      sub.error = `No SMM service ID configured for ${sub.platform}:${sub.service}`;
      await sql`UPDATE orders SET smm_orders = ${JSON.stringify(subOrders)}::jsonb WHERE id = ${orderId}`;
      throw new Error(sub.error);
    }
    serviceId = Number(config.bulkfollows_service_id);
    ratePer1k = Number(config.rate_per_1k) || 0;
  }

  const cart: Array<{ postUrl?: string }> = Array.isArray(order.cart)
    ? order.cart
    : JSON.parse(order.cart || "[]");
  const username = await resolveOrderUsername(order.username, sub.platform, cart);
  // Prefer the sub-order's own postUrl: distributed lines and refill subs use
  // synthetic cartIndexes that don't map back to a cart row, but each sub
  // records the exact video URL it targets.
  const link = buildLink(sub.platform, username, sub.postUrl ?? cart[sub.cartIndex]?.postUrl);

  if (!(await isUrlReachable(link))) {
    sub.error = `URL not reachable: ${link}`;
    sub.status = "failed";
    await sql`UPDATE orders SET smm_orders = ${JSON.stringify(subOrders)}::jsonb WHERE id = ${orderId}`;
    throw new Error(sub.error);
  }

  try {
    const result = await withBfRetry(
      () => placeOrder({
        serviceId,
        link,
        quantity: sub.qty,
        provider,
      }),
      { maxAttempts: 3, baseDelayMs: 600, label: `retry placeOrder ${sub.platform}:${sub.service}` },
    );

    const estimatedCharge = estimateBulkFollowsCharge(ratePer1k, sub.qty);
    let charge: number | null = estimatedCharge;
    try {
      const st = await withBfRetry(
        () => getOrderStatus(result.orderId, provider),
        { maxAttempts: 2, baseDelayMs: 400, label: `retry getOrderStatus ${result.orderId}` },
      );
      charge = resolveBulkFollowsCharge(st.charge, estimatedCharge);
    } catch { /* non-critical */ }

    sub.bfServiceId = serviceId;
    sub.bfOrderId = result.orderId;
    sub.status = "placed";
    sub.charge = charge;
    sub.error = null;
    sub.placedAt = new Date().toISOString();
  } catch (err) {
    sub.error = err instanceof Error ? err.message : String(err);
    // status stays "failed"
  }

  // Recalculate total cost (USD → client currency)
  const fxRate = await getUsdToCurrencyRate(order.currency || "EUR");
  const costCents = bulkFollowsCostCents(subOrders.map((subOrder) => subOrder.charge), fxRate);

  const allPlacedOrDone = subOrders.every(
    (s) => s.status === "placed" || s.status === "completed",
  );
  const newStatus = allPlacedOrDone ? "processing" : order.status;

  await sql`
    UPDATE orders
    SET smm_orders = ${JSON.stringify(subOrders)}::jsonb,
        cost_cents = ${costCents},
        status = ${newStatus}
    WHERE id = ${orderId}
  `;

  return subOrders;
}

/**
 * Refresh the status of all placed (non-final) sub-orders for one order.
 * Updates charge, status, cost_cents, and marks as delivered if all done.
 */
export async function refreshSmmStatus(orderId: number): Promise<SmmSubOrder[]> {
  const rows = await sql`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`;
  const order = rows[0];
  if (!order) throw new Error(`Order ${orderId} not found`);

  const subOrders: SmmSubOrder[] = Array.isArray(order.smm_orders)
    ? order.smm_orders
    : JSON.parse(order.smm_orders || "[]");

  // Collect order IDs that need status check, grouped by provider
  const toCheck = subOrders.filter(
    (s) => s.bfOrderId && (s.status === "placed" || s.status === "pending"),
  );
  if (toCheck.length === 0) return subOrders;

  // Group by provider for batched status calls
  const byProvider = new Map<SmmProvider, number[]>();
  for (const s of toCheck) {
    const p = (s.provider || DEFAULT_PROVIDER) as SmmProvider;
    const list = byProvider.get(p) || [];
    list.push(s.bfOrderId!);
    byProvider.set(p, list);
  }

  try {
    const allStatuses: Record<string, BfOrderStatus> = {};
    for (const [provider, ids] of byProvider) {
      const statuses = ids.length === 1
        ? { [String(ids[0])]: await getOrderStatus(ids[0], provider) }
        : await getMultipleOrderStatus(ids, provider);
      Object.assign(allStatuses, statuses);
    }

    for (const sub of subOrders) {
      if (!sub.bfOrderId) continue;
      const st = allStatuses[String(sub.bfOrderId)];
      if (!st) continue;

      const charge = resolveBulkFollowsCharge(st.charge, sub.charge);
      if (charge) sub.charge = charge;

      const bfStatus = st.status?.toLowerCase() || "";
      if (bfStatus.includes("completed")) sub.status = "completed";
      else if (bfStatus.includes("partial")) sub.status = "partial";
      else if (bfStatus.includes("canceled") || bfStatus.includes("cancelled"))
        sub.status = "canceled";
      else if (bfStatus.includes("progress") || bfStatus.includes("processing"))
        sub.status = "placed";
    }
  } catch (err) {
    console.error(`[refreshSmmStatus] status check failed for order ${orderId}:`, err);
  }

  const fxRate = await getUsdToCurrencyRate(order.currency || "EUR");
  const costCents = bulkFollowsCostCents(subOrders.map((sub) => sub.charge), fxRate);

  // Order-level rollup. We deliberately do NOT mark the order as "delivered"
  // when any sub-order is partial/canceled/failed — the admin needs to see
  // those statuses to decide whether to top up (Compléter la livraison) or
  // refund. Only an all-completed set rolls up to delivered.
  const allTerminal = subOrders.every(
    (s) =>
      s.status === "completed" ||
      s.status === "partial" ||
      s.status === "canceled" ||
      s.status === "failed",
  );
  const allCompleted = subOrders.every((s) => s.status === "completed");
  const allCanceled = subOrders.every((s) => s.status === "canceled");

  let newStatus = order.status;
  if (allTerminal) {
    if (allCompleted) newStatus = "delivered";
    else if (allCanceled) newStatus = "canceled";
    else newStatus = "partial";
  }

  if (newStatus === "delivered") {
    const wasNotDelivered = order.status !== "delivered";
    await sql`
      UPDATE orders
      SET smm_orders = ${JSON.stringify(subOrders)}::jsonb,
          cost_cents = ${costCents},
          status = ${newStatus},
          delivered_at = NOW()
      WHERE id = ${orderId}
    `;
    // Fire `order_delivered` once, on the actual transition. Subsequent
    // refreshSmmStatus calls on an already-delivered order won't re-emit.
    if (wasNotDelivered) {
      void captureServerEvent("order_delivered", String(order.email || orderId), {
        orderId,
        platform: order.platform,
        product_area: order.platform,
        currency: order.currency || "eur",
        amount_cents: order.total_cents || 0,
        cost_cents: costCents,
        followers_before: order.followers_before || 0,
      });
    }
  } else {
    await sql`
      UPDATE orders
      SET smm_orders = ${JSON.stringify(subOrders)}::jsonb,
          cost_cents = ${costCents},
          status = ${newStatus}
      WHERE id = ${orderId}
    `;
  }

  return subOrders;
}

/**
 * Fetch service rates from all providers and update the smm_config table
 * with a `rate_per_1k` value (USD per 1000 units).
 */
export async function refreshServiceRates(): Promise<{ updated: number; total: number }> {
  const configs = await sql`SELECT * FROM smm_config`;

  // Group configs by provider
  const byProvider = new Map<SmmProvider, typeof configs>();
  for (const config of configs) {
    const p = (config.provider || DEFAULT_PROVIDER) as SmmProvider;
    const list = byProvider.get(p) || [];
    list.push(config);
    byProvider.set(p, list);
  }

  let updated = 0;

  for (const [provider, providerConfigs] of byProvider) {
    let services: BfService[];
    try {
      services = await getServices(provider);
    } catch {
      continue;
    }

    const svcMap = new Map<number, BfService>();
    for (const s of services) {
      svcMap.set(Number(s.service), s);
    }

    for (const config of providerConfigs) {
      const bfId = Number(config.bulkfollows_service_id);
      if (!bfId || bfId === 0) continue;

      const svc = svcMap.get(bfId);
      if (!svc) continue;

      const rate = parseFloat(svc.rate);
      if (isNaN(rate)) continue;

      await sql`
        UPDATE smm_config
        SET rate_per_1k = ${rate}
        WHERE id = ${config.id}
      `;
      updated++;
    }
  }

  return { updated, total: configs.length };
}
