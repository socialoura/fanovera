import { describe, expect, it } from "vitest";
import { calculateCheckoutPricing } from "../app/lib/checkoutPricing";
import { applyPricingAssignment, assignPricingVariant, type PricingExperiment } from "../app/lib/pricingExperiments";

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
});

describe("checkout pricing", () => {
  it("calculates server-side amount from allowed packs and ignores arbitrary client amounts", () => {
    const result = calculateCheckoutPricing({
      platform: "instagram",
      currency: "EUR",
      cart: [{ qty: 100, bonus: 25, country: "fr" }],
      pricingRows: [{ service: "ig_followers", qty: 100, price: "3.00", active: true }],
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
    });
    expect(result.currency).toBe("USD");
    expect(result.amountCents).toBe(213);
  });
});
