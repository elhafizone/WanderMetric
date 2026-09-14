-- WanderMetric migration: 0005_affiliate_system
-- Applied: 20260914143400

-- ---------------------------------------------------------------------------
-- Affiliate providers.
--
-- `config` holds NON-SECRET settings only (base URLs, locale defaults, feature
-- flags). Markers, tokens and API keys live in environment variables and are
-- never written to the database.
-- ---------------------------------------------------------------------------
create table affiliate_providers (
  id            uuid primary key default gen_random_uuid(),
  slug          slug not null unique,
  name          text not null,
  homepage_url  text,
  status        integration_status not null default 'paused',
  config        jsonb not null default '{}'::jsonb,
  capabilities  jsonb not null default '{}'::jsonb,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger affiliate_providers_set_updated_at before update on affiliate_providers
  for each row execute function set_updated_at();

comment on column affiliate_providers.config is
  'Non-secret configuration only. Credentials belong in environment variables, never here.';

create table affiliate_programs (
  id                uuid primary key default gen_random_uuid(),
  provider_id       uuid not null references affiliate_providers (id) on delete cascade,
  slug              slug not null,
  name              text not null,
  vertical          vertical not null,
  commission_model  commission_model not null default 'unknown',
  -- Nullable on purpose: an unknown rate must stay unknown, never a guess.
  commission_rate   numeric(6, 3),
  currency          char(3),
  cookie_days       integer,
  status            integration_status not null default 'paused',
  config            jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint affiliate_programs_rate_range check (commission_rate is null or commission_rate >= 0),
  constraint affiliate_programs_cookie_positive check (cookie_days is null or cookie_days > 0)
);
create unique index affiliate_programs_provider_slug_key on affiliate_programs (provider_id, slug);
create index affiliate_programs_vertical_idx on affiliate_programs (vertical, status);
create trigger affiliate_programs_set_updated_at before update on affiliate_programs
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Affiliate links: the only place an outbound URL is allowed to live.
-- `slug` drives /go/[slug].
-- ---------------------------------------------------------------------------
create table affiliate_links (
  id                  uuid primary key default gen_random_uuid(),
  program_id          uuid not null references affiliate_programs (id) on delete cascade,
  slug                slug not null,
  label               text not null,
  destination_url     text not null,
  -- Optional template with {clickId} / {marker} placeholders resolved by the
  -- provider adapter. Null means use destination_url as-is.
  deep_link_template  text,
  default_params      jsonb not null default '{}'::jsonb,
  city_id             uuid references cities (id) on delete set null,
  country_id          uuid references countries (id) on delete set null,
  status              integration_status not null default 'active',
  created_by          uuid references profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,
  -- Blocks javascript:, data: and relative values from ever reaching a redirect.
  constraint affiliate_links_destination_is_http
    check (destination_url ~* '^https?://')
);

create unique index affiliate_links_slug_key on affiliate_links (slug) where deleted_at is null;
create index affiliate_links_program_idx on affiliate_links (program_id) where deleted_at is null;
create index affiliate_links_status_idx on affiliate_links (status) where deleted_at is null;

create trigger affiliate_links_set_updated_at before update on affiliate_links
  for each row execute function set_updated_at();

comment on constraint affiliate_links_destination_is_http on affiliate_links is
  'Open-redirect defence: only absolute http(s) targets may be stored.';

-- Which link appears on which piece of content. Drives per-page attribution.
create table affiliate_link_placements (
  id                 uuid primary key default gen_random_uuid(),
  affiliate_link_id  uuid not null references affiliate_links (id) on delete cascade,
  content_type       content_type not null,
  content_id         uuid not null,
  position           integer not null default 0,
  created_at         timestamptz not null default now()
);
create unique index affiliate_link_placements_unique
  on affiliate_link_placements (affiliate_link_id, content_type, content_id);
create index affiliate_link_placements_target_idx
  on affiliate_link_placements (content_type, content_id, position);

-- ---------------------------------------------------------------------------
-- Cached provider offers. Expendable by design: safe to truncate and refetch.
-- Never mixed into editorial tables.
-- ---------------------------------------------------------------------------
create table affiliate_offers (
  id              uuid primary key default gen_random_uuid(),
  program_id      uuid not null references affiliate_programs (id) on delete cascade,
  external_id     text not null,
  title           text not null,
  description     text,
  destination_url text not null,
  image_url       text,
  price_amount    numeric(12, 2),
  price_currency  char(3),
  rating          numeric(3, 2),
  city_id         uuid references cities (id) on delete set null,
  hotel_id        uuid references hotels (id) on delete set null,
  activity_id     uuid references activities (id) on delete set null,
  raw             jsonb not null default '{}'::jsonb,
  fetched_at      timestamptz not null default now(),
  expires_at      timestamptz,
  constraint affiliate_offers_price_positive check (price_amount is null or price_amount >= 0)
);
create unique index affiliate_offers_program_external_key on affiliate_offers (program_id, external_id);
create index affiliate_offers_city_idx on affiliate_offers (city_id);
create index affiliate_offers_expiry_idx on affiliate_offers (expires_at);

comment on table affiliate_offers is
  'Cache of provider-returned offers. Populated only by real provider responses - never hand-written or synthesised.';;
