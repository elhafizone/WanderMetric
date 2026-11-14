<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## WanderMetric Visual Inventory Rules

1. **Product-Specific Imagery Mandate**: Every newly created or reviewed Offer must contain authentic, product-specific photography (`facts.images` + `facts.image_credit`). Generic city-level stock photos are prohibited.
2. **Pre-Selection Inventory Audit**: Check existing imagery before selecting new assets (`npm run check:visuals`).
3. **Primary Image Uniqueness**: Primary images (`facts.images[0]`) must never be shared across multiple offers.
4. **Zero AI or Synthetic Stock**: If authentic product photography is unavailable, do not substitute random stock or AI-generated images; report the gap.
5. **Provenance & Attribution**: Verify rights and provide explicit `facts.image_credit`.
6. **No Silent City Fallbacks**: New offers must not rely on city-level fallbacks when partner product assets exist.
7. **Automated Pre-Publish Gate**: The import and publish workflow (`scripts/import-offers.mjs`) automatically halts if visual policies are violated.
8. **Controlled Legacy Migration**: Do not mass-rewrite legacy offers. Upgrade them progressively during individual offer reviews.
9. **Offers come from real sources only**: Hand-written (editorial) offers are read from the live listing. Generated (catalogue) offers come only from a programme's official data through `scripts/feeds/*`, with that data's own images. The owner's target is about 1,000 offers (2026-11-13); adding offers this way is authorized, inventing them is not.
See full policy at `docs/VISUAL-INVENTORY-POLICY.md`.
