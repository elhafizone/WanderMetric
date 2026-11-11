# WANDERMETRIC — FULL ARCHITECTURE & PRODUCT DISCOVERY AUDIT

> **Audit date:** 2026-10-20  
> **Auditor:** Claude Sonnet 4.6 (read-only analysis)  
> **Live site inspected:** https://wandermetric.com  
> **Source repo:** `C:\Users\dell\Desktop\WanderMetric`  
> **Audit scope:** source code + live website comparison, no changes made

---

## 1. Executive Summary

WanderMetric is a **travel discovery and affiliate monetisation platform** built on Next.js 16 / React 19 / Supabase. The architecture is unusually disciplined for a v0.1 product: a hard `src/core/` boundary enforces framework-free domain logic, RLS secures every table, a database publish gate prevents thin content, and the affiliate redirector is structurally impossible to abuse as an open redirect.

The public site currently carries **transfer/airport guides** as its primary content (Welcome Pickups, Kiwitaxi, Radical Storage, etc.), along with emerging content in tours-activities, sim-cards, and insurance. The editorial stance — "written from the real listing, no invented prices" — is visible and consistent in both source and live site.

**Key strengths:**
- Architectural clarity: domain logic is genuinely decoupled from the framework
- Security-first: RLS on all 28 policy-bearing tables, publish gate by DB constraint, server-only service-role key
- SEO foundations are solid: ISR, canonical URLs, JSON-LD per page type, sitemap mirrors the DB
- The design system ("Survey" v1.0) is well-reasoned: warm sand palette, light-only, deliberate color semantics

**Key gaps:**
- The affiliate redirector returns 404 until `SUPABASE_SERVICE_ROLE_KEY` is set in the production environment — commission-bearing links do not currently work live
- The Travelpayouts marker is unset, so partner links bypass the attribution mechanism via pre-built `tpx.li` URLs
- No conversion ingestion: revenue is invisible to the platform
- Content is thin in most of the ten sections (many sections show zero guides)
- Hotels section has zero partner and zero published offers
- The navigation exposes only 5 of 10 sections (Tours, Flights, Compare); the other five (Hotels, Car Rentals, Trains-buses, Package-tours, Insurance, SIM cards, Travel services) have no direct nav entry
- The search page exists but receives no nav entry point on the header
- No dark mode, no social links, no newsletter confirmation flow beyond schema

---

## 2. Technology Stack

| Layer | Library / Service | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.4.0 | App Router, `--webpack` build (Turbopack crashes on Hostinger) |
| UI runtime | React | 19.2.8 | Server Components by default |
| Language | TypeScript | ^5 | `strict` mode |
| Styling | Tailwind CSS | ^4 | `@theme inline` token export; `@tailwindcss/postcss` |
| Database | Supabase (PostgreSQL) | @supabase/supabase-js ^2.116.0 | RLS on all tables |
| Auth | Supabase Auth + SSR | @supabase/ssr ^0.12.7 | Session cookies for admin; public client is cookie-free |
| Animation | GSAP | ^3.15.0 | Dynamic import; never in initial payload |
| Icons | Lucide React | ^1.48.0 | ~50 icons used across the UI |
| Validation | Zod | ^4.6.5 | API boundaries only |
| Fonts | Bricolage Grotesque + Manrope | via `next/font` | Self-hosted; no external font request |
| Testing | Vitest | ^5.0.0 | 45 tests over `src/core/` |
| Lint | ESLint | ^9 + eslint-config-next 16.4.0 | No suppressions |
| Hosting | Hostinger Node.js | — | Runs `next start`; Supabase hosts the DB |
| CDN / Images | `next/image` | — | Unoptimized for partner-hosted images; optimised for self-hosted |

**Three client components on the entire public site:**
1. `ConsentManager` — cookie consent + GA4 loader
2. `CompareTable` — checkbox select-to-compare UI
3. `HeroSlider` — cross-fade carousel on homepage

Everything else is React Server Components with ISR (`revalidate = 3600`).

---

## 3. Route Map

### Public routes

| Pattern | File | Rendering | Notes |
|---|---|---|---|
| `/` | `src/app/(public)/page.tsx` | ISR 3600s | Homepage: hero slider + section grid + country tabs + latest guides |
| `/{section}` | `src/app/(public)/[section]/page.tsx` | Static (generateStaticParams) | 10 section pages; special UI for car-rentals, flights, tours-activities |
| `/{section}/{country}` | `src/app/(public)/[section]/[country]/page.tsx` | ISR 3600s | noindex if <3 offers |
| `/{section}/{country}/{slug}` | `src/app/(public)/[section]/[country]/[slug]/page.tsx` | ISR 3600s | Offer detail; gallery or DetailHero; sticky sidebar |
| `/countries/{country}` | `src/app/(public)/countries/[country]/page.tsx` | ISR 3600s | Country hub; noindex if <3 offers across all sections |
| `/compare/{section}` | `src/app/(public)/compare/[section]/page.tsx` | Static (generateStaticParams) | Only sections with a partnerCategory |
| `/search` | `src/app/(public)/search/page.tsx` | Dynamic | Full-text search; Postgres tsvector + trigram |
| `/news` | `src/app/(public)/news/page.tsx` | ISR | In development (untracked files in git status) |
| `/news/{slug}` | `src/app/(public)/news/[slug]/page.tsx` | ISR | In development |

### Functional routes

| Pattern | Notes |
|---|---|
| `/go/[slug]` | Affiliate redirector; 302 after click recording; `force-dynamic`, `runtime=nodejs` |
| `/api/v1/*` | 20 endpoints; Zod-validated; response envelope; mobile-client ready |
| `/api/v1/health` | Real DB round-trip; returns 503 on failure |
| `/api/v1/subscribe` | Newsletter; double opt-in; no ESP wired yet |

### Admin routes

| Pattern | Notes |
|---|---|
| `/admin` | Config-driven CRUD for 8 entities; session client (RLS evaluates as signed-in user) |

### Legacy 301 redirects (in `next.config.ts`)

~25 redirects from the previous site structure including: `/guides/:path*`, `/deals/:path*`, `/destinations/:path*`, `/activities/:path*`, `/tours/:path*`, `/esim` → `/sim-cards`, `/car-hire` → `/car-rentals`.

### Structural gaps

- No `/compare` index page (dropdown leads only to individual compare sub-pages)
- No `/search` link in the header (magnifier icon exists but is desktop-only)
- Sections `hotels`, `trains-buses`, `package-tours`, `sim-cards`, `travel-services` have no nav entry

---

## 4. Data Architecture

### Database overview

31 tables across 11 migrations, four conceptual domains:

1. **Geography** — `countries`, `regions`, `cities` (with IATA codes for flight deep links)
2. **Editorial content** — `destinations`, `guides`, `hotels`, `activities`, `flight_routes`, `deals`, `categories`, `profiles`, `media`
3. **Offers** — `offers` table (the post-reorganisation primary content entity), with `offer_section` enum (10 values)
4. **Affiliate & Tracking** — `affiliate_providers`, `affiliate_programs`, `affiliate_links`, `affiliate_link_placements`, `affiliate_offers`, `affiliate_clicks`, `affiliate_conversions`, `tracking_sessions`, `page_views`, `daily_stats`
5. **System** — `seo_metadata`, `redirects`, `email_subscribers`, `audit_log`

### Primary content entity: `offers`

The `offers` table is the post-reorganisation home for all published guides. Each offer row has:
- A `section` (enum: one of 10 sections)
- A `country_id` FK + `city_id` FK (optional)
- `name`, `summary`, `body` (800+ chars enforced by trigger), `facts` (JSONB), `source_url`, `slug`
- `program_id` FK → `affiliate_programs`
- A publish gate trigger: body ≥ 800 chars, at least one non-null fact, source_url present, active affiliate link in DB

### Publish gate (DB trigger)

