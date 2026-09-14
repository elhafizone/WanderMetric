-- WanderMetric migration: 0004_editorial_content
-- Applied: 20260914143346

-- ---------------------------------------------------------------------------
-- Taxonomy
-- ---------------------------------------------------------------------------
create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        slug not null,
  description text,
  applies_to  content_type not null default 'guide',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index categories_scope_slug_key on categories (applies_to, slug);
create trigger categories_set_updated_at before update on categories
  for each row execute function set_updated_at();

create table tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       slug not null unique,
  created_at timestamptz not null default now()
);

-- Polymorphic tagging. content_id intentionally carries no foreign key: a
-- single join table across many entities is worth more than per-entity tables,
-- and orphans are swept by cleanup_orphaned_tags() rather than by the planner.
create table content_tags (
  tag_id       uuid not null references tags (id) on delete cascade,
  content_type content_type not null,
  content_id   uuid not null,
  created_at   timestamptz not null default now(),
  primary key (tag_id, content_type, content_id)
);
create index content_tags_target_idx on content_tags (content_type, content_id);

-- ---------------------------------------------------------------------------
-- Destinations: the primary indexable travel page.
-- A row with city_id is a city page; without it, a country page.
-- ---------------------------------------------------------------------------
create table destinations (
  id             uuid primary key default gen_random_uuid(),
  country_id     uuid not null references countries (id) on delete cascade,
  city_id        uuid references cities (id) on delete cascade,
  title          text not null,
  slug           slug not null,
  excerpt        text,
  body           text,
  best_time      text,
  hero_media_id  uuid references media (id) on delete set null,
  author_id      uuid references profiles (id) on delete set null,
  status         content_status not null default 'draft',
  is_featured    boolean not null default false,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  -- A published destination must carry real substance. This is the database
  -- half of the thin-content gate; the admin UI surfaces the same rule.
  constraint destinations_published_needs_body
    check (status <> 'published' or (body is not null and length(btrim(body)) >= 300)),
  constraint destinations_published_needs_excerpt
    check (status <> 'published' or (excerpt is not null and length(btrim(excerpt)) >= 50))
);

create unique index destinations_country_only_key on destinations (country_id)
  where city_id is null and deleted_at is null;
create unique index destinations_country_city_key on destinations (country_id, city_id)
  where city_id is not null and deleted_at is null;
create index destinations_status_pub_idx on destinations (status, published_at desc) where deleted_at is null;
create index destinations_city_idx on destinations (city_id) where deleted_at is null;
create index destinations_featured_idx on destinations (is_featured) where is_featured and deleted_at is null;
create index destinations_title_trgm_idx on destinations using gin (title gin_trgm_ops);

create trigger destinations_set_updated_at before update on destinations
  for each row execute function set_updated_at();

comment on constraint destinations_published_needs_body on destinations is
  'Thin-content gate: publishing requires at least 300 characters of original body copy.';

-- ---------------------------------------------------------------------------
-- Travel guides
-- ---------------------------------------------------------------------------
create table guides (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             slug not null,
  excerpt          text,
  body             text,
  category_id      uuid references categories (id) on delete set null,
  destination_id   uuid references destinations (id) on delete set null,
  country_id       uuid references countries (id) on delete set null,
  city_id          uuid references cities (id) on delete set null,
  hero_media_id    uuid references media (id) on delete set null,
  author_id        uuid references profiles (id) on delete set null,
  reading_minutes  integer,
  status           content_status not null default 'draft',
  is_featured      boolean not null default false,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  constraint guides_published_needs_body
    check (status <> 'published' or (body is not null and length(btrim(body)) >= 500))
);

create unique index guides_slug_key on guides (slug) where deleted_at is null;
create index guides_status_pub_idx on guides (status, published_at desc) where deleted_at is null;
create index guides_destination_idx on guides (destination_id) where deleted_at is null;
create index guides_city_idx on guides (city_id) where deleted_at is null;
create index guides_author_idx on guides (author_id) where deleted_at is null;
create index guides_title_trgm_idx on guides using gin (title gin_trgm_ops);

