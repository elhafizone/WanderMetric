-- WanderMetric migration: 0020_click_creates_session
--
-- Every affiliate click failed to record in production. The /go/[slug] route
-- mints an anonymous session cookie and passes its id to record_affiliate_click,
-- but nothing ever inserted that id into tracking_sessions, and
-- affiliate_clicks.session_id is a foreign key to it. The insert raised 23503
-- (foreign_key_violation); the route is written to redirect the visitor anyway,
-- so the failure was silent and the table stayed empty.
--
-- The function now creates the session row first (or refreshes last_seen_at when
-- the visitor already has one), in the same statement batch as the click, so the
-- two cannot disagree. Nothing else changes: same signature, same grants, same
-- result (the click id that is forwarded to the provider as the sub-id).
--
-- A session row carries only what the click row already carries - country, device,
-- referrer host and UTM values - and no personal data or IP address.

create or replace function public.record_affiliate_click(
  p_link_id uuid,
  p_session_id uuid default null::uuid,
  p_content_type public.content_type default null::public.content_type,
  p_content_id uuid default null::uuid,
  p_page_path text default null::text,
  p_referrer_host text default null::text,
  p_utm_source text default null::text,
  p_utm_medium text default null::text,
  p_utm_campaign text default null::text,
  p_campaign text default null::text,
  p_country_code text default null::text,
  p_device public.device_type default 'unknown'::public.device_type,
  p_is_bot boolean default false
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_click_id uuid;
begin
  -- The foreign key needs the session to exist before the click does.
  if p_session_id is not null then
    insert into public.tracking_sessions (
      id, country_code, device, referrer_host,
      utm_source, utm_medium, utm_campaign
    )
    values (
      p_session_id, p_country_code, p_device, p_referrer_host,
      p_utm_source, p_utm_medium, p_utm_campaign
    )
    on conflict (id) do update set last_seen_at = now();
  end if;

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
$function$;
