# WANDERMETRIC — IMPLEMENTATION ROADMAP

**Version:** 1.0  
**Date:** 2026-10-20  
**Status:** Planning document — no code changes authorised by this document  
**Prerequisite reading:** WANDERMETRIC-UNIFIED-STRATEGY.md, WANDERMETRIC-OPEN-QUESTIONS.md

---

## How to Read This Document

Phases are ordered by dependency: each phase depends on the ones before it unless marked **parallel-safe**. Tasks within a phase are independent unless a dependency is stated.

Each phase has:
- **Goal** — the observable outcome when the phase is done
- **Tasks** — the concrete steps
- **Acceptance criteria** — how to verify it is done
- **Rollback** — how to undo if needed
- **Dependencies** — what must exist first

No phase authorises schema changes, production deployments, or third-party account changes. Those require separate confirmation.

---

## Phase 0 — Production Activation

**Goal:** The `/go/[slug]` redirector is live in production; clicking any offer CTA creates a real affiliate click row and redirects to the partner via Travelpayouts.

**Estimated effort:** 1–2 hours (not including Hostinger deployment time)

### Tasks

**0.1 Set production environment variables on Hostinger**

Set these four vars on the Hostinger Node.js app panel (never in `.env` committed to git):

```
SUPABASE_SERVICE_ROLE_KEY     — from Supabase project settings → API
TRAVELPAYOUTS_MARKER          — from Travelpayouts account → Tools → Links → marker value
TRAVELPAYOUTS_PROJECT_ID      — from Travelpayouts account → Tools → Links → project ID
TRAVELPAYOUTS_API_TOKEN       — from Travelpayouts account → Settings → API token
```

Optional (have defaults in the adapter):
```
TRAVELPAYOUTS_CURRENCY        — default: "usd"
TRAVELPAYOUTS_LOCALE          — default: "en"
```

**0.2 Trigger a production build**

```bash
# On Hostinger — start new Node.js build
# Command: next build --webpack
```

The last production build was 2026-10-04. Any local changes since then (news system, sitemap updates) are not deployed until a new build runs.

**0.3 Smoke test after deployment**

1. Visit `https://wandermetric.com/go/{any-active-slug}` in a browser
2. Confirm HTTP 302 redirect to a `tpx.li` or partner URL (not a 404)
3. Check Supabase `affiliate_clicks` table: confirm a row was inserted
4. Check Travelpayouts Performance report: confirm the click appears within 24h

**0.4 Verify env-var activation of Travelpayouts adapter**

The adapter fails loudly (404) if `TRAVELPAYOUTS_MARKER` is not set. After deployment:
- A 404 on any `/go/` URL means the var is missing or the service-role key is wrong
- A 302 to a `tpx.li` URL means the prebuilt-link path is working
- A 302 to a direct partner URL means the partner-links API is working

### Acceptance Criteria

- [ ] `GET /go/{slug}` returns HTTP 302 (not 404) for at least one slug
- [ ] `affiliate_clicks` table has a new row matching the test click
- [ ] The destination URL contains a Travelpayouts marker (`?marker=` or `tpx.li` domain)
- [ ] No service-role key appears in any logs, headers, or client-visible response

### Rollback

Remove the env vars from Hostinger and rebuild. The redirector returns 404 — all prior URLs become inactive but no data is lost.

### Dependencies

- Active affiliate links in the database (at least one `affiliate_links` row with `status = 'active'`)
- Travelpayouts account approved and marker assigned
- Hostinger Node.js app configured (already confirmed as of 2026-10-09)

---

## Phase 1 — First Content Wave

**Goal:** At least 15 published offer pages across 3–4 sections; at least 2 countries each for 2 sections (enabling country pages in sitemap).

**Estimated effort:** 10–20 hours of authoring

**Parallel-safe:** Yes — can begin while Phase 0 is in progress (offers can be pre-authored in draft)

### Tasks

**1.1 Author 5 `tours-activities` offers**

Priority destinations: Rome, Kyoto, Barcelona (already have legacy URL redirects in `next.config.ts`), plus 2 new destinations. Programmes: Viator, GetYourGuide, Klook, Tiqets.

Offer file location: `content/offers/viator/<slug>.json`

