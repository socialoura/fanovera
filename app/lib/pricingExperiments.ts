import type { SupportedLocale } from "@/app/i18n/types";

export type PricingSegment = {
  page?: string;
  plan?: string;
  country?: string | null;
  locale?: SupportedLocale | string | null;
  userType?: "anonymous" | "authenticated" | string | null;
};

export type PricingVariant = {
  id: string;
  label: string;
  traffic: number;
  priceMultiplier: number;
  pricingStrategy: string;
  paused?: boolean;
  stripePriceIds?: Record<string, string>;
  // Explicit per-pack price overrides in EUR, keyed by `${service}:${qty}`
  // (e.g. "ig_followers:1000": 5.99). When a pack matches an override, that
  // absolute EUR price wins over priceMultiplier — this is what lets a variant
  // express a non-uniform grid (different % change per tier) instead of a flat
  // multiplier. Overrides are EUR-only and ignored for other currencies
  // (see applyPricingAssignment), so an experiment using them effectively
  // targets EUR buyers only.
  priceOverrides?: Record<string, number>;
};

export type PricingExperiment = {
  id: string;
  enabled: boolean;
  traffic: number;
  seed: string;
  productAreas: string[];
  locales?: string[];
  countries?: string[];
  plans?: string[];
  variants: PricingVariant[];
};

export type PricingAssignment = {
  experimentId: string | null;
  variantId: string;
  pricingStrategy: string;
  priceMultiplier: number;
  priceOverrides?: Record<string, number>;
  reason: "assigned" | "disabled" | "not_eligible" | "fallback";
};

const CONTROL_ASSIGNMENT: PricingAssignment = {
  experimentId: null,
  variantId: "control",
  pricingStrategy: "standard",
  priceMultiplier: 1,
  reason: "fallback",
};

export const DEFAULT_EXPERIMENTS: PricingExperiment[] = [
  {
    id: "pricing_public_pages_v1",
    enabled: false,
    traffic: 100,
    seed: "fanovera-pricing-v1",
    productAreas: ["instagram", "tiktok", "youtube", "spotify", "twitch", "facebook", "linkedin", "twitter"],
    variants: [
      { id: "control", label: "Standard", traffic: 50, priceMultiplier: 1, pricingStrategy: "standard" },
      { id: "value_10", label: "Value -10%", traffic: 25, priceMultiplier: 0.9, pricingStrategy: "value_discount" },
      { id: "premium_10", label: "Premium +10%", traffic: 25, priceMultiplier: 1.1, pricingStrategy: "premium_positioning" },
    ],
  },
];

function normalizePriceOverrides(value: unknown): Record<string, number> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    // Key must look like "<service>:<qty>"; value a non-negative EUR price.
    if (!/^[a-z0-9_]+:\d+$/i.test(key)) continue;
    const price = typeof raw === "number" ? raw : Number(raw);
    if (Number.isFinite(price) && price >= 0) out[key] = Math.round(price * 100) / 100;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function normalizePricingExperiments(value: unknown): PricingExperiment[] {
  if (!Array.isArray(value)) return DEFAULT_EXPERIMENTS;

  const experiments = value.flatMap((experiment) => {
    if (!experiment || typeof experiment !== "object") return [];
    const raw = experiment as Partial<PricingExperiment>;
    const variants = Array.isArray(raw.variants)
      ? raw.variants.flatMap((variant) => {
          if (!variant || typeof variant !== "object") return [];
          const v = variant as Partial<PricingVariant>;
          if (!v.id || !v.label || !v.pricingStrategy) return [];
          return [{
            id: String(v.id),
            label: String(v.label),
            traffic: Number(v.traffic) || 0,
            priceMultiplier: Number(v.priceMultiplier) || 1,
            pricingStrategy: String(v.pricingStrategy),
            paused: Boolean(v.paused),
            stripePriceIds: v.stripePriceIds,
            priceOverrides: normalizePriceOverrides(v.priceOverrides),
          }];
        })
      : [];

    if (!raw.id || variants.length === 0) return [];

    return [{
      id: String(raw.id),
      enabled: Boolean(raw.enabled),
      traffic: Number(raw.traffic) || 0,
      seed: String(raw.seed || raw.id),
      productAreas: Array.isArray(raw.productAreas) ? raw.productAreas.map(String) : [],
      locales: Array.isArray(raw.locales) ? raw.locales.map(String) : undefined,
      countries: Array.isArray(raw.countries) ? raw.countries.map(String) : undefined,
      plans: Array.isArray(raw.plans) ? raw.plans.map(String) : undefined,
      variants,
    }];
  });

  return experiments.length > 0 ? experiments : DEFAULT_EXPERIMENTS;
}

