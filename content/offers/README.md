# WanderMetric Offer Guides Directory

This directory contains the authoritative JSON files defining all WanderMetric product guides, organized by affiliate program:

```
content/offers/
├── airalo/
├── ekta/
├── kkday/
├── klook/
├── localrent/
├── radical-storage/
├── tiqets/
└── welcome-pickups/
```

## Adding or Editing an Offer

Every offer file must strictly comply with the **WanderMetric Visual Inventory Policy** (`docs/VISUAL-INVENTORY-POLICY.md`) and the publishing gate rules.

### Requirements for Publishing:
1. **Editorial Quality:** `body` markdown must be at least 800 characters and contain evidence-based analysis (facts read directly from the live listing).
2. **Visual Inventory Compliance:**
   - `facts.images`: At least 1 product-specific photograph (`url` + descriptive `alt`).
   - `facts.image_credit`: Explicit partner or photographer name.
   - **Primary Image Uniqueness:** The first image must not collide with any other offer's primary photo.
   - **Zero AI / Generic Stock:** No fabricated images or generic city placeholders.
3. **Verification:**
   Run `npm run check:visuals` before staging or importing.
