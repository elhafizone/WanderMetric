# WANDERMETRIC — TRAVELPAYOUTS CAPABILITY AUDIT

**Account:** el.hafizone@gmail.com · ID 705982  
**Audit date:** 2026-10-20  
**Method:** Read-only inspection of authenticated dashboard  
**Scope:** All approved programmes, all platform tools, all reporting sections

---

## A. EXECUTIVE SUMMARY

### What was audited

The authenticated Travelpayouts affiliate dashboard at `app.travelpayouts.com` was inspected across seven sections: My Programs, Link Generation, Widgets, Promo Codes, Other Tools (Links API / Data API / Data Files), White Label, and Reports. Individual programme detail pages were visited for Klook (ID 137) and Yesim (ID 224); programme IDs for all 25 programmes were extracted via JavaScript from the My Programs page. All navigation sub-sections visible in the authenticated sidebar were visited.

### Key findings

1. **25 programmes, not 26.** The dashboard shows "Available 25" in My Programs. If the briefing document specified 26, one programme is either not yet approved or was counted in error. No 26th programme appeared anywhere in the dashboard.

2. **Travelpayouts is an attribution network, not a product database.** The platform tracks clicks and conversions through affiliate links. It does not host a searchable product catalog. No route through the authenticated dashboard yields a structured feed of offers (tours, car hire listings, transfer quotes, etc.) without explicitly requesting Data API access per programme.

3. **Links API is confirmed and functional.** `POST https://api.travelpayouts.com/links/v1/create` converts any partner URL into a tracked affiliate link and returns a `tpx.li` short URL. This is what powers `/go/[slug]` in WanderMetric today. Bulk generation is supported and documented in the Help Center.

4. **Data API exists but is gated.** Listed under "Other tools" with the note "Available in some programs on request." It is not automatically accessible for any of the 25 programmes. No API credentials or endpoint documentation was exposed in the authenticated dashboard itself. Access requires contacting individual partner programmes.

5. **Data Files exist but are also gated.** Listed alongside the Data API under "Other tools" with "Learn how to access" pointing to the same Help Center category (200358578). No files are visible or downloadable in the current account state.

6. **42 widgets available across 17 of 25 programmes.** These are embeddable JavaScript search forms and product-display widgets. Several (Klook tours widget, Tiqets specific-tour widget, WeGoTrip specific-tours widget) render live product data including prices, ratings, and images — but as embedded UI components, not as data APIs. 8 programmes have no widgets at all.

7. **Sub ID tracking is confirmed in the account.** The Performance report offers a "Group by SubID" dimension, confirming Sub ID parameters pass through and are recorded for analysis.

8. **Drive AI tool is not connected.** Drive is a blog-monetization JavaScript inject system for travel bloggers. It is not relevant to WanderMetric's page-based architecture and has not been set up.

9. **White Label is available but not set up.** The White Label product creates a hosted flights-and-hotels metasearch engine on a custom domain (CNAME). Zero White Labels have been created for this account.

10. **Content Analytics is locked behind Drive.** The third Reports tab ("Content analytics") requires Drive to be connected. No per-page or per-offer conversion attribution is currently visible.

---

## B. PROGRAMME CAPABILITY MATRIX

All 25 approved programmes. IDs were extracted from the My Programs page on 2026-10-20.

