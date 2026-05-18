"use client";

import { useEffect } from "react";
import { getOrCreateAnonymousId } from "./usePricingExperiment";
import { useI18n } from "../i18n/I18nProvider";

const SENT_KEY = "fanovera_visit_sent_v1";

function hasSent(platform: string, anonymousId: string) {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(SENT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Record<string, true>;
    return Boolean(parsed[`${platform}:${anonymousId}`]);
  } catch {
    return false;
  }
}

function markSent(platform: string, anonymousId: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(SENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, true>) : {};
    parsed[`${platform}:${anonymousId}`] = true;
    window.sessionStorage.setItem(SENT_KEY, JSON.stringify(parsed));
  } catch {
  }
}

// Records a visit once per (visitor, platform) per session. Server-side
// dedup further collapses to one row per day so the metric stays clean.
export function useTrackPageVisit(platform: string) {
  const { locale } = useI18n();
  useEffect(() => {
    const anonymousId = getOrCreateAnonymousId();
    if (!anonymousId) return;
    if (hasSent(platform, anonymousId)) return;
    markSent(platform, anonymousId);
    void fetch("/api/track/page-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ platform, anonymousId, locale }),
    }).catch(() => {});
  }, [platform, locale]);
}