A PostgreSQL trigger on `offers` prevents publication unless:
1. `body` ≥ 800 characters
2. At least one non-null `facts` key exists
3. `source_url` is populated
4. An active affiliate link is linked to the offer

This makes it structurally impossible to publish a thin or link-free page.

### Key schema constraints

- `affiliate_links.destination_url`: CHECK constraint `^https?://` — prevents javascript:/data: open redirects at the schema level
- `affiliate_conversions.click_id`: NULLABLE — unattributable conversions stay visibly unattributed
- `media.alt_text`: NOT NULL constraint — alt text is mandatory for every uploaded image
- `profiles.role`: enum (`admin | editor | viewer`) — first user to sign up becomes admin
- `page_views`: `bigserial` with BRIN index, deliberately unpartitioned (documented reasoning in `docs/database.md`)

### PostgREST `!inner` pattern

All queries where the filter is on an embedded column use `!inner` joins. Without this, PostgREST returns the parent row with a null embed rather than excluding it — a silent bug that affected a prerender. Every function in `src/core/content/selects.ts` applies this.

---

## 5. Entity Relationships

### Editorial domain

```
countries ──< regions ──< cities
countries ──< cities
cities ──< hotels
cities ──< activities
cities ──< flight_routes
countries ──< destinations (country page when city_id IS NULL)
cities ──< destinations (city page when city_id IS NOT NULL)
destinations ──< guides
categories ──< guides
categories ──< activities
media ──< destinations (hero image)
profiles ──< guides (author)
```

### Offers domain (post-reorganisation)

```
offer_section (enum, 10 values) ── offers
countries ──< offers
cities ──< offers (optional)
affiliate_programs ──< offers
affiliate_links ──< offers (via offer-link join / link slug on offer)
```

### Affiliate & Tracking domain

```
affiliate_providers ──< affiliate_programs ──< affiliate_links ──< affiliate_clicks
affiliate_links ──< affiliate_link_placements
affiliate_clicks ──> affiliate_conversions (1:0..1)
tracking_sessions ──< affiliate_clicks
tracking_sessions ──< page_views
```

### Polymorphic references (no FK, application-maintained)

`seo_metadata`, `content_tags`, and `affiliate_link_placements` reference content via `(content_type, content_id)` pairs — no foreign key. One polymorphic join table across ten entity types, at the cost of DB-level referential integrity.

---

## 6. Affiliate Architecture

### Partner network

WanderMetric uses **Travelpayouts** as the primary affiliate aggregator. Travelpayouts acts as a single account that reaches 100+ travel brands including Booking.com, Viator, GetYourGuide, and many others.

### Direct partners (23 total across 6 categories)

| Category | Partners |
|---|---|
| Car hire | EconomyBookings, QEEQ, GetRentacar, Localrent, Auto Europe, BikesBooking |
| Transfers | Welcome Pickups, Kiwitaxi, GetTransfer, Intui.travel, Radical Storage |
| eSIM | Airalo, Yesim, Saily, Drimsim |
| Insurance | EKTA |
| Things-to-do | Tiqets, Klook, KKday, Go City, WeGoTrip |
| Claims | AirHelp, Compensair |

**Notable gap:** Hotels has zero partner. The section exists in the taxonomy, schema allows it, but no programme is active.

### Partner link resolution

Partners NOT yet accessible via Travelpayouts partner-links API (use pre-built tpx.li links):
- Kiwi.com, Expedia UK, HolidayTaxis, Ticketmaster, Priority Pass, Indrive

### The `/go/[slug]` redirector

```
Client request → /go/[slug]
  → DB lookup via resolve_affiliate_link RPC
  → record_affiliate_click RPC (bot check first; bots get redirect, no click row)
  → 302 redirect to destination_url
  → Headers: no-store, no-cache, must-revalidate; x-robots-tag: noindex, nofollow
```

**Security properties:**
- Destination from DB only — structurally impossible open redirect
- DB URL constraint `^https?://` — javascript:/data: blocked at schema
- Bot detection prevents click inflation
- Service-role RPC (currently returns 404 until `SUPABASE_SERVICE_ROLE_KEY` is set in prod env)

### Current production status

The CLAUDE.md confirms: "Checked 2026-10-09: `/go/[slug]` 302-redirects to a `tpx.li` link and `/api/v1/subscribe` validates input."

However, CLAUDE.md also notes: "The last production build was 2026-10-04, so later local work is not deployed until a new build is started." This means the environment check may be stale.

---

## 7. Travelpayouts Integration

### Configuration

Three env vars required: `TRAVELPAYOUTS_MARKER`, `TRAVELPAYOUTS_API_TOKEN`, `TRAVELPAYOUTS_PROJECT_ID`

`partnerLinksReady()` guards all partner-link API calls — gracefully degrades to pre-built tpx.li links when env vars are absent.

### Implemented capabilities

| Feature | Status | Notes |
|---|---|---|
| `buildDeepLink()` | ✅ Implemented | Uses link template OR `/links/v1/create` API |
| `search()` (flights) | ✅ Implemented | `/v1/prices/cheap` API; IATA routing |
| `conversionFeed` | ❌ Not built | Statistics API was never verified against a real response |

### Rate limits

- 100 requests/minute/marker
- 10 links per request

### Env var gap

`TRAVELPAYOUTS_MARKER` is not set in the Hostinger production environment. Pre-built `tpx.li` links work and carry attribution, but `buildDeepLink()` is dormant. This means city-specific deep links for flight searches don't generate.

---

## 8. User Journeys

### Journey 1: Browse by section (primary)

```
Homepage → Section grid → /tours-activities → ThingsToDoStrip
→ Click offer card → /tours-activities/spain/barcelona-gothic-quarter-tour
→ Offer detail (hero, body, facts sidebar) → CTA "Check availability on Klook" → /go/{slug}
→ 302 → partner site → (conversion) → (Travelpayouts statistics API, not yet ingested)
```

### Journey 2: Browse by country

```
Homepage → Country tabs → /countries/spain
→ List of offers grouped by section → /sim-cards/spain/{slug}
→ Offer detail → /go/{slug}
```

### Journey 3: Flights

```
/flights → FlightSearch widget (Travelpayouts White Label embed)
→ User searches origin/destination → opens booking flow in new tab
```

### Journey 4: Compare providers

```
Homepage header "Compare" dropdown → /compare/car-rentals (or /compare/transfers etc.)
→ CompareTable (side-by-side 6 providers) → checkbox to narrow → "Visit {provider}" → /go/{slug}
```

### Journey 5: Search

```
Header search icon → /search (no direct nav link visible in header on mobile)
→ Postgres full-text + trigram typeahead → results page → offer detail
```

### Journey 6: Admin content authoring

```
/admin (session client) → CRUD for offers, countries, media, links
→ Offer passes publish gate trigger → visible on public site (ISR revalidate)
```

### Missing journeys

- No "plan a trip" flow
- No "save for later" / wishlist
- No user registration on the public site
- No deals / expiry-based promotional flow (deals table exists in DB but no public page)
- No hotel booking flow (section exists but empty)

---

## 9. Homepage Architecture

### Structure (top to bottom)

1. **FeaturedHero** — `<section bg-bg-tint border-b>`  
   H1 is `sr-only` ("WanderMetric: guides written from the real listing"). The hero slider (`HeroSlider`) is a cross-fade client component that takes the first 5 offers from `listOffers(db, { perPage: 6 })`. Each slide: large left card (photo, location eyebrow, title, summary, provider, CTA) + 3 right-side vertical mini-cards. Dots + arrows for navigation. `hero-fade` CSS keyframe for entrance (not GSAP — LCP element must not depend on JS).

2. **Trust badges** — 2 inline chips: "No invented prices or reviews" + "You book directly with the partner"

3. **Browse by section** — 10-card grid (2 cols mobile, 5 cols desktop). Each card: section icon, name, tagline, guide count badge. Links to `/{section}`.

4. **Browse by country** — `CountryTabs` component. Dynamically populated from `listCountriesWithOffers()`. Links to `/countries/{country}`.

