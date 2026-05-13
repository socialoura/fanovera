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
  stripePriceIds?: Record<string, string>;
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
  reason: "assigned" | "disabled" | "not_eligible" | "fallback";
};

const CONTROL_ASSIGNMENT: PricingAssignment = {
  experimentId: null,
  variantId: "control",
  pricingStrategy: "standard",
  priceMultiplier: 1,
  reason: "fallback",
};

const DEFAULT_EXPERIMENTS: PricingExperiment[] = [
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

function parseExperimentsFromEnv(): PricingExperiment[] {
  const raw =
    process.env.PRICING_EXPERIMENTS_JSON ||
    process.env.NEXT_PUBLIC_PRICING_EXPERIMENTS_JSON ||
    "";
  if (!raw.trim()) return DEFAULT_EXPERIMENTS;

  try {
    const parsed = JSON.parse(raw) as PricingExperiment[];
    return Array.isArray(parsed) ? parsed : DEFAULT_EXPERIMENTS;
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
        return {
          experimentId: experiment.id,
          variantId: variant.id,
          pricingStrategy: variant.pricingStrategy,
          priceMultiplier: variant.priceMultiplier,
          reason: "assigned",
        };
      }
    }

    const fallbackVariant = experiment.variants.find((variant) => variant.id === "control") || experiment.variants[0];
    if (fallbackVariant) {
      return {
        experimentId: experiment.id,
        variantId: fallbackVariant.id,
        pricingStrategy: fallbackVariant.pricingStrategy,
        priceMultiplier: fallbackVariant.priceMultiplier,
        reason: "fallback",
      };
    }
  }

  return { ...CONTROL_ASSIGNMENT, reason: "disabled" };
}

export function applyPricingAssignment(amount: number, assignment: PricingAssignment) {
  const multiplier = Number.isFinite(assignment.priceMultiplier) ? assignment.priceMultiplier : 1;
  return Math.round(amount * multiplier * 100) / 100;
}
