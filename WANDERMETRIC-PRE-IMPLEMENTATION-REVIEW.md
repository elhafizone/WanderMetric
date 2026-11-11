# WANDERMETRIC — PRE-IMPLEMENTATION REVIEW

**Version:** 1.0  
**Date:** 2026-10-20  
**Reviewer:** Code inspection + audit cross-reference  
**Status:** No code changes made during this review  
**Input documents:** WANDERMETRIC-UNIFIED-STRATEGY.md, WANDERMETRIC-IMPLEMENTATION-ROADMAP.md, WANDERMETRIC-OPEN-QUESTIONS.md, WANDERMETRIC-ARCHITECTURE-AUDIT.md (prior session), WANDERMETRIC-TRAVELPAYOUTS-CAPABILITY-AUDIT.md (prior session), codebase inspection

---

## Executive Finding

**Phase 0 of the roadmap is already partially complete.** The four production environment variables are already set in Hostinger, and `/go/[slug]` is confirmed working (302 redirect to `tpx.li`). The roadmap as written incorrectly frames Phase 0 as a configuration task when it should be framed as a verification and rebuild task.

**The actual first implementation action is not environment variable setup. It is running `npm run verify` locally to confirm the current working tree is buildable, then triggering a production rebuild to deploy a critical security advisory that is committed but not yet deployed.**

---

## 1. Confirmed Facts vs. Assumptions

### 1.1 Confirmed by CLAUDE.md + Code Inspection

| Claim | Source | Status |
|---|---|---|
| All four Travelpayouts env vars are set in Hostinger | CLAUDE.md ("Production env vars... are set on the Hostinger Node.js app") | ✅ Confirmed |
| `/go/[slug]` 302-redirects to a `tpx.li` link in production | CLAUDE.md ("Checked 2026-10-09: /go/[slug] 302-redirects") | ✅ Confirmed |
| `/api/v1/subscribe` validates input in production | CLAUDE.md ("Checked 2026-10-09: /api/v1/subscribe validates input") | ✅ Confirmed |
| Last production build was 2026-10-04 | CLAUDE.md | ✅ Confirmed |
| There is a more recent commit that has not been deployed | git log: `8181181 chore(deps): upgrade next and eslint-config-next to 16.4.0 (fixes critical advisory)` | ✅ Confirmed |
| The open-redirect defence in `/go/[slug]` is structural | `src/app/go/[slug]/route.ts`: destination always from `resolve_affiliate_link` RPC | ✅ Confirmed |
| Click is recorded before redirect | `src/app/go/[slug]/route.ts` lines 1–end: INSERT then 302 | ✅ Confirmed |
| SubID = click UUID with hyphens stripped | `docs/travelpayouts.md` + route.ts | ✅ Confirmed |
| Some published offers already exist | Migration 0017 migrated pilot guides; `next.config.ts` has 4 specific legacy URL redirects | ✅ Confirmed |
| The news system uses `guides` table, not a new table | `src/core/news/news.ts` line 26–end: queries `guides` filtered by `categories.slug = 'travel-news'` | ✅ Confirmed |

### 1.2 Assumptions in the Planning Documents That Are NOT Confirmed

| Claim in Planning Docs | Actual Status |
|---|---|
| "Set SUPABASE_SERVICE_ROLE_KEY, TRAVELPAYOUTS_MARKER, TRAVELPAYOUTS_PROJECT_ID, TRAVELPAYOUTS_API_TOKEN" (Phase 0, Task 0.1) | **These are already set.** CLAUDE.md is explicit. Phase 0 Task 0.1 is describing work already done. |
| "The platform is zero published offers" | Incorrect. Migration 0017 migrated pilot offer guides into `offers`. At least 4 offers are live (confirmed by redirect rules in `next.config.ts`). |
| "Phase 6: Verify news system end-to-end — 0 articles" | Correct: 0 articles. But the setup gap is not just authoring — the `travel-news` category row may not exist in production DB. `scripts/seed-news-category.mjs` must be run first. |
| News system is "implemented" (strategy section 2.1) | Implemented locally but entirely uncommitted and unpushed. Not in git. Not in production. A production rebuild will NOT include it. |
| `public_authors` migration is needed for news | Partially correct — needed for author bylines. BUT: `getPublicAuthor()` in `news.ts` handles the missing view gracefully (lines 108–119: "Until that migration is applied this returns null"). News system functions without it. |

