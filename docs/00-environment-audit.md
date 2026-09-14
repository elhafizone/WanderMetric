# WanderMetric — Phase 0: Environment Audit & Architecture Proposal

**Date:** 2026-09-14
**Status:** Awaiting approval — no implementation performed
**Audit method:** Hostinger API (authenticated, read-only) + external HTTP/DNS/TLS probing + vendor documentation research

> **Nothing was created, modified, or deleted.** Every call in this audit was read-only. No database was touched.

---

## ⚠️ Executive Summary — Three Starting Premises Are Incorrect

The brief states the project "already has" a configured domain, configured hosting, and a PostgreSQL database connected to the hosting environment. The audit contradicts all three.

| # | Premise in brief | Audit finding | Severity |
|---|---|---|---|
| 1 | Hosting configured for wandermetric.com | **Domain is PARKED.** No vhost, no website, no document root exists. | 🔴 Blocker |
| 2 | PostgreSQL database created & connected | **No PostgreSQL exists anywhere on the account.** All 26 databases are MySQL/3306. No VPS exists. | 🔴 Blocker |
| 3 | Domain fully configured | **No SSL.** HTTPS handshake to wandermetric.com fails outright. | 🔴 Blocker |

**The good news:** the *application* stack is validated. Hostinger's `hostinger_business_v3` plan runs **Next.js on Node 22 with full SSR + ISR and git auto-deploy** — proven on two live sites in this same account. The proposed Next.js + TypeScript direction is sound. **Only the database assumption breaks**, and it breaks hard.

