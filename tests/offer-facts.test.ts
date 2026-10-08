import { describe, expect, it } from "vitest";

import {
  factRows,
  factsCaution,
  formatReadOn,
  offerOptions,
  offerPhotos,
} from "@/core/content/offer-facts";

describe("factRows", () => {
  it("labels known keys and joins arrays", () => {
    const rows = factRows({
      departs_from: "Rome",
      guide_language: ["English", "Italian"],
      duration_minutes: 120,
    });
    expect(rows).toEqual([
      { key: "departs_from", label: "Departs from", value: "Rome" },
      { key: "guide_language", label: "Guide language", value: "English, Italian" },
      { key: "duration_minutes", label: "Duration", value: "2 hours" },
    ]);
  });

  it("produces no row for an absent or empty fact", () => {
    expect(factRows({ operator: "", transport: null, included: [] })).toEqual([]);
    expect(factRows(null)).toEqual([]);
  });

  it("keeps sections out of the rows and humanises unknown keys", () => {
    const rows = factRows({
      options: [{ name: "x" }],
      unclear_on_listing: "ask first",
      some_new_fact: "yes",
    });
    expect(rows).toEqual([{ key: "some_new_fact", label: "Some new fact", value: "yes" }]);
  });
});

describe("offerOptions and factsCaution", () => {
  it("reads named options and joins their detail", () => {
    expect(
      offerOptions({
        options: [
          { name: "Hosted entry", format: "Short intro", cancellation: "Free cancellation up to 7 days before" },
          { format: "no name, skipped" },
        ],
      }),
    ).toEqual([
      { name: "Hosted entry", detail: "Short intro. Free cancellation up to 7 days before" },
    ]);
  });

  it("returns nothing when the facts carry no options or caution", () => {
    expect(offerOptions({})).toEqual([]);
    expect(factsCaution({})).toBeNull();
    expect(factsCaution({ unclear_on_listing: "Confirm admission." })).toBe("Confirm admission.");
  });
});

describe("formatReadOn", () => {
  it("formats an ISO date and rejects bad input", () => {
    expect(formatReadOn("2026-10-04")).toBe("4 October 2026");
    expect(formatReadOn("nope")).toBeNull();
    expect(formatReadOn(null)).toBeNull();
  });
});

describe("offerPhotos", () => {
  it("keeps https photographs and drops everything else", () => {
    const photos = offerPhotos({
      images: [
        { url: "https://cdn.example.com/a.jpg", alt: "A" },
        { url: "http://cdn.example.com/b.jpg", alt: "B" },
        { url: "javascript:alert(1)", alt: "C" },
        { alt: "no url" },
        "not an object",
      ],
    });
    expect(photos).toEqual([{ url: "https://cdn.example.com/a.jpg", alt: "A" }]);
  });

  it("returns nothing when the listing has no photographs, and keeps them out of the rows", () => {
    expect(offerPhotos({})).toEqual([]);
    expect(offerPhotos(null)).toEqual([]);
    expect(
      factRows({ images: [{ url: "https://cdn.example.com/a.jpg", alt: "" }], image_credit: "Tiqets" }),
    ).toEqual([]);
  });
});
