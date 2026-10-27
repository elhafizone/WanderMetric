-- Corrective: Supabase default privileges gave anon/authenticated full DML on new
-- views, and public_authors is an auto-updatable security-definer view over
-- profiles. Leave SELECT only.
--
-- This file records a migration that was applied to production on 2026-10-20 and
-- was never committed (version 20261020175534 in supabase_migrations). The SQL
-- below is byte-for-byte what production ran; do not edit 0018 instead.
revoke insert, update, delete, truncate, references, trigger
  on public.public_authors from anon, authenticated;
