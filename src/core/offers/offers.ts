import type { PostgrestError } from "@supabase/supabase-js";

import type { SectionSlug } from "@/core/sections/sections";
import type { Db } from "@/core/shared/db";
import { fromPostgrestError } from "@/core/shared/errors";
import {
  normalizePageRequest,
  paginate,
  toRange,
  type Paginated,
} from "@/core/shared/pagination";
import { appError, err, ok, type Result } from "@/core/shared/result";

/**
 * Read side of the offers domain. Framework-free: every function takes the
 * Supabase client, so the same query runs under an anonymous visitor's RLS or a
 * signed-in editor's depending only on what the caller passes.
 */

export interface OfferCountry {
  id: string;
  name: string;
  slug: string;
}

export interface OfferCard {
  id: string;
  name: string;
  slug: string;
  section: SectionSlug;
  summary: string | null;
  duration_minutes: number | null;
  is_featured: boolean;
  country: OfferCountry;
  city: OfferCountry | null;
  program: { slug: string; name: string };
}

export interface OfferDetail extends OfferCard {
  body: string | null;
  facts: Record<string, unknown>;
  facts_read_on: string | null;
  source_url: string | null;
  price_note: string | null;
  published_at: string | null;
  /** The `affiliate_links.slug` behind /go/{slug}. */
  link: { slug: string } | null;
}

const CARD = `id, name, slug, section, summary, duration_minutes, is_featured,
   country:countries!offers_country_id_fkey!inner(id, name, slug),
   city:cities!offers_city_id_fkey(id, name, slug),
   program:affiliate_programs!offers_program_id_fkey!inner(slug, name)`;

const DETAIL = `${CARD}, body, facts, facts_read_on, source_url, price_note, published_at,
   link:affiliate_links!offers_affiliate_link_id_fkey(slug)`;

function rows<T>(data: unknown): T[] {
  return (data ?? []) as T[];
}

function fail(error: PostgrestError, context: string) {
  return err(fromPostgrestError(error, context));
}

export interface ListOffersOptions {
  section?: SectionSlug;
  countrySlug?: string;
  featuredOnly?: boolean;
  page?: number;
  perPage?: number;
}

export async function listOffers(
  db: Db,
  options: ListOffersOptions = {},
): Promise<Result<Paginated<OfferCard>>> {
  const request = normalizePageRequest(options.page, options.perPage);
  const [from, to] = toRange(request);

  let query = db
    .from("offers")
    .select(CARD, { count: "exact" })
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true });

  if (options.section) query = query.eq("section", options.section);
  if (options.countrySlug) query = query.eq("countries.slug", options.countrySlug);
  if (options.featuredOnly) query = query.eq("is_featured", true);

  const { data, error, count } = await query.range(from, to);
  if (error) return fail(error, "listOffers");
  return ok(paginate(rows<OfferCard>(data), request, count ?? 0));
}

export async function getOffer(
  db: Db,
  section: SectionSlug,
  countrySlug: string,
  slug: string,
): Promise<Result<OfferDetail>> {
  const { data, error } = await db
    .from("offers")
    .select(DETAIL)
    .eq("section", section)
    .eq("slug", slug)
    .eq("countries.slug", countrySlug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return fail(error, "getOffer");
  if (!data) {
    return err(appError("NOT_FOUND", "Offer not found", { publicMessage: "Not found." }));
  }
  return ok(data as unknown as OfferDetail);
}

export interface CountryWithOffers extends OfferCountry {
  offerCount: number;
}

/**
 * Countries that have at least one published offer, with the number of offers.
 * The corpus is small, so this reads the two columns it needs and counts in
 * memory instead of adding an aggregate function.
 */
export async function listCountriesWithOffers(
  db: Db,
  section?: SectionSlug,
): Promise<Result<CountryWithOffers[]>> {
  let query = db
    .from("offers")
    .select("country:countries!offers_country_id_fkey!inner(id, name, slug)")
    .is("deleted_at", null);
  if (section) query = query.eq("section", section);

  const { data, error } = await query.limit(5000);
  if (error) return fail(error, "listCountriesWithOffers");

  const byId = new Map<string, CountryWithOffers>();
  for (const entry of rows<{ country: OfferCountry }>(data)) {
    const existing = byId.get(entry.country.id);
    if (existing) existing.offerCount += 1;
    else byId.set(entry.country.id, { ...entry.country, offerCount: 1 });
  }
  return ok([...byId.values()].sort((a, b) => a.name.localeCompare(b.name)));
}

/** Published offers per section, for the home grid and the section menu. */
export async function countOffersBySection(db: Db): Promise<Result<Record<string, number>>> {
  const { data, error } = await db
    .from("offers")
    .select("section")
    .is("deleted_at", null)
    .limit(5000);
  if (error) return fail(error, "countOffersBySection");

  const counts: Record<string, number> = {};
  for (const entry of rows<{ section: string }>(data)) {
    counts[entry.section] = (counts[entry.section] ?? 0) + 1;
  }
  return ok(counts);
}

/** Everything the sitemap needs: the paths and the last change of every offer. */
export async function listOfferSitemapEntries(
  db: Db,
): Promise<
  Result<
    { section: SectionSlug; countrySlug: string; slug: string; updatedAt: string | null }[]
  >
> {
  const { data, error } = await db
    .from("offers")
    .select("section, slug, updated_at, country:countries!offers_country_id_fkey!inner(slug)")
    .is("deleted_at", null)
    .limit(5000);
  if (error) return fail(error, "listOfferSitemapEntries");

  return ok(
    rows<{
      section: SectionSlug;
      slug: string;
      updated_at: string | null;
      country: { slug: string };
    }>(data).map((entry) => ({
      section: entry.section,
      countrySlug: entry.country.slug,
      slug: entry.slug,
      updatedAt: entry.updated_at,
    })),
  );
}

/**
 * Search by name or summary. The query is stripped of the characters PostgREST
 * treats as filter syntax before it is placed in the filter, so a visitor cannot
 * alter the query shape.
 */
export async function searchOffers(
  db: Db,
  rawQuery: string,
  options: { page?: number; perPage?: number } = {},
): Promise<Result<Paginated<OfferCard>>> {
  const term = rawQuery.replace(/[%,()*\\]/g, " ").trim().slice(0, 80);
  const request = normalizePageRequest(options.page, options.perPage);
  if (term.length < 2) return ok(paginate([], request, 0));

  const [from, to] = toRange(request);
  const { data, error, count } = await db
    .from("offers")
    .select(CARD, { count: "exact" })
    .is("deleted_at", null)
    .or(`name.ilike.%${term}%,summary.ilike.%${term}%`)
    .order("name", { ascending: true })
    .range(from, to);

  if (error) return fail(error, "searchOffers");
  return ok(paginate(rows<OfferCard>(data), request, count ?? 0));
}
