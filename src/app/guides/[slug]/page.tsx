import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, Stack } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CardGrid, ContentCard } from "@/components/ui/card";
import { MediaImage } from "@/components/ui/media-image";
import { Prose } from "@/components/ui/prose";
import { SectionHeader } from "@/components/ui/section";
import { getGuideBySlug, listGuides } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
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

  return (
    <Container>
      <Stack>
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

        <article className="flex flex-col gap-8">
          <div className="flex flex-col gap-5">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Guides", href: "/guides" },
                { label: guide.title },
              ]}
            />

            <header className="flex flex-col gap-4">
              {guide.category && (
                <p className="text-accent font-mono text-xs tracking-[0.16em] uppercase">
                  {guide.category.name}
                </p>
              )}
              <h1 className="max-w-[24ch] text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
                {guide.title}
              </h1>
              {guide.excerpt && (
                <p className="text-ink-muted max-w-[65ch] text-lg/relaxed">
                  {guide.excerpt}
                </p>
              )}
              <div className="text-ink-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {guide.author?.full_name && <span>By {guide.author.full_name}</span>}
                {guide.published_at && (
                  <time dateTime={guide.published_at}>
                    {new Date(guide.published_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                )}
                {guide.reading_minutes && <span>{guide.reading_minutes} min read</span>}
              </div>
            </header>

            <div className="bg-surface-2 relative aspect-[21/9] w-full max-w-full overflow-hidden rounded-2xl">
              <MediaImage
                media={guide.hero}
                label={guide.title}
                priority
                sizes="(max-width: 1024px) 100vw, 1152px"
                className="h-full w-full"
              />
            </div>
          </div>

          {/* Reading column capped near 65 characters regardless of viewport. */}
          <div className="max-w-[68ch]">
            <Prose text={guide.body} />
          </div>

          {guide.author?.bio && (
            <footer className="border-border bg-surface max-w-[68ch] rounded-xl border p-6">
              <h2 className="mb-1 text-sm font-medium">
                About {guide.author.full_name ?? "the author"}
              </h2>
              <p className="text-ink-muted text-sm/relaxed">{guide.author.bio}</p>
            </footer>
          )}
        </article>

        {relatedItems.length > 0 && (
          <section className="flex flex-col gap-6">
            <SectionHeader title="Related guides" href="/guides" />
            <CardGrid>
              {relatedItems.slice(0, 3).map((item) => (
                <ContentCard
                  key={item.id}
                  href={guidePath(item.slug)}
                  title={item.title}
                  summary={item.excerpt}
                  media={item.hero}
                  eyebrow={item.category?.name}
                  meta={item.reading_minutes ? `${item.reading_minutes} min read` : null}
                />
              ))}
            </CardGrid>
          </section>
        )}
      </Stack>
    </Container>
  );
}
