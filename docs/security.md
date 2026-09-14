# Security

What is implemented, what is deliberately weak and documented, and what remains
open.

---

## Authorization model

Three layers, and only one of them is the boundary.

| Layer | Purpose | Is it the boundary? |
|---|---|---|
| Middleware | Redirects unauthenticated visitors away from `/admin` | **No.** Convenience only. |
| `requireStaff()` | Fails a page or action before it reaches the database | **No.** Defence in depth. |
| **Row Level Security** | Evaluates every query as the calling role | **Yes.** |

Admin writes use the **session client, never the service role**, so RLS
evaluates each mutation as the signed-in staff member. A bug in the admin code
cannot grant an editor powers their role does not have.

Identity always resolves through `supabase.auth.getUser()`, which revalidates the
token against the auth server. `getSession()` only decodes a cookie the client
controls, and is never used to gate access.

---

## Secrets

- `SUPABASE_SERVICE_ROLE_KEY` is server-only. It is never prefixed
  `NEXT_PUBLIC_`, never imported into a client component, and the modules that
  use it import `server-only` so a client import is a **build error**, not a
  runtime surprise.
- Provider credentials are environment variables. `affiliate_providers.config`
  holds non-secret settings only, so a database dump cannot contain a secret.
- `.gitignore` ignores `.env*` with an `!.env.example` exception. Verified by
  test: `.env.example` is trackable, `.env.local` is refused by `git add`.
- The logger **redacts by key pattern** before serializing, so a careless
  `logError(ctx, err, { config })` cannot leak a token.

---

## Injection and XSS

**SQL injection:** all queries go through PostgREST/Supabase with parameter
binding. The only raw SQL is in migrations and `SECURITY DEFINER` functions with
typed arguments. Every function sets an explicit `search_path`, closing the
search-path hijacking vector that `SECURITY DEFINER` otherwise opens.

**XSS:** body copy is stored and rendered as **plain text**, split into
paragraphs. There is no `dangerouslySetInnerHTML` on any content path, so
stored XSS through the editor is structurally impossible.

The single exception is the JSON-LD block, which escapes `<` to `<` so a
stray `</script>` in content cannot break out — and it only ever receives a
structure we build ourselves, never user HTML.

**Open redirect:** `/go/[slug]` takes only a slug; the destination always comes
from the database, constrained to `^https?://`. The admin login's `?next=` is
restricted to same-origin paths.

---

## Headers

Set in `next.config.ts` for every route:

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

`poweredByHeader: false` removes the `X-Powered-By` fingerprint.

`/go/` additionally returns `x-robots-tag: noindex, nofollow` and
`cache-control: no-store`.

**No Content-Security-Policy yet.** This is a conscious deferral: a CSP written
before the real script, style and image origins are known would either be so
permissive as to be decorative, or would break the site in production. It should
be added before launch, starting in `Content-Security-Policy-Report-Only`.

---

## Input validation

Zod validates every API query and body at the boundary. Validation failures
return **422 with field detail**, which is safe — it describes the caller's own
input, not our internals.

Database errors are translated: `publicMessage` crosses the wire while constraint
names, table names and driver text stay in the server log.

Pagination is clamped to `MAX_PAGE_SIZE`, so `?perPage=100000` — the cheapest
denial of service available to a stranger — cannot pull an entire table.

---

## Privacy

The privacy policy describes the implementation rather than boilerplate.

- **No raw IP address is ever stored.** It is used only to derive a country at
  the edge, then discarded.
- Referrers are reduced to the **hostname only**, because a full referrer URL
  carries search terms and session identifiers.
- The session cookie holds a random UUID with no link to a person. `httpOnly`,
  `Secure` in production, `SameSite=Lax`, 30-day expiry — no longer than the
  attribution window it serves.
- No cross-site identifier, no fingerprinting, no third-party analytics or
  advertising trackers are loaded anywhere on the site.
- UTM values are length-capped so a crafted URL cannot bloat a row.

---

## Known weaknesses

### Rate limiting is in-process

`src/lib/rate-limit.ts` keeps state in one Node process. It does not survive a
restart and does not coordinate across instances. This is a real constraint of
the shared-hosting target, stated in the module's own docstring rather than
hidden.

It blunts casual abuse of `/api/v1/subscribe`. It would not stop a distributed
attack. Anything stronger belongs at the edge or in a shared store.

The key is also coarse — country plus device category — because no IP is stored.
That is a deliberate privacy-over-precision trade.

### No CSP

See above.

### No 2FA on admin accounts

Supabase Auth supports MFA. It is not yet enabled. **This should be required
before the admin is exposed on a public domain.**

### Backups are untested

Supabase provides automated backups; no restore has been performed. An untested
backup is a hypothesis, not a backup.

### No CAPTCHA on the subscribe endpoint

Double opt-in limits the damage: an unconfirmed subscriber is never emailed. But
the endpoint can still be used to create pending rows.

---

## Supabase advisors

The security linter reports **four warnings, all intentional**:
`current_role_level`, `is_admin`, `is_editor` and `is_staff` are executable by
`authenticated`.

That cannot be revoked without breaking every staff RLS policy, which evaluates
them as the calling role. They disclose only the caller's own role, which the
caller already knows. `is_admin()` carries a comment recording this decision.

Everything else the linter originally flagged — extensions in `public`, anon
execute on definer functions, missing RLS — has been fixed.

---

## Pre-launch checklist

- [ ] Enable MFA for all admin accounts
- [ ] Add a Content-Security-Policy, report-only first
- [ ] Perform and document a database restore drill
- [ ] Move rate limiting to a shared store or the edge
- [ ] Rotate the Hostinger API token (it can delete sites and databases across
      three accounts)
- [ ] Confirm HTTPS and HSTS are live on wandermetric.com
- [ ] Review RLS policies once end-user accounts exist
