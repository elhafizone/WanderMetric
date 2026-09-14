# WanderMetric — System Architecture

**Status:** Built and deployed to https://wandermetric.com.
**Last updated:** 2026-09-14

> This document describes the intended design. For what is actually built and
> what is blocked, see [roadmap.md](roadmap.md); for the deployed state, see
> [deployment.md](deployment.md).

---

## 1. Guiding principles

1. **API-first.** The website is a client of the backend, not its owner. A future Android/iOS app consumes the same `/api/v1` contract.
2. **Business logic is framework-free.** `src/core/` contains no React and no Next.js imports, so it can be tested, reused and eventually extracted.
3. **Providers are plugins.** Affiliate networks and social platforms sit behind interfaces. Adding or dropping one is an adapter file plus a database row.
4. **SEO is structural, not decorative.** Canonical URLs, metadata and sitemaps are generated from data, never hand-written per page.
5. **Editorial data and provider data stay separate.** What we write is ours and durable; what a provider returns is cached, attributed and expendable.

---

## 2. Layer map

```
┌──────────────────────────────────────────────────────────────┐
│  Clients                                                     │
│  Next.js web (Hostinger) · Future mobile app · Partners      │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTPS / JSON
┌──────────────────────────▼───────────────────────────────────┐
│  API layer — src/app/api/v1/*                                │
│  Auth · Zod validation · rate limiting · error envelope       │
└──────────────────────────┬───────────────────────────────────┘
┌──────────────────────────▼───────────────────────────────────┐
│  Domain layer — src/core/*      (framework-free TypeScript)   │
│  content · affiliate · tracking · social · seo · shared       │
└───────┬──────────────────────────────────────┬───────────────┘
        │                                      │
┌───────▼────────────────┐          ┌──────────▼───────────────┐
│  Infrastructure         │          │  Provider adapters       │
│  src/lib/supabase/*     │          │  affiliate/ · social/    │
└───────┬────────────────┘          └──────────┬───────────────┘
        │                                      │
┌───────▼────────────────┐          ┌──────────▼───────────────┐
│  Supabase               │          │  External APIs           │
│  Postgres · Auth ·      │          │  Travelpayouts · Viator  │
│  Storage · RLS          │          │  GetYourGuide · Pinterest│
└────────────────────────┘          └──────────────────────────┘
```

**Dependency rule:** arrows point inward. `src/core/` may not import from `src/app/` or from a specific provider. The API layer and adapters depend on the domain, never the reverse.

---

## 3. Frontend

- **Next.js App Router** with React Server Components as the default.
- **Rendering per page type:**

| Page type | Strategy | Reason |
|---|---|---|
| Destination / city | ISR, ~24h | Large volume, slow-changing, must be fast |
| Guides / itineraries | SSG + on-demand revalidate | Fully static, best CWV |
| Deals | ISR, short window | Time-sensitive |
| Search / filters | SSR or client | Not indexed |
| Admin | Client, `noindex` | Private |

- **Styling:** Tailwind v4 with CSS custom properties as tokens, so light/dark and future theming resolve in one place.
- **Client components are the exception.** Anything that can render on the server does.

---

## 4. Backend / server layer

Route Handlers under `src/app/api/v1/` are the only public entry point to domain logic. Every endpoint:

- validates input with **Zod** at the boundary;
- returns a consistent envelope — data on success, `{ code, message }` on failure, with HTTP status derived from `AppErrorCode`;
- is **versioned** (`v1` never breaks; new fields are additive);
- is authenticated by **bearer token** for API clients, separately from the cookie session used by the admin UI.

The domain layer returns `Result<T>` rather than throwing across its boundary, so every client handles failure identically.

---

## 5. Supabase

| Capability | Use |
|---|---|
| **PostgreSQL** | System of record for all editorial and tracking data |
| **Auth** | Admin accounts now; end-user accounts later (saved trips, alerts) |
| **Storage** | Images and media, served through `next/image` |
| **RLS** | Enabled on every table, always. Policies, never disabling |

