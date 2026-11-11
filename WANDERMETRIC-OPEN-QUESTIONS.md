# WANDERMETRIC — OPEN QUESTIONS

**Version:** 1.0  
**Date:** 2026-10-20  
**Status:** Planning document — questions only. No answers have been assumed.  
**Source:** WANDERMETRIC-ARCHITECTURE-AUDIT.md, WANDERMETRIC-TRAVELPAYOUTS-CAPABILITY-AUDIT.md, full codebase inspection

Each question in this document is **genuinely unresolved** — it cannot be answered by reading the codebase, the audit reports, or the Travelpayouts dashboard as it stood during inspection. It requires an external action (API test, account inquiry, programme request) to close.

Questions are flagged with implementation impact:
- 🔴 **Blocks a phase** — the named roadmap phase cannot complete without this answer
- 🟡 **Affects design** — the answer changes how something is built, but does not prevent building it
- 🟢 **Enhancement only** — the answer opens an opportunity; the platform works without it

---

## Q1 — Travelpayouts Statistics API: Does It Return Sub IDs?

**Impact:** 🔴 Blocks Phase 2 (Conversion Loop Verification)

**Question:**  
Does the Travelpayouts statistics / conversions API return the `sub_id` value that was passed when the affiliate link was created? If so: what is the endpoint URL, what authentication is required, what is the response schema, and does the API support pull (polling) or push (webhook)?

**Why this matters:**  
The affiliate attribution chain depends on `sub_id` (= `affiliate_clicks.id` UUID with hyphens stripped) being returned by Travelpayouts when a conversion is reported. If the API does not return sub_id values, `affiliate_conversions.click_id` will remain null for all conversions — revenue can still be measured in aggregate but cannot be attributed to specific offer pages or clicks.

**Current state:**  
`docs/travelpayouts.md` explicitly states: "Not verified: statistics API." The dashboard shows Performance reports with "Group by SubID" — confirming that SubID data exists in the Travelpayouts system. Whether it is accessible via API is unverified.

**How to resolve:**  
1. Check Travelpayouts API documentation at `https://support.travelpayouts.com/` → Developers → Statistics API
2. Test the endpoint with `TRAVELPAYOUTS_API_TOKEN` and a real click's sub_id value
3. Document: endpoint URL, auth method, sub_id field name in response, rate limits, push vs. pull

**Required evidence before Phase 2 tasks 2.1–2.2 begin:** documented API call + response schema, or confirmed unavailability.

---

## Q2 — Travelpayouts Data API: Which Programmes Support It?

**Impact:** 🟡 Affects Phase 8 scope (Data API Access Requests)

**Question:**  
Which of the 25 active Travelpayouts programmes in this account support the Data API feature? For those that do: what is the request process, what is the expected response time, and what data schema does the API return?

**Why this matters:**  
The Data API dashboard panel shows "Learn how to access →" with no programme-specific information visible without requesting access. The dashboard description says it is "available in some programs on request." It is unknown which of the 25 programmes are eligible.

**Current state:**  
Data API is listed in the Travelpayouts "Other Tools" section. No programme in this account currently has it enabled. The schema (fields returned) is unknown. The access process requires a per-programme request.

**How to resolve:**  
1. In Travelpayouts dashboard → navigate to each priority programme's detail page and check for a "Data API" sub-navigation item
2. For programmes that show it: click "Learn how to access" and document the linked page content
3. For programmes that do not show it: mark as "Data API not available"
4. Alternatively: contact Travelpayouts support and ask which programmes in this account are eligible for Data API

**Required evidence before Phase 8 task 8.1:** a list of eligible programmes with their Data API request process.

---

## Q3 — Travelpayouts Data Files: Availability and Format

**Impact:** 🟡 Affects Phase 8 scope

**Question:**  
Which programmes support downloadable Data Files (CSV/JSON inventory)? What fields are included? What are the usage rights — specifically, can the data be displayed on a third-party website (WanderMetric) or is it only for internal use?

**Why this matters:**  
Data Files could provide bulk product inventory for the `affiliate_offers` table without requiring a live API integration. However, usage rights must be confirmed before any partner data is displayed. If usage is restricted to internal/analytics purposes, Data Files cannot be used for offer content.

**Current state:**  
Data Files is listed in the "Other Tools" section alongside Data API. The audit confirmed it exists but found no enabled access for any programme in the account. Usage rights are unverified.

**How to resolve:**  
1. Same investigation as Q2 — check each priority programme's detail page for a "Data Files" tab
2. For any programme with access or an access request path: request the sample file and read the schema
3. Review the Travelpayouts Affiliate Agreement for usage rights on partner data. Specifically: can product listings, prices, and images be displayed on a third-party website?
4. For each programme with access approved: confirm whether the programme's own T&Cs allow display use

