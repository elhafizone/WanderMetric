-- WanderMetric migration: 0018_public_authors
--
-- News articles need a byline, and profiles are readable only by their owner
-- and staff (RLS). This view exposes the public part of a profile, and only for
-- people who authored published content: name, avatar and bio. No email, no
-- role, no other person.
--
-- It runs with the view owner's rights on purpose (security_invoker = false),
-- like the RLS helper functions, so Supabase will list it among the intentional
-- security advisories. The WHERE clause is the access rule.

create or replace view public_authors
  with (security_invoker = false)
as
select p.id, p.full_name, p.avatar_url, p.bio
from profiles p
where p.is_active
  and exists (
    select 1
    from guides g
    where g.author_id = p.id
      and g.status = 'published'
      and g.deleted_at is null
  );

revoke all on public_authors from public;
grant select on public_authors to anon, authenticated;

comment on view public_authors is
  'Public byline data (name, avatar, bio) for authors of published guides and news. Intentionally security definer.';
