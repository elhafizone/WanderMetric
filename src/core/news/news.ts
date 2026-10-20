import type { PostgrestError } from "@supabase/supabase-js";

import { MEDIA_FIELDS } from "@/core/content/selects";
import type { AuthorRef, MediaRef } from "@/core/content/types";
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
 * The news desk.
 *
 * News is not a new table. An article is a `guides` row whose category is
 * `travel-news`, so it inherits the existing publish gate (500+ characters of
 * body), RLS and editor workflow. A guide in any other category is never shown
 * here, and a news article is never shown as a guide.
 *
 * Nothing in this module invents a byline: `author` is whatever the database
 * returns for the article's `author_id`, or null.
 */

export const NEWS_CATEGORY_SLUG = "travel-news";

/** Google News considers articles from the last two days for its news sitemap. */
export const NEWS_SITEMAP_WINDOW_HOURS = 48;

export interface NewsCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  reading_minutes: number | null;
  published_at: string;
  updated_at: string;
  hero: MediaRef | null;
}

export interface NewsArticle extends NewsCard {
  body: string;
  country: { id: string; name: string; slug: string } | null;
  city: { id: string; name: string; slug: string } | null;
  author: AuthorRef | null;
}

const CARD = `id, title, slug, excerpt, reading_minutes, published_at, updated_at,
   category:categories!guides_category_id_fkey!inner(slug),
   hero:media!guides_hero_media_id_fkey(${MEDIA_FIELDS})`;

const DETAIL = `id, title, slug, excerpt, body, reading_minutes, published_at, updated_at,
   category:categories!guides_category_id_fkey!inner(slug),
   country:countries!guides_country_id_fkey(id, name, slug),
   city:cities!guides_city_id_fkey(id, name, slug),
   author_id,
   hero:media!guides_hero_media_id_fkey(${MEDIA_FIELDS})`;

function fail(error: PostgrestError, context: string) {
  return err(fromPostgrestError(error, context));
}

/** Only dated articles can be news; an undated row is skipped, not given today's date. */
function dated<T extends { published_at: string | null }>(
  rows: T[],
): Array<T & { published_at: string }> {
  return rows.filter((row): row is T & { published_at: string } => Boolean(row.published_at));
}

export async function listNews(
  db: Db,
  options: { page?: number; perPage?: number } = {},
): Promise<Result<Paginated<NewsCard>>> {
  const request = normalizePageRequest(options.page, options.perPage);
  const [from, to] = toRange(request);

  const { data, error, count } = await db
    .from("guides")
    .select(CARD, { count: "exact" })
    .eq("categories.slug", NEWS_CATEGORY_SLUG)
    .is("deleted_at", null)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .range(from, to);

  if (error) return fail(error, "listNews");
  const items = dated((data ?? []) as unknown as NewsCard[]);
  return ok(paginate(items, request, count ?? items.length));
}

/** Minimal shape of the untyped client, for the one view the generated types do not know. */
interface UntypedDb {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
  };
}

/**
 * The author's public details. Profiles are readable only by their owner and
 * staff, so the public site reads the `public_authors` view (migration 0018),
 * which exposes name, avatar and bio of people who authored published content
 * and nothing else. Until that migration is applied this returns null, and the
 * article is credited to the publisher instead of to a person.
 */
async function getPublicAuthor(db: Db, authorId: string | null): Promise<AuthorRef | null> {
  if (!authorId) return null;
  const { data, error } = await (db as unknown as UntypedDb)
    .from("public_authors")
    .select("id, full_name, avatar_url, bio")
    .eq("id", authorId)
    .maybeSingle();
  if (error || !data) return null;
  return data as AuthorRef;
}

export async function getNewsArticle(db: Db, slug: string): Promise<Result<NewsArticle>> {
  const { data, error } = await db
    .from("guides")
    .select(DETAIL)
    .eq("slug", slug)
    .eq("categories.slug", NEWS_CATEGORY_SLUG)
    .is("deleted_at", null)
    .not("published_at", "is", null)
    .maybeSingle();

  if (error) return fail(error, "getNewsArticle");
  const row = data as unknown as (Omit<NewsArticle, "author"> & { author_id: string | null }) | null;
  if (!row || !row.published_at || !row.body) {
    return err(appError("NOT_FOUND", "News article not found", { publicMessage: "Not found." }));
  }

  const { author_id: authorId, ...rest } = row;
  return ok({ ...rest, author: await getPublicAuthor(db, authorId) });
}

export interface NewsSitemapEntry {
  slug: string;
  title: string;
  publishedAt: string;
}

/** Articles published inside the window, newest first, for the news sitemap. */
export async function listRecentNewsForSitemap(
  db: Db,
  now: Date = new Date(),
): Promise<Result<NewsSitemapEntry[]>> {
  const since = new Date(now.getTime() - NEWS_SITEMAP_WINDOW_HOURS * 3_600_000).toISOString();
  const { data, error } = await db
    .from("guides")
    .select("title, slug, published_at, category:categories!guides_category_id_fkey!inner(slug)")
    .eq("categories.slug", NEWS_CATEGORY_SLUG)
    .is("deleted_at", null)
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(1000);

  if (error) return fail(error, "listRecentNewsForSitemap");
  const rows = dated((data ?? []) as unknown as Array<{ title: string; slug: string; published_at: string | null }>);
  return ok(rows.map((row) => ({ slug: row.slug, title: row.title, publishedAt: row.published_at })));
}

/** Every published news article, for the main sitemap. */
export async function listNewsForSitemap(
  db: Db,
): Promise<Result<Array<{ slug: string; updatedAt: string }>>> {
  const { data, error } = await db
    .from("guides")
    .select("slug, updated_at, category:categories!guides_category_id_fkey!inner(slug)")
    .eq("categories.slug", NEWS_CATEGORY_SLUG)
    .is("deleted_at", null)
    .not("published_at", "is", null)
    .limit(5000);

  if (error) return fail(error, "listNewsForSitemap");
  const rows = (data ?? []) as unknown as Array<{ slug: string; updated_at: string }>;
  return ok(rows.map((row) => ({ slug: row.slug, updatedAt: row.updated_at })));
}
