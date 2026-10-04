# WanderMetric — working notes

Travel discovery + affiliate platform. Next.js 16 · TypeScript · Supabase.
**Live at https://wandermetric.com.** Read `docs/roadmap.md` before adding anything.

## Site structure (reorganised October 2026)

Ten sections mirror the Travelpayouts categories: `tours-activities`, `hotels`,
`car-rentals`, `flights`, `trains-buses`, `transfers`, `package-tours`,
`insurance`, `sim-cards`, `travel-services`. They are defined once in
`src/core/sections/sections.ts` and as the `offer_section` enum in the database.

- Pages: `/{section}`, `/{section}/{country}`, `/{section}/{country}/{slug}`,
  plus `/countries/{country}`. **Destination is a filter, not a section.**
- A page is an `offers` row: facts read from the partner listing, original text,
  a stored affiliate link. The database publish gate needs 800+ characters,
  facts, a source URL and an active link. Country pages are `noindex` below 3
  offers (`MIN_OFFERS_FOR_COUNTRY_PAGE`).
- Guides, Deals, Destinations and hotel/flight-route pages no longer exist on the
  site. Their tables are untouched; old URLs 301 (see `next.config.ts`).
- Offers are authored as `content/offers/<programme>/<slug>.json` and imported
  with `node --env-file=.env.local scripts/import-offers.mjs` (add `--publish`).
  Each file names its `section` and a `city` or `country`.
- Production builds use `next build --webpack` (Turbopack crashes on the host).

## Rules that matter here

1. **Business logic belongs in `src/core/`.** Framework-free — no React, no
   `next/*`. A future mobile app consumes the same logic through `/api/v1`.
   `src/core/` must not import from `src/app/`.
2. **Never fabricate data.** No price, rating, review, availability or commission
   is stored or shown unless a real provider returned it. The schema has nowhere
   to put an invented figure — keep it that way.
3. **The database is the authorization and validation boundary**, not the UI.
   RLS, CHECK constraints and triggers enforce the rules. Admin writes use the
   session client, never the service role, so RLS evaluates each mutation as the
   signed-in user.
4. **Affiliate URLs live in the database**, never in JSX. Links resolve through
   `/go/[slug]`.
5. **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.** Modules using it
   import `server-only`.
6. **Keep RLS enabled on every table.** Write policies; never disable it.
7. **Verify a provider API before integrating it.** No endpoint from memory, and
   never declare a capability you have not confirmed.
8. **No mass-generated thin pages.** The publish gate is a database constraint.
9. **Public pages must use `createSupabasePublicClient`** (cookie-free). The
   session client reads cookies, which silently disables static rendering.
10. **Collect the minimum.** No raw IP, no fingerprinting, no advertising
    trackers. Third-party scripts load only after the reader accepts the cookie
    notice (`src/components/analytics/consent.tsx`). Allowed: Google Analytics
    (measurement only, ad features off) and, on the flight-search page alone, a
    Travelpayouts White Label widget. The owner relaxed this rule from "no
    third-party trackers" on 2026-09-26 because commission revenue is the goal;
    consent, not absence, is now the line.

## Before committing

```bash
npm run verify   # lint + typecheck + test + build
```

Do not suppress a lint rule or ignore a TypeScript error to make it pass.

## Things that will surprise you

- **Embedded-column filters need `!inner`.** Without it PostgREST returns the
  parent row with a null embed instead of excluding it. This crashed a
  prerender once; `src/core/content/selects.ts` uses inner joins wherever the
  FK is NOT NULL.
- **`src/lib/admin/generic-table.ts` drops to the untyped client** in three
  places. The generated types cannot express "one of ten tables" and collapse
  column names to `never`. Read its docstring before touching it.
- **Four Supabase security warnings are intentional** — `authenticated` needs
  EXECUTE on the RLS helper functions or every staff policy fails.
- **`page_views` is deliberately unpartitioned.** See `docs/database.md` for the
  trigger point and why an unmaintained partition set is the worse risk.

## Current state

- `/go/[slug]` returns 404 and `/api/v1/subscribe` returns 503 in production:
  both need `SUPABASE_SERVICE_ROLE_KEY`, which is not retrievable through the
  Supabase integration and must be copied from the dashboard.
- Travelpayouts is implemented but dormant until `TRAVELPAYOUTS_MARKER`,
  `TRAVELPAYOUTS_PROJECT_ID` and `TRAVELPAYOUTS_API_TOKEN` are set. Links are
  converted through the partner-links API; see `docs/travelpayouts.md`.
- No conversion ingestion: the statistics API was never verified.
