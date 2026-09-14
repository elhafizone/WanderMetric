# Entity Relationship Diagram

Generated from the live schema. See [database.md](database.md) for the reasoning
behind these structures.

---

## Editorial content

```mermaid
erDiagram
    countries ||--o{ regions : contains
    countries ||--o{ cities : contains
    regions   ||--o{ cities : contains
    countries ||--o{ destinations : "has page"
    cities    ||--o| destinations : "has page"
    cities    ||--o{ hotels : "located in"
    cities    ||--o{ activities : "located in"
    cities    ||--o{ flight_routes : origin
    destinations ||--o{ guides : "covered by"
    categories ||--o{ guides : classifies
    categories ||--o{ activities : classifies
    media     ||--o{ destinations : "hero image"
    profiles  ||--o{ guides : authors

    countries {
        uuid id PK
        char iso2 UK
        slug slug UK
        enum continent
        enum status
        timestamptz deleted_at
    }
    cities {
        uuid id PK
        uuid country_id FK
        uuid region_id FK "nullable"
        slug slug "unique per country"
        char iata_code "enables flight deep links"
        numeric latitude
        numeric longitude
    }
    destinations {
        uuid id PK
        uuid country_id FK "required"
        uuid city_id FK "null = country page"
        text body "300+ chars to publish"
        text excerpt "50+ chars to publish"
        tsvector search_vector
    }
    guides {
        uuid id PK
        slug slug UK
        text body "500+ chars to publish"
        uuid author_id FK
        int reading_minutes
    }
    hotels {
        uuid id PK
        uuid city_id FK
        smallint star_rating "classification, not a review"
        text body
    }
    activities {
        uuid id PK
        uuid city_id FK
        enum kind "activity | tour"
        int duration_minutes
    }
    deals {
        uuid id PK
        enum kind
        text discount_label "editor text, never computed"
        timestamptz ends_at "RLS hides expired rows"
    }
```

**The destination shape is the load-bearing decision.** One table serves both
`/destinations/{country}` and `/destinations/{country}/{city}`: `city_id` null
means a country page. Two partial unique indexes enforce one row of each kind.
That is why both URLs are one code path rather than two.

**No price, availability, rating or review column exists** on `hotels`,
`activities` or `flight_routes`. A schema with nowhere to put a fabricated
figure cannot accidentally publish one.

---

## Affiliate and tracking

```mermaid
erDiagram
    affiliate_providers ||--o{ affiliate_programs : offers
    affiliate_programs  ||--o{ affiliate_links : "produces"
    affiliate_programs  ||--o{ affiliate_offers : "caches"
    affiliate_links     ||--o{ affiliate_link_placements : "appears on"
    affiliate_links     ||--o{ affiliate_clicks : "generates"
    affiliate_clicks    ||--o| affiliate_conversions : "may convert"
    tracking_sessions   ||--o{ affiliate_clicks : groups
    tracking_sessions   ||--o{ page_views : groups

    affiliate_providers {
        uuid id PK
        slug slug UK
        enum status
        jsonb config "NON-SECRET only"
    }
    affiliate_links {
        uuid id PK
        uuid program_id FK
        slug slug UK "drives /go/[slug]"
        text destination_url "CHECK ^https?://"
        text deep_link_template "nullable"
    }
    affiliate_clicks {
        uuid id PK "THE click_id, sent as sub_id"
        uuid affiliate_link_id FK
        uuid provider_id FK "denormalised for reporting"
        enum content_type
        uuid content_id
        char country_code "no IP is ever stored"
        bool is_bot "bots redirect but are not recorded"
    }
    affiliate_conversions {
        uuid id PK
        text external_id "unique per provider"
        uuid click_id FK "NULLABLE - many networks omit sub_id"
        numeric commission_amount
        enum status
    }
    daily_stats {
        date stat_date
        int views
        int clicks
        numeric revenue
    }
```

Two constraints here do real work:

- `affiliate_links.destination_url` must match `^https?://`. A `javascript:`,
  `data:` or relative value can never reach the redirector, so an open redirect
  is structurally impossible rather than merely guarded against in code.
- `affiliate_conversions.click_id` is nullable. An unattributable conversion must
  stay visibly unattributed.

---

## Identity, SEO and system

```mermaid
erDiagram
    auth_users ||--|| profiles : extends
    profiles ||--o{ audit_log : performs
    profiles ||--o{ media : uploads

    profiles {
        uuid id PK,FK
        citext email UK
        enum role "admin | editor | viewer"
        bool is_active
    }
    seo_metadata {
        enum content_type
        uuid content_id
        text canonical_url
        bool robots_index
    }
    redirects {
        text from_path UK
        text to_path
        smallint status_code
        bigint hit_count
    }
    email_subscribers {
        citext email UK
        enum status "pending until confirmed"
        uuid confirmation_token UK
    }
    audit_log {
        bigserial id PK
        text action
        jsonb changes
    }
```

`seo_metadata`, `content_tags` and `affiliate_link_placements` reference content
polymorphically via `(content_type, content_id)` and carry **no foreign key**.
That is a conscious trade: one join table across ten entities is worth more than
ten per-entity tables, at the cost of referential integrity the application must
maintain.

`profiles.id` references `auth.users` with `on delete cascade`, and a trigger
mirrors new auth users into `profiles`. **The first user to sign up becomes
admin**, so the dashboard is reachable on a fresh install; everyone after
defaults to `viewer`.

`audit_log` has no update or delete policy for any role.