**Required evidence before using any Data Files data:** written confirmation of display usage rights from Travelpayouts or the specific programme.

---

## Q4 — Hotellook: Active Programme or Dashboard Anomaly?

**Impact:** 🟡 Affects content scope for hotels section

**Question:**  
Is Hotellook an active programme in this Travelpayouts account? It appeared in the Performance report filter list but was absent from the My Programs page during the October 2026 audit. Is it a previously active programme that was paused or removed, or a reporting artefact?

**Why this matters:**  
If Hotellook is an active programme with an approved affiliate link in the database, it could be used for `hotels` section offer pages (Hotellook is a hotel metasearch engine via Travelpayouts). If it is not active, any attempt to create a Hotellook affiliate link would fail.

**Current state:**  
The Travelpayouts audit (October 2026) found Hotellook in the Performance report filter but not in My Programs. Status is unresolved. There are no Hotellook entries in `src/core/affiliate/partners.ts`, no Hotellook offers in `content/offers/`, and no Hotellook `affiliate_links` rows confirmed.

**How to resolve:**  
1. In Travelpayouts dashboard → Performance → filter by Hotellook → check whether any historical clicks exist
2. In Travelpayouts dashboard → My Programs → search for "Hotellook" → if absent, navigate directly to `https://app.travelpayouts.com/programs/{hotellook_id}/about`
3. Contact Travelpayouts support if the programme status remains unclear
4. Check `affiliate_links` table in Supabase for any rows with a Hotellook programme_id

**Required evidence before creating any Hotellook offers:** confirmed programme status (active/inactive) and a working affiliate link slug in the database.

---

## Q5 — GigSky: Is There an Active Affiliate Link?

**Impact:** 🟢 Enhancement to sim-cards section

**Question:**  
GigSky (Travelpayouts programme ID 636, 20% commission) is in My Programs but absent from `src/core/affiliate/partners.ts`. Is there an active affiliate link for GigSky in the `affiliate_links` table, or does one need to be created?

**Why this matters:**  
GigSky has the highest commission rate (20%) among the SIM-cards programmes. If an affiliate link exists and is active, adding GigSky to PARTNERS and authoring offers is straightforward. If no link exists, one must be created in the admin dashboard before content can be authored.

**Current state:**  
GigSky is confirmed present in My Programs (ID 636, reward: 20%, cookie: 30 days). It is absent from `src/core/affiliate/partners.ts` and not in the PARTNERS esim category alongside Airalo, Yesim, Saily, and Drimsim.

**How to resolve:**  
1. In Supabase admin: query `SELECT * FROM affiliate_links JOIN affiliate_programs ON ... WHERE affiliate_programs.name ILIKE '%gigsky%'`
2. If a link exists and is active: add GigSky to `partners.ts` (esim category) and author at least one offer
3. If no link exists: create one via the admin dashboard (link must be a real GigSky affiliate URL, not an invented one)
4. If the GigSky programme is not approved: apply in My Programs

**Required evidence before adding to PARTNERS:** confirmed active affiliate link in `affiliate_links` table.

---

## Q6 — KKday: Is There an Active Affiliate Link?

**Impact:** 🟡 Affects tours-activities partner display

**Question:**  
KKday is in `PARTNERS["things-to-do"]` but has no entry in the compare data (`src/core/affiliate/compare.ts`). More importantly: does KKday have an active affiliate link in the database? The import pipeline requires a live link to publish an offer.

**Why this matters:**  
KKday is a significant tours-activities platform with strong coverage in Asia. If its link is active, it should appear in compare data and be used for offer authoring. If the link is inactive or missing, section pages showing KKday as a partner may be misleading.

**Current state:**  
KKday appears in `PARTNERS["things-to-do"]` with `linkSlug: "kkday"`. Whether an affiliate link with `slug = "kkday"` exists and is active in `affiliate_links` is unverified in this audit. The programme sub-navigation audit in Travelpayouts showed KKday's programme page has only a "Links" tab (no widget tab), which is consistent with it being a link-only partner.

**How to resolve:**  
1. Query `SELECT * FROM affiliate_links WHERE slug = 'kkday' AND deleted_at IS NULL`
2. If active: add to compare data and author offers
3. If inactive: either reactivate via admin or remove from PARTNERS to avoid showing a broken link

**Required evidence before authoring KKday offers:** `affiliate_links` row confirmed active for slug `"kkday"`.

---

## Q7 — Viator and GetYourGuide Direct Programme APIs

**Impact:** 🟢 Enhancement for Phase 8 (Data API)

