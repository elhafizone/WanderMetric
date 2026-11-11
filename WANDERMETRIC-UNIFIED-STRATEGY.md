# WANDERMETRIC — UNIFIED STRATEGY

**Version:** 1.0  
**Date:** 2026-10-20  
**Status:** Planning document — no code changes authorised by this document  
**Sources:** WANDERMETRIC-ARCHITECTURE-AUDIT.md, WANDERMETRIC-TRAVELPAYOUTS-CAPABILITY-AUDIT.md, full codebase inspection (October 2026)

---

## 1. Executive Summary

WanderMetric is a travel discovery and affiliate platform built on Next.js 16.4 / React 19 / Supabase. Its core value proposition is research-backed offer pages — hand-authored content about travel products — linked to affiliate programmes through Travelpayouts.

**The platform is structurally complete and deployable.** The application code, database schema, affiliate redirector, tracking pipeline, ISR rendering, and admin dashboard are all implemented. The binding constraint on revenue and growth is not missing technology — it is content volume and affiliate activation.

**Critical path to first revenue:**
1. Set `SUPABASE_SERVICE_ROLE_KEY` + `TRAVELPAYOUTS_MARKER` + `TRAVELPAYOUTS_PROJECT_ID` + `TRAVELPAYOUTS_API_TOKEN` in Hostinger env and rebuild.
2. Publish offer pages across the 10 sections.
3. Verify at least one affiliate click flows to a confirmed commission.

Everything else in this document is sequenced after those three steps.

**What Travelpayouts is (verified):** an attribution network. It reaches 25 active programmes (Booking.com, Viator, GetYourGuide, Airalo, Klook, Tiqets, and others) via a single partner-links API. It is not a product catalogue API. The Data API and Data Files features exist but are gated per-programme and currently unavailable for any programme in this account. Content must be authored by hand.

---

## 2. Verified Current-State Findings

### 2.1 What Is Built and Working

| Component | Status | Evidence |
|---|---|---|
| `offers` table + publish gate | Implemented | Migration 0016; 800-char + facts + source_url + active link constraint |
| `/go/[slug]` affiliate redirector | Implemented, awaiting env vars | `src/app/go/[slug]/route.ts`; returns 404 until `SUPABASE_SERVICE_ROLE_KEY` + `TRAVELPAYOUTS_MARKER` set |
| Travelpayouts partner-links adapter | Implemented, dormant | `docs/travelpayouts.md`; `TRAVELPAYOUTS_MARKER` must be set |
| Click tracking (affiliate_clicks) | Implemented | Click recorded before redirect; SubID = click UUID → passed to partner |
| SubID round-trip | Confirmed working | Travelpayouts Performance report shows "Group by SubID" column |
| 10 public section pages | Implemented | `src/core/sections/sections.ts`; 4 partner-linked, 6 without booking partner |
| Section-country and offer detail pages | Implemented | ISR `revalidate=3600`; noindex < 3 offers |
| Compare pages | Implemented | Car-hire only populated (`src/core/affiliate/compare.ts`; READ_ON 2026-10-08) |
| Country hub pages | Implemented | `/countries/[country]`; noindex < 3 offers |
| Admin dashboard | Implemented | Phases 5–6 done per roadmap |
| Import pipeline | Implemented | `scripts/import-offers.mjs`; reads `content/offers/<programme>/<slug>.json` |
| News system | Implemented, untested | `src/app/(public)/news/`, `src/core/news/`, `tests/news.test.ts`; 0 articles |
| Newsletter double opt-in | Implemented, no ESP | `POST /api/v1/subscribe`; rows stay pending until ESP is configured |
| Security headers | Implemented | `next.config.ts`; nosniff, SAMEORIGIN, strict-origin; no CSP yet |

### 2.2 What Is Partially Built