| # | Programme | ID | Reward | Cookie | Section | Widgets | Promo Code | Notes |
|---|-----------|-----|--------|--------|---------|---------|------------|-------|
| 1 | Klook | 137 | 2–5% (temp: 12%) | 7–30 days | Tours & Activities | ✓ (1) | — | Hot programme; temp 12% Oct 2026; Hotels 8% through Dec 2026 |
| 2 | Yesim | 224 | 18% | 90 days | SIM-cards | — | ✓ (in description) | Swiss eSIM; 150+ countries; code `travelpayouts2024` |
| 3 | Kiwitaxi | 1 | 9–11% | 30 days | Transfers | ✓ (5) | — | White Label 2.0 widget available |
| 4 | Localrent.com | 87 | 7.5–10% | 30 days | Car Rentals | ✓ (2) | — | White Label widget included |
| 5 | Welcome Pickups | 627 | 8–9% | 45 days | Transfers | ✓ (1) | — | Shuttle search form |
| 6 | Tiqets | 89 | 3.5–8% | 30 days | Tours & Activities | ✓ (3) | — | Specific tour, popular tours, availability calendar |
| 7 | Kiwi.com | 111 | 3% | 30 days | Flights | ✓ (5) | — | Full flight widget suite including search results |
| 8 | GigSky | 636 | 20% / fixed | 30 days | SIM-cards | — | — | 20% or fixed reward for additional services |
| 9 | Airalo | 541 | 12% | 30 days | SIM-cards | ✓ (1) | — | eSIM search form |
| 10 | GetTransfer.com | 147 | 4–25% | 30 days | Transfers | — | — | No widget |
| 11 | Drimsim | 102 | €8 fixed | 90 days | SIM-cards | — | — | No widget |
| 12 | GetRentacar.com | 222 | 10% | 90 days | Car Rentals | ✓ (1) | — | Search form |
| 13 | AirHelp | 120 | 15–16.6% | 45 days | Insurance/Other | ✓ (1) | ✓ | Active promo: 11% off AirHelp+ subscriptions (until Nov 30) |
| 14 | Go City | 62 | 3.4–6% | 90 days | Tours & Activities | — | ✓ | Active promo: up to 65% off San Diego children's passes (until Oct 22) |
| 15 | Economybookings.com | 10 | 3–8% | 30 days | Car Rentals | ✓ (2) | — | Search form + dynamic banner |
| 16 | BikesBooking.com | 57 | 4% | 30 days | Car Rentals | ✓ (1) | — | Rental bikes search form |
| 17 | QEEQ | 172 | 5–10% | 30 days | Car Rentals | ✓ (1) | — | Rental cars search form |
| 18 | WeGoTrip | 150 | 6.64–41.5% | 30 days | Tours & Activities | ✓ (1) | — | Specific tours widget; wide commission range |
| 19 | AutoEurope (EU,UK) | 143 | 4.4–8% | 30 days | Car Rentals | ✓ (1) | — | Car rental search form |
| 20 | Radical Storage | 209 | 8% | 30 days | Travel Services | — | — | No widget |
| 21 | Aviasales | 100 | 40% | 30 days | Flights | ✓ (5) | — | Hot programme; flight search suite + pricing calendar |
| 22 | intui.travel | 22 | 10% | 35 days | Transfers | ✓ (10) | ✓ | Most widgets of any programme; active promo: 5% off (until Oct 31) |
| 23 | Compensair | 86 | €5–12 fixed | 30 days | Flights (compensation) | ✓ (2) | — | Flight compensation claim widgets |
| 24 | Saily | 629 | 15% | 30 days | SIM-cards | — | — | No widget |
| 25 | KKday | 633 | 1–5% | 30 days | Tours & Activities | — | — | No widget despite being tours programme |

**Widget counts:** ✓ (N) = number of widgets available. Programmes without mark have no widgets.

**8 programmes with no widgets at all:** Yesim, GigSky, GetTransfer.com, Drimsim, Go City, Radical Storage, Saily, KKday.

---

## C. PLATFORM-LEVEL CAPABILITIES

### C.1 Partner Links API ("Links API")

- **Status:** Confirmed available. Listed as "New" in Other Tools.
- **URL:** `https://api.travelpayouts.com/links/v1/create` (POST)
- **Function:** Converts any partner-domain URL into a tracked `tpx.li` short affiliate link. Returns the short URL. Does NOT supply product data.
- **Bulk support:** Yes — documented as supporting bulk link generation.
- **Sub ID support:** Yes — Sub ID parameter accepted at link creation and tracked in reports.
- **Authentication:** API key required. No API key is visible in the dashboard UI; it is accessed via account settings or documentation.
- **WanderMetric usage today:** Powers `/go/[slug]` — affiliate links are stored in the `offers` table and redirected at runtime.
- **Help Center article:** `support.travelpayouts.com/hc/en-us/articles/25289759198226`

### C.2 Data API

