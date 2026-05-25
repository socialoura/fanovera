"use client";

import { useState } from "react";
import LiHeader from "./components/LiHeader";
import Step1Packs from "./components/Step1Packs";
import Step2Username from "./components/Step2Username";
import Step3Checkout from "./components/Step3Checkout";
import WhyUs from "./components/WhyUs";
import Reviews from "./components/Reviews";
import LiFAQ from "./components/LiFAQ";
import LiFooter from "./components/LiFooter";
import type { LiProfile } from "./components/Step2Username";
import { PACKS, type CountryId, formatPrice, formatQty } from "./data";
import PricingPacksLoading from "../components/PricingPacksLoading";
import { usePaymentIntent } from "../components/StripePayment";
import { useApplyCurrencyPricing } from "../lib/useCurrencyPricing";
import { useTrackPageVisit } from "../lib/useTrackPageVisit";
import { useProductAnalytics } from "../lib/useProductAnalytics";
import { trackEvent } from "../lib/analytics";
import { extractLinkedinHandle, isValidCheckoutEmail } from "../lib/checkoutTargetValidation";
import { useFunnelPersistence, useAutoSelectPopularPack } from "../lib/useFunnelPersistence";
import { scrollToStepMain } from "../lib/stepScroll";
import StickyMobileCTA from "../components/StickyMobileCTA";
import { useLinkedinCopy } from "./i18n";

const STATIC_PACKS = PACKS.map((pack) => ({ ...pack }));

export default function LinkedinPageClient() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const country: CountryId = "fr";
  const [pack, setPack] = useState(3);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<LiProfile | null>(null);
  const { canDisplayPricing, currency, experiment } = useApplyCurrencyPricing("li_followers", PACKS, STATIC_PACKS);
  useTrackPageVisit("linkedin");

  const safePack = Math.min(pack, Math.max(0, PACKS.length - 1));
  const selectedPack = PACKS[safePack] ?? PACKS[0];
  const tCopy = useLinkedinCopy();
  const hydration = useFunnelPersistence("linkedin", { pack: safePack, username, email }, { setPack, setUsername, setEmail });
  useAutoSelectPopularPack(canDisplayPricing, PACKS, setPack, hydration);
  useProductAnalytics({
    productArea: "linkedin",
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
  const targetHandle = extractLinkedinHandle(username);
  // Loose gate: any non-empty input is enough to proceed. If we couldn't
  // extract a clean handle, we still forward the raw user input so the SMM
  // provider can attempt delivery.
  const targetReady = username.trim().length > 0;
  const { clientSecret } = usePaymentIntent({
    amount: Math.round(total * 100),
    currency: currency.toLowerCase(),
    email,
    username: targetHandle || username.replace(/^@/, "").trim(),
    platform: "linkedin",
    cart: [{ qty: selectedPack.qty, bonus: selectedPack.bonus, country }],
    followersBefore: profile?.followersCount ?? 0,
    enabled: step >= 2 && targetReady && emailValid,
  });

  const next = () => {
    trackEvent(step === 1 ? "pricing_cta_clicked" : "cta_clicked", {
      product_area: "linkedin",
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
      <div className="paper-frame with-li-halo" data-step-main>
        <LiHeader />
        {step === 1 && (canDisplayPricing ? <Step1Packs country={country} pack={safePack} setPack={setPack} onNext={next} /> : <PricingPacksLoading accent="var(--li-blue)" />)}
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
        <LiFAQ />
      </div>
      <LiFooter />
      <StickyMobileCTA
        visible={(step === 1 || step === 2) && canDisplayPricing}
        label={tCopy.step1.continue}
        priceLabel={formatPrice(selectedPack, country)}
        subLabel={step === 2 && profile
          ? `+${formatQty(selectedPack.qty + selectedPack.bonus)} → ${username.replace(/^@/, "").trim() || profile.fullName}`
          : `${formatQty(selectedPack.qty)} + ${formatQty(selectedPack.bonus)}`}
        disabled={step === 2 && !(targetReady && emailValid)}
        accent="var(--li-blue)"
        onClick={next}
      />
    </div>
  );
}
