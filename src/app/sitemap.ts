import type { MetadataRoute } from "next";

import { listOfferSitemapEntries } from "@/core/offers/offers";
import {
  MIN_OFFERS_FOR_COUNTRY_PAGE,
  SECTIONS,
  countryHubPath,
  offerPath,
  sectionCountryPath,
  sectionPath,
} from "@/core/sections/sections";
import { site } from "@/core/seo/site";
import { createSupabasePublicClient } from "@/lib/supabase/public";

/**
 * Sitemap generated from real, published database content.
 *
 * Two rules it follows:
 *  - Only URLs that actually exist and are indexable are listed. A country page
 *    appears only once it has enough offers to be worth indexing, matching the
 *    `noindex` the page itself emits below that threshold.
 *  - Nothing under /go/, /admin/ or /api/ appears, matching robots.txt.
 *
 * RLS means the anon client can only see published rows, so the "is it
 * publishable?" question is answered by the database rather than duplicated
 * here. When the corpus approaches the 50,000-URL limit this must be split
 * behind a sitemap index.
 */
export const revalidate = 3600;

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  ...SECTIONS.map((section) => ({
    path: sectionPath(section.slug),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  })),
  { path: "/about", changeFrequency: "yearly", priority: 0.3 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/affiliate-disclosure", changeFrequency: "yearly", priority: 0.3 },
];

function entry(
  path: string,
  lastModified: string | null,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
): MetadataRoute.Sitemap[number] {
  return {
    url: new URL(path, site.url).toString(),
    // Static pages have no real modification date, and a made-up one ("now")
    // teaches Google to ignore lastmod for the whole file. Omit it instead.
    lastModified: lastModified ? new Date(lastModified) : undefined,
    changeFrequency,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls = STATIC_ROUTES.map((route) =>
    entry(route.path, null, route.changeFrequency, route.priority),
  );

  const offers = await listOfferSitemapEntries(createSupabasePublicClient());
  if (!offers.ok) return urls;

  const perSectionCountry = new Map<string, number>();
  const perCountry = new Map<string, number>();

  for (const offer of offers.data) {
    urls.push(
      entry(
        offerPath(offer.section, offer.countrySlug, offer.slug),
        offer.updatedAt,
        "monthly",
        0.8,
      ),
    );
    const sectionKey = `${offer.section}/${offer.countrySlug}`;
    perSectionCountry.set(sectionKey, (perSectionCountry.get(sectionKey) ?? 0) + 1);
    perCountry.set(offer.countrySlug, (perCountry.get(offer.countrySlug) ?? 0) + 1);
  }

  for (const [key, count] of perSectionCountry) {
    if (count < MIN_OFFERS_FOR_COUNTRY_PAGE) continue;
    const [section, country] = key.split("/");
    if (!section || !country) continue;
    urls.push(
      entry(
        sectionCountryPath(section as (typeof SECTIONS)[number]["slug"], country),
        null,
        "weekly",
        0.7,
      ),
    );
  }

  for (const [country, count] of perCountry) {
    if (count < MIN_OFFERS_FOR_COUNTRY_PAGE) continue;
    urls.push(entry(countryHubPath(country), null, "weekly", 0.7));
  }

  return urls;
}
