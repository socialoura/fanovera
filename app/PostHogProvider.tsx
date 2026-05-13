"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { trackPageView } from "./lib/analytics";

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      defaults: "2025-05-24",
      capture_pageview: false,
      autocapture: true,
      loaded: (client) => {
        client.register({
          environment: process.env.NODE_ENV || "development",
        });
      },
    });
  }, []);

  useEffect(() => {
    if (!pathname) return;
    trackPageView({
      pathname,
      search: typeof window === "undefined" ? "" : window.location.search.replace(/^\?/, ""),
      page_type: pathname === "/" ? "home" : pathname.split("/").filter(Boolean)[0] || "home",
    });
  }, [pathname]);

  return <>{children}</>;
}
