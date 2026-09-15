# WanderMetric

Travel discovery and affiliate platform — **[wandermetric.com](https://wandermetric.com)**

WanderMetric helps travellers find destinations, stays and things to do, and
earns primarily through **affiliate marketing**. AdSense is not the business
model. The architecture is API-first so a future mobile app consumes the same
backend as the website.

**Status: deployed and live.** Two features are configuration-blocked, not
incomplete — see [Known gaps](#known-gaps).

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19), TypeScript strict |
| Styling | Tailwind CSS v4, custom token layer — see [design-system.md](docs/design-system.md) |
| Motion | GSAP + ScrollTrigger, dynamically imported |
| Database / Auth / Storage | Supabase (PostgreSQL 17, `us-east-1`) |
| Validation | Zod 4 |
| Tests | Vitest |
| Hosting | Hostinger shared, Node.js 22 |

---

## Local development

Requires Node 20.9+ (developed on 24) and npm.

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest |
| `npm run verify` | lint + typecheck + test + build |

Run `npm run verify` before every commit.

---

## Environment variables

| Variable | Scope | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | public | yes | Canonical origin for URLs, OG tags, sitemap |
| `NEXT_PUBLIC_SUPABASE_URL` | public | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | yes | Publishable key, constrained by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | yes | Bypasses RLS — redirector, subscribe, audit |
| `TRAVELPAYOUTS_MARKER` | server only | for affiliate | Affiliate identifier |
| `TRAVELPAYOUTS_API_TOKEN` | server only | optional | Flight data API |
| `CRON_SECRET` | server only | for jobs | Guards `/api/internal/*` |

**`SUPABASE_SERVICE_ROLE_KEY` must never be prefixed `NEXT_PUBLIC_`** and never
committed. The modules that use it import `server-only`, so a client import is a
build error rather than a runtime leak.

---

## Architecture

```
Next.js pages / future mobile app
            ↓
      /api/v1/*            versioned, client-agnostic
            ↓
      src/core/*           framework-free domain logic
            ↓
  Supabase (RLS)   ·   Provider adapters
```

**The rule everything follows:** business logic lives in `src/core/` and never
inside a React component. `src/core/` imports nothing from `src/app/`. That is
what makes the future mobile app a client of the same logic rather than a
rewrite.

```
src/
├── app/
│   ├── (public)/          public site (route group — adds no URL segment)
│   ├── admin/             custom dashboard
│   ├── api/v1/            versioned API
│   └── go/[slug]/         affiliate redirector
├── core/                  framework-free: content, affiliate, tracking, seo, shared
├── components/            UI
├── lib/                   infrastructure adapters: supabase, admin, auth, tracking
└── types/database.ts      generated from the live schema
```

---

## Documentation

| Doc | Covers |
|---|---|
| [architecture.md](docs/architecture.md) | System design and layer boundaries |
| [design-system.md](docs/design-system.md) | Visual language: tokens, type, components, motion, imagery |
| [design-audit.md](docs/design-audit.md) | The pre-redesign audit the current design answers |
| [database.md](docs/database.md) | Schema, RLS, and the reasoning behind both |
| [erd.md](docs/erd.md) | Entity relationships |
| [affiliate-system.md](docs/affiliate-system.md) | Link resolution, click tracking, attribution |
| [travelpayouts.md](docs/travelpayouts.md) | Verified provider capabilities |
| [seo.md](docs/seo.md) | URLs, metadata, structured data, thin-content prevention |
| [security.md](docs/security.md) | Authorization, secrets, known weaknesses |
| [deployment.md](docs/deployment.md) | How the site is deployed and what is degraded |
| [roadmap.md](docs/roadmap.md) | Phases, done and planned |
| [00-environment-audit.md](docs/00-environment-audit.md) | The original Phase 0 audit |

---

## Principles this codebase holds to

1. **Never fabricate data.** No price, rating, review, availability or commission
   is stored or displayed unless it came from a real provider response. The
   schema has nowhere to put an invented figure.
2. **The database is the boundary.** RLS, CHECK constraints and triggers enforce
   the rules — not UI validation, which any future code path can bypass.
3. **No thin pages.** Publishing requires real substance, enforced by constraint.
4. **Affiliate URLs live in the database**, never in components.
5. **Verify provider APIs before integrating.** No endpoint is written from
   memory, and no capability is declared that has not been confirmed.
6. **Collect the minimum.** No raw IP, no fingerprinting, no third-party
   trackers.

---

## Known gaps

Blocked on configuration, not implementation:

- **`/go/[slug]` returns 404** — needs `SUPABASE_SERVICE_ROLE_KEY` and
  `TRAVELPAYOUTS_MARKER`. It refuses deliberately rather than redirecting without
  attribution, which would look successful and earn nothing.
- **`/api/v1/subscribe` returns 503** — needs `SUPABASE_SERVICE_ROLE_KEY`.
- **No confirmation emails** — no ESP is configured; subscribers stay `pending`.

Not yet built: conversion ingestion (the Travelpayouts statistics API was not
verified), social publishing, media upload, scheduled jobs, the mobile client.

---

## License

Private and proprietary. All rights reserved.
