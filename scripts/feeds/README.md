# Catalogue feeds

Each script reads one programme's official data and writes catalogue offers to
`content/offers/<programme>/`. Every figure in a generated file comes from that
data; nothing is estimated or filled in. Sources and their checks:
`docs/travelpayouts.md`.

```bash
npm run feeds:all          # WeGoTrip, then Airalo, then check:offers
npm run feeds:wegotrip -- --target 720 --per-city 30
npm run feeds:airalo
```

Options: `--dry` (write nothing), `--refresh` (bypass the cache in
`scripts/feeds/.cache/`, git-ignored; it otherwise lasts 20 hours),
`--date YYYY-MM-DD`.

| Feed | Source | Writes |
|---|---|---|
| `wegotrip.mjs` | `https://app.wegotrip.com/api/v2` | The most popular products on sale, at most `--per-city` per city, up to `--target` |
| `airalo.mjs` | `https://www.airalo.com/products.xml` | One offer per country with every local plan and its price |

## What a feed does

- Skips products the site already has as hand-written (editorial) offers.
- Keeps a product's slug once it has one, so its URL never moves.
- Leaves a file alone when only the date would change and the stored date is
  under 14 days old, so the server has nothing new to import.
- Deletes the file of a product that is no longer on sale. The next bundle
  import puts that page back to draft (`includes/bundle-import.php`).
- Adds new countries and cities to `content/places.json` (keyed by ISO code,
  through Travelpayouts' country list) and drops places no offer uses.
- Refuses any offer that would fail the publish gate
  (`lib/validate-offer.mjs`, which mirrors `includes/publish-gate.php`).

Affiliate links use Travelpayouts' documented template with the programme's
campaign and promo IDs and a sub ID per offer (`705982.wm-wgt<id>`,
`705982.wm-airalo-<country>`).

## Then

```bash
bash wordpress/bundle-offers.sh   # copies offers and places into the plugin
```

Deploy the plugin. The server imports new or changed files in batches of about
four minutes each until none are left (Offers → Import log shows progress).

## Adding a programme

Use `wegotrip.mjs` as the model: read the source, skip what is hand-written,
build each offer with `writeGenerated`, validate with `offerProblems`, and
delete files of products that are gone with `removeGenerated`. Record the
source and the date you verified it in `docs/travelpayouts.md` first.
