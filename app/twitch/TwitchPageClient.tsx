"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import TwHeader from "./components/TwHeader";
import Step1Packs from "./components/Step1Packs";
import Step2Username from "./components/Step2Username";
import Step3Checkout from "./components/Step3Checkout";
import WhyUs from "./components/WhyUs";
import Reviews from "./components/Reviews";
import TwFAQ from "./components/TwFAQ";
import TwFooter from "./components/TwFooter";
import type { TwProfile } from "./components/Step2Username";
import { PACKS, AI_VIEWERS_PACKS, type CountryId, type TwitchProductType, formatPrice, formatQty, getPacksForProduct } from "./data";
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
import { useTwitchCopy } from "./i18n";

const STATIC_PACKS = PACKS.map((pack) => ({ ...pack }));
const STATIC_AI_VIEWERS_PACKS = AI_VIEWERS_PACKS.map((pack) => ({ ...pack }));

export default function TwitchPageClient() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const country: CountryId = "fr";
  const [pack, setPack] = useState(3);
  const search = useSearchParams();
  const initialProductType: TwitchProductType = (() => {
    const raw = (search?.get("product") || "").toLowerCase();
    return raw === "ai_viewers" || raw === "ai-viewers" ? "ai_viewers" : "followers";
  })();
  const [productType, setProductType] = useState<TwitchProductType>(initialProductType);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [scheduledStartAt, setScheduledStartAt] = useState("");
  const [profile, setProfile] = useState<TwProfile | null>(null);

  useEffect(() => {
    setUsername("");
    setProfile(null);
    setScheduledStartAt("");
  }, [productType]);

  // Apply DB pricing to BOTH product arrays so toggling between Followers and
  // AI Viewers picks up admin-configured prices in either case. Each hook
  // mutates a distinct array (PACKS / AI_VIEWERS_PACKS), and Step1Packs reads
  // the right one via getPacksForProduct.
  const followersPricing = useApplyCurrencyPricing("tw_followers", PACKS, STATIC_PACKS);
  const aiViewersPricing = useApplyCurrencyPricing("tw_live_viewers", AI_VIEWERS_PACKS, STATIC_AI_VIEWERS_PACKS);
  const pricing = productType === "ai_viewers" ? aiViewersPricing : followersPricing;
  const { canDisplayPricing, currency, experiment } = pricing;
  const activePacks = getPacksForProduct(productType);

  const safePack = Math.min(pack, Math.max(0, activePacks.length - 1));
  const selectedPack = activePacks[safePack] ?? activePacks[0];
  useTrackPageVisit("twitch");
  const tCopy = useTwitchCopy();
  const hydration = useFunnelPersistence("twitch", { pack: safePack, username, email }, { setPack, setUsername, setEmail });
  useAutoSelectPopularPack(canDisplayPricing, activePacks, setPack, hydration);
  useProductAnalytics({
    productArea: "twitch",
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
  // Loose handle gate (any non-empty); strict username check stays in Step2
  // for the live preview only. Schedule remains strict because we literally
  // can't deliver live viewers without a future timestamp.
  const handleNonEmpty = username.replace(/^@/, "").trim().length > 0;
  const isLive = productType === "ai_viewers";
  const scheduleDate = scheduledStartAt ? new Date(scheduledStartAt) : null;
  const scheduleValid = !isLive || (Boolean(scheduleDate) && !isNaN((scheduleDate as Date).getTime()) && (scheduleDate as Date).getTime() - Date.now() >= 60 * 60 * 1000);
  const targetReady = handleNonEmpty && scheduleValid;

  const { clientSecret } = usePaymentIntent({
    amount: Math.round(total * 100),
    currency: currency.toLowerCase(),
    email,
    username: username.replace(/^@/, "").trim(),
    platform: "twitch",
    cart: [{
      qty: selectedPack.qty,
      bonus: selectedPack.bonus,
      country,
      ...(isLive && scheduledStartAt ? { scheduledStartAt } : {}),
    }],
    followersBefore: profile?.followersCount ?? 0,
    enabled: step >= 2 && targetReady && emailValid,
  });

  const next = () => {
    trackEvent(step === 1 ? "pricing_cta_clicked" : "cta_clicked", {
      product_area: "twitch",
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
      <div className="paper-frame with-tw-halo" data-step-main>
        <TwHeader />
        {step === 1 && (canDisplayPricing ? <Step1Packs country={country} pack={safePack} setPack={setPack} onNext={next} productType={productType} setProductType={setProductType} /> : <PricingPacksLoading accent="var(--tw-purple)" />)}
        {step === 2 && (
          <Step2Username
            country={country}
            pack={safePack}
            username={username}
            setUsername={setUsername}
            email={email}
            setEmail={setEmail}
            profile={profile}
            setProfile={setProfile}
            onNext={next}
            onBack={back}
            productType={productType}
            scheduledStartAt={scheduledStartAt}
            setScheduledStartAt={setScheduledStartAt}
          />
        )}
        {step === 3 && (
          <Step3Checkout
            country={country}
            pack={safePack}
            username={username}
            email={email}
            profile={profile}
            clientSecret={clientSecret}
            onBack={back}
            onBackToPacks={backToPacks}
            productType={productType}
            scheduledStartAt={scheduledStartAt}
          />
        )}
      </div>
      <div className={step === 1 ? undefined : "hide-md-on-checkout"}>
        <WhyUs />
        <Reviews />
        <TwFAQ />
      </div>
      <TwFooter />
      <StickyMobileCTA
        visible={(step === 1 || step === 2) && canDisplayPricing}
        label={tCopy.step1.continue}
        priceLabel={formatPrice(selectedPack, country)}
        subLabel={step === 2 && profile
          ? `+${formatQty(selectedPack.qty + selectedPack.bonus)} → @${username.replace(/^@/, "").trim() || profile.username}`
          : `${formatQty(selectedPack.qty)} + ${formatQty(selectedPack.bonus)}`}
        disabled={step === 2 && !(targetReady && emailValid)}
        accent="var(--tw-purple)"
        onClick={next}
      />
    </div>
  );
}