| Component | Gap | Next Step |
|---|---|---|
| Conversion tracking | `affiliate_conversions` table exists, no ingestion | Verify Travelpayouts statistics API (see Open Questions) |
| Media library | Schema and admin done | Requires Supabase Storage bucket + service-role key |
| Newsletter delivery | Subscribers stored as `pending` | Integrate ESP (Resend, Postmark, etc.) |
| Compare pages | Only `car-hire` section populated | Author comparison data for 5 remaining COMPARE_SECTIONS |
| `affiliate_offers` table | Schema exists | Populated only by real provider responses — no provider currently supplies data |

### 2.3 What Is Known to Be Missing

| Item | Detail |
|---|---|
| GigSky partner entry | ID 636, 20% commission, SIM-cards section. Not in `src/core/affiliate/partners.ts`. No affiliate link in DB (assumed). |
| KKday compare data | KKday is in `PARTNERS["things-to-do"]` but has no compare-table entry. |
| Hotellook programme status | Appeared in Performance report filter; absent from My Programs. Status unresolved. |
| Travelpayouts statistics API | Used in `docs/travelpayouts.md` as not verified. Conversion ingestion cannot be built until this is confirmed. |
| Content-Security-Policy | Deferred pending known script/style/image origins. |
| MFA on admin accounts | Listed in roadmap "before meaningful traffic." |
| Nightly `rollup_daily_stats` cron | Listed in roadmap. Daily performance data will not aggregate without it. |
| External uptime monitor | Listed in roadmap. |

### 2.4 Travelpayouts Platform Reality

**Travelpayouts is an attribution network, not a product catalogue.** This is the single most important strategic fact.

| Capability | Verified Status |
|---|---|
| Partner Links API (`POST /links/v1/create`) | Verified — creates tracked deep links from any URL |
| SubID attribution via click UUID | Verified — confirmed in Performance report |
| Data API | Exists, gated per-programme, NOT enabled for any programme in this account |
| Data Files (CSV/JSON) | Exists, gated per-programme, NOT enabled for any programme in this account |
| 42 embeddable widgets across 17 programmes | Verified — 2 pages in dashboard; include search forms and live product-display types |
| Promo codes | 3 active codes visible in account |
| White Label (flights+hotels metasearch) | Not set up |
| Drive (blog monetisation AI) | Not connected; not relevant to offer-page architecture |
| Statistics / Conversion API | Not verified — open question |

**Consequence:** The content pipeline is the binding constraint on scale. Product data cannot be pulled from Travelpayouts for any programme currently. Every offer page requires human authorship against the partner's own listing (verified facts, source URL, affiliate URL). The `affiliate_offers` table and `affiliate_offers_cache` concept in the schema remain empty until a per-programme Data API request is approved and the API schema verified.

---

## 3. Business Model and Revenue Architecture

### 3.1 Revenue Mechanism

```
Reader visits /{section}/{country}/{slug}
  → Clicks CTA → /go/{slug}
  → affiliate_clicks row created (click_id = UUID)
  → 302 redirect to partner via Travelpayouts partner-links API
    → sub_id = click_id (no hyphens)
  → Reader completes booking on partner site
  → Partner reports conversion to Travelpayouts
  → Travelpayouts returns conversion with sub_id
  → affiliate_conversions row links conversion to click
  → daily_stats rollup aggregates revenue
```

### 3.2 Commission Sources (Verified Programme Data)

**High-value programmes (by commission + cookie):**

| Programme | Commission | Cookie | Section |
|---|---|---|---|
| Booking.com | 4% of booking value | 30 days | hotels |
| Viator | 8% | 30 days | tours-activities |
| GetYourGuide | 8% | 30 days | tours-activities |
| Klook | 5% | 30 days | tours-activities |
| Airalo | 11% | 30 days | sim-cards |
| Saily | 15% | 30 days | sim-cards |
| EKTA (insurance) | Up to 15% | 30 days | insurance |
| Welcome Pickups | 10% | 30 days | transfers |
| AirHelp / Compensair | Variable CPA | 30 days | travel-services |

**Note:** Commission rates are from the Travelpayouts dashboard (verified October 2026). Actual earned rates may vary by volume tier. No rates are stored in the application database.

