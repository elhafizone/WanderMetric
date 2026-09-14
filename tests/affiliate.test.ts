import { describe, expect, it } from "vitest";

import {
  createTravelpayoutsProvider,
  type TravelpayoutsConfig,
} from "@/core/affiliate/providers/travelpayouts";
import {
  getAffiliateProvider,
  listAffiliateProviders,
  registerAffiliateProvider,
} from "@/core/affiliate/registry";

/**
 * Affiliate link construction.
 *
 * This is the revenue path. A link that loses its sub_id still works for the
 * visitor while silently earning nothing, which is the most expensive class of
 * bug in this codebase — so attribution is pinned explicitly.
 */

const config: TravelpayoutsConfig = { marker: "123456", currency: "usd", locale: "en" };
const provider = createTravelpayoutsProvider(config);

const CLICK_ID = "6f1d3a22-0000-4000-8000-abcdefabcdef";

describe("Travelpayouts deep links", () => {
  it("attaches the marker and forwards our click id as sub_id", async () => {
    const result = await provider.buildDeepLink({
      destinationUrl: "https://www.booking.com/city/fr/paris.html",
      clickId: CLICK_ID,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const url = new URL(result.data.url);
    expect(url.searchParams.get("marker")).toBe("123456");
    expect(url.searchParams.get("sub_id")).toBe(CLICK_ID);
    expect(result.data.trackingAttached).toBe(true);
  });

  it("preserves a query string the destination already carries", async () => {
    const result = await provider.buildDeepLink({
      destinationUrl: "https://example.com/search?city=paris&nights=3",
      clickId: CLICK_ID,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const url = new URL(result.data.url);
    expect(url.searchParams.get("city")).toBe("paris");
    expect(url.searchParams.get("nights")).toBe("3");
    expect(url.searchParams.get("sub_id")).toBe(CLICK_ID);
  });

  it("substitutes every placeholder in a deep-link template", async () => {
    const result = await provider.buildDeepLink({
      destinationUrl: "https://example.com/hotel?id=9",
      deepLinkTemplate:
        "https://tp.example/click?marker={marker}&sub_id={subId}&u={url}&c={campaign}",
      clickId: CLICK_ID,
      campaign: "paris-guide",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.url).toContain("marker=123456");
    expect(result.data.url).toContain(`sub_id=${CLICK_ID}`);
    expect(result.data.url).toContain(
      encodeURIComponent("https://example.com/hotel?id=9"),
    );
    expect(result.data.url).toContain("c=paris-guide");
    // No placeholder may survive into a live URL.
    expect(result.data.url).not.toMatch(/\{[a-zA-Z]+\}/);
  });

  it("merges provider-specific default parameters", async () => {
    const result = await provider.buildDeepLink({
      destinationUrl: "https://example.com/",
      clickId: CLICK_ID,
      params: { locale: "en-gb", currency: "gbp" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const url = new URL(result.data.url);
    expect(url.searchParams.get("locale")).toBe("en-gb");
    expect(url.searchParams.get("currency")).toBe("gbp");
  });

  it("rejects a destination that is not a usable absolute URL", async () => {
    const result = await provider.buildDeepLink({
      destinationUrl: "not-a-url",
      clickId: CLICK_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("declares capabilities honestly", () => {
    // conversionFeed stays false because the statistics API was not verified.
    // Claiming a capability we have not confirmed would be worse than lacking it.
    expect(provider.capabilities.deepLinks).toBe(true);
    expect(provider.capabilities.subIdTracking).toBe(true);
    expect(provider.capabilities.conversionFeed).toBe(false);
    expect(provider.capabilities.conversionWebhook).toBe(false);
    expect(provider.fetchConversions).toBeUndefined();
  });

  it("reports search as unavailable without an API token", () => {
    const noToken = createTravelpayoutsProvider({ marker: "123456" });
    expect(noToken.capabilities.search).toBe(false);
  });
});

describe("Travelpayouts search guards", () => {
  it("refuses verticals the data API does not cover", async () => {
    const withToken = createTravelpayoutsProvider({ ...config, apiToken: "test-token" });
    const result = await withToken.search?.({ vertical: "hotels", query: "PAR-ROM" });

    expect(result?.ok).toBe(false);
    if (!result || result.ok) return;
    expect(result.error.code).toBe("PROVIDER_ERROR");
  });

  it("requires a token before attempting a flight query", async () => {
    const result = await provider.search?.({ vertical: "flights", query: "PAR-ROM" });

    expect(result?.ok).toBe(false);
    if (!result || result.ok) return;
    expect(result.error.code).toBe("NOT_CONFIGURED");
  });

  it("rejects a route that is not two IATA codes", async () => {
    const withToken = createTravelpayoutsProvider({ ...config, apiToken: "test-token" });
    const result = await withToken.search?.({ vertical: "flights", query: "Paris" });

    expect(result?.ok).toBe(false);
    if (!result || result.ok) return;
    expect(result.error.code).toBe("VALIDATION_FAILED");
  });
});

describe("provider registry", () => {
  it("resolves a registered provider by slug", () => {
    registerAffiliateProvider(provider);
    expect(getAffiliateProvider("travelpayouts")?.slug).toBe("travelpayouts");
    expect(listAffiliateProviders().length).toBeGreaterThan(0);
  });

  it("refuses to register the same slug twice", () => {
    // Silent replacement would mean a link resolving through the wrong adapter.
    expect(() => registerAffiliateProvider(provider)).toThrow(/already registered/);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getAffiliateProvider("nope")).toBeUndefined();
  });
});
