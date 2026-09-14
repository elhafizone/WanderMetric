import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { Container, Stack } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { MediaImage } from "@/components/ui/media-image";
import { Prose } from "@/components/ui/prose";
import { getDealBySlug } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
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

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <Container width="narrow">
      <Stack>
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

        <div className="flex flex-col gap-5">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Deals", href: "/deals" },
              { label: deal.title },
            ]}
          />

          <div className="bg-surface-2 relative aspect-[16/9] w-full max-w-full overflow-hidden rounded-2xl">
            <MediaImage
              media={deal.hero}
              label={deal.title}
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="h-full w-full"
            />
          </div>

          <header className="flex flex-col gap-3">
            {deal.discount_label && (
              <p className="text-accent font-mono text-xs tracking-[0.16em] uppercase">
                {deal.discount_label}
              </p>
            )}
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {deal.title}
            </h1>
            {deal.summary && (
              <p className="text-ink-muted text-lg/relaxed">{deal.summary}</p>
            )}
            {deal.ends_at && (
              <p className="text-ink-muted text-sm">
                Ends <time dateTime={deal.ends_at}>{formatDate(deal.ends_at)}</time>
              </p>
            )}
          </header>
        </div>

        <Prose text={deal.body} />

        {/* Shown on every deal page: these pages exist to carry affiliate links,
            so the disclosure belongs in context rather than only in the footer. */}
        <AffiliateDisclosure />
      </Stack>
    </Container>
  );
}
