import { describe, expect, it } from "vitest";

import {
  classifyDevice,
  extractUtm,
  isBotUserAgent,
  normalizeCountryCode,
  referrerHost,
} from "@/core/tracking/classify";

/**
 * Request classification.
 *
 * These matter more than they look: a bot counted as a click corrupts every
 * conversion rate on the dashboard, and a referrer stored in full would retain
 * search terms and session identifiers we have no business keeping.
 */

describe("isBotUserAgent", () => {
  it("detects common crawlers", () => {
    const crawlers = [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0)",
      "facebookexternalhit/1.1",
      "Pinterest/0.2 (+https://www.pinterest.com/bot.html)",
      "curl/8.4.0",
      "python-requests/2.31.0",
      "node-fetch/1.0",
    ];
    for (const ua of crawlers) {
      expect(isBotUserAgent(ua), ua).toBe(true);
    }
  });

  it("treats a missing user agent as automation", () => {
    // Real browsers always send one. Defaulting to "human" here would let the
    // simplest possible script inflate click counts.
    expect(isBotUserAgent(null)).toBe(true);
    expect(isBotUserAgent(undefined)).toBe(true);
    expect(isBotUserAgent("")).toBe(true);
  });

  it("does not flag ordinary browsers", () => {
    const browsers = [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    ];
    for (const ua of browsers) {
      expect(isBotUserAgent(ua), ua).toBe(false);
    }
  });
});

describe("classifyDevice", () => {
  it("separates phone, tablet and desktop", () => {
    expect(
      classifyDevice(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      ),
    ).toBe("mobile");
    expect(
      classifyDevice(
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      ),
    ).toBe("tablet");
    expect(
      classifyDevice(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36",
      ),
    ).toBe("desktop");
  });

  it("classifies Android tablets apart from Android phones", () => {
    // Android tablets omit "Mobile"; phones include it. Getting this backwards
    // would misattribute a large share of traffic.
    expect(
      classifyDevice("Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36"),
    ).toBe("mobile");
    expect(classifyDevice("Mozilla/5.0 (Linux; Android 14; SM-X200) Safari/537.36")).toBe(
      "tablet",
    );
  });

  it("reports bots as bots rather than guessing a device", () => {
    expect(classifyDevice("Googlebot/2.1")).toBe("bot");
  });

  it("returns unknown with no user agent", () => {
    expect(classifyDevice(null)).toBe("unknown");
  });
});

describe("referrerHost", () => {
  it("keeps only the hostname", () => {
    // The full referrer can carry search terms and session ids. Only the host
    // is ever stored.
    expect(referrerHost("https://www.google.com/search?q=secret+personal+query")).toBe(
      "google.com",
    );
    expect(referrerHost("https://news.ycombinator.com/item?id=123")).toBe(
      "news.ycombinator.com",
    );
  });

  it("strips a www prefix so hosts aggregate consistently", () => {
    expect(referrerHost("https://www.example.com/")).toBe("example.com");
  });

  it("returns null for missing or malformed values", () => {
    expect(referrerHost(null)).toBeNull();
    expect(referrerHost("")).toBeNull();
    expect(referrerHost("not a url")).toBeNull();
  });
});

describe("extractUtm", () => {
  it("reads campaign parameters", () => {
    const params = new URLSearchParams(
      "utm_source=newsletter&utm_medium=email&utm_campaign=spring",
    );
    expect(extractUtm(params)).toEqual({
      utm_source: "newsletter",
      utm_medium: "email",
      utm_campaign: "spring",
    });
  });

  it("caps length so a crafted URL cannot bloat a row", () => {
    const params = new URLSearchParams(`utm_source=${"x".repeat(500)}`);
    expect(extractUtm(params).utm_source).toHaveLength(120);
  });

  it("returns nulls when absent", () => {
    expect(extractUtm(new URLSearchParams())).toEqual({
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
    });
  });
});

describe("normalizeCountryCode", () => {
  it("uppercases a valid alpha-2 code", () => {
    expect(normalizeCountryCode("gb")).toBe("GB");
    expect(normalizeCountryCode(" fr ")).toBe("FR");
  });

  it("rejects placeholders and malformed values", () => {
    // Some CDNs send XX when they cannot determine a country; storing it would
    // create a fake country in every report.
    expect(normalizeCountryCode("XX")).toBeNull();
    expect(normalizeCountryCode("GBR")).toBeNull();
    expect(normalizeCountryCode("1")).toBeNull();
    expect(normalizeCountryCode(null)).toBeNull();
  });
});
