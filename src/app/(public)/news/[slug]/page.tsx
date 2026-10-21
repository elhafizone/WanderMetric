import { CalendarClock, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { MediaImage } from "@/components/ui/media-image";
import { Prose } from "@/components/ui/prose";
import { getNewsArticle } from "@/core/news/news";
import { newsArticleSchema } from "@/core/news/schema";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { resolveImage } from "@/lib/media";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 900;

interface Params {
  params: Promise<{ slug: string }>;
}

async function load(slug: string) {
  const result = await getNewsArticle(createSupabasePublicClient(), slug);
  return result.ok ? result.data : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await load(slug);
  const path = `/news/${slug}`;
  if (!article) return buildMetadata({ title: "Not found", description: "", path, noIndex: true });

  const image = resolveImage(article.hero, []);
  return buildMetadata({
    title: article.title,
    description: article.excerpt ?? article.title,
    path,
    type: "article",
    publishedTime: article.published_at,
    modifiedTime: article.updated_at,
    image: image?.src,
  });
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default async function NewsArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = await load(slug);
  if (!article) notFound();

  const path = `/news/${article.slug}`;
  const image = resolveImage(article.hero, []);
  const authorName = article.author?.full_name?.trim() || null;
  const updated =
    new Date(article.updated_at).getTime() - new Date(article.published_at).getTime() > 3_600_000;

  return (
    <>
      <JsonLd
        data={newsArticleSchema({
          siteUrl: site.url,
          siteName: site.name,
          path,
          title: article.title,
          description: article.excerpt,
          publishedAt: article.published_at,
          updatedAt: article.updated_at,
          imageUrl: image ? new URL(image.src, site.url).toString() : null,
          author: authorName ? { name: authorName } : null,
        })}
      />

      <Container className="pt-4 sm:pt-5">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "News", href: "/news" },
            { label: article.title },
          ]}
        />
        <header className="mt-6 flex max-w-[48rem] flex-col gap-4">
          <h1 className="display text-[2.125rem]/[1.08] lg:text-[3.25rem]/[1.05]">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="text-ink-soft text-[1.125rem]/[1.75rem]">{article.excerpt}</p>
          )}
          <p className="text-ink-muted flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-semibold">
            <span>{authorName ? `By ${authorName}` : `By ${site.name}`}</span>
            <span className="flex items-center gap-1.5">
              <CalendarClock aria-hidden className="size-4" />
              <time dateTime={article.published_at}>
                {dateFormat.format(new Date(article.published_at))}
              </time>
            </span>
            {updated && (
              <span>
                Updated <time dateTime={article.updated_at}>{dateFormat.format(new Date(article.updated_at))}</time>
              </span>
            )}
            {article.city || article.country ? (
              <span className="flex items-center gap-1.5">
                <MapPin aria-hidden className="size-4" />
                {article.city?.name ?? article.country?.name}
              </span>
            ) : null}
          </p>
        </header>

        {image && (
          <div className="bg-surface-2 relative mt-8 aspect-[16/9] w-full max-w-[60rem] overflow-hidden rounded-2xl">
            <MediaImage media={article.hero} label={article.title} sizes="(max-width: 1024px) 100vw, 960px" priority />
          </div>
        )}

        <div className="grid gap-12 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
          <article>
            <Prose text={article.body} lead={false} />
            <p className="border-border text-ink-muted mt-12 border-t pt-5 text-sm/[1.55]">
              Published by {site.name}. This story is editorial and contains no paid placement. Offers
              we earn a commission on are listed separately; see our{" "}
              <Link href="/affiliate-disclosure" className="underline underline-offset-2">
                affiliate disclosure
              </Link>
              .
            </p>
          </article>
          <aside className="flex h-fit flex-col gap-3 lg:sticky lg:top-24">
            <Link
              href="/news"
              className="border-border bg-surface hover:border-border-strong rounded-xl border p-4 text-sm font-bold transition-colors"
            >
              More travel news
            </Link>
            {article.country && (
              <Link
                href={`/countries/${article.country.slug}`}
                className="border-border bg-surface hover:border-border-strong rounded-xl border p-4 text-sm font-bold transition-colors"
              >
                Guides and offers in {article.country.name}
              </Link>
            )}
          </aside>
        </div>
      </Container>
    </>
  );
}