- **Status:** Exists, but access is gated per-programme and requires a separate request.
- **Dashboard description:** "Get raw and aggregated data on brands' deals or clicks and bookings via your affiliate tools. Available in some programs on request, this tool reduces integration costs and streamlines content creation."
- **What it appears to offer:** Raw product/deal data from individual partner brands; potentially structured pricing, availability, or offer data.
- **Current access state:** Not enabled for any programme in this account. No endpoint, credentials, or sample data visible in the dashboard.
- **Access path:** "Learn how to access" links to Help Center category 200358578. No in-dashboard request mechanism observed (no form or button was clicked).
- **Risk note:** "Available in some programs on request" implies not all 25 programmes offer Data API access. Which programmes support it, under what terms, and with what data schema is unknown without requesting access.

### C.3 Data Files

- **Status:** Listed in "Other tools" alongside Data API; same gating.
- **Dashboard description:** "Download files and other data with directories. Use data files for mass generation of links or content creation. Files are kept up-to-date. Easy to export and embed."
- **Current access state:** Not available in this account. No file downloads, directory listings, or sample files are visible.
- **Access path:** Same Help Center category as Data API (200358578).
- **Likely format:** CSV/JSON directories of partner inventory, kept updated, for bulk affiliate link generation or content creation workflows.

### C.4 Widgets (42 total)

- **Total count:** 42 embeddable widgets across 17 of 25 programmes (2 pages in the widget gallery).
- **Widget types observed:**
  - **Live product display** (Klook tours, Tiqets specific tour, WeGoTrip tours): renders photos, ratings, prices fetched live from the partner
  - **Search forms** (Kiwi.com, Aviasales, Kiwitaxi, etc.): user-facing booking search interfaces
  - **White Label** (Kiwitaxi × 2, Localrent.com, intui.travel): full white-label search experiences
  - **Dynamic banners** (Economybookings.com): animated promotional banners
  - **Availability calendar** (Tiqets): shows tour availability calendar
  - **Compensation claim form** (AirHelp, Compensair): flight compensation submission forms
  - **Pricing map** (Aviasales): interactive map with flight prices

- **Widget data exposure:**
  - Product-display widgets render live data (prices, images, ratings) but as browser-rendered DOM, not as a structured data API.
  - Search form widgets send user queries to partner backends; they do not return structured data to the host site.
  - No widget type exposes a callable JSON endpoint that WanderMetric could use to populate its database.

- **Klook widget live data observed (evidence tier 1):**
  - Bosphorus Strait Afternoon Cruise, Istanbul — US$32.00, rating 4.2 (104 reviews)
  - Istanbul Classics Tour — US$49.00, rating 4.3 (26 reviews)
  - Images served from `res.klook.com`

### C.5 Promo Codes

Three active promo codes as of 2026-10-20 (all programmes listed in the Promo Codes tool):

| Programme | Valid dates | Discount | Description |
|-----------|-------------|---------|-------------|
| Go City | Oct 16–22, 2026 | Up to 65% | Children's passes in San Diego |
| intui.travel | Aug 13–Oct 31, 2026 | 5% | Any dates, any destinations |
| AirHelp | Jun 25–Nov 30, 2026 | 11% | AirHelp+ Smart and Pro subscriptions |

- "Flash deals" toggle also visible but no flash deals active.
- Yesim has an evergreen promo code (`travelpayouts2024`, 3€ off for new users) listed in programme description — this is NOT in the Promo Codes tool.
- Promo codes generate tracked affiliate links (same mechanism as regular links). They are discount codes that partners issue; affiliates share the link+code combination.

### C.6 White Label

- **WL Web:** Available but no integrations created. Creates a metasearch engine (flights + hotels) hosted on affiliates' own domain via CNAME. Three setup articles in the Help Center.
- **WL App:** Tab visible; not inspected (no app integrations exist).
- **Relevance to WanderMetric:** Low — WanderMetric is a Next.js site, not a metasearch host. The Kiwi.com and Aviasales widgets already provide flight search. Hotels White Label would be a separate product direction.

### C.7 Drive

- **Status:** NOT connected for Wandermetric account.
- **What it is:** AI-powered JavaScript snippet that injects affiliate links, recommendations, and previews into travel blog articles. Also unlocks Content Analytics.
- **Features:** Switch Links, Link Relevant Keywords, Insert Recommendations, Display Smart Previews, Targeted Offers.
- **Relevance to WanderMetric:** Designed for travel bloggers with long-form articles. WanderMetric's offer pages are structured editorial content, not free-form prose where Drive's auto-injection would be appropriate.

