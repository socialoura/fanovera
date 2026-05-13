import { expect, type Page, test } from "@playwright/test";

const shouldRunCheckoutE2E =
  process.env.RUN_STRIPE_CHECKOUT_E2E === "1" && process.env.ALLOW_CHECKOUT_E2E === "1";

function futureExpiry() {
  const year = new Date().getFullYear() + 4;
  return `12 / ${String(year).slice(-2)}`;
}

function randomCvc() {
  return String(Math.floor(100 + Math.random() * 900));
}

async function stripeFrameSummary(page: Page) {
  return page.frames().map((frame) => {
    const sanitizedUrl = frame.url()
      .replace(/apiKey=pk_[^&#]+/g, "apiKey=[redacted]")
      .replace(/client_secret=[^&#]+/g, "client_secret=[redacted]");
    return `${frame.name() || "(unnamed)"} ${sanitizedUrl.slice(0, 260)}`;
  }).join("\n");
}

async function fillStripeField(page: Page, labels: RegExp[], value: string, browserLogs: string[]) {
  const deadline = Date.now() + 30_000;
  let lastError: unknown = null;

  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      for (const label of labels) {
        const candidates = [
          frame.getByLabel(label).first(),
          frame.getByPlaceholder(label).first(),
        ];

        for (const locator of candidates) {
          try {
            if ((await locator.count()) > 0) {
              await locator.fill(value, { timeout: 1_500 });
              return;
            }
          } catch (error) {
            lastError = error;
          }
        }
      }
    }

    await page.waitForTimeout(400);
  }

  throw new Error(
    [
      `Unable to fill Stripe field. Last error: ${String(lastError)}`,
      "Stripe frames:",
      await stripeFrameSummary(page),
      "Browser errors/warnings:",
      browserLogs.slice(-20).join("\n") || "(none)",
    ].join("\n"),
  );
}

test.describe("localized Stripe checkout", () => {
  test.skip(
    !shouldRunCheckoutE2E,
    "Set RUN_STRIPE_CHECKOUT_E2E=1 and ALLOW_CHECKOUT_E2E=1 to run the live Stripe test-mode checkout.",
  );

  test("FR Instagram checkout succeeds with Stripe test card 4242", async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    test.skip(testInfo.project.name !== "chromium", "Live Stripe checkout runs once on desktop to avoid duplicate test purchases.");
    const pageErrors: string[] = [];
    const browserLogs: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) {
        browserLogs.push(`${message.type()}: ${message.text()}`);
      }
    });
    await page.route("**/api/create-payment-intent", async (route) => {
      await route.continue({
        headers: {
          ...route.request().headers(),
          "x-fanovera-e2e-checkout": "1",
        },
      });
    });

    await page.goto("/fr/instagram");
    await page.getByTestId("pricing-continue").click();

    const profileResponse = page.waitForResponse((response) =>
      response.url().includes("/api/instagram/profile") && response.request().method() === "GET",
    );
    const intentResponse = page.waitForResponse((response) =>
      response.url().includes("/api/create-payment-intent") &&
      response.request().method() === "POST" &&
      response.status() === 200,
    );

    await page.getByTestId("checkout-username").fill("fanoveratest");
    await page.getByTestId("checkout-email").fill(`checkout-e2e+${Date.now()}@fanovera.test`);
    expect((await profileResponse).ok()).toBe(true);
    expect((await intentResponse).ok()).toBe(true);

    await page.getByTestId("checkout-profile-next").click();
    await expect(page.getByTestId("stripe-card-submit")).toBeVisible({ timeout: 90_000 });

    await fillStripeField(page, [/card number/i, /num[eé]ro de carte/i, /n[uú]mero de tarjeta/i], "4242 4242 4242 4242", browserLogs);
    await fillStripeField(page, [/expiration/i, /expiry/i, /date d.expiration/i, /mm\s*\/\s*aa/i], futureExpiry(), browserLogs);
    await fillStripeField(page, [/security code/i, /cvc/i, /cvv/i, /code de s[eé]curit[eé]/i], randomCvc(), browserLogs);

    const confirmation = page.waitForResponse((response) =>
      response.url().includes("/api/confirm-order") && response.request().method() === "POST",
    );
    await page.getByTestId("stripe-card-submit").click();

    expect((await confirmation).ok()).toBe(true);
    await expect(page).toHaveURL(/\/order-success\?.*orderId=/, { timeout: 60_000 });
    await expect(page.locator("h1")).toContainText("Commande confirmée");
    await expect(page.getByRole("link", { name: /suivre|track/i })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});
