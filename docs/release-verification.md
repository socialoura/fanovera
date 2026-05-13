# Release Verification

Run after each production deployment preparation:

```bash
npm run verify
```

This runs TypeScript, lint, unit tests, the production build and rendered Playwright smoke tests.
For faster local loops while developing, run:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
npm run test:e2e
```

Live Stripe test-mode checkout:

```powershell
$env:RUN_STRIPE_CHECKOUT_E2E="1"
$env:ALLOW_CHECKOUT_E2E="1"
npm run test:e2e:checkout
```

This uses Stripe test card `4242 4242 4242 4242`, a future expiration date and a random CVC on the French Instagram checkout.
`ALLOW_CHECKOUT_E2E=1` marks the PaymentIntent as test-only and skips non-essential side effects such as confirmation email, Discord notification and SMM auto-ordering.

Common fixes:

- Missing translation or mojibake: update the relevant `app/**/i18n.ts`, `app/i18n/locales/*.ts` or shared dictionary entry.
- Metadata failure: update `app/lib/siteMetadata.ts`.
- Pricing failure: update `app/lib/productCatalog.ts`, `app/lib/checkoutPricing.ts` or the pricing experiment JSON.
- Analytics failure: add the event to `app/lib/analyticsEvents.ts` and document it in `docs/analytics-tracking-plan.md`.
