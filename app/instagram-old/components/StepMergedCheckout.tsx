"use client";

import { useEffect, useState } from "react";
import NetIcon from "../../components/NetIcon";
import StripeCheckout from "../../components/StripePayment";
import CouponField from "../../components/CouponField";
import CheckoutUpsell, { type CheckoutUpsellItem } from "../../components/CheckoutUpsell";
import IgSprinkle from "../../instagram/components/IgSprinkle";
import Stepper from "./Stepper";
import { ProfilePreviewCard, MediaPreviewCard } from "./Step2Username";
import { getPacksForProduct, getServiceForProduct, formatQty, fmtEuro, type CountryId, type InstagramProductType } from "../../instagram/data";
import type { IgProfile, IgMedia } from "../InstagramOldPageClient";
import { useInstagramCopy } from "../../instagram/i18n";
import { useI18n } from "../../i18n/I18nProvider";
import { getPublicCopy } from "../../components/publicCopy";
import { useCoupon } from "../../lib/useCoupon";
import { useCurrencyPreference } from "../../lib/useCurrencyPricing";
import { trackEvent } from "../../lib/analytics";
import { extractHandleFromUrl } from "../../lib/extractHandle";
import { isValidCheckoutEmail } from "../../lib/checkoutTargetValidation";

const POST_URL_RE = /instagram\.com\/(?:[^\/?#]+\/)?(?:p|reel|reels|tv)\/[A-Za-z0-9_-]+/i;

type Props = {
  country: CountryId;
  pack: number;
  productType: InstagramProductType;
  username: string;
  setUsername: (u: string) => void;
  postUrl: string;
  setPostUrl: (u: string) => void;
  email: string;
  setEmail: (e: string) => void;
  profile: IgProfile | null;
  setProfile: (p: IgProfile | null) => void;
  media: IgMedia | null;
  setMedia: (m: IgMedia | null) => void;
  clientSecret?: string | null;
  onBackToPacks: () => void;
  stepperLabels?: string[];
};

// Merged-checkout A/B variant: collapses Step2 (target + email + live profile
// preview) and Step3 (summary + payment) onto a single two-column page. Self-
// contained on purpose — it never touches the control Step2/Step3 components, so
// the experiment is easy to delete if control wins. Reuses the Step2 preview
// cards and the Step3 summary/payment layout to stay visually consistent.
export default function StepMergedCheckout({
  country,
  pack,
  productType,
  username,
  setUsername,
  postUrl,
  setPostUrl,
  email,
  setEmail,
  profile,
  setProfile,
  media,
  setMedia,
  clientSecret,
  onBackToPacks,
  stepperLabels,
}: Props) {
  const igCopy = useInstagramCopy();
  const t2 = igCopy.step2;
  const t3 = igCopy.step3;
  const tm = t2.media;
  const { locale } = useI18n();
  const { currency } = useCurrencyPreference();
  const paymentCopy = getPublicCopy(locale).payment;
  const [upsell, setUpsell] = useState<CheckoutUpsellItem | null>(null);

  const isMediaMode = productType === "likes" || productType === "views" || productType === "reposts";

  const packs = getPacksForProduct(productType);
  const safePack = Math.min(Math.max(0, pack), packs.length - 1);
  const selected = packs[safePack] ?? packs[0];
  const subtotal = selected.price;
  const { coupon, setCoupon, couponApplied, setCouponApplied, promo, initiallyExpanded } =
    useCoupon(Math.round(subtotal * 100));
  const discount = promo.discountCents / 100;
  const upsellCents = upsell?.price_cents ?? 0;
  const finalAmountCents = promo.amountCents + upsellCents;
  const total = finalAmountCents / 100;
  const promoCode = couponApplied ? coupon : "";
  const canUsePrefetchedSecret = promo.discountCents === 0 && upsellCents === 0;

  const clean = username.replace(/^@/, "").trim().toLowerCase();
  const usernameValid = /^[a-zA-Z0-9._]{2,30}$/.test(clean);
  const postValid = POST_URL_RE.test(postUrl.trim());
  const bonusVolume = selected.qty + selected.bonus;
  const recipientLabel = clean ? "@" + clean : (postUrl.trim() || "@yourusername");

  const targetReady = isMediaMode ? postUrl.trim().length > 0 : clean.length > 0;
  const emailValid = isValidCheckoutEmail(email);
  const canPay = targetReady && emailValid;

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(isMediaMode ? !!media : !!profile);
  const [apiError, setApiError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [emailBlurred, setEmailBlurred] = useState(false);

  // Username verification (followers mode) — debounced, abortable. Mirrors the
  // control Step2 lookup so the preview behaves identically across variants.
  useEffect(() => {
    if (isMediaMode) return;
    setVerified(false);
    setProfile(null);
    setApiError(null);
    setSuggestion(null);
    if (!usernameValid) return;

    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      setVerifying(true);
      try {
        const res = await fetch(`/api/instagram/profile?username=${encodeURIComponent(clean)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) {
          if (res.status === 404) {
            setApiError("not_found");
            setSuggestion(json?.suggestion || null);
          } else if (res.status === 403) {
            setApiError("private");
          } else {
            setApiError("upstream");
          }
          setVerified(false);
        } else {
          setProfile(json as IgProfile);
          setVerified(true);
          trackEvent("username_validated", {
            product_area: "instagram",
            platform: "instagram",
            followers_count: Number(json?.followersCount) || 0,
          });
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") setApiError("network");
      } finally {
        if (!controller.signal.aborted) setVerifying(false);
      }
    }, 500);

    return () => {
      clearTimeout(debounce);
      controller.abort();
      setVerifying(false);
    };
  }, [clean, setProfile, usernameValid, isMediaMode]);

  // Post URL verification (likes/views/reposts mode).
  useEffect(() => {
    if (!isMediaMode) return;
    setVerified(false);
    setMedia(null);
    setApiError(null);
    if (!postValid) return;

    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      setVerifying(true);
      try {
        const res = await fetch(`/api/instagram/media?url=${encodeURIComponent(postUrl.trim())}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) {
          if (res.status === 404) setApiError("not_found");
          else setApiError("upstream");
          setVerified(false);
        } else {
          const m = json as IgMedia;
          setMedia(m);
          setVerified(true);
          if (m.user?.username) {
            setUsername(m.user.username);
            setProfile({
              username: m.user.username,
              fullName: m.user.fullName,
              avatarUrl: m.user.avatarUrl,
              followersCount: 0,
              followingCount: 0,
              mediaCount: 0,
              bio: "",
              verified: m.user.verified,
            });
          }
          trackEvent("username_validated", {
            product_area: "instagram",
            platform: "instagram",
            media_type: m.mediaType,
            like_count: m.likeCount,
            play_count: m.playCount,
          });
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") setApiError("network");
      } finally {
        if (!controller.signal.aborted) setVerifying(false);
      }
    }, 500);

    return () => {
      clearTimeout(debounce);
      controller.abort();
      setVerifying(false);
    };
  }, [postUrl, postValid, setMedia, setUsername, setProfile, isMediaMode]);

  const showPreview = isMediaMode
    ? Boolean(media) || verifying || (postValid && !apiError)
    : Boolean(profile) || verifying || (usernameValid && !apiError);

  const fillHint = (
    {
      fr: "Renseignez votre @ et votre e-mail pour payer",
      en: "Enter your @ and email to pay",
      es: "Introduce tu @ y tu e-mail para pagar",
      pt: "Insira seu @ e e-mail para pagar",
      de: "Gib deinen @ und deine E-Mail ein, um zu zahlen",
      it: "Inserisci la tua @ e la tua email per pagare",
      tr: "Ödemek için @ ve e-postanı gir",
    } as Record<string, string>
  )[(locale || "fr").toLowerCase().split("-")[0]] || "Enter your @ and email to pay";

  const previewBlock = showPreview ? (
    isMediaMode ? (
      <MediaPreviewCard
        media={media}
        verified={verified}
        verifying={verifying}
        apiError={apiError}
        productType={productType}
        bonusVolume={bonusVolume}
        tm={tm}
        tWaiting={tm.waitingPost}
        tChecking={tm.checkingPost}
        tFound={tm.foundPost}
      />
    ) : (
      <ProfilePreviewCard
        profile={profile}
        clean={clean}
        verified={verified}
        verifying={verifying}
        apiError={apiError}
        bonusVolume={bonusVolume}
        tFound={t2.found}
        tChecking={t2.checking}
        tWaiting={t2.waiting}
        tPosts={t2.posts}
        tAudience={t2.audience}
        tFollowing={t2.following}
        placeholderText={t2.usernamePlaceholder}
      />
    )
  ) : null;

  return (
    <section data-i18n-skip className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <IgSprinkle count={5} seed={3} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} labels={stepperLabels} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            {t3.titleBefore} <span className="squiggle ig">{t3.titleFocus}</span>{t3.titleAfter}
          </h1>
          <p style={{ maxWidth: 540, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {t3.subtitle}
          </p>
        </div>

        <div
          className="checkout-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: 28, maxWidth: 1100, margin: "0 auto", alignItems: "start" }}
        >
          {/* LEFT — target + email + live preview */}
          <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}>
            {isMediaMode ? (
              <>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                  {tm.postLabel}
                </label>
                <div className="input-shell">
                  <input
                    data-testid="checkout-post-url"
                    type="url"
                    inputMode="url"
                    enterKeyHint="done"
                    placeholder={tm.postPlaceholder}
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    autoFocus
                    spellCheck={false}
                    autoCapitalize="none"
                    autoComplete="off"
                  />
                  <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                    {verifying && <div className="spinner" style={{ borderColor: "rgba(214,41,118,0.25)", borderTopColor: "var(--ig-2)" }} />}
                    {!verifying && verified && (
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                {productType === "views" && media && media.mediaType === 1 && (
                  <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.3)", borderRadius: 12, fontSize: 13, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>⚠️</span>
                    <span>{tm.notVideo}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                  {t2.usernameLabel}
                </label>
                <div className="input-shell">
                  <span style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 16 }}>@</span>
                  <input
                    data-testid="checkout-username"
                    type="text"
                    enterKeyHint="next"
                    placeholder={t2.usernamePlaceholder}
                    value={username.replace(/^@/, "")}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const extracted = extractHandleFromUrl("instagram", raw);
                      setUsername(extracted ?? raw);
                    }}
                    autoFocus
                    spellCheck={false}
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect="off"
                  />
                  <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                    {verifying && <div className="spinner" style={{ borderColor: "rgba(214,41,118,0.25)", borderTopColor: "var(--ig-2)" }} />}
                    {!verifying && verified && (
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                {usernameValid && apiError === "not_found" && suggestion && (
                  <div style={{ marginTop: 10, fontSize: 13, color: "var(--ink-3)" }}>
                    <button type="button" onClick={() => setUsername(suggestion)} style={{ color: "var(--ig-2)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: 0 }}>
                      {t2.trySuggestion} @{suggestion}?
                    </button>
                  </div>
                )}
              </>
            )}

            {previewBlock && (
              <div className="ig-preview-step2-inline" style={{ position: "relative", marginTop: 22 }}>
                {previewBlock}
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                <label htmlFor="ig-merged-email" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                  {t2.emailLabel}
                </label>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-2)" }}>{t2.emailHint}</span>
              </div>
              <div className="input-shell">
                <input
                  id="ig-merged-email"
                  data-testid="checkout-email"
                  type="email"
                  inputMode="email"
                  enterKeyHint="done"
                  autoComplete="email"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={t2.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailBlurred(true)}
                />
                {emailValid && email.trim() && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, marginRight: 8 }}>
                    <circle cx="12" cy="12" r="10" fill="var(--green)" />
                    <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {emailBlurred && email.trim() && !emailValid && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#c98a00" }}>{t2.errors.emailIncomplete}</div>
              )}
            </div>
          </div>

          {/* RIGHT — summary + payment */}
          <div style={{ background: "white", border: "2px solid var(--ig-2)", borderRadius: 22, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <NetIcon kind="instagram" color="var(--ig-2)" size={20} />
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ig-2)" }}>
                {t3.summary}
              </div>
              <button
                onClick={onBackToPacks}
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--ink-3)", padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M11 7H3M7 3L3 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t3.backToPacks}
              </button>
            </div>

            <div style={{ padding: "10px 0", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--line)" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t3.recipient}</div>
                <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{recipientLabel}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14 }}>
              <div style={{ fontWeight: 600 }}>{formatQty(selected.qty)}</div>
              <div style={{ fontWeight: 700 }}>{fmtEuro(subtotal)}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14, color: "var(--green)", borderBottom: "1px dashed var(--line)" }}>
              <div>
                <div style={{ fontWeight: 600 }}>+{formatQty(selected.bonus)} {t3.included}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{t3.campaignCredit}</div>
              </div>
              <div style={{ fontWeight: 700 }}>{t3.free}</div>
            </div>

            <CouponField
              coupon={coupon}
              setCoupon={setCoupon}
              couponApplied={couponApplied}
              setCouponApplied={setCouponApplied}
              initiallyExpanded={initiallyExpanded}
              accentColor="var(--ig-2)"
              labels={{
                haveCoupon: paymentCopy.haveCoupon,
                coupon: t3.coupon,
                couponPlaceholder: t3.couponPlaceholder,
                apply: t3.apply,
                applied: t3.applied,
              }}
              successMessage={
                couponApplied && promo.type !== "none" ? (
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
                    {promo.isTestPromo ? `Code test - total ${fmtEuro(total)}` : `${t3.saving} ${fmtEuro(discount)}`}
                  </div>
                ) : undefined
              }
            />

            <CheckoutUpsell
              platform="instagram"
              baseService={productType}
              locale={locale}
              accentColor="var(--ig-2)"
              currency={currency}
              onChange={setUpsell}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "16px 0 4px" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{t3.total}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--ig-2)", letterSpacing: "-0.02em", lineHeight: 1 }}>{fmtEuro(total)}</div>
            </div>
            <div style={{ textAlign: "right", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)", textDecoration: "line-through" }}>{fmtEuro(selected.old)}</div>
              {selected.old - total > 0.005 && (
                <div style={{ fontSize: 13, color: "var(--ig-2)", fontWeight: 700, marginTop: 2 }}>
                  {paymentCopy.youSaveToday(fmtEuro(selected.old - total))}
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 20, marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>{t3.securePayment}</div>
              {/* Reassurance — same two fear-killers as control Step3. */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {[t3.guarantee, t3.noPassword].map((txt) => (
                  <div key={txt} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-2)" }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(77,191,138,0.15)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden>
                        <path d="M3 7l3 3 5-6" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>{txt}</span>
                  </div>
                ))}
              </div>

              {canPay ? (
                <StripeCheckout
                  amount={finalAmountCents}
                  email={email}
                  username={username.replace(/^@/, "").trim()}
                  platform="instagram"
                  brandColor="var(--ig-2)"
                  cart={[
                    {
                      service: getServiceForProduct(productType),
                      qty: selected.qty,
                      bonus: selected.bonus,
                      country,
                      postUrl: postUrl.trim() || undefined,
                    },
                    ...(upsell
                      ? [{
                          service: upsell.service,
                          qty: upsell.qty,
                          upsell: true,
                          upsellId: upsell.id,
                          priceCents: upsell.price_cents,
                        }]
                      : []),
                  ]}
                  promoCode={promoCode}
                  clientSecret={canUsePrefetchedSecret ? clientSecret : undefined}
                />
              ) : (
                <div
                  style={{
                    padding: "16px 18px",
                    borderRadius: 14,
                    background: "var(--paper-2)",
                    border: "1px dashed var(--line)",
                    fontSize: 13,
                    color: "var(--ink-3)",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
                    <path d="M5 8V5.5a4 4 0 0 1 8 0V8M4 8h10v7H4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {fillHint}
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5 }}>
              {t3.legalBefore} <a href="/cgv" style={{ color: "var(--ink-2)", textDecoration: "underline" }}>{t3.terms}</a>. {t3.legalAfter}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--line)" }}>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>SSL</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>✓ 3D Secure</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{t3.gdpr}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
