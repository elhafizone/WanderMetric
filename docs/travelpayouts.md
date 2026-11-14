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

## Programme data for catalogue offers (verified 13 November 2026)

Travelpayouts lists the brands that give partners an API or a data feed in
[Brands that provide access to APIs and data feeds](https://support.travelpayouts.com/hc/en-us/articles/20384016664594-Brands-that-provide-access-to-APIs-and-data-feeds-for-Travelpayouts-partners).
Each source below was opened and queried on 13 November 2026.

| Programme | Source | What it returned on 13 Nov 2026 | Brand approval | Used by |
|---|---|---|---|---|
| WeGoTrip | Public API `https://app.wegotrip.com/api/v2` ([docs](https://gist.github.com/4eRTuk/6b6a4b06b5f6d4ce90973e1931052991)) | 2,898 products, 682 cities, 87 countries; price, duration, rating, images, inclusions | No | `scripts/feeds/wegotrip.mjs` |
| Airalo | Feed `https://www.airalo.com/products.xml` ([docs](https://support.travelpayouts.com/hc/en-us/articles/17131439719826-Data-from-Airalo)) | 3,359 packages; 206 countries plus regional plans; USD prices, validity, data, networks | No | `scripts/feeds/airalo.mjs` |
| Tiqets | Two Google Sheets linked from the programme page | 473 top products by city; 165 exclusive products with URLs | No | not yet |
| intui.travel | Transfer search API ([docs](https://support.travelpayouts.com/hc/en-us/articles/360016804119-intui-travel-API)) | Hubs, resorts and priced transfer results | No | not yet |
| Aviasales | Flight Data API | Cheapest fares, popular routes | No (Data API) | not yet |
| Kiwi.com, GetTransfer | Partner APIs | — | **Yes**: the owner must request access | not yet |

Price checks (13 Nov 2026):
- WeGoTrip: the product's top-level `price` matches the "from" price on the
  live page (Pantheon p4900: €16.35 in both). `priceLevels` and ticket
  `pricingCategories` do **not** match the page; never show them.
- WeGoTrip: `rating` and `ratingsCount` match the live page.

Affiliate links for generated offers use Travelpayouts' documented link
template (`https://tp.media/r?campaign_id=…&marker=…&p=…&trs=…&u=<encoded URL>`),
with the `campaign_id` and `p` values already used by this site's own
dashboard-made links (WeGoTrip 150 / 4487, Airalo 541 / 8310). The marker
carries a sub ID per offer (`705982.wm-<id>`), so a booking can be traced to
its page.

## Verified capabilities

| Capability | Status | Notes |
|---|---|---|
| Partner links | ✅ Implemented | `POST /links/v1/create` per click; needs token + project ID |
| Search deep links | ✅ Implemented | `{q}` / `{q_slug}` / `{origin}` / `{destination}` / `{ddmm}` placeholders in a link's destination |
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

- **`marker`** — the partner ID. Without it a click earns nothing.
- **`trs`** — the project ID the brand programmes are connected under.
- **`sub_id`** — sub-identifier surfaced in Travelpayouts statistics. Only Latin
  letters, digits and `_` are allowed, so our click UUID is sent with its
  hyphens removed. That is still what makes a booking traceable to a page.

### Partner links (corrected September 2026)

The first version appended `?marker=&sub_id=` to the brand URL. That is not a
documented tracking method for the brands this account is connected to (Airalo,
Klook, Tiqets…) and would have earned nothing. Untemplated links are now
converted at click time through the documented partner-links API:

```
POST https://api.travelpayouts.com/links/v1/create
x-access-token: <token>
{ "trs": <project>, "marker": <partner id>, "shorten": false,
  "links": [{ "url": "<brand url>", "sub_id": "<click id>" }] }
```

A brand the project is not connected to comes back as HTTP 200 with
`"code": "failed"` on the link, so success is read from the link, not the status.
The API is unavailable for Kiwi.com, Expedia UK, HolidayTaxis, Ticketmaster,
Priority Pass and Indrive. Without a token and project ID, untemplated links fail
with NOT_CONFIGURED rather than emitting an unattributed URL.

### Search links

A link's `destination_url` may carry placeholders the visitor fills from the home
search tabs, validated and percent-encoded in `src/core/affiliate/destination.ts`.
Formats checked against the live brand sites:

| Tab | Brand | Destination URL |
|---|---|---|
| Flights | Aviasales | `https://www.aviasales.com/search/{origin}{ddmm}{destination}1` |
| Things to do | Klook | `https://www.klook.com/en-US/search/result/?query={q}` |
| Airport transfers | Welcome Pickups | `https://www.welcomepickups.com/{q_slug}/` |
| Travel eSIM | Airalo | `https://www.airalo.com/{q_slug}-esim` |

A tab is shown only when its link row is active and the redirector is fully
configured.

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
TRAVELPAYOUTS_MARKER="your-partner-id"      # required
TRAVELPAYOUTS_PROJECT_ID="your-project-id"  # required for partner links
TRAVELPAYOUTS_API_TOKEN="your-api-token"    # required for partner links and flight data
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
