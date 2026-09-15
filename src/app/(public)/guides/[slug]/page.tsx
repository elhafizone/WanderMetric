import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleBody } from "@/components/article/article-body";
import { ArticleFacts } from "@/components/article/article-facts";
import { ArticleHero } from "@/components/article/article-hero";
import {
  KeepExploring,
  type ExploreLink,
  type RelatedStory,
} from "@/components/article/keep-exploring";
import { ArticleToc } from "@/components/article/article-toc";
import { ReadingProgress } from "@/components/article/reading-progress";
import { Container } from "@/components/layout/container";
import { SubscribeForm } from "@/components/newsletter/subscribe-form";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  getDestinationByPath,
  getGuideBySlug,
  listActivities,
  listGuides,
} from "@/core/content/queries";
import { placeKeysFromSlug } from "@/core/media/imagery";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { parseArticleBody } from "@/lib/article/body";
import { formatDate, formatReadingTime } from "@/lib/format";
import { activityPath, cityPath, guidePath } from "@/lib/paths";
import { publicMediaUrl } from "@/lib/media";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 86400;

/** Anchor for the reading-progress bar. Scoped to the article, not the page. */
const ARTICLE_ID = "guide-article";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const db = createSupabasePublicClient();
  const { data } = await db
    .from("guides")
    .select("slug")
    .is("deleted_at", null)
    .limit(200);

  return (data ?? []).map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const db = createSupabasePublicClient();
  const result = await getGuideBySlug(db, slug);

  if (!result.ok) {
    return buildMetadata({
      title: "Not found",
      description: "This guide could not be found.",
      path: guidePath(slug),
      noIndex: true,
    });
  }

  const guide = result.data;
  return buildMetadata({
    title: guide.title,
    description: guide.excerpt ?? `${guide.title} — a travel guide from WanderMetric.`,
    path: guidePath(guide.slug),
    type: "article",
    image: publicMediaUrl(guide.hero) ?? undefined,
    publishedTime: guide.published_at ?? undefined,
  });
}

/**
 * The guide article.
 *
 * ## Composition
 *
 * An article opens on paper, not over a photograph: eyebrow, headline, dek and
 * a metadata rule set in charcoal on ivory, with the picture beneath. That is
 * the magazine convention and it is also the measured one — the site's earlier
 * white-on-image headers came out at 1.13:1 and 1.76:1 contrast over the bright
 * photography this palette was rebuilt around.
 *
 * Below the hero the page becomes two columns: a quiet navigation rail and a
 * reading column capped at 68ch. The hero spans the full container while the
 * text does not, which is what gives the composition its editorial breakout
 * instead of one centred block of prose with equal air on both sides. On a
 * phone the rail collapses above the article — "On this page" as a single
 * folded line, then the facts — and the reading column takes the full width.
 *
 * ## What stays on the server
 *
 * Everything that is content. The article text, the headings, the hero, the
 * facts panel and the related rail are all Server Components, so every word is
 * in the HTML on first paint and none of it depends on hydration. Three small
 * client components carry behaviour only: the progress hairline, the table of
 * contents' active-section tracking, and the subscribe form. GSAP is reached
 * only through the shared motion components and stays out of the initial
 * payload.
 *
 * ## What the data can and cannot support
 *
 * `guides.body` is a single plain-text column. No stored guide contains a
 * heading, a quote or a second image, so the table of contents, the pull quote
 * treatment and the inline media all correctly render nothing today and light
 * up the moment an editor writes the structure. Nothing on this page invents a
 * section, an author, a date or a fact to fill the space where one would go.
 */
