import { listRecentNewsForSitemap } from "@/core/news/news";
import { buildNewsSitemapXml } from "@/core/news/schema";
import { site } from "@/core/seo/site";
import { createSupabasePublicClient } from "@/lib/supabase/public";

/**
 * The Google News sitemap: only articles from the last 48 hours, as Google asks.
 * It is regenerated every few minutes so a fresh story is listed quickly.
 */
export const revalidate = 300;

export async function GET() {
  const result = await listRecentNewsForSitemap(createSupabasePublicClient());
  const items = result.ok
    ? result.data.map((entry) => ({
        path: `/news/${entry.slug}`,
        title: entry.title,
        publishedAt: entry.publishedAt,
      }))
    : [];

  const xml = buildNewsSitemapXml(items, {
    siteUrl: site.url,
    publicationName: site.name,
    language: "en",
  });

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
