"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SpoHeader from "./components/SpoHeader";
import Step1Packs from "./components/Step1Packs";
import Step2Track from "./components/Step2Track";
import Step3Checkout from "./components/Step3Checkout";
import WhyUs from "./components/WhyUs";
import Reviews from "./components/Reviews";
import SpoFAQ from "./components/SpoFAQ";
import SpoFooter from "./components/SpoFooter";
import type { SpoPreview } from "./components/Step2Track";
import { PACKS, type CountryId, type SpotifyProductType, formatPrice, formatQty, getPacksForProduct } from "./data";
import PricingPacksLoading from "../components/PricingPacksLoading";
import { usePaymentIntent } from "../components/StripePayment";
import { useApplyCurrencyPricing, usePrefetchProductPricing } from "../lib/useCurrencyPricing";
import { useProductAnalytics } from "../lib/useProductAnalytics";
import { trackEvent } from "../lib/analytics";
import { useFunnelPersistence } from "../lib/useFunnelPersistence";
import StickyMobileCTA from "../components/StickyMobileCTA";
import { useSpotifyCopy } from "./i18n";

const STATIC_PACKS = PACKS.map((pack) => ({ ...pack }));

export default function SpotifyPageClient() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const country: CountryId = "fr";
  const [pack, setPack] = useState(3);
  const search = useSearchParams();
  const initialProductType: SpotifyProductType = (() => {
    const raw = (search?.get("product") || "").toLowerCase();
    return raw === "followers" ? "followers" : "streams";
  })();
  const [productType, setProductType] = useState<SpotifyProductType>(initialProductType);
  const [trackInput, setTrackInput] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<SpoPreview | null>(null);
  const activePacks = getPacksForProduct(productType);
  const { canDisplayPricing, currency, experiment } = useApplyCurrencyPricing(productType === "followers" ? "sp_followers" : "sp_streams", PACKS, STATIC_PACKS);

  const safePack = Math.min(pack, Math.max(0, activePacks.length - 1));
  const selectedPack = activePacks[safePack] ?? activePacks[0];
  usePrefetchProductPricing();
  const [readyOnce, setReadyOnce] = useState(canDisplayPricing);
  useEffect(() => { if (canDisplayPricing) setReadyOnce(true); }, [canDisplayPricing]);
  const tCopy = useSpotifyCopy();
  useFunnelPersistence("spotify", { pack: safePack, username: trackInput, email }, { setPack, setUsername: setTrackInput, setEmail });
  useProductAnalytics({
    productArea: "spotify",
    step,
    plan: String(selectedPack.qty),
    price: selectedPack.price,
    currency,
    assignment: experiment.assignment,
    anonymousId: experiment.anonymousId,
    enabled: canDisplayPricing,
  });

  const subtotal = selectedPack.price;
  const total = subtotal * 0.95;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const { clientSecret } = usePaymentIntent({
    amount: Math.round(total * 100),
    currency: currency.toLowerCase(),
    email,
    username: trackInput.trim(),
    platform: "spotify",
    cart: [
      {
        qty: selectedPack.qty,
        bonus: selectedPack.bonus,
        country,
        trackUrl: trackInput.trim(),
        trackId: profile?.id,
      },
    ],
    followersBefore: profile?.monthlyListeners ?? 0,
    enabled: step >= 2 && !!profile && emailValid,
  });

  const next = () => {
    trackEvent(step === 1 ? "pricing_cta_clicked" : "cta_clicked", {
      product_area: "spotify",
      feature_name: step === 1 ? "pricing" : "checkout_steps",
      step,
      plan: String(selectedPack.qty),
      price: selectedPack.price,
      currency,
    });
    setStep((s) => (Math.min(3, s + 1) as 1 | 2 | 3));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    setStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const backToPacks = () => {
    setStep(1);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="paper-frame with-spo-halo">
        <SpoHeader />
        {step === 1 && (readyOnce ? <Step1Packs country={country} pack={safePack} setPack={setPack} onNext={next} productType={productType} setProductType={setProductType} /> : <PricingPacksLoading accent="var(--spo-green-2)" />)}
        {step === 2 && (
          <Step2Track
            country={country}
            pack={safePack}
            trackInput={trackInput}
            setTrackInput={setTrackInput}
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
            trackInput={trackInput}
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
        <SpoFAQ />
      </div>
      <SpoFooter />
      <StickyMobileCTA
        visible={(step === 1 || step === 2) && canDisplayPricing}
        label={tCopy.step1.continue}
        priceLabel={formatPrice(selectedPack, country)}
        subLabel={step === 2 && profile
          ? `+${formatQty(selectedPack.qty + selectedPack.bonus)} → ${profile.trackName || ""}`
          : `${formatQty(selectedPack.qty)} + ${formatQty(selectedPack.bonus)} ${productType === "followers" ? "followers" : ""}`}
        disabled={step === 2 && !(profile && emailValid)}
        accent="var(--spo-green-2)"
        onClick={next}
      />
    </>
  );
}
