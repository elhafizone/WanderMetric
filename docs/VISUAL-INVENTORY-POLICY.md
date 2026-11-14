# WanderMetric Visual Inventory Policy

**Effective Date:** 28 October 2026  
**Status:** Permanent Project Architecture Rule  
**Enforcement:** Pre-publish automated gates in `scripts/import-offers.mjs` & `npm run check:visuals`

---

## 1. Core Principle: Imagery is Evidence, Not Decoration

WanderMetric is an evidence-based travel discovery and pre-booking diligence platform. In the WanderMetric model:

> **A photo of somewhere else or another vehicle is an editorial fabrication in the exact same way an invented price, fake review, or simulated discount is.**

Images are never used merely to fill space. Every image presented on an offer guide must accurately represent the product, transfer vehicle, tour, or attraction described in the listing.

---

## 2. The Nine Permanent Rules

### Rule 1: Product-Specific Imagery Mandate
Every new or updated offer must feature authentic, verified imagery of the specific product or service being offered (`facts.images` array + `facts.image_credit`). Generic city, country, or destination stock photos are strictly prohibited as primary visual representations of an offer.

### Rule 2: Pre-Ingestion Visual Inventory Inspection
Before selecting or importing images for any new offer, authors and agents must inspect the existing visual inventory (`content/offers/**/*.json`, `src/core/media/imagery.ts`, and `public/imagery/**`) using `npm run check:visuals` to prevent duplicate or conflicting asset assignments.

### Rule 3: Primary Image Uniqueness
The primary image (`facts.images[0].url` or local editorial imagery key) must be unique to that specific offer. No two offers may share the same primary image under any circumstances when authentic alternatives exist.

### Rule 4: Zero Fabricated, Synthetic, or AI Imagery
If authentic product-specific photography cannot be obtained from the verified partner listing or official source CDN:
- **Do NOT** substitute random stock photography.
- **Do NOT** generate AI imagery.
- **Do NOT** pick an unrelated image just to bypass validation.
- **Action:** Report the condition transparently and flag the offer for manual editorial review.

### Rule 5: Provenance, Rights, and Attribution
Every image ingested into WanderMetric must have a documented provenance (official partner CDN, verified direct partner listing, or licensed public asset) and explicit attribution:
- `facts.image_credit` must explicitly name the source/partner (e.g., `"Welcome Pickups"`, `"Klook"`, `"Tiqets"`).
- Re-hosted local files in `public/imagery/` must be registered with width, height, and photographer credit in `public/imagery/CREDITS.md` and `src/core/media/imagery.ts`.

### Rule 6: Prohibition of Silent Fallbacks for New Offers
New offers are forbidden from relying on city-level fallback imagery (such as `/imagery/paris.jpg` or `/imagery/rome.jpg`) when product-specific imagery is available from the partner. City-level images exist solely for city-level discovery cards, not specific product offerings.

### Rule 7: Automated Pre-Publish Gate
Visual compliance is enforced automatically before publishing:
- `scripts/import-offers.mjs` runs `validateOfferVisuals()` prior to writing or updating rows in Supabase.
- Any new offer lacking `facts.images`, lacking `facts.image_credit`, containing broken URLs, or colliding with another offer's primary photo triggers an immediate fatal build/publish error.

### Rule 8: Controlled Legacy Migration
The 26 legacy offers in `content/offers/` that pre-date this policy are tracked in a controlled whitelist (`LEGACY_OFFERS_WITHOUT_IMAGES` in `scripts/lib/visual-policy.mjs`). They are permitted under a transitional grace status to prevent operational disruption, and will be upgraded progressively during individual scheduled reviews. They must **not** be bulk-modified with synthetic data.

### Rule 9: Offers from Real Sources Only
Every offer must pass Rules 1–8. Hand-written (editorial) offers take their images from the live listing; generated (catalogue) offers take them from the programme's official data (for example WeGoTrip's API or Airalo's feed), credited to that programme. The owner authorized catalogue generation on 13 November 2026 with a target of about 1,000 offers.

---

## 3. Data Structure Specification

In `content/offers/<programme>/<slug>.json`:

```json
{
  "facts": {
    "image_credit": "Welcome Pickups",
    "images": [
      {
        "url": "https://b772872.assetcdn.net/.../photo1.jpg",
        "alt": "Descriptive sentence explaining what is actually inside the frame"
      },
      {
        "url": "/imagery/offers/slug-local-fallback.jpg",
        "alt": "Secondary view of service class or vehicle"
      }
    ]
  }
}
```

### URL Rules:
- Must start with `https://` or `/imagery/`.
- Local assets starting with `/imagery/` must physically exist on disk in `public/imagery/`.
- Alt text must be a string describing the scene (not the title of the page or a sales pitch).

---

## 4. Verification Commands

To check the visual health of the entire project at any time:

```bash
# Run standalone visual inventory audit
npm run check:visuals

# Run full project verification suite (visuals, lint, typecheck, tests, build)
npm run verify
```
