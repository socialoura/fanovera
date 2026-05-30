import { describe, expect, it } from "vitest";
import { calculateCheckoutPricing } from "../app/lib/checkoutPricing";
import { DEFAULT_PROMO_CODE, TEST_PROMO_CODE, TestPromoDisabledError } from "../app/lib/promoCodes";
import { applyPricingAssignment, assignPricingVariant, normalizePricingExperiments, type PricingExperiment } from "../app/lib/pricingExperiments";

const enabledExperiment: PricingExperiment = {
  id: "pricing_test",
  enabled: true,
  traffic: 100,
  seed: "test",
  productAreas: ["instagram"],
  variants: [
    { id: "control", label: "Control", traffic: 50, priceMultiplier: 1, pricingStrategy: "standard" },
    { id: "discount", label: "Discount", traffic: 50, priceMultiplier: 0.9, pricingStrategy: "discount" },
  ],
};

describe("pricing experiments", () => {
  it("assigns stable variants for the same identity", () => {
    const first = assignPricingVariant({
      anonymousId: "anon_123",
      productArea: "instagram",
      experiments: [enabledExperiment],
    });
    const second = assignPricingVariant({
      anonymousId: "anon_123",
      productArea: "instagram",
      experiments: [enabledExperiment],
    });
    expect(second).toEqual(first);
  });

  it("falls back cleanly when disabled or ineligible", () => {
    expect(assignPricingVariant({ anonymousId: "a", productArea: "youtube", experiments: [enabledExperiment] }).variantId).toBe("control");
    expect(assignPricingVariant({ anonymousId: "a", productArea: "instagram", experiments: [{ ...enabledExperiment, enabled: false }] }).reason).toBe("disabled");
  });

  it("applies price multipliers predictably", () => {
    expect(applyPricingAssignment(10, { experimentId: "x", variantId: "v", pricingStrategy: "test", priceMultiplier: 0.9, reason: "assigned" })).toBe(9);
  });

  it("applies per-pack EUR overrides over the multiplier, EUR-only", () => {
    const assignment = {
      experimentId: "x", variantId: "grid", pricingStrategy: "grid", priceMultiplier: 1,
      priceOverrides: { "ig_followers:1000": 5.99 }, reason: "assigned" as const,
    };
    // EUR + matching pack → override wins (base price ignored)
    expect(applyPricingAssignment(3.99, assignment, { service: "ig_followers", qty: 1000, currency: "EUR" })).toBe(5.99);
    // non-EUR → override ignored, multiplier path
    expect(applyPricingAssignment(3.99, assignment, { service: "ig_followers", qty: 1000, currency: "USD" })).toBe(3.99);
    // no matching pack → multiplier path
    expect(applyPricingAssignment(2.49, assignment, { service: "ig_followers", qty: 500, currency: "EUR" })).toBe(2.49);
    // no context → multiplier path (back-compat)
    expect(applyPricingAssignment(3.99, assignment)).toBe(3.99);
  });

  it("normalizes and rejects malformed price overrides", () => {
    const [exp] = normalizePricingExperiments([
      {
        id: "grid", enabled: true, traffic: 100, seed: "s", productAreas: ["instagram"],
        variants: [{
          id: "b", label: "B", traffic: 100, priceMultiplier: 1, pricingStrategy: "grid",
          priceOverrides: { "ig_followers:1000": "5.99", "bad-key": 10, "ig_likes:100": -1 },
        }],
      },
    ]);
    expect(exp.variants[0].priceOverrides).toEqual({ "ig_followers:1000": 5.99 });
  });

  it("normalizes admin-managed experiments", () => {
    const normalized = normalizePricingExperiments([
      {
        id: "pricing_admin",
        enabled: true,
        traffic: "25",
        seed: "",
        productAreas: ["instagram"],
        variants: [{ id: "control", label: "Control", traffic: "100", priceMultiplier: "1", pricingStrategy: "standard" }],
      },
    ]);

    expect(normalized[0]).toMatchObject({
      id: "pricing_admin",
      enabled: true,
      traffic: 25,
      seed: "pricing_admin",
      productAreas: ["instagram"],
    });
    expect(normalized[0].variants[0].priceMultiplier).toBe(1);
  });
});

describe("checkout pricing", () => {
  it("calculates server-side amount from allowed packs and ignores arbitrary client amounts", () => {
    const result = calculateCheckoutPricing({
      platform: "instagram",
      currency: "EUR",
      cart: [{ qty: 100, bonus: 25, country: "fr" }],
      pricingRows: [{ service: "ig_followers", qty: 100, price: "3.00", active: true }],
      promoCode: DEFAULT_PROMO_CODE,
    });
    expect(result.amountCents).toBe(285);
    expect(result.sanitizedCart[0]).toMatchObject({ service: "ig_followers", platform: "instagram", qty: 100 });
  });

  it("validates platform, cart and variant-adjusted amount", () => {
    expect(() => calculateCheckoutPricing({ platform: "unknown", currency: "EUR", cart: [{ qty: 100 }] })).toThrow();
    const result = calculateCheckoutPricing({
      platform: "tiktok",
      currency: "USD",
      cart: [{ qty: 100 }],
      assignment: { experimentId: "pricing_test", variantId: "discount", pricingStrategy: "discount", priceMultiplier: 0.9, reason: "assigned" },
      promoCode: DEFAULT_PROMO_CODE,
    });
    expect(result.currency).toBe("USD");
    expect(result.amountCents).toBe(213);
  });

  it("charges the per-pack override amount when the variant defines one (EUR)", () => {
    const assignment = {
      experimentId: "ig", variantId: "grid", pricingStrategy: "grid", priceMultiplier: 1,
      priceOverrides: { "ig_followers:1000": 5.99 }, reason: "assigned" as const,
    };
    const result = calculateCheckoutPricing({
      platform: "instagram",
      currency: "EUR",
      cart: [{ qty: 1000, service: "ig_followers" }],
      pricingRows: [{ service: "ig_followers", qty: 1000, price: "3.99", active: true }],
      assignment,
    });
    // 5.99 override → 599 cents (no promo applied here)
    expect(result.amountCents).toBe(599);
  });

  it("supports the gated fixed-total test promo code", () => {
    const result = calculateCheckoutPricing({
      platform: "instagram",
      currency: "EUR",
      cart: [{ qty: 100 }],
      pricingRows: [{ service: "ig_followers", qty: 100, price: "9.00", active: true }],
      promoCode: TEST_PROMO_CODE,
      allowTestPromo: true,
    });
    expect(result.amountCents).toBe(50);
    expect(result.discountCents).toBe(850);
    expect(result.promo.isTestPromo).toBe(true);

    expect(() => calculateCheckoutPricing({
      platform: "instagram",
      currency: "EUR",
      cart: [{ qty: 100 }],
      pricingRows: [{ service: "ig_followers", qty: 100, price: "9.00", active: true }],
      promoCode: TEST_PROMO_CODE,
      allowTestPromo: false,
    })).toThrow(TestPromoDisabledError);
  });
});
