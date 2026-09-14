# Roadmap

**Legend:** ✅ done · 🟡 partial, blocked on configuration · ⬜ planned

---

## ✅ Phase 0 — Environment audit

[Full report](00-environment-audit.md). Found that `wandermetric.com` was parked
with no vhost and no SSL, and that Hostinger shared hosting offers MySQL only —
which is why Supabase hosts the database. Also confirmed the plan genuinely runs
Next.js with SSR and ISR.

## ✅ Phase 1 — Foundation

Next.js 16, TypeScript strict, Tailwind v4, the `src/core/` boundary, Supabase
adapters, lazily validated environment contract, SEO foundation, `/api/v1/health`.

## ✅ Phase 2 — Database

31 tables, 11 migrations, four separated concerns. Thin-content publish gates,
automatic 301s on slug change, weighted full-text search, BRIN-indexed event
tables. See [database.md](database.md).

## ✅ Phase 3 — Security

RLS on all 28 policy-bearing tables. Extensions moved out of `public`. Anon
execute revoked on RLS helpers. Supabase advisors reduced to four intentional
warnings. See [security.md](security.md).

## ✅ Phase 4 — API

20 endpoints under `/api/v1` behind one response envelope, Zod-validated,
versioned from the first endpoint so a mobile client never special-cases a route.

## ✅ Phase 5 — Admin dashboard

Config-driven CRUD for eight entities, role-based access enforced by RLS, soft
deletes, append-only audit log, constraint errors translated into instructions a
writer can act on.

## ✅ Phase 6 — Public website

Home, destinations, guides, hotels, activities, tours, flights, deals, search and
legal pages. ISR throughout; three client components on the entire public site.

## 🟡 Phase 7 — Travelpayouts

Adapter implemented and tested against the verified API. **Dormant until
`TRAVELPAYOUTS_MARKER` is set.** `fetchConversions` deliberately absent — the
statistics API was not verified. See [travelpayouts.md](travelpayouts.md).

## 🟡 Phase 8 — Affiliate links

`/go/[slug]` implemented: server 302, click recorded first, bots excluded,
uncacheable, open redirect structurally impossible. **Returns 404 until the
service-role key and a provider marker are configured** — refusing beats
redirecting without attribution.

## 🟡 Phase 9 — Tracking

Click and page-view capture, anonymous sessions, `daily_stats` rollup function.
**Conversion ingestion not built** — no verified provider callback exists, so the
table is honestly empty.

## ✅ Phase 10 — SEO

Canonicals, Open Graph, per-type JSON-LD, database-driven sitemap, automatic
redirects, noindex on search, thin-content gate. No fabricated rating or price
markup anywhere. See [seo.md](seo.md).

## ✅ Phase 11 — Search

Postgres full-text with weighted tsvector plus trigram typeahead. No external
search service — at this corpus size it would cost more to operate than it saves.

## ✅ Phase 12 — Content system

Draft/review/published workflow, slug management, SEO metadata, authorship,
soft delete.

## 🟡 Phase 13 — Media

Schema, admin list and `next/image` pipeline done. Alt text mandatory by
constraint. **Upload needs a Storage bucket and the service-role key.**

## 🟡 Phase 14 — Email

Double opt-in schema and endpoint done. **No ESP configured**, so subscribers
stay `pending` and nothing is sent. Sending from an unverified domain would
poison deliverability from day one.

## ✅ Phase 15 — Performance

Server Components by default, ISR, narrow card queries, concurrent fetches,
`next/image` with explicit sizes, reduced-motion respected.

## ✅ Phase 16 — Security audit

See [security.md](security.md), including the weaknesses that are documented
rather than hidden: in-process rate limiting, no CSP yet, no admin MFA yet.

## ✅ Phase 17 — Responsive UI

Mobile-first, no-JavaScript navigation, semantic landmarks, visible focus,
labelled controls, light and dark themes.

## ✅ Phase 18 — Seed data

Real reference geography and factual editorial copy. No invented hotel business
is published — the two hotel rows are `[SAMPLE]` drafts that RLS keeps off the
public site.

## ✅ Phase 19 — Errors and observability

Error boundaries, structured JSON logs with credential redaction, a health
endpoint that performs a real round trip and returns 503 when the database is
unreachable.

## ✅ Phase 20 — Documentation

Nine documents recording decisions, including the ones that were revised.

## ✅ Phase 21 — Tests

45 Vitest tests over the framework-free domain layer.

## ✅ Phase 22 — Production build

lint, typecheck, test and build all clean. No suppressed rules, no ignored
errors.

## ✅ Phase 23 — Deployment

Live at https://wandermetric.com with Let's Encrypt SSL. See
[deployment.md](deployment.md).

## ✅ Phase 24 — Production verification

All routes verified live: status codes, titles, canonicals, JSON-LD, robots,
sitemap, API, security headers, admin gating, 404.

---

## Next

**Immediate, unblocks three features:**
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to the Hostinger environment and rebuild
- [ ] Add `TRAVELPAYOUTS_MARKER` to activate affiliate redirects

**Before meaningful traffic:**
- [ ] Enable MFA on admin accounts
- [ ] Add a Content-Security-Policy, report-only first
- [ ] Database restore drill
- [ ] External uptime check on `/api/v1/health`
- [ ] Schedule the nightly `rollup_daily_stats` cron

**Then:**
- [ ] Verify the Travelpayouts statistics API and implement conversion ingestion
- [ ] Real photography and OG images
- [ ] ESP integration for the newsletter
- [ ] Social publishing (Pinterest first — human-in-the-loop by policy)
- [ ] Internal-link graph
- [ ] Mobile app: OpenAPI → generated client against the existing `/api/v1`
