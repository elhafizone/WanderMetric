-- WanderMetric migration: 0007_seo_site_email_audit
-- Applied: 20260914143430

-- ---------------------------------------------------------------------------
-- SEO metadata. One row per content item; every indexable page reads from here.
-- ---------------------------------------------------------------------------
create table seo_metadata (
  id                 uuid primary key default gen_random_uuid(),
  content_type       content_type not null,
  content_id         uuid not null,
  title              text,
  description        text,
  canonical_url      text,
  og_title           text,
  og_description     text,
  og_image_media_id  uuid references media (id) on delete set null,
  twitter_card       text not null default 'summary_large_image',
  robots_index       boolean not null default true,
  robots_follow      boolean not null default true,
  schema_type        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint seo_metadata_title_length check (title is null or length(title) <= 200),
  constraint seo_metadata_description_length check (description is null or length(description) <= 400)
);
create unique index seo_metadata_target_key on seo_metadata (content_type, content_id);
create trigger seo_metadata_set_updated_at before update on seo_metadata
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Redirects. Written automatically whenever a published slug changes, so link
-- equity is never dropped on the floor.
-- ---------------------------------------------------------------------------
create table redirects (
  id           uuid primary key default gen_random_uuid(),
  from_path    text not null,
  to_path      text not null,
  status_code  smallint not null default 301,
  is_active    boolean not null default true,
  hit_count    bigint not null default 0,
  last_hit_at  timestamptz,
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint redirects_status_code_valid check (status_code in (301, 302, 307, 308)),
  constraint redirects_from_is_path check (from_path ~ '^/'),
  constraint redirects_to_is_path_or_url check (to_path ~ '^(/|https?://)'),
  constraint redirects_no_self_loop check (from_path <> to_path)
);
create unique index redirects_from_path_key on redirects (from_path);
create index redirects_active_idx on redirects (is_active) where is_active;
create trigger redirects_set_updated_at before update on redirects
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Site settings. `is_public` gates what anonymous visitors may read.
-- ---------------------------------------------------------------------------
create table site_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  is_public   boolean not null default false,
  updated_by  uuid references profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);
create trigger site_settings_set_updated_at before update on site_settings
  for each row execute function set_updated_at();

comment on column site_settings.is_public is
  'Only rows flagged public are readable by anonymous visitors. Everything else is staff-only.';

-- ---------------------------------------------------------------------------
-- Email subscribers. Double opt-in by design: a row is only 'subscribed' after
-- the confirmation token is redeemed.
-- ---------------------------------------------------------------------------
create table email_subscribers (
  id                  uuid primary key default gen_random_uuid(),
  email               citext not null,
  status              subscriber_status not null default 'pending',
  source              text,
  confirmation_token  uuid not null default gen_random_uuid(),
  confirmed_at        timestamptz,
  unsubscribed_at     timestamptz,
  country_code        char(2),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint email_subscribers_email_shape check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);
create unique index email_subscribers_email_key on email_subscribers (email);
create unique index email_subscribers_token_key on email_subscribers (confirmation_token);
create index email_subscribers_status_idx on email_subscribers (status);
create trigger email_subscribers_set_updated_at before update on email_subscribers
  for each row execute function set_updated_at();

comment on table email_subscribers is
  'Double opt-in. A subscriber reaches status=subscribed only by redeeming confirmation_token.';

-- ---------------------------------------------------------------------------
-- Audit log. Append-only: no update or delete policy exists for any role.
-- ---------------------------------------------------------------------------
create table audit_log (
  id           bigserial primary key,
  actor_id     uuid references profiles (id) on delete set null,
  actor_email  text,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  changes      jsonb,
  created_at   timestamptz not null default now()
);
create index audit_log_entity_idx on audit_log (entity_type, entity_id, created_at desc);
create index audit_log_actor_idx on audit_log (actor_id, created_at desc);
create index audit_log_created_brin on audit_log using brin (created_at);

comment on table audit_log is
  'Append-only record of admin mutations. No role is granted update or delete.';;
