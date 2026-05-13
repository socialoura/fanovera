import { expect, test } from "@playwright/test";

const routes = [
  { path: "/fr", expectedText: "Fanovera" },
  { path: "/en", expectedText: "Fanovera" },
  { path: "/fr/instagram", expectedText: "Fanovera" },
  { path: "/en/youtube", expectedText: "Fanovera" },
  { path: "/fr/twitch", expectedText: "Fanovera" },
  { path: "/fr/order-success", expectedText: "Commande confirmée" },
  { path: "/en/track/test-order", expectedText: "Order tracking" },
];
const locales = ["fr", "en", "es", "pt", "de", "it", "tr"];
const publicPages = ["", "instagram", "tiktok", "youtube", "spotify", "twitch", "facebook", "linkedin", "twitter"];

for (const route of routes) {
  test(`${route.path} renders meaningful content`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(route.path);
    await expect(page.locator("body")).toContainText(route.expectedText);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("/fr/instagram waits for database pricing before showing packs", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Pricing flash guard runs once on desktop.");
  await page.addInitScript(() => window.sessionStorage.clear());

  await page.route("**/api/geo-currency?**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ currency: "EUR", locale: "fr-FR", country: "FR", mode: "auto" }),
    });
  });

  let releasePricing: (() => Promise<void>) | null = null;
  await page.route("**/api/pricing?**", async (route) => {
    if (!route.request().url().includes("service=ig_followers")) {
      await route.continue();
      return;
    }

    await new Promise<void>((resolve) => {
      releasePricing = async () => {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            service: "ig_followers",
            currency: "EUR",
            packs: [
              { qty: 100, price: 0.49 },
              { qty: 250, price: 0.79 },
              { qty: 500, price: 0.99 },
              { qty: 1000, price: 1.23, popular: true },
            ],
          }),
        });
        resolve();
      };
    });
  });

  await page.goto("/fr/instagram", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("pricing-loading")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("14,99");

  await expect.poll(() => Boolean(releasePricing)).toBe(true);
  const release = releasePricing as (() => Promise<void>) | null;
  if (!release) throw new Error("Pricing response was not intercepted");
  await release();
  await expect(page.getByTestId("pricing-loading")).toBeHidden();
  await expect(page.locator("body")).toContainText("1,23");
});

for (const locale of locales) {
  for (const publicPage of publicPages) {
    const route = publicPage ? `/${locale}/${publicPage}` : `/${locale}`;
    test(`[matrix] ${route} renders without visible encoding artifacts`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "chromium", "Full locale matrix runs once on desktop; mobile is covered by representative routes.");
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));

      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body"), route).toContainText("Fanovera");
      await expect(page.locator("h1").first(), route).toBeVisible();
      const text = await page.locator("body").innerText();
      expect(text, route).not.toMatch(/Ã.|Â.|â[\u0080-\u00ff]|ðŸ|&eacute;/u);
      expect(errors).toEqual([]);
    });
  }
}
