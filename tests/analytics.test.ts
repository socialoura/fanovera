import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ANALYTICS_EVENTS, isValidAnalyticsEventName } from "../app/lib/analyticsEvents";
import { trackEvent } from "../app/lib/analytics";

describe("analytics tracking plan", () => {
  it("uses snake_case event names", () => {
    for (const event of ANALYTICS_EVENTS) {
      expect(event).toMatch(/^[a-z0-9][a-z0-9_]*$/);
      expect(isValidAnalyticsEventName(event)).toBe(true);
    }
  });

  it("has documentation for every declared event", () => {
    const trackingPlan = fs.readFileSync(path.join(process.cwd(), "docs", "analytics-tracking-plan.md"), "utf8");
    for (const event of ANALYTICS_EVENTS) {
      expect(trackingPlan).toContain(event);
    }
  });

  it("does not crash when PostHog is not configured", () => {
    expect(() => trackEvent("page_view", { pathname: "/" })).not.toThrow();
  });
});
