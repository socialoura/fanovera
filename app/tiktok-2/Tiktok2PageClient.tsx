"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import TtHeader from "../tiktok/components/TtHeader";
import WhyUs from "../tiktok/components/WhyUs";
import Reviews from "../tiktok/components/Reviews";
import TtFAQ from "../tiktok/components/TtFAQ";
import TtFooter from "../tiktok/components/TtFooter";
import { PACKS, LIKES_PACKS, VIEWS_PACKS, fmtEuro } from "../tiktok/data";
import PricingPacksLoading from "../components/PricingPacksLoading";
import { useApplyCurrencyPricing, usePrefetchProductPricing, useCurrencyPreference } from "../lib/useCurrencyPricing";
import { useTrackPageVisit } from "../lib/useTrackPageVisit";
import { trackEvent, registerSuperProperties, currentAttributionProperties } from "../lib/analytics";
import { getTt2PacksBucket, resolveTt2PacksVariant, type Tt2PacksVariant } from "../lib/tt2PacksExperiment";
import { scrollToStepMain } from "../lib/stepScroll";
import { peekProfileHandoff, clearProfileHandoff } from "../lib/profileHandoff";
import Step1Username from "./components/Step1Username";
import Step2Quantities from "./components/Step2Quantities";
import Step3Posts from "./components/Step3Posts";
import Step4Checkout from "./components/Step4Checkout";
import { PRODUCT_META, PRODUCT_ORDER, type Selection } from "./products";
import type { TtProfile, TtPost } from "./types";

const STATIC_PACKS = PACKS.map((p) => ({ ...p }));
const STATIC_LIKES = LIKES_PACKS.map((p) => ({ ...p }));
const STATIC_VIEWS = VIEWS_PACKS.map((p) => ({ ...p }));

const SS_KEY = "tt2_state";

function loadSessionState(): { username?: string; sel?: Selection; selectedIds?: string[]; email?: string } | null {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSessionState(state: { username: string; sel: Selection; selectedIds: string[]; email: string }) {
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(state)); } catch { /* quota */ }
}

