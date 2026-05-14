import Stripe from "stripe";
import { createOrder, getCheckoutPayload, getOrderByPaymentIntent, normalizeCountryCode, sql } from "./db";
import { runSmmForOrder } from "./smm";
import { sendOrderConfirmation } from "./email";
import { captureServerEvent } from "./analytics.server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

/** "FR" → "🇫🇷". Returns "" if the code isn't 2 ASCII letters. */
function countryFlag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "";
  const base = 0x1f1e6 - "A".charCodeAt(0);
  return String.fromCodePoint(base + code.charCodeAt(0)) + String.fromCodePoint(base + code.charCodeAt(1));
}

export type EnsureOrderResult =
  | { ok: true; orderId: number; duplicate?: boolean; smmPlaced: boolean; platform: string; service: string; plan: string }
  | { ok: false; reason: "payment_not_succeeded" | "internal_error"; status?: string };

/**
 * Idempotently materializes the database row for a successful Stripe PaymentIntent,
 * sends the confirmation email, pings Discord, and runs SMM if enabled.
 *
 * Safe to call from:
 *  - the client-driven /api/confirm-order route
 *  - the server-driven /api/stripe-webhook route
 *  - a manual cron retry
 *
 * Idempotency is guaranteed by the unique index `idx_orders_pi_unique` on
 * orders.stripe_payment_intent_id.
 */
