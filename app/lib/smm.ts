/**
 * BulkFollows SMM API client
 * Docs: https://bulkfollows.com/api
 *
 * Every call goes through `bfPost` which handles auth + error wrapping.
 */

import { sql } from "./db";

const BF_URL = "https://bulkfollows.com/api/v2";

function apiKey(): string {
  const k = process.env.BULKFOLLOWS_API_KEY;
  if (!k) throw new Error("BULKFOLLOWS_API_KEY is not set");
  return k;
}

// ── Low-level request ──

async function bfPost<T = Record<string, unknown>>(
  params: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(BF_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: apiKey(), ...params }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`BulkFollows: ${data.error}`);
  return data as T;
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
  let totalCostUsd = 0;

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
      if (prev.charge) totalCostUsd += prev.charge;
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
      const result = await placeOrder({
        serviceId: config.bulkfollows_service_id,
        link,
        quantity: qty,
      });

      // Immediately fetch status to get the charge
      let charge: number | null = null;
      try {
        const st = await getOrderStatus(result.orderId);
        charge = parseFloat(st.charge) || null;
        if (charge) totalCostUsd += charge;
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
  const costCents = Math.round(totalCostUsd * 100);

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
    const result = await placeOrder({
      serviceId: config.bulkfollows_service_id,
      link,
      quantity: sub.qty,
    });

    let charge: number | null = null;
    try {
      const st = await getOrderStatus(result.orderId);
      charge = parseFloat(st.charge) || null;
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
  const totalCostUsd = subOrders.reduce((sum, s) => sum + (s.charge || 0), 0);
  const costCents = Math.round(totalCostUsd * 100);

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

      const charge = parseFloat(st.charge) || null;
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

  const totalCostUsd = subOrders.reduce((sum, s) => sum + (s.charge || 0), 0);
  const costCents = Math.round(totalCostUsd * 100);

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
    await sql`
      UPDATE orders
      SET smm_orders = ${JSON.stringify(subOrders)}::jsonb,
          cost_cents = ${costCents},
          status = ${newStatus},
          delivered_at = NOW()
      WHERE id = ${orderId}
    `;
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