---

## 2. Critical Contradictions Found

### Contradiction A — Phase 0 Task 0.1 Is Already Done

**Location:** WANDERMETRIC-IMPLEMENTATION-ROADMAP.md, Phase 0, Task 0.1  
**Claim:** "Set these four vars on the Hostinger Node.js app panel..."  
**Reality:** CLAUDE.md states explicitly: "Production env vars (including `SUPABASE_SERVICE_ROLE_KEY` and the three Travelpayouts keys) are set on the Hostinger Node.js app."

**Risk if ignored:** An operator following the roadmap who re-enters or "re-sets" already-working env vars risks accidentally breaking a working production environment, especially if they mistype a value.

**Resolution:** Phase 0 Task 0.1 should read: "Verify that these four vars are set by confirming `/go/{slug}` returns 302 in production. They are confirmed set as of 2026-10-09 per CLAUDE.md. Do not modify them unless a value is confirmed incorrect."

---

### Contradiction B — Production Build State

**Location:** Strategy doc section 7.1 ("The application code... [is] implemented") and roadmap Phase 0 Task 0.2  
**Claim:** Phase 0 implies this is first-deploy territory.  
**Reality:** Production is live, affiliate redirects are working. The rebuild needed is to deploy a committed security advisory fix, not to bring the site online for the first time.

**Risk if ignored:** Treating a working production environment as a "first deployment" increases the chance of carelessly breaking something that is already earning affiliate attribution.

---

### Contradiction C — News System Git State

**Location:** Strategy doc section 2.1 ("News system: Implemented, untested"); Roadmap Phase 6 ("Verify news system end-to-end")  
**Claim:** The news system is implemented.  
**Reality:** The news system files are **untracked in git** (`src/app/(public)/news/`, `src/app/news-sitemap.xml/`, `src/core/news/`, `tests/news.test.ts`, `scripts/seed-news-category.mjs`). They exist on the local filesystem but are not committed. A production build from git HEAD will NOT include them.

Additionally: the committed version of `src/app/sitemap.ts` (git HEAD) does NOT import `listNewsForSitemap`. The local modified version does. This means the committed production build correctly excludes all news dependencies.

**Risk if ignored:** Phase 6 task 6.1 instructs "Run existing tests: `npm run test` — confirm `tests/news.test.ts` passes" as if this is a verification step. But if someone runs `git push` and triggers a production build WITHOUT committing the news system first, the modified `sitemap.ts` would be deployed while the news module it imports is absent → **build failure in production**.

**Resolution:** The news system commit must be a deliberate, atomic step: commit all news files together (`src/core/news/`, `src/app/(public)/news/`, `src/app/news-sitemap.xml/`, `scripts/seed-news-category.mjs`, `supabase/migrations/20261009100000_0018_public_authors.sql`, and the modified `sitemap.ts` + `robots.ts`) in a single commit, AFTER `npm run verify` passes on the full working tree.

---

### Contradiction D — Offer Count Baseline

**Location:** Strategy doc summary: "The only reasons revenue is $0 today are: 1. Production env vars not set... 2. No published offers"  
**Reality:** Both stated reasons may be incorrect:
- Env vars ARE set (Contradiction A)
- Some offers ARE published (migration 0017 migrated pilot guides; `next.config.ts` confirms at least 4 live offer URLs)

The real questions to answer before assuming $0 revenue are:
1. Are the existing published offers being clicked?
2. Are those clicks being recorded in `affiliate_clicks`?
3. Are those links converting on the partner side?

These require checking Travelpayouts Performance report and the `affiliate_clicks` table — not code changes.

---

## 3. Phase 0 Readiness Assessment

### Environment Variables

