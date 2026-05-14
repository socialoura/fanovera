/**
 * BulkFollows SMM API client
 * Docs: https://bulkfollows.com/api
 *
 * Every call goes through `bfPost` which handles auth + error wrapping.
 */

import { sql } from "./db";
import { bulkFollowsCostCents, estimateBulkFollowsCharge, resolveBulkFollowsCharge } from "./smmCost";
import { captureServerEvent } from "./analytics.server";

const BF_URL = "https://bulkfollows.com/api/v2";

function apiKey(): string {
  const k = process.env.BULKFOLLOWS_API_KEY;
  if (!k) throw new Error("BULKFOLLOWS_API_KEY is not set");
  return k;
}

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

async function bfPost<T = Record<string, unknown>>(
  params: Record<string, unknown>,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BF_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: apiKey(), ...params }),
    });
  } catch (err) {
    // Network-level error — fetch threw before we got any response. Always
    // transient (DNS, TCP, TLS issues). The retry loop will back off.
    throw new BfTransientError(
      `BulkFollows network: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 429 + 5xx are server-side hiccups — almost always recover within a few
  // hundred ms. Mark as transient so callers retry.
  if (res.status === 429 || res.status >= 500) {
    let body = "";
    try { body = await res.text(); } catch { /* ignore */ }
    throw new BfTransientError(
      `BulkFollows HTTP ${res.status}: ${body.slice(0, 200) || res.statusText}`,
    );
  }

  let data: { error?: string } & Record<string, unknown>;
  try {
    data = await res.json();
  } catch (err) {
    // Non-JSON body on a 2xx is itself a transient anomaly worth retrying.
    throw new BfTransientError(
      `BulkFollows malformed response: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (data.error) {
    const msg = String(data.error);
    if (isTransientBfMessage(msg)) throw new BfTransientError(`BulkFollows: ${msg}`);
    throw new Error(`BulkFollows: ${msg}`);
  }
  return data as T;
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
export async function getBalance(): Promise<number> {
  const data = await bfPost<{ balance: string }>({ action: "balance" });
  return parseFloat(data.balance);
}

/** Place an order — returns the BulkFollows order ID */
export async function placeOrder(params: {
  serviceId: number;
  link: string;
  quantity: number;
}): Promise<{ orderId: number }> {
  const data = await bfPost<{ order: number }>({
    action: "add",
    service: params.serviceId,
    link: params.link,
    quantity: params.quantity,
  });
  return { orderId: data.order };
}

/** Check status of one BulkFollows order */
export interface BfOrderStatus {
  charge: string;
  start_count: string;
  status: string; // Pending | In progress | Processing | Completed | Partial | Canceled
  remains: string;
  currency: string;
}
export async function getOrderStatus(orderId: number): Promise<BfOrderStatus> {
  return bfPost<BfOrderStatus>({ action: "status", order: orderId });
}

/** Check status of multiple BF orders at once (max 100) */
export async function getMultipleOrderStatus(
  orderIds: number[],
): Promise<Record<string, BfOrderStatus>> {
  return bfPost<Record<string, BfOrderStatus>>({
    action: "status",
    orders: orderIds.join(","),
  });
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

/** Fetch all BulkFollows services with their rates */
export interface BfService {
  service: number;
  name: string;
  type: string;
  rate: string; // price per 1000 in USD
  min: string;
  max: string;
  category: string;
}
export async function getServices(): Promise<BfService[]> {
  const data = await bfPost<BfService[] | Record<string, BfService>>({
    action: "services",
  });
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
  charge: number | null; // USD cost charged by BF
  error: string | null;
  placedAt: string | null;
}

/**
 * Build the profile link for a given platform + username.
 */
function buildLink(platform: string, username: string, postUrl?: string): string {
  const clean = username.replace(/^@/, "").trim();
  if (postUrl) return postUrl;
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
      return `https://www.linkedin.com/in/${clean}`;
    default:
      return clean;
  }
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
    platform?: string;
    postUrl?: string;
  }> = Array.isArray(order.cart) ? order.cart : JSON.parse(order.cart || "[]");

  const platform = order.platform || "instagram";
  const username = order.username || "";

  // Fetch active SMM config mappings
  const configs = await sql`SELECT * FROM smm_config WHERE enabled = true`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configMap = new Map<string, Record<string, any>>();
  for (const c of configs) {
    configMap.set(`${c.platform}:${c.service}`, c);
  }

  const subOrders: SmmSubOrder[] = [];

  for (let i = 0; i < cart.length; i++) {
    const item = cart[i];
    const svc = item.service || "followers";
    const qty = item.qty || item.quantity || 0;
    const itemPlatform = item.platform || platform;

    // Skip if already successfully placed
    const prev = existing.find(
      (e) => e.cartIndex === i && (e.status === "placed" || e.status === "completed"),
    );
    if (prev) {
      subOrders.push(prev);
      continue;
    }

    const config = configMap.get(`${itemPlatform}:${svc}`);
    if (!config || !config.bulkfollows_service_id || config.bulkfollows_service_id === 0) {
      subOrders.push({
        cartIndex: i,
        service: svc,
        platform: itemPlatform,
        qty,
        bfServiceId: 0,
        bfOrderId: null,
        status: "failed",
        charge: null,
        error: `No BulkFollows service ID configured for ${itemPlatform}:${svc}`,
        placedAt: null,
      });
      continue;
    }

    const link = buildLink(itemPlatform, username, item.postUrl);

    try {
      // Retry transient BulkFollows hiccups (429, 5xx, network blips) up to
      // 3 times with jittered exponential backoff. Definitive errors
      // (invalid link, no funds, inactive service) bail out immediately so
      // we don't waste 3-6 seconds on lost causes.
      const result = await withBfRetry(
        () => placeOrder({
          serviceId: config.bulkfollows_service_id,
          link,
          quantity: qty,
        }),
        { maxAttempts: 3, baseDelayMs: 600, label: `placeOrder ${itemPlatform}:${svc}` },
      );

      // Immediately fetch status to get the charge
      const estimatedCharge = estimateBulkFollowsCharge(config.rate_per_1k, qty);
      let charge: number | null = estimatedCharge;
      try {
        const st = await withBfRetry(
          () => getOrderStatus(result.orderId),
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
        qty,
        bfServiceId: config.bulkfollows_service_id,
        bfOrderId: result.orderId,
        status: "placed",
        charge,
        error: null,
        placedAt: new Date().toISOString(),
      });
    } catch (err) {
      subOrders.push({
        cartIndex: i,
        service: svc,
        platform: itemPlatform,
        qty,
        bfServiceId: config.bulkfollows_service_id,
        bfOrderId: null,
        status: "failed",
        charge: null,
        error: err instanceof Error ? err.message : String(err),
        placedAt: null,
      });
    }
  }

  // Convert USD cost → cents (stored as integer)
  const costCents = bulkFollowsCostCents(subOrders.map((sub) => sub.charge));

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
 * Retry a specific failed sub-order within an order.
 */
export async function retrySmmSubOrder(
  orderId: number,
  cartIndex: number,
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

  // Re-fetch config in case it was updated
  const configs = await sql`
    SELECT * FROM smm_config
    WHERE platform = ${sub.platform} AND service = ${sub.service} AND enabled = true
    LIMIT 1
  `;
  const config = configs[0];
  if (!config || !config.bulkfollows_service_id || config.bulkfollows_service_id === 0) {
    sub.error = `No BulkFollows service ID configured for ${sub.platform}:${sub.service}`;
    await sql`UPDATE orders SET smm_orders = ${JSON.stringify(subOrders)}::jsonb WHERE id = ${orderId}`;
    throw new Error(sub.error);
  }

  const username = order.username || "";
  const link = buildLink(sub.platform, username);

  try {
    const result = await withBfRetry(
      () => placeOrder({
        serviceId: config.bulkfollows_service_id,
        link,
        quantity: sub.qty,
      }),
      { maxAttempts: 3, baseDelayMs: 600, label: `retry placeOrder ${sub.platform}:${sub.service}` },
    );

    const estimatedCharge = estimateBulkFollowsCharge(config.rate_per_1k, sub.qty);
    let charge: number | null = estimatedCharge;
    try {
      const st = await withBfRetry(
        () => getOrderStatus(result.orderId),
        { maxAttempts: 2, baseDelayMs: 400, label: `retry getOrderStatus ${result.orderId}` },
      );
      charge = resolveBulkFollowsCharge(st.charge, estimatedCharge);
    } catch { /* non-critical */ }

    sub.bfServiceId = config.bulkfollows_service_id;
    sub.bfOrderId = result.orderId;
    sub.status = "placed";
    sub.charge = charge;
    sub.error = null;
    sub.placedAt = new Date().toISOString();
  } catch (err) {
    sub.error = err instanceof Error ? err.message : String(err);
    // status stays "failed"
  }

  // Recalculate total cost
  const costCents = bulkFollowsCostCents(subOrders.map((subOrder) => subOrder.charge));

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

  // Collect BF order IDs that need status check
  const toCheck = subOrders.filter(
    (s) => s.bfOrderId && (s.status === "placed" || s.status === "pending"),
  );
  if (toCheck.length === 0) return subOrders;

  const bfIds = toCheck.map((s) => s.bfOrderId!);

  try {
    const statuses =
      bfIds.length === 1
        ? { [String(bfIds[0])]: await getOrderStatus(bfIds[0]) }
        : await getMultipleOrderStatus(bfIds);

    for (const sub of subOrders) {
      if (!sub.bfOrderId) continue;
      const st = statuses[String(sub.bfOrderId)];
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
    console.error(`[refreshSmmStatus] BF status check failed for order ${orderId}:`, err);
  }

  const costCents = bulkFollowsCostCents(subOrders.map((sub) => sub.charge));

  const allDone = subOrders.every(
    (s) =>
      s.status === "completed" ||
      s.status === "partial" ||
      s.status === "canceled" ||
      s.status === "failed",
  );
  const allSuccess = subOrders.every(
    (s) => s.status === "completed" || s.status === "partial",
  );

  let newStatus = order.status;
  if (allDone && allSuccess) newStatus = "delivered";
  else if (allDone) newStatus = "partial";

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
 * Fetch BulkFollows service rates and update the smm_config table
 * with a `rate_per_1k` value (USD per 1000 units).
 */
export async function refreshServiceRates(): Promise<{ updated: number; total: number }> {
  const services = await getServices();
  const svcMap = new Map<number, BfService>();
  for (const s of services) {
    svcMap.set(Number(s.service), s);
  }

  const configs = await sql`SELECT * FROM smm_config`;
  let updated = 0;

  for (const config of configs) {
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

  return { updated, total: configs.length };
}