create trigger guides_set_updated_at before update on guides
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Hotels. Editorial records we own; live pricing comes from providers at
-- render time and is never persisted here.
-- ---------------------------------------------------------------------------
create table hotels (
  id             uuid primary key default gen_random_uuid(),
  city_id        uuid not null references cities (id) on delete cascade,
  name           text not null,
  slug           slug not null,
  summary        text,
  body           text,
  address        text,
  latitude       numeric(9, 6),
  longitude      numeric(9, 6),
  star_rating    smallint,
  hero_media_id  uuid references media (id) on delete set null,
  author_id      uuid references profiles (id) on delete set null,
  status         content_status not null default 'draft',
  is_featured    boolean not null default false,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  constraint hotels_star_rating_range check (star_rating is null or star_rating between 1 and 5)
);

create unique index hotels_city_slug_key on hotels (city_id, slug) where deleted_at is null;
create index hotels_status_idx on hotels (status, published_at desc) where deleted_at is null;
create index hotels_city_idx on hotels (city_id) where deleted_at is null;
create index hotels_name_trgm_idx on hotels using gin (name gin_trgm_ops);

create trigger hotels_set_updated_at before update on hotels
  for each row execute function set_updated_at();

comment on table hotels is 'Editorial hotel record. No price, availability or review data is stored - those are provider-owned and fetched live.';

-- ---------------------------------------------------------------------------
-- Activities and tours share a table, discriminated by `kind`.
-- ---------------------------------------------------------------------------
create table activities (
  id                uuid primary key default gen_random_uuid(),
  city_id           uuid not null references cities (id) on delete cascade,
  kind              activity_kind not null default 'activity',
  name              text not null,
  slug              slug not null,
  summary           text,
  body              text,
  category_id       uuid references categories (id) on delete set null,
  duration_minutes  integer,
  hero_media_id     uuid references media (id) on delete set null,
  author_id         uuid references profiles (id) on delete set null,
  status            content_status not null default 'draft',
  is_featured       boolean not null default false,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  constraint activities_duration_positive check (duration_minutes is null or duration_minutes > 0)
);

create unique index activities_city_slug_key on activities (city_id, slug) where deleted_at is null;
create index activities_kind_status_idx on activities (kind, status, published_at desc) where deleted_at is null;
create index activities_city_idx on activities (city_id) where deleted_at is null;
create index activities_name_trgm_idx on activities using gin (name gin_trgm_ops);

create trigger activities_set_updated_at before update on activities
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Flight routes: the editorial unit behind /flights. Prices are never stored.
-- ---------------------------------------------------------------------------
create table flight_routes (
  id                   uuid primary key default gen_random_uuid(),
  origin_city_id       uuid not null references cities (id) on delete cascade,
  destination_city_id  uuid not null references cities (id) on delete cascade,
  slug                 slug not null,
  title                text not null,
  body                 text,
  status               content_status not null default 'draft',
  published_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz,
  constraint flight_routes_distinct_endpoints check (origin_city_id <> destination_city_id)
);

create unique index flight_routes_slug_key on flight_routes (slug) where deleted_at is null;
create unique index flight_routes_pair_key on flight_routes (origin_city_id, destination_city_id) where deleted_at is null;
create index flight_routes_status_idx on flight_routes (status) where deleted_at is null;

create trigger flight_routes_set_updated_at before update on flight_routes
  for each row execute function set_updated_at();

comment on table flight_routes is 'Editorial route page (London to Paris). Live fares are fetched from providers at request time, never persisted.';

-- ---------------------------------------------------------------------------
-- Deals
-- ---------------------------------------------------------------------------
create table deals (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            slug not null,
  kind            deal_kind not null default 'other',
  summary         text,
  body            text,
  city_id         uuid references cities (id) on delete set null,
  country_id      uuid references countries (id) on delete set null,
  hotel_id        uuid references hotels (id) on delete set null,
  activity_id     uuid references activities (id) on delete set null,
  hero_media_id   uuid references media (id) on delete set null,
  -- Free text such as "up to 30% off". Never a fabricated numeric price.
  discount_label  text,
  starts_at       timestamptz,
  ends_at         timestamptz,
  status          content_status not null default 'draft',
  is_featured     boolean not null default false,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  constraint deals_window_valid check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create unique index deals_slug_key on deals (slug) where deleted_at is null;
create index deals_status_idx on deals (status, published_at desc) where deleted_at is null;
create index deals_active_window_idx on deals (ends_at) where deleted_at is null and status = 'published';
create index deals_city_idx on deals (city_id) where deleted_at is null;

create trigger deals_set_updated_at before update on deals
  for each row execute function set_updated_at();

comment on column deals.discount_label is 'Editor-supplied label. Never a computed or fabricated price claim.';;
