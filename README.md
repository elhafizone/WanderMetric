# WanderMetric

Travel discovery and affiliate platform — **wandermetric.com**

WanderMetric helps travellers find destinations, stays and things to do, and
earns primarily through **affiliate marketing**. AdSense is not the business
model. The architecture is API-first so a future Android/iOS app can consume the
same backend as the website.

> **Current phase: 1 — Foundation.** The public website does not exist yet. See
> [What is intentionally not implemented](#what-is-intentionally-not-implemented).

---

## Technology stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript, strict mode |
| Styling | Tailwind CSS v4 |
| Database / Auth / Storage | Supabase (PostgreSQL 17) |
| Validation | Zod 4 |
| Quality | ESLint 9, Prettier |
| Hosting (planned) | Hostinger — Node.js 22, git auto-deploy |

---

## Local development

Requires **Node.js 20.9+** (developed on 24.x) and npm.

```bash
git clone <repository-url> wandermetric
cd wandermetric
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

The app runs at http://localhost:3000. It boots without Supabase credentials —
Supabase-backed features simply report themselves as unconfigured.

### Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with autofix |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |
| `npm run verify` | lint + typecheck + build |

Run `npm run verify` before every commit.

---

## Environment variables

Copy `.env.example` to `.env.local`. **Never commit `.env.local`.**

| Variable | Scope | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | public | yes | Canonical origin for URLs, OG tags, sitemap |
| `NEXT_PUBLIC_SUPABASE_URL` | public | yes* | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | yes* | Anon key, constrained by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | yes* | Bypasses RLS — jobs and admin writes |
| `CRON_SECRET` | server only | later | Guards `/api/internal/*` (Phase 7) |
| `TRAVELPAYOUTS_*` | server only | later | Affiliate provider (Phase 6) |
| `PINTEREST_*` | server only | later | Social publishing (Phase 8) |

\* Not required to build or run the shell; required for any Supabase feature.

**`SUPABASE_SERVICE_ROLE_KEY` must never be prefixed with `NEXT_PUBLIC_`**, never
imported into a Client Component, and never committed. It bypasses every Row
Level Security policy.

---

## Supabase setup

> ⚠️ **No WanderMetric Supabase project exists yet.** The only project on the
> connected account is `top-tools-pick`, which belongs to a different product and
> must not be reused. Creating the WanderMetric project is the first task of
> Phase 2.

Once the project exists:

1. Create a Supabase project (region close to the target audience).
2. Copy the project URL and anon key into `.env.local`.
3. Copy the service-role key into `.env.local` — server-side only.
4. Keep Row Level Security **enabled** on every table. Write explicit policies;
   never disable RLS to make something work.

The client adapters live in `src/lib/supabase/`:

- `client.ts` — browser, anon key, RLS applies
- `server.ts` — Server Components / Route Handlers, carries the user session
- `admin.ts` — service role, **bypasses RLS**, trusted server contexts only

---

## Project structure

```
src/
├── app/                   Next.js routes
│   ├── api/v1/            Versioned API — shared with the future mobile app
│   ├── layout.tsx         Root metadata, fonts, theme
│   ├── page.tsx           Foundation landing page
│   ├── robots.ts          Generated robots.txt
│   └── sitemap.ts         Generated sitemap.xml
├── core/                  Framework-free domain layer (no React, no Next)
│   ├── affiliate/         Provider interface + registry
│   ├── content/           Destinations, guides, deals  (Phase 2+)
│   ├── seo/               Site config, route builders, metadata helpers
│   ├── social/            Social publishing interface  (Phase 8)
│   ├── tracking/          Clicks, conversions          (Phase 7)
│   └── shared/            Result type, error taxonomy
├── lib/                   Infrastructure adapters
│   ├── env.ts             Lazily validated environment contract
│   └── supabase/          Supabase clients
└── types/                 Shared type declarations
```

**Architectural rule:** business logic lives in `src/core/` and never inside a
React component. `src/core/` must not import from `src/app/`. This is what makes
the future mobile app a client of the same logic rather than a rewrite.

---

## Repository

- **Name:** `wandermetric`
- **Status:** local git repository initialized; **not yet pushed to GitHub** —
  no GitHub CLI or credentials are available in the current environment. See the
  Phase 1 report for the unblocking options.

---

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — system architecture
- [`docs/roadmap.md`](docs/roadmap.md) — phased delivery plan
- [`docs/00-environment-audit.md`](docs/00-environment-audit.md) — Phase 0 audit

---

## What is intentionally not implemented

Phase 1 is a foundation. Deliberately absent:

- Database schema and migrations — entities are documented, not created
- Destination, hotel, activity, flight, guide and deal pages
- Affiliate integrations — the interface exists, no provider is implemented
- The `/go/[slug]` affiliate redirector
- Click and conversion tracking
- Admin dashboard and authentication flows
- Social publishing
- Email and lead generation
- Structured data, sitemap index, internal linking
- Production deployment to Hostinger

Each is scheduled in [`docs/roadmap.md`](docs/roadmap.md).

---

## License

Private and proprietary. All rights reserved.
