/**
 * Thin wrapper around the Google Ads API for syncing campaign costs and
 * click → campaign attribution into our own DB.
 *
 * Designed to fail-soft when:
 *   - env vars are missing (e.g. before the Developer Token is approved)
 *   - the `google-ads-api` npm package is not installed
 *
 * In both cases the helpers return empty arrays and log a single warning so
 * the daily cron job becomes a no-op instead of crashing.
 */

export type CampaignCostRow = {
  date: string; // YYYY-MM-DD
  campaignId: string; // stringified BIGINT
  campaignName: string;
  costCents: number;
  clicks: number;
  impressions: number;
  conversions: number;
};

export type GclidCampaignRow = {
  gclid: string;
  campaignId: string;
  campaignName: string;
  adGroupId: string | null;
  clickDate: string; // YYYY-MM-DD
};

type GoogleAdsConfig = {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  loginCustomerId: string;
  customerId: string;
};

function readConfig(): GoogleAdsConfig | null {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || "";
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN || "";
  const loginCustomerId = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "").replace(/-/g, "");
  const customerId = (process.env.GOOGLE_ADS_CUSTOMER_ID || "").replace(/-/g, "");

  if (!developerToken || !clientId || !clientSecret || !refreshToken || !customerId) {
    return null;
  }
  return { developerToken, clientId, clientSecret, refreshToken, loginCustomerId, customerId };
}

// google-ads-api uses heavy CJS internals; lazy-load it so the module is only
// pulled in when env is fully configured. Cached per process.
let cachedCustomer: unknown = null;
let cachedLib: unknown = null;

async function getCustomer(config: GoogleAdsConfig): Promise<unknown | null> {
  if (cachedCustomer) return cachedCustomer;
  try {
    if (!cachedLib) {
      // Dynamic spec stored in a variable so `tsc` does not require the
      // module to be installed at type-check time. The package is optional —
      // install it with `npm i google-ads-api` when activating the sync.
      const pkg = "google-ads-api";
      cachedLib = await import(/* webpackIgnore: true */ pkg);
    }
    const lib = cachedLib as { GoogleAdsApi: new (args: Record<string, string>) => unknown };
    const client = new lib.GoogleAdsApi({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      developer_token: config.developerToken,
    }) as {
      Customer: (args: { customer_id: string; refresh_token: string; login_customer_id?: string }) => unknown;
    };
    cachedCustomer = client.Customer({
      customer_id: config.customerId,
      refresh_token: config.refreshToken,
      login_customer_id: config.loginCustomerId || undefined,
    });
    return cachedCustomer;
  } catch (err) {
    console.warn("[googleAdsClient] failed to init customer:", (err as Error).message);
    return null;
  }
}

function microsToCents(micros: number | string | null | undefined): number {
  const n = typeof micros === "string" ? Number(micros) : micros;
  if (!Number.isFinite(n) || !n) return 0;
  // 1 EUR = 1_000_000 micros = 100 cents → divide by 10_000
  return Math.round((n as number) / 10_000);
}

function isoDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  if (typeof d === "string") return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/**
 * Pull campaign-level cost / clicks / conversions for the last `daysBack`
 * days (inclusive of today). Returns an empty array when the API is not
 * configured.
 */
export async function fetchCampaignCosts(daysBack: number): Promise<CampaignCostRow[]> {
  const config = readConfig();
  if (!config) {
    console.warn("[googleAdsClient] env not configured — skipping fetchCampaignCosts");
    return [];
  }
  const customer = (await getCustomer(config)) as
    | { query: (gaql: string) => Promise<Array<Record<string, unknown>>> }
    | null;
  if (!customer) return [];

  const days = Math.max(1, Math.min(90, Math.floor(daysBack)));
  const gaql = `
    SELECT
      campaign.id,
      campaign.name,
      segments.date,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.conversions
    FROM campaign
    WHERE segments.date DURING LAST_${days}_DAYS
  `;

  try {
    const rows = await customer.query(gaql);
    const out: CampaignCostRow[] = [];
    for (const r of rows) {
      const campaign = r.campaign as { id?: string | number; name?: string } | undefined;
      const segments = r.segments as { date?: string } | undefined;
      const metrics = r.metrics as
        | { cost_micros?: number | string; clicks?: number | string; impressions?: number | string; conversions?: number | string }
        | undefined;
      if (!campaign?.id || !segments?.date) continue;
      out.push({
        date: isoDate(segments.date),
        campaignId: String(campaign.id),
        campaignName: campaign.name || "",
        costCents: microsToCents(metrics?.cost_micros),
        clicks: Number(metrics?.clicks) || 0,
        impressions: Number(metrics?.impressions) || 0,
        conversions: Number(metrics?.conversions) || 0,
      });
    }
    return out;
  } catch (err) {
    console.error("[googleAdsClient] fetchCampaignCosts failed:", (err as Error).message);
    return [];
  }
}

/**
 * Pull the mapping (gclid → campaign_id) for the last `daysBack` days from
 * the click_view resource. This is the bridge that lets us join each of our
 * Stripe orders back to the campaign that produced the click.
 *
 * NB: click_view requires segments.date in the WHERE clause and is limited
 * to the last 90 days by the API itself.
 */
export async function fetchClickToCampaignMap(daysBack: number): Promise<GclidCampaignRow[]> {
  const config = readConfig();
  if (!config) {
    console.warn("[googleAdsClient] env not configured — skipping fetchClickToCampaignMap");
    return [];
  }
  const customer = (await getCustomer(config)) as
    | { query: (gaql: string) => Promise<Array<Record<string, unknown>>> }
    | null;
  if (!customer) return [];

  const days = Math.max(1, Math.min(90, Math.floor(daysBack)));
  const gaql = `
    SELECT
      click_view.gclid,
      campaign.id,
      campaign.name,
      ad_group.id,
      segments.date
    FROM click_view
    WHERE segments.date DURING LAST_${days}_DAYS
  `;

  try {
    const rows = await customer.query(gaql);
    const out: GclidCampaignRow[] = [];
    for (const r of rows) {
      const click = r.click_view as { gclid?: string } | undefined;
      const campaign = r.campaign as { id?: string | number; name?: string } | undefined;
      const adGroup = r.ad_group as { id?: string | number } | undefined;
      const segments = r.segments as { date?: string } | undefined;
      if (!click?.gclid || !campaign?.id || !segments?.date) continue;
      out.push({
        gclid: click.gclid,
        campaignId: String(campaign.id),
        campaignName: campaign.name || "",
        adGroupId: adGroup?.id ? String(adGroup.id) : null,
        clickDate: isoDate(segments.date),
      });
    }
    return out;
  } catch (err) {
    console.error("[googleAdsClient] fetchClickToCampaignMap failed:", (err as Error).message);
    return [];
  }
}

/** Surface readiness state so the admin / cron can show a status badge. */
export function googleAdsConfigured(): boolean {
  return readConfig() !== null;
}