export default function Tiktok2PageClient({ packsMode = "ab" }: { packsMode?: string }) {
  const { country: geoCountry } = useCurrencyPreference();
  const country = geoCountry || "fr";

  const search = useSearchParams();
  const handoffHandle = (search?.get("u") || "").replace(/^@+/, "").trim();

  // Restore session state on mount (survives refresh / back-navigation)
  const restored = useRef(handoffHandle ? null : loadSessionState());
  // Profile prefetched on /promo and handed off client-side. When present we
  // open straight on step 2 (profile + packs) and skip Step1's loading scan.
  const handoffProfile = useRef<TtProfile | null>(
    handoffHandle ? peekProfileHandoff<TtProfile>("tiktok", handoffHandle) : null,
  );
  const hasHandoff = handoffProfile.current != null;
  const [step, setStep] = useState<1 | 2 | 3 | 4>(hasHandoff ? 2 : 1);
  const [username, setUsername] = useState(handoffHandle || restored.current?.username || "");
  const [autoStart, setAutoStart] = useState(handoffHandle.length > 0 && !hasHandoff);
  const [email, setEmail] = useState(restored.current?.email || "");
  const [profile, setProfile] = useState<TtProfile | null>(hasHandoff ? handoffProfile.current : null);
  const [posts, setPosts] = useState<TtPost[]>([]);
  const [sel, setSel] = useState<Selection>(restored.current?.sel || { followers: null, likes: null, views: null });
  const [selectedIds, setSelectedIds] = useState<string[]>(restored.current?.selectedIds || []);

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

  // Persist key state to sessionStorage so a refresh/back doesn't lose progress
  useEffect(() => {
    saveSessionState({ username, sel, selectedIds, email });
  }, [username, sel, selectedIds, email]);

  usePrefetchProductPricing();
  useTrackPageVisit("tiktok");

  // Register `flow: "tt2"` once so every downstream event (checkout_started,
  // payment_succeeded, …) from StripeCheckout carries it without modifying
  // that shared component. Page view fires once per session.
  useEffect(() => {
    registerSuperProperties({ flow: "tt2" });
    trackEvent("tiktok2_page_viewed", {
      product_area: "tiktok",
      platform: "tiktok",
      from_promo: handoffHandle.length > 0,
      ...currentAttributionProperties(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [readyOnce, setReadyOnce] = useState(canDisplayPricing);
  useEffect(() => { if (canDisplayPricing) setReadyOnce(true); }, [canDisplayPricing]);

  const STEP_NAMES: Record<number, string> = { 2: "quantities", 3: "posts", 4: "checkout" };
  useEffect(() => {
    if (step === 1) return;
    trackEvent("tt2_step_viewed", { step, step_name: STEP_NAMES[step], product_area: "tiktok", platform: "tiktok" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

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

  const onLoaded = (p: TtProfile, _ps: TtPost[]) => {
    setProfile(p);
    setAutoStart(false);
    go(2);
    // Fetch posts in background — ready by the time user reaches step 3
    const handle = (p.username || username).replace(/^@/, "").trim();
    fetch(`/api/tiktok/posts?username=${encodeURIComponent(handle)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (!json?.posts) return;
        const fetched: TtPost[] = json.posts;
        setPosts(fetched);
        // Pre-select the 4 most recent videos (user can adjust)
        if (selectedIds.length === 0) {
          setSelectedIds(fetched.slice(0, 4).map((p) => p.id));
        }
      })
      .catch(() => {});
  };

  // Consume the /promo profile handoff once: we already opened on step 2 with
  // the profile, so just replicate onLoaded's side effects (validation tracking
  // + background posts fetch) that Step1's scan would normally have run.
  useEffect(() => {
    const p = handoffProfile.current;
    if (!hasHandoff || !p) return;
    clearProfileHandoff();
    trackEvent("username_validated", {
      product_area: "tiktok",
      platform: "tiktok",
      followers_count: p.followersCount || 0,
      from_promo: true,
    });
    const handle = (p.username || username).replace(/^@/, "").trim();
    fetch(`/api/tiktok/posts?username=${encodeURIComponent(handle)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json?.posts) return;
        const fetched: TtPost[] = json.posts;
        setPosts(fetched);
        if (selectedIds.length === 0) setSelectedIds(fetched.slice(0, 4).map((x) => x.id));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intercept selection changes to fire per-product tracking without modifying
  // Step2Quantities (which has no analytics dependency).
  const handleSetSel = (newSel: Selection) => {
    PRODUCT_ORDER.forEach((k) => {
      const wasOn = sel[k] != null;
      const isOn = newSel[k] != null;
      if (!wasOn && isOn) {
        const pack = PRODUCT_META[k].packs[newSel[k] as number];
        trackEvent("tt2_product_selected", { product: k, qty: pack.qty, price: pack.price, product_area: "tiktok", platform: "tiktok" });
      } else if (wasOn && !isOn) {
        trackEvent("tt2_product_removed", { product: k, product_area: "tiktok", platform: "tiktok" });
      } else if (wasOn && isOn && newSel[k] !== sel[k]) {
        const pack = PRODUCT_META[k].packs[newSel[k] as number];
        trackEvent("tt2_product_selected", { product: k, qty: pack.qty, price: pack.price, product_area: "tiktok", platform: "tiktok" });
      }
    });
    setSel(newSel);
  };

  const fromQuantities = () => {
    trackEvent("cta_clicked", { product_area: "tiktok", feature_name: "tt2_quantities", step: 2 });
    go(needsPosts ? 3 : 4);
  };
  const fromPosts = () => {
    trackEvent("tt2_posts_confirmed", { posts_count: selectedIds.length, product_area: "tiktok", platform: "tiktok" });
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
            setSel={handleSetSel}
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
