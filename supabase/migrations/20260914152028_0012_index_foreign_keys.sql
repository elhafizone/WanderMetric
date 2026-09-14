-- WanderMetric migration: 0012_index_foreign_keys
-- Applied: 20260914152028

-- Cover every foreign key with an index.
--
-- Two reasons, both real:
--  1. Some are filtered directly by application queries (guides.category_id is
--     used by the category listing, flight_routes.destination_city_id by route
--     lookups).
--  2. The rest guard deletes. Removing a media row or a profile forces Postgres
--     to scan every referencing table for dependent rows; without a covering
--     index that is a sequential scan per table, per delete.
--
-- Supabase's linter currently reports these as "unused", which is expected at
-- zero traffic and is not a reason to omit them.

create index if not exists activities_author_id_idx on activities (author_id);
create index if not exists activities_category_id_idx on activities (category_id);
create index if not exists activities_hero_media_id_idx on activities (hero_media_id);

create index if not exists affiliate_clicks_program_id_idx on affiliate_clicks (program_id);
create index if not exists affiliate_conversions_program_id_idx on affiliate_conversions (program_id);

create index if not exists affiliate_links_city_id_idx on affiliate_links (city_id);
create index if not exists affiliate_links_country_id_idx on affiliate_links (country_id);
create index if not exists affiliate_links_created_by_idx on affiliate_links (created_by);

create index if not exists affiliate_offers_activity_id_idx on affiliate_offers (activity_id);
create index if not exists affiliate_offers_hotel_id_idx on affiliate_offers (hotel_id);

create index if not exists cities_hero_media_id_idx on cities (hero_media_id);
create index if not exists countries_hero_media_id_idx on countries (hero_media_id);
create index if not exists daily_stats_provider_id_idx on daily_stats (provider_id);

create index if not exists deals_activity_id_idx on deals (activity_id);
create index if not exists deals_country_id_idx on deals (country_id);
create index if not exists deals_hero_media_id_idx on deals (hero_media_id);
create index if not exists deals_hotel_id_idx on deals (hotel_id);

create index if not exists destinations_author_id_idx on destinations (author_id);
create index if not exists destinations_hero_media_id_idx on destinations (hero_media_id);

create index if not exists flight_routes_destination_city_id_idx on flight_routes (destination_city_id);

create index if not exists guides_category_id_idx on guides (category_id);
create index if not exists guides_country_id_idx on guides (country_id);
create index if not exists guides_hero_media_id_idx on guides (hero_media_id);

create index if not exists hotels_author_id_idx on hotels (author_id);
create index if not exists hotels_hero_media_id_idx on hotels (hero_media_id);

create index if not exists page_views_session_id_idx on page_views (session_id);
create index if not exists seo_metadata_og_image_media_id_idx on seo_metadata (og_image_media_id);
create index if not exists site_settings_updated_by_idx on site_settings (updated_by);

-- daily_stats had a unique index but no primary key, because its natural key
-- uses COALESCE expressions and an expression cannot form a PRIMARY KEY. A
-- surrogate key gives the table a stable row identity for replication and
-- tooling without disturbing the existing uniqueness guarantee.
alter table daily_stats add column if not exists id bigint generated always as identity;
alter table daily_stats add constraint daily_stats_pkey primary key (id);
