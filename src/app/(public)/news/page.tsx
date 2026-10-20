import { Clock, Newspaper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/ui/card";
import { MediaImage } from "@/components/ui/media-image";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/section";
import { listNews } from "@/core/news/news";
import { buildMetadata } from "@/core/seo/metadata";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 900;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

function pageNumber(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = pageNumber((await searchParams).page);
  const result = await listNews(createSupabasePublicClient(), { page, perPage: 12 });
  const empty = !result.ok || result.data.items.length === 0;

  return buildMetadata({
    title: "Travel news",
    description:
      "Dated travel news: changes to flights, visas, passes, transport and attractions that affect a trip, each with its source.",
    path: page > 1 ? `/news?page=${page}` : "/news",
    // An empty news desk is not a page worth indexing.
    noIndex: empty,
  });
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default async function NewsIndexPage({ searchParams }: Props) {
  const page = pageNumber((await searchParams).page);
  const result = await listNews(createSupabasePublicClient(), { page, perPage: 12 });
  const articles = result.ok ? result.data.items : [];

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "News" }]}
        title="Travel news"
        description="Dated reports on changes that affect a trip. Every story says when it was published and where the facts came from."
      />
      <Container className="pt-6 pb-16 sm:pt-8 sm:pb-24">
        {articles.length > 0 && result.ok ? (
          <>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <li key={article.id}>
                  <article className="group border-border bg-surface hover:border-border-strong relative flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-lg">
                    <div className="bg-surface-2 relative aspect-[16/10] w-full overflow-hidden">
                      <MediaImage
                        media={article.hero}
                        label={article.title}
                        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2.5 p-5">
                      <time
                        dateTime={article.published_at}
                        className="text-ink-muted text-xs font-semibold"
                      >
                        {dateFormat.format(new Date(article.published_at))}
                      </time>
                      <h2 className="display-sm text-[1.1875rem]/[1.6rem] text-pretty">
                        <Link href={`/news/${article.slug}`} className="after:absolute after:inset-0">
                          {article.title}
                        </Link>
                      </h2>
                      {article.excerpt && (
                        <p className="text-ink-soft line-clamp-3 text-sm/[1.55]">{article.excerpt}</p>
                      )}
                      {article.reading_minutes ? (
                        <p className="text-ink-muted mt-auto flex items-center gap-1.5 pt-2 text-[0.8125rem] font-semibold">
                          <Clock aria-hidden className="size-3.5" />
                          {article.reading_minutes} min read
                        </p>
                      ) : null}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
            <Pagination meta={result.data.meta} basePath="/news" />
          </>
        ) : (
          <EmptyState
            title="No news published yet"
            description="Stories appear here once a dated report has been written and reviewed. Browse the guides and offers in the meantime."
          />
        )}
        <p className="text-ink-muted mt-10 flex items-start gap-2 text-sm/[1.55]">
          <Newspaper aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            News is written independently of our partners. Links to bookable offers live on the
            offer pages, not inside news stories; see our{" "}
            <Link href="/affiliate-disclosure" className="underline underline-offset-2">
              affiliate disclosure
            </Link>
            .
          </span>
        </p>
      </Container>
    </>
  );
}
