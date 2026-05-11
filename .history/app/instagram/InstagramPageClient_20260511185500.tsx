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
import { COUNTRIES, PACKS, type CountryId } from "./data";
import { usePaymentIntent } from "../components/StripePayment";

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

export default function InstagramPageClient() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const country: CountryId = "fr";
  const [pack, setPack] = useState(3);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<IgProfile | null>(null);

  // Pre-create the Stripe PaymentIntent as soon as we have the data, so Step 3
  // displays instantly without the "Chargement du paiement sécurisé…" spinner.
  const subtotal = PACKS[pack].price * (country === "fr" ? COUNTRIES[0].mult : 1);
  const total = subtotal * 0.95; // default coupon FANO5 (−5%)
  const amountCents = Math.round(total * 100);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const cleanUsername = username.replace(/^@/, "").trim();
  const { clientSecret } = usePaymentIntent({
    amount: amountCents,
    email,
    username: cleanUsername,
    platform: "instagram",
    cart: [{ qty: PACKS[pack].qty, bonus: PACKS[pack].bonus, country }],
    enabled: step >= 2 && !!profile && emailValid,
  });

  const next = () => {
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

  return (
    <>
      <div className="paper-frame with-ig-halo">
        <IgHeader />
        {step === 1 && (
          <Step1Packs
            country={country}
            pack={pack}
            setPack={setPack}
            onNext={next}
          />
        )}
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
          <Step3Checkout country={country} pack={pack} username={username} email={email} profile={profile} clientSecret={clientSecret} onBack={back} />
        )}
      </div>
      <div className={step === 1 ? undefined : "hide-md-on-checkout"}>
        <WhyUs />
        <Reviews />
        <IgFAQ />
      </div>
      <IgFooter />
    </>
  );
}
