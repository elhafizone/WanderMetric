# WanderMetric — working notes

Travel discovery + affiliate platform. Next.js 16 · TypeScript · Supabase.
Currently at **Phase 1 (Foundation)**. See `docs/roadmap.md` before adding anything.

## Rules that matter here

1. **Business logic belongs in `src/core/`.** It must stay framework-free — no
   React, no `next/*` imports. A future mobile app consumes the same logic
   through `/api/v1`. Never put domain logic in a component.
2. **`src/core/` must not import from `src/app/`.** Dependencies point inward.
3. **Affiliate URLs live in the database, never in JSX.** Links resolve through
   the provider registry and the `/go/[slug]` redirector.
4. **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.** It bypasses RLS.
   Use `src/lib/supabase/admin.ts` only in trusted server contexts.
5. **Keep RLS enabled on every Supabase table.** Write policies instead of
   disabling it.
6. **Environment validation is lazy on purpose** (`src/lib/env.ts`) so the build
   succeeds without credentials. Don't move it to import time.
7. **Official APIs only** for social and affiliate providers. No scraping, no
   browser automation, no fake engagement.
8. **No mass-generated thin SEO pages.** Programmatic pages must clear a
   substance threshold before they can publish.

## Before committing

```bash
npm run verify   # lint + typecheck + build
```

## Current state

- No Supabase project exists yet — `src/lib/supabase/*` is wired but unconfigured.
- No affiliate or social provider is implemented; only the interfaces exist.
- The repository has not been pushed to GitHub yet.
