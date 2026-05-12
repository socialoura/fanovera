"use client";

import { useState } from "react";
import SpoHeader from "./components/SpoHeader";
import Step1Packs from "./components/Step1Packs";
import Step2Track from "./components/Step2Track";
import Step3Checkout from "./components/Step3Checkout";
import WhyUs from "./components/WhyUs";
import Reviews from "./components/Reviews";
import SpoFAQ from "./components/SpoFAQ";
import SpoFooter from "./components/SpoFooter";
import type { SpoPreview } from "./components/Step2Track";
import { COUNTRIES, PACKS, type CountryId } from "./data";
import { usePaymentIntent } from "../components/StripePayment";
import { useApplyCurrencyPricing } from "../lib/useCurrencyPricing";

const STATIC_PACKS = PACKS.map((pack) => ({ ...pack }));

export default function SpotifyPageClient() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const country: CountryId = "fr";
  const [pack, setPack] = useState(3);
  const [trackInput, setTrackInput] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<SpoPreview | null>(null);
  const { currency } = useApplyCurrencyPricing("sp_streams", PACKS, STATIC_PACKS);

  const safePack = Math.min(pack, Math.max(0, PACKS.length - 1));
  const selectedPack = PACKS[safePack] ?? PACKS[0];

  const subtotal = selectedPack.price * (country === "fr" ? COUNTRIES[0].mult : 1);
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
    enabled: step >= 2 && !!profile && emailValid,
  });

  const next = () => {
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
        {step === 1 && <Step1Packs country={country} pack={safePack} setPack={setPack} onNext={next} />}
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
    </>
  );
}
