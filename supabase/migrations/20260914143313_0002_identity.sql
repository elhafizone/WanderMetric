-- WanderMetric migration: 0002_identity
-- Applied: 20260914143313

-- Application-side user data. auth.users stays owned by Supabase Auth; this
-- table holds the role and author identity the application needs.
create table profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         citext not null,
  full_name     text,
  avatar_url    text,
  bio           text,
  role          user_role not null default 'viewer',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index profiles_role_idx on profiles (role) where is_active;
create unique index profiles_email_key on profiles (email);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

comment on table profiles is 'Application profile for an authenticated user. Also the author record for editorial content.';
comment on column profiles.role is 'Admin capability tier. Public visitors have no profile row.';

-- Mirror new auth users into profiles. The first user to sign up becomes admin
-- so the dashboard is reachable; everyone after defaults to viewer.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned_role public.user_role;
begin
  if not exists (select 1 from public.profiles) then
    assigned_role := 'admin';
  else
    assigned_role := 'viewer';
  end if;

  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    assigned_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS helpers
--
-- security definer so a policy can read profiles without recursing into
-- profiles' own RLS. Marked stable so Postgres evaluates them once per query
-- rather than once per row.
-- ---------------------------------------------------------------------------

create or replace function current_role_level()
returns user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid()) and p.is_active;
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_role_level() = 'admin', false);
$$;

-- Editors may manage content; admins inherit everything an editor can do.
create or replace function is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_role_level() in ('admin', 'editor'), false);
$$;

create or replace function is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_role_level() in ('admin', 'editor', 'viewer'), false);
$$;

alter table profiles enable row level security;

create policy profiles_select_self_or_staff on profiles
  for select to authenticated
  using (id = (select auth.uid()) or is_staff());

create policy profiles_update_self on profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select p.role from profiles p where p.id = (select auth.uid())));

create policy profiles_admin_all on profiles
  for all to authenticated
  using (is_admin())
  with check (is_admin());;
