# Pricing Experiments

Pricing experiments are configured with JSON in `PRICING_EXPERIMENTS_JSON` or `NEXT_PUBLIC_PRICING_EXPERIMENTS_JSON`, then enabled with `PRICING_EXPERIMENTS_ENABLED=true` and `NEXT_PUBLIC_PRICING_EXPERIMENTS_ENABLED=true`.

Example:

```json
[
  {
    "id": "pricing_public_pages_v1",
    "enabled": true,
    "traffic": 100,
    "seed": "fanovera-pricing-v1",
    "productAreas": ["instagram", "tiktok"],
    "locales": ["fr", "en"],
    "variants": [
      { "id": "control", "label": "Standard", "traffic": 50, "priceMultiplier": 1, "pricingStrategy": "standard" },
      { "id": "value_10", "label": "Value -10%", "traffic": 50, "priceMultiplier": 0.9, "pricingStrategy": "value_discount" }
    ]
  }
]
```

The client only displays the assigned variant. The checkout API recalculates the amount server-side from platform, cart quantity, currency, database pricing/fallback packs and the recomputed variant assignment. Never send or trust arbitrary Stripe `priceId` or amount values from the client.

## Live Checkout Test

Run the real Stripe test-mode purchase flow from PowerShell:

```powershell
$env:RUN_STRIPE_CHECKOUT_E2E="1"
$env:ALLOW_CHECKOUT_E2E="1"
npm run test:e2e:checkout
```

The test fills the localized French Instagram checkout with Stripe card `4242 4242 4242 4242`, a future expiration date and a random CVC. It creates a real Stripe test PaymentIntent and confirms the order, while `ALLOW_CHECKOUT_E2E=1` disables confirmation email, Discord notification and SMM auto-ordering for that run.