**One decision is required before any code is written:** where PostgreSQL lives. See [Section C](#c-database-status) and [Decision Required](#decision-required).

---

## A. Current Environment

### A.1 Account & Plans

| Order ID | Plan | Account (username) | Status | Created |
|---|---|---|---|---|
| 1009038482 | `hostinger_business_v3` | `u706526056` | active | 2026-03-28 |
| 1008483034 | `hostinger_business_v3` | `u985238093` | active | 2025-12-30 |
| 1009561178 | `hostinger_premium_v3` | `u700730882` | active | 2026-06-22 |

**WanderMetric belongs to order `1009038482` / account `u706526056`.** The plan was purchased 2026-03-28T15:37:05Z — the exact second `wandermetric.com` was registered as the plan's free domain. This is the Business plan, and it is the one that already runs Node.js sites.

- **VPS instances: none.** `VPS_getVirtualMachinesV1` → `[]`. Everything is CloudLinux shared hosting.

### A.2 Domain

| Property | Value |
|---|---|
| Domain | `wandermetric.com` |
| Registration | Active, expires **2027-03-28** |
| Registry entries | Two records (id 30054637 `free_domain`, id 30054931 `domain`) — normal for a plan-bundled free domain |
| DNS A (`@`) | `2.57.91.91` (TTL 50) |
| DNS CNAME (`www`) | `wandermetric.com.` (TTL 300) |
| Nameservers | Hostinger DNS |

DNS is correctly delegated and resolving. That is the only part of the domain setup that is done.

### A.3 The Domain Is Parked — Not Hosted

`hosting_listWebsitesV1` returns **24 websites** across all three accounts. **`wandermetric.com` is not among them.** There is no vhost, no `public_html`, no document root.

Live probe confirms it:

```
GET http://wandermetric.com/          → 200 OK
Server: hcdn
<title>Parked Domain name on Hostinger DNS system</title>
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
```

The domain serves Hostinger's DNS-level parked placeholder, which is explicitly `noindex, nofollow`. Nothing of ours is deployed.

### A.4 SSL / HTTPS — Broken

```
https://wandermetric.com/  → HTTP 000 (connection failed, no TLS handshake)
http://wandermetric.com/   → HTTP 200 (parked page)
Port 443 on 2.57.91.91     → OPEN
Port 80  on 2.57.91.91     → OPEN
```

Port 443 accepts TCP, but the TLS handshake for SNI `wandermetric.com` fails — **no certificate has ever been issued for this domain.** This is expected: Hostinger issues the free Let's Encrypt certificate when a website/vhost is created, and no vhost exists.

For contrast, properly configured domains in the same account terminate TLS correctly (`https://toptoolspick.com/` → 200). So this is a provisioning gap, not a platform limitation.

### A.5 Runtime Capability — Validated ✅

This is the audit's most important positive finding. Node.js build settings from `toptoolspick.com` (same account, same plan):

```json
{
  "node_version": 22,
  "app_type": "next",
  "output_directory": ".next",
  "build_script": "build",
  "package_manager": "npm",
  "source_type": "git"
}
```

Build history: **7 builds, all `completed`**, each finishing in ~45 seconds.

Live response headers prove the runtime is a real Next.js server, not a static export:

| Site | Evidence |
|---|---|
| `toptoolspick.com` | `x-powered-by: Next.js`, `/_next/static`, HTTPS 200 |
| `hafizone.dev` | `x-nextjs-cache: HIT`, `x-nextjs-prerender: 1`, `x-nextjs-stale-time: 300` |

`x-nextjs-prerender` and `x-nextjs-cache` are emitted only by a running Next.js server performing **ISR (Incremental Static Regeneration)**. This confirms:

- ✅ Node.js 22
- ✅ Next.js App Router with SSR
- ✅ ISR / on-demand revalidation
- ✅ API routes (same server process)
- ✅ Git-based auto-deployment
- ✅ npm (pnpm not exposed via the platform build pipeline)
- ✅ Automatic HTTPS on configured domains
- ✅ CDN layer (`Server: hcdn`, HTTP/3 via `alt-svc`)

> Several third-party blog posts claim Hostinger shared hosting does not support Node.js. **That is outdated.** Direct API evidence and live traffic from this account disprove it.

### A.6 Databases — All MySQL

`hosting_listAccountDatabasesV1` for `u706526056`: **26 databases.**

| Property | Value (uniform across all 26) |
|---|---|
| Host | `srv2184.hstgr.io` |
| **Port** | **3306 (MySQL/MariaDB)** |
| Quota | 3072 MB each |
| Permission model | Full DDL+DML per dedicated user |

**Zero databases are assigned to `wandermetric.com`** (the `domain` field is `null` or another domain on every row). A `search=wander` query on the second account returned **0 results**.

**There is no PostgreSQL database on this account, connected or otherwise.**

### A.7 Cron & Background Jobs

- `hosting_listAccountCronJobsV1` → `[]` (none configured)
- Cron **is** supported via the platform API (create/list/delete endpoints exist)
- **Persistent background worker processes are not viable on shared hosting** — the app server manages HTTP request handlers, not long-lived workers

### A.8 Local Development Machine

| Tool | Status |
|---|---|
| Node.js | ✅ v24.19.0 |
| npm | ✅ 11.17.0 |
| pnpm | ✅ available |
| git | ✅ 2.55.0 |
| ssh | ✅ available |
| psql | ❌ not installed |
| Working directory | `C:\Users\dell\Desktop\WanderMetric` — **empty**, not a git repository |

### A.9 Secrets Handling During This Audit

`HOSTINGER_API_TOKEN` is present in the local environment (48 characters). **Its value was never printed and is not recorded anywhere in this report.** Database passwords were never requested or retrieved — the Hostinger API masks Node.js env var values as `********` by design, and the database endpoints do not return passwords.

---

## B. Hosting Compatibility

**Verdict: the Next.js + TypeScript half is validated. The PostgreSQL half is not available on this hosting.**

| Requirement | Hostinger shared (`business_v3`) | Verdict |
|---|---|---|
| Next.js + TypeScript | Native `app_type: next`, Node 22 | ✅ Proven |
| SSR / SSG / ISR | `x-nextjs-prerender` observed live | ✅ Proven |
| API routes | Same Node process | ✅ Proven |
| Git auto-deploy | `source_type: git`, ~45s builds | ✅ Proven |
| HTTPS | Auto Let's Encrypt on vhost creation | ✅ Available |
| CDN / HTTP3 | `hcdn` edge | ✅ Present |
| Cron jobs | Platform API | ✅ Available |
| **PostgreSQL** | **Not offered on shared or cloud plans** | ❌ **Blocked** |
| Persistent queue workers | Not supported by the process model | ❌ Blocked |
| Redis / managed cache | Not offered | ❌ Blocked |
| Object storage for uploads | Local disk only | ⚠️ Weak |

### Hostinger-specific constraints that will affect this project

1. **No PostgreSQL** — VPS-only at Hostinger. Decision required.
2. **No long-running workers** — social publishing, affiliate sync, and email sends cannot use an always-on queue consumer. They must be cron-triggered or externally scheduled.
3. **npm only** in the managed build pipeline — do not plan a pnpm-workspace monorepo that the platform builder cannot execute.
4. **Cold starts / process recycling** — shared Node processes may be recycled; never hold in-memory state as a source of truth.
5. **Connection limits** — a shared-hosting Node app opening a classic TCP pool to an external database will exhaust connections. Requires a pooled/serverless driver.
6. **Local disk is not durable deployment storage** — the build replaces the app directory. User-uploaded images must live in object storage.

---

## C. Database Status

### C.1 Findings

- **PostgreSQL: does not exist.** Not on shared hosting (unsupported by the platform), and no VPS exists where it could have been installed.
- **26 MySQL databases exist** on `u706526056`, all on `srv2184.hstgr.io:3306`.
- **None belong to WanderMetric.** They map to other projects (WordPress installs for `nexorasa.shop`, `onepress.news`, `azure-tarsier-…`, etc.) or are unassigned leftovers.
- **Nothing was inspected inside any database.** No table listing, no schema read, no connection attempt. Their contents and ownership remain unverified, and several are ambiguous (`domain: null`).

### C.2 Safety Assessment

**No existing database is safe to adopt, and none should be.** The unassigned MySQL databases have unknown ownership and unknown contents. WanderMetric must get a **brand-new, dedicated database**. None of the existing 26 will be modified, migrated, reset, or reused.

### C.3 Decision Required

PostgreSQL must come from somewhere. Four options:

| Option | Approach | Cost | Pros | Cons |
|---|---|---|---|---|
| **A — Managed serverless Postgres** *(recommended)* | Neon / Supabase; Next.js stays on Hostinger | Free tier → ~$19/mo | Real Postgres; HTTP/pooled driver solves the connection-limit problem; automatic backups & PITR; zero DB ops; scales independently | External vendor; cross-network latency (mitigable by region choice) |
| **B — Hostinger VPS** | Install Postgres yourself; move the app too | ~$5–12/mo | Everything in one vendor; enables real queue workers and Redis | You own patching, backups, tuning, security, uptime. Real ops burden. |
| **C — Use MySQL on Hostinger** | Abandon Postgres | £0 (included) | Zero new infra; already provisioned | Loses JSONB, native full-text/trigram search, partitioning, richer geospatial — all of which this project's SEO and analytics workloads actually want |
| **D — Hybrid** | Managed Postgres now, add a small VPS worker later | A + ~$5/mo | Best of both; staged | Two environments to manage |

**Recommendation: A now, evolving to D.** Managed Postgres removes the single hardest constraint (connection pooling from shared hosting) and gives real backups on day one. Add a tiny VPS worker only when social publishing volume justifies it.

**Why not C (MySQL):** the affiliate/tracking design leans on `JSONB` for heterogeneous provider payloads, and the SEO layer benefits from Postgres full-text search and `pg_trgm`. Switching to MySQL is survivable but degrades the two systems that matter most.

---

## D. Recommended Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Clients                                                 │
│  Next.js Web (Hostinger)  ·  Future Android  ·  Partners  │
└───────────────────────┬──────────────────────────────────┘
                        │ HTTPS / JSON
┌───────────────────────▼──────────────────────────────────┐
│  API Layer  —  /api/v1/*   (versioned, client-agnostic)  │
│  Auth · Validation (Zod) · Rate limiting · Serialization  │
└───────────────────────┬──────────────────────────────────┘
┌───────────────────────▼──────────────────────────────────┐
│  Domain / Service Layer  (pure TypeScript, framework-free)│
│  Content · Affiliate · Tracking · Social · SEO · Media    │
└───────┬───────────────────────────────────┬──────────────┘
        │                                   │
┌───────▼─────────┐              ┌──────────▼──────────────┐
│  Repositories   │              │  Provider Adapters      │
│  (Prisma)       │              │  Affiliate · Social      │
└───────┬─────────┘              └──────────┬──────────────┘
        │                                   │
┌───────▼─────────┐              ┌──────────▼──────────────┐
│  PostgreSQL     │              │  External APIs          │
│  (managed)      │              │  Travelpayouts, Viator,  │
└─────────────────┘              │  GYG, Pinterest, …       │
                                 └─────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│  Jobs: cron → signed internal endpoints → job runner      │
│  Storage: Cloudflare R2 / S3-compatible (images)          │
└──────────────────────────────────────────────────────────┘
```

**The non-negotiable rule:** the **Domain/Service layer is framework-free TypeScript**. Next.js pages and the future Android app are both just *clients* of the API. No business logic in React components. This is what makes Section I (Android) nearly free later.

### Proposed repository layout

```
wandermetric/
├── src/
│   ├── app/
│   │   ├── (public)/          # SEO pages — RSC + ISR
│   │   ├── admin/             # custom dashboard
│   │   ├── go/[slug]/         # affiliate redirector
│   │   └── api/v1/            # versioned public API
│   ├── core/                  # ← framework-free domain logic
│   │   ├── content/
│   │   ├── affiliate/
│   │   │   ├── provider.ts    # AffiliateProvider interface
│   │   │   └── providers/     # travelpayouts/ viator/ gyg/ …
│   │   ├── tracking/
│   │   ├── social/
│   │   │   └── providers/     # pinterest/ instagram/ …
│   │   └── seo/
│   ├── db/                    # Prisma client + repositories
│   └── lib/
├── prisma/schema.prisma
└── docs/
```

### Technology choices

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript strict | Validated on host; RSC + ISR ideal for SEO at scale |
| ORM | Prisma | Type-safe, first-class migrations, works with Neon pooling |
| Validation | Zod | One schema shared by API, forms, and provider payloads |
| Admin auth | Auth.js (credentials + TOTP) | Self-hosted, no vendor lock |
| Styling | Tailwind CSS | Small CSS payload helps CWV |
| Images | `next/image` + R2 | AVIF/WebP, correct sizing = LCP |
| Jobs | Cron → signed API routes | Only model the host supports |
| Testing | Vitest + Playwright | Domain unit tests + critical-path E2E |

---

## E. Recommended Database Model

### Core entities

**Geography & content**
- `countries` — iso2, iso3, name, slug, currency, region
- `regions` — country_id → optional intermediate level
- `cities` — country_id, region_id, name, slug, lat/lng, timezone, population
- `destinations` — polymorphic publishable page over a city/region/country; the SEO unit
- `guides` — long-form editorial; destination_id (nullable)
- `itineraries` — guide-like, with ordered `itinerary_days`
- `activities` — things to do; city_id
- `hotels` — city_id, star rating, geo, provider refs
- `deals` — time-boxed offers; valid_from/valid_until
- `categories`, `tags` + join tables (`content_tags`)
- `media` — R2 key, alt text, width/height, blurhash, credit/license

**Affiliate**
- `affiliate_providers` — slug, name, status, auth_type, config `JSONB`
- `affiliate_programs` — provider_id, vertical (flights/hotels/tours/cars), commission model, cookie window
- `affiliate_links` — program_id, destination_url, deep_link_template, default params `JSONB`, **slug** (drives `/go/[slug]`)
- `affiliate_link_placements` — polymorphic attribution: which link appears on which content
- `affiliate_clicks` — link_id, click_id (UUID), content ref, session_id, referrer, utm_*, country, device_type, is_bot, created_at
- `affiliate_conversions` — provider_id, external_id, click_id (nullable — many networks don't return it), amount, currency, status, occurred_at

**Tracking & analytics**
- `page_views` — path, content ref, session_id, referrer, utm_*, country, device_type, created_at *(partitioned monthly)*
- `sessions` — anonymous rotating id, first_seen, last_seen, country, device_type
- `daily_stats` — pre-aggregated rollups (the dashboard reads these, never raw tables)

**Social publishing**
- `social_accounts` — platform, external_account_id, encrypted tokens, scopes, expires_at
- `social_boards` — Pinterest boards / IG targets
- `social_posts` — content ref, platform, title, description, target_url, media_id, status, scheduled_at, published_at, external_post_id, attempts, last_error
- `social_publish_log` — append-only attempt history

**SEO**
- `seo_metadata` — polymorphic: title, description, canonical, og_*, twitter_*, robots directives, schema_type
- `redirects` — from_path, to_path, status_code
- `internal_links` — computed link graph for related-content blocks

**Admin**
- `users`, `roles`, `audit_log` (who changed what, when)

### Key relationships

```
countries 1─n regions 1─n cities 1─n destinations 1─n guides
destinations 1─n activities / hotels / deals
affiliate_providers 1─n affiliate_programs 1─n affiliate_links
affiliate_links 1─n affiliate_clicks 1─n affiliate_conversions
affiliate_links n─n content  (via affiliate_link_placements)
content 1─1 seo_metadata
content 1─n social_posts n─1 social_accounts
```

### Design notes

- **`JSONB` for provider-specific payloads** — each affiliate/social network returns a different shape. Normalize what is shared; keep the rest in `JSONB` with a Zod schema per provider.
- **`click_id` is a UUID we generate**, stored on the click and forwarded to the provider as a sub-id. This is the only reliable bridge back from a conversion postback.
- **Partition `page_views` and `affiliate_clicks` monthly** from day one. Retrofitting partitioning onto a large table is painful.
- **Never query raw event tables from the UI** — always read `daily_stats`.
- **Slugs are immutable once published.** Changing one writes a `redirects` row automatically.

*A full ERD with column types and indexes will be produced in Phase 2, before any migration runs.*

---

## F. Affiliate Integration Strategy

Providers are **plugins, not dependencies**. Every provider implements one interface; the application never imports a provider directly.

```ts
export interface AffiliateProvider {
  readonly slug: string;
  readonly verticals: Vertical[];          // flights | hotels | tours | cars
  readonly capabilities: ProviderCapabilities;

  buildDeepLink(input: DeepLinkInput): Promise<DeepLinkResult>;
  search?(query: SearchQuery): Promise<SearchResult[]>;      // optional
  fetchConversions?(range: DateRange): Promise<Conversion[]>; // optional
  verifyWebhook?(req: SignedRequest): Promise<boolean>;       // optional
}
```

Optional methods matter: not every network exposes search or a conversions feed. `capabilities` lets the UI degrade gracefully instead of crashing.

### Link flow — no hard-coded URLs anywhere

```
Component renders  →  <AffiliateLink linkSlug="paris-hotels-booking" />
                   →  href="/go/paris-hotels-booking?c=guide_123"
User clicks        →  /go/[slug] route handler
                   →  generate click_id (UUID)
                   →  record affiliate_clicks row
                   →  provider.buildDeepLink({ clickId, … })
                   →  302 redirect to provider URL
Conversion later   →  webhook OR scheduled fetchConversions()
                   →  match on click_id → affiliate_conversions
```

Affiliate URLs live in the **database**, never in JSX. Swapping a provider becomes a data change plus one adapter file — never a frontend rewrite.

### Provider landscape (verified September 2026)

| Provider | Verticals | Status |
|---|---|---|
| **Travelpayouts** | Flights, hotels, cars | Aggregator with a documented partner-links API, deep links, widgets, and data APIs. Strong Phase 6 starting point — one integration covers three verticals. |
| **Viator** | Tours & activities | Tiered API access (basic default; full / full+booking require approval & certification). ~8% base commission, up to ~30% at higher tiers, 30-day attribution. |
| **GetYourGuide** | Tours & activities | Comparable 8–30%. API has known quirks around product-option mapping and 2–5 min availability propagation. |
| **Booking / Expedia / Skyscanner / KAYAK** | Hotels, flights | Mostly gated behind individual partner approval, often with traffic-volume prerequisites. |

**Recommended sequence:** Travelpayouts first (broadest coverage, lowest barrier) → Viator or GetYourGuide for activities → premium direct programs once traffic justifies approval.

> ⚠️ **No endpoints, parameter names, or auth flows are specified in this report.** Each adapter's contract will be written against that provider's live documentation at implementation time, after credentials exist. Nothing will be invented or assumed.

---

## G. SEO Architecture

### URL structure

```
/destinations/{country}/{city}                  Paris
/destinations/{country}/{city}/things-to-do
/destinations/{country}/{city}/hotels
/destinations/{country}/{city}/best-time-to-visit
/guides/{slug}
/itineraries/{slug}
/deals/{slug}
/go/{slug}                                      affiliate redirect — noindex
```

Flat, readable, keyword-aligned, stable. Slugs never change silently; a change writes a 301 `redirects` row.

### Rendering strategy

| Page type | Strategy | Why |
|---|---|---|
| Destination / city | **ISR**, 24h revalidate | Proven working on host; fast + fresh |
| Guides / itineraries | **SSG** + on-demand revalidate on publish | Fully static, best CWV |
| Deals | **ISR**, short window | Time-sensitive |
| Search / filters | SSR or client | Not indexed |
| Admin | Client, `noindex` | Private |

### Technical SEO

- Metadata via Next.js Metadata API, populated from `seo_metadata` — never hard-coded
- Canonical URL on every indexable page
- Open Graph + Twitter/X cards; OG images generated at build or on demand
- **Schema.org JSON-LD**: `TouristDestination`, `TouristAttraction`, `Hotel`, `Article`, `ItemList`, `FAQPage`, `BreadcrumbList`
- Breadcrumbs, rendered *and* marked up
- Programmatic `sitemap.xml`, split at 50k URLs, with `sitemap-index.xml`
- `robots.txt` disallowing `/go/`, `/admin/`, `/api/`
- Internal linking from the `internal_links` graph, not manual
- Image SEO: descriptive filenames, real alt text (required field in admin), explicit dimensions, AVIF/WebP

### Quality guard against thin programmatic pages

This is the difference between a real travel business and a penalized content farm:

1. A destination page **cannot publish** until it meets a minimum-substance threshold (original body text, ≥N genuine entities, ≥1 licensed image, unique metadata).
2. **No template-spun text.** Programmatic pages assemble *real structured data* (attractions, seasons, prices), not paraphrased boilerplate.
3. Publish **depth-first, not breadth-first** — 200 genuinely useful city pages beat 20,000 stubs.
4. Admin surfaces a "thin content" report; unpublished drafts stay `noindex`.

---

## H. Social Automation Architecture

### Critical constraint discovered

Pinterest's developer policy states that apps **may not let end users automatically initiate actions without specifically considering each action**. Pinterest also runs two access tiers: **Trial** (approved apps create sandbox-only Pins visible to the creator, day-based rate limits) and **Standard** (fully visible content, finer per-minute/per-user limits), and promotion to Standard requires review **including a video recording of the app's OAuth flow**. Collecting credentials or session cookies instead of using OAuth is an explicit denial reason.

**Architectural consequence:** design a **human-in-the-loop scheduling queue**, not an autonomous poster. The admin reviews and approves each Pin (individually or as a reviewed batch); the system then executes on schedule. This is both policy-compliant and better for quality. Budget for Trial-tier sandbox behaviour during all of Phase 8 development.

### Design

```
social_accounts   OAuth 2.0 tokens, encrypted at rest, auto-refreshed
      │
social_posts      queue: draft → pending_review → approved → scheduled
      │                  → publishing → published | failed
      │
cron (every 5 min) → /api/internal/social/publish  (signed, secret-gated)
      │
SocialProvider adapter → official platform API
      │
social_publish_log     append-only attempts, exponential backoff, max attempts
```

```ts
export interface SocialProvider {
  readonly platform: 'pinterest' | 'instagram' | 'facebook' | 'x';
  readonly capabilities: SocialCapabilities;

  connect(code: string): Promise<SocialAccount>;
  refreshToken(account: SocialAccount): Promise<SocialAccount>;
  listTargets(account: SocialAccount): Promise<Target[]>;   // boards/pages
  publish(post: SocialPost): Promise<PublishResult>;
}
```

**Rules:** official APIs only. No browser automation, no scraping, no fake engagement, no credential collection. Tokens encrypted at rest and never logged. Every failure recorded with its reason and retried with backoff up to a cap, then surfaced to the admin.

**Pinterest is deliberately deferred to Phase 8** and begins with a capability spike against the live v5 documentation and a Trial-tier app — not with code.

---

## I. Future Android Compatibility

Android support is an **architectural property, not a later project** — provided the discipline in Section D holds.

1. **One API, many clients.** `/api/v1/*` is the only way to reach domain logic. The website is not privileged over the app.
2. **Business logic lives in `src/core/`**, framework-free. Nothing important happens inside a React component.
3. **Versioned + additive.** `v1` never breaks; new fields are optional.
4. **Token auth for the API** (short-lived access + refresh), separate from the browser session cookie used by the admin UI. Android is a public client — no secrets shipped in the APK.
5. **Contract-first.** Zod schemas → OpenAPI spec → generated Kotlin client. The spec is the shared source of truth.
6. **Affiliate redirects work identically** — the app opens `/go/{slug}` in a Custom Tab; attribution and compliance stay server-side, unchanged.
7. **Mobile-aware payloads** — pagination, sparse fieldsets, `ETag`/`If-None-Match` to respect mobile data.

If Phases 2–4 honour this, Android becomes "build a client against an existing documented API" rather than a backend rewrite.

---

## J. Deployment Architecture

### Target model

```
GitHub repo (main)
   │  push
   ▼
Hostinger git auto-deploy  →  npm ci  →  npm run build  →  .next
   │                                      (~45s, proven)
   ▼
Node 22 / Next.js server on u706526056   ← wandermetric.com vhost (TO BE CREATED)
   │
   ├── PostgreSQL  (managed, pooled connection)
   ├── Cloudflare R2  (images/uploads)
   └── Cron → signed internal endpoints  (jobs)
```

### Prerequisites — none of these exist yet

1. **Create the `wandermetric.com` website/vhost** on account `u706526056`. *This is the single blocking action.*
2. **Issue SSL** (automatic once the vhost exists); then force HTTPS + HSTS.
3. **Provision PostgreSQL** per the Section C decision.
4. **Initialize the git repository** — the working directory is currently empty and untracked.
5. **Set environment variables** through the Hostinger Node.js env API (values write-only; the API masks reads).
6. **Configure cron** for the job runner.

### Environments

| Env | Host | Database |
|---|---|---|
| Local | `localhost:3000` | Local Docker Postgres or a Neon dev branch |
| Staging | A `*.hostingersite.com` subdomain | Separate database/branch |
| Production | `wandermetric.com` | Production database |

Staging is not optional — it is where migrations are rehearsed before they touch production data.

### Jobs (given no persistent workers)

| Job | Cadence | Trigger |
|---|---|---|
| Social publish queue | every 5 min | cron → signed endpoint |
| Affiliate conversion sync | hourly | cron |
| Deal expiry sweep | hourly | cron |
| Analytics rollup → `daily_stats` | nightly | cron |
| Sitemap regeneration | nightly | cron |
| Database backup verification | daily | managed provider + alert |

Each endpoint is **idempotent**, guarded by a shared secret, rate-limited, and writes to a job log. If volume outgrows cron, move the runner to a small VPS — the interface does not change.

### Operations

- **Logging:** structured JSON; ship to an external sink (shared hosting log retention is not dependable)
- **Monitoring:** external uptime check on `/` and `/api/health`; alert on failed builds
- **Backups:** managed Postgres PITR + periodic off-site dump. **Restores must be tested, not assumed.**
- **Rollback:** redeploy the previous commit; migrations must be backward-compatible for one release

---

## K. Security Risks

### Must be resolved before development starts

| # | Risk | Action |
|---|---|---|
| K1 | **No HTTPS on the domain** | Create vhost → issue certificate → force HTTPS + HSTS. No traffic before this. |
| K2 | **`HOSTINGER_API_TOKEN` in the shell environment** | This token can create, modify, and **delete** websites, databases, and DNS across **all three hosting accounts and 24 live websites**. Scope it down if Hostinger permits, rotate it on any suspicion, and never place it in the repo or in the deployed app's env. |
| K3 | **No git repository yet** | Initialize with `.gitignore` covering `.env*` **before** the first commit. A leaked secret in git history is effectively permanent. |
| K4 | **26 unaudited MySQL databases**, several unassigned | Do not touch. WanderMetric gets a new dedicated database. Ownership of the orphans should be established separately. |

### To be built in

| Area | Approach |
|---|---|
| Secrets | Platform env vars only; `.env.example` documents *names* with no values; never logged |
| Admin auth | Auth.js, argon2id hashing, mandatory TOTP 2FA, short sessions, lockout on repeated failure |
| API auth | Short-lived bearer access tokens + rotating refresh tokens; no long-lived API keys in mobile clients |
| Sessions | httpOnly + Secure + SameSite=Lax cookies; server-side invalidation |
| CSRF | Required on all cookie-authenticated mutations (token-auth API routes are exempt by design) |
| Rate limiting | On `/api/*`, `/go/*`, login, and every job endpoint |
| Input validation | Zod at every boundary — HTTP, provider responses, webhooks. Never trust a provider payload. |
| SQL injection | Prisma parameterized queries; raw SQL only with bound parameters, reviewed |
| XSS | React auto-escaping; sanitize any admin rich-text server-side with an allowlist |
| Secure headers | CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` |
| File uploads | Validate magic bytes not extensions, cap size, re-encode images, store off-origin in R2, never execute |
| Open redirect | `/go/[slug]` resolves **only** to a database-stored URL — never to a user-supplied `?url=` |
| Social tokens | Encrypted at rest (envelope encryption), auto-refreshed, redacted from all logs |
| Audit | `audit_log` for every admin mutation |
| Privacy | See below |

### Privacy & compliance (tracking)

Collect the **minimum** needed to attribute revenue:

- ✅ Anonymous rotating session id, page path, referrer, UTM params, country (coarse), device type, timestamp
- ❌ No raw IP storage — derive country, then discard. No cross-site fingerprinting. No PII without explicit consent.
- Consent banner gating non-essential analytics (GDPR/ePrivacy); affiliate click attribution is a legitimate-interest call that should be documented
- Retention policy: raw events aged out (e.g. 90 days) once rolled into `daily_stats`
- Affiliate disclosure on every page carrying affiliate links — an **FTC/ASA legal requirement**, not a nicety

---

## L. Development Roadmap

Revised from the brief's draft, reordered around what the audit actually found.

### Phase 0 — Environment Audit ✅ *complete (this document)*

### Phase 0.5 — Provisioning & Unblocking 🔴 *new — blocks everything*
Create the `wandermetric.com` vhost · issue SSL + force HTTPS · **decide and provision PostgreSQL** · initialize git with a correct `.gitignore` · scope/rotate the Hostinger token · set up staging.
*Nothing below can start until this is done.*

### Phase 1 — Foundation
Next.js 15 + TypeScript (strict) · Tailwind · ESLint/Prettier · Vitest + Playwright · `src/core/` boundaries enforced by lint rules · health endpoint · **first deploy to Hostinger to validate the pipeline end-to-end on our own code.**

### Phase 2 — Database & Backend
Full ERD review → **approval gate** → Prisma schema · migrations · repositories · seed data (countries/cities) · `/api/v1` skeleton with Zod validation, error envelope, and OpenAPI generation from day one.

### Phase 3 — Admin Dashboard
Auth.js + TOTP · RBAC · CRUD for destinations/guides/activities/hotels/deals · media library on R2 · SEO metadata editor · audit log.

### Phase 4 — Public Website
Destination/city/country pages · guides · itineraries · ISR · navigation · search · Core Web Vitals budget enforced in CI.

### Phase 5 — SEO System
`seo_metadata` wiring · JSON-LD per type · sitemap index · robots · breadcrumbs · internal-link graph · redirects · **thin-content publish gate** · Search Console verification.

### Phase 6 — Affiliate Integrations
`AffiliateProvider` interface · `/go/[slug]` redirector · admin link manager · **Travelpayouts adapter first** · then one activities provider. *Each adapter preceded by a documentation spike.*

### Phase 7 — Tracking & Attribution
Page views · click capture with `click_id` · conversion ingestion (webhook + scheduled fetch) · consent management · partitioning · nightly rollups.

### Phase 8 — Social Automation
`SocialProvider` interface · publishing queue with **human approval** · Pinterest **capability spike against live v5 docs first** · Trial-tier app · OAuth flow · scheduling · retries · then Standard-access review submission.

### Phase 9 — Analytics
Admin dashboards from `daily_stats` · revenue by provider/page/vertical · content performance · EPC/RPM.

### Phase 10 — Email & Lead Generation
*(promoted from "future" — it compounds with SEO and should not wait)*
Newsletter capture · double opt-in · segmentation · transactional + campaign sending via a reputable ESP.

### Phase 11 — Launch & Optimization
Performance pass · accessibility audit · security review · load test · monitoring/alerting · backup **restore drill** · content velocity.

### Phase 12 — Android Application
OpenAPI → Kotlin client · token auth · offline caching · deep links · Play Store release.

### Phase 13 — Sponsored Listings
*(deferred — requires traffic to be sellable)*

---

## Decision Required

Implementation is blocked on **one** choice:

> ### Where does PostgreSQL live?
>
> - **A — Managed serverless Postgres** (Neon/Supabase), app stays on Hostinger ← **recommended**
> - **B — Hostinger VPS** (Postgres + app together, full ops ownership)
> - **C — Use the MySQL already available** (abandon Postgres)
> - **D — A now, add a small VPS worker later**

Three secondary confirmations:

1. **Create the `wandermetric.com` vhost** on account `u706526056` — approved?
2. **Hostinger API token** — should it be scoped down or rotated before we proceed?
3. **Travelpayouts first** for Phase 6 — agreed, or is another provider already signed up?

**On approval, Phase 0.5 begins. No code will be written before then.**

---

## Appendix — Audit Evidence

| Check | Method | Result |
|---|---|---|
| Domain registered | `domains_getDomainListV1` | ✅ active, exp. 2027-03-28 |
| DNS | `DNS_getDNSRecordsV1` + `nslookup` | A → 2.57.91.91, www CNAME |
| Website/vhost exists | `hosting_listWebsitesV1` (24 results) | ❌ **absent** |
| Live content | `curl http://wandermetric.com/` | Parked page, `noindex` |
| HTTPS | `curl https://…` + `openssl s_client` | ❌ **handshake fails** |
| Ports | TCP 80 / 443 to 2.57.91.91 | Both open |
| VPS | `VPS_getVirtualMachinesV1` | `[]` — none |
| Plans | `hosting_listOrdersV1` | 3 active orders |
| Databases | `hosting_listAccountDatabasesV1` | 26, **all MySQL:3306**, none for WanderMetric |
| PostgreSQL | API + vendor docs | ❌ **VPS-only at Hostinger** |
| Node/Next support | `hosting_getNode_jsBuildSettingsV1` | ✅ Node 22, `app_type: next`, git |
| Build reliability | `hosting_listNodeJSBuildsV1` | 7/7 completed, ~45s |
| SSR/ISR | Live response headers | ✅ `x-nextjs-prerender`, `x-nextjs-cache` |
| Cron | `hosting_listAccountCronJobsV1` | Supported; none configured |
| Local tooling | shell | Node 24.19, npm 11.17, git 2.55; no psql |

**Destructive operations performed: none.** No database was connected to, read, or altered.

### Sources

- [Hostinger PostgreSQL hosting review](https://hostadvice.com/hosting-company/hostinger-reviews/hostinger-postgresql-hosting-review/)
- [Does Hostinger Support PostgreSQL?](https://webhostingadvices.com/does-hostinger-support-postgresql/)
- [Pinterest API 2026: developer documentation](https://zernio.com/blog/pinterest-api)
- [Pinterest API — per-action authenticity rule](https://vorplabs.com/agent-tools/pinterest-api)
- [How to post Pins via the Pinterest API](https://www.postpeer.dev/blog/how-to-post-on-pinterest-with-api)
- [Travelpayouts — API and data](https://support.travelpayouts.com/hc/en-us/categories/200358578-API-and-data)
- [Travelpayouts — API for partner links](https://support.travelpayouts.com/hc/en-us/articles/25289759198226-API-for-Travelpayouts-partner-links)
- [Viator vs GetYourGuide affiliate teardown](https://track360.io/blog/viator-getyourguide-affiliate-programs-operator-teardown-2026)
- [GetYourGuide vs Viator Partner API comparison](https://toolrelief.com/compare/getyourguide-vs-viator-partner-api/)
