import { describe, expect, it } from "vitest";
import { bulkFollowsCostCents, estimateBulkFollowsCharge, resolveBulkFollowsCharge } from "../app/lib/smmCost";

describe("SMM cost helpers", () => {
  it("estimates BulkFollows charge from rate per 1k and quantity", () => {
    expect(estimateBulkFollowsCharge("2.75", 2500)).toBe(6.875);
  });

  it("prefers the API charge when BulkFollows returns one", () => {
    expect(resolveBulkFollowsCharge("1.2345", 2.5)).toBe(1.2345);
  });

  it("falls back to estimated charge when API charge is missing", () => {
    expect(resolveBulkFollowsCharge("", 2.5)).toBe(2.5);
    expect(resolveBulkFollowsCharge(null, 2.5)).toBe(2.5);
  });

  it("converts USD charges to cents", () => {
    expect(bulkFollowsCostCents([1.25, null, 2.333])).toBe(358);
  });
});