| Variable | Purpose | Code Path | Status | Rebuild Required? |
|---|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Admin DB operations | `src/lib/supabase/admin.ts` → used in `/go/[slug]`, import script, subscribe endpoint | **Already set** (CLAUDE.md 2026-10-09) | No (already in env) |
| `TRAVELPAYOUTS_MARKER` | Affiliate attribution | Travelpayouts adapter → passed to partner-links API as `marker=` param | **Already set** (CLAUDE.md) | No |
| `TRAVELPAYOUTS_PROJECT_ID` | Partner-links API | Travelpayouts adapter → `POST /links/v1/create` request body | **Already set** (CLAUDE.md) | No |
| `TRAVELPAYOUTS_API_TOKEN` | Partner-links API + flight data | Travelpayouts adapter → `Authorization` header | **Already set** (CLAUDE.md) | No |

**None of these env vars need to be set.** They are already set and working. Verifying them requires only testing `/go/{slug}` in production — not touching the Hostinger panel.

### Current Production State

- Affiliate redirector: ✅ Working (302, confirmed 2026-10-09)
- Subscribe endpoint: ✅ Working (input validation confirmed 2026-10-09)  
- Deployed commit: `40ce1ea` (2026-10-04) — city pages, compare, Airalo/Tiqets/Localrent offers
- Undeployed commit: `8181181` — Next.js + eslint-config-next upgrade, critical advisory fix
- Local uncommitted: news system (all files), modified sitemap.ts + robots.ts

### Production Rebuild Assessment

