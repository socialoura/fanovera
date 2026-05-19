"use client";

import { useState } from "react";
import FbHeader from "./components/FbHeader";
import Step1Packs from "./components/Step1Packs";
import Step2Page from "./components/Step2Page";
import Step3Checkout from "./components/Step3Checkout";
import WhyUs from "./components/WhyUs";
import Reviews from "./components/Reviews";
import FbFAQ from "./components/FbFAQ";
import FbFooter from "./components/FbFooter";
import type { FbProfile } from "./components/Step2Page";
import { PACKS, type CountryId, formatPrice, formatQty } from "./data";
import PricingPacksLoading from "../components/PricingPacksLoading";
import { usePaymentIntent } from "../components/StripePayment";
import { useApplyCurrencyPricing } from "../lib/useCurrencyPricing";
import { useTrackPageVisit } from "../lib/useTrackPageVisit";
import { useProductAnalytics } from "../lib/useProductAnalytics";
import { trackEvent } from "../lib/analytics";
import { extractFacebookHandle, isValidCheckoutEmail } from "../lib/checkoutTargetValidation";
import { useFunnelPersistence } from "../lib/useFunnelPersistence";
import { scrollToStepMain } from "../lib/stepScroll";
import StickyMobileCTA from "../components/StickyMobileCTA";
import { useFacebookCopy } from "./i18n";

const STATIC_PACKS = PACKS.map((pack) => ({ ...pack }));

export default function FacebookPageClient() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const country: CountryId = "fr";
  const [pack, setPack] = useState(3);
  const [pageInput, setPageInput] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<FbProfile | null>(null);
  const { canDisplayPricing, currency, experiment } = useApplyCurrencyPricing("fb_likes", PACKS, STATIC_PACKS);
  useTrackPageVisit("facebook");

  const safePack = Math.min(pack, Math.max(0, PACKS.length - 1));
  const selectedPack = PACKS[safePack] ?? PACKS[0];
  const tCopy = useFacebookCopy();
  useFunnelPersistence("facebook", { pack: safePack, username: pageInput, email }, { setPack, setUsername: setPageInput, setEmail });
  useProductAnalytics({
    productArea: "facebook",
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
  const targetHandle = extractFacebookHandle(pageInput);
  // Loose gate: any non-empty page input proceeds; we forward whatever the
  // user typed downstream even if no clean handle could be extracted.
  const targetReady = pageInput.trim().length > 0;
  const { clientSecret } = usePaymentIntent({
    amount: Math.round(total * 100),
    currency: currency.toLowerCase(),
    email,
    username: targetHandle || pageInput.trim(),
    platform: "facebook",
    cart: [{ qty: selectedPack.qty, bonus: selectedPack.bonus, country, pageUrl: pageInput.trim(), pageHandle: profile?.handle || targetHandle || undefined }],
    followersBefore: profile?.followersCount ?? 0,
    enabled: step >= 2 && targetReady && emailValid,
  });

  const next = () => {
    trackEvent(step === 1 ? "pricing_cta_clicked" : "cta_clicked", {
      product_area: "facebook",
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
      <div className="paper-frame with-fb-halo" data-step-main>
        <FbHeader />
        {step === 1 && (canDisplayPricing ? <Step1Packs country={country} pack={safePack} setPack={setPack} onNext={next} /> : <PricingPacksLoading accent="var(--fb-blue)" />)}
        {step === 2 && (
          <Step2Page
            country={country}
            pack={safePack}
            pageInput={pageInput}
            setPageInput={setPageInput}
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
            pageInput={pageInput}
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
        <FbFAQ />
      </div>
      <FbFooter />
      <StickyMobileCTA
        visible={(step === 1 || step === 2) && canDisplayPricing}
        label={tCopy.step1.continue}
        priceLabel={formatPrice(selectedPack, country)}
        subLabel={step === 2 && profile
          ? `+${formatQty(selectedPack.qty + selectedPack.bonus)} → @${profile.handle || pageInput.trim()}`
          : `${formatQty(selectedPack.qty)} + ${formatQty(selectedPack.bonus)}`}
        disabled={step === 2 && !(targetReady && emailValid)}
        accent="var(--fb-blue)"
        onClick={next}
      />
    </div>
  );
}
