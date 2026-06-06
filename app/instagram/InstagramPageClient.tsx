"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useI18n } from "../i18n/I18nProvider";
import { pickPackIndexByFollowers } from "../lib/promoFlow";
import IgHeader from "./components/IgHeader";
import Step1Packs from "./components/Step1Packs";
import Step2Username from "./components/Step2Username";
import Step3Checkout from "./components/Step3Checkout";
import StepMergedCheckout from "./components/StepMergedCheckout";
import WhyUs from "./components/WhyUs";
import Reviews from "./components/Reviews";
import IgFAQ from "./components/IgFAQ";
import IgFooter from "./components/IgFooter";
import { PACKS, LIKES_PACKS, VIEWS_PACKS, REPOST_PACKS, type CountryId, type InstagramProductType, formatPrice, formatQty, getPacksForProduct, getServiceForProduct, defaultPackIndex } from "./data";
import PricingPacksLoading from "../components/PricingPacksLoading";
import { usePaymentIntent } from "../components/StripePayment";
import { useApplyCurrencyPricing, usePrefetchProductPricing } from "../lib/useCurrencyPricing";
import { useTrackPageVisit } from "../lib/useTrackPageVisit";
import { useProductAnalytics } from "../lib/useProductAnalytics";
import { trackEvent, registerSuperProperties } from "../lib/analytics";
import { type CheckoutFlowVariant } from "../lib/checkoutFlow";
import { isValidCheckoutEmail } from "../lib/checkoutTargetValidation";
import { useFunnelPersistence, useAutoSelectPopularPack } from "../lib/useFunnelPersistence";
import { scrollToStepMain } from "../lib/stepScroll";
import { useInstagramCopy } from "./i18n";

export type IgProfile = {
  username: string;
  fullName: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  mediaCount: number;
  bio: string;
  verified: boolean;
};

export type IgMedia = {
  id: string;
  code: string;
  mediaType: number;
  thumbnailUrl: string;
  videoUrl: string;
  likeCount: number;
  playCount: number;
  commentCount: number;
  caption: string;
  takenAt: number;
  user: {
    username: string;
    fullName: string;
    avatarUrl: string;
    verified: boolean;
  };
};

const STATIC_PACKS = PACKS.map((pack) => ({ ...pack }));
const STATIC_LIKES_PACKS = LIKES_PACKS.map((pack) => ({ ...pack }));
const STATIC_VIEWS_PACKS = VIEWS_PACKS.map((pack) => ({ ...pack }));
const STATIC_REPOST_PACKS = REPOST_PACKS.map((pack) => ({ ...pack }));

