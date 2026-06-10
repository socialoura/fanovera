"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import TtHeader from "../tiktok/components/TtHeader";
import WhyUs from "../tiktok/components/WhyUs";
import Reviews from "../tiktok/components/Reviews";
import TtFAQ from "../tiktok/components/TtFAQ";
import TtFooter from "../tiktok/components/TtFooter";
import { PACKS, LIKES_PACKS, VIEWS_PACKS, fmtEuro, type CountryId } from "../tiktok/data";
import PricingPacksLoading from "../components/PricingPacksLoading";
import { useApplyCurrencyPricing, usePrefetchProductPricing } from "../lib/useCurrencyPricing";
import { useTrackPageVisit } from "../lib/useTrackPageVisit";
import { trackEvent, registerSuperProperties } from "../lib/analytics";
import { getTt2PacksBucket, resolveTt2PacksVariant, type Tt2PacksVariant } from "../lib/tt2PacksExperiment";
import { scrollToStepMain } from "../lib/stepScroll";
import Step1Username from "./components/Step1Username";
import Step2Quantities from "./components/Step2Quantities";
import Step3Posts from "./components/Step3Posts";
import Step4Checkout from "./components/Step4Checkout";
import { PRODUCT_META, type Selection } from "./products";
import type { TtProfile, TtPost } from "./types";

const STATIC_PACKS = PACKS.map((p) => ({ ...p }));
const STATIC_LIKES = LIKES_PACKS.map((p) => ({ ...p }));
const STATIC_VIEWS = VIEWS_PACKS.map((p) => ({ ...p }));

