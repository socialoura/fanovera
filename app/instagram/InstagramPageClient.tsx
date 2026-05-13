"use client";

import { useState } from "react";
import IgHeader from "./components/IgHeader";
import Step1Packs from "./components/Step1Packs";
import Step2Username from "./components/Step2Username";
import Step3Checkout from "./components/Step3Checkout";
import WhyUs from "./components/WhyUs";
import Reviews from "./components/Reviews";
import IgFAQ from "./components/IgFAQ";
import IgFooter from "./components/IgFooter";
import { PACKS, type CountryId } from "./data";
import PricingPacksLoading from "../components/PricingPacksLoading";
import { usePaymentIntent } from "../components/StripePayment";
import { useApplyCurrencyPricing } from "../lib/useCurrencyPricing";
import { useProductAnalytics } from "../lib/useProductAnalytics";
import { trackEvent } from "../lib/analytics";

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

const STATIC_PACKS = PACKS.map((pack) => ({ ...pack }));

export default function InstagramPageClient() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const country: CountryId = "fr";
  const [pack, setPack] = useState(3);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<IgProfile | null>(null);
  const { canDisplayPricing, currency, experiment } = useApplyCurrencyPricing("ig_followers", PACKS, STATIC_PACKS);

  const safePack = Math.min(pack, Math.max(0, PACKS.length - 1));
  const selectedPack = PACKS[safePack] ?? PACKS[0];
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
  const total = subtotal * 0.95; // default coupon FANO5 (−5%)
  const amountCents = Math.round(total * 100);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const cleanUsername = username.replace(/^@/, "").trim();
  const { clientSecret } = usePaymentIntent({
    amount: amountCents,
    currency: currency.toLowerCase(),
    email,
    username: cleanUsername,
    platform: "instagram",
    cart: [{ qty: selectedPack.qty, bonus: selectedPack.bonus, country }],
    enabled: step >= 2 && !!profile && emailValid,
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
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const back = () => {
    setStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const backToPacks = () => {
    setStep(1);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div data-i18n-skip>
      <div className="paper-frame with-ig-halo">
        <IgHeader />
        {step === 1 && (canDisplayPricing ? (
          <Step1Packs
            country={country}
            pack={safePack}
            setPack={setPack}
            onNext={next}
          />
        ) : <PricingPacksLoading accent="var(--ig-2)" />)}
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
          <Step3Checkout country={country} pack={safePack} username={username} email={email} profile={profile} clientSecret={clientSecret} onBack={back} onBackToPacks={backToPacks} />
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
