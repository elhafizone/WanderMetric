import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PartnerList } from "@/components/category/partner-list";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/ui/card";
import { PageHeader, SectionHeader } from "@/components/ui/section";
import { CompareTable } from "@/components/compare/compare-table";
import { COMPARE } from "@/core/affiliate/compare";
import { formatReadOn } from "@/core/content/offer-facts";
import { routes } from "@/core/seo/site";
import { PARTNERS } from "@/core/affiliate/partners";
import { listLiveLinkSlugs } from "@/core/affiliate/search";
import {
  COMPARE_SECTIONS,
  comparePath,
  getSection,
  sectionPath,
} from "@/core/sections/sections";
import { buildMetadata } from "@/core/seo/metadata";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return COMPARE_SECTIONS.map((section) => ({ section: section.slug }));
}

interface Params {
  params: Promise<{ section: string }>;
}

function comparable(slug: string) {
  const section = getSection(slug);
  return section?.partnerCategory ? section : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { section: slug } = await params;
  const section = comparable(slug);
  if (!section) {
    return buildMetadata({ title: "Not found", description: "", path: `/compare/${slug}`, noIndex: true });
  }
  return buildMetadata({
    title: `Compare ${section.name.toLowerCase()}`,
    description: `The providers we work with for ${section.name.toLowerCase()}, what each says about itself, and what to check before you book.`,
    path: comparePath(section.slug),
  });
}

export default async function CompareSectionPage({ params }: Params) {
  const { section: slug } = await params;
  const section = comparable(slug);
  if (!section?.partnerCategory) notFound();

  const all = PARTNERS[section.partnerCategory];
  const live = await listLiveLinkSlugs(
    createSupabasePublicClient(),
    all.map((partner) => partner.linkSlug),
  );
  const liveSlugs = live.ok ? live.data : new Set<string>();
  const partners = all.filter((partner) => liveSlugs.has(partner.linkSlug));

  // A category with comparison data gets the side-by-side table; the rest keep
  // the provider list until their data has been read from the partners' sites.
  const compare = COMPARE[section.partnerCategory];
  const compareRows = (compare?.rows ?? [])
    .filter((row) => liveSlugs.has(row.linkSlug))
    .map((row) => ({
      linkSlug: row.linkSlug,
      name: row.name,
      kind: row.kind,
      logo: row.logo ?? null,
      values: row.values,
      sourceUrl: row.sourceUrl,
      href: `${routes.affiliateRedirect(row.linkSlug)}?${new URLSearchParams({
        c: `compare-${section.slug}`,
        from: comparePath(section.slug),
      }).toString()}`,
    }));

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Compare", href: "/compare" },
          { label: section.name },
        ]}
        title={`Compare ${section.name.toLowerCase()}`}
        description="Providers in this category only. Compare on their sites; you book with the provider."
      />

      <Container className="flex flex-col gap-16 pt-10 pb-20 sm:gap-24 sm:pt-14 sm:pb-28">
        <section className="flex flex-col gap-8">
          <SectionHeader
            title={compare ? "Compare providers" : "Providers we work with"}
            description={compare ? "The same questions put to each provider, answered from its own website." : undefined}
            href={sectionPath(section.slug)}
            linkLabel={`Guides in ${section.shortName.toLowerCase()}`}
          />
          {compare && compareRows.length > 0 ? (
            <CompareTable
              criteria={compare.criteria}
              rows={compareRows}
              readOn={formatReadOn(compare.rows[0]?.readOn)}
            />
          ) : partners.length > 0 ? (
            <PartnerList partners={partners} campaign={`compare-${section.slug}`} fromPath={comparePath(section.slug)} />
          ) : (
            <EmptyState
              title="No providers are available right now"
              description="We list a provider only while its link works. Check back soon."
            />
          )}
        </section>

        <section className="border-border bg-surface flex flex-col gap-3 rounded-lg border p-5 sm:p-6">
          <h2 className="display-sm text-xl">{section.checklistTitle}</h2>
          <ul className="flex flex-col gap-2.5">
            {section.checklist.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-base/6">
                <Check
                  aria-hidden="true"
                  className="text-accent mt-1 h-[1.125rem] w-[1.125rem] shrink-0"
                />
                {item}
              </li>
            ))}
          </ul>
          <Link href={sectionPath(section.slug)} className="text-accent text-sm font-bold underline underline-offset-2">
            Read the guides in this section
          </Link>
        </section>
      </Container>
    </>
  );
}
