# WanderMetric — Roadmap

Phases are sequential. Each ends at a review gate; none starts without approval.

**Legend:** ✅ complete · 🟡 current · ⬜ planned

---

## ✅ Phase 0 — Environment Audit

Read-only audit of the Hostinger environment. Full report: [`00-environment-audit.md`](00-environment-audit.md).

Findings that shaped everything after it:

- `wandermetric.com` is a **parked domain** — no vhost, no site, no SSL.
- Hostinger shared hosting offers **MySQL only**; PostgreSQL is VPS-only.
  → Resolved by choosing **Supabase** as the Postgres provider.
- The plan **does** run Next.js on Node 22 with SSR + ISR and git deploy (verified on two live sites).
- Shared hosting cannot run persistent workers → cron-triggered jobs.

---

## 🟡 Phase 1 — Foundation *(current)*

Project skeleton, tooling, and the architectural boundaries everything later depends on.

- [x] Next.js 16 + TypeScript strict + Tailwind v4
- [x] ESLint + Prettier + `npm run verify`
- [x] `src/core/` framework-free domain boundary
- [x] Affiliate and social provider interfaces (no implementations)
- [x] Supabase client / server / admin adapters
- [x] Lazily validated environment contract
- [x] SEO foundation — metadata builder, route builders, robots, sitemap
- [x] `/api/v1/health`
- [x] Baseline security headers
- [x] Documentation (README, architecture, roadmap)
- [ ] **GitHub repository created and pushed** — blocked, no credentials in this environment
- [ ] Supabase project created — deferred to Phase 2

---

## ⬜ Phase 2 — Database & Backend

1. Create the WanderMetric Supabase project (**not** the existing `top-tools-pick` project).
2. Full ERD review → **approval gate** → migrations.
3. Row Level Security policies on every table.
4. Repository layer over Supabase.
5. Seed geography (countries, cities).
6. `/api/v1` conventions: error envelope, pagination, OpenAPI generation.

**Gate:** the ERD is approved before any migration runs.

---

## ⬜ Phase 3 — Admin Dashboard

Supabase Auth + mandatory TOTP · roles · CRUD for every content entity · media library on Supabase Storage · SEO metadata editor · `audit_log`.

---

## ⬜ Phase 4 — Public Website

Destination, city and country pages · guides · itineraries · navigation · search · ISR · a Core Web Vitals budget enforced in CI.

---

## ⬜ Phase 5 — SEO System

`seo_metadata`-driven metadata · JSON-LD per content type · sitemap index · breadcrumbs · internal-link graph · redirects · **thin-content publish gate** · Search Console verification.

---

## ⬜ Phase 6 — Affiliate Integrations

`/go/[slug]` redirector · admin link manager · **Travelpayouts adapter first**, then one activities provider.

Each adapter begins with a documentation spike against the provider's live API — no endpoint is written from memory.

---

## ⬜ Phase 7 — Tracking & Attribution

Page views · click capture with `click_id` · conversion ingestion (webhook + scheduled pull) · consent management · monthly partitioning · nightly rollups into `daily_stats`.

Privacy: no raw IP storage, no cross-site fingerprinting, minimum viable data.

---

## ⬜ Phase 8 — Social Automation

Publishing queue with **human approval** · Pinterest capability spike against the live v5 API first · Trial-tier app · OAuth · scheduling · retries with backoff · then Standard-access review submission.

---

## ⬜ Phase 9 — Analytics

Admin dashboards from `daily_stats` · revenue by provider, page and vertical · content performance · EPC / RPM.

---

## ⬜ Phase 10 — Email & Lead Generation

Newsletter capture · double opt-in · segmentation · transactional and campaign sending via a reputable ESP.

---

## ⬜ Phase 11 — Launch & Optimization

Performance pass · accessibility audit · security review · load test · monitoring and alerting · **backup restore drill** · content velocity.

---

## ⬜ Phase 12 — Mobile Application

OpenAPI → generated client · token auth · offline caching · deep links · store release.

---

## ⬜ Phase 13 — Sponsored Listings

Deferred until traffic makes inventory sellable.
