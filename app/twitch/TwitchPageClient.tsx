"use client";

import { useState } from "react";
import TwHeader from "./components/TwHeader";
import Step1Packs from "./components/Step1Packs";
import Step2Username from "./components/Step2Username";
import Step3Checkout from "./components/Step3Checkout";
import WhyUs from "./components/WhyUs";
import Reviews from "./components/Reviews";
import TwFAQ from "./components/TwFAQ";
import TwFooter from "./components/TwFooter";
import type { TwProfile } from "./components/Step2Username";
import { PACKS, type CountryId, formatPrice, formatQty } from "./data";
import PricingPacksLoading from "../components/PricingPacksLoading";
import { usePaymentIntent } from "../components/StripePayment";
import { useApplyCurrencyPricing } from "../lib/useCurrencyPricing";
import { useProductAnalytics } from "../lib/useProductAnalytics";
import { trackEvent } from "../lib/analytics";
import { useFunnelPersistence } from "../lib/useFunnelPersistence";
import StickyMobileCTA from "../components/StickyMobileCTA";
import { useTwitchCopy } from "./i18n";

const STATIC_PACKS = PACKS.map((pack) => ({ ...pack }));

export default function TwitchPageClient() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const country: CountryId = "fr";
  const [pack, setPack] = useState(3);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<TwProfile | null>(null);
  const { canDisplayPricing, currency, experiment } = useApplyCurrencyPricing("tw_followers", PACKS, STATIC_PACKS);

  const safePack = Math.min(pack, Math.max(0, PACKS.length - 1));
  const selectedPack = PACKS[safePack] ?? PACKS[0];
  const tCopy = useTwitchCopy();
  useFunnelPersistence("twitch", { pack: safePack, username, email }, { setPack, setUsername, setEmail });
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
  const total = subtotal * 0.95;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const { clientSecret } = usePaymentIntent({
    amount: Math.round(total * 100),
    currency: currency.toLowerCase(),
    email,
    username: username.replace(/^@/, "").trim(),
    platform: "twitch",
    cart: [{ qty: selectedPack.qty, bonus: selectedPack.bonus, country }],
    followersBefore: profile?.followersCount ?? 0,
    enabled: step >= 2 && !!profile && emailValid,
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
      <div className="paper-frame with-tw-halo">
        <TwHeader />
        {step === 1 && (canDisplayPricing ? <Step1Packs country={country} pack={safePack} setPack={setPack} onNext={next} /> : <PricingPacksLoading accent="var(--tw-purple)" />)}
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
        disabled={step === 2 && !(profile && emailValid)}
        accent="var(--tw-purple)"
        onClick={next}
      />
    </div>
  );
}