export default function InstagramPageClient({ checkoutFlowVariant = "control" }: { checkoutFlowVariant?: CheckoutFlowVariant } = {}) {
  const isMerged = checkoutFlowVariant === "merged";
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const country: CountryId = "fr";
  const search = useSearchParams();
  const initialProductType: InstagramProductType = (() => {
    const raw = (search?.get("product") || "").toLowerCase();
    return raw === "likes" || raw === "views" || raw === "reposts" ? (raw as InstagramProductType) : "followers";
  })();
  const [pack, setPack] = useState(() => defaultPackIndex(initialProductType));
  const [productType, setProductType] = useState<InstagramProductType>(initialProductType);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<IgProfile | null>(null);
  const [postUrl, setPostUrl] = useState("");
  const [media, setMedia] = useState<IgMedia | null>(null);

  // Handoff from the /promo username-first variant: the @ arrives in `?u=`.
  // We seed the username and fetch the profile at page level so the packs step
  // can greet the visitor with their real profile + a personalised projection,
  // and so we can pre-select a pack sized to their audience.
  const { locale } = useI18n();
  const handoffUsername = (() => {
    const u = search?.get("u") || "";
    return u ? u.replace(/^@+/, "").trim() : "";
  })();
  const hasHandoff = handoffUsername.length > 0 && initialProductType === "followers";
  const [handoffProfile, setHandoffProfile] = useState<IgProfile | null>(null);
  // True while the handoff profile is being fetched, so the packs step can show
  // a skeleton instead of a blank gap (the lookup can take 1–2s, and fast
  // clickers would otherwise land on packs with no preview at all). Initialised
  // false (not from `hasHandoff`) to avoid an SSR/client hydration mismatch —
  // it's flipped on inside the effect right after mount.
  const [handoffLoading, setHandoffLoading] = useState(false);
  const handoffAppliedRef = useRef(false);

  // Reset target input when switching product type — username/profile applies to
  // followers, postUrl/media applies to likes/views.
  useEffect(() => {
    setUsername("");
    setProfile(null);
    setPostUrl("");
    setMedia(null);
  }, [productType]);
  // Apply DB pricing to all 3 product arrays so toggling between
  // Followers / Likes / Views all pick up admin-configured prices.
  const followersPricing = useApplyCurrencyPricing("ig_followers", PACKS, STATIC_PACKS);
  const likesPricing = useApplyCurrencyPricing("ig_likes", LIKES_PACKS, STATIC_LIKES_PACKS);
  const viewsPricing = useApplyCurrencyPricing("ig_views", VIEWS_PACKS, STATIC_VIEWS_PACKS);
  const repostsPricing = useApplyCurrencyPricing("ig_reposts", REPOST_PACKS, STATIC_REPOST_PACKS);
  const pricing = productType === "likes" ? likesPricing : productType === "views" ? viewsPricing : productType === "reposts" ? repostsPricing : followersPricing;
  const { canDisplayPricing, currency, experiment } = pricing;
  const activePacks = getPacksForProduct(productType);

  const safePack = Math.min(pack, Math.max(0, activePacks.length - 1));
  const selectedPack = activePacks[safePack] ?? activePacks[0];
  usePrefetchProductPricing();
  useTrackPageVisit("instagram");
  const [readyOnce, setReadyOnce] = useState(canDisplayPricing);
  useEffect(() => { if (canDisplayPricing) setReadyOnce(true); }, [canDisplayPricing]);
  const t = useInstagramCopy();
  const stepperLabels = isMerged ? [t.stepper[0], t.stepperMergedStep2] : undefined;
  // Fire the merged-checkout A/B exposure once per IG page view (both arms) and
  // register the variant super property so checkout/payment events carry it for
  // the admin results query.
  const checkoutFlowExposedRef = useRef(false);
  useEffect(() => {
    if (checkoutFlowExposedRef.current) return;
    checkoutFlowExposedRef.current = true;
    registerSuperProperties({ checkout_flow_variant: checkoutFlowVariant });
    trackEvent("checkout_flow_exposed", {
      product_area: "instagram",
      platform: "instagram",
      variant: checkoutFlowVariant,
      locale,
    });
  }, [checkoutFlowVariant, locale]);
  const hydration = useFunnelPersistence("instagram", { pack: safePack, username, email }, { setPack, setUsername, setEmail });
  // Skip the "popular" auto-select for handoff visitors — the smart default
  // (sized to their follower count) owns the pack instead.
  useAutoSelectPopularPack(canDisplayPricing && !hasHandoff, activePacks, setPack, hydration);

  // Apply the /promo handoff once on mount. Declared AFTER useFunnelPersistence
  // so seeding the username wins over both the productType reset and the
  // persistence restore (both run earlier in mount order).
  useEffect(() => {
    if (handoffAppliedRef.current || !hasHandoff) return;
    handoffAppliedRef.current = true;
    setUsername(handoffUsername);

    const cleanHandle = handoffUsername.replace(/^@+/, "").trim().toLowerCase();
    // Invalid format → keep the seeded username (order still proceeds, loose
    // gate) but skip the lookup: no preview, no API cost.
    if (!/^[a-zA-Z0-9._]{2,30}$/.test(cleanHandle)) return; // loading stays false

    setHandoffLoading(true);
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/instagram/profile?username=${encodeURIComponent(cleanHandle)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return; // not found / private → no preview, order still allowed
        const json = (await res.json()) as IgProfile;
        if (controller.signal.aborted) return;
        setHandoffProfile(json);
        const idx = pickPackIndexByFollowers(getPacksForProduct("followers"), Number(json?.followersCount) || 0);
        if (idx >= 0) setPack(idx);
      } catch {
        /* network error → no preview; order still proceeds */
      } finally {
        if (!controller.signal.aborted) setHandoffLoading(false);
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHandoff, handoffUsername]);
  useProductAnalytics({
    productArea: "instagram",
    step,
    plan: String(selectedPack.qty),
    price: selectedPack.price,
    currency,
    assignment: experiment.assignment,
    anonymousId: experiment.anonymousId,
    enabled: canDisplayPricing,
  });

  // Pre-create the Stripe PaymentIntent as soon as we have the data, so Step 3
  // displays instantly without the "Chargement du paiement sécurisé…" spinner.
  const subtotal = selectedPack.price;
  const total = subtotal;
  const amountCents = Math.round(total * 100);
  const emailValid = isValidCheckoutEmail(email);
  const cleanUsername = username.replace(/^@/, "").trim();
  const isMediaProduct = productType === "likes" || productType === "views" || productType === "reposts";
  // Checkout gate is intentionally loose: any non-empty target lets the user
  // proceed. Strict-format checks still drive the live preview inside Step2
  // but never block payment.
  const targetReady = isMediaProduct ? postUrl.trim().length > 0 : cleanUsername.length > 0;
  const { clientSecret } = usePaymentIntent({
    amount: amountCents,
    currency: currency.toLowerCase(),
    email,
    username: isMediaProduct ? (media?.user.username || cleanUsername) : cleanUsername,
    platform: "instagram",
    cart: [{ service: getServiceForProduct(productType), qty: selectedPack.qty, bonus: selectedPack.bonus, country, postUrl: isMediaProduct ? postUrl.trim() : undefined }],
    followersBefore: profile?.followersCount ?? 0,
    enabled: step >= 2 && targetReady && emailValid,
  });

  const next = () => {
    trackEvent(step === 1 ? "pricing_cta_clicked" : "cta_clicked", {
      product_area: "instagram",
      feature_name: step === 1 ? "pricing" : "checkout_steps",
      step,
      plan: String(selectedPack.qty),
      price: selectedPack.price,
      currency,
    });
    setStep((s) => (Math.min(3, s + 1) as 1 | 2 | 3));
    scrollToStepMain();
  };
  const back = () => {
    setStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3));
    scrollToStepMain();
  };
  const backToPacks = () => {
    setStep(1);
    scrollToStepMain();
  };

  return (
    <div data-i18n-skip>
      <div className="paper-frame with-ig-halo" data-step-main>
        <IgHeader />
        {step === 1 && productType === "followers" && handoffLoading && !handoffProfile && (
          // Skeleton placeholder while the @ from /promo is being looked up, so
          // fast clickers don't land on a blank packs page. Reserves the card's
          // height to avoid layout shift when the real profile pops in.
          <div className="container" style={{ paddingTop: 24 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                maxWidth: 520,
                margin: "0 auto",
                padding: "18px 20px",
                background: "linear-gradient(135deg, rgba(214,41,118,0.06), rgba(254,68,85,0.04))",
                border: "1px solid rgba(214,41,118,0.18)",
                borderRadius: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.09) 50%, rgba(0,0,0,0.05) 75%)", backgroundSize: "200% 100%", animation: "yt-shimmer 1.6s infinite" }} />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
                    @{handoffUsername.replace(/^@+/, "")}
                  </div>
                  {[60, 80].map((w) => (
                    <div key={w} style={{ height: 11, width: `${w}%`, borderRadius: 6, background: "linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.09) 50%, rgba(0,0,0,0.05) 75%)", backgroundSize: "200% 100%", animation: "yt-shimmer 1.6s infinite" }} />
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-3)", paddingTop: 12, borderTop: "1px solid rgba(214,41,118,0.12)" }}>
                {locale?.toLowerCase().startsWith("fr") ? "Chargement de votre profil…" : "Loading your profile…"}
              </div>
            </div>
          </div>
        )}
        {step === 1 && handoffProfile && productType === "followers" && (
          <div className="container" style={{ paddingTop: 24 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                maxWidth: 520,
                margin: "0 auto",
                padding: "18px 20px",
                background: "linear-gradient(135deg, rgba(214,41,118,0.06), rgba(254,68,85,0.04))",
                border: "1px solid rgba(214,41,118,0.25)",
                borderRadius: 16,
              }}
            >
              {/* Real IG profile header — photo, name, stats, bio. Seeing their
                  own account while picking a pack makes the purchase concrete. */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "var(--paper-2)", border: "2px solid rgba(214,41,118,0.35)" }}>
                  {handoffProfile.avatarUrl ? (
                    <Image src={handoffProfile.avatarUrl} alt={handoffProfile.username} width={64} height={64} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 24, color: "var(--ig-2)" }}>
                      {handoffProfile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {handoffProfile.fullName && handoffProfile.fullName.toLowerCase() !== handoffProfile.username.toLowerCase() ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 800, fontSize: 16, overflow: "hidden" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{handoffProfile.fullName}</span>
                      {handoffProfile.verified && (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="#3897f0" style={{ flexShrink: 0 }} aria-label="verified">
                          <path d="M12 2l2.4 1.8 3 .1 1 2.8 2.4 1.8-.9 2.9.9 2.9-2.4 1.8-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8L3.2 15.5l.9-2.9-.9-2.9 2.4-1.8 1-2.8 3-.1z" />
                          <path d="M10.6 14.6l-2.2-2.2 1.1-1.1 1.1 1.1 3.3-3.3 1.1 1.1z" fill="#fff" />
                        </svg>
                      )}
                    </div>
                  ) : null}
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    @{handoffProfile.username}
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 13 }}>
                    <span><strong style={{ fontWeight: 800 }}>{formatQty(handoffProfile.mediaCount)}</strong> <span style={{ color: "var(--ink-3)" }}>{locale?.toLowerCase().startsWith("fr") ? "posts" : "posts"}</span></span>
                    <span><strong style={{ fontWeight: 800 }}>{formatQty(handoffProfile.followersCount)}</strong> <span style={{ color: "var(--ink-3)" }}>{locale?.toLowerCase().startsWith("fr") ? "abonnés" : "followers"}</span></span>
                    <span><strong style={{ fontWeight: 800 }}>{formatQty(handoffProfile.followingCount)}</strong> <span style={{ color: "var(--ink-3)" }}>{locale?.toLowerCase().startsWith("fr") ? "suivi(e)s" : "following"}</span></span>
                  </div>
                </div>
              </div>

              {handoffProfile.bio ? (
                <div style={{ fontSize: 13, lineHeight: 1.45, color: "var(--ink-2)", whiteSpace: "pre-line", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {handoffProfile.bio}
                </div>
              ) : null}

              <div style={{ fontSize: 14, paddingTop: 12, borderTop: "1px solid rgba(214,41,118,0.18)" }}>
                <span style={{ color: "var(--ink-2)" }}>{formatQty(handoffProfile.followersCount)} {locale?.toLowerCase().startsWith("fr") ? "abonnés" : "followers"}</span>
                <span style={{ color: "var(--ink-3)", margin: "0 6px" }}>→</span>
                <span style={{ fontWeight: 800, color: "var(--green)" }}>
                  {formatQty(handoffProfile.followersCount + selectedPack.qty + selectedPack.bonus)}
                </span>
                <span style={{ color: "var(--ink-3)", marginLeft: 6 }}>
                  {locale?.toLowerCase().startsWith("fr") ? "avec ce pack" : "with this pack"}
                </span>
              </div>
            </div>
          </div>
        )}
        {step === 1 && (readyOnce ? (
          <Step1Packs
            country={country}
            pack={safePack}
            setPack={setPack}
            onNext={next}
            productType={productType}
            setProductType={setProductType}
            stepperLabels={stepperLabels}
          />
        ) : <PricingPacksLoading accent="var(--ig-2)" />)}
        {step === 2 && (
          isMerged ? (
            <StepMergedCheckout
              country={country}
              pack={safePack}
              productType={productType}
              username={username}
              setUsername={setUsername}
              postUrl={postUrl}
              setPostUrl={setPostUrl}
              email={email}
              setEmail={setEmail}
              profile={profile}
              setProfile={setProfile}
              media={media}
              setMedia={setMedia}
              clientSecret={clientSecret}
              onBackToPacks={backToPacks}
              stepperLabels={stepperLabels}
            />
          ) : (
            <Step2Username
              country={country}
              pack={safePack}
              productType={productType}
              username={username}
              setUsername={setUsername}
              postUrl={postUrl}
              setPostUrl={setPostUrl}
              email={email}
              setEmail={setEmail}
              profile={profile}
              setProfile={setProfile}
              media={media}
              setMedia={setMedia}
              onNext={next}
              onBack={back}
            />
          )
        )}
        {step === 3 && !isMerged && (
          <Step3Checkout country={country} pack={safePack} username={username} postUrl={postUrl} email={email} profile={profile} clientSecret={clientSecret} onBack={back} onBackToPacks={backToPacks} productType={productType} />
        )}
      </div>
      <div className={step === 1 ? undefined : "hide-md-on-checkout"}>
        <WhyUs />
        <Reviews />
        <IgFAQ />
      </div>
      <IgFooter />
    </div>
  );
}
