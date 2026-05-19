# Fanovera Analytics Tracking Plan

Common properties: `userId`, `anonymousId`, `locale`, `pathname`, `page_type`, `product_area`, `feature_name`, `referrer`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `gbraid`, `wbraid`, `msclkid`, `fbclid`, `entry_surface`, `device_type`, `plan`, `experimentId`, `variantId`, `pricing_strategy`, `country`, `environment`.

Global events: `page_view`, `locale_changed`, `nav_item_clicked`, `footer_link_clicked`, `cta_clicked`, `outbound_link_clicked`, `form_error`, `api_error`, `validation_error`, `404_viewed`, `consent_updated`.

Auth/account events reserved for future account flows: `signup_viewed`, `signup_started`, `signup_step_completed`, `signup_completed`, `signup_failed`, `login_viewed`, `login_started`, `login_completed`, `login_failed`, `logout_clicked`, `password_reset_requested`, `account_created`, `account_settings_viewed`, `account_settings_updated`.

Pricing and billing funnel: `pricing_viewed`, `pricing_plan_viewed`, `pricing_comparison_viewed`, `pricing_faq_opened`, `pricing_variant_exposed`, `pricing_toggle_changed`, `pricing_cta_clicked`, `checkout_started`, `checkout_completed`, `checkout_failed`, `checkout_abandoned`, `username_validated`, `payment_initiated`, `payment_succeeded`, `order_delivered`, `subscription_created`, `subscription_cancelled`, `subscription_reactivated`, `subscription_upgraded`, `subscription_downgraded`, `payment_method_added`, `payment_failed`, `invoice_paid`, `refund_created`.

Twitch funnel: `twitch_page_viewed`, `twitch_connect_started`, `twitch_connect_completed`, `twitch_connect_failed`, `twitch_channel_search_started`, `twitch_channel_selected`, `twitch_profile_viewed`, `twitch_data_loaded`, `twitch_data_load_failed`, `twitch_widget_interacted`.

Reviews funnel: `reviews_page_viewed`, `reviews_list_viewed`, `review_card_viewed`, `review_filter_changed`, `review_sort_changed`, `review_search_started`, `review_search_completed`, `review_viewed`, `review_submitted`, `review_submit_failed`, `review_cta_clicked`, `review_shared`.

Creator/profile funnel: `creator_profile_viewed`, `creator_profile_cta_clicked`, `creator_social_link_clicked`, `creator_offer_viewed`, `creator_offer_clicked`, `creator_contact_started`, `creator_contact_completed`.

Dashboard/admin funnel: `dashboard_viewed`, `dashboard_tab_changed`, `dashboard_metric_viewed`, `report_export_clicked`, `settings_viewed`, `settings_updated`.

Onboarding funnel: `onboarding_started`, `onboarding_step_viewed`, `onboarding_step_completed`, `onboarding_skipped`, `onboarding_completed`, `onboarding_failed`.

Search/filter funnel: `search_started`, `search_completed`, `search_no_results`, `filter_changed`, `sort_changed`.

Product funnels:

- Instagram: `instagram_page_viewed`, `instagram_profile_search_started`, `instagram_profile_loaded`, `instagram_profile_load_failed`.
- TikTok: `tiktok_page_viewed`, `tiktok_profile_search_started`, `tiktok_profile_loaded`, `tiktok_profile_load_failed`.
- YouTube: `youtube_page_viewed`, `youtube_video_search_started`, `youtube_video_loaded`, `youtube_video_load_failed`.
- Spotify: `spotify_page_viewed`, `spotify_track_search_started`, `spotify_track_loaded`, `spotify_track_load_failed`.
- Facebook: `facebook_page_viewed`, `facebook_page_search_started`, `facebook_page_loaded`, `facebook_page_load_failed`.
- LinkedIn: `linkedin_page_viewed`, `linkedin_profile_search_started`, `linkedin_profile_loaded`, `linkedin_profile_load_failed`.
- X/Twitter: `twitter_page_viewed`, `twitter_profile_search_started`, `twitter_profile_loaded`, `twitter_profile_load_failed`.

Expected mini-funnel per product: page viewed -> pricing viewed -> plan viewed -> profile/content search started -> profile/content loaded or load failed -> pricing CTA clicked -> checkout started -> checkout completed or checkout failed.

Promo landing funnel: users from Google Ads can land on `/promo`; network card/icon clicks emit `cta_clicked` with `feature_name=promo_network_selector`, `entry_surface=promo`, `destination_network` and `cta_location`. Promo links preserve UTM and click IDs into the selected network page. When the URL carries a network-naming UTM (e.g. `utm_term=buy+tiktok+followers`), the hero H1 and the matching network card adapt to that intent; this exposure is logged via `promo_hero_targeted_exposed` with `destination_network`. The downstream `cta_clicked` event also carries `targeted_match` (boolean) and `targeted_network` so the funnel can be sliced by whether the visitor clicked the network we surfaced.

PostHog reading guide: use `pricing_variant_exposed` as the exposure event, then compare conversion to `checkout_started` and `checkout_completed` by `experimentId`, `variantId`, `pricing_strategy`, `product_area`, `locale`, `entry_surface` and `plan`.
