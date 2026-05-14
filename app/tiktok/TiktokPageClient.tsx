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
import { PACKS, type CountryId, type TikTokProductType, formatPrice, formatQty, getPacksForProduct, getServiceForProduct } from "./data";
import PricingPacksLoading from "../components/PricingPacksLoading";
import { usePaymentIntent } from "../components/StripePayment";
import { useApplyCurrencyPricing, usePrefetchProductPricing } from "../lib/useCurrencyPricing";
import { useProductAnalytics } from "../lib/useProductAnalytics";
import { trackEvent } from "../lib/analytics";
import { useFunnelPersistence } from "../lib/useFunnelPersistence";
import StickyMobileCTA from "../components/StickyMobileCTA";
import { useTikTokCopy } from "./i18n";

const STATIC_PACKS = PACKS.map((pack) => ({ ...pack }));

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
  const { canDisplayPricing, currency, experiment } = useApplyCurrencyPricing(getServiceForProduct(productType), PACKS, STATIC_PACKS);

  const safePack = Math.min(pack, Math.max(0, activePacks.length - 1));
  const selectedPack = activePacks[safePack] ?? activePacks[0];
  usePrefetchProductPricing();
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
  const total = subtotal * 0.95;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isMediaProduct = productType === "likes" || productType === "views";
  const targetReady = isMediaProduct ? Boolean(media) : Boolean(profile);
  const { clientSecret } = usePaymentIntent({
    amount: Math.round(total * 100),
    currency: currency.toLowerCase(),
    email,
    username: username.replace(/^@/, "").trim(),
    platform: "tiktok",
    cart: [{ qty: selectedPack.qty, bonus: selectedPack.bonus, country }],
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
    <div data-i18n-skip>
      <div className="paper-frame with-tt-halo">
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
        {step === 3 && <Step3Checkout country={country} pack={safePack} username={username} email={email} profile={profile} clientSecret={clientSecret} onBack={back} onBackToPacks={backToPacks} />}
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
