import { describe, expect, it } from "vitest";

import { isPrebuiltAffiliateUrl } from "@/core/affiliate/prebuilt";

describe("isPrebuiltAffiliateUrl", () => {
  it("accepts https tpx.li short links", () => {
    expect(isPrebuiltAffiliateUrl("https://klook.tpx.li/uA7kdpxy")).toBe(true);
    expect(isPrebuiltAffiliateUrl("https://tpx.li/abc")).toBe(true);
  });

  it("rejects lookalike hosts, other schemes and junk", () => {
    expect(isPrebuiltAffiliateUrl("https://klook.tpx.li.evil.com/x")).toBe(false);
    expect(isPrebuiltAffiliateUrl("https://evil.com/?u=klook.tpx.li")).toBe(false);
    expect(isPrebuiltAffiliateUrl("https://eviltpx.li/x")).toBe(false);
    expect(isPrebuiltAffiliateUrl("http://klook.tpx.li/x")).toBe(false);
    expect(isPrebuiltAffiliateUrl("javascript:alert(1)")).toBe(false);
    expect(isPrebuiltAffiliateUrl("not a url")).toBe(false);
  });
});
