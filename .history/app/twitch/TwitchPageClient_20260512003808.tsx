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
import { COUNTRIES, PACKS, type CountryId } from "./data";
import { usePaymentIntent } from "../components/StripePayment";

export default function TwitchPageClient() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const country: CountryId = "fr";
  const [pack, setPack] = useState(3);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<TwProfile | null>(null);

  const subtotal = PACKS[pack].price * (country === "fr" ? COUNTRIES[0].mult : 1);
  const total = subtotal * 0.95;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const { clientSecret } = usePaymentIntent({
    amount: Math.round(total * 100),
    email,
    username: username.replace(/^@/, "").trim(),
    platform: "twitch",
    cart: [{ qty: PACKS[pack].qty, bonus: PACKS[pack].bonus, country }],
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
      <div className="paper-frame with-tw-halo">
        <TwHeader />
        {step === 1 && <Step1Packs country={country} pack={pack} setPack={setPack} onNext={next} />}
        {step === 2 && (
          <Step2Username
            country={country}
            pack={pack}
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
            pack={pack}
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
    </>
  );
}
