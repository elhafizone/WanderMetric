# SEO

SEO is the primary traffic channel, so it is structural rather than decorative:
metadata, canonicals and sitemaps are generated from data, never hand-written per
page.

---

## URL structure

```
/destinations                              index
/destinations/{country}                    country page
/destinations/{country}/{city}             city page
/guides                                    index
/guides/{slug}
/hotels · /hotels/{city} · /hotels/{city}/{slug}
/activities · /activities/{city} · /activities/{city}/{slug}
/tours · /tours/{city} · /tours/{city}/{slug}
/flights · /flights/{slug}
/deals · /deals/{slug}
/search                                    noindex
/go/{slug}                                 noindex, disallowed
```

Every path is produced by a builder in `src/lib/paths.ts`. Components never
assemble a URL by hand, so a URL shape changes in one place and every link,
breadcrumb, sitemap entry and future mobile deep link follows.

**Activities and tours share one table but live at separate roots.** They are
different search intents and deserve their own landing pages; `kind` decides
which root a record appears under.

---

## Rendering

| Page type | Strategy | Revalidate | Why |
|---|---|---|---|
| Home | ISR | 1 h | Aggregates several listings |
| Destination, guide, hotel, activity, tour | ISR | 24 h | Slow-changing, must be fast |
| Deals | ISR | 15 min | An expired offer on screen is worse than a slower page |
| Listings | ISR | 1 h | |
| Search | Dynamic | — | Not indexed |
| Admin, `/go` | Dynamic | — | Private / must never cache |

Public pages use a **cookie-free Supabase client**. This is load-bearing: the
session-aware client reads cookies, and reading cookies opts a route out of
static rendering entirely. Using it on public pages would have silently cost ISR
everywhere.

`generateStaticParams` pre-renders only rows that actually exist. No URL is ever
manufactured to inflate a count.

---

## Metadata

`buildMetadata()` produces canonical, Open Graph and Twitter tags from one input.
Every indexable page calls it; none assembles metadata by hand.

`metadataBase` is set from `NEXT_PUBLIC_SITE_URL`, so relative paths resolve to
the right origin per environment — localhost in development, the real domain in
production.

---

## Structured data

Emitted once in the root layout, so it cannot drift between routes:

- `Organization` and `WebSite`, with a `SearchAction` pointing at `/search`.

Per page type:

| Page | Type |
|---|---|
| City destination | `TouristDestination` + `GeoCoordinates` + `containedInPlace` |
| Country | `Country` |
| Guide, deal | `Article` |
| Hotel | `Hotel` + `PostalAddress` (+ `starRating` when known) |
| Activity, tour | `TouristAttraction` |
| Every page | `BreadcrumbList` |
| Listings | `ItemList` |

### What is deliberately never emitted

**No `aggregateRating`. No `priceRange`. No `Offer`. No `review`.**

The database has nowhere to store a price, rating or review, because those belong
to providers and are fetched live. Emitting them would be simultaneously
fabrication and a structured-data policy violation — and invented review markup
is one of the fastest routes to a manual action.

`FAQPage` is used only where a real FAQ exists on the page.

---

## Sitemap and robots

`sitemap.xml` is generated from published rows across seven tables, deduplicated,
with real `lastModified` values. RLS means the anon client can only see published
content, so "is this indexable?" is answered by the database rather than
duplicated in the sitemap code.

**At the 50,000-URL limit this must be split behind a sitemap index.** Currently
38 URLs.

`robots.txt` disallows `/go/`, `/admin/` and `/api/`, and points at the sitemap.

---

## Preventing thin and duplicate content

This is the difference between a travel business and a penalised content farm.

**1. The publish gate is a database constraint.**

```sql
check (status <> 'published' or (body is not null and length(btrim(body)) >= 300))
```

Destinations need 300+ characters of body and a 50+ character excerpt; guides
need 500+. Enforced in the database, not the UI, because a UI rule is a
suggestion that any script or future API path can bypass. The admin translates
the resulting error into plain instructions.

**2. Search results are noindex.** Internal search generates unbounded URLs with
no unique value.

**3. Slug changes write 301s automatically.** A trigger inserts into `redirects`
whenever a published slug changes, and re-targets existing redirects so chains
collapse to a single hop. Renaming a published URL without a redirect silently
destroys accumulated ranking.

**4. Canonical on every indexable page**, absolute, from the route builder.

**5. Pagination uses real anchors** with `rel="prev"`/`rel="next"`, so crawlers
can follow them.

**6. Depth before breadth.** Two hundred genuinely useful city pages beat twenty
thousand stubs. Nothing in this system generates pages in bulk.

---

## Performance

Core Web Vitals are an SEO input, not a separate concern.

- **Server Components by default.** The entire public site ships three client
  components: the newsletter form, the admin sign-out button and the login form.
  The mobile menu is a native `<details>` element — a hamburger that needs React
  to open is a poor trade when most travel arrivals are mobile and often on
  patchy connections.
- **`next/image`** with explicit `sizes`, AVIF/WebP, and `priority` on the first
  three cards only.
- **Hero images carry a deterministic placeholder** derived from the title, so a
  missing photo still has stable dimensions and contributes no layout shift.
- **Card queries never fetch body text.** Listing queries select only what a card
  renders — on an ISR page that would otherwise be wasted bandwidth on every
  revalidation.
- **Concurrent queries.** Independent fetches on a page run in `Promise.all`.
- `text-wrap: balance` on headings, `aspect-ratio` on every image container, and
  `prefers-reduced-motion` respected globally.

---

## Accessibility

Semantic landmarks, a skip link, visible focus states, labelled form controls,
`aria-live` on result counts, and **alt text enforced by a database constraint** —
an image without it cannot exist.

---

## Not yet done

- [ ] Search Console and Bing Webmaster verification
- [ ] OG images (currently text-only cards where no hero exists)
- [ ] Internal-link graph (`internal_links` table exists, unpopulated)
- [ ] `hreflang` — single-locale for now
- [ ] Sitemap index, once the corpus warrants it
- [ ] Real photography; the placeholder is honest but images sell travel