Three clients, three trust levels:

| Adapter | Key | Trust |
|---|---|---|
| `lib/supabase/client.ts` | anon | Browser. RLS applies. |
| `lib/supabase/server.ts` | anon + session cookie | Acts as the signed-in user. |
| `lib/supabase/admin.ts` | service role | **Bypasses RLS.** Jobs, webhooks, authorized admin writes only. |

> The WanderMetric Supabase project is `vxhmtqhnjlkrdjruexmv` in `us-east-1`, entirely separate from the unrelated `top-tools-pick` project. See [database.md](database.md).

---

## 6. Data architecture

### 6.1 Internal (editorial) vs external (provider) data

This separation is deliberate and load-bearing.

| | Internal | External |
|---|---|---|
| Examples | Destinations, guides, itineraries, SEO metadata, curation | Hotel availability, flight prices, tour inventory |
| Source | Our admin dashboard | Travelpayouts, Viator, GetYourGuide, … |
| Ownership | Ours | Licensed, transient |
| Storage | Normalized Postgres tables | Cached snapshots + `JSONB` raw payload |
| Lifetime | Permanent, versioned | Expires; safe to discard and refetch |
| Indexed | Yes | Not directly |

Provider data is never the reason a page exists. A destination page exists because *we* wrote it; provider offers decorate it. If a provider disappears, the page survives.

### 6.2 Entities

All built except the social tables, which are planned only. See
[database.md](database.md) and [erd.md](erd.md) for the implemented schema.

**Geography & content**
`countries` · `regions` · `cities` · `destinations` · `guides` · `itineraries` (+ `itinerary_days`) · `activities` · `hotels` · `deals` · `categories` · `tags` · `content_tags` · `media`

**Affiliate**
`affiliate_providers` · `affiliate_programs` · `affiliate_links` · `affiliate_link_placements` · `affiliate_clicks` · `affiliate_conversions`

**Tracking**
`page_views` · `tracking_sessions` · `daily_stats`

**Social** — *interfaces only; no tables created*
`social_accounts` · `social_boards` · `social_posts` · `social_publish_log`

**SEO**
`seo_metadata` · `redirects` · `internal_links` *(table exists, unpopulated)*

**Admin**
`profiles` (extends `auth.users`, carries the role) · `audit_log` · `site_settings`

### 6.3 Major relationships

```
countries 1─n regions 1─n cities 1─n destinations 1─n guides
destinations 1─n activities | hotels | deals
affiliate_providers 1─n affiliate_programs 1─n affiliate_links
affiliate_links 1─n affiliate_clicks 1─n affiliate_conversions
affiliate_links n─n content        (via affiliate_link_placements)
content 1─1 seo_metadata
content 1─n social_posts n─1 social_accounts
```

### 6.4 Decisions as implemented

- `JSONB` for provider payloads, with a Zod schema per provider.
- `click_id` is a UUID **we** generate and forward as the provider's sub-id — the only reliable bridge back from a conversion postback.
- **Partitioning was reconsidered and dropped.** The original plan called for
  monthly partitions from the first migration. An unmaintained partition set
  fails inserts once it passes the last partition, which at current volume is a
  worse risk than table size. BRIN indexes cover the range scans; see
  [database.md](database.md) for the trigger point to revisit.
- Dashboards read `daily_stats`, never raw event tables. The admin analytics
  screen currently reads raw tables because volume is zero, and says so.
- Slug changes on published rows write a 301 automatically, via trigger.

---

## 7. Affiliate architecture

`src/core/affiliate/provider.ts` defines the contract; `registry.ts` resolves adapters by slug. Application code never imports a provider directly.

Capabilities are declared, not assumed — `search`, `conversionFeed`, `conversionWebhook` and `subIdTracking` are optional, so the UI degrades gracefully when a network lacks one.

