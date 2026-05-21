import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS pricing (
      id SERIAL PRIMARY KEY,
      service VARCHAR(20) NOT NULL,
      qty INTEGER NOT NULL,
      price NUMERIC(8,2) NOT NULL,
      price_usd NUMERIC(8,1) DEFAULT 0,
      price_gbp NUMERIC(8,1) DEFAULT 0,
      price_brl NUMERIC(8,1) DEFAULT 0,
      price_try NUMERIC(8,1) DEFAULT 0,
      price_cad NUMERIC(8,1) DEFAULT 0,
      price_nzd NUMERIC(8,1) DEFAULT 0,
      price_aud NUMERIC(8,1) DEFAULT 0,
      price_chf NUMERIC(8,1) DEFAULT 0,
      price_mxn NUMERIC(8,1) DEFAULT 0,
      price_sek NUMERIC(8,1) DEFAULT 0,
      popular BOOLEAN DEFAULT false,
      active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(service, qty)
    )
  `;

  await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS price_brl NUMERIC(8,1) DEFAULT 0`;
  await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS price_try NUMERIC(8,1) DEFAULT 0`;
  await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS price_mxn NUMERIC(8,1) DEFAULT 0`;
  await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS price_sek NUMERIC(8,1) DEFAULT 0`;
  await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`;

  await sql`
    ALTER TABLE pricing
      ALTER COLUMN price_usd TYPE NUMERIC(8,1) USING ROUND(price_usd::numeric, 1),
      ALTER COLUMN price_gbp TYPE NUMERIC(8,1) USING ROUND(price_gbp::numeric, 1),
      ALTER COLUMN price_brl TYPE NUMERIC(8,1) USING ROUND(price_brl::numeric, 1),
      ALTER COLUMN price_try TYPE NUMERIC(8,1) USING ROUND(price_try::numeric, 1),
      ALTER COLUMN price_cad TYPE NUMERIC(8,1) USING ROUND(price_cad::numeric, 1),
      ALTER COLUMN price_nzd TYPE NUMERIC(8,1) USING ROUND(price_nzd::numeric, 1),
      ALTER COLUMN price_aud TYPE NUMERIC(8,1) USING ROUND(price_aud::numeric, 1),
      ALTER COLUMN price_chf TYPE NUMERIC(8,1) USING ROUND(price_chf::numeric, 1),
      ALTER COLUMN price_mxn TYPE NUMERIC(8,1) USING ROUND(price_mxn::numeric, 1),
      ALTER COLUMN price_sek TYPE NUMERIC(8,1) USING ROUND(price_sek::numeric, 1)
  `;

  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pricing_qty_gt_0') THEN
        ALTER TABLE pricing ADD CONSTRAINT pricing_qty_gt_0 CHECK (qty > 0) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pricing_price_eur_non_negative') THEN
        ALTER TABLE pricing ADD CONSTRAINT pricing_price_eur_non_negative CHECK (price >= 0) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pricing_price_usd_non_negative') THEN
        ALTER TABLE pricing ADD CONSTRAINT pricing_price_usd_non_negative CHECK (price_usd >= 0) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pricing_price_gbp_non_negative') THEN
        ALTER TABLE pricing ADD CONSTRAINT pricing_price_gbp_non_negative CHECK (price_gbp >= 0) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pricing_price_brl_non_negative') THEN
        ALTER TABLE pricing ADD CONSTRAINT pricing_price_brl_non_negative CHECK (price_brl >= 0) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pricing_price_try_non_negative') THEN
        ALTER TABLE pricing ADD CONSTRAINT pricing_price_try_non_negative CHECK (price_try >= 0) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pricing_price_cad_non_negative') THEN
        ALTER TABLE pricing ADD CONSTRAINT pricing_price_cad_non_negative CHECK (price_cad >= 0) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pricing_price_nzd_non_negative') THEN
        ALTER TABLE pricing ADD CONSTRAINT pricing_price_nzd_non_negative CHECK (price_nzd >= 0) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pricing_price_aud_non_negative') THEN
        ALTER TABLE pricing ADD CONSTRAINT pricing_price_aud_non_negative CHECK (price_aud >= 0) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pricing_price_chf_non_negative') THEN
        ALTER TABLE pricing ADD CONSTRAINT pricing_price_chf_non_negative CHECK (price_chf >= 0) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pricing_price_mxn_non_negative') THEN
        ALTER TABLE pricing ADD CONSTRAINT pricing_price_mxn_non_negative CHECK (price_mxn >= 0) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pricing_price_sek_non_negative') THEN
        ALTER TABLE pricing ADD CONSTRAINT pricing_price_sek_non_negative CHECK (price_sek >= 0) NOT VALID;
      END IF;
    END
    $$;
  `;

  await sql`
    UPDATE pricing
    SET popular = false
    WHERE id IN (
      SELECT id
      FROM (
        SELECT
          id,
          ROW_NUMBER() OVER (PARTITION BY service ORDER BY active DESC, qty ASC, id ASC) AS rank
        FROM pricing
        WHERE popular = true
      ) ranked
      WHERE rank > 1
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pricing_one_popular_per_service
    ON pricing(service)
    WHERE popular = true
  `;

  await sql`
    UPDATE pricing
    SET sort_order = ranked.rank * 1000
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY service ORDER BY qty ASC, id ASC) AS rank
      FROM pricing
      WHERE COALESCE(sort_order, 0) = 0
    ) ranked
    WHERE pricing.id = ranked.id
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      stripe_payment_intent_id VARCHAR(255),
      email VARCHAR(255),
      username VARCHAR(100) NOT NULL,
      platform VARCHAR(20) NOT NULL,
      cart JSONB NOT NULL,
      post_assignments JSONB,
      total_cents INTEGER NOT NULL,
      cost_cents INTEGER DEFAULT 0,
      currency VARCHAR(3) DEFAULT 'eur',
      experiment_id VARCHAR(120) DEFAULT '',
      variant_id VARCHAR(120) DEFAULT '',
      pricing_strategy VARCHAR(120) DEFAULT '',
      source_page VARCHAR(160) DEFAULT '',
      plan VARCHAR(80) DEFAULT '',
      status VARCHAR(20) DEFAULT 'pending',
      followers_before INTEGER DEFAULT 0,
      country VARCHAR(2) DEFAULT NULL,
      lang VARCHAR(2) DEFAULT 'fr',
      smm_orders JSONB DEFAULT '[]',
      delivered_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_pi_unique ON orders(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS experiment_id VARCHAR(120) DEFAULT ''`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS variant_id VARCHAR(120) DEFAULT ''`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pricing_strategy VARCHAR(120) DEFAULT ''`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS source_page VARCHAR(160) DEFAULT ''`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS plan VARCHAR(80) DEFAULT ''`;

  await sql`CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_experiment_variant ON orders(experiment_id, variant_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS smm_config (
      id SERIAL PRIMARY KEY,
      platform VARCHAR(20) NOT NULL,
      service VARCHAR(30) NOT NULL,
      bulkfollows_service_id INTEGER NOT NULL,
      rate_per_1k NUMERIC(10,4) DEFAULT 0,
      enabled BOOLEAN DEFAULT true,
      UNIQUE(platform, service)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS smm_settings (
      key VARCHAR(50) PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;
  await sql`ALTER TABLE smm_settings ALTER COLUMN value TYPE TEXT`;

  await sql`
    CREATE TABLE IF NOT EXISTS upsells (
      id SERIAL PRIMARY KEY,
      service VARCHAR(30) NOT NULL,
      qty INTEGER NOT NULL,
      label VARCHAR(100) NOT NULL DEFAULT '',
      label_en VARCHAR(100) NOT NULL DEFAULT '',
      active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS support_messages (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      replied BOOLEAN DEFAULT false,
      reply_text TEXT,
      replied_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_support_messages_created ON support_messages(created_at DESC)`;
  await sql`ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS parent_id INTEGER`;
  await sql`ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS sender_type VARCHAR(10) DEFAULT 'client'`;
  await sql`CREATE INDEX IF NOT EXISTS idx_support_messages_parent ON support_messages(parent_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS visits_by_country (
      id SERIAL PRIMARY KEY,
      country VARCHAR(2) NOT NULL,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      count INTEGER NOT NULL DEFAULT 1,
      UNIQUE(country, date)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ad_costs (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL UNIQUE,
      cost_cents INTEGER NOT NULL DEFAULT 0,
      note VARCHAR(255) DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS scheduled_emails (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id),
      email VARCHAR(255) NOT NULL,
      username VARCHAR(100) NOT NULL,
      platform VARCHAR(20) NOT NULL,
      template VARCHAR(20) NOT NULL,
      send_at TIMESTAMPTZ NOT NULL,
      sent BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS checkout_payloads (
      payment_intent_id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) DEFAULT '',
      username VARCHAR(100) DEFAULT '',
      platform VARCHAR(20) DEFAULT '',
      cart JSONB NOT NULL DEFAULT '[]',
      amount_cents INTEGER NOT NULL DEFAULT 0,
      currency VARCHAR(3) DEFAULT 'eur',
      experiment_id VARCHAR(120) DEFAULT '',
      variant_id VARCHAR(120) DEFAULT '',
      pricing_strategy VARCHAR(120) DEFAULT '',
      source_page VARCHAR(160) DEFAULT '',
      plan VARCHAR(80) DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS experiment_id VARCHAR(120) DEFAULT ''`;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS variant_id VARCHAR(120) DEFAULT ''`;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS pricing_strategy VARCHAR(120) DEFAULT ''`;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS source_page VARCHAR(160) DEFAULT ''`;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS plan VARCHAR(80) DEFAULT ''`;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_country ON orders(country)`;

  await sql`
    CREATE TABLE IF NOT EXISTS pricing_experiment_exposures (
      id SERIAL PRIMARY KEY,
      anonymous_id VARCHAR(160) NOT NULL,
      experiment_id VARCHAR(120) NOT NULL,
      variant_id VARCHAR(120) NOT NULL,
      pricing_strategy VARCHAR(120) DEFAULT '',
      product_area VARCHAR(80) DEFAULT '',
      plan VARCHAR(80) DEFAULT '',
      locale VARCHAR(12) DEFAULT '',
      country VARCHAR(12) DEFAULT '',
      price NUMERIC(12, 2) DEFAULT 0,
      currency VARCHAR(3) DEFAULT 'EUR',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(anonymous_id, experiment_id, variant_id, product_area)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_pricing_exposures_experiment_variant ON pricing_experiment_exposures(experiment_id, variant_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_pricing_exposures_created ON pricing_experiment_exposures(created_at DESC)`;

  await sql`
    CREATE TABLE IF NOT EXISTS product_page_visits (
      id SERIAL PRIMARY KEY,
      anonymous_id VARCHAR(160) NOT NULL,
      platform VARCHAR(40) NOT NULL,
      country VARCHAR(12) DEFAULT '',
      locale VARCHAR(12) DEFAULT '',
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(anonymous_id, platform, date)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_product_visits_platform_date ON product_page_visits(platform, date DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_product_visits_created ON product_page_visits(created_at DESC)`;

  // Seed global SMM toggle if missing
  const smmToggle = await sql`SELECT key FROM smm_settings WHERE key = 'auto_order_enabled'`;
  if (smmToggle.length === 0) {
    await sql`INSERT INTO smm_settings (key, value) VALUES ('auto_order_enabled', 'true')`;
  }
  await sql`
    INSERT INTO smm_settings (key, value)
    VALUES ('marketing_mode', 'clean')
    ON CONFLICT (key) DO NOTHING
  `;

  // Seed smm_config if empty
  const smmCount = await sql`SELECT COUNT(*) as cnt FROM smm_config`;
  if (Number(smmCount[0].cnt) === 0) {
    const mappings = [
      { platform: "tiktok", service: "followers", id: 14372 },
      { platform: "tiktok", service: "likes", id: 14256 },
      { platform: "tiktok", service: "views", id: 14563 },
      { platform: "instagram", service: "followers", id: 14565 },
      { platform: "instagram", service: "likes", id: 14517 },
      { platform: "instagram", service: "views", id: 4996 },
      { platform: "youtube", service: "yt_subscribers", id: 887 },
      { platform: "youtube", service: "yt_likes", id: 14547 },
      { platform: "youtube", service: "yt_views", id: 14370 },
      { platform: "spotify", service: "sp_streams", id: 5765 },
      { platform: "twitter", service: "x_followers", id: 6068 },
      { platform: "twitter", service: "x_likes", id: 6069 },
      { platform: "twitter", service: "x_retweets", id: 6070 },
      { platform: "twitch", service: "tw_followers", id: 5912 },
      { platform: "twitch", service: "tw_live_viewers", id: 5913 },
      { platform: "facebook", service: "fb_followers", id: 5660 },
      { platform: "facebook", service: "fb_likes", id: 5661 },
      { platform: "linkedin", service: "li_followers", id: 0 },
    ];
    for (const m of mappings) {
      await sql`INSERT INTO smm_config (platform, service, bulkfollows_service_id) VALUES (${m.platform}, ${m.service}, ${m.id}) ON CONFLICT DO NOTHING`;
    }
  }
}

// ── Orders ──

export async function createOrder(params: {
  stripePaymentIntentId: string;
  email: string;
  username: string;
  platform: string;
  cart: unknown;
  postAssignments: unknown;
  totalCents: number;
  status?: string;
  followersBefore?: number;
  currency?: string;
  country?: string;
  lang?: string;
  experimentId?: string | null;
  variantId?: string | null;
  pricingStrategy?: string | null;
  sourcePage?: string | null;
  plan?: string | null;
}) {
  try {
    // ON CONFLICT DO NOTHING is critical for idempotency: when both the
    // client-driven /api/confirm-order and the Stripe webhook race to
    // materialize the same payment intent, only ONE caller will see a row
    // returned. The other lookup path (`SELECT ... WHERE pi_id = ...`) is
    // used to fetch the already-existing id without firing side effects
    // (email, Discord, SMM) twice.
    const result = await sql`
      INSERT INTO orders (stripe_payment_intent_id, email, username, platform, cart, post_assignments, total_cents, status, followers_before, currency, country, lang, experiment_id, variant_id, pricing_strategy, source_page, plan)
      VALUES (
        ${params.stripePaymentIntentId},
        ${params.email},
        ${params.username},
        ${params.platform},
        ${JSON.stringify(params.cart)},
        ${params.postAssignments ? JSON.stringify(params.postAssignments) : null},
        ${params.totalCents},
        ${params.status || "pending"},
        ${params.followersBefore || 0},
        ${params.currency || "eur"},
        ${params.country || null},
        ${params.lang || "fr"},
        ${params.experimentId || ""},
        ${params.variantId || ""},
        ${params.pricingStrategy || ""},
        ${params.sourcePage || ""},
        ${params.plan || ""}
      )
      ON CONFLICT (stripe_payment_intent_id) DO NOTHING
      RETURNING id
    `;
    if (result.length > 0) {
      const id = (result[0] as { id: number }).id;
      return { id, isNew: true };
    }

    // Concurrent insert won the race — fetch the existing row id.
    const existing = await sql`
      SELECT id FROM orders WHERE stripe_payment_intent_id = ${params.stripePaymentIntentId} LIMIT 1
    `;
    if (existing.length === 0) {
      // Should never happen: ON CONFLICT triggered but the row is gone.
      throw new Error(`createOrder: conflict but row not found for ${params.stripePaymentIntentId}`);
    }
    return { id: (existing[0] as { id: number }).id, isNew: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.toLowerCase().includes("no unique or exclusion constraint")) {
      throw err;
    }

    // Fallback path when the unique index is missing (very early deployments).
    // We can't tell new vs. existing here — assume new to be safe (caller will
    // de-dupe via getOrderByPaymentIntent on next request anyway).
    const result = await sql`
      INSERT INTO orders (stripe_payment_intent_id, email, username, platform, cart, post_assignments, total_cents, status, followers_before, currency, country, lang, experiment_id, variant_id, pricing_strategy, source_page, plan)
      VALUES (
        ${params.stripePaymentIntentId},
        ${params.email},
        ${params.username},
        ${params.platform},
        ${JSON.stringify(params.cart)},
        ${params.postAssignments ? JSON.stringify(params.postAssignments) : null},
        ${params.totalCents},
        ${params.status || "pending"},
        ${params.followersBefore || 0},
        ${params.currency || "eur"},
        ${params.country || null},
        ${params.lang || "fr"},
        ${params.experimentId || ""},
        ${params.variantId || ""},
        ${params.pricingStrategy || ""},
        ${params.sourcePage || ""},
        ${params.plan || ""}
      )
      RETURNING id
    `;
    return { id: (result[0] as { id: number }).id, isNew: true };
  }
}

export async function updateOrderStatus(stripePaymentIntentId: string, status: string) {
  await sql`UPDATE orders SET status = ${status} WHERE stripe_payment_intent_id = ${stripePaymentIntentId}`;
}

export async function getOrderByPaymentIntent(piId: string) {
  const rows = await sql`SELECT * FROM orders WHERE stripe_payment_intent_id = ${piId} LIMIT 1`;
  return rows[0] || null;
}

export async function getOrderById(id: number) {
  const rows = await sql`SELECT * FROM orders WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

export async function getOrdersByEmail(email: string, limit = 10) {
  return await sql`
    SELECT id, username, platform, cart, total_cents, currency, status,
           lang, created_at, delivered_at, followers_before
    FROM orders
    WHERE LOWER(email) = LOWER(${email})
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}

export async function updateOrderStatusById(id: number, status: string) {
  if (status === "delivered") {
    await sql`UPDATE orders SET status = ${status}, delivered_at = NOW() WHERE id = ${id}`;
  } else {
    await sql`UPDATE orders SET status = ${status} WHERE id = ${id}`;
  }
}

// ── Support Messages ──

export async function createSupportMessage(email: string, message: string): Promise<number> {
  const result = await sql`
    INSERT INTO support_messages (email, message)
    VALUES (${email}, ${message})
    RETURNING id
  `;
  return result[0].id;
}

export async function getSupportMessages() {
  return await sql`SELECT * FROM support_messages ORDER BY created_at DESC LIMIT 200`;
}

export async function replySupportMessage(id: number, replyText: string) {
  await sql`
    UPDATE support_messages
    SET replied = true, reply_text = ${replyText}, replied_at = NOW()
    WHERE id = ${id}
  `;
}

export async function getSupportMessageById(id: number) {
  const rows = await sql`SELECT * FROM support_messages WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

export async function getSupportThreadReplies(rootId: number) {
  return await sql`
    SELECT * FROM support_messages
    WHERE parent_id = ${rootId}
    ORDER BY created_at ASC
  `;
}

export async function getSupportThreads() {
  const roots = await sql`
    SELECT * FROM support_messages
    WHERE parent_id IS NULL
    ORDER BY created_at DESC
    LIMIT 200
  `;
  if (roots.length === 0) return [];

  const rootIds = roots.map((r) => r.id);
  const children = await sql`
    SELECT * FROM support_messages
    WHERE parent_id = ANY(${rootIds})
    ORDER BY created_at ASC
  `;

  const childrenByParent = new Map<number, typeof children>();
  for (const child of children) {
    const list = childrenByParent.get(child.parent_id) || [];
    list.push(child);
    childrenByParent.set(child.parent_id, list);
  }

  return roots.map((r) => ({ ...r, replies: childrenByParent.get(r.id) || [] }));
}

export async function insertSupportReply(params: {
  parentId: number;
  senderType: "admin" | "client";
  email: string;
  message: string;
}): Promise<number> {
  const result = await sql`
    INSERT INTO support_messages (email, message, parent_id, sender_type, replied)
    VALUES (${params.email}, ${params.message}, ${params.parentId}, ${params.senderType}, true)
    RETURNING id
  `;
  return result[0].id;
}

export async function reopenSupportThread(rootId: number) {
  await sql`UPDATE support_messages SET replied = false WHERE id = ${rootId}`;
}

export async function markThreadReplied(rootId: number, replyText: string) {
  await sql`
    UPDATE support_messages
    SET replied = true,
        reply_text = COALESCE(reply_text, ${replyText}),
        replied_at = COALESCE(replied_at, NOW())
    WHERE id = ${rootId}
  `;
}

export async function upsertCheckoutPayload(params: {
  paymentIntentId: string;
  email?: string;
  username?: string;
  platform?: string;
  cart?: unknown;
  amountCents: number;
  currency?: string;
  experimentId?: string | null;
  variantId?: string | null;
  pricingStrategy?: string | null;
  sourcePage?: string | null;
  plan?: string | null;
  /** ISO-3166-1 alpha-2 country code captured server-side (Vercel/CF geo). */
  country?: string | null;
  /**
   * Audience size at checkout time (followers / subscribers / monthly listeners
   * depending on the platform). Captured client-side from the profile preview
   * so we know the baseline against which delivery is measured.
   */
  followersBefore?: number | null;
}) {
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS experiment_id VARCHAR(120) DEFAULT ''`;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS variant_id VARCHAR(120) DEFAULT ''`;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS pricing_strategy VARCHAR(120) DEFAULT ''`;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS source_page VARCHAR(160) DEFAULT ''`;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS plan VARCHAR(80) DEFAULT ''`;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT NULL`;
  await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS followers_before INTEGER DEFAULT 0`;

  const normalizedCountry = normalizeCountryCode(params.country);
  const followersBefore =
    typeof params.followersBefore === "number" && Number.isFinite(params.followersBefore) && params.followersBefore >= 0
      ? Math.trunc(params.followersBefore)
      : 0;

  await sql`
    INSERT INTO checkout_payloads (payment_intent_id, email, username, platform, cart, amount_cents, currency, experiment_id, variant_id, pricing_strategy, source_page, plan, country, followers_before)
    VALUES (
      ${params.paymentIntentId},
      ${params.email || ""},
      ${params.username || ""},
      ${params.platform || ""},
      ${JSON.stringify(params.cart || [])},
      ${params.amountCents},
      ${params.currency || "eur"},
      ${params.experimentId || ""},
      ${params.variantId || ""},
      ${params.pricingStrategy || ""},
      ${params.sourcePage || ""},
      ${params.plan || ""},
      ${normalizedCountry},
      ${followersBefore}
    )
    ON CONFLICT (payment_intent_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      username = EXCLUDED.username,
      platform = EXCLUDED.platform,
      cart = EXCLUDED.cart,
      amount_cents = EXCLUDED.amount_cents,
      currency = EXCLUDED.currency,
      experiment_id = EXCLUDED.experiment_id,
      variant_id = EXCLUDED.variant_id,
      pricing_strategy = EXCLUDED.pricing_strategy,
      source_page = EXCLUDED.source_page,
      plan = EXCLUDED.plan,
      country = COALESCE(EXCLUDED.country, checkout_payloads.country),
      followers_before = GREATEST(EXCLUDED.followers_before, checkout_payloads.followers_before)
  `;
}

/**
 * Returns a clean 2-letter uppercase ISO country code, or null if invalid.
 * Accepts inputs like " fr ", "FRA", "us", undefined, etc.
 */
export function normalizeCountryCode(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(trimmed)) return null;
  return trimmed;
}

export async function getCheckoutPayload(paymentIntentId: string) {
  const rows = await sql`
    SELECT * FROM checkout_payloads
    WHERE payment_intent_id = ${paymentIntentId}
    LIMIT 1
  `;
  return rows[0] || null;
}
