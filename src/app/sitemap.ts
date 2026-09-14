import type { MetadataRoute } from "next";

import { site } from "@/core/seo/site";
import { createSupabasePublicClient } from "@/lib/supabase/public";

/**
 * Sitemap generated from real, published database content.
 *
 * Two rules it follows:
 *  - Only URLs that actually exist and are indexable are listed. A sitemap full
 *    of thin or non-existent pages wastes crawl budget and damages trust in the
 *    whole file.
 *  - Nothing under /go/, /admin/ or /api/ appears, matching robots.txt.
 *
 * RLS means the anon client can only see published rows, so the "is it
 * publishable?" question is answered by the database rather than duplicated
 * here. When the corpus approaches the 50,000-URL limit this must be split
 * behind a sitemap index — see docs/seo.md.
 */
export const revalidate = 3600;

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/destinations", changeFrequency: "daily", priority: 0.9 },
  { path: "/guides", changeFrequency: "daily", priority: 0.9 },
  { path: "/hotels", changeFrequency: "weekly", priority: 0.8 },
  { path: "/activities", changeFrequency: "weekly", priority: 0.8 },
  { path: "/tours", changeFrequency: "weekly", priority: 0.8 },
  { path: "/flights", changeFrequency: "weekly", priority: 0.7 },
  { path: "/deals", changeFrequency: "daily", priority: 0.7 },
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
    lastModified: lastModified ? new Date(lastModified) : new Date(),
    changeFrequency,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = createSupabasePublicClient();

  const [countries, destinations, guides, hotels, activities, deals, routes] =
    await Promise.all([
      db.from("countries").select("slug, updated_at").is("deleted_at", null),
      db
        .from("destinations")
        .select(
          "updated_at, country:countries!destinations_country_id_fkey(slug), city:cities!destinations_city_id_fkey(slug)",
        )
        .is("deleted_at", null),
      db.from("guides").select("slug, updated_at").is("deleted_at", null),
      db
        .from("hotels")
        .select("slug, updated_at, city:cities!hotels_city_id_fkey(slug)")
        .is("deleted_at", null),
      db
        .from("activities")
        .select("slug, kind, updated_at, city:cities!activities_city_id_fkey(slug)")
        .is("deleted_at", null),
      db.from("deals").select("slug, updated_at").is("deleted_at", null),
      db.from("flight_routes").select("slug, updated_at").is("deleted_at", null),
    ]);

  const urls: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) =>
    entry(route.path, null, route.changeFrequency, route.priority),
  );

  for (const row of countries.data ?? []) {
    urls.push(entry(`/destinations/${row.slug}`, row.updated_at, "weekly", 0.8));
  }

  for (const row of destinations.data ?? []) {
    const country = row.country as unknown as { slug: string } | null;
    const city = row.city as unknown as { slug: string } | null;
    if (!country) continue;
    const path = city
      ? `/destinations/${country.slug}/${city.slug}`
      : `/destinations/${country.slug}`;
    urls.push(entry(path, row.updated_at, "weekly", 0.9));
  }

  for (const row of guides.data ?? []) {
    urls.push(entry(`/guides/${row.slug}`, row.updated_at, "monthly", 0.8));
  }

  for (const row of hotels.data ?? []) {
    const city = row.city as unknown as { slug: string } | null;
    if (city)
      urls.push(
        entry(`/hotels/${city.slug}/${row.slug}`, row.updated_at, "monthly", 0.7),
      );
  }

  for (const row of activities.data ?? []) {
    const city = row.city as unknown as { slug: string } | null;
    if (!city) continue;
    const root = row.kind === "tour" ? "tours" : "activities";
    urls.push(entry(`/${root}/${city.slug}/${row.slug}`, row.updated_at, "monthly", 0.7));
  }

  for (const row of deals.data ?? []) {
    urls.push(entry(`/deals/${row.slug}`, row.updated_at, "daily", 0.6));
  }

  for (const row of routes.data ?? []) {
    urls.push(entry(`/flights/${row.slug}`, row.updated_at, "monthly", 0.6));
  }

  // Deduplicate: a country with both a countries row and a country-level
  // destination row would otherwise be listed twice.
  const seen = new Set<string>();
  return urls.filter((url) => {
    if (seen.has(url.url)) return false;
    seen.add(url.url);
    return true;
  });
}