export default async function GuideDetailPage({ params }: Params) {
  const { slug } = await params;
  const db = createSupabasePublicClient();

  const result = await getGuideBySlug(db, slug);
  if (!result.ok) notFound();
  const guide = result.data;

  const article = parseArticleBody(guide.body);

  // The guide's own relations first, then any place its slug names.
  const imageKeys = [
    guide.city?.slug,
    guide.country?.slug,
    ...placeKeysFromSlug(guide.slug),
  ];

  // Onward reading. Same category where one exists, otherwise the most recent
  // guides; and, where the guide is tied to a city, the real entries we hold
  // for that place. Each strand is optional and simply does not render when the
  // database has nothing for it.
  const [related, attractions, destination] = await Promise.all([
    listGuides(db, { categorySlug: guide.category?.slug, perPage: 4 }),
    guide.city
      ? listActivities(db, { citySlug: guide.city.slug, perPage: 3 })
      : Promise.resolve(null),
    guide.city && guide.country
      ? getDestinationByPath(db, guide.country.slug, guide.city.slug)
      : Promise.resolve(null),
  ]);

  // The category is a preference, not a requirement. A guide that is the only
  // one in its category would otherwise end with nothing to read next, so the
  // rail falls back to the most recent guides — real published pieces either
  // way, never a padded grid.
  let siblings = (related.ok ? related.data.items : []).filter(
    (item) => item.id !== guide.id,
  );

  if (siblings.length === 0 && guide.category) {
    const recent = await listGuides(db, { perPage: 4 });
    siblings = (recent.ok ? recent.data.items : []).filter(
      (item) => item.id !== guide.id,
    );
  }

  const stories: RelatedStory[] = siblings.slice(0, 3).map((item) => ({
    id: item.id,
    href: guidePath(item.slug),
    title: item.title,
    summary: item.excerpt,
    media: item.hero,
    imageKeys: placeKeysFromSlug(item.slug),
    eyebrow: item.category?.name,
    meta: formatReadingTime(item.reading_minutes),
  }));

  const links: ExploreLink[] = [];

  // Linked only after confirming the destination page exists. A guide can name
  // a city we hold no destination record for, and a link to a 404 is worse than
  // no link.
  if (destination?.ok && guide.city && guide.country) {
    links.push({
      href: cityPath(guide.country.slug, guide.city.slug),
      label: destination.data.title,
      kind: "Destination",
    });
  }

  for (const activity of attractions?.ok ? attractions.data.items : []) {
    links.push({
      href: activityPath(activity),
      label: activity.name,
      kind: activity.kind === "tour" ? "Tour" : "Things to do",
    });
  }

  const published = formatDate(guide.published_at);
  const reading = formatReadingTime(guide.reading_minutes);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.excerpt ?? undefined,
          url: new URL(guidePath(guide.slug), site.url).toString(),
          datePublished: guide.published_at ?? undefined,
          ...(publicMediaUrl(guide.hero) ? { image: publicMediaUrl(guide.hero) } : {}),
          ...(guide.author?.full_name
            ? { author: { "@type": "Person", name: guide.author.full_name } }
            : {}),
          publisher: { "@id": `${site.url}#organization` },
        }}
      />

      <ReadingProgress targetId={ARTICLE_ID} />

      <article id={ARTICLE_ID}>
        <Container width="wide">
          <div className="flex flex-col gap-10 pt-24 sm:gap-14 sm:pt-32">
            <header className="flex flex-col gap-6">
              <div className="article-intro article-intro-1">
                <Breadcrumbs
                  items={[
                    { label: "Home", href: "/" },
                    { label: "Guides", href: "/guides" },
                    { label: guide.title },
                  ]}
                />
              </div>

              <div className="flex flex-col gap-5">
                {guide.category && (
                  <p className="article-intro article-intro-1 eyebrow text-accent">
                    {guide.category.name}
                  </p>
                )}
                {/* The page's one H1. The measure is capped on the heading
                    itself, not on a wrapper: `ch` resolves against the element's
                    own font size, so the same value on a 16px parent would
                    silently produce a column a quarter of the intended width. */}
                <h1 className="article-intro article-intro-2 display max-w-[16ch] text-[2.125rem] sm:text-[3.25rem] lg:text-[4rem]">
                  {guide.title}
                </h1>
              </div>

              {guide.excerpt && (
                <p className="article-intro article-intro-3 text-ink-soft max-w-[54ch] text-lg/[1.6] sm:text-xl/[1.62]">
                  {guide.excerpt}
                </p>
              )}

              {/* Byline, date and reading time — only what the row holds. No
                  guide currently has an author, so no "By" appears rather than
                  a house name standing in for a person. */}
              {(guide.author?.full_name || published || reading) && (
                <div className="article-intro article-intro-3 border-border text-ink-muted flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-5 text-[0.8125rem]">
                  {guide.author?.full_name && (
                    <>
                      <span>
                        By <span className="text-ink">{guide.author.full_name}</span>
                      </span>
                      <span aria-hidden="true" className="opacity-40">
                        ·
                      </span>
                    </>
                  )}
                  {published && guide.published_at && (
                    <time dateTime={guide.published_at}>{published}</time>
                  )}
                  {published && reading && (
                    <span aria-hidden="true" className="opacity-40">
                      ·
                    </span>
                  )}
                  {reading && <span>{reading}</span>}
                </div>
              )}
            </header>

            {/* Deliberately not wrapped in an `.intro` entrance. The hero is
                the LCP element: an opacity keyframe with a delay would make the
                browser paint the article's largest image and then hide it for
                most of a second, which is a measured regression dressed up as
                polish. The photograph arrives with the page, and the only
                motion on it is the scroll-linked drift inside ArticleHero. */}
            <ArticleHero media={guide.hero} label={guide.title} imageKeys={imageKeys} />
          </div>
        </Container>

        <Container width="wide">
          {/*
           * The reading block is narrower than the hero above it and centred
           * under it. That asymmetry is the composition: the photograph breaks
           * out to the full container while the words stay at a readable
           * measure, which is how a magazine uses a wide page. Left-aligning
           * the pair instead would leave several hundred pixels of dead margin
           * down the right at 1440 and above.
           */}
          <div className="mx-auto grid w-full max-w-[70rem] gap-x-12 gap-y-10 pt-14 pb-20 sm:pt-20 sm:pb-28 lg:grid-cols-[12.5rem_minmax(0,1fr)] xl:gap-x-16">
            {/*
             * The rail. First in the document because "what is in this piece"
             * belongs before the piece for a screen reader as much as for a
             * scanning eye, and because on a phone that stacking order is the
             * one that works — a folded table of contents costs a line, and a
             * facts panel at the top of a travel article is a magazine
             * convention rather than an afterthought.
             */}
            <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
              <ArticleToc headings={article.headings} />
              <ArticleFacts
                facts={[
                  {
                    label: "Destination",
                    value: guide.city?.name,
                    href:
                      destination?.ok && guide.country && guide.city
                        ? cityPath(guide.country.slug, guide.city.slug)
                        : undefined,
                  },
                  { label: "Region", value: guide.country?.name },
                  { label: "Reading", value: reading },
                  { label: "Published", value: published },
                ]}
              />
            </aside>

            <div className="min-w-0">
              <ArticleBody blocks={article.blocks} />
            </div>
          </div>
        </Container>
      </article>

      {/*
       * The ending. A reader who reaches the last line should not fall straight
       * into the footer, so the page changes paper stock and offers somewhere
       * to go: more of this place first, then the invitation.
       */}
      {(stories.length > 0 || links.length > 0) && (
        <div className="bg-surface border-border border-t">
          <Container width="wide">
            <div className="py-16 sm:py-20">
              <KeepExploring
                place={guide.city?.name ?? guide.country?.name ?? null}
                stories={stories}
                links={links}
              />
            </div>
          </Container>
        </div>
      )}

      <div className="bg-bg border-border border-t">
        <Container width="default">
          <div className="flex flex-col items-center gap-6 py-16 text-center sm:py-20">
            <p className="eyebrow text-ink-muted">New guides, once in a while</p>
            <h2 className="display max-w-[18ch] text-[2rem] sm:text-[2.75rem]">
              Where will you go next?
            </h2>
            <p className="text-ink-muted max-w-[46ch] text-base/[1.7]">
              A short email when something worth reading is published. Nothing else — and
              you can leave at any time.
            </p>
            <div className="mt-2 w-full max-w-md">
              <SubscribeForm source="guide" />
            </div>
            <div className="mt-2">
              <ButtonLink href="/destinations" variant="secondary">
                Explore destinations
              </ButtonLink>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
