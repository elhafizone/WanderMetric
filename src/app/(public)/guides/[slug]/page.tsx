import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, Stack } from "@/components/layout/container";
import { MediaReveal } from "@/components/motion/media-reveal";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ContentCard } from "@/components/ui/card";
import { MediaImage } from "@/components/ui/media-image";
import { Prose } from "@/components/ui/prose";
import { SectionHeader } from "@/components/ui/section";
import { getGuideBySlug, listGuides } from "@/core/content/queries";
import { placeKeysFromSlug } from "@/core/media/imagery";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { formatDate, formatReadingTime } from "@/lib/format";
import { guidePath } from "@/lib/paths";
import { publicMediaUrl } from "@/lib/media";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 86400;

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

export default async function GuideDetailPage({ params }: Params) {
  const { slug } = await params;
  const db = createSupabasePublicClient();

  const result = await getGuideBySlug(db, slug);
  if (!result.ok) notFound();
  const guide = result.data;

  // Related reading keeps a visitor on site after they finish. Fetched by the
  // same category where one exists, otherwise the most recent guides.
  const related = await listGuides(db, {
    categorySlug: guide.category?.slug,
    perPage: 4,
  });
  const relatedItems = (related.ok ? related.data.items : []).filter(
    (item) => item.id !== guide.id,
  );

  // The guide's own relations first, then any place its slug names.
  const imageKeys = [
    guide.city?.slug,
    guide.country?.slug,
    ...placeKeysFromSlug(guide.slug),
  ];

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

      {/* An article opens on paper, not over a photograph. A headline set on
          ivory with the image beneath it is the magazine convention, and it
          keeps the title legible at any crop — which a hero overlay does not. */}
      <Container width="wide">
        <article className="flex flex-col gap-12 pt-28 pb-20 sm:pt-36 sm:pb-28">
          <header className="flex flex-col gap-6">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Guides", href: "/guides" },
                { label: guide.title },
              ]}
            />

            <div className="flex max-w-4xl flex-col gap-5">
              {guide.category && (
                <p className="eyebrow text-accent">{guide.category.name}</p>
              )}
              <h1 className="display text-[2.25rem] sm:text-[3.5rem] lg:text-[4rem]">
                {guide.title}
              </h1>
              {guide.excerpt && (
                <p className="text-ink-soft max-w-[58ch] text-xl/[1.6]">
                  {guide.excerpt}
                </p>
              )}
            </div>

            <div className="border-border text-ink-muted flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-5 text-sm">
              {guide.author?.full_name && (
                <span>
                  By <span className="text-ink">{guide.author.full_name}</span>
                </span>
              )}
              {guide.published_at && (
                <time dateTime={guide.published_at}>
                  {formatDate(guide.published_at)}
                </time>
              )}
              {guide.reading_minutes && (
                <span>{formatReadingTime(guide.reading_minutes)}</span>
              )}
            </div>
          </header>

          <MediaReveal className="bg-surface-2 relative aspect-[21/9] w-full overflow-hidden rounded-xl">
            <MediaImage
              media={guide.hero}
              label={guide.title}
              imageKeys={imageKeys}
              priority
              sizes="(max-width: 1024px) 100vw, 1344px"
            />
          </MediaReveal>

          <Prose text={guide.body} />

          {guide.author?.bio && (
            <footer className="border-border bg-surface max-w-[68ch] rounded-xl border p-7">
              <h2 className="eyebrow text-ink-muted mb-2">
                About {guide.author.full_name ?? "the author"}
              </h2>
              <p className="text-ink-soft text-[0.9375rem]/[1.7]">{guide.author.bio}</p>
            </footer>
          )}
        </article>
      </Container>

      {relatedItems.length > 0 && (
        <div className="bg-bg-tint border-border border-t">
          <Container width="wide">
            <Stack className="py-16 sm:py-20">
              <section className="flex flex-col gap-10">
                <SectionHeader
                  eyebrow="Read next"
                  title="Related guides"
                  href="/guides"
                  linkLabel="All guides"
                />
                <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedItems.slice(0, 3).map((item) => (
                    <ContentCard
                      key={item.id}
                      href={guidePath(item.slug)}
                      title={item.title}
                      summary={item.excerpt}
                      media={item.hero}
                      imageKeys={placeKeysFromSlug(item.slug)}
                      eyebrow={item.category?.name}
                      meta={formatReadingTime(item.reading_minutes)}
                    />
                  ))}
                </Reveal>
              </section>
            </Stack>
          </Container>
        </div>
      )}
    </>
  );
}