### C.8 Chrome Extension

- **Status:** Listed in Other Tools as "New version." Available in Chrome Web Store.
- **URL:** `chromewebstore.google.com/detail/travelpayouts/mkflfhejpbpoinpcenpmfpbfgkeldfod/related?hl=en`
- **Function:** Generates affiliate links and QR codes while browsing partner websites.
- **Relevance:** Content authoring tool — useful for creating the `source_url` and initial affiliate link when researching new offers to add to WanderMetric.

### C.9 WordPress Plugin

- Listed as "Recommended" in Other Tools.
- Adds flight, tour, hotel, and car rental widgets to WordPress sites.
- Available at `wordpress.org/plugins/travelpayouts/`.
- Not relevant to WanderMetric (Next.js, not WordPress).

### C.10 Reporting & Attribution

The dashboard exposes three report tabs:

| Section | URL | What it shows | Current data |
|---------|-----|---------------|-------------|
| Performance | `/statistics/summary` | Clicks, impressions, pending/confirmed/cancelled bookings, eCPC, earnings grouped by programme/day/month/SubID/country/device | 12 clicks last 30 days; 0 bookings; active programmes: Klook (5), Aviasales (4), Tiqets (2), Economybookings (1), Hotellook (0) |
| Bookings | `/statistics/actions` | Individual booking records with status | No data (0 bookings) |
| Content Analytics | `/statistics/content_analytics` | Per-page traffic, clicks, conversions | Locked — requires Drive |

**Hotellook note:** Hotellook (a Travelpayouts hotel metasearch programme) appears in the Performance filter even though it is NOT listed in My Programs. This suggests either a historical programme approval or a system default. It is not in the 25 active programmes.

---

## D. DATA FIELD MATRIX

Evidence tiers:
- **T1** — Verified in account: seen directly in dashboard, widget, or API response
- **T2** — Documented but access unverified: in Help Center / programme description, not tested live
- **T3** — Requires separate partner API request: Data API, gated per programme
- **T4** — Requires editorial authorship: no automated source exists
- **T5** — Unknown: no evidence in either direction

| Data field | T1 | T2 | T3 | T4 | T5 | Notes |
|------------|----|----|----|----|-----|-------|
| Affiliate link URL (tracked) | ✓ | | | | | Links API produces `tpx.li` URL for any partner page |
| Programme reward rate | ✓ | | | | | Shown on My Programs and programme About page |
| Commission tiers / categories | ✓ | | | | | Detailed in programme About page |
| Excluded categories | ✓ | | | | | Shown in Klook About; likely available for all programmes |
| Cookie lifetime | ✓ | | | | | Shown on My Programs page |
| Mobile tracking platforms | ✓ | | | | | Desktop / Mobile web / App per programme |
| Allowed promotion channels | ✓ | | | | | Content creation, cashback, travel biz, personal, coupons |
| Programme description (text) | ✓ | | | | | Available in About page; editorial-quality prose already present |
| Promo code (discount codes) | ✓ | | | | | 3 active codes; Yesim has evergreen code in description |
| Tour/activity name | | | ✓ | ✓ | | Via Data API if approved; otherwise editorial |
| Tour/activity price | | | ✓ | | | Live in widgets (DOM), not in a callable API |
| Tour/activity rating + review count | | | ✓ | | | Live in product-display widgets (DOM only) |
| Tour/activity images | | | ✓ | | | Klook widget renders `res.klook.com` CDN images; no direct access |
| Tour/activity description | | | ✓ | ✓ | | Via Data API or editorial authorship |
| Tour/activity availability | | | ✓ | | | Tiqets Availability Calendar widget shows this live (DOM only) |
| Tour/activity duration | | | ✓ | ✓ | | Via Data API or editorial |
| Car hire pricing | | | ✓ | | | Dynamic banner widget shows prices (DOM only) |
| Flight fares | | ✓ | | | | Aviasales/Kiwi.com widgets show live fares (search result widgets; DOM only) |
| Hotel rates | | ✓ | | | | White Label includes hotel search; no standalone hotel data feed visible |
| Transfer pricing | | | ✓ | | | intui.travel widget shows pricing (79.73 EUR observed); DOM only |
| eSIM plan names + prices | | | ✓ | ✓ | | Programme descriptions mention countries; no feed seen |
| Car hire provider details | | | ✓ | ✓ | | Economybookings widget mentions Alamo, Avis, Budget, Enterprise, Hertz; editorial needed |
| Source URL (partner page URL) | ✓ | | | | | Any valid partner URL is accepted by Links API |
| Sub ID / campaign tracking | ✓ | | | | | SubID accepted at link creation; reports show Sub ID dimension |
| Booking conversion (confirmed) | ✓ | | | | | Reports tab confirms/pending/cancelled; currently 0 bookings |
| Per-page click attribution | | | | | ✓ | Content Analytics locked behind Drive; no per-slug tracking today |

