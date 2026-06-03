"use client";

import posthog from "posthog-js";
import { isValidAnalyticsEventName, type AnalyticsEventName, type AnalyticsProperties } from "./analyticsEvents";
export { ANALYTICS_EVENTS, isValidAnalyticsEventName, type AnalyticsEventName, type AnalyticsProperties } from "./analyticsEvents";

export function analyticsConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN);
}

function deviceType() {
  if (typeof window === "undefined") return "server";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function currentAttributionProperties(): AnalyticsProperties {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
    gclid: params.get("gclid"),
    gbraid: params.get("gbraid"),
    wbraid: params.get("wbraid"),
    msclkid: params.get("msclkid"),
    fbclid: params.get("fbclid"),
    entry_surface: params.get("entry_surface"),
    // Matched keyword + match type from Google Ads ValueTrack
    // ({keyword}/{matchtype}) in the ad final-URL suffix → exact keyword LTV.
    kw: params.get("kw"),
    mt: params.get("mt"),
  };
}

function utmParams() {
  return currentAttributionProperties();
}

export function commonAnalyticsProperties(overrides: AnalyticsProperties = {}) {
  const pathname = typeof window === "undefined" ? undefined : window.location.pathname;
  return {
    pathname,
    referrer: typeof document === "undefined" ? undefined : document.referrer || undefined,
    device_type: deviceType(),
    environment: process.env.NODE_ENV || "development",
    ...utmParams(),
    ...overrides,
  };
}

export function trackEvent(event: AnalyticsEventName, properties: AnalyticsProperties = {}) {
  if (!isValidAnalyticsEventName(event) || !analyticsConfigured()) return;
  try {
    posthog.capture(event, commonAnalyticsProperties(properties));
  } catch {
  }
}

export function trackPageView(properties: AnalyticsProperties = {}) {
  trackEvent("page_view", properties);
}

// Register persistent super properties: PostHog attaches them to EVERY
// subsequent event for this device. Used to ride an experiment variant (e.g.
// promo_flow_variant) across the page → checkout → payment funnel so each arm
// can be segmented without threading the variant through every trackEvent call.
export function registerSuperProperties(properties: AnalyticsProperties) {
  if (!analyticsConfigured()) return;
  try {
    posthog.register(properties);
  } catch {
  }
}

export function identifyUser(userId: string, properties: AnalyticsProperties = {}) {
  if (!analyticsConfigured() || !userId) return;
  try {
    posthog.identify(userId, properties);
  } catch {
  }
}

export function aliasAnonymousUser(userId: string) {
  if (!analyticsConfigured() || !userId) return;
  try {
    posthog.alias(userId);
  } catch {
  }
}
