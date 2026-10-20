import { describe, expect, it } from "vitest";

import {
  MAX_HEADLINE,
  buildNewsSitemapXml,
  newsArticleSchema,
  truncateHeadline,
} from "@/core/news/schema";

const base = {
  siteUrl: "https://example.com",
  siteName: "Example",
  path: "/news/a-story",
  title: "A story",
  description: "Short description",
  publishedAt: "2026-10-09T08:00:00Z",
  updatedAt: "2026-10-09T09:30:00Z",
};

describe("truncateHeadline", () => {
  it("keeps a short title and cuts a long one to the limit", () => {
    expect(truncateHeadline("  Short  ")).toBe("Short");
    const long = truncateHeadline("x".repeat(300));
    expect(long.length).toBe(MAX_HEADLINE);
    expect(long.endsWith("…")).toBe(true);
  });
});

describe("newsArticleSchema", () => {
  it("is a NewsArticle with ISO dates and the canonical URL", () => {
    const data = newsArticleSchema({ ...base, author: { name: "Sam Writer" } });
    expect(data["@type"]).toBe("NewsArticle");
    expect(data.datePublished).toBe("2026-10-09T08:00:00.000Z");
    expect(data.dateModified).toBe("2026-10-09T09:30:00.000Z");
    expect(data.mainEntityOfPage).toEqual({
      "@type": "WebPage",
      "@id": "https://example.com/news/a-story",
    });
    expect(data.author).toEqual({ "@type": "Person", name: "Sam Writer" });
  });

  it("credits the publisher, and invents no person, when the author is unknown", () => {
    const data = newsArticleSchema({ ...base, author: null });
    expect(data.author).toEqual({
      "@type": "Organization",
      name: "Example",
      url: "https://example.com",
    });
  });

  it("omits image and description when there are none", () => {
    const data = newsArticleSchema({ ...base, description: null, author: null });
    expect("image" in data).toBe(false);
    expect("description" in data).toBe(false);
  });
});

describe("buildNewsSitemapXml", () => {
  const options = { siteUrl: "https://example.com", publicationName: "Example", language: "en" };

  it("lists each article with publication name, language, date and title", () => {
    const xml = buildNewsSitemapXml(
      [{ path: "/news/a", title: "Fares & rules <new>", publishedAt: "2026-10-09T08:00:00Z" }],
      options,
    );
    expect(xml).toContain("<loc>https://example.com/news/a</loc>");
    expect(xml).toContain("<news:name>Example</news:name>");
    expect(xml).toContain("<news:language>en</news:language>");
    expect(xml).toContain("<news:publication_date>2026-10-09T08:00:00.000Z</news:publication_date>");
    expect(xml).toContain("<news:title>Fares &amp; rules &lt;new&gt;</news:title>");
  });

  it("is a valid empty urlset when there are no articles", () => {
    const xml = buildNewsSitemapXml([], options);
    expect(xml).toContain("<urlset");
    expect(xml).not.toContain("<url>");
  });
});
