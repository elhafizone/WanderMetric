/**
 * Structured data and the news sitemap, as pure functions.
 *
 * Both are what Google reads to understand a news article: who published it,
 * who wrote it, and when. Everything comes from the article row; when the
 * author is unknown the publisher is credited and no person is invented.
 */

/** Google truncates headlines in structured data past roughly 110 characters. */
export const MAX_HEADLINE = 110;

export function truncateHeadline(title: string): string {
  const text = title.trim();
  if (text.length <= MAX_HEADLINE) return text;
  return `${text.slice(0, MAX_HEADLINE - 1).trimEnd()}…`;
}

export interface NewsSchemaInput {
  siteUrl: string;
  siteName: string;
  path: string;
  title: string;
  description: string | null;
  publishedAt: string;
  updatedAt: string;
  imageUrl?: string | null;
  logoUrl?: string | null;
  author: { name: string; url?: string | null } | null;
}

export function newsArticleSchema(input: NewsSchemaInput): Record<string, unknown> {
  const url = new URL(input.path, input.siteUrl).toString();
  const publisher = {
    "@type": "Organization",
    name: input.siteName,
    url: input.siteUrl,
    ...(input.logoUrl ? { logo: { "@type": "ImageObject", url: input.logoUrl } } : {}),
  };

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: truncateHeadline(input.title),
    ...(input.description ? { description: input.description } : {}),
    datePublished: new Date(input.publishedAt).toISOString(),
    dateModified: new Date(input.updatedAt).toISOString(),
    ...(input.imageUrl ? { image: [input.imageUrl] } : {}),
    author: input.author
      ? { "@type": "Person", name: input.author.name, ...(input.author.url ? { url: input.author.url } : {}) }
      : { "@type": "Organization", name: input.siteName, url: input.siteUrl },
    publisher,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface NewsSitemapItem {
  path: string;
  title: string;
  publishedAt: string;
}

/**
 * The Google News sitemap: one `<url>` per article published in the last two
 * days, with the publication name, language and publication date. An empty list
 * yields a valid, empty urlset rather than an error.
 */
export function buildNewsSitemapXml(
  items: NewsSitemapItem[],
  options: { siteUrl: string; publicationName: string; language: string },
): string {
  const entries = items
    .map((item) => {
      const loc = new URL(item.path, options.siteUrl).toString();
      return [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
        "    <news:news>",
        "      <news:publication>",
        `        <news:name>${escapeXml(options.publicationName)}</news:name>`,
        `        <news:language>${escapeXml(options.language)}</news:language>`,
        "      </news:publication>",
        `      <news:publication_date>${new Date(item.publishedAt).toISOString()}</news:publication_date>`,
        `      <news:title>${escapeXml(item.title)}</news:title>`,
        "    </news:news>",
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries}
</urlset>
`;
}