5. **Latest guides** — 3-column grid of `OfferCard` (same 6 fetched for hero, no extra query). Card: photo, location eyebrow, title, summary snippet, provider + duration.

6. **Pillars band** — `<Band>` container (bg-bg-tint). Three pillars: "Honest numbers / Independent / Kept current."

### Data fetching

Three concurrent Supabase queries via `Promise.all`:
- `listOffers(db, { perPage: 6 })` — for hero + latest guides
- `listCountriesWithOffers(db)` — for country tabs
- `countOffersBySection(db)` — for section grid count badges

All use `createSupabasePublicClient()` (cookie-free, enables static rendering + ISR).

### Live site observations

- Hero currently shows transfer/airport guides (Barcelona, Rome, Paris, Madrid — Welcome Pickups)
- Warm sand (#FAF8F4) background immediately visible
- Cookie consent banner: bottom-left, dark green "Accept all" button — appears before any GA4 load
- Sections grid shows all 10 sections with guide counts (most showing 0 or low single digits)

---

## 10. Navigation Architecture

### Header (`src/components/layout/site-header.tsx`)

```
[Logo W wandermetric]  [Home]  [Destinations]  [Tours]  [Flights]  [Compare ▼]  [🔍]
```

**Mobile:** Same `<details>`/`<summary>` pattern → fullscreen overlay menu (works without JS)

**Compare dropdown:** `<details>`/`<summary>` native HTML — no JS required. Sub-items depend on which sections have a `partnerCategory`.

**Problems:**
- Only 5 of 10 sections surface in navigation (Tours = tours-activities, Flights = flights; Compare = 6 sub-categories). Missing from nav: Hotels, Car Rentals, Trains-buses, Package tours, Insurance, SIM cards, Travel services.
- "Destinations" links to `/countries` — this deviates from the section model (destination is a filter, not a section per CLAUDE.md)
- Search icon exists but is not labeled and has no mobile nav equivalent
- No breadcrumb in the header — breadcrumbs appear per-page but are not surfaced globally

### Footer (`src/components/layout/site-footer.tsx`)

Dark background (ink-colored). 4 columns:
- **Sections** (first 5): Tours & Activities, Hotels, Car Rentals, Flights, Trains & Buses
- **More sections** (last 5): Transfers & Airport, Package Tours, Insurance, SIM Cards, Travel Services
- **Company**: About, Disclosure, Contact
- **Legal**: Privacy, Cookie settings, Terms

Long affiliate disclosure text. `CookieSettingsButton` (dispatches `wm:open-consent` event). No social links ("no platform is connected yet").

### UX gap: Navigation coverage

The header exposes 4 explicit nav items + 1 Compare dropdown. A user looking for "car rentals", "hotels", "SIM cards", or "train tickets" must either scroll the footer or know to look under Compare (for car rentals and transfers). All 10 sections are discoverable from the homepage section grid, but not from any interior page.

---

## 11. Design System Audit

### Identity: "Survey" v1.0 (September 2026)

Source of truth: `src/app/globals.css` (CSS custom properties on `:root`, re-exported as Tailwind tokens via `@theme inline`).

### Color tokens

| Token | Value | Semantic role |
|---|---|---|
| `--wm-bg` / `bg` | `#faf8f4` | Warm sand — page ground |
| `--wm-bg-tint` / `bg-tint` | `#f3efe7` | Section breaks, header band |
| `--wm-surface` / `surface` | `#ffffff` | Cards, panels |
| `--wm-surface-2` | `#f3eee4` | Image wells, placeholders |
| `--wm-ink` | `#1c1a17` | Primary text (warm charcoal, not pure black) |
| `--wm-ink-soft` | `#48433c` | Secondary text |
| `--wm-ink-muted` | `#6a6358` | Captions, labels |
| `--wm-accent` / `accent` | `#0b6660` | Lagoon — brand/interactive state |
| `--wm-accent-hover` | `#084f4a` | Hover state for accent |
| `--wm-cta` / `cta` | `#ffb21e` | Marigold — booking/search CTA; ink label only (9.6:1) |
| `--wm-secondary` / `secondary` | `#2a4f86` | Harbour — guides/info category |
| `--wm-ember` | `#c0400e` | Ember — things that expire ONLY |
| `--wm-border` | `#e6dece` | Hairlines |
| `--wm-border-strong` | `#d6cbb6` | Visible edges |

**Color discipline:** `accent` appears only on interactive elements and brand. `ember` reserved strictly for expiry dates. `cta` (Marigold) marks booking actions only.

### Typography

| Face | Variable | Role |
|---|---|---|
| Bricolage Grotesque | `--font-bricolage` | Display only: headings, card titles, wordmark |
| Manrope | `--font-manrope` | All UI and body copy; tabular figures |

CSS utility classes: `.display` (large headlines, optical size 120), `.display-sm` (card/panel titles, opsz 48), `.article` (long-form reading typography), `.eyebrow` (tracked-out small caps).

**Note:** `docs/design-system.md` mentions Fraunces + Inter as the previous identity, and notes "The live values are in `src/app/globals.css`." The live tokens (Bricolage Grotesque + Manrope, Lagoon + Marigold palette) supersede the docs table. The docs file records the reasoning from both identities, which is useful history.

### Motion system

GSAP 3.15.0 dynamically imported in `src/components/motion/`. Three rules:
1. Hero entrance = CSS keyframes (LCP element must not depend on JS hydration)
2. GSAP arrives after interactivity, only on routes that use it
3. Content always visible without JS: `gsap.from` pattern; `prefers-reduced-motion` cancels everything in one CSS rule

### Dark mode

**Deliberately absent.** The design system document explains the decision: an earlier dark mode silently overrode the brand for OS dark-mode users. `color-scheme: light` on `:root` prevents browser darkening of form controls. A future dark theme should be an explicit toggle, not an ambient preference.

### Corner radii

Restrained: `rounded-xl` = 1rem. Cards use `rounded-lg`. CTAs use `rounded-md`. Compare provider cards use `rounded-2xl`.

### Component inventory (actual files)

```
src/components/
  layout/     Container (default/wide/narrow), Band, SiteHeader, SiteFooter
  ui/         Button, Badge, Breadcrumbs, Card (EmptyState), DetailHero,
              FactList, MediaImage, Pagination, Prose, Section (SectionHeader, PageHeader)
              ArticleTile, DealTile
  motion/     MediaReveal, Reveal, Parallax
  home/       FeaturedHero, HeroSlider
  offer/      OfferCard, OfferBody, OfferGallery, OfferGuidePanel,
              OfferInclusionsBlock, OfferOptionCards
  compare/    CompareTable
  section/    CheckCards, CountryTabs, SectionIcon, ThingsToDoStrip
  flights/    FlightHelpGrid, FlightSearch
  category/   CategoryPage, PartnerList
  affiliate/  AffiliateLink
  analytics/  ConsentManager (+ CookieSettingsButton)
  brand/      Logo
  search/     SearchForm, SearchModule
  article/    ArticleBody, ArticleFacts, ArticleToc, KeepExploring, ReadingProgress
  newsletter/ SubscribeForm
  admin/      DeleteButton, ResourceForm, SignOutButton, UI primitives
  seo/        JsonLd
  destinations/ DestinationsExplorer
```

---

## 12. UX Problems

### Critical (conversion-blocking)

1. **Affiliate links return 404 in production.** `SUPABASE_SERVICE_ROLE_KEY` is not set in Hostinger env. The `/go/[slug]` route requires the service-role client for the `resolve_affiliate_link` RPC. Every "Check availability" and "Visit provider" CTA is broken until the env var is added and a rebuild is triggered.

2. **No obvious path to most sections from interior pages.** A user on `/transfers/spain/barcelona-transfer` has no way to discover `/sim-cards` or `/hotels` from the header. The "Browse by section" grid is homepage-only.

### High (UX friction)

3. **Navigation only covers 4 of 10 sections.** Tours, Flights, Compare sub-categories, Destinations — that's it. Car Rentals, Hotels, Trains-buses, Insurance, SIM cards, Travel services, Package tours are footer-only.

4. **No search in mobile navigation.** The search icon is in the desktop header but not in the mobile fullscreen overlay menu. Mobile users can only find content by browsing sections.

5. **Compare has no index page.** The "Compare" header dropdown links to individual sections but there is no `/compare` overview. A user who clicks "Compare" expecting an explanation of the feature gets only a dropdown.

6. **Hero slider on homepage shows only transfer guides.** The current content corpus is heavily transfer-focused (Welcome Pickups guides across Barcelona, Rome, Paris, Madrid). The hero is meant to showcase a variety of sections, but the DB only has guides in a few sections.

7. **Hero H1 is `sr-only`.** The visual headline is the first offer name in the slider. A first-time visitor has no text that says what WanderMetric is above the fold — only the subtitle below the slider ("Guides written from the real listing…") explains the proposition.

### Medium (polish issues)

8. **No breadcrumb for country hub or section pages.** Breadcrumbs appear on offer detail and section+country pages but not on `/countries/{country}` or `/{section}`.

9. **Country tabs UI on homepage has no "All countries" label in the tab.** The `allHref="/"` param links back to homepage but the label is not shown in the tab row — functionally unclear.

10. **Footer affiliate disclosure is very long** (~4 paragraphs). On mobile this creates significant scroll before reaching copyright. Consider a collapsed/expandable version.

11. **OfferCard has no price display.** No price column exists in the schema (correct, per "no fabricated data"). But offer cards show no pricing indicator at all — not even "prices from" sourced from the partner. First-time visitors may be confused about whether they are looking at a booking page or an article.

12. **The `/compare/{section}` page breadcrumb shows "Compare" as a link but `/compare` returns 404.** There is no index route for `/compare`.

### Low (minor)

13. **No "New" or date badge on offer cards.** The `listOffers` sort is by updated_at descending, but cards don't show when they were published/updated. The section shows "when its details were read" only in the sidebar of the detail page.

14. **Section icon in homepage grid uses `text-accent` on a white background card.** All 10 sections use Lagoon (#0B6660) icon color. This creates a uniform look that doesn't differentiate sections visually.

---

## 13. Mobile UX Audit

### Live observation

The site is mobile-first (Tailwind grid breakpoints `sm:`, `lg:` throughout). The in-app browser screenshot showed at ~800px wide.

### Mobile-specific patterns

| Element | Mobile behavior |
|---|---|
| Header | Logo + hamburger via `<details>` / `<summary>` |
| Mobile menu | Full-screen overlay; same navigation items |
| Hero | Single full-width card, side cards hidden or scrollable |
| Section grid | 2 columns (`grid-cols-2`) |
| Offer card grid | 1 column on mobile, 2 on sm |
| CompareTable | Cards stack vertically (no horizontal scroll table) |
| OfferGuidePanel | Below article on mobile (not sticky until lg) |
| Cookie banner | Full-width bottom on mobile, max-w-[30rem] bottom-left on sm+ |

### Mobile UX gaps

1. **No search in mobile menu.** The `<details>` overlay contains only the same links as desktop. The search magnifier icon is in the header row but is easy to miss at 44px tap target.

2. **CountryTabs overflow on mobile.** If many countries are listed, the tab row may overflow horizontally without a scroll indicator. No `overflow-x: auto` wrapper is visible in the component file.

3. **OfferGuidePanel booking CTA is below a long article body on mobile.** On desktop it's a sticky sidebar. On mobile a user reads the entire article before seeing the CTA.

4. **Hero slider dots are small (14px tap target on mobile).** The `•` indicators at the bottom of the slider are CSS-only with no visible touch area enhancement.

5. **Compare table on mobile.** Provider cards are a single column (good). But with 6 providers, a user scrolls through 6 full cards to compare criteria — no summary row.

---

## 14. SEO Architecture

### Implemented foundations

| Feature | Implementation |
|---|---|
| Canonical URLs | `buildMetadata()` in `src/core/seo/metadata.ts` |
| `noindex` | Automatically applied to thin-content pages (`<3 offers`) and `/search`, `/go/`, `/admin/`, `/api/` |
| Open Graph | Per page: type "website" on section/country; type "article" on offer detail |
| JSON-LD | `JsonLd` component; `BreadcrumbList` on offer detail; `Organization + WebSite + SearchAction` on root layout |
| Sitemap | DB-driven (`/sitemap.xml`); respects `MIN_OFFERS_FOR_COUNTRY_PAGE = 3` threshold; ISR 3600s |
| `robots.txt` | Disallow: `/go/`, `/admin/`, `/api/`; two sitemaps listed |
| Title template | `%s · WanderMetric` |
| Redirects | ~25 legacy 301s in `next.config.ts` |
| ISR | `revalidate = 3600` on homepage, section+country, offer detail, country hub |

### SEO strengths

- **No fabricated structured data.** No `Product`, `Offer`, `Review`, or `AggregateRating` schema exists. The publish gate prevents thin pages from escaping. This is important — Google has been aggressive about penalising sites with unverifiable rating/price markup.
- **Sitemap is database-accurate.** It reads live published data; anon client means only published rows are visible.
- **Internal link structure is coherent.** Breadcrumbs → section → country → offer; offer card grid → detail pages.

### SEO gaps

1. **News sitemap (`/news-sitemap.xml`)** is referenced in `robots.ts` and `sitemap.ts` but the news section is unbuilt (tracked as untracked files in git). Currently serves an empty or missing file.

2. **OG images are generic.** The `buildMetadata()` function uses the site's default OG image for all pages — no per-offer social card with the offer photo.

3. **Offer detail pages have no `datePublished` / `dateModified` JSON-LD.** The `BreadcrumbList` schema exists, but there is no `Article` or `TouristAttraction` schema that would help search engines understand the content type and freshness.

4. **`sitemap.ts` comment notes: "approaching 50,000-URL limit needs sitemap index split."** The code notes this but the split is not yet implemented.

5. **Country hub pages don't inherit section breadcrumb context.** `/countries/spain` lists offers from all sections, but search engines see a flat hierarchy rather than `Spain → Section → Offer`.

6. **The `routes` object in `src/core/seo/site.ts` contains stale routes** (`/destinations/`, `/guides/`, `/itineraries/`) referencing the old site structure. These are not linked anywhere visible but could cause confusion.

---

## 15. Performance Audit

### Architecture-level strengths

- **Server Components by default.** Only 3 client components on the entire public site (ConsentManager, CompareTable, HeroSlider).
- **ISR (1-hour)** on all dynamic public pages — near-CDN performance for most visitors.
- **Static generation** for section pages (`dynamicParams = false` + `generateStaticParams`).
- **GSAP dynamically imported** — never in the initial payload (~110 kB deferred).
- **`next/font` self-hosted** — no external font request, zero font layout shift.
- **`concurrent fetch`** on all pages: `Promise.all([...])` for parallel Supabase queries.
- **Narrow card queries** — `listOffers` fetches only fields needed for card display.
- **`next/image`** with explicit `sizes` on every image.
- **BRIN index on `page_views`** — append-only time-series; BRIN is the right index.

### Performance concerns

1. **`unoptimized` prop on partner-hosted images.** Partner images (Klook, Tiqets, etc.) are served via `<Image unoptimized>` — no resizing or format conversion. These may be large JPEGs. For images hosted on partner CDNs this is expected (can't proxy without attribution risk), but OG and editorial images should be optimised.

2. **`next build --webpack` instead of Turbopack.** Forced by the Hostinger environment. Build times will be longer than with Turbopack.

3. **No bundle analysis configured.** `@next/bundle-analyzer` is not in the dependencies. Unknown if there are any large client-side bundles beyond GSAP.

4. **`force-dynamic` on `/go/[slug]`** — necessary for click recording; this route cannot cache. This is intentional and correct.

5. **GSAP ScrollTrigger on offer detail pages.** `MediaReveal` and `Parallax` components are used on the detail page layout. While dynamically imported, they do add JS weight to pages that could otherwise be entirely static.

6. **No web vitals reporting.** GA4 collects page views but no CWV (Core Web Vitals) tracking is visible.

---

## 16. Scalability Audit

### What scales well

- **Supabase (PostgreSQL) as the backend** — handles the expected traffic tier for a new affiliate site without operational overhead.
- **ISR architecture** — static content served from CDN, only 1 revalidation request per cache period hits the DB.
- **Section taxonomy is a fixed enum** — no N+1 section query; `generateStaticParams` at build time.
- **`page_views` is unpartitioned intentionally** — documented in `docs/database.md`; partition at 1B+ rows.
- **Publish gate prevents content sprawl** — quality floor enforced at DB level.
- **`src/core/` boundary** — mobile app can consume the same logic through `/api/v1`.

### Scalability concerns

1. **Sitemap will hit the 50,000-URL limit.** The code comments acknowledge this. As offers scale (10 sections × countries × offers), a sitemap index is needed before that limit.

2. **`countOffersBySection()` runs on every homepage load.** With ISR this is at most once per hour, but it's a GROUP BY query across the full offers table.

3. **`listCountriesWithOffers()` for country tabs** — again, ISR means once per hour max, but as the country count grows this could become a heavy join.

4. **No CDN for images.** Next.js image optimization is running on the same Hostinger Node.js instance that serves the SSR. Under traffic spikes, image optimization competes with SSR.

5. **No rate limiting on `/api/v1`** beyond Supabase's built-in connection pooling. In-process rate limiting was documented as a known weakness.

6. **Admin is on the same Node.js process as the public site.** No isolation; a heavy admin operation could affect public page latency.

---

## 17. Keep / Improve / Rebuild

### Keep (solid, don't touch)

- `src/core/` architectural boundary — framework-free domain logic is genuinely clean
- `/go/[slug]` affiliate redirector design — click-before-redirect, bot detection, no open redirect
- DB publish gate trigger — strongest available guarantee against thin content
- RLS on all tables — security model is correct
- `ConsentManager` — consent-before-GA4 is exactly right for GDPR; localStorage pattern avoids cookie for consent itself
- ISR throughout — performance model is correct for this content type
- `!inner` join pattern in PostgREST queries — prevents silent parent-row returns
- No dark mode (until a deliberate toggle is designed)
- `server-only` on service-role modules

### Improve (good ideas, poor execution or incomplete)

- **Navigation coverage** — all 10 sections should be reachable from any interior page. Could be a mega-nav, a secondary nav bar, or a "Sections" dropdown.
- **Offer card** — consider showing a "From [partner name]" line or a "Read the guide" affordance more clearly. The CTA is only on the detail page.
- **OfferGuidePanel mobile** — the booking CTA should either float at the bottom of the screen or appear at the top of the content on mobile.
- **OG images** — per-offer social cards using the offer's own photo would significantly improve click-through from social sharing.
- **JSON-LD depth** — `TouristAttraction` or `Product` schema (without price) on offer detail would help search engines classify content type.
- **Hero copy** — the H1 is screen-reader-only; add a short visual tagline or trust statement above the fold.
- **Section page differentiation** — car-rentals gets the compare table, flights gets the search widget, but 7 other sections share the same layout template. Consider section-specific hero messaging.
- **`/compare` index page** — a landing page explaining what "compare" means, with links to all comparison sub-pages.

### Rebuild (structurally wrong or placeholder)

- **Stale `routes` object in `src/core/seo/site.ts`** — references `/destinations/`, `/guides/`, `/itineraries/`. These should be removed or updated to the current route structure.
- **Design-system docs partial staleness** — `docs/design-system.md` contains both old identity (Fraunces, Inter, ivory/sage) and new identity (Bricolage Grotesque, Manrope, Lagoon/Marigold). The old values section should be archived or removed to avoid confusion.
- **News section (in development)** — 4 untracked files in git status. Should be properly integrated or clearly branched.
- **`robots.ts` references `/news-sitemap.xml`** which does not yet serve a valid sitemap.

---

## 18. Recommended Information Architecture

### Current IA weaknesses

The current IA assumes users know to look in the section grid on the homepage to discover sections. There is no section discovery from interior pages.

### Proposed IA

```
Top-level navigation (visible from every page):
  [Logo]
  [Home]
  [Sections ▼]  → Tours & Activities | Hotels | Car Rentals | Flights | Trains & Buses
                    Transfers | Package Tours | Insurance | SIM Cards | Travel Services
  [Destinations] → /countries (or country browser)
  [Compare ▼]   → Car Rentals | Transfers | eSIM | Insurance | Things to Do | Claims
  [Search 🔍]

Section page pattern:
  /{section}           — overview + partner list + compare table + guide strip
  /{section}/{country} — filtered guides + local partner suggestions
  /{section}/{country}/{slug} — offer detail (current structure is good)

Country hub pattern:
  /countries/{country} — all sections for that country (current structure is good)

Compare:
  /compare             — index page: "What's compared and why"
  /compare/{section}   — existing compare pages (unchanged)

News (when built):
  /news                — article index
  /news/{slug}         — article detail
```

---

## 19. Page Templates

### Template 1: Section overview (`/{section}`)

**Current variants:** default (ThingsToDoStrip + PartnerList + CheckCards) | car-rentals (CompareTable) | flights (FlightSearch + FlightHelpGrid) | tours-activities (ThingsToDoStrip only)

**Issues:** 7 sections share the default template. The template is not section-specific in visual identity — only the copy differs.

**Needed:** Section-specific hero messaging (a short "what this section covers" statement before the guide strip).

### Template 2: Offer detail (`/{section}/{country}/{slug}`)

**Current:** BreadcrumbList JSON-LD → (OfferGallery if photos exist else DetailHero) → 2-column: article (body + inclusions + options) | sticky sidebar (CTA box + caution + key facts + options)

**Issue:** Sticky sidebar only activates at `lg:` (1024px). On tablet (768-1023px) the sidebar is below the article — a user must scroll past potentially 2000+ word body before finding the booking CTA.

**Needed:** A floating "Book now" bar at the bottom of the screen for mobile/tablet.

### Template 3: Section+country (`/{section}/{country}`)

**Current:** PageHeader → CountryTabs → offer grid

**Issue:** No content differentiating this page from a generic list. A short "what [section] looks like in [country]" paragraph would help SEO and UX.

### Template 4: Country hub (`/countries/{country}`)

**Current:** City list → offers grouped by section

**Issue:** No hero, no editorial copy, no photo. Pure list of links. Functions well for navigation but could benefit from a country-level description and photo.

### Template 5: Compare (`/compare/{section}`)

**Current:** PageHeader → CompareTable (if data) → CheckCards

**Strength:** This is the best-designed template. The comparison UI is clean, "Not stated" is honest, the tick-to-compare feature works correctly.

---

## 20. Critical Risks

### Risk 1 (CRITICAL): Affiliate links are broken in production

**Evidence:** `SUPABASE_SERVICE_ROLE_KEY` required by `/go/[slug]` RPC is not in the Hostinger environment. The redirector returns 404. Every booking CTA on every public page is non-functional.

**Impact:** Zero affiliate revenue possible until fixed.

**Fix:** Add `SUPABASE_SERVICE_ROLE_KEY` to Hostinger Node.js environment variables; trigger a new build.

### Risk 2 (HIGH): No conversion tracking

**Evidence:** `conversionFeed: false` in `src/core/affiliate/providers/travelpayouts.ts`. The `affiliate_conversions` table exists but has no ingestion path. Revenue is invisible.

**Impact:** Cannot measure ROI, cannot optimise content strategy, cannot verify commissions.

**Fix:** Verify the Travelpayouts statistics API; implement conversion webhook or polling.

### Risk 3 (HIGH): Travelpayouts marker unset

**Evidence:** `TRAVELPAYOUTS_MARKER` not in production env. `partnerLinksReady()` returns false. Deep links fall back to pre-built `tpx.li` links (which do carry attribution), but city-specific deep link generation is dormant.

**Impact:** Flight search deep links don't generate. Partner-link API features (Booking.com, Viator via Travelpayouts) are inactive.

### Risk 4 (MEDIUM): Admin has no MFA

**Evidence:** Roadmap "Next" section lists "Enable MFA on admin accounts" as outstanding.

**Impact:** Admin accounts accessible with just email/password. If credentials are compromised, an attacker can publish content or access the service role.

### Risk 5 (MEDIUM): No Content Security Policy

**Evidence:** Roadmap lists "Add a Content-Security-Policy, report-only first" as outstanding.

**Impact:** No XSS mitigation at the HTTP header level. Current code is clean but no defence-in-depth.

### Risk 6 (MEDIUM): Photography coverage is thin

**Evidence:** `src/core/media/imagery.ts` covers 5 cities in the editorial registry. Most section pages and country pages render `MediaPlaceholder` (a deliberate blank).

**Impact:** Site looks unfinished to most visitors; hero slider only shows offers that have attached photos; SEO OG images are generic.

### Risk 7 (LOW): `news-sitemap.xml` referenced but not served

**Evidence:** `robots.ts` and `sitemap.ts` both reference `/news-sitemap.xml`; the news section is unbuilt (untracked files).

**Impact:** Google sees a reference to a sitemap that returns 404 or empty — minor SEO issue.

---

## 21. Questions and Unknowns

1. **Is `SUPABASE_SERVICE_ROLE_KEY` actually set in Hostinger now?** CLAUDE.md says the redirector works (2026-10-09) but also that "the last production build was 2026-10-04". Local changes since then may have broken the build or the env may have been removed. Needs verification.

2. **Which `tpx.li` pre-built links are current?** Pre-built links are hardcoded in `src/core/affiliate/` files. Are they still valid Travelpayouts attributed links? Have any expired?

3. **What is the actual content inventory?** The codebase has a strong publish gate, but how many offers are published per section? The live site shows primarily transfer/airport guides. Is this intentional as a launch strategy?

4. **Does the Travelpayouts account have all 23 partners as active programmes?** Several partners (Airalo, Tiqets, Localrent, etc.) were recently added per git history. Are all programmes approved and generating commission?

5. **What is the `SUPABASE_SERVICE_ROLE_KEY` situation on the production host?** Can it be added without a new build (env-only change) or does Next.js require a rebuild for server-side env vars?

6. **Is the news section being actively developed?** 4 untracked files suggest local work in progress. What is the timeline?

7. **Are there admin users created in production?** The first user to sign up becomes admin. Is there an admin account on the live Supabase instance?

8. **What is the `daily_stats` cron situation?** The `rollup_daily_stats` function exists in the schema; the roadmap says "Schedule the nightly cron" is outstanding. Is this scheduled anywhere?

9. **Photography licensing:** The registry uses 7 Unsplash-licensed photos committed to the repo. Are all credits properly maintained in `public/imagery/CREDITS.md`?

10. **Mobile traffic share:** No analytics data is available from this audit. Given the content focus (travel guides), mobile is likely 60%+ of traffic. The mobile UX gaps noted above are more important than they might appear.

---

## 22. Recommended Next Phase

### Phase A — Immediate (unblocks revenue)

1. **Set `SUPABASE_SERVICE_ROLE_KEY` in Hostinger environment and rebuild.** This single change activates the affiliate redirector and all booking CTAs.

2. **Set `TRAVELPAYOUTS_MARKER` in Hostinger environment.** Activates deep link generation.

3. **Verify `/go/slug` links are working post-rebuild.** Spot-check 3 offers across different sections.

### Phase B — UX redesign preparation

Before the UX/UI redesign, these structural decisions need to be made:

4. **Navigation strategy for all 10 sections.** Decide: mega-nav, secondary nav bar, or a dedicated "Sections" landing page.

5. **Mobile CTA strategy for offer detail.** Floating bottom bar vs. top-anchored CTA vs. current below-article placement. This affects the offer detail page layout significantly.

6. **Section page differentiation.** Decide which sections warrant unique UI treatments vs. inheriting the default template. The car-rentals and flights pages show this is done thoughtfully already.

7. **Homepage hero content strategy.** Currently shows transfer guides. Will a variety of sections be surfaced in the hero once more content is published, or will the hero be curated editorially?

### Phase C — Content and growth

8. **Photography expansion.** Extend the editorial registry beyond 5 cities, or prioritise Supabase Storage upload workflow.

9. **Hotels section activation.** A partner programme (Booking.com via Travelpayouts, Hotels.com, etc.) and at least one published guide.

10. **OG image generation.** Per-offer social cards using the offer photo would meaningfully improve link sharing.

11. **Convert news section** from untracked work-in-progress to shipped feature.

12. **Conversion tracking.** Verify Travelpayouts statistics API and build the ingestion path so revenue is visible.

---

*End of initial audit. This report is based on source code read on 2026-10-20 and the live site at https://wandermetric.com as observed on the same date. No changes were made to the codebase during this audit.*

---

## 23. Supplemental Analysis: Scaling to an Affiliate Marketplace

> **Supplemental scope:** This section answers the business model question posed after the initial audit was delivered. WanderMetric's stated intention is to scale from its current ~43 manually authored offers into a structured affiliate marketplace containing hundreds or thousands of offer records across 26+ active Travelpayouts programmes. This section examines whether the current architecture supports that vision, and what would need to change.
>
> **No implementation is proposed here.** This is analysis only.

---

### 23.1 The Central Scalability Question

> **"Can the current WanderMetric architecture scale from a relatively small travel website into a structured affiliate marketplace/content aggregator containing hundreds or thousands of offers?"**

**Short answer: The database layer and domain logic can scale. The content pipeline cannot.**

The database schema (a single `offers` table with JSONB `facts`, a publish gate, RLS, ISR rendering) is not the bottleneck. PostgreSQL handles hundreds of thousands of rows without structural changes. The ISR architecture means public pages are not making live DB reads per visitor, so read traffic scales naturally.

The hard ceiling is the content pipeline. Every one of the current 43 offers was:

1. Manually researched from a partner listing
2. Manually authored as a JSON file in `content/offers/<programme>/<slug>.json`
3. Imported via `scripts/import-offers.mjs`
4. Required to have an 800+ character body verified at import time

At an editorial pace of 2–3 offers per day, reaching 1,000 offers takes roughly 18 months of consistent effort. That is not a marketplace; it is a content site with a long roadmap.

The architecture does not currently contain any automated feed ingestion, no product catalog API integration, and no bulk-import pathway. **This is the most important architectural finding of this supplemental analysis.**

---

### 23.2 What Travelpayouts Actually Provides

This is the most common point of confusion for affiliate marketplace builders. Travelpayouts is a **tracking and attribution network**, not a **product catalog API**.

#### What Travelpayouts DOES provide (verified in `docs/travelpayouts.md`)

| Capability | Status | What it gives you |
|---|---|---|
| **Partner links API** (`/links/v1/create`) | ✅ Verified | Converts any brand URL into an attributed tracked link. Inputs: a URL. Outputs: a tracked URL. Does NOT supply product data. |
| **Flight price search API** | ✅ Verified | Returns cheapest fares between city pairs. Supplies prices and routes, not offer titles/descriptions/photos. |
| **Reference data** (`/data/en/cities.json` etc.) | ✅ Available, unused | Airport codes, city names, country names. No product data. |
| **White Label Widgets** | ✅ Available | Embeddable search boxes (flight, hotel). Not WanderMetric-style editorial cards. |
| **Statistics API** | ⚠️ NOT verified | Click and conversion reporting. Not integrated. |
| **Deep links (search-mode)** | ✅ Verified for flights | Pre-filled search on partner site. Flight vertical only. |
| **Deep links (product-mode)** | ✅ Available via template | Requires knowing the partner's specific URL format per product. |

#### What Travelpayouts does NOT provide

| Entity | Status |
|---|---|
| Product titles, descriptions, body text | ❌ Not in Travelpayouts API |
| Product photos / gallery images | ❌ Not in Travelpayouts API |
| Live pricing per product | ❌ Not in Travelpayouts API (flights only) |
| Live availability per product | ❌ Not in Travelpayouts API |
| Product identifiers / SKUs | ❌ Not in Travelpayouts API |
| User reviews / ratings | ❌ Not in Travelpayouts API |
| Category / subcategory classification | ❌ Not in Travelpayouts API |
| Cancellation terms | ❌ Not in Travelpayouts API |
| Duration / inclusions | ❌ Not in Travelpayouts API |

**The fundamental constraint:** Travelpayouts gives you the ability to link to a partner's product with your attribution. It does not give you the product data to build editorial pages from. To build thousands of offer pages, you need the partner's own API or data feed — not Travelpayouts.

---

### 23.3 What Each Travelpayouts Programme Actually Offers

The 26 active programmes vary significantly in what data is programmatically accessible. The following is based on public API knowledge as of October 2026. **Each programme must be individually verified before integration.**

| Programme | Own Product API | Data Feed | Deep Link Format | Notes |
|---|---|---|---|---|
| Klook | ✅ Yes (Affiliate API) | ✅ CSV/XML feed | ✅ Activity-level URL | API key required; approval needed |
| Viator (via TP) | ✅ Yes (Affiliate API v2) | ✅ Product feed | ✅ Experience-level URL | Requires Viator affiliate approval separately |
| GetYourGuide (via TP) | ✅ Yes (Partner API) | ✅ Activity feed | ✅ Activity-level URL | Partner API access separate from TP |
| Airalo | Limited | Limited | ✅ Package-level URL | No known public product catalog API |
| Booking.com (via TP) | ✅ Yes (Affiliates API) | ✅ Property feed | ✅ Property/city URL | Large; requires Booking affiliate program |
| Omio (trains/buses) | ✅ Yes | Limited | ✅ Route-level URL | Limited product catalog |
| Welcome Pickups | Limited | ❌ | ✅ Route-level URL | No known product catalog API |
| Radical Storage | Limited | ❌ | ✅ City-level URL | No known product catalog API |
| Rentalcars.com (via TP) | Limited | ❌ | ✅ Location-level URL | No item-level product catalog |
| Ekta Insurance | ❌ | ❌ | Limited | No known affiliate product API |
| KKday | ✅ Affiliate API | Limited | ✅ Activity-level URL | Less established than Klook |
| Localrent | Limited | ❌ | ✅ Location URL | Regional |

**Key finding:** programmes like Klook, Viator, GetYourGuide, and Booking.com have real product APIs or data feeds that could supply titles, descriptions, photos, ratings, and pricing. Programmes like Welcome Pickups, Radical Storage, Airalo, and Ekta have no public product catalog — each offer requires manual research.

**This creates a two-tier content strategy:** API-automatable (Klook, Viator, GYG, Booking.com) vs. manual-only (transfers, storage, eSIMs, insurance). WanderMetric currently publishes more from the manual tier than the automatable tier.

---

### 23.4 The Five-Part Capability Matrix

The following table uses the five-part distinction the business model clarification requested.

| Capability | Current WanderMetric | Travelpayouts Provides | Requires API Integration | Requires Manual Content | Requires Per-Programme Verification |
|---|---|---|---|---|---|
| Attributed affiliate link per offer | ✅ `/go/[slug]` | ✅ `/links/v1/create` | No | No | No |
| Offer title and slug | ✅ Manual only | ❌ | Klook/Viator/GYG APIs | All other programmes | All programmes |
| Offer body text (800+ chars) | ✅ Manual only | ❌ | ❌ (content is editorial) | All programmes | N/A |
| Offer photos / gallery | ✅ Manual only (JSONB `facts.images`) | ❌ | Klook/Viator/GYG image APIs | All other programmes | Content rights per programme |
| Live pricing | ❌ Not stored | Flights only | Viator/Klook APIs (activity price range) | N/A | Must verify T&Cs per programme |
| Live availability | ❌ Not stored | ❌ | Viator/Klook availability APIs | N/A | Must verify T&Cs per programme |
| User ratings | ❌ Not stored | ❌ | Viator/Klook/GYG ratings APIs | N/A | Must verify content rights |
| Flight price search | ✅ FlightSearch widget | ✅ Travelpayouts data API | ✅ Already partially done | N/A | N/A |
| Country/city taxonomy | ✅ Partial (slugs from offers) | ✅ Reference data endpoint | Reference data unused | N/A | N/A |
| Conversion tracking | ❌ Not built | ⚠️ Statistics API unverified | Requires API verification | N/A | Must verify per programme |
| Bulk offer import from partner | ❌ No pipeline | ❌ | Must build per-partner importer | N/A | Approval per programme |
| Category/subcategory per offer | ✅ Partial (`section` enum, 10 values) | ❌ | Partner taxonomies vary | Map from partner to WM taxonomy | Per programme |
| Provider logo / metadata | ✅ Hardcoded `PARTNERS` object | ❌ | N/A | Manual | N/A |
| Duration per offer | ✅ Manual (`duration_minutes` column) | ❌ | Klook/Viator supply duration | Manual for others | Per programme |

---

### 23.5 Entity Model vs. Current Schema

The business model clarification named the following entities. This table maps them against the current database schema.

| Entity | Current Schema Support | Gap |
|---|---|---|
| **Provider** | Hardcoded `PARTNERS` object in `src/core/affiliate/partners.ts` | Not a DB table; cannot be managed without a code deploy |
| **Program** | `programmes` table (inferred from `offers.programme_id` FK) | Appears to exist in DB but content comes from JSON files |
| **Offer** | `offers` table — full first-class entity | ✅ Core entity is well modelled |
| **Destination / Country** | Derived from `offers.country_slug` + `countries` table | Country pages exist but are thin aggregations |
| **City** | `cities` table referenced from `offers.city_id` | ✅ Exists |
| **Category** | `section` enum (10 hardcoded values) | Cannot add categories without a DB migration |
| **Subcategory** | ❌ Not in schema | No subcategory model exists |
| **Article / Guide** | `offers.body` is the article | Articles are not a separate entity; article and offer are conflated |
| **Affiliate Link** | `affiliate_links` table; one link per offer | ✅ Well modelled with click tracking |
| **Offer Image** | `offers.facts.images` (JSONB array) | Images stored as external URLs in JSONB; no `offer_images` table; no Supabase Storage for offer images |
| **Offer Metadata** | `offers.facts` (JSONB) | ✅ Flexible JSONB; works but untyped at DB level |
| **Price** | ❌ Not in schema | Deliberately absent ("never fabricate data"). Live pricing would require API integration and a storage design. |
| **Currency** | ❌ Not in schema | No currency model |
| **Rating** | `facts.rating` in JSONB (e.g. Klook: `{score: 4.6, scale: 5, count_label: "3.0K"}`) | Stored in JSONB of existing offers but not a typed column; not rendered on cards |
| **Duration** | `offers.duration_minutes` (integer column) | ✅ Exists as typed column |
| **Availability** | ❌ Not in schema | Deliberately absent |
| **Tracking / Click** | `affiliate_link_clicks` table | ✅ Click tracking modelled; conversion tracking not built |

**Summary:** The `offers` table is the only fully-modelled first-class entity. Provider and Program are hardcoded, not DB-driven. Article and Offer are the same row. Subcategory, Price, Currency, and Availability do not exist. The schema deliberately omits live data (price, availability, rating) to enforce "never fabricate data."

---

### 23.6 The Manual Import Pipeline as a Bottleneck

`scripts/import-offers.mjs` is the only path from content to database. Its constraints:

```
Required fields per offer JSON:
  programme, section, title, slug, source_url, read_on,
  affiliate_url, facts, summary, body

--publish flag requires:
  body.length >= 800 characters
  facts (non-empty object)
  source_url (present)
  active affiliate link in DB
```

**What this means at scale:**

| Scale target | Implication |
|---|---|
| 43 offers (current) | Manageable manually; ~40 hours editorial effort |
| 500 offers | ~500 hours editorial effort; 6+ months at full-time pace |
| 2,000 offers (across all 26 programmes) | ~2,000 hours; effectively requires multiple editors or a different pipeline |
| 10,000+ offers | Not feasible without automated content generation or feed ingestion |

**The 800-character body requirement** is the hard floor. For programmes with a product API (Klook, Viator), descriptions can be fetched programmatically. But the current rule requires editorial prose written from first principles, not copied from the partner. This is either an intentional content quality constraint (that differentiates the site) or an unintentional bottleneck (that prevents scale). **This is a strategic decision that must be made explicitly before any scaling work begins.**

Options:
1. **Keep the 800-char rule, accept manual scale.** Quality differentiator but slow.
2. **Relax the rule for API-sourced offers.** Requires a schema/constraint change; creates two content tiers.
3. **Build a content generation pipeline** (partner data → structured editorial prose). Requires careful design to avoid "thin content" per Google's quality guidelines.

---

### 23.7 Content Usage Rights

This section identifies what must be verified per programme before using partner content in offer pages.

| Content type | Likely status | Verification required |
|---|---|---|
| **Programme name and logo** | Usually allowed in an affiliate context | Check affiliate T&Cs per programme |
| **Partner product photos** | ⚠️ Varies significantly | Most partners (Klook, Viator, GYG) allow photo use by affiliates **via their API only**; hotlinking CDN URLs (as current JSONB does) may violate T&Cs or break when URLs expire |
| **Product title verbatim** | Usually allowed | Low risk; standard affiliate practice |
| **Product description verbatim** | ⚠️ Usually NOT allowed | Copying descriptions is a copyright issue AND a thin-content risk. WanderMetric's current approach (rewriting from first-hand research) is correct but manual. |
| **Partner ratings/review counts** | ⚠️ Verify per partner | Klook/Viator/GYG typically allow display; check freshness requirements |
| **Pricing data** | ⚠️ Must be live or clearly dated | "Listed prices when read on [date]" in `price_note` field is the current approach — legally cautious but not real-time |
| **Partner's Unsplash/stock images** | ❌ Do not use | Cannot re-use images the partner licensed from Unsplash unless you license them independently |

**Current practice:** WanderMetric's Klook offers (e.g. `barcelona-sagrada-familia-tickets-and-tours.json`) store `facts.images` as Klook CDN URLs (`res.klook.com/image/...`) with `image_credit: "Klook"`. These are served inline. This approach:
- Depends on Klook CDN URL stability (URLs may change)
- May or may not be permitted under Klook's affiliate terms (requires verification)
- Does carry correct attribution

The `price_note` field (a timestamped prose price range, e.g. "Listed prices when read on 4 October 2026...") is the legally safest approach to pricing — it is clearly dated, not presented as live.

---

### 23.8 The PARTNERS Object Problem

`src/core/affiliate/partners.ts` contains a hardcoded `PARTNERS` object — a static TypeScript array per category with partner metadata (name, logo URL, link slug, description). Currently 23 partners across 6 categories.

**Why this is a bottleneck at marketplace scale:**

1. **Adding a new programme requires a code deploy.** There is no admin UI to add programmes; they must be added in source code.
2. **Partner metadata (logo, description, link slug) lives in code, not DB.** Cannot be updated without a new build.
3. **The `section.partnerCategory` linking** (how section pages know which partners to show) is also in `src/core/sections/sections.ts` — hardcoded TypeScript.

At 26+ programmes scaling to potentially more, this hardcoded approach becomes operational friction. Each new Travelpayouts programme approval means a code change, a PR, a build.

**What would need to change:** A `programmes` or `providers` DB table with admin-managed metadata. The section-to-partner mapping would need a join table. This is a structural change to the data model — not huge, but not trivial.

---

### 23.9 Scalability Verdict by Layer

| Layer | Scale-ready? | What breaks first |
|---|---|---|
| **Database schema (offers table)** | ✅ Yes | Nothing structural until ~100K rows |
| **ISR rendering** | ✅ Yes | Sitemap at 50K URLs (known, noted in code) |
| **Affiliate link tracking** | ✅ Yes | Conversion ingestion still missing |
| **Content pipeline (import-offers.mjs)** | ❌ No | Manual effort ceiling at ~500 offers |
| **Provider/programme management** | ❌ No | Hardcoded at 23 partners; needs DB table |
| **Photo management** | ❌ No | External CDN URLs in JSONB; no Storage pipeline |
| **Live data (price/availability/rating)** | ❌ No by design | Deliberately absent; requires API integration + content rights decisions |
| **Category taxonomy** | ⚠️ Partial | 10-section enum is extensible via migration but not dynamic |
| **Subcategory / article hierarchy** | ❌ Not modelled | Offer and article are the same row |

---

### 23.10 What Must Be Verified Before Any Programme Integration

Per the business model clarification, the following must be verified for each of the 26 programmes before integrating their product data:

1. **Does the programme have a product catalog API or data feed?** (Not Travelpayouts — the partner's own)
2. **What is the rate limit and authentication model for that API?**
3. **What content usage rights do affiliates have for photos, titles, descriptions, ratings?**
4. **Are CDN image URLs stable, or do they rotate on the partner's side?**
5. **Does the programme allow live pricing display, or require clearly dated pricing?**
6. **What are the deep link URL formats for individual products?** (Needed to generate non-Travelpayouts-API links)
7. **Is there a minimum content standard required by the programme?** (Some require a certain domain authority before API access is granted)
8. **Has the Travelpayouts account been specifically approved for this programme?** (Being enrolled in Travelpayouts ≠ being approved for each sub-programme)

The current codebase has verified only the Travelpayouts platform itself. Individual programme APIs have not been verified. `docs/travelpayouts.md` explicitly notes several programmes that the partner-links API does NOT support (Kiwi.com, Expedia UK, HolidayTaxis, Ticketmaster, Priority Pass, Indrive).

---

### 23.11 Summary: The Path from 43 Offers to a Marketplace

The three things that would need to change, in order of impact:

**1. Content pipeline automation (blocking)**
The manual JSON import pipeline must be supplemented with per-programme feed importers for the automatable programmes (Klook, Viator, GetYourGuide, Booking.com). This requires: partner API access approval, a feed ingestion worker (can run as a cron or Supabase Edge Function), a mapping layer from partner schema to WanderMetric's `offers` schema, and a resolved content rights policy.

**2. Programme management in the database (operational)**
The hardcoded `PARTNERS` object must become a `programmes` table with an admin UI for adding/editing partner metadata. Without this, adding each of the 26 programmes requires a code deploy.

**3. A content strategy decision on the 800-char body rule (strategic)**
The publish gate's 800-character body requirement enforces editorial quality but sets a hard ceiling on scale speed. The team must explicitly decide: keep it as a quality differentiator, relax it for API-sourced content, or build an automated prose generation pipeline that meets the quality standard at scale.

**What does NOT need to change:**
- The `offers` table schema (already extensible via JSONB `facts`)
- The ISR rendering pipeline (scales to 50K+ URLs with a sitemap index)
- The affiliate link redirector model (`/go/[slug]`)
- The RLS and security model
- The `src/core/` domain boundary (designed explicitly for a future mobile app)
- The no-fabricated-data rule (critical for trust; live pricing must come from verified APIs only)

---

*End of supplemental analysis. This section was added 2026-10-20 based on a business model clarification received after the initial audit. No changes were made to the codebase.*