export default function Tiktok2PageClient({ packsMode = "ab" }: { packsMode?: string }) {
  const country: CountryId = "fr";
  // Handoff from /promo (username-first arm): the @ arrives in `?u=`. We seed
  // the username and auto-run step 1's loading so the visitor lands directly on
  // step 2 (profile + packs) — same intent as the Instagram handoff.
  const search = useSearchParams();
  const handoffHandle = (search?.get("u") || "").replace(/^@+/, "").trim();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [username, setUsername] = useState(handoffHandle);
  const [autoStart, setAutoStart] = useState(handoffHandle.length > 0);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<TtProfile | null>(null);
  const [posts, setPosts] = useState<TtPost[]>([]);
  const [sel, setSel] = useState<Selection>({ followers: null, likes: null, views: null });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pack-selector A/B (chips vs slider). The admin mode (off/ab/force_*) comes
  // from the SSR page; the sticky 50/50 bucket lands on mount (only used in
  // "ab" mode). Starts "chips" on first paint; resolved well before the visitor
  // can reach step 2 (username submit + ~2.4s loading).
  const [packsVariant, setPacksVariant] = useState<Tt2PacksVariant>(
    packsMode === "force_slider" ? "slider" : "chips",
  );
  // Slider arm only: pre-select sensible defaults so the curseur doesn't start
  // empty — followers on the "popular" tier, likes & views on the smallest tier.
  const sliderDefaultsAppliedRef = useRef(false);
  useEffect(() => {
    const v = resolveTt2PacksVariant(packsMode, getTt2PacksBucket());
    setPacksVariant(v);
    if (v === "slider" && !sliderDefaultsAppliedRef.current) {
      sliderDefaultsAppliedRef.current = true;
      setSel({
        followers: Math.max(0, PRODUCT_META.followers.packs.findIndex((p) => p.popular)),
        likes: 0,
        views: 0,
      });
    }
  }, [packsMode]);

  // Apply admin/DB pricing to all three product arrays (mutated in place). The
  // returned `version` bumps state so child steps re-read the live prices.
  const followersPricing = useApplyCurrencyPricing("tt_followers", PACKS, STATIC_PACKS);
  useApplyCurrencyPricing("tt_likes", LIKES_PACKS, STATIC_LIKES);
  useApplyCurrencyPricing("tt_views", VIEWS_PACKS, STATIC_VIEWS);
  const { canDisplayPricing } = followersPricing;

  // Cheapest live price across all TikTok products, formatted in the visitor's
  // currency. Powers the step-1 CTA's "from £X" anchor (same as the /promo Hero).
  const fromPriceLabel = useMemo(() => {
    if (!canDisplayPricing) return null;
    const prices = [...PACKS, ...LIKES_PACKS, ...VIEWS_PACKS]
      .map((p) => p.price)
      .filter((n) => Number.isFinite(n) && n >= 0);
    return prices.length ? fmtEuro(Math.min(...prices)) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canDisplayPricing, followersPricing.version]);

  usePrefetchProductPricing();
  useTrackPageVisit("tiktok");

  const [readyOnce, setReadyOnce] = useState(canDisplayPricing);
  useEffect(() => { if (canDisplayPricing) setReadyOnce(true); }, [canDisplayPricing]);

  // Fire the A/B exposure once the packs are actually shown (clean denominator),
  // and register the variant as a super property so every later funnel event
  // (checkout_started → payment_succeeded) carries it for per-arm conversion.
  const packsExposedRef = useRef(false);
  useEffect(() => {
    if (step !== 2 || packsExposedRef.current) return;
    packsExposedRef.current = true;
    registerSuperProperties({ tt2_packs_variant: packsVariant });
    trackEvent("tt2_packs_exposed", { variant: packsVariant, product_area: "tiktok", platform: "tiktok" });
  }, [step, packsVariant]);

  const needsPosts = sel.likes != null || sel.views != null;
  const selectedPosts = useMemo(
    () => posts.filter((p) => selectedIds.includes(p.id)),
    [posts, selectedIds],
  );

  const go = (n: 1 | 2 | 3 | 4) => {
    setStep(n);
    scrollToStepMain();
  };

  const onLoaded = (p: TtProfile, ps: TtPost[]) => {
    setProfile(p);
    setPosts(ps);
    setAutoStart(false); // consume the handoff so a manual "back" shows the input
    go(2);
  };

  const fromQuantities = () => {
    trackEvent("cta_clicked", { product_area: "tiktok", feature_name: "tt2_quantities", step: 2 });
    go(needsPosts ? 3 : 4);
  };
  const fromPosts = () => {
    trackEvent("cta_clicked", { product_area: "tiktok", feature_name: "tt2_posts", step: 3 });
    go(4);
  };
  const backFromCheckout = () => go(needsPosts ? 3 : 2);

  return (
    <div data-i18n-skip>
      <div className="paper-frame with-tt-halo" data-step-main>
        <TtHeader />
        {step === 1 && (
          <Step1Username username={username} setUsername={setUsername} onLoaded={onLoaded} autoStart={autoStart} fromPriceLabel={fromPriceLabel} />
        )}
        {step === 2 && (readyOnce ? (
          <Step2Quantities
            profile={profile}
            username={username}
            sel={sel}
            setSel={setSel}
            needsPosts={needsPosts}
            variant={packsVariant}
            onNext={fromQuantities}
            onBack={() => go(1)}
          />
        ) : (
          <PricingPacksLoading accent="var(--tt-red)" />
        ))}
        {step === 3 && (
          <Step3Posts
            posts={posts}
            sel={sel}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            needsPosts={needsPosts}
            onNext={fromPosts}
            onBack={() => go(2)}
          />
        )}
        {step === 4 && (
          <Step4Checkout
            country={country}
            profile={profile}
            username={username}
            email={email}
            setEmail={setEmail}
            sel={sel}
            selectedPosts={selectedPosts}
            needsPosts={needsPosts}
            onBack={backFromCheckout}
            onBackToStart={() => go(1)}
          />
        )}
      </div>
      <div className={step === 1 ? undefined : "hide-md-on-checkout"}>
        <WhyUs />
        <Reviews />
        <TtFAQ />
      </div>
      <TtFooter />
    </div>
  );
}
