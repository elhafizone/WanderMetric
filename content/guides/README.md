# Guides

One JSON file per guide, `<slug>.json`. `wordpress/bundle-offers.sh` copies them
into the plugin (`data/guides/`); after a deploy the site imports new or changed
files and publishes each one through the guide gate (`includes/guides.php`).
Public URL: `/guides/<slug>`.

## Fields

| Field | What it is |
|---|---|
| `slug`, `title` | URL slug and the question as the H1. Keep the title under 60 characters where you can. |
| `section` | One of the ten section slugs. |
| `country`, `city` | Place slugs from `includes/places.php`. `city` is optional. |
| `summary` | The standfirst and meta description. |
| `answer` | The short answer shown first: two or three sentences that settle the question. |
| `checked_on` | `YYYY-MM-DD`, the day the facts were checked against the sources. |
| `offers` | Slugs of published offers the guide covers (at least one). |
| `sources` | `[{name, url, read_on}]`, at least two, each `https://` with its own date. |
| `body` | Markdown. `##` headings become the "On this page" contents. Tables are fine. |

## The rule

Every price, time and rule in a guide comes from a page in `sources`, read on the
date given: operators, tourism boards and the airport first, our own dated offer
pages second. If a figure can't be confirmed, leave it out and say so ("not
published"). No estimates, no figures from memory, no "typically". The gate also
needs 3,000+ characters of text.
