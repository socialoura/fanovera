import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS pricing (
      id SERIAL PRIMARY KEY,
      service VARCHAR(20) NOT NULL,
      qty INTEGER NOT NULL,
      price NUMERIC(8,2) NOT NULL,
      price_usd NUMERIC(8,2) DEFAULT 0,
      price_gbp NUMERIC(8,2) DEFAULT 0,
      price_cad NUMERIC(8,2) DEFAULT 0,
      price_nzd NUMERIC(8,2) DEFAULT 0,
      price_aud NUMERIC(8,2) DEFAULT 0,
      price_chf NUMERIC(8,2) DEFAULT 0,
      popular BOOLEAN DEFAULT false,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(service, qty)
    )
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

  await sql`CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`;

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
      value VARCHAR(255) NOT NULL
    )
  `;

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
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Seed global SMM toggle if missing
  const smmToggle = await sql`SELECT key FROM smm_settings WHERE key = 'auto_order_enabled'`;
  if (smmToggle.length === 0) {
    await sql`INSERT INTO smm_settings (key, value) VALUES ('auto_order_enabled', 'true')`;
  }

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
      { platform: "x", service: "x_followers", id: 6068 },
      { platform: "x", service: "x_likes", id: 6069 },
      { platform: "x", service: "x_retweets", id: 6070 },
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
}) {
  const result = await sql`
    INSERT INTO orders (stripe_payment_intent_id, email, username, platform, cart, post_assignments, total_cents, status, followers_before, currency, country, lang)
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
      ${params.lang || "fr"}
    )
    ON CONFLICT (stripe_payment_intent_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      username = EXCLUDED.username,
      platform = EXCLUDED.platform,
      cart = EXCLUDED.cart,
      post_assignments = EXCLUDED.post_assignments,
      total_cents = EXCLUDED.total_cents,
      status = EXCLUDED.status,
      followers_before = EXCLUDED.followers_before,
      currency = EXCLUDED.currency,
      country = EXCLUDED.country,
      lang = EXCLUDED.lang
    RETURNING id
  `;
  return result[0].id;
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

export async function upsertCheckoutPayload(params: {
  paymentIntentId: string;
  email?: string;
  username?: string;
  platform?: string;
  cart?: unknown;
  amountCents: number;
  currency?: string;
}) {
  await sql`
    INSERT INTO checkout_payloads (payment_intent_id, email, username, platform, cart, amount_cents, currency)
    VALUES (
      ${params.paymentIntentId},
      ${params.email || ""},
      ${params.username || ""},
      ${params.platform || ""},
      ${JSON.stringify(params.cart || [])},
      ${params.amountCents},
      ${params.currency || "eur"}
    )
    ON CONFLICT (payment_intent_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      username = EXCLUDED.username,
      platform = EXCLUDED.platform,
      cart = EXCLUDED.cart,
      amount_cents = EXCLUDED.amount_cents,
      currency = EXCLUDED.currency
  `;
}

export async function getCheckoutPayload(paymentIntentId: string) {
  const rows = await sql`
    SELECT * FROM checkout_payloads
    WHERE payment_intent_id = ${paymentIntentId}
    LIMIT 1
  `;
  return rows[0] || null;
}
