-- WanderMetric migration: 0016_offers
--
-- One row per partner offer, in one of the ten sections. A page is
-- /{section}/{country}/{slug}. The city is optional because some offers belong
-- to a country (an eSIM for Japan) rather than a city. Only facts read from the
-- partner listing are stored; there is no numeric price column.

create table offers (
  id                 uuid primary key default gen_random_uuid(),
  section            offer_section not null,
  country_id         uuid not null references countries (id) on delete restrict,
  city_id            uuid references cities (id) on delete set null,
  program_id         uuid not null references affiliate_programs (id) on delete restrict,
  affiliate_link_id  uuid references affiliate_links (id) on delete set null,
  name               text not null,
  slug               slug not null,
  summary            text,
  body               text,
  facts              jsonb not null default '{}'::jsonb,
  facts_read_on      date,
  source_url         text,
  price_note         text,
  duration_minutes   integer,
  hero_media_id      uuid references media (id) on delete set null,
  is_featured        boolean not null default false,
  status             content_status not null default 'draft',
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,
  constraint offers_source_url_is_http check (source_url is null or source_url ~* '^https?://'),
  constraint offers_facts_is_object check (jsonb_typeof(facts) = 'object'),
  constraint offers_duration_positive check (duration_minutes is null or duration_minutes > 0)
);

create unique index offers_section_country_slug_key on offers (section, country_id, slug) where deleted_at is null;
create index offers_section_status_idx on offers (section, status, published_at desc) where deleted_at is null;
create index offers_country_idx on offers (country_id) where deleted_at is null;
create index offers_city_idx on offers (city_id) where deleted_at is null;
create index offers_program_idx on offers (program_id) where deleted_at is null;
create index offers_affiliate_link_idx on offers (affiliate_link_id) where deleted_at is null;
create index offers_name_trgm_idx on offers using gin (name gin_trgm_ops);

create trigger offers_set_updated_at before update on offers
  for each row execute function set_updated_at();

comment on table offers is 'Partner offer guides. Facts only: no price, rating or availability is stored.';
comment on column offers.price_note is 'Optional free text such as "listed from about X when read on <date>". Never a numeric price.';

-- Thin-content gate, enforced by the database.
create or replace function enforce_offer_publish_gate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' then
    if coalesce(length(new.body), 0) < 800 then
      raise exception 'An offer needs at least 800 characters of original body copy to be published.'
        using errcode = 'check_violation';
    end if;
    if new.facts = '{}'::jsonb then
      raise exception 'An offer needs the facts read from the partner listing before it can be published.'
        using errcode = 'check_violation';
    end if;
    if new.source_url is null then
      raise exception 'An offer needs its source listing URL before it can be published.'
        using errcode = 'check_violation';
    end if;
    if new.affiliate_link_id is null
       or not exists (
         select 1 from public.affiliate_links l
         where l.id = new.affiliate_link_id and l.status = 'active' and l.deleted_at is null
       ) then
      raise exception 'An offer needs an active affiliate link before it can be published.'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger offers_publish_gate
  before insert or update on offers
  for each row execute function enforce_offer_publish_gate();

alter table offers enable row level security;

create policy offers_public_read on offers for select to anon, authenticated
  using (status = 'published' and deleted_at is null
         and (published_at is null or published_at <= now()));
create policy offers_staff_manage on offers for all to authenticated
  using (is_editor()) with check (is_editor());
