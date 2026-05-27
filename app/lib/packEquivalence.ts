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