**A production rebuild is needed**, but for one reason only: to deploy the committed critical security advisory fix (`8181181`). The rebuild:
- Deploys the Next.js 16.4.0 + eslint-config-next 16.4.0 upgrade
- Does NOT include the news system (it's untracked)
- Does NOT change the committed sitemap.ts (the git HEAD version has no news imports)
- Will not affect env vars (they're set separately)

**Pre-rebuild requirement:** `npm run verify` must pass locally first. This runs against the local working tree (including the uncommitted news system) and validates that the full integrated codebase is correct. If it fails, the underlying issue must be fixed before rebuilding.

**Rebuild safety:** High. The env vars are already set. The current build is already working. The rebuild deploys only a dependency upgrade.

---

## 4. `/go/[slug]` Testing Scope

### What Can Be Tested Locally

| Test | Method | Can Test Locally? |
|---|---|---|
| Slug format validation (rejects invalid slugs) | Unit test | ✅ Yes — the regex check is pure logic |
| Database RPC `resolve_affiliate_link` | Integration test with local Supabase | ✅ Yes, with `.env.local` |
| Click recording (`record_affiliate_click` RPC) | Integration test | ✅ Yes, with `.env.local` |
| Prebuilt URL detection (`isPrebuiltAffiliateUrl`) | Unit test | ✅ Yes |
| Open-redirect protection | Unit test — destination always from DB | ✅ Yes |
| Bot detection skips click recording | Integration test | ✅ Yes |

### What Requires a Controlled Production Smoke Test

| Test | Why Production Required |
|---|---|
| Travelpayouts partner-links API call | API key is in Hostinger env; local `.env.local` may have test/missing values |
| Actual affiliate attribution in Travelpayouts dashboard | Partner-side visibility requires live marker + live click |
| tpx.li vs. dynamic deep link path | Depends on the `deep_link_template` + `provider_slug` values in production DB |
| Click appearing in Travelpayouts Performance report | Requires real traffic to the live marker |

**Controlled smoke test procedure (already confirmed passed):** Visit production `/go/{any-active-slug}` → confirm 302 → check `affiliate_clicks` table → check Travelpayouts Performance within 24h. Per CLAUDE.md, this passed on 2026-10-09.

**A fresh smoke test is recommended after the production rebuild**, as the redirect flow depends on unchanged env vars and unchanged DB rows. A 302 after rebuild confirms the dependency upgrade did not break anything.

---

## 5. Phase 1 Offer Feasibility

### Offers That Already Exist (Cannot Count Toward "First 15")

Migration 0017 migrated pilot offer guides from `activities` into `offers`. The `next.config.ts` confirms at least 4 published offers with specific legacy URL redirects:
- `/tours-activities/italy/rome-colosseum-forum-palatine-guided-tour`
- `/tours-activities/japan/kyoto-fushimi-inari-guided-tour`
- `/tours-activities/egypt/aswan-abu-simbel-day-trip`
- `/tours-activities/spain/barcelona-sagrada-familia-guided-tour`

The actual offer count in the production database is unknown from code alone. Query required: `SELECT COUNT(*) FROM offers WHERE status = 'published' AND deleted_at IS NULL`.

### Offer Authoring Feasibility

**Viable (can proceed with existing programmes and live links):**
- `tours-activities` — Viator, GetYourGuide, Klook, Tiqets all have active Travelpayouts programme entries. Affiliate links confirmed via `next.config.ts` redirect patterns. At least 4 offers already exist.
- `sim-cards` — Airalo and Saily confirmed in PARTNERS with `linkSlug` values. These require confirmed `affiliate_links` rows for those slugs.
- `car-rentals` — 6 PARTNERS entries (EconomyBookings, QEEQ, GetRentacar, Localrent, Auto Europe, BikesBooking). Compare page live. Affiliate links status unverified via SQL but PARTNERS entries exist.

**Cannot proceed without resolving:**
- `hotels` — No PARTNERS entry, no booking partner. Requires programme selection + link creation before any offer can reference `affiliate_link_id`.
- `trains-buses`, `package-tours` — No active Travelpayouts programme. Requires programme selection (Open Question Q9).
- GigSky offers — link status unverified (Open Question Q5).
- KKday offers — link status unverified (Open Question Q6).

**Important constraint:** The import script (`scripts/import-offers.mjs`) resolves programme by slug and requires an active `affiliate_links` row for the composed slug `{programme}-{slug}`. A missing or inactive link causes the import to fail with an error, not silently skip. Verifying `affiliate_links` rows exist for each target programme BEFORE writing offer JSON files saves wasted authoring effort.

---

## 6. Open Questions — Classification

| Question | Classification | Rationale |
|---|---|---|
| Q1 — Statistics API returns sub_id? | 🔴 **Blocks Phase 2** | Conversion ingestion cannot be designed without knowing the API schema. However, it can be **investigated right now** by reading Travelpayouts API documentation — no code needed. Estimated 1–2h research. |
| Q2 — Data API eligible programmes? | 🟡 **Can be investigated independently** | Deferred from Phase 8. Investigate in dashboard while authoring content in parallel. |
| Q3 — Data Files availability + usage rights? | 🟡 **Can be investigated independently** | Same as Q2. Deferred. Notably: usage rights must be confirmed IN WRITING before displaying any partner data. |
| Q4 — Hotellook status? | 🟢 **Deferred safely** | Hotellook is referenced nowhere in application code or PARTNERS. Zero offers reference it. No production risk. Resolve before authoring any Hotellook offers. |
| Q5 — GigSky affiliate link active? | 🟡 **Can be resolved in 5 minutes** | Single SQL query: `SELECT * FROM affiliate_links WHERE slug ILIKE '%gigsky%' AND deleted_at IS NULL`. Resolve before adding GigSky to PARTNERS or authoring any GigSky offers. |
| Q6 — KKday affiliate link active? | 🟡 **Can be resolved in 5 minutes** | Single SQL query: `SELECT * FROM affiliate_links WHERE slug = 'kkday' AND deleted_at IS NULL`. Resolve before authoring KKday offers. KKday is already in PARTNERS — if the link is inactive, it should be removed to avoid broken section sidebars. |
| Q7 — Viator/GYG direct APIs vs. Travelpayouts? | 🟢 **Deferred safely** | Enhancement. Attribution works via Travelpayouts today. Direct API access could improve commission rate later. Not blocking. |
| Q8 — `seo_metadata` table populated? | 🟢 **Deferred safely** | Single row-count query confirms. No implementation blocked by this. |
| Q9 — Trains/buses + package-tours programmes? | 🟡 **Affects Phase 3 scope only** | Deferred safely. Phase 3 tasks 3.3 and 3.4 cannot start without a programme selection, but Phase 3 has plenty of other work that can proceed. |

**One question is urgent and requires user decision — see Section 8.**

---

## 7. Architecture and Code Contradictions vs. Actual Behaviour

| Document Claim | Code Reality | Risk |
|---|---|---|
| Strategy: "No conversion ingestion: the statistics API was never verified" | CLAUDE.md confirms this | No contradiction — correct |
| Strategy: "The `affiliate_offers` table... no data" | Confirmed by schema (`affiliate_offers` INSERT comment: "Populated only by real provider responses") | No contradiction |
| Roadmap: Phase 6 says "news system tests pass" | `tests/news.test.ts` tests `truncateHeadline`, `newsArticleSchema`, `buildNewsSitemapXml` from `src/core/news/schema.ts`. These are unit tests that do not touch the database. They will pass as long as the module is importable. | Safe — but only valid once the news files are committed |
| Roadmap: Phase 6 says "the `travel-news` category must be seeded" | CORRECTLY identified, but the seeding step is omitted from Phase 6 task list | Missing step — must be added |
| Roadmap: "NoIndex until 3 offers" | Code: `MIN_OFFERS_FOR_COUNTRY_PAGE = 3` in `sections.ts`; page-level `noIndex: offers.length < MIN_OFFERS_FOR_COUNTRY_PAGE` | ✅ Consistent |
| Strategy: "Cookie-free public client preserves ISR" | `src/lib/supabase/public.ts`: `createSupabasePublicClient()` explicitly disables session and cookie handling. All public pages use this. | ✅ Consistent |
| Roadmap: "Verify conversion ingestion" as Phase 2 task | `docs/travelpayouts.md`: "Not verified: statistics API." `docs/roadmap.md` Phase 9: "Verify Travelpayouts statistics API, implement conversion ingestion." The roadmap's Phase 2 is reasonable ordering, but the conversion ingestion task is described in both the internal roadmap and the new roadmap. No contradiction. | ✅ Consistent |
| Strategy: "RLS on every table" | 28 tables listed in `docs/database.md` with RLS policy summary. CLAUDE.md Rule 6. Migration 0008 applies RLS to all tables. | ✅ Consistent |

---

## 8. Questions That Require User Decision

These cannot be resolved from code inspection. They require the user's knowledge of their accounts, systems, or preferences.

### Decision 1 — Q6: Is the KKday affiliate link active?

**Why this needs a decision:** KKday (`linkSlug: "kkday"`) is already in `PARTNERS["things-to-do"]`. Section pages that have active KKday affiliate links will show KKday as a booking option. If the link is inactive or missing, the section sidebar shows KKday with no working CTA. This should be verified — and either the link reactivated or KKday removed from PARTNERS — before publishing more `tours-activities` content.

**User action needed:** Check Supabase `affiliate_links` table: `SELECT slug, status, destination_url FROM affiliate_links WHERE slug = 'kkday' AND deleted_at IS NULL`. Report the status.

### Decision 2 — Q1: Has the Travelpayouts statistics API been investigated?

**Why this needs a decision:** The strategy and roadmap treat conversion attribution as Phase 2. But investigating whether the statistics API returns sub_id values takes 1–2h of documentation reading and does not require code. This can be done before any authoring begins. If the API does NOT return sub_ids, conversion attribution via `affiliate_conversions` may require a different approach (manual reconciliation from Travelpayouts reports).

**User action needed:** Check the Travelpayouts API documentation in the dashboard (Developers section) and report whether a statistics endpoint exists and whether it returns sub_id in its response.

### Decision 3 — What is the current published offer count in production?

**Why this needs a decision:** Phase 1 targets "first 15 offers" without knowing how many already exist. If there are already 8–10 published offers from the pilot migration, the authoring target changes significantly.

**User action needed:** Query Supabase: `SELECT section, COUNT(*) FROM offers WHERE status = 'published' AND deleted_at IS NULL GROUP BY section ORDER BY section`.

### Decision 4 — Should the news system be committed and deployed now or later?

**Why this needs a decision:** The news system (news module, news pages, news sitemap, seed script, migration 0018, modified sitemap.ts, modified robots.ts) is fully implemented locally and all its changes are coherent. A production rebuild can deploy it immediately after committing. The alternative is to defer committing the news system until content is ready to publish.

**Tradeoff:**
- Commit now: the infrastructure is in place; the `travel-news` category seed can be run; news-sitemap.xml starts being served (empty but valid); no functional impact on existing pages since the news index is noindexed with 0 articles.
- Defer: keeps the working tree clean until news content is ready; one fewer thing to deploy now.

**No production risk either way** — the news index is noindexed when empty; the news sitemap returns valid empty XML.

---

## 9. Reordered First Implementation Steps

The roadmap Phase 0 should be resequenced to reflect the actual current state:

### Corrected Phase 0 (Verification + Rebuild)

**Step 1 — Verify production is currently healthy** (5 minutes, no code)
- Visit `https://wandermetric.com/go/{any-active-slug}` in a browser
- Confirm 302 redirect (not 404, not 500)
- Check `affiliate_clicks` in Supabase: confirm a row was inserted for the test click
- This confirms env vars are still set and the redirector is working

**Step 2 — Check current published offer count** (5 minutes, no code)
- `SELECT section, COUNT(*) FROM offers WHERE status = 'published' AND deleted_at IS NULL GROUP BY section`
- Establishes content baseline for Phase 1 targeting

**Step 3 — Verify KKday and GigSky affiliate link status** (5 minutes, no code)
- `SELECT slug, status FROM affiliate_links WHERE slug IN ('kkday', 'gigsky-esim', 'gigsky') AND deleted_at IS NULL`
- Prevents wasted authoring effort on programmes without active links

**Step 4 — Run `npm run verify` locally** (15–30 minutes)
```bash
npm run verify  # lint + typecheck + test + build
```
This runs against the full local working tree (including uncommitted news system). Must pass before any production rebuild is triggered.

**Step 5 — Decide: commit news system now or later** (User decision #4)
- If commit now: `git add src/core/news src/app/(public)/news src/app/news-sitemap.xml scripts/seed-news-category.mjs supabase/migrations/20261009100000_0018_public_authors.sql src/app/sitemap.ts src/app/robots.ts` → commit → push
- If defer: proceed to Step 6 without committing local changes

**Step 6 — Trigger production rebuild** (Hostinger panel, ~5 minutes)
- Command: `next build --webpack`
- Deploys git HEAD — includes the critical security advisory fix (`8181181`)
- Includes news system ONLY if Step 5 chose to commit

**Step 7 — Post-rebuild smoke test** (10 minutes)
- `/go/{slug}` → confirm still 302-redirecting
- New pages if news committed: `/news-sitemap.xml` → confirm valid XML
- No new 404s on existing offer URLs

---

## 10. Rollback Considerations

| Action | Rollback Method | Risk Level |
|---|---|---|
| Production rebuild (Step 6) | Rebuild from prior git commit (revert + rebuild) | Low — the deps upgrade is a well-contained change |
| Committing news system | `git revert` the commit | Low — news system is entirely additive |
| Running `seed-news-category.mjs` | The category row can be deleted manually; any accidentally created news articles would need to be set to draft | Low |
| Authoring and importing new offers | Admin dashboard: set status to 'draft'. No destructive action. | Very low |
| Activating Data API (Phase 8) | All ingestion is additive; `affiliate_offers` rows can be deleted. | Low |

**Note:** The current `/go/[slug]` → `tpx.li` path is a prebuilt URL path. The `isPrebuiltAffiliateUrl()` check means existing `tpx.li` links bypass the partner-links API entirely. This means those specific redirects are independent of Travelpayouts API availability — they'll work even if `TRAVELPAYOUTS_API_TOKEN` expires or rate limits are hit.

---

## 11. Recommended First Action

**Run `npm run verify` locally.**

This single command (which takes 15–30 minutes) is the correct prerequisite for everything else:

1. It validates the full local working tree — including the uncommitted news system, modified sitemap.ts, modified robots.ts, and all existing code.
2. If it passes, the working tree is ready to commit (for news deployment) and the build is confirmed safe for a production rebuild.
3. If it fails, the failure surface is small and contained — likely a type error in the news module or a failing test. Fixing it before deploying is strictly better than deploying first.
4. It costs nothing and risks nothing. No production system is touched.
5. It answers the question "is the local codebase in a state that can be deployed?" — which must be true before any further steps.

**After `npm run verify` passes:**
- Make Decision 4 (commit news system now or later)
- Make Decision 1 (check statistics API documentation)
- Trigger production rebuild
- Run smoke test

The business-critical parallel work (authoring offer content, checking KKday/GigSky link status, reading Travelpayouts statistics API docs) can begin immediately and independently of the rebuild process.

---

*This document should be reviewed before any action is taken on Phase 0. All production actions should be confirmed with the site owner before execution.*
