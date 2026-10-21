import { Check } from "lucide-react";

import { PartnerList } from "@/components/category/partner-list";
import { Container } from "@/components/layout/container";
import { SearchModule, type TabKey } from "@/components/search/search-module";
import { ArticleTile } from "@/components/ui/article-tile";
import { EmptyState } from "@/components/ui/card";
import { PageHeader, SectionHeader } from "@/components/ui/section";
import { PARTNERS, type CategoryKey } from "@/core/affiliate/partners";
import { listLiveLinkSlugs } from "@/core/affiliate/search";
import { getGuideBySlug } from "@/core/content/queries";
import { loadSearchModuleData } from "@/lib/search-module-data";
import { createSupabasePublicClient } from "@/lib/supabase/public";

/**
 * One template for the partner categories: car hire, transfers, eSIMs and
 * insurance.
 *
 * Each is the same honest shape: what to check before you book, the providers
 * we work with (only those whose link is live), and the guide that goes deeper.
 * A page can carry the search module when a search is what a visitor wants
 * there, and a second, smaller provider group for the thing that goes wrong
 * next (a flight claim beside travel insurance).
 */
export interface CategoryConfig {
  key: CategoryKey;
  path: string;
  crumb: string;
  title: string;
  description: string;
  /** Open the search module on this tab. Omit for no module. */
  searchTab?: TabKey;
  checklistTitle: string;
  checklist: string[];
  guideSlug?: string;
  /** A second provider group under the first. */
  also?: { key: CategoryKey; title: string; description: string; guideSlug?: string };
}

export async function CategoryPage({ config }: { config: CategoryConfig }) {
  const db = createSupabasePublicClient();

  const groups = [config.key, ...(config.also ? [config.also.key] : [])];
  const allSlugs = groups.flatMap((key) => PARTNERS[key].map((partner) => partner.linkSlug));

  const [live, search, guide, alsoGuide] = await Promise.all([
    listLiveLinkSlugs(db, allSlugs),
    config.searchTab ? loadSearchModuleData(db) : Promise.resolve(null),
    config.guideSlug ? getGuideBySlug(db, config.guideSlug) : Promise.resolve(null),
    config.also?.guideSlug ? getGuideBySlug(db, config.also.guideSlug) : Promise.resolve(null),
  ]);

  const liveSlugs = live.ok ? live.data : new Set<string>();
  const partners = PARTNERS[config.key].filter((partner) => liveSlugs.has(partner.linkSlug));
  const alsoPartners = config.also
    ? PARTNERS[config.also.key].filter((partner) => liveSlugs.has(partner.linkSlug))
    : [];

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: config.crumb }]}
        title={config.title}
        description={config.description}
      />

      <Container className="flex flex-col gap-16 pt-10 pb-20 sm:gap-24 sm:pt-14 sm:pb-28">
        {search && config.searchTab && (
          <SearchModule
            partners={search.partners}
            airports={search.airports}
            initialTab={config.searchTab}
          />
        )}

        <section className="flex flex-col gap-8">
          <SectionHeader
            title="Providers we work with"
            description="Compare on their sites. You book with the provider."
          />
          {partners.length > 0 ? (
            <PartnerList partners={partners} campaign={config.key} fromPath={config.path} />
          ) : (
            <EmptyState
              title="No providers are available right now"
              description="We only list a provider while its link works. Check back soon, or read the guide below."
            />
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-8">
          <div className="border-border bg-surface flex flex-col gap-3 rounded-lg border p-5 sm:p-6">
            <h2 className="display-sm text-xl">{config.checklistTitle}</h2>
            <ul className="flex flex-col gap-2.5">
              {config.checklist.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-base/6">
                  <Check aria-hidden="true" className="text-accent mt-1 h-[1.125rem] w-[1.125rem] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {guide?.ok && (
            <div className="flex flex-col gap-3">
              <h2 className="eyebrow text-ink-muted">Read next</h2>
              <ArticleTile guide={guide.data} />
            </div>
          )}
        </section>

        {config.also && alsoPartners.length > 0 && (
          <section className="flex flex-col gap-8">
            <SectionHeader title={config.also.title} description={config.also.description} />
            <PartnerList
              partners={alsoPartners}
              campaign={config.also.key}
              fromPath={config.path}
            />
            {alsoGuide?.ok && (
              <div className="max-w-md">
                <ArticleTile guide={alsoGuide.data} />
              </div>
            )}
          </section>
        )}
      </Container>
    </>
  );
}
