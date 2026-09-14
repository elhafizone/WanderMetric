# Affiliate system

How a link gets from the database to a visitor's browser, and how the resulting
click becomes attributable revenue.

---

## The rule everything follows

**No affiliate URL appears anywhere in the frontend.** Not in a component, not
in a constant, not in content. Every outbound link points at our own
`/go/[slug]`, and the real destination is resolved server-side from the database.

Consequences that matter:

- Swapping a provider is a database change plus one adapter file. No page,
  component or route changes.
- No marker, token or partner parameter is ever visible in page source.
- There is no `?url=` to abuse. The visitor controls only the slug, so an **open
  redirect is structurally impossible** — backed by a CHECK constraint requiring
  `^https?://` on every stored destination.

---

## Click flow

```
<AffiliateLink linkSlug="paris-hotels" contentType="destination" contentId="…" />
        │  renders href="/go/paris-hotels?ct=destination&cid=…&from=/destinations/france/paris"
        │  rel="sponsored nofollow noopener"
        ▼
GET /go/[slug]                                    (server, force-dynamic)
        │
        ├── validate slug shape
        ├── resolve_affiliate_link(slug)          (service role, SECURITY DEFINER)
        ├── resolve provider from registry        → 404 if unconfigured
        ├── classify request                      → bot? no click recorded
        ├── ensure anonymous session cookie
        ├── record_affiliate_click(...)           → returns click_id (UUID)
        ├── provider.buildDeepLink({ clickId })   → marker + sub_id applied
        ▼
302 → partner URL
     x-robots-tag: noindex, nofollow
     cache-control: no-store
```

### Five decisions inside that flow

**The click is recorded before the redirect.** A lost click is lost revenue
attribution. But if recording fails the redirect still happens with a throwaway
UUID — sending the visitor where they asked matters more than our analytics.

**Bots are redirected but never recorded.** Counting crawlers as clicks would
corrupt every conversion rate on the dashboard. A missing user agent counts as
automation, because real browsers always send one.

**The response is explicitly uncacheable.** A cached affiliate redirect would
collapse every visitor's click onto a single `click_id`, destroying attribution
wholesale.

**An unconfigured provider returns 404.** Redirecting without a marker looks
successful and earns nothing. Failing visibly surfaces the problem on the first
click.

**`/go/` is excluded from middleware.** The redirector is the hottest path and
has no session to refresh; it must not pay for an auth round trip per click.

---

## Data model

| Table | Role |
|---|---|
| `affiliate_providers` | A network. `config` holds non-secret settings only. |
| `affiliate_programs` | A vertical within a provider (flights, hotels, activities). |
| `affiliate_links` | The outbound URL. `slug` drives `/go/[slug]`. |
| `affiliate_link_placements` | Which link appears on which content. |
| `affiliate_offers` | Cached provider responses. Expendable; safe to truncate. |
| `affiliate_clicks` | One row per human click. `id` **is** the `click_id`. |
| `affiliate_conversions` | Provider-reported bookings. |

**Credentials are never in the database.** Markers, tokens and keys are
environment variables, so a database dump can never contain a secret.
`config` and `notes` are additionally revoked from `anon` at the column level.

---

## The provider abstraction

```ts
export interface AffiliateProvider {
  readonly slug: string;
  readonly verticals: readonly Vertical[];
  readonly capabilities: ProviderCapabilities;

  buildDeepLink(input: DeepLinkInput): Promise<Result<DeepLinkResult>>;
  search?(query: SearchQuery): Promise<Result<ProviderOffer[]>>;
  fetchConversions?(range: DateRange): Promise<Result<ProviderConversion[]>>;
  verifyWebhook?(payload: string, signature: string): Promise<boolean>;
}
```

Only `buildDeepLink` is required — every provider must at minimum produce a
trackable outbound URL. The rest are optional because **not every network
exposes them**, and `capabilities` lets the UI degrade instead of crashing.

`capabilities` must be declared honestly. A provider claiming `conversionFeed:
true` without a working `fetchConversions` produces a pipeline that appears to
run and silently reports nothing.

`Vertical` is re-exported from the database enum rather than hand-written a
second time, so the two cannot drift apart.

---

## Attribution and conversions

`affiliate_clicks.id` is a UUID we generate, forwarded to the provider as its
sub-identifier. When a conversion is reported it is the only way back to a page.

`affiliate_conversions.click_id` is **nullable**, because many networks never
return the sub-id. Such a conversion is real but unattributable, and that must
stay visible. Guessing which page earned it would corrupt every per-page revenue
figure.

**Nothing writes to `affiliate_conversions` yet.** No provider callback is
verified and no report pull is implemented. The table is empty, and an empty
table is an honest statement that no conversions have been measured.

---

## Adding a provider

1. Implement `AffiliateProvider` in `src/core/affiliate/providers/`.
2. Read the provider's live documentation first. Never write an endpoint from
   memory.
3. Declare `capabilities` to match what you actually verified.
4. Register in `bootstrap.ts` behind an environment check.
5. Add the provider, programmes and links through the admin.

Nothing in `src/app` or `src/components` changes.
