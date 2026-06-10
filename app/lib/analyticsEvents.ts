export const ANALYTICS_EVENTS = [
  "page_view",
  "locale_changed",
  "nav_item_clicked",
  "footer_link_clicked",
  "cta_clicked",
  "promo_hero_targeted_exposed",
  "promo_code_banner_exposed",
  "outbound_link_clicked",
  "form_error",
  "api_error",
  "validation_error",
  "404_viewed",
  "consent_updated",
  "signup_viewed",
  "signup_started",
  "signup_step_completed",
  "signup_completed",
  "signup_failed",
  "login_viewed",
  "login_started",
  "login_completed",
  "login_failed",
  "logout_clicked",
  "password_reset_requested",
  "account_created",
  "account_settings_viewed",
  "account_settings_updated",
  "pricing_viewed",
  "pricing_plan_viewed",
  "pricing_comparison_viewed",
  "pricing_faq_opened",
  "pricing_variant_exposed",
  // /promo username-first A/B: fired once on /promo with `variant`. The variant
  // is also registered as a PostHog super property so downstream funnel events
  // (checkout_started → payment_succeeded) carry it for per-arm analysis.
  "promo_flow_exposed",
  // Instagram merged-checkout A/B: fired once on /instagram with `variant`. Also
  // registered as a PostHog super property so checkout_started → payment_succeeded
  // carry `checkout_flow_variant` for the admin per-arm results query.
  "checkout_flow_exposed",
  // tiktok-2 funnel events — product page /tiktok-2
  // Fired once per visit on the /tiktok-2 product page (distinct from the old
  // /tiktok page). `from_promo` = true when the visitor was handed off from /promo.
  "tiktok2_page_viewed",
  // Fired each time the visitor advances to a new step (2 = quantities,
  // 3 = post selection, 4 = checkout). Step 1 is captured by tiktok2_page_viewed.
  "tt2_step_viewed",
  // User picks or changes a pack in step 2. `product` = followers|likes|views.
  "tt2_product_selected",
  // User removes a product from the cart in step 2.
  "tt2_product_removed",
  // User confirms their video selection in step 3 and proceeds to checkout.
  // `posts_count` = number of videos selected.
  "tt2_posts_confirmed",
  // /tiktok-2 pack-selector A/B: fired once when the visitor reaches the
  // quantities step, with `variant` (chips | slider). Also registered as a
  // PostHog super property `tt2_packs_variant` so downstream funnel events
  // (checkout_started → payment_succeeded) carry it for per-arm conversion.
  "tt2_packs_exposed",
  "pricing_toggle_changed",
  "pricing_cta_clicked",
  "checkout_started",
  "checkout_completed",
  "checkout_failed",
  "checkout_abandoned",
  // Funnel — fine-grained user journey events (Batch 3 funnel completion)
  "username_validated",
  // Visitor entered a handle whose account is private — flow is paused on
  // tiktok-2 step 1 (private account can't be fetched or serviced).
  "username_private",
  // Server-side: PaymentIntent successfully created in /api/create-payment-intent.
  // Fires once per intent (re)creation, keyed by anonymousId — NOT a clean
  // per-user funnel step. The funnel-grade "reached checkout" event is the
  // client-side `checkout_started` fired once per checkout view.
  "payment_intent_created",
  "payment_initiated",
  "payment_succeeded",
  "order_delivered",
  "subscription_created",
  "subscription_cancelled",
  "subscription_reactivated",
  "subscription_upgraded",
  "subscription_downgraded",
  "payment_method_added",
  "payment_failed",
  "invoice_paid",
  "refund_created",
  "twitch_page_viewed",
  "twitch_connect_started",
  "twitch_connect_completed",
  "twitch_connect_failed",
  "twitch_channel_search_started",
  "twitch_channel_selected",
  "twitch_profile_viewed",
  "twitch_data_loaded",
  "twitch_data_load_failed",
  "twitch_widget_interacted",
  "reviews_page_viewed",
  "reviews_list_viewed",
  "review_card_viewed",
  "review_filter_changed",
  "review_sort_changed",
  "review_search_started",
  "review_search_completed",
  "review_viewed",
  "review_submitted",
  "review_submit_failed",
  "review_cta_clicked",
  "review_shared",
  "creator_profile_viewed",
  "creator_profile_cta_clicked",
  "creator_social_link_clicked",
  "creator_offer_viewed",
  "creator_offer_clicked",
  "creator_contact_started",
  "creator_contact_completed",
  "dashboard_viewed",
  "dashboard_tab_changed",
  "dashboard_metric_viewed",
  "report_export_clicked",
  "settings_viewed",
  "settings_updated",
  "onboarding_started",
  "onboarding_step_viewed",
  "onboarding_step_completed",
  "onboarding_skipped",
  "onboarding_completed",
  "onboarding_failed",
  "search_started",
  "search_completed",
  "search_no_results",
  "filter_changed",
  "sort_changed",
  "instagram_page_viewed",
  "instagram_profile_search_started",
  "instagram_profile_loaded",
  "instagram_profile_load_failed",
  "tiktok_page_viewed",
  "tiktok_profile_search_started",
  "tiktok_profile_loaded",
  "tiktok_profile_load_failed",
  "youtube_page_viewed",
  "youtube_video_search_started",
  "youtube_video_loaded",
  "youtube_video_load_failed",
  "spotify_page_viewed",
  "spotify_track_search_started",
  "spotify_track_loaded",
  "spotify_track_load_failed",
  "facebook_page_viewed",
  "facebook_page_search_started",
  "facebook_page_loaded",
  "facebook_page_load_failed",
  "linkedin_page_viewed",
  "linkedin_profile_search_started",
  "linkedin_profile_loaded",
  "linkedin_profile_load_failed",
  "twitter_page_viewed",
  "twitter_profile_search_started",
  "twitter_profile_loaded",
  "twitter_profile_load_failed",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];
export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export function isValidAnalyticsEventName(value: string): value is AnalyticsEventName {
  return (ANALYTICS_EVENTS as readonly string[]).includes(value) && /^[a-z0-9][a-z0-9_]*$/.test(value);
}
