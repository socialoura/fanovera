"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import TtHeader from "./components/TtHeader";
import Step1Packs from "./components/Step1Packs";
import Step2Username from "./components/Step2Username";
import Step3Checkout from "./components/Step3Checkout";
import WhyUs from "./components/WhyUs";
import Reviews from "./components/Reviews";
import TtFAQ from "./components/TtFAQ";
import TtFooter from "./components/TtFooter";
import type { TtProfile, TtMedia } from "./components/Step2Username";
import { PACKS, LIKES_PACKS, VIEWS_PACKS, type CountryId, type TikTokProductType, formatPrice, formatQty, getPacksForProduct } from "./data";
import PricingPacksLoading from "../components/PricingPacksLoading";
import { usePaymentIntent } from "../components/StripePayment";
import { useApplyCurrencyPricing, usePrefetchProductPricing } from "../lib/useCurrencyPricing";
import { useTrackPageVisit } from "../lib/useTrackPageVisit";
import { useProductAnalytics } from "../lib/useProductAnalytics";
import { trackEvent } from "../lib/analytics";
import { isValidCheckoutEmail } from "../lib/checkoutTargetValidation";
import { useFunnelPersistence } from "../lib/useFunnelPersistence";
import { scrollToStepMain } from "../lib/stepScroll";
import StickyMobileCTA from "../components/StickyMobileCTA";
import { useTikTokCopy } from "./i18n";

const STATIC_PACKS = PACKS.map((pack) => ({ ...pack }));
const STATIC_LIKES_PACKS = LIKES_PACKS.map((pack) => ({ ...pack }));
const STATIC_VIEWS_PACKS = VIEWS_PACKS.map((pack) => ({ ...pack }));

export default function TiktokPageClient() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const country: CountryId = "fr";
  const [pack, setPack] = useState(3);
  const search = useSearchParams();
  const initialProductType: TikTokProductType = (() => {
    const raw = (search?.get("product") || "").toLowerCase();
    return raw === "likes" || raw === "views" ? (raw as TikTokProductType) : "followers";
  })();
  const [productType, setProductType] = useState<TikTokProductType>(initialProductType);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<TtProfile | null>(null);
  const [postUrl, setPostUrl] = useState("");
  const [media, setMedia] = useState<TtMedia | null>(null);

  useEffect(() => {
    setUsername("");
    setProfile(null);
    setPostUrl("");
    setMedia(null);
  }, [productType]);
  const activePacks = getPacksForProduct(productType);
  // Apply DB pricing to all 3 product arrays so toggling between
  // Followers / Likes / Views all pick up admin-configured prices.
  const followersPricing = useApplyCurrencyPricing("tt_followers", PACKS, STATIC_PACKS);
  const likesPricing = useApplyCurrencyPricing("tt_likes", LIKES_PACKS, STATIC_LIKES_PACKS);
  const viewsPricing = useApplyCurrencyPricing("tt_views", VIEWS_PACKS, STATIC_VIEWS_PACKS);
  const pricing = productType === "likes" ? likesPricing : productType === "views" ? viewsPricing : followersPricing;
  const { canDisplayPricing, currency, experiment } = pricing;

  const safePack = Math.min(pack, Math.max(0, activePacks.length - 1));
  const selectedPack = activePacks[safePack] ?? activePacks[0];
  usePrefetchProductPricing();
  useTrackPageVisit("tiktok");
  const [readyOnce, setReadyOnce] = useState(canDisplayPricing);
  useEffect(() => { if (canDisplayPricing) setReadyOnce(true); }, [canDisplayPricing]);
  const tCopy = useTikTokCopy();
  useFunnelPersistence("tiktok", { pack: safePack, username, email }, { setPack, setUsername, setEmail });
  useProductAnalytics({
    productArea: "tiktok",
    step,
    plan: String(selectedPack.qty),
    price: selectedPack.price,
    currency,
    assignment: experiment.assignment,
    anonymousId: experiment.anonymousId,
    enabled: canDisplayPricing,
  });

  const subtotal = selectedPack.price;
  const total = subtotal;
  const emailValid = isValidCheckoutEmail(email);
  const isMediaProduct = productType === "likes" || productType === "views";
  const cleanUsername = username.replace(/^@/, "").trim();
  // The live profile/media preview uses strict-format checks to decide whether
  // to call the upstream API. The checkout gate is intentionally looser: as
  // long as the visitor has typed *something* non-empty, we let them proceed
  // — the API is a reassurance, never a gate. Refund risk on typos is
  // accepted in exchange for higher conversion.
  const targetReady = isMediaProduct ? postUrl.trim().length > 0 : cleanUsername.length > 0;
  const { clientSecret } = usePaymentIntent({
    amount: Math.round(total * 100),
    currency: currency.toLowerCase(),
    email,
    username: isMediaProduct ? (media?.user.username || cleanUsername) : cleanUsername,
    platform: "tiktok",
    cart: [{ qty: selectedPack.qty, bonus: selectedPack.bonus, country, postUrl: isMediaProduct ? postUrl.trim() : undefined }],
    followersBefore: profile?.followersCount ?? 0,
    enabled: step >= 2 && targetReady && emailValid,
  });

  const next = () => {
    trackEvent(step === 1 ? "pricing_cta_clicked" : "cta_clicked", {
      product_area: "tiktok",
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
      <div className="paper-frame with-tt-halo" data-step-main>
        <TtHeader />
        {step === 1 && (readyOnce ? <Step1Packs country={country} pack={safePack} setPack={setPack} onNext={next} productType={productType} setProductType={setProductType} /> : <PricingPacksLoading accent="var(--tt-red)" />)}
        {step === 2 && (
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
        )}
        {step === 3 && <Step3Checkout country={country} pack={safePack} username={username} postUrl={postUrl} email={email} profile={profile} clientSecret={clientSecret} onBack={back} onBackToPacks={backToPacks} />}
      </div>
      <div className={step === 1 ? undefined : "hide-md-on-checkout"}>
        <WhyUs />
        <Reviews />
        <TtFAQ />
      </div>
      <TtFooter />
      <StickyMobileCTA
        visible={(step === 1 || step === 2) && canDisplayPricing}
        label={tCopy.step1.continue}
        priceLabel={formatPrice(selectedPack, country)}
        subLabel={step === 2 && (profile || media)
          ? `+${formatQty(selectedPack.qty + selectedPack.bonus)} → @${username.replace(/^@/, "").trim() || profile?.username || media?.user.username || ""}`
          : `${formatQty(selectedPack.qty)} + ${formatQty(selectedPack.bonus)}`}
        disabled={step === 2 && !(targetReady && emailValid)}
        accent="var(--tt-red)"
        onClick={next}
      />
    </div>
  );
}