function parseExperimentsFromEnv(): PricingExperiment[] {
  const raw =
    process.env.PRICING_EXPERIMENTS_JSON ||
    process.env.NEXT_PUBLIC_PRICING_EXPERIMENTS_JSON ||
    "";
  if (!raw.trim()) return DEFAULT_EXPERIMENTS;

  try {
    return normalizePricingExperiments(JSON.parse(raw));
  } catch {
    return DEFAULT_EXPERIMENTS;
  }
}

export function getPricingExperiments() {
  return parseExperimentsFromEnv().map((experiment) => ({
    ...experiment,
    enabled:
      experiment.enabled &&
      (process.env.PRICING_EXPERIMENTS_ENABLED === "true" ||
        process.env.NEXT_PUBLIC_PRICING_EXPERIMENTS_ENABLED === "true"),
  }));
}

function hashToBucket(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) % 10000;
}

function matchesOptionalList(value: string | null | undefined, allowed?: string[]) {
  if (!allowed || allowed.length === 0) return true;
  if (!value) return false;
  return allowed.includes(value);
}

function isEligible(experiment: PricingExperiment, productArea: string, segment: PricingSegment) {
  return (
    experiment.productAreas.includes(productArea) &&
    matchesOptionalList(segment.locale || null, experiment.locales) &&
    matchesOptionalList(segment.country || null, experiment.countries) &&
    matchesOptionalList(segment.plan || null, experiment.plans)
  );
}

function normalizeTraffic(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(100, value);
}

export function assignPricingVariant(input: {
  anonymousId?: string | null;
  userId?: string | null;
  productArea: string;
  segment?: PricingSegment;
  experiments?: PricingExperiment[];
}): PricingAssignment {
  const identity = input.userId || input.anonymousId;
  if (!identity) return { ...CONTROL_ASSIGNMENT, reason: "fallback" };

  const experiments = input.experiments || getPricingExperiments();
  const segment = input.segment || {};

  for (const experiment of experiments) {
    if (!experiment.enabled) continue;
    if (!isEligible(experiment, input.productArea, segment)) continue;

    const experimentTraffic = normalizeTraffic(experiment.traffic);
    const experimentBucket = hashToBucket(`${experiment.seed}:${experiment.id}:${identity}:experiment`) / 100;
    if (experimentBucket >= experimentTraffic) {
      return { ...CONTROL_ASSIGNMENT, experimentId: experiment.id, reason: "not_eligible" };
    }

    const variantBucket = hashToBucket(`${experiment.seed}:${experiment.id}:${identity}:variant`) / 100;
    let cumulative = 0;
    for (const variant of experiment.variants) {
      cumulative += normalizeTraffic(variant.traffic);
      if (variantBucket < cumulative) {
        // Paused variants keep their bucket but serve control pricing so the
        // overall bucket layout (and other variants' assignments) stays stable
        // while the variant is temporarily disabled.
        if (variant.paused) {
          return { ...CONTROL_ASSIGNMENT, experimentId: experiment.id, reason: "not_eligible" };
        }
        return {
          experimentId: experiment.id,
          variantId: variant.id,
          pricingStrategy: variant.pricingStrategy,
          priceMultiplier: variant.priceMultiplier,
          priceOverrides: variant.priceOverrides,
          reason: "assigned",
        };
      }
    }

    const fallbackVariant =
      experiment.variants.find((variant) => variant.id === "control" && !variant.paused) ||
      experiment.variants.find((variant) => !variant.paused) ||
      experiment.variants[0];
    if (fallbackVariant && !fallbackVariant.paused) {
      return {
        experimentId: experiment.id,
        variantId: fallbackVariant.id,
        pricingStrategy: fallbackVariant.pricingStrategy,
        priceMultiplier: fallbackVariant.priceMultiplier,
        priceOverrides: fallbackVariant.priceOverrides,
        reason: "fallback",
      };
    }
  }

  return { ...CONTROL_ASSIGNMENT, reason: "disabled" };
}

export type PricingContext = {
  service?: string;
  qty?: number;
  /** Display/charge currency. Per-pack overrides only apply when this is EUR. */
  currency?: string;
};

export function applyPricingAssignment(
  amount: number,
  assignment: PricingAssignment,
  context?: PricingContext,
) {
  // Explicit per-pack EUR override wins over the multiplier — but only for EUR
  // (overrides are absolute EUR prices; applying them to USD/GBP/… would be
  // wrong). Non-EUR currencies fall through to the multiplier path unchanged.
  const overrides = assignment.priceOverrides;
  if (
    overrides &&
    context?.service &&
    Number.isFinite(context.qty) &&
    (context.currency === undefined || context.currency.toUpperCase() === "EUR")
  ) {
    const override = overrides[`${context.service}:${context.qty}`];
    if (Number.isFinite(override) && override >= 0) {
      return Math.round(override * 100) / 100;
    }
  }
  const multiplier = Number.isFinite(assignment.priceMultiplier) ? assignment.priceMultiplier : 1;
  return Math.round(amount * multiplier * 100) / 100;
}