Required fields per file:
```json
{
  "programme": "viator",
  "section": "tours-activities",
  "title": "...",
  "slug": "...",
  "country": "italy",
  "city": "rome",
  "source_url": "https://www.viator.com/tours/...",
  "read_on": "2026-10-XX",
  "affiliate_url": "https://www.viator.com/tours/...",
  "facts": {
    "images": ["https://..."],
    "image_credit": "Viator / partner name",
    "rating": 4.8,
    "inclusions": ["Skip-the-line entry", "Expert guide"],
    "duration_minutes": 180
  },
  "summary": "One-sentence description for card and meta.",
  "body": "800+ character editorial body..."
}
```

**1.2 Author 5 `sim-cards` offers**

Programmes: Airalo, Saily. Products: country-specific eSIM plans for Japan, Europe, Thailand, USA, Global.

**1.3 Author 5 `car-rentals` offers**

Programmes: EconomyBookings, QEEQ, Localrent. Destinations: Spain, Italy, Portugal (popular self-drive countries). Import already has the slug format.

**1.4 Import all offers**

```bash
# Dry run first:
node --env-file=.env.local scripts/import-offers.mjs --dry

# Publish:
node --env-file=.env.local scripts/import-offers.mjs --publish
```

**1.5 Verify sitemap**

After import, visit `https://wandermetric.com/sitemap.xml` and confirm:
- New offer URLs appear
- Country pages appear for any country with 3+ offers in a section

### Acceptance Criteria

- [ ] 15+ offer pages published in Supabase (status = 'published')
- [ ] At least 2 country pages have 3+ offers (triggering sitemap inclusion)
- [ ] Every published offer has a non-null `affiliate_link_id` pointing to an active link
- [ ] `npm run verify` passes (lint + typecheck + test + build)
- [ ] New offer URLs return HTTP 200 with correct canonical and open graph tags

### Rollback

Set `status = 'draft'` on any offers via the admin dashboard. No destructive action required.

### Dependencies

- Phase 0 (affiliate links exist in DB; import script resolves them)
- Access to partner listing pages (Viator, Airalo, EconomyBookings, etc.) for fact-sourcing

---

## Phase 2 — Conversion Loop Verification

**Goal:** At least one real affiliate conversion has been attributed to a specific offer page via the SubID chain; `affiliate_conversions` table has at least one row.

**Estimated effort:** Research-heavy (1–4 weeks elapsed time, ~4h active work)

**Note:** This phase may partially block on Travelpayouts statistics API availability. See WANDERMETRIC-OPEN-QUESTIONS.md Q1.

### Tasks

**2.1 Verify Travelpayouts statistics API**

Verify (do not assume) whether `GET https://api.travelpayouts.com/statistics/v1/...` or the equivalent endpoint:
1. Returns conversion data with sub_id values
2. Can be polled programmatically
3. Requires a webhook vs. pull model

Method: check the API documentation at `https://support.travelpayouts.com/` or the dashboard's "API" section. Test with the `TRAVELPAYOUTS_API_TOKEN` against a live endpoint using `curl` (not application code).

**2.2 Implement conversion ingestion**

Once the API is verified, add a scheduled function (Supabase Edge Function or a cron-triggered Next.js route) that:
1. Polls the statistics endpoint
2. Matches returned sub_id values to `affiliate_clicks.id`
3. Inserts rows into `affiliate_conversions`

**Schema of `affiliate_conversions`** (from migration 0006):
- `click_id` (nullable — unattributable conversions stay null, not guessed)
- `program_id`, `conversion_status`, `commission_amount`, `currency`, `booking_ref`, `raw` (JSONB)

**2.3 Schedule `rollup_daily_stats` cron**

The `rollup_daily_stats()` function is idempotent and must run nightly to aggregate `daily_stats`. Set up via Supabase scheduled functions or an external cron:

```sql
SELECT cron.schedule('rollup-daily', '0 2 * * *', 'SELECT rollup_daily_stats()');
```

**2.4 Enable uptime monitoring**

Set up an external uptime check on `https://wandermetric.com/api/v1/health` (or equivalent). This is listed in the roadmap as a prerequisite for meaningful traffic.

### Acceptance Criteria

- [ ] Travelpayouts statistics API endpoint is documented with: URL, auth method, response schema including sub_id field, rate limits
- [ ] OR: confirmed that statistics API is not available / does not return sub_id (update WANDERMETRIC-OPEN-QUESTIONS.md)
- [ ] `rollup_daily_stats` is scheduled and has run at least once
- [ ] `daily_stats` table has rows
- [ ] Uptime monitor is configured with alerting

