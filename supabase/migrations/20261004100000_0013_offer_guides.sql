-- WanderMetric migration: 0013_offer_guides
--
-- An offer guide is an `activities` row tied to one partner programme and one
-- affiliate link. Facts are the only structured claims we store, and there is
-- still no numeric price column: `price_note` is free text, dated, and optional.

alter table activities
  add column program_id        uuid references affiliate_programs (id) on delete set null,
  add column affiliate_link_id uuid references affiliate_links (id) on delete set null,
  add column source_url        text,
  add column facts             jsonb not null default '{}'::jsonb,
  add column facts_read_on     date,
  add column price_note        text;

alter table activities
  add constraint activities_source_url_is_http
    check (source_url is null or source_url ~* '^https?://'),
  add constraint activities_facts_is_object
    check (jsonb_typeof(facts) = 'object');

create index activities_program_idx on activities (program_id) where deleted_at is null;
create index activities_affiliate_link_idx on activities (affiliate_link_id) where deleted_at is null;

comment on column activities.facts is
  'Facts read from the partner listing (duration, languages, inclusions...). Absent fact = absent key. Never filled in.';
comment on column activities.price_note is
  'Optional free text such as "listed from about X when read on <date>". Never a numeric price.';

-- ---------------------------------------------------------------------------
-- Publish gate for offer guides (rows with a programme). Existing editorial
-- activities are unaffected.
-- ---------------------------------------------------------------------------
create or replace function enforce_offer_guide_publish_gate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.program_id is not null then
    if coalesce(length(new.body), 0) < 800 then
      raise exception 'An offer guide needs at least 800 characters of original body copy to be published.'
        using errcode = 'check_violation';
    end if;
    if new.facts = '{}'::jsonb then
      raise exception 'An offer guide needs the facts read from the partner listing before it can be published.'
        using errcode = 'check_violation';
    end if;
    if new.source_url is null then
      raise exception 'An offer guide needs its source listing URL before it can be published.'
        using errcode = 'check_violation';
    end if;
    if new.affiliate_link_id is null
       or not exists (
         select 1 from public.affiliate_links l
         where l.id = new.affiliate_link_id and l.status = 'active' and l.deleted_at is null
       ) then
      raise exception 'An offer guide needs an active affiliate link before it can be published.'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger activities_offer_guide_publish_gate
  before insert or update on activities
  for each row execute function enforce_offer_guide_publish_gate();

comment on function enforce_offer_guide_publish_gate() is
  'Thin-content gate for offer guides: body >= 800 chars, facts, source URL and an active affiliate link.';
