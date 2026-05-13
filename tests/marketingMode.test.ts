import { describe, expect, it } from "vitest";
import { getPublicCopy } from "../app/components/publicCopy";
import { applyPerformanceProductCopy } from "../app/lib/performanceCopy";
import { buildPageMetadata, getMetadataCopy } from "../app/lib/siteMetadata";

describe("marketing mode copy", () => {
  it("applies performance public copy only to fr and en", () => {
    expect(getPublicCopy("fr", "performance").hero.titleHighlight).toBe("le signal social");
    expect(getPublicCopy("en", "performance").hero.titleHighlight).toBe("the social proof");
    expect(getPublicCopy("es", "performance").hero.titleHighlight).not.toBe("the social proof");
  });

  it("keeps product copy clean outside fr/en", () => {
    const clean = {
      step1: { titleFocus: "clean", continue: "Continue", audience: "Audience" },
      step2: { intro: "Clean intro" },
      step3: { subtitle: "Clean payment" },
      why: { items: [["A", "B"]] },
      faq: { items: [["Q", "A"]] },
      footer: { desc: "Clean footer" },
      reviews: { eyebrow: "Reviews" },
    };

    const fr = applyPerformanceProductCopy(clean, {
      locale: "fr",
      mode: "performance",
      product: "Instagram",
      audience: "Followers",
    });
    const de = applyPerformanceProductCopy(clean, {
      locale: "de",
      mode: "performance",
      product: "Instagram",
      audience: "Followers",
    });

    expect(fr.step1.titleFocus).toBe("rapide");
    expect(fr.step1.audience).toBe("Followers");
    expect(de.step1.titleFocus).toBe("clean");
  });

  it("uses real product volume labels instead of generic audience labels", () => {
    const clean = {
      step1: { audience: "Audience" },
      step2: {},
      step3: {},
      why: { items: [] },
      faq: { items: [] },
      footer: {},
      reviews: {},
    };

    expect(
      applyPerformanceProductCopy(clean, {
        locale: "fr",
        mode: "performance",
        product: "YouTube",
        audience: "Views",
      }).step1.audience,
    ).toBe("Vues");
    expect(
      applyPerformanceProductCopy(clean, {
        locale: "fr",
        mode: "performance",
        product: "Spotify",
        audience: "Streams",
      }).step1.audience,
    ).toBe("Écoutes");
  });
});

describe("marketing mode metadata", () => {
  it("switches FR/EN metadata and keeps other locales clean", () => {
    expect(getMetadataCopy("home", "fr", "performance").title).toContain("Boost social");
    expect(getMetadataCopy("home", "fr", "performance").description).toContain("visibilité");
    expect(getMetadataCopy("instagram", "en", "performance").title).toContain("Fast tracked Instagram boost");
    expect(getMetadataCopy("instagram", "de", "performance").title).toBe(getMetadataCopy("instagram", "de", "clean").title);

    const metadata = buildPageMetadata("instagram", "en", "", "performance");
    expect(metadata.title).toContain("Fast tracked Instagram boost");
    expect(metadata.description).toContain("progressive delivery");
    expect(metadata.alternates?.canonical).toContain("/en/instagram");
  });
});
