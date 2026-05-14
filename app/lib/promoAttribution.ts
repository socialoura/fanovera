export const PROMO_ENTRY_SURFACE_PARAM = "entry_surface";
export const PROMO_ENTRY_SURFACE_VALUE = "promo";

export function hrefWithPromoAttribution(path: string, currentSearch: { toString(): string } | string | null | undefined) {
  const rawSearch = typeof currentSearch === "string" ? currentSearch : currentSearch?.toString() || "";
  const params = new URLSearchParams(rawSearch);
  params.set(PROMO_ENTRY_SURFACE_PARAM, PROMO_ENTRY_SURFACE_VALUE);

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
