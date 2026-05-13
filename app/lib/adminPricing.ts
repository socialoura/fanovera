export type AdminPricingPack = {
  id: number;
  service: string;
  popular: boolean;
};

export function applyPopularPackSelection<T extends AdminPricingPack>(packs: T[], updated: T): T[] {
  return packs.map((pack) => {
    if (pack.id === updated.id) return updated;
    if (updated.popular && pack.service === updated.service) return { ...pack, popular: false };
    return pack;
  });
}

export type OrderedAdminPricingPack = AdminPricingPack & {
  qty: number;
  sort_order: number;
};

export function sortAdminPricingPacks<T extends OrderedAdminPricingPack>(packs: T[]): T[] {
  return [...packs].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.qty - b.qty || a.id - b.id);
}
