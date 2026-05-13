"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { trackEvent, type AnalyticsEventName } from "./analytics";
import type { PricingAssignment } from "./pricingExperiments";

const PAGE_VIEW_EVENTS: Record<string, AnalyticsEventName> = {
  instagram: "instagram_page_viewed",
  tiktok: "tiktok_page_viewed",
  youtube: "youtube_page_viewed",
  spotify: "spotify_page_viewed",
  twitch: "twitch_page_viewed",
  facebook: "facebook_page_viewed",
  linkedin: "linkedin_page_viewed",
  twitter: "twitter_page_viewed",
};

export function useProductAnalytics(input: {
  productArea: string;
  step: number;
  plan: string;
  price: number;
  currency: string;
  assignment?: PricingAssignment;
  anonymousId?: string | null;
  enabled?: boolean;
}) {
  const { locale, country } = useI18n();
  const exposedKey = useRef("");

  useEffect(() => {
    if (input.enabled === false) return;
    const base = {
      locale,
      country,
      product_area: input.productArea,
      page_type: "product",
      feature_name: "product_page",
    };
    trackEvent(PAGE_VIEW_EVENTS[input.productArea] || "page_view", base);
    trackEvent("pricing_viewed", { ...base, feature_name: "pricing" });
  }, [country, input.enabled, input.productArea, locale]);

  useEffect(() => {
    if (input.enabled === false) return;
    trackEvent("pricing_plan_viewed", {
      locale,
      country,
      product_area: input.productArea,
      feature_name: "pricing",
      plan: input.plan,
      price: input.price,
      currency: input.currency,
    });
  }, [country, input.currency, input.enabled, input.plan, input.price, input.productArea, locale]);

  useEffect(() => {
    if (input.enabled === false) return;
    if (!input.assignment || !input.anonymousId) return;
    const key = `${input.assignment.experimentId}:${input.assignment.variantId}:${input.productArea}:${input.plan}`;
    if (exposedKey.current === key) return;
    exposedKey.current = key;
    trackEvent("pricing_variant_exposed", {
      locale,
      country,
      product_area: input.productArea,
      feature_name: "pricing",
      anonymousId: input.anonymousId,
      experimentId: input.assignment.experimentId,
      variantId: input.assignment.variantId,
      pricing_strategy: input.assignment.pricingStrategy,
      plan: input.plan,
      price: input.price,
      currency: input.currency,
    });
  }, [country, input.anonymousId, input.assignment, input.currency, input.enabled, input.plan, input.price, input.productArea, locale]);

  useEffect(() => {
    if (input.enabled === false) return;
    trackEvent("onboarding_step_viewed", {
      locale,
      country,
      product_area: input.productArea,
      feature_name: "checkout_steps",
      step: input.step,
    });
  }, [country, input.enabled, input.productArea, input.step, locale]);
}
