# Offers

One JSON file per offer: `content/offers/<programme>/<slug>.json`. The folder
name is the programme slug and the file name is the offer slug.

## Two tiers

| Tier | Made by | Text | Search engines |
|---|---|---|---|
| `editorial` (default) | A person reading the live listing | 800+ characters, original | Indexed, in the sitemap |
| `catalogue` | `scripts/feeds/<programme>.mjs`, from the programme's official data | 300+ characters, built from that data | `noindex`, not in the sitemap |

A catalogue file carries `"tier": "catalogue"` and `"generated_by"`. Do not
edit one by hand: the next feed run overwrites it. To promote one, write the
text by hand, set `"tier": "editorial"` and remove `"generated_by"`; the feed
then leaves it alone.

When a product leaves the partner's data, its feed deletes the file; the next
bundle import puts that catalogue page back to draft. Deleting a hand-written
(editorial) file does not unpublish it.

## Fields

Required: `programme`, `section`, `title`, `slug`, `source_url`, `read_on`,
`affiliate_url`, `facts`, `summary`, `body`, and either `city` or `country`
(a slug from `content/places.json`).

Optional: `tier`, `kind`, `price_note`, `price_from` (number, the lowest price
the partner lists), `currency` (ISO code), `weight` (higher sorts first inside
a place), `tip`, `generated_by`.

`facts` holds what the listing or the data says. Keys with their own sections
on the page: `images`, `image_credit`, `options`, `rating`, `included_listed`,
`not_included`, `unclear_on_listing`, `duration_minutes`.

## Before bundling

```bash
npm run check:visuals   # images, credits, unique primary images
npm run check:offers    # every file against the WordPress publish gate
```

Every offer needs at least one partner image (`facts.images` + `facts.image_credit`),
and its first image must not be any other offer's first image. See
`docs/VISUAL-INVENTORY-POLICY.md`.

## Partners that refuse WordPress's image downloader

Some partner servers (Yesim, November 2026) answer WordPress's downloader with
HTTP 202 while serving the same file to an ordinary client. For those, download
the image once (e.g. `curl -fsSL -o _images/<programme>/<slug>-1.webp <url>`),
keep the original `url` in `facts.images`, and add `"file": "_images/<programme>/<file>"`.
The importer sideloads the local copy and still records `url` as the image's source.
`wordpress/bundle-offers.sh` ships `_images/` with the plugin.
