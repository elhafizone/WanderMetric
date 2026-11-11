# WanderMetric on WordPress

The WordPress rebuild of wandermetric.com. Two pieces, both custom:

| Piece | Path | Holds |
|---|---|---|
| **WanderMetric Core** (plugin) | `wp-content/plugins/wandermetric-core` | All logic: offers, the ten sections, places, the publish gate, URLs, `/go/` redirect and click log, SEO, the JSON importer |
| **WanderMetric Atlas** (theme) | `wp-content/themes/wandermetric` | Presentation only. Reads offers through `wm_*` functions; never stores data or builds affiliate URLs |

No page builder, no SEO plugin, no theme JavaScript.

## Rules carried over from the Next.js site

- **Same URLs**: `/{section}/`, `/{section}/{country}/`, `/{section}/{country}/{slug}/`,
  `/countries/{country}/`, `/countries/{country}/{city}/`. Rankings carry over.
- **Never fabricate data.** Offer fields hold only what the partner listing said.
- **Publish gate** (`includes/publish-gate.php`): 800+ characters, facts, https source
  and affiliate URLs, read-on date, one section, a place, partner images with a credit
  and a unique primary image. A failing offer goes back to draft with the reasons.
- **Affiliate URLs live in post meta**, never in templates; links go through `/go/{slug}/`.
- **Collect the minimum**: the click log stores offer, time, from-path and referrer host.
  No IP. Fonts and images are served from our own domain.
- **Country pages** with fewer than 3 offers are `noindex`.

## Local development

1. In Local, create a site named `wandermetric` (PHP 8.2+, nginx, MySQL), then **Start site**.
2. In the plugin folder: `composer install --no-dev` (Parsedown, for the importer).
3. From the repo root, in Git Bash:

   ```bash
   bash wordpress/setup-local.sh wandermetric --publish
   ```

   This links the theme and plugin into the site, activates them, sets pretty
   permalinks and imports `content/offers/**` (partner images are downloaded into the
   media library). Offers the gate rejects stay drafts and are listed with the reason.

## Not built yet

- Consent notice, then Google Analytics (ad features off) and the flight-search widget.
- XML sitemap provider for the section and country routes (core sitemaps cover offers).
- 301s from the old Next.js redirects in `next.config.ts`.
- Subscribers and click history export from Supabase.
- Image sizes for theme photographs (served at original size for now).
