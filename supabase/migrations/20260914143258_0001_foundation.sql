-- WanderMetric migration: 0001_foundation
-- Applied: 20260914143258

create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

create type content_status as enum ('draft', 'review', 'published', 'archived');
create type user_role as enum ('admin', 'editor', 'viewer');
create type vertical as enum ('flights', 'hotels', 'activities', 'tours', 'cars', 'insurance', 'transfers', 'other');
create type activity_kind as enum ('activity', 'tour');
create type deal_kind as enum ('hotel', 'flight', 'activity', 'tour', 'package', 'other');
create type commission_model as enum ('percentage', 'fixed', 'cpa', 'cpc', 'hybrid', 'unknown');
create type conversion_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type subscriber_status as enum ('pending', 'subscribed', 'unsubscribed', 'bounced', 'complained');
create type device_type as enum ('desktop', 'mobile', 'tablet', 'bot', 'unknown');
create type integration_status as enum ('active', 'paused', 'disabled');
create type content_type as enum ('country', 'region', 'city', 'destination', 'guide', 'hotel', 'activity', 'deal', 'flight_route', 'page');
create type continent as enum ('africa', 'antarctica', 'asia', 'europe', 'north_america', 'oceania', 'south_america');

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function slugify(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(lower(public.unaccent(value)), '[^a-z0-9]+', '-', 'g'),
      '-{2,}', '-', 'g'
    )
  );
$$;

create domain slug as text
  check (value ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and length(value) between 1 and 120);

comment on domain slug is 'Lowercase, hyphen-separated URL segment. Immutable once published; a change must write a redirects row.';;