export async function ensureOrderForPaymentIntent(
  paymentIntentId: string,
  options: { source: "client" | "webhook" | "cron" } = { source: "client" },
): Promise<EnsureOrderResult> {
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge.payment_method_details", "latest_charge.billing_details"],
    });
    if (pi.status !== "succeeded") {
      return { ok: false, reason: "payment_not_succeeded", status: pi.status };
    }

    const metaForReturn = pi.metadata || {};
    const platformForReturn = String(metaForReturn.platform || "");
    const serviceForReturn = String(metaForReturn.service || "");
    const planForReturn = String(metaForReturn.plan || "");

    const existing = await getOrderByPaymentIntent(paymentIntentId);
    if (existing) {
      return { ok: true, orderId: existing.id, duplicate: true, smmPlaced: false, platform: platformForReturn, service: serviceForReturn, plan: planForReturn };
    }

    const meta = pi.metadata || {};
    const checkoutE2E = process.env.ALLOW_CHECKOUT_E2E === "1" && meta.e2e === "true";
    const persisted = await getCheckoutPayload(paymentIntentId);

    const email = persisted?.email || meta.email || "";
    const username = persisted?.username || meta.username || "";
    const platform = persisted?.platform || meta.platform || "";

    let cart: unknown = persisted?.cart || [];
    try {
      if (!persisted?.cart) cart = JSON.parse(meta.cart || "[]");
    } catch { /* ignore */ }

    // Resolve client country with multi-source fallback (most → least reliable
    // proxy for "where the customer is browsing from"):
    //  1. Vercel/CF geo header captured at checkout time (persisted)
    //  2. Stripe metadata.country mirror (same source, transit)
    //  3. Stripe charge billing address (customer-typed at payment)
    //  4. Stripe card issuance country (network-verified, but indicates the
    //     card's origin, not necessarily the user — last-resort fallback)
    const latestCharge =
      pi.latest_charge && typeof pi.latest_charge === "object"
        ? (pi.latest_charge as Stripe.Charge)
        : null;
    const stripeBillingCountry = latestCharge?.billing_details?.address?.country ?? null;
    const stripeCardCountry =
      latestCharge?.payment_method_details?.card?.country ?? null;

    const resolvedCountry =
      normalizeCountryCode(persisted?.country) ||
      normalizeCountryCode(meta.country) ||
      normalizeCountryCode(stripeBillingCountry) ||
      normalizeCountryCode(stripeCardCountry) ||
      null;

    const persistedFollowers =
      typeof (persisted as { followers_before?: number } | null)?.followers_before === "number"
        ? (persisted as { followers_before: number }).followers_before
        : 0;
    const metaFollowers = Number.parseInt(meta.followersBefore || "", 10);
    const followersBefore = Math.max(
      0,
      Number.isFinite(metaFollowers) ? metaFollowers : 0,
      persistedFollowers || 0,
    );

    const created = await createOrder({
      stripePaymentIntentId: paymentIntentId,
      email,
      username,
      platform,
      cart,
      postAssignments: null,
      totalCents: pi.amount,
      status: "paid",
      followersBefore,
      currency: pi.currency || "eur",
      country: resolvedCountry || undefined,
      lang: (meta.locale || "fr").toLowerCase().split("-")[0].slice(0, 2),
      experimentId: persisted?.experiment_id || meta.experimentId || "",
      variantId: persisted?.variant_id || meta.variantId || "",
      pricingStrategy: persisted?.pricing_strategy || meta.pricing_strategy || "",
      sourcePage: persisted?.source_page || meta.source_page || "",
      plan: persisted?.plan || meta.plan || "",
    });
    const orderId = created.id;

    // Concurrent webhook + client-side confirm raced and a previous call
    // already kicked off the side effects (email, Discord, SMM). Bail out
    // here so we never double-send / double-charge BulkFollows.
    if (!created.isNew) {
      return { ok: true, orderId, duplicate: true, smmPlaced: false, platform: platformForReturn, service: serviceForReturn, plan: planForReturn };
    }

    void captureServerEvent("checkout_completed", meta.anonymousId || email || paymentIntentId, {
      orderId,
      product_area: platform,
      platform,
      amount_cents: pi.amount,
      currency: pi.currency || "eur",
      locale: meta.locale || "",
      country: resolvedCountry || "",
      pathname: meta.source_page || "",
      experimentId: meta.experimentId || "",
      variantId: meta.variantId || "",
      pricing_strategy: meta.pricing_strategy || "",
      ensure_source: options.source,
    });

    if (email && !checkoutE2E) {
      sendOrderConfirmation({
        to: email,
        orderId,
        username,
        platform,
        cart: Array.isArray(cart)
          ? (cart as Array<{ service?: string; label?: string; qty?: number; quantity?: number; price?: number }>)
          : [],
        totalCents: pi.amount,
        currency: pi.currency || "eur",
        locale: meta.locale || "",
      }).catch((err) => {
        console.error("[ensureOrder] Email error:", err);
      });
    }

    const webhookUrl = checkoutE2E ? "" : process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [
              {
                title: options.source === "webhook" ? "🪝 Nouvelle commande (webhook)" : "🎉 Nouvelle commande !",
                color: 0x22c55e,
                fields: [
                  { name: "Email", value: email || "—", inline: true },
                  { name: "Plateforme", value: platform || "—", inline: true },
                  { name: "Username", value: username || "—", inline: true },
                  { name: "Montant", value: `${(pi.amount / 100).toFixed(2)} ${pi.currency?.toUpperCase()}`, inline: true },
                  { name: "Pays", value: resolvedCountry ? `${countryFlag(resolvedCountry)} ${resolvedCountry}` : "—", inline: true },
                ],
                footer: { text: `Order #${orderId} · ${paymentIntentId} · ${options.source}` },
              },
            ],
          }),
        });
      } catch (err) {
        console.error("[ensureOrder] Discord error:", err);
      }
    }

    let smmPlaced = false;
    if (!checkoutE2E) {
      try {
        const toggle = await sql`SELECT value FROM smm_settings WHERE key = 'auto_order_enabled' LIMIT 1`;
        const autoEnabled = toggle[0]?.value === "true";
        if (autoEnabled) {
          await runSmmForOrder(orderId);
          smmPlaced = true;
        }
      } catch (smmErr) {
        console.error("[ensureOrder] SMM auto-order error:", smmErr);
        // Non-blocking: order is still confirmed even if SMM fails.
      }
    }

    return { ok: true, orderId, smmPlaced, platform: platformForReturn, service: serviceForReturn, plan: planForReturn };
  } catch (err) {
    console.error("[ensureOrder] internal error:", err);
    return { ok: false, reason: "internal_error" };
  }
}
