import type { MetadataRoute } from "next";

import { routes, site } from "@/core/seo/site";

/**
 * Sitemap entry point.
 *
 * Phase 1 lists only the routes that actually exist. Phase 5 replaces the static
 * array with database-driven generation and splits into a sitemap index at the
 * 50,000-URL limit. Never list a URL that is not live — it wastes crawl budget.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL(routes.home(), site.url).toString(),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