### 3.3 Section Revenue Potential

Six of the ten sections have `partnerCategory` linked to PARTNERS entries, enabling partner-display sidebars:

- `tours-activities` → `things-to-do` (Tiqets, Klook, KKday, Go City, WeGoTrip)
- `car-rentals` → `car-hire` (6 partners, compare page live)
- `transfers` → `transfers` (5 partners)
- `insurance` → `insurance` (EKTA)
- `sim-cards` → `esim` (Airalo, Yesim, Saily, Drimsim)
- `travel-services` → `claims` (AirHelp, Compensair)

Four sections have no linked booking partner yet:
- `hotels` — Booking.com is in Travelpayouts but no PARTNERS entry or compare page
- `flights` — Aviasales/Skyscanner via search tab only, no offer-page partners
- `trains-buses` — no partner
- `package-tours` — no partner

### 3.4 Monetisation Model

**Tier 1 — Direct affiliate clicks** (all sections): Offer page → `/go/[slug]` → partner. Already built. Requires content and env-var activation.

**Tier 2 — Search widget placement** (4 sections): Homepage search tabs and embedded partner widgets (Klook, Tiqets, WeGoTrip live product widgets). Zero-code path: embed JavaScript widgets from dashboard into relevant pages. Attribution flows through the widget's own Travelpayouts marker.

**Tier 3 — Comparison pages** (6 sections with partnerCategory): Side-by-side partner comparison drives high-intent clicks. Car-hire is live. Remaining 5 sections need compare data authored.

**Tier 4 — Newsletter + retargeting** (future): Double opt-in infrastructure built; ESP integration pending.

---

## 4. Data Strategy

### 4.1 What Data Is Available Without Requesting Access

- **Partner marketing pages** (public): product descriptions, inclusions, prices, ratings — for authoring `content/offers/<programme>/<slug>.json`. Source URL required in each offer.
- **Travelpayouts dashboard widgets** (42 total): embeddable live product data (Klook, Tiqets, WeGoTrip, intui.travel, Compensair, and others render prices/ratings in DOM). These are display-only — not a callable JSON API, not scrapable per terms.
- **Partner public APIs** (case by case): Aviasales flight data API is documented and verified. Other programme APIs must be verified individually before integration (Rule 7 of CLAUDE.md).

### 4.2 What Data Requires Requesting Access

- **Travelpayouts Data API**: exists per dashboard; available "in some programs on request." Not enabled for any programme in this account. Schema unknown. Must be requested per programme.
- **Travelpayouts Data Files**: downloadable CSV/JSON inventories; same gating. Not available.
- **Partner direct APIs** (Viator, GetYourGuide, Klook, Tiqets): all have affiliate-tier product APIs — Viator and GetYourGuide confirmed with tiered rate access (~8% base, up to ~30%). These are separate from Travelpayouts and require their own approval process.

### 4.3 Data Model for Offers

The `offers` table (migration 0016) uses a `facts JSONB` column for flexible partner metadata. The current schema from `src/core/content/offer-facts` extracts:

- `facts.images` — array of partner-supplied photos (with `image_credit`)
- `facts.rating` — numeric rating (partner-sourced, with `facts_read_on` date)
- `facts.inclusions` — array of included items
- `facts.options` — price/option variants

**These must be populated from the partner's own listing page.** No synthetic data is permitted. The publish gate enforces this structurally (facts must not be `{}`).

### 4.4 Image Rights

All offer images must come from either:
1. The partner's own listing (with attribution via `facts.image_credit`)
2. The `media` table (editorial photos for hero images)

No stock photos without a licence covering commercial/affiliate use. No AI-generated images presented as product photos. This is a hard compliance boundary, not a preference.

---

## 5. Integration Architecture

### 5.1 Travelpayouts Integration (Current + Planned)

**Currently dormant (env vars not set in production):**

```
TRAVELPAYOUTS_MARKER       — required: partner attribution marker
TRAVELPAYOUTS_PROJECT_ID   — required: for partner-links API
TRAVELPAYOUTS_API_TOKEN    — required: for partner-links API + flight data
```

