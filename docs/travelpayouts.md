# Travelpayouts integration

**Status: implemented, not activated.** The adapter is complete and tested. It
stays dormant until `TRAVELPAYOUTS_MARKER` is set.

Everything below was verified against Travelpayouts' published documentation in
**September 2026**. Nothing here was written from memory.

---

## Why Travelpayouts first

It is an aggregator, not a single brand. One integration reaches Booking.com,
Viator, GetYourGuide and 100+ other brands across hotels, flights, tours, car
hire and insurance. Every alternative required a separate approval process per
brand before a single link could be published.

---

## Verified capabilities

| Capability | Status | Notes |
|---|---|---|
| Deep links | ✅ Implemented | `marker` + `sub_id` on any brand URL |
| Flight data API | ✅ Implemented | Requires `TRAVELPAYOUTS_API_TOKEN` |
| Reference data | Available, unused | `/data/en/{cities,airports,countries}.json` |
| Widgets / White Label | Available, not used | Would embed partner UI; deep links keep our own |
| Statistics API | ⚠️ **Not verified** | See below |

### Authentication

`x-access-token: <token>` header, or a `token` query parameter. The adapter uses
the header.

### Endpoints used

```
GET https://api.travelpayouts.com/v1/prices/cheap?origin=PAR&destination=ROM&currency=usd
```

Also documented and available if needed: `/v1/prices/direct`,
`/v1/prices/calendar`, `/v1/prices/monthly`, `/v1/city-directions`,
`/v2/prices/latest`, `/v2/prices/month-matrix`.

### Attribution

- **`marker`** — the affiliate identifier. Without it a click earns nothing.
- **`sub_id`** — free-text sub-identifier surfaced in Travelpayouts statistics.
  We send our click UUID here, which is what makes a booking traceable back to
  the page that produced it.

### Rate limits

The partner-links API is documented at **100 requests per minute per marker**,
maximum **10 links per request**. The adapter returns `RATE_LIMITED` on HTTP 429
rather than retrying blindly.

---

## What is deliberately absent

`fetchConversions` is **not implemented** and `capabilities.conversionFeed` is
**false**.

Travelpayouts does have a statistics API, but its exact endpoint, parameters and
response shape were not verified during this build. Implementing it from
assumption would produce a function that appears to work and silently returns
nothing, or worse, wrong figures. Declaring a capability we have not confirmed is
worse than lacking it.

**To complete this:** read the current statistics API documentation, implement
`fetchConversions`, flip `conversionFeed` to true, and add the scheduled job that
calls it. Until then `affiliate_conversions` stays empty — which is an honest
zero, not a broken pipeline.

---

## Activation

```bash
TRAVELPAYOUTS_MARKER="your-marker"        # required
TRAVELPAYOUTS_API_TOKEN="your-api-token"  # only for flight data
TRAVELPAYOUTS_CURRENCY="usd"              # optional
TRAVELPAYOUTS_LOCALE="en"                 # optional
```

Then in the admin: set the `travelpayouts` provider to **active**, set the
relevant programmes to **active**, and create affiliate links.

### Why an unconfigured provider fails loudly

`ensureProvidersRegistered()` skips any provider with no credentials, so
`/go/[slug]` returns **404** rather than redirecting.

That is deliberate. Redirecting without a marker would send the visitor to the
partner, look entirely successful, and earn nothing — the worst of both outcomes.
A 404 is visible in monitoring on the first click.

---

## Adding another provider

1. Create `src/core/affiliate/providers/<name>.ts` implementing
   `AffiliateProvider`.
2. Declare `capabilities` honestly — omit optional methods you have not verified.
3. Register it in `bootstrap.ts` behind its own environment check.
4. Add the provider and its programmes through the admin.

No page, component or route changes. That is the entire point of the abstraction.

Researched but not implemented: **Viator** (tiered API; full access needs
approval and certification; ~8% base, up to ~30% at higher tiers, 30-day
attribution) and **GetYourGuide** (comparable 8–30%; known quirks around
product-option mapping and 2–5 minute availability propagation). Both are also
reachable through Travelpayouts, which is why neither is a direct integration
yet.

---

## Compliance

- Affiliate links carry `rel="sponsored nofollow noopener"`. `sponsored` is the
  attribute search engines expect on a paid link; omitting it is a policy problem.
- Disclosure appears **in context** on every page carrying affiliate links, not
  only in the footer. This is required by the FTC, the UK CAP Code and
  equivalents elsewhere.
- No price, availability or commission figure is ever displayed unless it came
  from a live provider response.

## Sources

- [Travelpayouts — API and data](https://support.travelpayouts.com/hc/en-us/categories/200358578-API-and-data)
- [Flight Data Access API](https://travelpayouts.github.io/slate/)
- [API for partner links](https://support.travelpayouts.com/hc/en-us/articles/25289759198226-API-for-Travelpayouts-partner-links)
- [ID and SubID](https://support.travelpayouts.com/hc/en-us/articles/203955653-ID-and-SubID-Affiliate-marker-and-additional-marker)
