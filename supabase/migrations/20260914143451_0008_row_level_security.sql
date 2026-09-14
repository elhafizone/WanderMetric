-- WanderMetric migration: 0008_row_level_security
-- Applied: 20260914143451

-- ---------------------------------------------------------------------------
-- Row Level Security for every table.
--
-- Model:
--   anon           read published editorial content only
--   authenticated  staff roles manage content per current_role_level()
--   service_role   bypasses RLS; used only by trusted server code
--
-- Tracking, audit, subscriber and integration tables are closed to anon
-- entirely. Their writes happen server-side through the service role.
-- ---------------------------------------------------------------------------

alter table countries                 enable row level security;
alter table regions                   enable row level security;
alter table cities                    enable row level security;
alter table media                     enable row level security;
alter table categories                enable row level security;
alter table tags                      enable row level security;
alter table content_tags              enable row level security;
alter table destinations              enable row level security;
alter table guides                    enable row level security;
alter table hotels                    enable row level security;
alter table activities                enable row level security;
alter table flight_routes             enable row level security;
alter table deals                     enable row level security;
alter table affiliate_providers       enable row level security;
alter table affiliate_programs        enable row level security;
alter table affiliate_links           enable row level security;
alter table affiliate_link_placements enable row level security;
alter table affiliate_offers          enable row level security;
alter table tracking_sessions         enable row level security;
alter table affiliate_clicks          enable row level security;
alter table affiliate_conversions     enable row level security;
alter table page_views                enable row level security;
alter table daily_stats               enable row level security;
alter table seo_metadata              enable row level security;
alter table redirects                 enable row level security;
alter table site_settings             enable row level security;
alter table email_subscribers         enable row level security;
alter table audit_log                 enable row level security;

-- --------------------------- published content -----------------------------

create policy countries_public_read on countries for select to anon, authenticated
  using (status = 'published' and deleted_at is null);
create policy countries_staff_manage on countries for all to authenticated
  using (is_editor()) with check (is_editor());

create policy regions_public_read on regions for select to anon, authenticated
  using (status = 'published' and deleted_at is null);
create policy regions_staff_manage on regions for all to authenticated
  using (is_editor()) with check (is_editor());

create policy cities_public_read on cities for select to anon, authenticated
  using (status = 'published' and deleted_at is null);
create policy cities_staff_manage on cities for all to authenticated
  using (is_editor()) with check (is_editor());

create policy destinations_public_read on destinations for select to anon, authenticated
  using (status = 'published' and deleted_at is null
         and (published_at is null or published_at <= now()));
create policy destinations_staff_manage on destinations for all to authenticated
  using (is_editor()) with check (is_editor());

create policy guides_public_read on guides for select to anon, authenticated
  using (status = 'published' and deleted_at is null
         and (published_at is null or published_at <= now()));
create policy guides_staff_manage on guides for all to authenticated
  using (is_editor()) with check (is_editor());

create policy hotels_public_read on hotels for select to anon, authenticated
  using (status = 'published' and deleted_at is null
         and (published_at is null or published_at <= now()));
create policy hotels_staff_manage on hotels for all to authenticated
  using (is_editor()) with check (is_editor());

create policy activities_public_read on activities for select to anon, authenticated
  using (status = 'published' and deleted_at is null
         and (published_at is null or published_at <= now()));
create policy activities_staff_manage on activities for all to authenticated
  using (is_editor()) with check (is_editor());

create policy flight_routes_public_read on flight_routes for select to anon, authenticated
  using (status = 'published' and deleted_at is null);
create policy flight_routes_staff_manage on flight_routes for all to authenticated
  using (is_editor()) with check (is_editor());

-- Expired deals stop being publicly readable at the database, so a stale cache
-- can never surface an offer that has ended.
create policy deals_public_read on deals for select to anon, authenticated
  using (status = 'published' and deleted_at is null
         and (published_at is null or published_at <= now())
         and (ends_at is null or ends_at > now()));
create policy deals_staff_manage on deals for all to authenticated
  using (is_editor()) with check (is_editor());

-- ------------------------------ supporting ---------------------------------

