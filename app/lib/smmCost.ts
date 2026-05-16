export function estimateBulkFollowsCharge(ratePer1k: unknown, quantity: unknown): number | null {
  const rate = Number(ratePer1k);
  const qty = Number(quantity);

  if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(qty) || qty <= 0) {
    return null;
  }

  return Math.round((rate * qty / 1000) * 10000) / 10000;
}

export function resolveBulkFollowsCharge(apiCharge: unknown, estimatedCharge: number | null): number | null {
  const charge = Number(apiCharge);
  if (Number.isFinite(charge) && charge > 0) return charge;
  return estimatedCharge;
}

export function bulkFollowsCostCents(
  charges: Array<number | null | undefined>,
  usdToTargetRate: number = 1,
): number {
  const totalUsd = charges.reduce<number>((sum, charge) => (
    sum + (Number.isFinite(Number(charge)) ? Number(charge) : 0)
  ), 0);
  return Math.round(totalUsd * usdToTargetRate * 100);
}