### Rollback

Statistics ingestion is additive — no existing data is modified. Cron job can be dropped.

### Dependencies

- Phase 0 (affiliate redirector live — clicks must exist before conversions can reference them)
- Phase 1 (offer content published — SubID attribution only works if clicks happen)
- Travelpayouts API token in environment

---

## Phase 3 — Section Expansion

**Goal:** All 10 sections have at least 3 published offers; the 4 partner-less sections (`hotels`, `flights`, `trains-buses`, `package-tours`) have offers with direct affiliate links.

**Estimated effort:** 15–25 hours of authoring; 2–4h code (PARTNERS entries for hotels)

**Parallel-safe:** Yes, can proceed independently of Phase 2

### Tasks

**3.1 Populate `hotels` section**

- Add Booking.com to `src/core/affiliate/partners.ts` under a new or existing category
- Author 3–5 hotel-type offers (e.g., neighbourhood guides with Booking.com links)
- Note: `hotels` section has no `partnerCategory` in sections.ts — requires code change to add sidebar partners

**3.2 Populate `flights` section**

- `flights` section already has search tab via Aviasales on homepage
- Author 3–5 flight-route offers (e.g., "Flights from London to Tokyo" with Aviasales deep links)
- The `FLIGHT_ROUTE_CARD` / `FLIGHT_ROUTE_DETAIL` selects in `selects.ts` suggest the legacy tables; use the `offers` table instead

**3.3 Populate `trains-buses` section**

- No Travelpayouts programme active for trains/buses in this account
- Options: direct affiliate programme (Trainline, Omio, Rome2Rio) or a Travelpayouts programme covering rail
- Author 3–5 offers with whichever programme is approved first

**3.4 Populate `package-tours` section**

- No active Travelpayouts programme for package tours
- Consider: GetYourGuide multi-day tours, G Adventures, Intrepid (if available in Travelpayouts)
- Author 3–5 offers when programme is confirmed

**3.5 Add `transfers` and `insurance` depth**

- `transfers` has 5 PARTNERS entries — add 3–5 city-specific transfer offers (e.g., "Airport transfers in Bangkok")
- `insurance` has EKTA — add destination-specific insurance offers (e.g., "Travel insurance for Japan")

**3.6 Reach 5+ offers per priority section**

- `tours-activities`: target 20 offers across 4–5 countries
- `sim-cards`: target 10 offers (country + regional + global plans)
- `car-rentals`: compare page is live; add 10 offers across Europe/Asia

### Acceptance Criteria

- [ ] All 10 sections show on homepage with offer count > 0
- [ ] At least 3 published offers per section
- [ ] Country pages for at least 5 countries appear in sitemap
- [ ] No section page returns 404

### Rollback

Revert PARTNERS additions via git; set new offers to draft.

### Dependencies

- Phase 1 (import pipeline validated)
- Active affiliate links for new programmes (`scripts/import-offers.mjs` requires these)

---

## Phase 4 — Compare Pages and Partner Display

**Goal:** All 6 `COMPARE_SECTIONS` have authored comparison data; compare pages are indexed and driving clicks.

**Estimated effort:** 4–8h authoring (no code changes needed beyond data file)

**Parallel-safe:** Yes

### Tasks

**4.1 Author compare data for remaining 5 sections**

File: `src/core/affiliate/compare.ts` — add entries for:
- `esim` (Airalo, Yesim, Saily, Drimsim) — criteria: countries covered, price tier, plan types, speeds
- `transfers` (Welcome Pickups, Kiwitaxi, GetTransfer, Intui.travel, Radical Storage) — criteria: type, cities, price model, cancellation
- `insurance` (EKTA + others if added) — criteria: age range, coverage, price
- `things-to-do` (Tiqets, Klook, KKday, Go City, WeGoTrip) — criteria: types, booking model, mobile tickets
- `claims` (AirHelp, Compensair) — criteria: no-win-no-fee, eligibility, timeline

**4.2 Verify compare pages render correctly**

```bash
# Start dev server
npm run dev
# Visit /compare/esim, /compare/transfers, etc.
```

**4.3 Add GigSky to PARTNERS if link is active**

