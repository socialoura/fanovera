import { isValidAnalyticsEventName, type AnalyticsEventName, type AnalyticsProperties } from "./analyticsEvents";

export async function captureServerEvent(
  event: AnalyticsEventName,
  distinctId: string,
  properties: AnalyticsProperties = {},
) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!key || !distinctId || !isValidAnalyticsEventName(event)) return;

  try {
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
    await fetch(`${host.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event,
        distinct_id: distinctId,
        properties: {
          environment: process.env.NODE_ENV || "development",
          ...properties,
        },
      }),
    });
  } catch {
  }
}
