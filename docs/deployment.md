# Deployment

**Live: https://wandermetric.com** — Hostinger shared hosting, Node.js 22,
Next.js server with SSR and ISR.

---

## Environment

| | |
|---|---|
| Host | Hostinger `hostinger_business_v3`, order `1009038482` |
| Account | `u706526056` |
| Server | `srv2184.hstgr.io` → `us-bos-web2184.hstgr.io` (**Boston, US East**) |
| Document root | `/home/u706526056/domains/wandermetric.com/public_html` |
| Runtime | Node.js 22, npm |
| Edge | Hostinger CDN (`hcdn`), HTTP/3 |
| SSL | Let's Encrypt, auto-issued, HTTP 301 → HTTPS |
| Database | Supabase `vxhmtqhnjlkrdjruexmv`, `us-east-1` |

**Why the database is in us-east-1.** The origin server is in Boston. With
SSR/ISR the latency that matters is app ↔ database, not visitor ↔ database —
visitors are served by the CDN edge. us-east-1 (Ashburn) is ~10–15 ms from
Boston; the European region used by an unrelated project would have been ~80–100
ms transatlantic **per query**, paid repeatedly on every render. International
reach is a CDN concern, which `hcdn` already handles.

The `2.57.91.91` address the domain resolves to is an anycast CDN edge and
geolocates misleadingly (Larnaca). The origin is what matters.

---

## Deploy procedure

Hostinger builds from an uploaded source archive. `node_modules` and `.next` are
never shipped — the platform runs the install and build, so a broken build fails
visibly instead of being masked by stale local output.

```bash
# 1. Build the source archive from committed state, so the deploy is traceable
#    to an exact commit.
git archive --format=zip -o /tmp/wandermetric.zip HEAD

# 2. Obtain upload credentials (Hostinger API: Generate Upload URL)
#    Returns url, auth_key, rest_auth_key.

# 3. Upload over TUS 1.0.0 to {url}/wandermetric.zip?override=true
#    POST to create (expect 201), PATCH the bytes (expect 204).

# 4. Start the build (Hostinger API: Start Node.js build)
#    node_version 22, app_type next, root_directory ".",
#    output_directory ".next", build_script "build", package_manager npm,
#    source_type archive, source_options.archive_path "wandermetric.zip"

# 5. Poll the builds endpoint until state is "completed" (~75 s).
```

**The build overwrites the website's contents and cannot be undone.** Verify the
archive first — particularly that it contains no `.env` file and no
`node_modules`.

### Environment variables

Set through the Hostinger Node.js env API. The API returns values masked as
`********`, so the full desired set must always be sent with real values; it is a
**full replace** and any omitted variable is deleted.

`NEXT_PUBLIC_*` values are baked in at build time, so **changing one requires a
fresh build**, not just a restart.

Currently set in production:

```
NEXT_PUBLIC_SITE_URL=https://wandermetric.com
NEXT_PUBLIC_SUPABASE_URL=https://vxhmtqhnjlkrdjruexmv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_…
```

---

## What is degraded in production, and why

Two paths return an honest error rather than pretending to work:

| Path | Status | Cause |
|---|---|---|
| `/go/[slug]` | 404 | Needs `SUPABASE_SERVICE_ROLE_KEY`, **and** `TRAVELPAYOUTS_MARKER` |
| `/api/v1/subscribe` | 503 `NOT_CONFIGURED` | Needs `SUPABASE_SERVICE_ROLE_KEY` |
| Admin audit logging | Silently skipped | Needs `SUPABASE_SERVICE_ROLE_KEY` |

The service-role key is **not retrievable through the Supabase integration by
design** — it only exposes publishable keys. It must be copied from the Supabase
dashboard (Project Settings → API) and added to the Hostinger environment, then
the site rebuilt.

Everything else — every public page, search, the API, SEO output, admin sign-in
and CRUD — works on the deployed build.

---

## Platform constraints

These shaped the architecture and remain true:

1. **No persistent worker processes.** Scheduled work must be cron → signed
   internal endpoint. An always-on queue consumer is not viable here.
2. **npm only** in the managed build pipeline.
3. **Process recycling.** Never treat in-memory state as a source of truth —
   this is exactly why `src/lib/rate-limit.ts` documents its own limits.
4. **Local disk is not durable.** Each build replaces the app directory, so
   uploads must live in Supabase Storage.
5. **No Redis**, no managed cache.
6. **PostgreSQL is not offered** on shared hosting, which is why Supabase hosts
   the database.

---

## Scheduled jobs — not yet configured

Cron is available through the Hostinger API but **nothing is scheduled yet**,
because the jobs that need it are not implemented:

| Job | Cadence | Blocked on |
|---|---|---|
| `rollup_daily_stats` | nightly | Nothing — ready to schedule |
| Affiliate conversion sync | hourly | Travelpayouts statistics API not verified |
| Deal expiry sweep | hourly | Not needed — RLS hides expired deals at query time |
| Sitemap regeneration | nightly | Not needed — generated on demand with ISR |

Each endpoint must be idempotent and guarded by `CRON_SECRET`.

---

## Rollback

Re-upload the archive from the previous commit and rebuild:

```bash
git archive --format=zip -o /tmp/rollback.zip <previous-sha>
```

Database migrations are **forward-only**. Rolling a production schema backwards
is more dangerous than rolling forward with a corrective migration, so there are
no down migrations.

---

## Monitoring

`GET /api/v1/health` returns 200 when Supabase answers and **503 when it does
not**, so an uptime check on that path detects a database outage rather than
just a web-server one. It performs a real round trip, not a variable-presence
check.

Logs are single-line JSON with credential-shaped keys redacted before
serialization. **Shared-hosting log retention is not dependable** — ship them to
an external sink before relying on them.

---

## Open items

- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` and rebuild
- [ ] Add `TRAVELPAYOUTS_MARKER` to activate affiliate redirects
- [ ] Schedule the nightly `rollup_daily_stats` cron
- [ ] Ship logs to an external sink
- [ ] External uptime check on `/api/v1/health`
- [ ] **Perform and document a database restore drill** — an untested backup is
      a hypothesis, not a backup
- [ ] Add a Content-Security-Policy, report-only first
