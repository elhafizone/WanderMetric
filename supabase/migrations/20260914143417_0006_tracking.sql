-- WanderMetric migration: 0006_tracking
-- Applied: 20260914143417

-- ---------------------------------------------------------------------------
-- Tracking.
--
-- Privacy posture: no raw IP address is ever stored. Country is derived at the
-- edge and the address discarded. The session identifier is a rotating random
-- value with no link to a person. No cross-site identifier exists.
-- ---------------------------------------------------------------------------

create table tracking_sessions (
  id            uuid primary key default gen_random_uuid(),
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  country_code  char(2),
  device        device_type not null default 'unknown',
  referrer_host text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text
);
create index tracking_sessions_last_seen_idx on tracking_sessions using brin (last_seen_at);

comment on table tracking_sessions is
  'Anonymous, rotating session identifier. Contains no personal data and no raw IP address.';

-- Affiliate clicks. `id` is the click_id forwarded to providers as a sub-id and
-- is the only bridge back from a conversion postback.
create table affiliate_clicks (
  id                 uuid primary key default gen_random_uuid(),
  affiliate_link_id  uuid not null references affiliate_links (id) on delete cascade,
  -- Denormalised so revenue reporting never has to join three levels deep.
  program_id         uuid references affiliate_programs (id) on delete set null,
  provider_id        uuid references affiliate_providers (id) on delete set null,
  session_id         uuid references tracking_sessions (id) on delete set null,
  content_type       content_type,
  content_id         uuid,
  page_path          text,
  referrer_host      text,
  utm_source         text,
  utm_medium         text,
  utm_campaign       text,
  campaign           text,
  country_code       char(2),
  device             device_type not null default 'unknown',
  is_bot             boolean not null default false,
  created_at         timestamptz not null default now()
);

create index affiliate_clicks_link_idx on affiliate_clicks (affiliate_link_id, created_at desc);
create index affiliate_clicks_provider_idx on affiliate_clicks (provider_id, created_at desc);
create index affiliate_clicks_content_idx on affiliate_clicks (content_type, content_id);
create index affiliate_clicks_session_idx on affiliate_clicks (session_id);
-- BRIN: this table is append-only and time-ordered, so a block-range index gives
-- range-scan performance at a fraction of a btree's size.
create index affiliate_clicks_created_brin on affiliate_clicks using brin (created_at);
create index affiliate_clicks_human_idx on affiliate_clicks (created_at desc) where not is_bot;

comment on column affiliate_clicks.id is
  'The click_id forwarded to the provider as a sub-id. Sole reconciliation key for conversions.';

-- Conversions. Rows arrive ONLY from a verified provider webhook or an
-- authenticated provider report pull. Nothing is ever inferred or synthesised.
create table affiliate_conversions (
  id                   uuid primary key default gen_random_uuid(),
  provider_id          uuid not null references affiliate_providers (id) on delete cascade,
  program_id           uuid references affiliate_programs (id) on delete set null,
  external_id          text not null,
  -- Nullable: many networks never return our sub-id, leaving the conversion
  -- real but unattributable. That must stay visible, not be guessed away.
  click_id             uuid references affiliate_clicks (id) on delete set null,
  order_amount         numeric(12, 2),
  order_currency       char(3),
  commission_amount    numeric(12, 2),
  commission_currency  char(3),
  status               conversion_status not null default 'pending',
  occurred_at          timestamptz not null,
  raw                  jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint affiliate_conversions_amounts_positive
    check ((order_amount is null or order_amount >= 0)
       and (commission_amount is null or commission_amount >= 0))
);

create unique index affiliate_conversions_provider_external_key
  on affiliate_conversions (provider_id, external_id);
create index affiliate_conversions_click_idx on affiliate_conversions (click_id);
create index affiliate_conversions_status_idx on affiliate_conversions (status, occurred_at desc);
create index affiliate_conversions_occurred_brin on affiliate_conversions using brin (occurred_at);

create trigger affiliate_conversions_set_updated_at before update on affiliate_conversions
  for each row execute function set_updated_at();

comment on table affiliate_conversions is
  'Populated exclusively by verified provider webhooks or authenticated report pulls. Never seeded with sample data.';

-- Page views. Highest-volume table; deliberately narrow.
create table page_views (
  id            bigserial primary key,
  session_id    uuid references tracking_sessions (id) on delete set null,
  path          text not null,
  content_type  content_type,
  content_id    uuid,
  referrer_host text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  country_code  char(2),
  device        device_type not null default 'unknown',
  is_bot        boolean not null default false,
  created_at    timestamptz not null default now()
);
create index page_views_created_brin on page_views using brin (created_at);
create index page_views_path_idx on page_views (path, created_at desc) where not is_bot;
create index page_views_content_idx on page_views (content_type, content_id) where not is_bot;

comment on table page_views is
  'Append-only. Not partitioned at launch: an unmaintained partition set fails inserts once it runs past the last partition, which is a worse risk than table size at current volume. BRIN keeps range scans cheap; see docs/database.md for the partitioning trigger point.';

-- Pre-aggregated rollups. Dashboards read this, never the raw event tables.
create table daily_stats (
  stat_date     date not null,
  content_type  content_type,
  content_id    uuid,
  provider_id   uuid references affiliate_providers (id) on delete cascade,
  views         integer not null default 0,
  clicks        integer not null default 0,
  conversions   integer not null default 0,
  revenue       numeric(12, 2) not null default 0,
  currency      char(3),
  updated_at    timestamptz not null default now()
);
create unique index daily_stats_key on daily_stats (
  stat_date,
  coalesce(content_type, 'page'::content_type),
  coalesce(content_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(provider_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
create index daily_stats_date_idx on daily_stats (stat_date desc);;
