import { describe, expect, it } from "vitest";

import { buildMetadata } from "@/core/seo/metadata";
import {
  MAX_PAGE_SIZE,
  buildPageMeta,
  normalizePageRequest,
  toRange,
} from "@/core/shared/pagination";
import { HTTP_STATUS_BY_CODE, appError, err, ok } from "@/core/shared/result";
import { activityPath, destinationPath, hotelPath } from "@/lib/paths";

describe("normalizePageRequest", () => {
  it("clamps page size so a caller cannot request the whole table", () => {
    // ?perPage=100000 is the cheapest denial-of-service available to a stranger.
    expect(normalizePageRequest(1, 100_000).perPage).toBe(MAX_PAGE_SIZE);
  });

  it("falls back to sane values for junk input", () => {
    expect(normalizePageRequest(0, 0)).toEqual({ page: 1, perPage: 20 });
    expect(normalizePageRequest(-5, -5)).toEqual({ page: 1, perPage: 20 });
    expect(normalizePageRequest(null, null)).toEqual({ page: 1, perPage: 20 });
    expect(normalizePageRequest(Number.NaN, Number.NaN)).toEqual({
      page: 1,
      perPage: 20,
    });
  });

  it("floors fractional pages", () => {
    expect(normalizePageRequest(2.9, 10.7)).toEqual({ page: 2, perPage: 10 });
  });
});

describe("toRange", () => {
  it("produces an inclusive range for the requested page", () => {
    expect(toRange({ page: 1, perPage: 20 })).toEqual([0, 19]);
    expect(toRange({ page: 2, perPage: 20 })).toEqual([20, 39]);
    expect(toRange({ page: 3, perPage: 12 })).toEqual([24, 35]);
  });
});

describe("buildPageMeta", () => {
  it("computes totals and navigation flags", () => {
    const meta = buildPageMeta({ page: 2, perPage: 10 }, 35);
    expect(meta).toMatchObject({
      page: 2,
      perPage: 10,
      total: 35,
      totalPages: 4,
      hasNext: true,
      hasPrevious: true,
    });
  });

  it("reports no pages and no navigation for an empty set", () => {
    const meta = buildPageMeta({ page: 1, perPage: 10 }, 0);
    expect(meta.totalPages).toBe(0);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrevious).toBe(false);
  });

  it("has no next page on the final page", () => {
    expect(buildPageMeta({ page: 4, perPage: 10 }, 35).hasNext).toBe(false);
  });
});

describe("error taxonomy", () => {
  it("maps every domain code to an HTTP status", () => {
    expect(HTTP_STATUS_BY_CODE.NOT_FOUND).toBe(404);
    expect(HTTP_STATUS_BY_CODE.VALIDATION_FAILED).toBe(422);
    expect(HTTP_STATUS_BY_CODE.UNAUTHORIZED).toBe(401);
    expect(HTTP_STATUS_BY_CODE.FORBIDDEN).toBe(403);
    expect(HTTP_STATUS_BY_CODE.RATE_LIMITED).toBe(429);
    expect(HTTP_STATUS_BY_CODE.PROVIDER_ERROR).toBe(502);
    expect(HTTP_STATUS_BY_CODE.NOT_CONFIGURED).toBe(503);
    expect(HTTP_STATUS_BY_CODE.INTERNAL).toBe(500);
  });

  it("keeps internal detail separate from the public message", () => {
    const error = appError("INTERNAL", "constraint xyz on table abc failed", {
      publicMessage: "Something went wrong.",
    });
    expect(error.publicMessage).toBe("Something went wrong.");
    expect(error.publicMessage).not.toContain("constraint");
  });

  it("discriminates ok and err results", () => {
    const good = ok({ id: 1 });
    const bad = err(appError("NOT_FOUND", "missing"));
    expect(good.ok).toBe(true);
    expect(bad.ok).toBe(false);
    if (good.ok) expect(good.data.id).toBe(1);
    if (!bad.ok) expect(bad.error.code).toBe("NOT_FOUND");
  });
});

describe("buildMetadata", () => {
  it("emits an absolute canonical plus Open Graph and Twitter tags", () => {
    const meta = buildMetadata({
      title: "Paris travel guide",
      description: "What is worth your time in Paris.",
      path: "/destinations/france/paris",
    });

    expect(meta.alternates?.canonical).toContain("/destinations/france/paris");
    expect(String(meta.alternates?.canonical)).toMatch(/^https?:\/\//);
    expect(meta.openGraph?.title).toBe("Paris travel guide");
    expect(meta.twitter).toBeDefined();
  });

  it("honours noIndex", () => {
    const meta = buildMetadata({
      title: "Search",
      description: "Results",
      path: "/search",
      noIndex: true,
    });
    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it("indexes by default", () => {
    const meta = buildMetadata({ title: "T", description: "D", path: "/x" });
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  it("upgrades the Twitter card when an image is supplied", () => {
    const withImage = buildMetadata({
      title: "T",
      description: "D",
      path: "/x",
      image: "/hero.jpg",
    });
    const withoutImage = buildMetadata({ title: "T", description: "D", path: "/x" });

    expect(withImage.twitter).toMatchObject({ card: "summary_large_image" });
    expect(withoutImage.twitter).toMatchObject({ card: "summary" });
  });
});

describe("URL builders", () => {
  it("distinguishes a city destination from a country one", () => {
    const country = { slug: "france", id: "1", name: "France" };
    expect(destinationPath({ country, city: null })).toBe("/destinations/france");
    expect(
      destinationPath({ country, city: { id: "2", name: "Paris", slug: "paris" } }),
    ).toBe("/destinations/france/paris");
  });

  it("routes tours and activities to different roots from one table", () => {
    const city = { id: "2", name: "Paris", slug: "paris" };
    expect(activityPath({ kind: "activity", city, slug: "the-louvre" })).toBe(
      "/activities/paris/the-louvre",
    );
    expect(activityPath({ kind: "tour", city, slug: "marais-walking-tour" })).toBe(
      "/tours/paris/marais-walking-tour",
    );
  });

  it("nests a hotel under its city", () => {
    expect(
      hotelPath({ city: { id: "2", name: "Paris", slug: "paris" }, slug: "some-hotel" }),
    ).toBe("/hotels/paris/some-hotel");
  });
});
