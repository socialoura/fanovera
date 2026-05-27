import PromoLanding from "./PromoLanding";
import { generateSurfaceMetadata } from "../lib/metadata";
import { detectTargetNetworkFromParams } from "../lib/detectTargetNetwork";

export const generateMetadata = () => generateSurfaceMetadata("home", "promo");

// Reading `searchParams` here forces dynamic rendering, which is what we want:
// the targeted hero variant depends on UTM params, and SSR'ing the wrong
// variant first (then flipping client-side) used to produce a visible jank
// when JS hydrated late. Detecting server-side lets the HTML response already
// contain the right featured-card layout for the visitor's intent.
export default async function PromoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const urlParams = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") urlParams.set(k, v);
    else if (Array.isArray(v) && typeof v[0] === "string") urlParams.set(k, v[0]);
  }
  const initialTargetedNetwork = detectTargetNetworkFromParams(urlParams);
  return <PromoLanding initialTargetedNetwork={initialTargetedNetwork} />;
}
