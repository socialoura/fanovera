"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { trackPageView } from "./lib/analytics";

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    if (!key) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      defaults: "2025-05-24",
      capture_pageview: false,
      autocapture: true,
      // Session replay — masque les inputs par défaut pour ne jamais capturer
      // les emails, CB Stripe, mots de passe. Marque tout élément manuellement
      // sensible avec class="ph-no-capture" (DOM masqué) ou data-attr.
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: ".ph-mask",
        blockSelector: ".ph-no-capture",
        recordCrossOriginIframes: false,
      },
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