GigSky (ID 636, 20%, SIM-cards) is in Travelpayouts My Programs but absent from `src/core/affiliate/partners.ts`. Before adding:
1. Confirm an active affiliate link exists in `affiliate_links` with a GigSky slug
2. Add entry to `partners.ts` under `esim` category
3. Add to compare data if relevant

### Acceptance Criteria

- [ ] All 6 COMPARE_SECTIONS have entries in `compare.ts`
- [ ] All compare pages (`/compare/{section}`) return HTTP 200
- [ ] `READ_ON` dates in compare.ts are current (within 30 days of authoring)
- [ ] Compare pages have canonical, noindex=false, JSON-LD breadcrumbs

### Rollback

Remove compare data additions from `compare.ts` — pages fall back to empty state (no data shown).

### Dependencies

- Phase 3 (sections populated; compare data is most useful when offers exist)
- Affiliate links for all compared partners active in DB

---

## Phase 5 — Widget Integration

**Goal:** At least 5 high-value Travelpayouts widgets are embedded on relevant section or country pages, each displaying live partner products after cookie consent.

**Estimated effort:** 4–8h (widget embedding + consent integration + testing)

**Note:** Widget embeds are JavaScript drops — no API calls, no product data stored in DB. Attribution flows through the widget's own marker.

### Tasks

**5.1 Confirm cookie consent gate works for third-party scripts**

Verify `src/components/analytics/consent.tsx` loads third-party scripts only after the user accepts. Test in a fresh browser session with no prior consent.

**5.2 Embed priority widgets**

Priority order (by section traffic and commission):
1. Airalo eSIM search widget → `/sim-cards` section page
2. Klook activity search widget → `/tours-activities` section page
3. Tiqets attraction widget → `/tours-activities/{country}` pages (high-traffic countries)
4. Welcome Pickups transfer widget → `/transfers` section page
5. Aviasales flight search → already on homepage; verify it loads after consent

**5.3 Test widget rendering and attribution**

For each widget:
- Confirm it renders after consent acceptance
- Confirm clicks open in a new tab to the partner's site
- Confirm the URL contains Travelpayouts marker (inspect the href before clicking)
- Confirm the widget does NOT render before consent

**5.4 Monitor widget performance**

After 2 weeks, check Travelpayouts widget analytics for impression and click counts. Remove widgets that show 0 interaction and replace with alternatives.

### Acceptance Criteria

- [ ] At least 5 widgets embedded and confirmed rendering after consent
- [ ] No widget renders before cookie consent is given
- [ ] No widget is embedded in the `/go/` path or admin pages
- [ ] `npm run verify` passes with widget component additions

### Rollback

Remove widget components from section pages. No DB changes required.

### Dependencies

- Phase 1 (section pages have offers — empty pages with only a widget are thin)
- Cookie consent component working (already implemented)
- Production build deployed (Phase 0)

---

## Phase 6 — News and Editorial Velocity

**Goal:** The news system publishes its first 5 articles; news pages appear in sitemap and news-sitemap.xml; Google News eligibility requirements are understood.

**Estimated effort:** 2h setup + authoring time

**Parallel-safe:** Yes

### Tasks

**6.1 Verify news system end-to-end**

The news system code exists (`src/app/(public)/news/`, `src/core/news/`, `tests/news.test.ts`) but no articles are published.

1. Run existing tests: `npm run test` — confirm `tests/news.test.ts` passes
2. Publish one test article via admin dashboard
3. Verify `/news` page returns 200 (was returning noindex when empty)
4. Verify `/news/{slug}` page renders with correct JSON-LD (`NewsArticle` schema)
5. Verify `/news-sitemap.xml` contains the article

**6.2 Understand Google News eligibility**

Google News eligibility requires: consistent publishing schedule, valid news sitemap, author attribution, original reporting. The `public_authors` view (migration 0018) is already set up for author display.

**6.3 Author first 5 news articles**

Topics aligned with the platform's affiliate sections:
- Travel eSIM comparison update
- Best tours in [destination]
- Travel insurance guide update
- Airport transfer booking tips
- Car rental in [destination]

### Acceptance Criteria

- [ ] `tests/news.test.ts` passes
- [ ] At least 5 news articles published
- [ ] `/news` returns HTTP 200 with noindex=false (requires ≥1 article)
- [ ] `/news-sitemap.xml` validates as a valid Google News sitemap
- [ ] Each article has valid JSON-LD NewsArticle schema including author