Once set, `/go/[slug]` will:
1. Call `resolve_affiliate_link` RPC → get destination URL + provider slug
2. Check if link is a prebuilt `tpx.li` URL (skip provider wrapping)
3. Call `getAffiliateProvider(provider_slug)` → returns Travelpayouts adapter
4. Call Travelpayouts partner-links API (`POST /links/v1/create`) → get attributed URL
5. Attach `sub_id` = click UUID → 302 to partner

**The adapter is already written.** The only missing piece is the env vars.

### 5.2 Widget Embedding Strategy

42 widgets are available in the Travelpayouts dashboard. Most are embeddable JavaScript widgets that carry the partner marker automatically. No application code changes are needed to embed them — they are HTML snippet drops.

**High-value widgets to embed first:**
- Klook: search form widget on `/tours-activities` section page
- Tiqets: live product widget on `/tours-activities/{country}` pages
- WeGoTrip: search widget on `/tours-activities` section page
- Airalo: eSIM search widget on `/sim-cards` section page
- Welcome Pickups: transfer search widget on `/transfers` section page
- Aviasales: flight search (already on homepage via search tabs)

**Constraint:** Third-party scripts load only after cookie consent (`src/components/analytics/consent.tsx`). Widget embeds must respect this. The owner relaxed the strict no-tracker rule in September 2026; consent (not absence) is now the line.

### 5.3 SubID Attribution Chain

```
Page load → User clicks CTA
  → GET /go/{slug}?page_path={current_url}
  → affiliate_clicks INSERT: id=UUID, sub_id derived from this UUID
  → Travelpayouts partner-links API: sub_id = UUID (hyphens stripped)
  → Partner stores sub_id with booking
  → Partner reports conversion to Travelpayouts
  → Travelpayouts statistics API (not yet verified): returns sub_id
  → affiliate_conversions: click_id = affiliate_clicks.id
```

**Gap:** Step "Travelpayouts statistics API → returns sub_id" is not verified. This is the one unverified link in the conversion-attribution chain.

### 5.4 Sections Without Booking Partners

Four sections (`hotels`, `flights`, `trains-buses`, `package-tours`) currently have no PARTNERS entries. The sections exist and can hold offer pages, but visitors cannot reach a booking partner via the partner-display sidebar.

**Short-term workaround:** Offer pages in these sections can still carry an `affiliate_link_id` pointing to a direct partner URL (e.g., a Booking.com deep link for hotels). The `/go/[slug]` redirector handles all affiliate links uniformly. The gap is in the section-level partner display, not the per-offer click path.

---

## 6. Content Pipeline Strategy

### 6.1 Current Pipeline

```
Author researches partner listing page
  → writes content/offers/<programme>/<slug>.json
  → runs: node --env-file=.env.local scripts/import-offers.mjs --publish
  → offer upserted to DB (publish gate enforces quality)
  → ISR regenerates section + country + offer pages within 3600s
```

**JSON offer file required fields:** `programme`, `section`, `title`, `slug`, `source_url`, `read_on`, `affiliate_url`, `facts`, `summary`, `body` (800+ chars), plus either `city` or `country`.

### 6.2 Quality Gates (Database-Enforced)

The publish gate trigger (`enforce_offer_publish_gate`) blocks publication unless:
1. `body` is 800+ characters
2. `facts` is not empty `{}`
3. `source_url` is not null
4. The `affiliate_link_id` points to an active, non-deleted link

These are PostgreSQL constraints — they cannot be bypassed by application code.

### 6.3 Content Volume Targets by Section

Prioritise sections where:
- A Travelpayouts programme is active with high commission
- Partner listings provide rich facts (inclusions, ratings, photos)
- Search intent is well-defined (specific tours, specific products)

