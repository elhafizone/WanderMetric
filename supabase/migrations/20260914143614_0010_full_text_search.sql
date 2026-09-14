-- WanderMetric migration: 0010_full_text_search
-- Applied: 20260914143614

-- ---------------------------------------------------------------------------
-- Full-text search using Postgres only. No external search service: at this
-- corpus size tsvector + trigram comfortably outperforms the operational cost
-- of running one.
--
-- Weighting: A = name/title, B = summary/excerpt, C = body.
-- ---------------------------------------------------------------------------

alter table destinations add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(body, '')), 'C')
  ) stored;

alter table guides add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(body, '')), 'C')
  ) stored;

alter table hotels add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(body, '')), 'C')
  ) stored;

alter table activities add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(body, '')), 'C')
  ) stored;

alter table deals add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(body, '')), 'C')
  ) stored;

create index destinations_search_idx on destinations using gin (search_vector);
create index guides_search_idx       on guides       using gin (search_vector);
create index hotels_search_idx       on hotels       using gin (search_vector);
create index activities_search_idx   on activities   using gin (search_vector);
create index deals_search_idx        on deals        using gin (search_vector);

-- ---------------------------------------------------------------------------
-- Unified search across every public content type.
--
-- SECURITY INVOKER so the caller's RLS still applies: an anonymous visitor can
-- only ever match published rows. Returns the canonical path so the caller does
-- not have to reimplement URL construction.
-- ---------------------------------------------------------------------------
create or replace function search_content(
  search_query text,
  result_limit  integer default 20,
  result_offset integer default 0,
  filter_type   content_type default null
)
returns table (
  content_type content_type,
  id           uuid,
  title        text,
  slug         text,
  path         text,
  summary      text,
  image_id     uuid,
  rank         real
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with q as (select websearch_to_tsquery('english'::regconfig, search_query) as tsq)
  select * from (
    select 'destination'::content_type, d.id, d.title, d.slug::text,
           '/destinations/' || c.slug || coalesce('/' || ct.slug, ''),
           d.excerpt, d.hero_media_id,
           ts_rank(d.search_vector, q.tsq)
    from destinations d
    join countries c on c.id = d.country_id
    left join cities ct on ct.id = d.city_id
    cross join q
    where d.search_vector @@ q.tsq

    union all
    select 'guide'::content_type, g.id, g.title, g.slug::text,
           '/guides/' || g.slug, g.excerpt, g.hero_media_id,
           ts_rank(g.search_vector, q.tsq)
    from guides g cross join q
    where g.search_vector @@ q.tsq

    union all
    select 'hotel'::content_type, h.id, h.name, h.slug::text,
           '/hotels/' || ct.slug || '/' || h.slug, h.summary, h.hero_media_id,
           ts_rank(h.search_vector, q.tsq)
    from hotels h join cities ct on ct.id = h.city_id cross join q
    where h.search_vector @@ q.tsq

    union all
    select 'activity'::content_type, a.id, a.name, a.slug::text,
           case when a.kind = 'tour' then '/tours/' else '/activities/' end
             || ct.slug || '/' || a.slug,
           a.summary, a.hero_media_id,
           ts_rank(a.search_vector, q.tsq)
    from activities a join cities ct on ct.id = a.city_id cross join q
    where a.search_vector @@ q.tsq

    union all
    select 'deal'::content_type, dl.id, dl.title, dl.slug::text,
           '/deals/' || dl.slug, dl.summary, dl.hero_media_id,
           ts_rank(dl.search_vector, q.tsq)
    from deals dl cross join q
    where dl.search_vector @@ q.tsq
  ) results (content_type, id, title, slug, path, summary, image_id, rank)
  where filter_type is null or results.content_type = filter_type
  order by rank desc, title asc
  limit least(coalesce(result_limit, 20), 100)
  offset greatest(coalesce(result_offset, 0), 0);
$$;

comment on function search_content is
  'Unified public search. SECURITY INVOKER so RLS still restricts anonymous callers to published rows.';

-- Typeahead over names only. Trigram-based so it tolerates misspellings that
-- full-text search would miss entirely.
create or replace function suggest_places(search_query text, result_limit integer default 8)
returns table (kind text, id uuid, label text, path text, score real)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select * from (
    select 'city'::text, ct.id, ct.name || ', ' || c.name,
           '/destinations/' || c.slug || '/' || ct.slug,
           similarity(ct.name, search_query)
    from cities ct join countries c on c.id = ct.country_id
    where ct.name % search_query
    union all
    select 'country'::text, c.id, c.name, '/destinations/' || c.slug,
           similarity(c.name, search_query)
    from countries c
    where c.name % search_query
  ) s (kind, id, label, path, score)
  order by score desc, label asc
  limit least(coalesce(result_limit, 8), 25);
$$;;
