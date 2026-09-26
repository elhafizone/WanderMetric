import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveDestination } from "@/core/affiliate/destination";
import {
  createTravelpayoutsProvider,
  toSubId,
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

const config: TravelpayoutsConfig = {
  marker: "123456",
  apiToken: "test-token",
  projectId: "512658",
  currency: "usd",
  locale: "en",
};
const provider = createTravelpayoutsProvider(config);

const CLICK_ID = "6f1d3a22-0000-4000-8000-abcdefabcdef";
const SUB_ID = "6f1d3a22000040008000abcdefabcdef";

/** A /links/v1/create response in the documented shape. */
function partnerLinksResponse(link: Record<string, string>, status = 200) {
  return new Response(
    JSON.stringify({
      result: { trs: 512658, marker: 123456, shorten: false, links: [link] },
      code: "success",
      status,
    }),
    { status, headers: { "content-type": "application/json" } },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Travelpayouts partner links", () => {
  it("sends the documented request and returns partner_url", async () => {
    const fetchMock = vi.fn(async () =>
      partnerLinksResponse({
        url: "https://www.airalo.com/france-esim",
        code: "success",
        partner_url: "https://airalo.tp.st/abc",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await provider.buildDeepLink({
      destinationUrl: "https://www.airalo.com/france-esim",
      clickId: CLICK_ID,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.url).toBe("https://airalo.tp.st/abc");
    expect(result.data.trackingAttached).toBe(true);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.travelpayouts.com/links/v1/create");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["x-access-token"]).toBe("test-token");
    expect(JSON.parse(String(init.body))).toEqual({
      trs: 512658,
      marker: 123456,
      shorten: false,
      links: [{ url: "https://www.airalo.com/france-esim", sub_id: SUB_ID }],
    });
  });

  it("forwards the click id as a SubID Travelpayouts accepts", () => {
    // SubIDs allow only Latin letters, digits and "_"; a UUID's hyphens are not.
    expect(toSubId(CLICK_ID)).toBe(SUB_ID);
    expect(toSubId(CLICK_ID)).toMatch(/^[A-Za-z0-9_]+$/);
  });

  it("fails when the brand is not connected, even though HTTP says 200", async () => {
    vi.stubGlobal("fetch", async () =>
      partnerLinksResponse({
        url: "https://www.airalo.com/france-esim",
        code: "failed",
        message: "trs is not subscribed for brand",
        partner_url: "",
      }),
    );

    const result = await provider.buildDeepLink({
      destinationUrl: "https://www.airalo.com/france-esim",
      clickId: CLICK_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PROVIDER_ERROR");
    expect(result.error.message).toContain("not subscribed");
  });

  it("reports the rate limit distinctly", async () => {
    vi.stubGlobal("fetch", async () => new Response("", { status: 429 }));

    const result = await provider.buildDeepLink({
      destinationUrl: "https://www.klook.com/",
      clickId: CLICK_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("RATE_LIMITED");
  });

  it("refuses to emit an unattributed brand URL without a token", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const noToken = createTravelpayoutsProvider({ marker: "123456" });

    const result = await noToken.buildDeepLink({
      destinationUrl: "https://www.klook.com/",
      clickId: CLICK_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_CONFIGURED");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("merges the link's default parameters into the brand URL", async () => {
    const fetchMock = vi.fn(async () =>
      partnerLinksResponse({ code: "success", partner_url: "https://x.tp.st/1" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await provider.buildDeepLink({
      destinationUrl: "https://example.com/search?city=paris",
      clickId: CLICK_ID,
      params: { currency: "gbp" },
    });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const sent = new URL(JSON.parse(String(init.body)).links[0].url);
    expect(sent.searchParams.get("city")).toBe("paris");
    expect(sent.searchParams.get("currency")).toBe("gbp");
  });

  it("substitutes every placeholder in a deep-link template without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

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
    expect(result.data.url).toContain(`sub_id=${SUB_ID}`);
    expect(result.data.url).toContain(encodeURIComponent("https://example.com/hotel?id=9"));
    expect(result.data.url).toContain("c=paris-guide");
    // No placeholder may survive into a live URL.
    expect(result.data.url).not.toMatch(/\{[a-zA-Z]+\}/);
    expect(fetchMock).not.toHaveBeenCalled();
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

describe("search placeholders in a destination", () => {
  it("passes a URL without placeholders through untouched", () => {
    const result = resolveDestination("https://www.klook.com/en-US/", {});
    expect(result).toEqual({ ok: true, data: "https://www.klook.com/en-US/" });
  });

  it("encodes free text into a query parameter", () => {
    const result = resolveDestination(
      "https://www.klook.com/en-US/search/result/?query={q}",
      { q: "  Rio de   Janeiro " },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(new URL(result.data).searchParams.get("query")).toBe("Rio de Janeiro");
  });

  it("slugifies text for path placeholders, accents included", () => {
    const result = resolveDestination("https://www.airalo.com/{q_slug}-esim", {
      q: "Côte d'Ivoire",
    });
    expect(result.ok && result.data).toBe("https://www.airalo.com/cote-d-ivoire-esim");
  });

  it("builds the Aviasales search path from IATA codes and a date", () => {
    const result = resolveDestination(
      "https://www.aviasales.com/search/{origin}{ddmm}{destination}1",
      { origin: "cai", destination: "PAR", date: "2026-10-12" },
    );
    expect(result.ok && result.data).toBe("https://www.aviasales.com/search/CAI1210PAR1");
  });

  it("rejects an impossible date", () => {
    const result = resolveDestination("https://a.example/{ddmm}", { date: "2026-02-30" });
    expect(result.ok).toBe(false);
  });

  it("rejects text that is not a place name", () => {
    for (const q of ["", "   ", "https://evil.example", "a/b", "x".repeat(81)]) {
      expect(resolveDestination("https://a.example/?q={q}", { q }).ok).toBe(false);
    }
  });

  it("can never move the link to another host", () => {
    // Characters that would escape a component are rejected or encoded; either
    // way the host stays the stored one.
    for (const q of ["@evil.example", "..", "#frag", "?x=1"]) {
      const result = resolveDestination("https://www.airalo.com/{q_slug}-esim", { q });
      if (result.ok) expect(new URL(result.data).host).toBe("www.airalo.com");
    }
  });

  it("rejects an unknown placeholder as a misconfigured row", () => {
    const result = resolveDestination("https://a.example/{nope}", { q: "x" });
    expect(result.ok).toBe(false);
  });
});

describe("Travelpayouts search guards", () => {
  it("refuses verticals the data API does not cover", async () => {
    const result = await provider.search?.({ vertical: "hotels", query: "PAR-ROM" });

    expect(result?.ok).toBe(false);
    if (!result || result.ok) return;
    expect(result.error.code).toBe("PROVIDER_ERROR");
  });

  it("requires a token before attempting a flight query", async () => {
    const noToken = createTravelpayoutsProvider({ marker: "123456" });
    const result = await noToken.search?.({ vertical: "flights", query: "PAR-ROM" });

    expect(result?.ok).toBe(false);
    if (!result || result.ok) return;
    expect(result.error.code).toBe("NOT_CONFIGURED");
  });

  it("rejects a route that is not two IATA codes", async () => {
    const result = await provider.search?.({ vertical: "flights", query: "Paris" });

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