**Bottom line:** The only fields unambiguously available without any additional request or editorial work are: affiliate link, reward rate, commission tiers, cookie lifetime, mobile platforms, allowed channels, and programme description. All product-level data (prices, ratings, images, availability) is either behind the gated Data API, available only via DOM scraping of widgets, or requires editorial authorship.

---

## E. AUTOMATION OPPORTUNITIES

### E.1 Link generation at scale (confirmed, usable today)

The Links API accepts a partner page URL and returns a `tpx.li` affiliate link. This already powers WanderMetric's `/go/[slug]` redirect mechanism. Automation opportunity: given a list of partner product page URLs, a script can batch-call the Links API to pre-generate tracked short links for each offer — removing one manual step from the offer import workflow.

**Constraint:** The API does not supply the partner product page URLs. A human must still navigate to each product on each partner's website to obtain the source URL. The automation shortens the click path but does not remove editorial judgment.

### E.2 Widget embedding (confirmed, usable today)

42 widgets can be embedded via JavaScript snippet. Product-display widgets (Klook, Tiqets, WeGoTrip) render live data including prices, ratings, and images with no additional setup. This is immediately actionable:

- A Klook city-category widget on a `/tours-activities/turkey` page would render live tours with prices.
- A Tiqets specific-tour widget on a single offer page would render the live availability calendar.
- Aviasales/Kiwi.com flight search forms can be embedded on flight-related pages.

**Constraint:** Widgets are UI components, not data APIs. They cannot populate the WanderMetric database. They require JavaScript in the browser, which conflicts with Next.js static rendering (`export const revalidate = 3600`) unless embedded via a client component. The `NEXT_PUBLIC_*` pattern would need to be followed for any widget keys.

### E.3 Sub ID parameter enhancement (confirmed, usable today)

Sub IDs already flow through the Links API. The `offer_section`, `country_slug`, and offer `slug` could be passed as Sub IDs to enable per-page attribution in the Performance report (Group by SubID). This requires no new platform access — only a change to how WanderMetric constructs affiliate link URLs.

**Current limitation:** Without Content Analytics (which requires Drive), attribution stays at the click level only; confirmed bookings are reported by programme but not by page.

### E.4 Data API integration (conditional, requires per-programme approval)

If Data API access were granted by a partner programme, a nightly script could:
1. Fetch structured product data (names, descriptions, prices, ratings) from the programme's feed
2. Hydrate the `facts` JSONB column with fresh data
3. Potentially auto-generate offer body text from structured fields

**Blocker:** No programme has granted Data API access for this account. Which of the 25 programmes even offer Data API access is unknown. The dashboard says "some programs on request." This requires contacting each programme's support team and is uncertain.

### E.5 Data Files (conditional, requires access setup)

If Data Files were available, they could provide pre-built CSV/JSON partner inventories for bulk offer creation. Same blocker as Data API — access must be requested and is not guaranteed.

### E.6 Promo code links (confirmed, low effort)

For the three programmes with active promo codes (Go City, intui.travel, AirHelp), tracked links to the promo landing pages can be generated. These could power offer pages or promotional content. The "Get promo link" button in the dashboard UI would generate the link — this is the same Links API flow, not a new capability.

---

## F. WANDERMETRIC IMPLICATIONS

