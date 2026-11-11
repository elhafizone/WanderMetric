/**
 * WanderMetric Visual Inventory Policy Enforcement
 *
 * Implements the 9 rules of WanderMetric's Visual Inventory Policy:
 * 1. Product-specific imagery mandate for all new/reviewed offers.
 * 2. Pre-selection inventory inspection to prevent duplication.
 * 3. Strict primary image uniqueness (no two offers share facts.images[0]).
 * 4. Zero fabricated, AI, or random stock imagery.
 * 5. Verified provenance, rights, and explicit partner attribution (image_credit).
 * 6. Prohibition of silent city-level fallbacks for new offers.
 * 7. Automated pre-publish validation gate in import/publish pipeline.
 * 8. Whitelisted legacy offers allowed in transition for progressive review.
 * 9. Hard gate preventing new offers without compliance.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Recognized legacy offers (26 files) imported before the Visual Inventory Policy
 * was institutionalized. In accordance with Rule 8, these are tracked in a controlled
 * whitelist to be upgraded progressively during individual reviews rather than mass-mutated.
 */
export const LEGACY_OFFERS_WITHOUT_IMAGES = new Set([
  "airalo-esim-france",
  "airalo-esim-italy",
  "airalo-esim-japan",
  "airalo-esim-portugal",
  "airalo-esim-spain",
  "ekta-schengen-visa-travel-insurance",
  "ekta-travel-insurance-japan",
  "klook-japan-shinkansen-tickets",
  "klook-tokyo-to-hiroshima-shinkansen",
  "klook-tokyo-to-kyoto-highway-bus",
  "klook-tokyo-to-kyoto-shinkansen",
  "localrent-car-hire-egypt",
  "localrent-car-hire-france",
  "localrent-car-hire-italy",
  "localrent-car-hire-portugal",
  "localrent-car-hire-spain",
  "radical-storage-luggage-storage-barcelona",
  "radical-storage-luggage-storage-lisbon",
  "radical-storage-luggage-storage-madrid",
  "radical-storage-luggage-storage-paris",
  "radical-storage-luggage-storage-rome",
  "welcome-pickups-transfers-barcelona",
  "welcome-pickups-transfers-lisbon",
  "welcome-pickups-transfers-madrid",
  "welcome-pickups-transfers-paris",
  "welcome-pickups-transfers-rome",
]);

/**
 * Normalizes a URL for comparison (trims whitespace and trailing slashes).
 */
export function normalizeImageUrl(url) {
  if (typeof url !== "string") return "";
  return url.trim().replace(/\/+$/, "");
}

/**
 * Scans content/offers and builds the global visual inventory index.
 */
