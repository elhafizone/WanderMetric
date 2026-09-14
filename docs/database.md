# Database

PostgreSQL 17 on Supabase, project `vxhmtqhnjlkrdjruexmv`, region `us-east-1`.

31 tables across four deliberately separated concerns. Migrations live in
[`supabase/migrations/`](../supabase/migrations) and replay in filename order.

---

## 1. Why the separation matters

| Concern | Tables | Lifetime | Owner |
|---|---|---|---|
| **Editorial** | destinations, guides, hotels, activities, deals, flight_routes, countries, regions, cities, categories, tags, media | Permanent | Us |
| **Provider** | affiliate_providers, affiliate_programs, affiliate_links, affiliate_offers, affiliate_link_placements | Cache / config | Partners |
| **Tracking** | tracking_sessions, affiliate_clicks, affiliate_conversions, page_views, daily_stats | Aged out | Measured |
| **Identity** | profiles, audit_log, site_settings, email_subscribers, seo_metadata, redirects | Permanent | Us |

Provider data is never the reason a page exists. A destination page exists
because *we* wrote it; provider offers decorate it. If a partner disappears
tomorrow, every page survives with a gap where an offer used to be.

---

## 2. Decisions worth understanding

### 2.1 The thin-content gate is a database constraint

```sql
constraint destinations_published_needs_body
  check (status <> 'published' or (body is not null and length(btrim(body)) >= 300))
```

Publishing a destination requires 300+ characters of body and a 50+ character
excerpt; a guide requires 500+. This is enforced in the database rather than in
the admin UI because a UI rule is a suggestion — any script, migration or future
API path can bypass it. A CHECK constraint cannot be bypassed.

The admin translates the resulting error into plain instructions rather than
showing the constraint name.

### 2.2 `click_id` is the only bridge to revenue

`affiliate_clicks.id` is a UUID we generate and forward to the provider as
`sub_id`. When a conversion is reported, that value is the sole way to trace it
back to a page.

`affiliate_conversions.click_id` is **nullable on purpose**. Many networks never
return a sub-id, which makes a conversion real but unattributable. That fact has
to stay visible; filling it in with a guess would corrupt every per-page revenue
figure in the system.

### 2.3 No prices, ratings or availability are stored

`hotels` has no price column. `activities` has no rating. `flight_routes` has no
fare. Those belong to providers, change constantly, and are fetched live.

A schema with nowhere to put a fabricated number cannot accidentally publish one.

`deals.discount_label` is free text such as "up to 30% off" — an editor's claim,
never a computed figure.

### 2.4 Slug changes write redirects automatically

A trigger on `guides`, `deals`, `hotels`, `activities`, `countries` and `cities`
inserts a 301 into `redirects` whenever a **published** row's slug changes, and
re-targets any existing redirect that pointed at the old path so chains collapse
to a single hop.

Renaming a published URL without a redirect silently destroys accumulated
ranking. Enforcing it in the database means no code path can forget.

### 2.5 `page_views` is not partitioned — deliberately

The Phase 0 plan called for monthly partitioning from day one. That was revised
after thinking through the failure mode: a partitioned table needs a maintenance
job creating future partitions, and when that job stops, **inserts start
failing** once the last partition is passed. At current volume that risk far
exceeds the cost of a larger table.

BRIN indexes on `created_at` give cheap range scans on append-only, time-ordered
data at a fraction of a btree's size.

**Trigger point for revisiting:** roughly 10 million rows, or when a
`daily_stats` rollup exceeds a minute. Introduce partitioning together with a
`pg_cron` job that provisions partitions months ahead, and verify that job
before switching.

### 2.6 Dashboards read `daily_stats`

`rollup_daily_stats(date)` aggregates views and clicks nightly and is idempotent,
so a retry after a failed cron run is safe. The admin analytics screen currently
reads raw tables because volume is zero, and says so in a comment — that must
change before traffic is meaningful.

---

## 3. Row Level Security

RLS is enabled on all 28 policy-bearing tables.

| Role | Access |
|---|---|
| `anon` | SELECT on published, non-deleted editorial content only |
| `authenticated` | Per `profiles.role`: viewer reads, editor writes content, admin writes everything |
| `service_role` | Bypasses RLS. Used only by trusted server code: the redirector, webhooks, scheduled jobs, audit writes |

Closed to `anon` entirely: `tracking_sessions`, `affiliate_clicks`,
`affiliate_conversions`, `page_views`, `daily_stats`, `email_subscribers`,
`audit_log`, `profiles`.

Three details worth noting:

- **Expired deals stop being readable at the database.** The `ends_at` check
  lives in the RLS policy, so a stale cache cannot surface an ended offer.
- **`affiliate_providers.config` and `notes` are revoked from anon** at the
  column level. No credential is stored there regardless — they are environment
  variables — but internal configuration is not public information.
- **`audit_log` has no insert, update or delete policy for any role.** It is
  append-only, written exclusively by the service role.

### RLS helper functions

`is_admin()`, `is_editor()`, `is_staff()` and `current_role_level()` are
`SECURITY DEFINER` so a policy can read `profiles` without recursing into its own
RLS, and `STABLE` so Postgres evaluates them once per query rather than per row.

`EXECUTE` is revoked from `anon` (no anon policy references them) but
**retained for `authenticated`** — without it every staff policy would fail with
permission denied. They disclose only the caller's own role, which the caller
already knows. The Supabase linter flags this; it is intentional, and
`is_admin()` carries a comment saying so.

---

## 4. Search

Weighted `tsvector` generated columns on destinations, guides, hotels, activities
and deals (A = title, B = summary, C = body), with GIN indexes.

`search_content()` unions them and is **SECURITY INVOKER**, so RLS still applies:
an anonymous caller can only ever match published rows.

`suggest_places()` uses trigram similarity for typeahead, which tolerates the
misspellings full-text search misses entirely.

No external search service. At this corpus size Postgres comfortably outperforms
the operational cost of running one.

---

## 5. Extensions

`pgcrypto`, `citext`, `pg_trgm`, `unaccent` — all moved out of `public` into the
`extensions` schema, which is already on the role `search_path`. Extensions in
the API-exposed schema can shadow application objects.

---

## 6. Conventions

- UUID primary keys via `gen_random_uuid()`, except `page_views` and `audit_log`
  which use `bigserial` (append-only, never referenced by UUID).
- `created_at` / `updated_at` on every mutable table, with a trigger maintaining
  `updated_at` so application code cannot forget.
- **Soft delete** (`deleted_at`) on all editorial tables. Unique indexes are
  partial (`where deleted_at is null`) so a slug can be reused after deletion.
- Slugs use the `slug` domain: lowercase, hyphen-separated, 1–120 characters,
  validated by a CHECK.
- `JSONB` for provider-shaped payloads, validated by a Zod schema per provider.

---

## 7. Operations

**Migrations.** Apply in filename order. Every migration is forward-only; there
are no down migrations, because rolling a production schema backwards is more
dangerous than rolling forward with a corrective migration.

**Seed.** [`supabase/seed.sql`](../supabase/seed.sql) documents its own rules.
Reference geography and editorial copy are real; the two hotel rows are drafts
marked `[SAMPLE]`, so RLS keeps them off the public site.

**Backups.** Supabase provides automated backups and point-in-time recovery on
paid plans. The free tier has daily backups only. **A restore has not been
tested** — see [deployment.md](deployment.md).

**Type generation.** `src/types/database.ts` is generated from the live schema
and must be regenerated after every migration.