**Question:**  
Viator and GetYourGuide both have partner-tier product APIs separate from Travelpayouts (documented in `docs/travelpayouts.md`). Viator's tiered rate goes up to ~30% with API access. What is the approval process for each, and does obtaining direct API access conflict with or replace the Travelpayouts affiliate attribution?

**Why this matters:**  
If direct API access (Viator Affiliate API, GetYourGuide API) provides product data AND maintains affiliate attribution, it would enable `affiliate_offers` population without needing Travelpayouts Data API access for those programmes. However, direct API approval may require separate affiliate agreements and change how attribution is tracked.

**Current state:**  
`docs/travelpayouts.md` states: "Viator (tiered API, ~8% base up to ~30%, 30-day attribution) and GetYourGuide (comparable 8–30%, product-option mapping quirks). Both also reachable through Travelpayouts." No direct API access has been applied for.

**How to resolve:**  
1. Review Viator Partner API application process at `https://partnerapi.viator.com/`
2. Review GetYourGuide API application process at `https://partner.getyourguide.com/`
3. Clarify: can Travelpayouts-attributed links be used with direct API product data, or is the attribution model different?
4. Evaluate: is the marginal commission uplift (8% → 30%) worth the separate integration cost?

**Required evidence before applying:** confirmed that direct API + Travelpayouts attribution is compatible, or that direct API replaces Travelpayouts for those programmes (affects tracking model).

---

## Q8 — `seo_metadata` Table: Is It Populated?

**Impact:** 🟢 Enhancement for SEO

**Question:**  
The `seo_metadata` table was created in migration 0007, and `src/core/seo/metadata.ts` has a comment: "In Phase 5 the inputs come from the `seo_metadata` table instead of literals." Phase 5 is listed as complete in the roadmap. Is the `seo_metadata` table actually populated, or does `buildMetadata()` still use only the literal inputs passed by each page?

**Why this matters:**  
If the table is empty, all SEO metadata (titles, descriptions, OG images) is generated from page-level literals with no per-page overrides via the admin dashboard. This is functional but means SEO metadata cannot be tuned without code changes.

**How to resolve:**  
1. Query `SELECT COUNT(*) FROM seo_metadata`
2. If empty: per-page SEO tuning requires code changes; note this as a gap
3. If populated: verify that `buildMetadata()` reads from the table for the relevant pages

**Required evidence:** a simple row count from the Supabase dashboard or `execute_sql`.

---

## Q9 — Trains-Buses and Package-Tours: Which Programmes to Use?

**Impact:** 🟡 Affects Phase 3 (Section Expansion)

**Question:**  
No Travelpayouts programme in this account covers trains/buses or package tours. What affiliate programme(s) should be added to these sections? Candidates: Trainline, Omio, Rome2Rio (trains-buses); G Adventures, Intrepid, Contiki (package-tours). Are any of these available in Travelpayouts, or do they require direct programme applications?

**Why this matters:**  
The `trains-buses` and `package-tours` sections are built and indexed but will have no bookable content until a partner is chosen and an affiliate link is created. Without a programme, offers in these sections can still be authored (with a direct URL in `affiliate_url`) but will lack Travelpayouts tracking.

**How to resolve:**  
1. Check Travelpayouts programme catalogue for "trains", "buses", "rail", "package" programmes
2. If available: apply to relevant programmes in My Programs
3. If not available: identify the most commercially viable direct affiliate programme for each section
4. Document the chosen programme and its attribution model before authoring any offers in these sections

**Required evidence before Phase 3 tasks 3.3 and 3.4 begin:** programme name, affiliate link URL pattern, and commission model for each section.

---

## Closed Questions (For Reference)

These were open questions in earlier audit phases that are now resolved:

| Question | Resolution |
|---|---|
| Is Saily (ID 629) in PARTNERS? | Yes — present in `partners.ts` as `esim` category, `linkSlug: "saily"` |
| Does the Travelpayouts account have SubID tracking? | Yes — confirmed via "Group by SubID" in Performance report |
| Does `/go/[slug]` prevent open redirects? | Yes — destination always from DB via `resolve_affiliate_link` RPC; open redirect structurally impossible |
| Does the import pipeline validate body length? | Yes — `--publish` flag requires 800+ chars; DB trigger enforces it independently |
| Is the click recorded before or after the redirect? | Before — click row inserted first; redirect happens even if recording fails |
| Are the 42 widgets on 2 pages or 1? | 2 pages — offset=30 URL parameter; page 2 has 12 additional widgets (intui.travel × 10, Compensair × 2) |

---

*Questions in this document should be updated as they are resolved. Move resolved questions to the "Closed Questions" table above with a one-line resolution summary.*