export function buildVisualInventory(rootDir = "content/offers", publicDir = "public") {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedPublic = path.resolve(publicDir);

  const files = readdirSync(resolvedRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) =>
      readdirSync(path.join(resolvedRoot, d.name))
        .filter((f) => f.endsWith(".json"))
        .map((f) => path.join(resolvedRoot, d.name, f)),
    );

  const primaryImageMap = new Map(); // normalizedUrl -> Array<{ file, slug, programme, title }>
  const allImageMap = new Map(); // normalizedUrl -> Array<{ file, slug, isPrimary, alt }>
  const offersWithImages = [];
  const legacyOffers = [];
  const errors = [];

  for (const filePath of files) {
    const relFile = path.relative(resolvedRoot, filePath).replace(/\\/g, "/");
    let content;
    try {
      content = JSON.parse(readFileSync(filePath, "utf8"));
    } catch (e) {
      errors.push(`Failed to parse ${relFile}: ${e.message}`);
      continue;
    }

    const { slug, programme, title, facts } = content;
    const images = facts?.images;
    const credit = facts?.image_credit;

    if (Array.isArray(images) && images.length > 0 && typeof credit === "string" && credit.trim().length > 0) {
      offersWithImages.push({ file: relFile, slug, programme, imageCount: images.length });

      images.forEach((img, index) => {
        if (!img || typeof img.url !== "string") return;
        const normUrl = normalizeImageUrl(img.url);
        if (!normUrl) return;

        const isPrimary = index === 0;
        const entry = { file: relFile, slug, programme, title, isPrimary, alt: img.alt || "" };

        if (!allImageMap.has(normUrl)) allImageMap.set(normUrl, []);
        allImageMap.get(normUrl).push(entry);

        if (isPrimary) {
          if (!primaryImageMap.has(normUrl)) primaryImageMap.set(normUrl, []);
          primaryImageMap.get(normUrl).push(entry);
        }

        // Verify local asset existence
        if (normUrl.startsWith("/imagery/")) {
          const diskPath = path.join(resolvedPublic, normUrl.replace(/^\//, ""));
          if (!existsSync(diskPath)) {
            errors.push(`Local asset missing on disk: ${normUrl} referenced by ${relFile}`);
          }
        }
      });
    } else {
      legacyOffers.push({ file: relFile, slug, programme });
    }
  }

  // Detect primary collisions
  const collisions = [];
  for (const [url, usages] of primaryImageMap.entries()) {
    if (usages.length > 1) {
      collisions.push({ url, usages });
    }
  }

  return {
    totalFiles: files.length,
    offersWithImages,
    legacyOffers,
    primaryImageMap,
    allImageMap,
    collisions,
    errors,
  };
}

/**
 * Validates an offer against the Visual Inventory Policy.
 *
 * @param {object} offer - The offer object from JSON
 * @param {string} fileLabel - Name or relative path of the offer file
 * @param {object} inventory - Pre-built inventory from buildVisualInventory
 * @param {object} [options]
 * @param {boolean} [options.isPublish=false] - Whether this offer is being published
 * @param {string} [options.publicDir="public"] - Directory for public assets
 */
export function validateOfferVisuals(offer, fileLabel, inventory, options = {}) {
  const isPublish = options.isPublish ?? false;
  const publicDir = path.resolve(options.publicDir ?? "public");
  const slug = offer.slug;
  const isLegacy = LEGACY_OFFERS_WITHOUT_IMAGES.has(slug);

  const images = offer.facts?.images;
  const credit = offer.facts?.image_credit;
  const hasImagesArray = Array.isArray(images) && images.length > 0;
  const hasCredit = typeof credit === "string" && credit.trim().length > 0;

  // Case 1: facts.images is provided but credit is missing
  if (hasImagesArray && !hasCredit) {
    throw new Error(
      `VISUAL POLICY VIOLATION (${fileLabel}): facts.images is provided but facts.image_credit is missing or empty.\n` +
        `Rule 5 requires explicit partner/photographer attribution for all imagery.`,
    );
  }

  // Case 2: Offer lacks product imagery entirely
  if (!hasImagesArray) {
    if (isLegacy) {
      // Legacy offer permitted during grace period with an audit log
      return {
        status: "legacy_grace",
        message: `[VISUAL NOTICE] ${slug} is a recognized legacy offer without product imagery (scheduled for gradual remediation).`,
      };
    }

    if (isPublish) {
      throw new Error(
        `VISUAL POLICY VIOLATION (${fileLabel}): Offer "${slug}" cannot be published without product-specific imagery.\n` +
          `Rule 1 & Rule 6 mandate authentic product imagery (facts.images + facts.image_credit) for all newly published offers.\n` +
          `Generic destination/city fallbacks are strictly prohibited for new or reviewed offers.`,
      );
    } else {
      console.warn(
        `[VISUAL WARNING] (${fileLabel}): Offer "${slug}" has no product-specific imagery. It cannot be published until genuine imagery is added.`,
      );
      return {
        status: "draft_warning",
        message: `Missing product imagery. Valid for draft only.`,
      };
    }
  }

  // Validate each image entry
  const seenInOffer = new Set();
  images.forEach((img, idx) => {
    if (typeof img !== "object" || img === null) {
      throw new Error(`VISUAL POLICY VIOLATION (${fileLabel}): facts.images[${idx}] must be an object with { url, alt }.`);
    }

    const rawUrl = img.url;
    if (typeof rawUrl !== "string" || !rawUrl.trim()) {
      throw new Error(`VISUAL POLICY VIOLATION (${fileLabel}): facts.images[${idx}].url is missing or empty.`);
    }

    const normUrl = normalizeImageUrl(rawUrl);
    if (!normUrl.startsWith("https://") && !normUrl.startsWith("/imagery/")) {
      throw new Error(
        `VISUAL POLICY VIOLATION (${fileLabel}): facts.images[${idx}].url ("${rawUrl}") is invalid. Must be an https:// URL or local /imagery/... path.`,
      );
    }

    if (normUrl.startsWith("/imagery/")) {
      const diskPath = path.join(publicDir, normUrl.replace(/^\//, ""));
      if (!existsSync(diskPath)) {
        throw new Error(
          `VISUAL POLICY VIOLATION (${fileLabel}): Local image "${normUrl}" not found on disk at "${diskPath}". Rule 5 requires all local assets to be committed.`,
        );
      }
    }

    // Check alt text structure
    if (typeof img.alt !== "string") {
      throw new Error(
        `VISUAL POLICY VIOLATION (${fileLabel}): facts.images[${idx}].alt must be a string describing the frame.`,
      );
    }

    // Duplicate check within same offer
    if (seenInOffer.has(normUrl)) {
      throw new Error(
        `VISUAL POLICY VIOLATION (${fileLabel}): Image URL "${rawUrl}" is duplicated multiple times within the same offer.`,
      );
    }
    seenInOffer.add(normUrl);

    // Primary image uniqueness check against global inventory
    if (idx === 0 && inventory?.primaryImageMap) {
      const existingUsages = inventory.primaryImageMap.get(normUrl) || [];
      const conflicts = existingUsages.filter((u) => u.slug !== slug);
      if (conflicts.length > 0) {
        const conflict = conflicts[0];
        throw new Error(
          `VISUAL POLICY VIOLATION (${fileLabel}): Primary image collision detected!\n` +
            `URL: "${rawUrl}"\n` +
            `This image is already the primary image of offer "${conflict.slug}" (${conflict.file}).\n` +
            `Rule 3 strictly forbids sharing primary imagery across offers. Every offer must have its own unique primary photo.`,
        );
      }
    }
  });

  return {
    status: "ok",
    imageCount: images.length,
    credit,
  };
}
