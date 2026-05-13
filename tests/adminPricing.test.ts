import { describe, expect, it } from "vitest";
import { applyPopularPackSelection, sortAdminPricingPacks } from "../app/lib/adminPricing";

describe("admin pricing popular selection", () => {
  it("keeps only one popular pack for the updated service", () => {
    const packs = [
      { id: 1, service: "ig_followers", popular: true, qty: 100 },
      { id: 2, service: "ig_followers", popular: false, qty: 1000 },
      { id: 3, service: "tt_followers", popular: true, qty: 500 },
    ];

    const next = applyPopularPackSelection(packs, { ...packs[1], popular: true });

    expect(next).toEqual([
      { id: 1, service: "ig_followers", popular: false, qty: 100 },
      { id: 2, service: "ig_followers", popular: true, qty: 1000 },
      { id: 3, service: "tt_followers", popular: true, qty: 500 },
    ]);
  });

  it("does not change other packs when the updated pack is not popular", () => {
    const packs = [
      { id: 1, service: "ig_followers", popular: true },
      { id: 2, service: "ig_followers", popular: false },
    ];

    const next = applyPopularPackSelection(packs, { ...packs[1], popular: false });

    expect(next).toEqual(packs);
  });

  it("sorts packs by manual order before quantity", () => {
    const packs = [
      { id: 1, service: "ig_followers", popular: false, qty: 100, sort_order: 3000 },
      { id: 2, service: "ig_followers", popular: true, qty: 1000, sort_order: 1000 },
      { id: 3, service: "ig_followers", popular: false, qty: 500, sort_order: 2000 },
    ];

    expect(sortAdminPricingPacks(packs).map((pack) => pack.id)).toEqual([2, 3, 1]);
  });
});
