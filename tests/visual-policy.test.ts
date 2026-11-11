import { describe, expect, it } from "vitest";
import {
  buildVisualInventory,
  normalizeImageUrl,
  validateOfferVisuals,
} from "../scripts/lib/visual-policy.mjs";

describe("Visual Inventory Policy - Unit & Integration Tests", () => {
  it("normalizes image URLs correctly", () => {
    expect(normalizeImageUrl("  https://example.com/photo.jpg/  ")).toBe("https://example.com/photo.jpg");
    expect(normalizeImageUrl("")).toBe("");
  });

  it("builds the global inventory index and detects legacy vs modern offers", () => {
    const inventory = buildVisualInventory("content/offers", "public");
    // Counts grow as offers are authored; assert the invariants, not a snapshot.
    expect(inventory.totalFiles).toBe(inventory.offersWithImages.length + inventory.legacyOffers.length);
    expect(inventory.offersWithImages.length).toBeGreaterThan(0);
    // The legacy whitelist may only shrink — new offers must never join it.
    expect(inventory.legacyOffers.length).toBeLessThanOrEqual(26);
    expect(inventory.collisions.length).toBe(0);
    expect(inventory.errors.length).toBe(0);
  });

  it("permits recognized legacy offers under the transition grace period", () => {
    const inventory = buildVisualInventory("content/offers", "public");
    const legacyOffer = {
      slug: "airalo-esim-france",
      title: "Airalo eSIM France",
      facts: {},
    };
    const result = validateOfferVisuals(legacyOffer, "airalo-esim-france.json", inventory, { isPublish: true });
    expect(result.status).toBe("legacy_grace");
  });

  it("strictly REJECTS newly published offers lacking product imagery (Rule 1 & Rule 6)", () => {
    const inventory = buildVisualInventory("content/offers", "public");
    const newOfferWithoutImages = {
      slug: "brand-new-hotel-offer",
      title: "Brand New Hotel Offer",
      facts: {},
    };
    expect(() =>
      validateOfferVisuals(newOfferWithoutImages, "new-offer.json", inventory, { isPublish: true }),
    ).toThrowError(/cannot be published without product-specific imagery/);
  });

  it("strictly REJECTS offers with images but missing image_credit (Rule 5)", () => {
    const inventory = buildVisualInventory("content/offers", "public");
    const offerWithoutCredit = {
      slug: "brand-new-hotel-offer",
      title: "Brand New Hotel Offer",
      facts: {
        images: [{ url: "https://example.com/hotel.jpg", alt: "A hotel room" }],
      },
    };
    expect(() =>
      validateOfferVisuals(offerWithoutCredit, "new-offer.json", inventory, { isPublish: true }),
    ).toThrowError(/facts\.image_credit is missing or empty/);
  });

  it("strictly REJECTS primary image collisions across different offers (Rule 3)", () => {
    const inventory = buildVisualInventory("content/offers", "public");
    // Paris CDG primary image URL:
    const cdgPrimaryUrl =
      "https://b772872.assetcdn.net/772872/wp-content/uploads/2020/02/YK__0586.jpg";

    const collidingOffer = {
      slug: "some-other-paris-transfer",
      title: "Some Other Paris Transfer",
      facts: {
        image_credit: "Welcome Pickups",
        images: [{ url: cdgPrimaryUrl, alt: "Duplicate driver photo" }],
      },
    };

    expect(() =>
      validateOfferVisuals(collidingOffer, "colliding-offer.json", inventory, { isPublish: true }),
    ).toThrowError(/Primary image collision detected/);
  });

  it("accepts a fully compliant offer with unique imagery, valid URLs, and attribution", () => {
    const inventory = buildVisualInventory("content/offers", "public");
    const compliantOffer = {
      slug: "compliant-unique-offer",
      title: "Compliant Unique Offer",
      facts: {
        image_credit: "Authentic Partner",
        images: [
          { url: "https://cdn.example.com/unique-photo-1.jpg", alt: "Detailed description of vehicle or site" },
          { url: "https://cdn.example.com/unique-photo-2.jpg", alt: "Interior seating view" },
        ],
      },
    };

    const result = validateOfferVisuals(compliantOffer, "compliant-offer.json", inventory, { isPublish: true });
    expect(result.status).toBe("ok");
    expect(result.imageCount).toBe(2);
    expect(result.credit).toBe("Authentic Partner");
  });
});
