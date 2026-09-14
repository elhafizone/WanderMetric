-- WanderMetric migration: 0009_harden_extensions_and_function_grants
-- Applied: 20260914143524

-- Extensions do not belong in the API-exposed `public` schema, where their
-- objects can shadow application objects. `extensions` is already on the role
-- search_path, so references keep resolving. Existing indexes and columns store
-- type/opclass OIDs, so a schema move does not invalidate them.
alter extension citext   set schema extensions;
alter extension pg_trgm  set schema extensions;
alter extension unaccent set schema extensions;

-- slugify pinned unaccent to public; repoint it at the new home.
create or replace function slugify(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(lower(extensions.unaccent(value)), '[^a-z0-9]+', '-', 'g'),
      '-{2,}', '-', 'g'
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- Function grants
--
-- Every function in `public` is exposed by PostgREST as an RPC endpoint. These
-- helpers exist for RLS policy expressions, not as a public API.
-- ---------------------------------------------------------------------------

-- Trigger functions are invoked by the trigger machinery, never called
-- directly, so no client role needs EXECUTE.
revoke execute on function handle_new_user() from anon, authenticated, public;
revoke execute on function set_updated_at()  from anon, authenticated, public;

-- No anon policy references these, so anon has no reason to reach them.
-- `authenticated` keeps EXECUTE because its RLS policies evaluate them as the
-- calling role; without it every staff policy would fail with permission
-- denied. They disclose only the caller's own role, which the caller already
-- knows, so remaining reachable is acceptable and intentional.
revoke execute on function current_role_level() from anon, public;
revoke execute on function is_admin()           from anon, public;
revoke execute on function is_editor()          from anon, public;
revoke execute on function is_staff()           from anon, public;

comment on function is_admin() is
  'RLS helper. EXECUTE intentionally retained for `authenticated` so staff policies can evaluate; revoked for anon.';;
