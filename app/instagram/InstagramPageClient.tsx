"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import IgHeader from "./components/IgHeader";
import Step1Packs from "./components/Step1Packs";
import Step2Username from "./components/Step2Username";
import Step3Checkout from "./components/Step3Checkout";
import WhyUs from "./components/WhyUs";
import Reviews from "./components/Reviews";
import IgFAQ from "./components/IgFAQ";
import IgFooter from "./components/IgFooter";
import { PACKS, LIKES_PACKS, VIEWS_PACKS, type CountryId, type InstagramProductType, formatPrice, formatQty, getPacksForProduct, getServiceForProduct } from "./data";
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
import { useInstagramCopy } from "./i18n";

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

export type IgMedia = {
  id: string;
  code: string;
  mediaType: number;
  thumbnailUrl: string;
  videoUrl: string;
  likeCount: number;
  playCount: number;
  commentCount: number;
  caption: string;
  takenAt: number;
  user: {
    username: string;
    fullName: string;
    avatarUrl: string;
    verified: boolean;
  };
};

const STATIC_PACKS = PACKS.map((pack) => ({ ...pack }));
const STATIC_LIKES_PACKS = LIKES_PACKS.map((pack) => ({ ...pack }));
const STATIC_VIEWS_PACKS = VIEWS_PACKS.map((pack) => ({ ...pack }));

export default function InstagramPageClient() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const country: CountryId = "fr";
  const [pack, setPack] = useState(3);
  const search = useSearchParams();
  const initialProductType: InstagramProductType = (() => {
    const raw = (search?.get("product") || "").toLowerCase();
    return raw === "likes" || raw === "views" ? (raw as InstagramProductType) : "followers";
  })();
  const [productType, setProductType] = useState<InstagramProductType>(initialProductType);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<IgProfile | null>(null);
  const [postUrl, setPostUrl] = useState("");
  const [media, setMedia] = useState<IgMedia | null>(null);

  // Reset target input when switching product type — username/profile applies to
  // followers, postUrl/media applies to likes/views.
  useEffect(() => {
    setUsername("");
    setProfile(null);
    setPostUrl("");
    setMedia(null);
  }, [productType]);
  // Apply DB pricing to all 3 product arrays so toggling between
  // Followers / Likes / Views all pick up admin-configured prices.
  const followersPricing = useApplyCurrencyPricing("ig_followers", PACKS, STATIC_PACKS);
  const likesPricing = useApplyCurrencyPricing("ig_likes", LIKES_PACKS, STATIC_LIKES_PACKS);
  const viewsPricing = useApplyCurrencyPricing("ig_views", VIEWS_PACKS, STATIC_VIEWS_PACKS);
  const pricing = productType === "likes" ? likesPricing : productType === "views" ? viewsPricing : followersPricing;
  const { canDisplayPricing, currency, experiment } = pricing;
  const activePacks = getPacksForProduct(productType);

  const safePack = Math.min(pack, Math.max(0, activePacks.length - 1));
  const selectedPack = activePacks[safePack] ?? activePacks[0];
  usePrefetchProductPricing();
  useTrackPageVisit("instagram");
  const [readyOnce, setReadyOnce] = useState(canDisplayPricing);
  useEffect(() => { if (canDisplayPricing) setReadyOnce(true); }, [canDisplayPricing]);
  const t = useInstagramCopy();
  useFunnelPersistence("instagram", { pack: safePack, username, email }, { setPack, setUsername, setEmail });
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
  const total = subtotal;
  const amountCents = Math.round(total * 100);
  const emailValid = isValidCheckoutEmail(email);
  const cleanUsername = username.replace(/^@/, "").trim();
  const isMediaProduct = productType === "likes" || productType === "views";
  // Checkout gate is intentionally loose: any non-empty target lets the user
  // proceed. Strict-format checks still drive the live preview inside Step2
  // but never block payment.
  const targetReady = isMediaProduct ? postUrl.trim().length > 0 : cleanUsername.length > 0;
  const { clientSecret } = usePaymentIntent({
    amount: amountCents,
    currency: currency.toLowerCase(),
    email,
    username: isMediaProduct ? (media?.user.username || cleanUsername) : cleanUsername,
    platform: "instagram",
    cart: [{ service: getServiceForProduct(productType), qty: selectedPack.qty, bonus: selectedPack.bonus, country, postUrl: isMediaProduct ? postUrl.trim() : undefined }],
    followersBefore: profile?.followersCount ?? 0,
    enabled: step >= 2 && targetReady && emailValid,
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
      <div className="paper-frame with-ig-halo" data-step-main>
        <IgHeader />
        {step === 1 && (readyOnce ? (
          <Step1Packs
            country={country}
            pack={safePack}
            setPack={setPack}
            onNext={next}
            productType={productType}
            setProductType={setProductType}
          />
        ) : <PricingPacksLoading accent="var(--ig-2)" />)}
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
        {step === 3 && (
          <Step3Checkout country={country} pack={safePack} username={username} postUrl={postUrl} email={email} profile={profile} clientSecret={clientSecret} onBack={back} onBackToPacks={backToPacks} />
        )}
      </div>
      <div className={step === 1 ? undefined : "hide-md-on-checkout"}>
        <WhyUs />
        <Reviews />
        <IgFAQ />
      </div>
      <IgFooter />
      <StickyMobileCTA
        visible={(step === 1 || step === 2) && canDisplayPricing}
        label={t.step1.continue}
        priceLabel={formatPrice(selectedPack, country)}
        subLabel={step === 2 && (profile || media)
          ? `+${formatQty(selectedPack.qty + selectedPack.bonus)} → @${cleanUsername || profile?.username || media?.user.username || ""}`
          : `${formatQty(selectedPack.qty)} + ${formatQty(selectedPack.bonus)}`}
        disabled={step === 2 && !(targetReady && emailValid)}
        accent="var(--ig-2)"
        onClick={next}
      />
    </div>
  );
}
