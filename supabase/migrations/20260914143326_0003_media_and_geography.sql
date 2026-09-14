-- WanderMetric migration: 0003_media_and_geography
-- Applied: 20260914143326

-- ---------------------------------------------------------------------------
-- Media. Rows point at Supabase Storage objects; bytes never live in Postgres.
-- ---------------------------------------------------------------------------
create table media (
  id            uuid primary key default gen_random_uuid(),
  bucket        text not null default 'media',
  storage_path  text not null,
  filename      text not null,
  mime_type     text not null,
  size_bytes    bigint,
  width         integer,
  height        integer,
  -- Required, not optional: alt text is an accessibility and image-SEO
  -- obligation, enforced at the database rather than trusted to the UI.
  alt_text      text not null,
  caption       text,
  credit        text,
  source_url    text,
  blurhash      text,
  uploaded_by   uuid references profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint media_alt_text_not_blank check (length(btrim(alt_text)) > 0)
);

create unique index media_bucket_path_key on media (bucket, storage_path);
create index media_uploaded_by_idx on media (uploaded_by);
create index media_created_at_idx on media (created_at desc);

create trigger media_set_updated_at before update on media
  for each row execute function set_updated_at();

comment on table media is 'Metadata for a Supabase Storage object. alt_text is mandatory by constraint.';

-- ---------------------------------------------------------------------------
-- Geography: country -> region -> city. The spine every travel page hangs off.
-- ---------------------------------------------------------------------------
create table countries (
  id             uuid primary key default gen_random_uuid(),
  iso2           char(2) not null,
  iso3           char(3),
  name           text not null,
  slug           slug not null,
  continent      continent not null,
  currency_code  char(3),
  phone_code     text,
  capital        text,
  summary        text,
  body           text,
  hero_media_id  uuid references media (id) on delete set null,
  status         content_status not null default 'draft',
  published_at   timestamptz,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create unique index countries_iso2_key on countries (iso2) where deleted_at is null;
create unique index countries_slug_key on countries (slug) where deleted_at is null;
create index countries_continent_idx on countries (continent) where deleted_at is null;
create index countries_status_idx on countries (status) where deleted_at is null;
create index countries_name_trgm_idx on countries using gin (name gin_trgm_ops);

create trigger countries_set_updated_at before update on countries
  for each row execute function set_updated_at();

create table regions (
  id          uuid primary key default gen_random_uuid(),
  country_id  uuid not null references countries (id) on delete cascade,
  name        text not null,
  slug        slug not null,
  summary     text,
  status      content_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create unique index regions_country_slug_key on regions (country_id, slug) where deleted_at is null;
create index regions_country_idx on regions (country_id) where deleted_at is null;

create trigger regions_set_updated_at before update on regions
  for each row execute function set_updated_at();

create table cities (
  id             uuid primary key default gen_random_uuid(),
  country_id     uuid not null references countries (id) on delete cascade,
  region_id      uuid references regions (id) on delete set null,
  name           text not null,
  slug           slug not null,
  latitude       numeric(9, 6),
  longitude      numeric(9, 6),
  timezone       text,
  population     integer,
  -- IATA city code, used to build flight deep links without guessing.
  iata_code      char(3),
  summary        text,
  hero_media_id  uuid references media (id) on delete set null,
  status         content_status not null default 'draft',
  is_featured    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  constraint cities_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint cities_longitude_range check (longitude is null or longitude between -180 and 180)
);

create unique index cities_country_slug_key on cities (country_id, slug) where deleted_at is null;
create index cities_country_idx on cities (country_id) where deleted_at is null;
create index cities_region_idx on cities (region_id) where deleted_at is null;
create index cities_featured_idx on cities (is_featured) where is_featured and deleted_at is null;
create index cities_name_trgm_idx on cities using gin (name gin_trgm_ops);
create index cities_iata_idx on cities (iata_code) where iata_code is not null;

create trigger cities_set_updated_at before update on cities
  for each row execute function set_updated_at();

comment on column cities.iata_code is 'IATA city code. Enables real flight deep links instead of guessed airport mappings.';;
