import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { DetailHero } from "@/components/ui/detail-hero";
import { FactPanel } from "@/components/ui/fact-list";
import { AffiliateLink } from "@/components/affiliate/affiliate-link";
import { ArticleBody } from "@/components/article/article-body";
import { firstPartnerLink, parseArticleBody } from "@/lib/article/body";
import { getDealBySlug } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { formatDate } from "@/lib/format";
import { dealPath } from "@/lib/paths";
import { publicMediaUrl } from "@/lib/media";
import { createSupabasePublicClient } from "@/lib/supabase/public";

/**
 * Deals revalidate far more often than editorial pages: an expired offer on
 * screen is worse than a slightly slower page. RLS hides expired deals at the
 * database, so a stale cache is the only way one could ever surface.
 */
export const revalidate = 900;

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const db = createSupabasePublicClient();
  const result = await getDealBySlug(db, slug);

  if (!result.ok) {
    return buildMetadata({
      title: "Not found",
      description: "This deal could not be found.",
      path: dealPath(slug),
      noIndex: true,
    });
  }

  return buildMetadata({
    title: result.data.title,
    description:
      result.data.summary ??
      `${result.data.title} — a current travel deal on WanderMetric.`,
    path: dealPath(result.data.slug),
    type: "article",
    image: publicMediaUrl(result.data.hero) ?? undefined,
  });
}

export default async function DealDetailPage({ params }: Params) {
  const { slug } = await params;
  const db = createSupabasePublicClient();

  const result = await getDealBySlug(db, slug);
  if (!result.ok) notFound();
  const deal = result.data;
  const article = parseArticleBody(deal.body);
  const cta = firstPartnerLink(deal.body);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: deal.title,
          description: deal.summary ?? undefined,
          url: new URL(dealPath(deal.slug), site.url).toString(),
          datePublished: deal.published_at ?? undefined,
          publisher: { "@id": `${site.url}#organization` },
        }}
      />

      <DetailHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Deals", href: "/deals" },
          { label: deal.title },
        ]}
        eyebrow={deal.city?.name ?? deal.country?.name ?? "Travel deal"}
        title={deal.title}
        description={deal.summary}
        media={deal.hero}
        imageKeys={[deal.city?.slug, deal.country?.slug]}
        meta={
          deal.ends_at ? (
            <Badge tone="ember">
              Ends <time dateTime={deal.ends_at}>{formatDate(deal.ends_at)}</time>
            </Badge>
          ) : null
        }
      />

      <Container width="wide">
        <div className="grid gap-12 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <article>
            <ArticleBody blocks={article.blocks} />
          </article>

          <aside className="flex h-fit flex-col gap-6 lg:sticky lg:top-28">
            {/* `discount_label` is an editor-supplied string, never a computed
                figure — the schema has nowhere to store a price to compute one
                from, and that is deliberate. */}
            <FactPanel
              title="The offer"
              facts={[
                { label: "Discount", value: deal.discount_label },
                { label: "Starts", value: formatDate(deal.starts_at) },
                { label: "Ends", value: formatDate(deal.ends_at) },
                { label: "Where", value: deal.city?.name ?? deal.country?.name },
              ]}
            />
            {/* Shown on every deal page: these pages exist to carry affiliate
                links, so the disclosure belongs in context rather than only in
                the footer. */}
            {cta && (
              <AffiliateLink
                linkSlug={cta.slug}
                contentType="deal"
                contentId={deal.id}
                fromPath={dealPath(deal.slug)}
                emphasis="high"
                className="bg-accent text-accent-contrast hover:bg-accent-hover inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-[0.9375rem] font-medium shadow-sm transition-colors"
              >
                {cta.label}
              </AffiliateLink>
            )}
            <AffiliateDisclosure />
          </aside>
        </div>
      </Container>
    </>
  );
}
