export const DEFAULT_PROMO_CODE = "FANO5";
export const TEST_PROMO_CODE = "FANOTEST50";
export const TEST_PROMO_AMOUNT_CENTS = 50;

export type PromoPricing = {
  code: string;
  type: "none" | "percent" | "test_fixed_total";
  amountCents: number;
  discountCents: number;
  isTestPromo: boolean;
};

export class TestPromoDisabledError extends Error {
  constructor() {
    super("Test promo code is disabled");
    this.name = "TestPromoDisabledError";
  }
}

export function normalizePromoCode(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, "").toUpperCase() : "";
}

export function isDefaultPromoCode(value: unknown): boolean {
  return normalizePromoCode(value) === DEFAULT_PROMO_CODE;
}

export function isTestPromoCode(value: unknown): boolean {
  return normalizePromoCode(value) === TEST_PROMO_CODE;
}

export function calculatePromoPricing({
  subtotalCents,
  promoCode,
  allowTestPromo = false,
  minimumAmountCents = 100,
}: {
  subtotalCents: number;
  promoCode: unknown;
  allowTestPromo?: boolean;
  minimumAmountCents?: number;
}): PromoPricing {
  const subtotal = Math.max(0, Math.round(subtotalCents));
  const code = normalizePromoCode(promoCode);

  if (!code) {
    return {
      code: "",
      type: "none",
      amountCents: Math.max(minimumAmountCents, subtotal),
      discountCents: 0,
      isTestPromo: false,
    };
  }

  if (code === TEST_PROMO_CODE) {
    if (!allowTestPromo) throw new TestPromoDisabledError();
    return {
      code,
      type: "test_fixed_total",
      amountCents: TEST_PROMO_AMOUNT_CENTS,
      discountCents: Math.max(0, subtotal - TEST_PROMO_AMOUNT_CENTS),
      isTestPromo: true,
    };
  }

  if (code === DEFAULT_PROMO_CODE) {
    const discountCents = Math.round(subtotal * 0.05);
    return {
      code,
      type: "percent",
      amountCents: Math.max(minimumAmountCents, subtotal - discountCents),
      discountCents,
      isTestPromo: false,
    };
  }

  // Lifecycle email codes: FANO10, FANO15, FANO20, FANO25, FANO30. Capped at
  // 30 % so a leaked code can never wipe the margin entirely. Anything else
  // (FANO50, FANO99…) is silently ignored.
  const lifecycleMatch = code.match(/^FANO(10|15|20|25|30)$/);
  if (lifecycleMatch) {
    const pct = Number(lifecycleMatch[1]);
    const discountCents = Math.round(subtotal * (pct / 100));
    return {
      code,
      type: "percent",
      amountCents: Math.max(minimumAmountCents, subtotal - discountCents),
      discountCents,
      isTestPromo: false,
    };
  }

  return {
    code,
    type: "none",
    amountCents: Math.max(minimumAmountCents, subtotal),
    discountCents: 0,
    isTestPromo: false,
  };
}
