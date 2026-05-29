"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import XHeader from "./components/XHeader";
import Step1Packs from "./components/Step1Packs";
import Step2Username from "./components/Step2Username";
import Step3Checkout from "./components/Step3Checkout";
import WhyUs from "./components/WhyUs";
import Reviews from "./components/Reviews";
import XFAQ from "./components/XFAQ";
import XFooter from "./components/XFooter";
import type { XProfile } from "./components/Step2Username";
import { PACKS, LIKES_PACKS, RETWEET_PACKS, type CountryId, type XProductType, formatPrice, formatQty, getPacksForProduct, getServiceForProduct, defaultPackIndex } from "./data";
import PricingPacksLoading from "../components/PricingPacksLoading";
import { usePaymentIntent } from "../components/StripePayment";
import { useApplyCurrencyPricing } from "../lib/useCurrencyPricing";
import { useTrackPageVisit } from "../lib/useTrackPageVisit";
import { useProductAnalytics } from "../lib/useProductAnalytics";
import { trackEvent } from "../lib/analytics";
import { isValidCheckoutEmail } from "../lib/checkoutTargetValidation";
import { useFunnelPersistence, useAutoSelectPopularPack } from "../lib/useFunnelPersistence";
import { scrollToStepMain } from "../lib/stepScroll";
import StickyMobileCTA from "../components/StickyMobileCTA";
import { useXCopy } from "./i18n";

const STATIC_PACKS = PACKS.map((pack) => ({ ...pack }));
const STATIC_LIKES_PACKS = LIKES_PACKS.map((pack) => ({ ...pack }));
const STATIC_RETWEET_PACKS = RETWEET_PACKS.map((pack) => ({ ...pack }));

export default function TwitterPageClient() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const country: CountryId = "fr";
  const search = useSearchParams();
  const initialProductType: XProductType = (() => {
    const raw = (search?.get("product") || "").toLowerCase();
    return raw === "likes" || raw === "retweets" ? (raw as XProductType) : "followers";
  })();
  const [pack, setPack] = useState(() => defaultPackIndex(initialProductType));
  const [productType, setProductType] = useState<XProductType>(initialProductType);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<XProfile | null>(null);
  const [postUrl, setPostUrl] = useState("");

  // Reset target input when switching product type — username/profile applies
  // to followers, postUrl (tweet link) applies to likes.
  useEffect(() => {
    setUsername("");
    setProfile(null);
    setPostUrl("");
  }, [productType]);

  const followersPricing = useApplyCurrencyPricing("x_followers", PACKS, STATIC_PACKS);
  const likesPricing = useApplyCurrencyPricing("x_likes", LIKES_PACKS, STATIC_LIKES_PACKS);
  const retweetsPricing = useApplyCurrencyPricing("x_retweets", RETWEET_PACKS, STATIC_RETWEET_PACKS);
  const { canDisplayPricing, currency, experiment } = productType === "likes" ? likesPricing : productType === "retweets" ? retweetsPricing : followersPricing;
  useTrackPageVisit("twitter");

  const activePacks = getPacksForProduct(productType);
  const isMediaProduct = productType === "likes" || productType === "retweets";
  const safePack = Math.min(pack, Math.max(0, activePacks.length - 1));
  const selectedPack = activePacks[safePack] ?? activePacks[0];
  const tCopy = useXCopy();
  const hydration = useFunnelPersistence("twitter", { pack: safePack, username, email }, { setPack, setUsername, setEmail });
  useAutoSelectPopularPack(canDisplayPricing, activePacks, setPack, hydration);
  useProductAnalytics({
    productArea: "twitter",
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
  const cleanUsername = username.replace(/^@/, "").trim();
  // Loose gate: any non-empty target proceeds; preview-side strict checks stay.
  const targetReady = isMediaProduct ? postUrl.trim().length > 0 : cleanUsername.length > 0;
  const { clientSecret } = usePaymentIntent({
    amount: Math.round(total * 100),
    currency: currency.toLowerCase(),
    email,
    username: cleanUsername,
    platform: "twitter",
    cart: [{ service: getServiceForProduct(productType), qty: selectedPack.qty, bonus: selectedPack.bonus, country, postUrl: isMediaProduct ? postUrl.trim() : undefined }],
    followersBefore: profile?.followersCount ?? 0,
    enabled: step >= 2 && targetReady && emailValid,
  });

  const next = () => {
    trackEvent(step === 1 ? "pricing_cta_clicked" : "cta_clicked", {
      product_area: "twitter",
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
    <>
      <div className="paper-frame with-x-halo" data-step-main>
        <XHeader />
        {step === 1 && (canDisplayPricing ? <Step1Packs country={country} pack={safePack} setPack={setPack} onNext={next} productType={productType} setProductType={setProductType} /> : <PricingPacksLoading accent="var(--x-ink)" />)}
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
            onNext={next}
            onBack={back}
          />
        )}
        {step === 3 && (
          <Step3Checkout
            country={country}
            pack={safePack}
            productType={productType}
            username={username}
            postUrl={postUrl}
            email={email}
            profile={profile}
            clientSecret={clientSecret}
            onBack={back}
            onBackToPacks={backToPacks}
          />
        )}
      </div>
      <div className={step === 1 ? undefined : "hide-md-on-checkout"}>
        <WhyUs />
        <Reviews />
        <XFAQ />
      </div>
      <XFooter />
      <StickyMobileCTA
        visible={(step === 1 || step === 2) && canDisplayPricing}
        label={tCopy.step1.continue}
        priceLabel={formatPrice(selectedPack, country)}
        subLabel={step === 2 && (profile || (isMediaProduct && postUrl.trim()))
          ? (isMediaProduct
              ? `+${formatQty(selectedPack.qty + selectedPack.bonus)} ${productType === "retweets" ? tCopy.step1.audienceRetweets : tCopy.step1.audienceLikes}`
              : `+${formatQty(selectedPack.qty + selectedPack.bonus)} → @${cleanUsername || profile?.username || ""}`)
          : `${formatQty(selectedPack.qty)} + ${formatQty(selectedPack.bonus)}`}
        disabled={step === 2 && !(targetReady && emailValid)}
        accent="var(--x-ink)"
        onClick={next}
      />
    </>
  );
}