**Priority order:**
1. `tours-activities` — highest commission (8% Viator/GYG), rich listing data, high search intent
2. `sim-cards` — high commission (11–15%), short content (eSIM plans are comparatively simple to author)
3. `transfers` — moderate commission (10%), clear product structure
4. `insurance` — moderate commission, evergreen demand
5. `car-rentals` — compare page already live, compare drives clicks
6. `travel-services` — CPA model, low authoring volume needed

**Country coverage strategy:** Start with high-traffic travel destinations. A country page appears in the sitemap only at 3+ offers (`MIN_OFFERS_FOR_COUNTRY_PAGE`). Japan, Italy, Spain, Thailand, USA are natural starting clusters.

### 6.4 Facts Sourcing Protocol

For each offer:
- Read the partner's listing page on the date of authorship
- Record `facts_read_on` (the date)
- Store structured facts in `facts` JSONB: at minimum `images`, `rating` (if available)
- Never store a price unless it is from a live booking engine response (not applicable with current data access)
- Include inclusions, options, and duration where the listing shows them
- Store `source_url` pointing to the specific listing page

---

## 7. Platform Architecture (Current → Target)

### 7.1 Current Architecture (October 2026)

```
Next.js 16.4 (webpack build, ISR revalidate=3600)
├── Public site (src/app/(public)/)
│   ├── Homepage + 4 search tabs
│   ├── 10 section pages (/{section})
│   ├── Section-country pages (/{section}/{country})
│   ├── Offer detail pages (/{section}/{country}/{slug})
│   ├── Compare pages (/compare/{section}) — car-hire only
│   ├── Country hub pages (/countries/{country})
│   ├── City pages (/countries/{country}/{city})
│   ├── News pages (/news, /news/{slug}) — 0 articles
│   └── Static pages (about, contact, privacy, terms, affiliate-disclosure)
├── API routes (src/app/api/)
│   ├── /go/[slug] — affiliate redirector (force-dynamic)
│   └── /api/v1/subscribe — newsletter signup
├── Admin (src/app/admin/) — full CRUD, session client
└── src/core/ — framework-free domain logic
    ├── affiliate/ (partners, search, compare)
    ├── content/ (selects, offer-facts)
    ├── offers/ (offers.ts — primary content read layer)
    ├── news/ (news.ts)
    └── seo/ (metadata, site)

Supabase (PostgreSQL 17, us-east-1)
├── 31 tables, 18 migrations applied
├── RLS on all tables; closed by default
├── affiliate_offers table: schema present, no data
└── tracking: sessions + clicks + (conversions pending)
```

### 7.2 Target Architecture

The target architecture for WanderMetric as a scalable affiliate marketplace does not require a rebuild. It requires:

1. **Content volume** — more offers across all 10 sections
2. **Affiliate activation** — env vars set, `/go/[slug]` live
3. **Conversion loop** — statistics API verified, `affiliate_conversions` populated
4. **Data enrichment** — Data API/Files requests submitted per-programme when approved
5. **Partner display** — PARTNERS entries for Hotels, Trains-buses, Package-tours
6. **Compare pages** — 5 remaining sections authored
7. **News desk** — first articles published (system already built)
8. **ESP integration** — newsletter sends

No new tables, no new pages, no architecture changes are needed for the next 12 months of growth. The schema supports the full affiliate marketplace model. The `affiliate_offers` table is already positioned for Data API ingestion when access is granted.

### 7.3 Architecture Principles to Preserve

These are non-negotiable constraints from CLAUDE.md:

