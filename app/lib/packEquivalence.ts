// Pack-equivalence helper used by Step1Packs across networks (Instagram,
// TikTok, YouTube, Spotify, Twitch) that expose a product-type toggle
// (followers/likes/views/streams/...). When the visitor switches type,
// resetting the pack to the popular default discards intent — someone who
// just picked the 5 000 tier almost certainly still wants ~5 000 of the
// new product, not the popular default (often 1 000 or 2 500).
//
// We map by quantity, not by pack index, because indexes don't align: e.g.
// Instagram followers[5] is 5 000 but Instagram views[5] is 50 000 — same
// index would jump the visitor 10x up.

type PackLike = { qty: number };

export function findEquivalentPackIndex<P extends PackLike>(
  currentQty: number,
  newPacks: readonly P[],
): number {
  if (newPacks.length === 0) return 0;
  let bestIdx = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < newPacks.length; i++) {
    const distance = Math.abs(newPacks[i].qty - currentQty);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIdx = i;
    }
  }
  return bestIdx;
}

// Resolve which pack to select when the visitor switches product type.
//
// If they were sitting on the popular default — i.e. they never deviated from
// the highlighted pack — we move them to the NEW product's popular pack so the
// glowing "selected" tile stays on the one wearing the "POPULAIRE" badge.
// Quantity-mapping a popular default (e.g. 1 000 followers) lands on a non-
// popular tier (1 000 likes when likes' popular is 2 500), which makes the
// highlight ring drift onto the wrong tile.
//
// Only once the visitor has actively picked a non-popular tier do we preserve
// their quantity intent across the switch.
export function resolveSwitchedPackIndex<P extends PackLike & { popular?: boolean }>(
  currentPack: { qty: number; popular?: boolean },
  newPacks: readonly P[],
): number {
  if (currentPack.popular) {
    const popularIdx = newPacks.findIndex((p) => p.popular);
    if (popularIdx >= 0) return popularIdx;
  }
  return findEquivalentPackIndex(currentPack.qty, newPacks);
}