### Rollback

Set articles to draft. News pages return to noindex state.

### Dependencies

- Phase 0 (production deployment to confirm news sitemap is served)
- At least one author profile in `profiles` with `is_active = true` and a published guide or news article

---

## Phase 7 — Security Hardening (Pre-Traffic)

**Goal:** The security checklist from `docs/roadmap.md` is complete before significant search traffic arrives.

**Estimated effort:** 4–8h

**Parallel-safe:** Yes (independent of content phases)

### Tasks

**7.1 Enable MFA on admin accounts**

All accounts with `role = 'admin'` or `role = 'editor'` in `profiles` must have MFA enabled in Supabase Auth. This cannot be enforced by application code — requires manual configuration per account in the Supabase dashboard.

**7.2 Implement Content-Security-Policy (report-only first)**

`next.config.ts` notes: "Full CSP deferred until real script/style/image origins are known."

Now that the script/style/image origins are known (Supabase, Travelpayouts widgets, Google Analytics), define and add a `Content-Security-Policy-Report-Only` header. Monitor violations for 2 weeks before switching to enforcement mode.

Known origins required:
- `script-src`: own domain, Google Analytics (`www.googletagmanager.com`), Travelpayouts widgets (`tp.media`, `c.tpv2.com`)
- `style-src`: own domain + `'unsafe-inline'` (Tailwind CSS)
- `img-src`: own domain, Supabase storage, partner CDNs, Google Analytics
- `connect-src`: own domain, Supabase (`*.supabase.co`), Travelpayouts API

**7.3 Database restore drill**

Verify Supabase point-in-time recovery works by restoring to a test branch. Confirm row counts match. Document the recovery time. This is a prerequisite for confidence before traffic growth.

**7.4 Verify audit_log is append-only**

Migration 0008 sets `audit_log` with no insert/update/delete policy for any role — append-only via service role. Verify with a test query that authenticated editors cannot insert into audit_log directly.

### Acceptance Criteria

- [ ] All admin/editor accounts have MFA enabled
- [ ] `Content-Security-Policy-Report-Only` header present on production responses
- [ ] Zero CSP violation reports after 1 week (or all violations are from known, benign sources)
- [ ] Database restore drill completed and time-to-recovery documented
- [ ] `audit_log` INSERT blocked for `authenticated` role (test with anon key)

### Rollback

Remove CSP header if it causes false positives. All other tasks are additive.

### Dependencies

- Phase 0 (production deployment — CSP test requires real traffic/responses)

---

## Phase 8 — Data API Access Requests

**Goal:** Formal requests submitted to Travelpayouts for Data API and/or Data Files access for the highest-value programmes; a response is documented.

**Estimated effort:** 2h (request drafting) + elapsed wait time

**Prerequisite:** WANDERMETRIC-OPEN-QUESTIONS.md Q2, Q3 resolved first

### Tasks

**8.1 Identify highest-value programmes for Data API requests**

Priority based on commission × volume potential:
1. Viator (8%, tours-activities — rich product data)
2. GetYourGuide (8%, tours-activities)
3. Airalo (11%, sim-cards — structured plan data)
4. Booking.com (4%, hotels — if programme data includes property details)

**8.2 Submit Data API / Data Files requests**

In Travelpayouts dashboard: navigate to each programme's "Data API" or "Data Files" section and submit a request. Document:
- Date of request
- Programme name and ID
- Feature requested (Data API vs. Data Files)
- Expected response timeline

**8.3 Verify API schema before building ingestion**

**Do not build ingestion before the schema is confirmed.** When access is granted:
1. Inspect the actual API response structure (or CSV/JSON column names)
2. Map to `affiliate_offers` table columns
3. Check usage rights: confirm partner data can be displayed on the website
4. Only then implement ingestion

**8.4 Build ingestion when access + schema are confirmed**

The `affiliate_offers` table (migration 0005) is positioned for this:
```sql
affiliate_offers: program_id, external_id, title, description, destination_url,
  image_url, price_amount, price_currency, rating, city_id, hotel_id, activity_id,
  raw (jsonb), fetched_at, expires_at
```

**Comment in migration:** "Populated only by real provider responses — never hand-written or synthesised."

### Acceptance Criteria

