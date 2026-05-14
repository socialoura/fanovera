// Dynamic review count: increments by 1 per day since 2026-01-01 UTC,
// starting from the historical base of 2348. Deterministic on both server
// and client for the same wall-clock day, so no hydration mismatch.

const BASE_COUNT = 2348;
const START_MS = Date.UTC(2026, 0, 1); // Jan 1 2026
const DAY_MS = 86_400_000;

export function getReviewCount(): number {
  const days = Math.floor((Date.now() - START_MS) / DAY_MS);
  return BASE_COUNT + Math.max(0, days);
}

// Replace any occurrence of "2 348", "2,348", "2.348", "2\u00A0348" or bare
// "2348" inside a translated string with the current dynamic count, preserving
// the original thousands separator detected in the source string.
const NUMERIC_RE = /2[\s\u00A0,.]?348/g;

export function withDynamicReviewCount(text: string | undefined): string {
  if (!text) return text ?? "";
  const n = getReviewCount();
  return text.replace(NUMERIC_RE, (match) => {
    const sepMatch = /\d([\s\u00A0,.])\d/.exec(match);
    const sep = sepMatch?.[1] ?? "\u00A0";
    const s = String(n);
    if (s.length <= 3) return s;
    return s.slice(0, s.length - 3) + sep + s.slice(s.length - 3);
  });
}
