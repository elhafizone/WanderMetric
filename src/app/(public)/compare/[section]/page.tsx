import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PartnerList } from "@/components/category/partner-list";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/ui/card";
import { PageHeader, SectionHeader } from "@/components/ui/section";
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

      <Container className="flex flex-col gap-10 pt-6 pb-16 sm:gap-12 sm:pt-8 sm:pb-24">
        <section className="flex flex-col gap-4">
          <SectionHeader
            title="Providers we work with"
            href={sectionPath(section.slug)}
            linkLabel={`Guides in ${section.shortName.toLowerCase()}`}
          />
          {partners.length > 0 ? (
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