**Click flow (Phase 6–7):**

```
<AffiliateLink linkSlug="paris-hotels" />
  → /go/paris-hotels?c=guide_123
  → generate click_id (UUID)
  → insert affiliate_clicks
  → provider.buildDeepLink({ clickId, … })
  → 302 to provider
  … later: webhook or fetchConversions() → match click_id → affiliate_conversions
```

No affiliate URL is ever hard-coded in a component.

---

## 8. SEO layer

`src/core/seo/` owns site identity, route builders and metadata construction.

- `site.ts` — name, description, canonical origin, **route builders**, disallowed paths. Changing a URL shape updates every link, sitemap entry and mobile deep link at once.
- `metadata.ts` — `buildMetadata()` returns canonical + Open Graph + Twitter tags from one input. In Phase 5 the input comes from `seo_metadata` rows.
- `app/robots.ts` / `app/sitemap.ts` — generated, not static files.

Planned: JSON-LD per content type (`TouristDestination`, `TouristAttraction`, `Hotel`, `Article`, `ItemList`, `FAQPage`, `BreadcrumbList`), sitemap index at 50k URLs, internal-link graph, and a **thin-content publish gate** that blocks programmatic pages lacking real substance.

---

## 9. Admin layer

Custom dashboard at `/admin` — no WordPress, no third-party CMS.

- Supabase Auth with mandatory TOTP for admin accounts.
- Role-based access (`users`, `roles`).
- CRUD for every content entity, plus media, SEO metadata and affiliate links.
- Every mutation writes to `audit_log`.
- `noindex` throughout.

---

## 10. Jobs and scheduling

Hostinger shared hosting cannot run persistent worker processes, so scheduled work is **cron → signed internal endpoint**:

| Job | Cadence |
|---|---|
| Social publish queue | every 5 min |
| Affiliate conversion sync | hourly |
| Deal expiry sweep | hourly |
| Analytics rollup → `daily_stats` | nightly |
| Sitemap regeneration | nightly |

Every endpoint is idempotent, guarded by `CRON_SECRET`, rate-limited and logged. If volume outgrows cron, the runner moves to a small VPS without changing the interface.

---

## 11. Social publishing

`src/core/social/provider.ts` defines the contract. Official platform APIs only.

Pinterest's developer policy forbids apps that let users auto-initiate actions without considering each one, and new apps start in a **Trial tier** where Pins are sandbox-only. The queue is therefore **human-in-the-loop** by design:

```
draft → pending_review → approved → scheduled → publishing → published | failed
```

A post reaches `approved` only through an admin decision. Failures are recorded with a reason and retried with exponential backoff up to a cap.

---

## 12. Future mobile app

The mobile app is a client of `/api/v1`, not a second backend.

- **Contract-first:** Zod schemas → OpenAPI spec → generated client.
- **Token auth** (short-lived access + rotating refresh). The app is a public client — no secrets ship in the binary.
- **Affiliate redirects are identical:** the app opens `/go/{slug}` in a Custom Tab / SFSafariViewController; attribution stays server-side.
- **Mobile-aware payloads:** pagination, sparse fieldsets, `ETag` support.

The only thing that makes this expensive is putting logic in components. That is why rule 2 in §1 exists.

---

## 13. Implemented in Phase 1

- Next.js 16 App Router, TypeScript strict, Tailwind v4, ESLint + Prettier
- `src/core/` boundary with `Result`/`AppError`, affiliate and social interfaces, provider registry
- `src/lib/env.ts` — lazily validated environment contract
- `src/lib/supabase/{client,server,admin}.ts` — three trust levels
- `src/core/seo/{site,metadata}.ts`, `app/robots.ts`, `app/sitemap.ts`
- `/api/v1/health` — versioned from the first endpoint
- Baseline security headers in `next.config.ts`

Everything else in this document is a plan.