1. Business logic stays in `src/core/` — framework-free, no React/next/* imports
2. No invented data — no price, rating, review, availability unless a real provider returned it
3. DB is the authorization and validation boundary — RLS + CHECK constraints stay
4. Affiliate URLs live in DB, never in JSX — all links resolve via `/go/[slug]`
5. `SUPABASE_SERVICE_ROLE_KEY` never client-side — modules using it import `server-only`
6. RLS enabled on every table — no disabling, no service-role shortcuts
7. Verify any provider API before integrating — no endpoint from memory
8. No mass-generated thin pages — publish gate is a DB constraint
9. Public pages use `createSupabasePublicClient` — cookie-free to preserve ISR
10. Minimum data collection — no raw IP, no fingerprinting; third-party scripts after consent

---

## 8. SEO and Discovery Strategy

### 8.1 Current SEO Architecture

- **Sitemap**: generated from real DB content (`src/app/sitemap.ts`); excludes `/go/`, `/admin/`, `/api/`
- **News sitemap**: separate `/news-sitemap.xml` for Google News eligibility
- **Robots**: standard; disallows `/go/`, `/admin/`, `/api/`
- **Canonical URLs**: set via `buildMetadata()` from `site.url + path`
- **noindex**: section-country pages with < 3 offers; country hub pages with < 3 offers; news index with 0 articles
- **JSON-LD**: BreadcrumbList on offer pages (4 levels)
- **ISR**: `revalidate = 3600` on all public pages

### 8.2 Content Architecture for SEO

**URL structure** (`/{section}/{country}/{slug}`) is well-suited for topical authority:
- `/tours-activities/japan/` cluster supports travel-intent queries
- `/sim-cards/japan/` cluster supports product-intent queries
- `/countries/japan/` acts as a destination hub

**Priority for content growth:** favour depth per country-section (5+ offers) over breadth across countries (1 offer each). The 3-offer threshold for country pages and country hub pages incentivises clustering.

### 8.3 Gaps

- No `seo_metadata` table population for per-page overrides (roadmap notes Phase 5 as "admin dashboard — already done"; table exists but populated content uncertain)
- No OG images (roadmap lists as "before meaningful traffic")
- No internal-link graph beyond breadcrumbs (roadmap future item)
- News system built but empty — Google News eligibility requires consistent publishing

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Travelpayouts statistics API unavailable / no sub_id return | Medium | High — blocks conversion attribution | Verify before investing in conversion UI. Manual reconciliation possible short-term. |
| Data API/Files never approved for high-value programmes | Medium | Medium — affects automation, not core revenue | Manual authoring pipeline remains viable; Data API is enhancement not dependency |
| Partner commission rate changes | Low-Medium | Medium | Rates not stored in DB; no stale display; commission model column is informational only |
| Content-farm detection / thin-page penalties | Low (publish gate mitigates) | High | 800-char gate + facts + source URL enforced at DB; no mass generation path |
| Image rights violation | Low-Medium | High | Author protocol: only partner-supplied images with credit, or licensed editorial photos |
| Supabase price escalation | Low | Medium | Architecture is Supabase-first but domain logic is framework-free; migration cost is bounded |
| `page_views` growth exceeds BRIN index performance | Low (current traffic) | Medium | Documented in `docs/database.md`; trigger point ~10M rows; partition guide exists |
| Hotellook programme status unclear | Low | Low | Not in PARTNERS or active programmes; no content or links reference it; resolve before creating any Hotellook offers |
| GigSky (ID 636) absent from PARTNERS | Low | Low | Small SIM-cards programme; add when affiliate link is confirmed active in DB |

---

## 10. Summary of Strategic Direction

WanderMetric's immediate strategic priority is **affiliate activation and content velocity**.

The platform is built. The schema is correct. The tracking pipeline is wired. The redirector is implemented. The only reasons revenue is $0 today are:
1. Production env vars not set (15-minute fix)
2. No published offers to click through

The medium-term priority is **conversion loop closure** — verifying the Travelpayouts statistics API so that `affiliate_conversions` can be populated and revenue can be attributed to content.

The long-term priority is **data enrichment** — requesting Data API/Files access per-programme and building ingestion pipelines as access is granted.

At no point does this strategy require rebuilding the architecture, replacing Supabase, or switching to a different affiliate network. The existing stack is fit for purpose at the intended scale.

---

*See WANDERMETRIC-IMPLEMENTATION-ROADMAP.md for ordered phases and acceptance criteria.*  
*See WANDERMETRIC-OPEN-QUESTIONS.md for genuinely unresolved decisions and facts.*
