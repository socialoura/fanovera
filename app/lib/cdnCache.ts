/**
 * Edge / CDN caching helpers.
 *
 * Public read-only API responses (profile previews, image proxy) are
 * extremely cacheable — the same `?username=foo` returns the same payload
 * for 60+ seconds in normal usage, and the cost of a stale response is
 * negligible (the user sees a slightly outdated follower count).
 *
 * We layer two cache directives:
 *   • `Cache-Control` — browser-side cache, disabled here so individual
 *     visitors don't see stale data tied to their previous tab.
 *   • `CDN-Cache-Control` / `Vercel-CDN-Cache-Control` — edge cache, where
 *     ALL requests share the cached response. This is the cost saver:
 *     RapidAPI gets called once per (username, ttl) bucket, not once per
 *     unique browser hitting the page.
 *
 * `stale-while-revalidate` lets the edge serve a slightly stale response
 * while it refreshes in the background → no user-facing latency spike when
 * the cache expires.
 */

import { NextResponse } from "next/server";

type CdnCacheOptions = {
  /** Seconds to keep a fresh copy at the edge. Defaults to 60. */
  maxAge?: number;
  /** Seconds the edge can serve a stale copy while revalidating. Defaults to 300. */
  staleWhileRevalidate?: number;
  /** Allow the browser to cache too (default: 0 — no browser caching). */
  browserMaxAge?: number;
};

function buildHeaders(opts: CdnCacheOptions): Record<string, string> {
  const sMaxAge = opts.maxAge ?? 60;
  const swr = opts.staleWhileRevalidate ?? 300;
  const browser = opts.browserMaxAge ?? 0;

  const browserDirective = browser > 0
    ? `private, max-age=${browser}`
    : "private, max-age=0, must-revalidate";

  const cdnDirective = `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`;

  return {
    "Cache-Control": browserDirective,
    "CDN-Cache-Control": cdnDirective,
    "Vercel-CDN-Cache-Control": cdnDirective,
  };
}

/**
 * Build a JSON `NextResponse` decorated with edge cache headers. Use this
 * ONLY on successful read-only responses — never on 4xx/5xx, never on
 * routes that mutate state.
 */
export function jsonCachedAtEdge(
  data: unknown,
  opts: CdnCacheOptions = {},
  init?: Omit<ResponseInit, "headers">,
): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: buildHeaders(opts),
  });
}