- [ ] Requests submitted for ≥2 priority programmes
- [ ] Requests and responses documented in `docs/data-api-access.md` (new file)
- [ ] API schema documented before any ingestion code is written
- [ ] Usage rights confirmed in writing before any partner data is displayed

### Rollback

Data API access is additive. No existing functionality is affected.

### Dependencies

- Phase 0–2 completed (platform proven to work; access requests require a live site)
- WANDERMETRIC-OPEN-QUESTIONS.md Q2, Q3 resolved

---

## Phase 9 — Newsletter and Email Activation

**Goal:** The first newsletter campaign is sent to confirmed subscribers; double opt-in confirmation emails are working.

**Estimated effort:** 4–8h (ESP integration)

**Parallel-safe:** Yes

### Tasks

**9.1 Choose and integrate an ESP**

The `POST /api/v1/subscribe` endpoint stores subscribers as `pending` in `email_subscribers`. An ESP must be configured to:
1. Send confirmation emails (double opt-in)
2. Update `status = 'subscribed'` via webhook when confirmed

Candidates (no existing selection): Resend (developer-friendly), Postmark (reliability), Loops (travel vertical). Evaluate against: EU privacy compliance, webhook support, Supabase integration ease.

**9.2 Implement double opt-in flow**

1. ESP webhook updates `email_subscribers.status = 'subscribed'` on link click
2. Confirmation page added (`/confirm?token=...` or handled by ESP)
3. No marketing emails sent to `pending` subscribers

**9.3 Define subscriber source tracking**

The `email_subscribers.source` field already exists. Ensure the subscribe form passes `source` correctly (e.g., `"footer"`, `"offer-page"`, `"news"`) for segment analysis.

**9.4 Send first campaign**

Content: "Top 5 travel discoveries this week" — links to recent offer pages. All links go through `/go/[slug]` for attribution.

### Acceptance Criteria

- [ ] Confirmation email sends within 60 seconds of form submission
- [ ] Click on confirm link sets `status = 'subscribed'` in `email_subscribers`
- [ ] `status = 'pending'` subscribers receive no marketing emails
- [ ] First campaign sent to ≥10 confirmed subscribers
- [ ] ESP GDPR/privacy settings reviewed (no IP tracking, unsubscribe link in every email)

### Rollback

Remove ESP integration. Subscribers revert to `pending` state. No data is lost.

### Dependencies

- Phase 1 (content to link in newsletters)
- Phase 0 (production deployment — confirmation emails need live URLs)

---

## Dependency Map

```
Phase 0: Production Activation
  └── Phase 1: First Content Wave (can start in parallel)
       └── Phase 2: Conversion Loop (depends on live clicks)
       └── Phase 3: Section Expansion (parallel-safe)
            └── Phase 4: Compare Pages (parallel-safe)
            └── Phase 5: Widget Integration (parallel-safe)
  └── Phase 6: News System (parallel-safe)
  └── Phase 7: Security Hardening (parallel-safe)
  └── Phase 8: Data API Requests (depends on site being live)
  └── Phase 9: Newsletter (parallel-safe)
```

---

## Quick Wins (Can Start Immediately, No Dependencies)

These do not require Phase 0 to be complete:

1. **Author offer JSON files** — write to `content/offers/<programme>/` locally; import when ready
2. **Request Travelpayouts Data API access** — can be submitted from the dashboard now
3. **Research Travelpayouts statistics API** — documentation review, no code needed
4. **Author compare data** for remaining 5 sections in `compare.ts` locally
5. **Enable MFA** on admin Supabase accounts — independent of code
6. **Draft CSP header** — design the policy based on known origins now; implement after Phase 0

---

## What Is Explicitly Out of Scope

These items are **not** in this roadmap and require a separate decision:

- Rebuilding the architecture or switching from Next.js / Supabase
- Scraping partner widget content (not permitted)
- Storing invented prices, ratings, or availability
- Implementing conversion tracking before the statistics API is verified
- Publishing Data API data before usage rights are confirmed
- Social media auto-publishing (human-in-the-loop per roadmap policy)
- Mobile app (OpenAPI-based; requires API stabilisation first)
- White Label Travelpayouts setup (metasearch engine; separate product decision)

---

*See WANDERMETRIC-OPEN-QUESTIONS.md for items that must be resolved before certain phases can complete.*
