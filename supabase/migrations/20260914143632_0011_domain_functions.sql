-- WanderMetric migration: 0011_domain_functions
-- Applied: 20260914143632

-- ---------------------------------------------------------------------------
-- Automatic redirects on slug change.
--
-- Renaming a published URL without a 301 silently destroys accumulated ranking.
-- Enforcing it in the database means no code path can forget.
-- ---------------------------------------------------------------------------
create or replace function record_slug_redirect()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_path text;
  new_path text;
  city_slug text;
  country_slug text;
begin
  if new.slug = old.slug then
    return new;
  end if;
  -- Only published URLs have earned equity worth preserving.
  if old.status <> 'published' then
    return new;
  end if;

  case tg_table_name
    when 'guides' then
      old_path := '/guides/' || old.slug;
      new_path := '/guides/' || new.slug;
    when 'deals' then
      old_path := '/deals/' || old.slug;
      new_path := '/deals/' || new.slug;
    when 'hotels' then
      select c.slug into city_slug from public.cities c where c.id = new.city_id;
      old_path := '/hotels/' || city_slug || '/' || old.slug;
      new_path := '/hotels/' || city_slug || '/' || new.slug;
    when 'activities' then
      select c.slug into city_slug from public.cities c where c.id = new.city_id;
      old_path := case when new.kind = 'tour' then '/tours/' else '/activities/' end
                    || city_slug || '/' || old.slug;
      new_path := case when new.kind = 'tour' then '/tours/' else '/activities/' end
                    || city_slug || '/' || new.slug;
    when 'countries' then
      old_path := '/destinations/' || old.slug;
      new_path := '/destinations/' || new.slug;
    when 'cities' then
      select c.slug into country_slug from public.countries c where c.id = new.country_id;
      old_path := '/destinations/' || country_slug || '/' || old.slug;
      new_path := '/destinations/' || country_slug || '/' || new.slug;
    else
      return new;
  end case;

  if old_path is null or new_path is null or old_path = new_path then
    return new;
  end if;

  insert into public.redirects (from_path, to_path, status_code, note)
  values (old_path, new_path, 301, 'auto: slug change on ' || tg_table_name)
  on conflict (from_path) do update
    set to_path = excluded.to_path, is_active = true, updated_at = now();

  -- A previously-created redirect may now point at the old path; re-target it
  -- so chains collapse to a single hop instead of growing.
  update public.redirects
     set to_path = new_path, updated_at = now()
   where to_path = old_path and from_path <> new_path;

  return new;
end;
$$;

create trigger guides_slug_redirect     after update of slug on guides
  for each row execute function record_slug_redirect();
create trigger deals_slug_redirect      after update of slug on deals
  for each row execute function record_slug_redirect();
create trigger hotels_slug_redirect     after update of slug on hotels
  for each row execute function record_slug_redirect();
create trigger activities_slug_redirect after update of slug on activities
  for each row execute function record_slug_redirect();
create trigger countries_slug_redirect  after update of slug on countries
  for each row execute function record_slug_redirect();
create trigger cities_slug_redirect     after update of slug on cities
  for each row execute function record_slug_redirect();

revoke execute on function record_slug_redirect() from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- Affiliate link resolution and click recording.
-- Invoked by the /go/[slug] route handler under the service role.
-- ---------------------------------------------------------------------------
create or replace function resolve_affiliate_link(p_slug text)
returns table (
  link_id            uuid,
  destination_url    text,
  deep_link_template text,
  default_params     jsonb,
  program_id         uuid,
  provider_id        uuid,
  provider_slug      text,
  provider_config    jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l.destination_url, l.deep_link_template, l.default_params,
         p.id, pr.id, pr.slug::text, pr.config
  from public.affiliate_links l
  join public.affiliate_programs  p  on p.id  = l.program_id
  join public.affiliate_providers pr on pr.id = p.provider_id
  where l.slug = p_slug
    and l.status = 'active'
    and l.deleted_at is null
  limit 1;
$$;
revoke execute on function resolve_affiliate_link(text) from anon, authenticated, public;

create or replace function record_affiliate_click(
  p_link_id      uuid,
  p_session_id   uuid   default null,
  p_content_type content_type default null,
  p_content_id   uuid   default null,
  p_page_path    text   default null,
  p_referrer_host text  default null,
  p_utm_source   text   default null,
  p_utm_medium   text   default null,
  p_utm_campaign text   default null,
  p_campaign     text   default null,
  p_country_code text   default null,
  p_device       device_type default 'unknown',
  p_is_bot       boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_click_id uuid;
begin
  insert into public.affiliate_clicks (
    affiliate_link_id, program_id, provider_id, session_id,
    content_type, content_id, page_path, referrer_host,
    utm_source, utm_medium, utm_campaign, campaign,
    country_code, device, is_bot
  )
  select p_link_id, l.program_id, p.provider_id, p_session_id,
         p_content_type, p_content_id, p_page_path, p_referrer_host,
         p_utm_source, p_utm_medium, p_utm_campaign, p_campaign,
         p_country_code, p_device, p_is_bot
  from public.affiliate_links l
  join public.affiliate_programs p on p.id = l.program_id
  where l.id = p_link_id
  returning id into v_click_id;

  return v_click_id;
end;
$$;
revoke execute on function record_affiliate_click(uuid, uuid, content_type, uuid, text, text, text, text, text, text, text, device_type, boolean) from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- Redirect hit counter. Fire-and-forget; never blocks the redirect itself.
-- ---------------------------------------------------------------------------
create or replace function touch_redirect(p_from_path text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.redirects
     set hit_count = hit_count + 1, last_hit_at = now()
   where from_path = p_from_path;
$$;
revoke execute on function touch_redirect(text) from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- Nightly rollup. Dashboards read daily_stats; they never scan raw events.
-- Idempotent, so a retry after a failed cron run is safe.
-- ---------------------------------------------------------------------------
create or replace function rollup_daily_stats(p_date date default (current_date - 1))
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  with views as (
    select content_type, content_id, count(*)::int as n
    from public.page_views
    where created_at >= p_date and created_at < p_date + 1 and not is_bot
    group by 1, 2
  ),
  clicks as (
    select content_type, content_id, provider_id, count(*)::int as n
    from public.affiliate_clicks
    where created_at >= p_date and created_at < p_date + 1 and not is_bot
    group by 1, 2, 3
  ),
  combined as (
    select coalesce(v.content_type, c.content_type) as content_type,
           coalesce(v.content_id,  c.content_id)   as content_id,
           c.provider_id,
           coalesce(v.n, 0) as views,
           coalesce(c.n, 0) as clicks
    from views v
    full outer join clicks c
      on v.content_type is not distinct from c.content_type
     and v.content_id   is not distinct from c.content_id
  )
  insert into public.daily_stats (stat_date, content_type, content_id, provider_id, views, clicks, updated_at)
  select p_date, content_type, content_id, provider_id, views, clicks, now()
  from combined
  on conflict (stat_date,
               coalesce(content_type, 'page'::public.content_type),
               coalesce(content_id, '00000000-0000-0000-0000-000000000000'::uuid),
               coalesce(provider_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do update set views = excluded.views, clicks = excluded.clicks, updated_at = now();

  get diagnostics affected = row_count;
  return affected;
end;
$$;
revoke execute on function rollup_daily_stats(date) from anon, authenticated, public;

comment on function rollup_daily_stats is
  'Idempotent nightly aggregation of page_views and affiliate_clicks into daily_stats. Safe to re-run.';;