### F.1 The content pipeline remains the binding constraint

Nothing discovered in this audit removes the editorial authorship requirement. The database publish gate (800+ chars, facts, source URL, active link) exists because there is no automated source for the 800 characters. The Data API might eventually reduce the authorship burden for programmes that grant access, but:
- Access is not currently granted for any of the 25 programmes.
- The Data API description says it reduces "integration costs" and "streamlines content creation" — it does not say it replaces editorial judgment.
- The schema's `body` column requires original editorial text regardless of what the Data API supplies.

### F.2 Widget embedding is the most immediately actionable enhancement

A client-side React component wrapping a Klook city-tours widget or a Tiqets availability calendar would add live product data to offer pages without touching the database. This requires:
- A new `<WidgetEmbed>` client component (small, uses `dangerouslySetInnerHTML` or script injection)
- The widget embed code from the "Customize and copy" flow (read-only; not executed during this audit)
- A widget attribution that does not conflict with the "no fabricated data" rule (widget data is live from the partner, not stored)

**Caution:** Widgets load third-party JavaScript. WanderMetric's consent gating in `src/components/analytics/consent.tsx` would need to cover widget scripts, since the CLAUDE.md notes that third-party scripts load only after cookie notice acceptance.

### F.3 Sub ID tracking upgrade is zero-cost

Encoding `section/country/slug` into the `sub_id` field when generating affiliate links enables per-page conversion attribution without any new platform approvals. The Performance report already supports "Group by SubID." This change is entirely within WanderMetric's code (`src/core/affiliate/` and `/go/[slug]`).

### F.4 The PARTNERS object understates actual capability

`src/core/affiliate/partners.ts` currently hardcodes 23 partners. The dashboard shows 25 active programmes. GigSky (ID 636) and Saily (ID 629) are active programmes not currently represented in the hardcoded list. If offer content were to be authored for them, the PARTNERS array would need updating.

### F.5 KKday is a gap worth addressing

KKday (ID 633, 1–5%, tours & activities) has no widget and no active promo code, but it is a significant tours platform (competitor to Klook). It has manually authored offer pages in `content/offers/kkday/` (based on prior session context). No widgets are available for live pricing — but the partner link tool works identically to Klook.

### F.6 Four tours programmes with no widgets represent a coverage gap

Go City, KKday, GetTransfer.com, and Radical Storage have no embeddable widgets. For GetTransfer.com (4–25% commission — the highest variable rate in the portfolio), this means offer pages can only show editorial content and a "Book now" button, with no live pricing. If Data API access were granted for GetTransfer.com, live pricing could be added.

### F.7 Hotellook's presence in Performance report is unresolved

Hotellook appears in the Performance filter despite not appearing in My Programs. This may represent a formerly-approved programme whose link still generates clicks. Before creating any Hotellook offer pages, the programme approval status must be confirmed through customer support.

---

## G. OPEN QUESTIONS

1. **Data API — which programmes support it?**  
   The dashboard says "available in some programs on request." No list of eligible programmes is surfaced in the account. Travelpayouts Help Center category 200358578 should clarify this. The most likely candidates based on category complexity are Klook, Tiqets, Aviasales, and Kiwi.com — but this is unverified.

2. **Data API — what does the schema look like?**  
   For any programme that grants Data API access, the field names, data types, update frequency, and rate limits are unknown. The audit found no sample response or schema document in the dashboard.

3. **Data Files — are they available for any of the 25 programmes right now?**  
   The dashboard lists Data Files as an existing feature with its own "Learn how to access" path, but no files are visible in the account. It is unclear whether Data Files are per-programme (like Data API) or platform-wide. If platform-wide, they may include an Aviasales flight-routes feed or similar.

4. **Links API — where is the API key?**  
   The CLAUDE.md confirms `TRAVELPAYOUTS_API_KEY` is in production env vars and the Links API works on the live site (`/go/[slug]` 302-redirects). But the API key is not exposed in the dashboard UI. If a new API key were needed, the account settings for generating one were not located during this audit.

5. **Programme IDs for link construction — are they used or is the API key sufficient?**  
   Some Travelpayouts documentation references programme IDs when constructing deep links for specific programmes (e.g. to route a Klook link through the Klook programme specifically). WanderMetric currently uses the generic Links API. Whether programme-specific routing matters for commission attribution is unverified.

