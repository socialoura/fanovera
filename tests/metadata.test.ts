import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "../app/i18n/types";
import { INDEXABLE_ROUTE_IDS, buildPageMetadata, getMetadataCopy } from "../app/lib/siteMetadata";

const MOJIBAKE_RE = /Ã.|Â.|â[\u0080-\u00ff]|ðŸ|undefined|null/u;

describe("localized metadata", () => {
  it("has complete title, description, canonical and hreflang alternates", () => {
    for (const routeId of INDEXABLE_ROUTE_IDS) {
      for (const locale of SUPPORTED_LOCALES) {
        const metadata = buildPageMetadata(routeId, locale);
        const copy = getMetadataCopy(routeId, locale);
        expect(copy.title.length).toBeGreaterThan(20);
        expect(copy.title.length).toBeLessThanOrEqual(70);
        expect(copy.description.length).toBeGreaterThan(70);
        expect(copy.description.length).toBeLessThanOrEqual(180);
        expect(copy.title).not.toMatch(MOJIBAKE_RE);
        expect(copy.description).not.toMatch(MOJIBAKE_RE);
        expect(metadata.alternates?.canonical).toContain(`/${locale}`);
        const languages = metadata.alternates?.languages as Record<string, unknown> | undefined;
        for (const hreflang of [...SUPPORTED_LOCALES, "x-default"]) {
          expect(languages?.[hreflang]).toBeTruthy();
        }
        expect(metadata.openGraph?.title).toBe(copy.title);
        expect(metadata.openGraph?.description).toBe(copy.description);
        expect((metadata.twitter as { card?: string } | undefined)?.card).toBe("summary_large_image");
      }
    }
  });
});