create policy media_public_read on media for select to anon, authenticated using (true);
create policy media_staff_manage on media for all to authenticated
  using (is_editor()) with check (is_editor());

create policy categories_public_read on categories for select to anon, authenticated using (true);
create policy categories_staff_manage on categories for all to authenticated
  using (is_editor()) with check (is_editor());

create policy tags_public_read on tags for select to anon, authenticated using (true);
create policy tags_staff_manage on tags for all to authenticated
  using (is_editor()) with check (is_editor());

create policy content_tags_public_read on content_tags for select to anon, authenticated using (true);
create policy content_tags_staff_manage on content_tags for all to authenticated
  using (is_editor()) with check (is_editor());

create policy seo_metadata_public_read on seo_metadata for select to anon, authenticated using (true);
create policy seo_metadata_staff_manage on seo_metadata for all to authenticated
  using (is_editor()) with check (is_editor());

create policy redirects_public_read on redirects for select to anon, authenticated
  using (is_active);
create policy redirects_staff_manage on redirects for all to authenticated
  using (is_editor()) with check (is_editor());

create policy site_settings_public_read on site_settings for select to anon, authenticated
  using (is_public);
create policy site_settings_admin_manage on site_settings for all to authenticated
  using (is_admin()) with check (is_admin());

-- ------------------------------- affiliate ---------------------------------
-- Active integrations are readable so public pages can render disclosure and
-- resolve /go/ slugs. Sensitive columns are revoked from anon below.

create policy affiliate_providers_public_read on affiliate_providers for select to anon, authenticated
  using (status = 'active');
create policy affiliate_providers_admin_manage on affiliate_providers for all to authenticated
  using (is_admin()) with check (is_admin());

create policy affiliate_programs_public_read on affiliate_programs for select to anon, authenticated
  using (status = 'active');
create policy affiliate_programs_admin_manage on affiliate_programs for all to authenticated
  using (is_admin()) with check (is_admin());

create policy affiliate_links_public_read on affiliate_links for select to anon, authenticated
  using (status = 'active' and deleted_at is null);
create policy affiliate_links_staff_manage on affiliate_links for all to authenticated
  using (is_editor()) with check (is_editor());

create policy affiliate_link_placements_public_read on affiliate_link_placements
  for select to anon, authenticated using (true);
create policy affiliate_link_placements_staff_manage on affiliate_link_placements
  for all to authenticated using (is_editor()) with check (is_editor());

create policy affiliate_offers_public_read on affiliate_offers for select to anon, authenticated
  using (expires_at is null or expires_at > now());
create policy affiliate_offers_staff_manage on affiliate_offers for all to authenticated
  using (is_editor()) with check (is_editor());

-- Credentials never live in these columns, but internal configuration is still
-- not public information.
revoke select (config, notes) on affiliate_providers from anon;
revoke select (config) on affiliate_programs from anon;

-- ------------------------ tracking: closed to anon --------------------------
-- No anon policy exists, so anon gets nothing. Inserts are performed by server
-- code holding the service role, which bypasses RLS.

create policy tracking_sessions_staff_read on tracking_sessions for select to authenticated
  using (is_staff());
create policy affiliate_clicks_staff_read on affiliate_clicks for select to authenticated
  using (is_staff());
create policy affiliate_conversions_staff_read on affiliate_conversions for select to authenticated
  using (is_staff());
create policy page_views_staff_read on page_views for select to authenticated
  using (is_staff());
create policy daily_stats_staff_read on daily_stats for select to authenticated
  using (is_staff());

-- ------------------------ subscribers and audit -----------------------------
-- Subscribe/unsubscribe run server-side under the service role; the mailing
-- list is never enumerable through the public API.

create policy email_subscribers_admin_read on email_subscribers for select to authenticated
  using (is_admin());
create policy email_subscribers_admin_manage on email_subscribers for all to authenticated
  using (is_admin()) with check (is_admin());

-- Read-only for staff. Deliberately no insert/update/delete policy: the audit
-- trail is append-only and written only by the service role.
create policy audit_log_staff_read on audit_log for select to authenticated
  using (is_staff());;
