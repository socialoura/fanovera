"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import YtHeader from "./components/YtHeader";
import Step1Packs from "./components/Step1Packs";
import Step2Username from "./components/Step2Username";
import Step2Channel from "./components/Step2Channel";
import Step3Checkout from "./components/Step3Checkout";
import WhyUs from "./components/WhyUs";
import Reviews from "./components/Reviews";
import YtFAQ from "./components/YtFAQ";
import YtFooter from "./components/YtFooter";
import type { YtPreview } from "./components/Step2Username";
import { PACKS, SUBSCRIBERS_PACKS, type CountryId, type YouTubeProductType, formatPrice, formatQty, getPacksForProduct } from "./data";
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
import { useYouTubeCopy } from "./i18n";

const STATIC_PACKS = PACKS.map((pack) => ({ ...pack }));
const STATIC_SUBSCRIBERS_PACKS = SUBSCRIBERS_PACKS.map((pack) => ({ ...pack }));

export default function YoutubePageClient() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const country: CountryId = "fr";
  const [pack, setPack] = useState(3);
  const search = useSearchParams();
  const initialProductType: YouTubeProductType = (() => {
    const raw = (search?.get("product") || "").toLowerCase();
    return raw === "subscribers" ? "subscribers" : "views";
  })();
  const [productType, setProductType] = useState<YouTubeProductType>(initialProductType);
  const [username, setUsername] = useState("");
  const [channelInput, setChannelInput] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<YtPreview | null>(null);

  useEffect(() => {
    setUsername("");
    setChannelInput("");
    setProfile(null);
  }, [productType]);
  // Apply DB pricing to BOTH product arrays so toggling between Views and
  // Subscribers picks up admin-configured prices in either case.
  const viewsPricing = useApplyCurrencyPricing("yt_views", PACKS, STATIC_PACKS);
  const subscribersPricing = useApplyCurrencyPricing("yt_subscribers", SUBSCRIBERS_PACKS, STATIC_SUBSCRIBERS_PACKS);
  const pricing = productType === "subscribers" ? subscribersPricing : viewsPricing;
  const { canDisplayPricing, currency, experiment } = pricing;
  const activePacks = getPacksForProduct(productType);

  const safePack = Math.min(pack, Math.max(0, activePacks.length - 1));
  const selectedPack = activePacks[safePack] ?? activePacks[0];
  usePrefetchProductPricing();
  useTrackPageVisit("youtube");
  const [readyOnce, setReadyOnce] = useState(canDisplayPricing);
  useEffect(() => { if (canDisplayPricing) setReadyOnce(true); }, [canDisplayPricing]);
  const tCopy = useYouTubeCopy();
  useFunnelPersistence("youtube", { pack: safePack, username, email }, { setPack, setUsername, setEmail });
  useProductAnalytics({
    productArea: "youtube",
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
  const isSubscribers = productType === "subscribers";
  const activeInput = isSubscribers ? channelInput.trim() : username.trim();
  // Checkout gate is intentionally loose: any non-empty target proceeds.
  // The strict validators still drive the live preview, never the payment.
  const activeInputValid = activeInput.length > 0;
  const { clientSecret } = usePaymentIntent({
    amount: Math.round(total * 100),
    currency: currency.toLowerCase(),
    email,
    username: activeInput,
    platform: "youtube",
    cart: [{ qty: selectedPack.qty, bonus: selectedPack.bonus, country, videoUrl: isSubscribers ? "" : username.trim(), videoId: profile?.id }],
    followersBefore: profile?.channel?.subscribers ?? 0,
    enabled: step >= 2 && activeInputValid && emailValid,
  });

  const next = () => {
    trackEvent(step === 1 ? "pricing_cta_clicked" : "cta_clicked", {
      product_area: "youtube",
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
      <div className="paper-frame with-yt-halo" data-step-main>
        <YtHeader />
        {step === 1 && (readyOnce ? <Step1Packs country={country} pack={safePack} setPack={setPack} onNext={next} productType={productType} setProductType={setProductType} /> : <PricingPacksLoading accent="var(--yt-red)" />)}
        {step === 2 && isSubscribers && (
          <Step2Channel
            country={country}
            pack={safePack}
            channelInput={channelInput}
            setChannelInput={setChannelInput}
            email={email}
            setEmail={setEmail}
            profile={profile}
            setProfile={setProfile}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 2 && !isSubscribers && (
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
          />
        )}
      </div>
      <div className={step === 1 ? undefined : "hide-md-on-checkout"}>
        <WhyUs />
        <Reviews />
        <YtFAQ />
      </div>
      <YtFooter />
      <StickyMobileCTA
        visible={(step === 1 || step === 2) && canDisplayPricing}
        label={tCopy.step1.continue}
        priceLabel={formatPrice(selectedPack, country)}
        subLabel={step === 2 && profile
          ? `+${formatQty(selectedPack.qty + selectedPack.bonus)} → ${profile.channel?.name || profile.title || ""}`
          : `${formatQty(selectedPack.qty)} + ${formatQty(selectedPack.bonus)}`}
        disabled={step === 2 && !(activeInputValid && emailValid)}
        accent="var(--yt-red)"
        onClick={next}
      />
    </div>
  );
}