6. **Hotellook — approved or historical?**  
   Appears in Performance filter but not in My Programs. Status unknown.

7. **GigSky and Saily — why are they missing from PARTNERS?**  
   Both are active SIM-card programmes with 20% and 15% reward rates respectively, but neither is in the 23-entry PARTNERS hardcoded list. This appears to be a gap in `src/core/affiliate/partners.ts`.

8. **Data API terms — content usage rights**  
   If a programme grants Data API access, do the terms permit WanderMetric to store and display the data in its database? Or only to display it via the partner's own widget? The dashboard provides no information on this.

---

## H. EVIDENCE REGISTER

All URLs visited during this audit on 2026-10-20. All pages loaded in the authenticated session of el.hafizone@gmail.com (account ID 705982). No forms were submitted, no settings were changed, no links were generated, and no widgets were activated.

| URL | Page title | Key finding |
|-----|------------|-------------|
| `app.travelpayouts.com/dashboard` | Dashboard | Balance $0; 11 clicks Oct 2026; "Drive is not connected" |
| `app.travelpayouts.com/programs?source=512658` | Programs \| My Programs | 25 programmes confirmed; all IDs extracted via JavaScript |
| `app.travelpayouts.com/programs/137/about` | Klook | Full programme detail; Tools nav: Links + Widgets |
| `app.travelpayouts.com/programs/224/about` | Yesim | Tools nav: Links only (no Widgets); evergreen promo code in description |
| `app.travelpayouts.com/programs/633/about` | KKday | Tools nav: Links only (no Widgets) |
| `app.travelpayouts.com/tools/links/recent` | Tools \| Links | URL input + Sub ID; "Recently added", "Saved", "Ready-made by brands" tabs; 2 existing Localrent links |
| `app.travelpayouts.com/tools/links/ready_made` | Tools \| Links | Ready-made by brands: empty ("When brands create seasonal and promo links, you'll find them here") |
| `app.travelpayouts.com/tools/widgets` | Tools \| Widgets (page 1) | 30 widgets; 15 brands; Klook widget shows live prices/ratings/images |
| `app.travelpayouts.com/tools/widgets?offset=30` | Tools \| Widgets (page 2) | 12 more widgets; intui.travel (10 widgets); Compensair (2) |
| `app.travelpayouts.com/tools/promo_codes` | Tools \| Promo Codes | 3 active codes: Go City, intui.travel, AirHelp |
| `app.travelpayouts.com/all_tools` | Other tools | Links API, Data API, Data Files, WordPress Plugin, Chrome Extension |
| `app.travelpayouts.com/whitelabels/web` | White Label | WL Web available; no integrations created |
| `app.travelpayouts.com/statistics/summary` | Reports \| Performance | 12 clicks 30 days; SubID grouping confirmed; Hotellook in filter |
| `app.travelpayouts.com/statistics/actions` | Reports \| Bookings | 0 bookings |
| `app.travelpayouts.com/statistics/content_analytics` | Reports \| Content analytics | Locked; requires Drive |
| `app.travelpayouts.com/drive` | Drive | Not connected; blog-monetization tool; ~5 min setup |

**JavaScript-extracted data:**
- All 25 programme IDs: extracted from `a[href*="/programs/"]` elements on the My Programs page
- Widget brand filter: `All brands` dropdown confirmed 17 brands with widgets
- "Learn how to access" link destinations: extracted via `document.querySelectorAll('a')` on Other Tools page

**Note on source attribution:** All data in this report was read directly from the authenticated dashboard. No information was inferred from public Travelpayouts marketing materials or Help Center articles, which are outside the scope of the authenticated-account audit. The dashboard descriptions of Data API and Data Files are reproduced verbatim from the UI text. Help Center URLs were captured but their content was not visited during this audit, in keeping with the audit scope of the authenticated account only.

---

*Report compiled 2026-10-20. Audit scope: read-only authenticated dashboard inspection. No account changes were made. This document is intended to be read alongside `WANDERMETRIC-ARCHITECTURE-AUDIT.md` Section 23 for a combined architecture and capability assessment.*
