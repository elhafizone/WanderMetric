import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { SectionIcon } from "@/components/section/section-icon";
import { PageHeader } from "@/components/ui/section";
import { PARTNERS } from "@/core/affiliate/partners";
import { listLiveLinkSlugs } from "@/core/affiliate/search";
import { COMPARE_SECTIONS, comparePath } from "@/core/sections/sections";
import { buildMetadata } from "@/core/seo/metadata";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = buildMetadata({
  title: "Compare",
  description:
    "Compare providers inside one category: car rentals, transfers, eSIMs, insurance and more. We never compare across categories.",
  path: "/compare",
});

export const revalidate = 3600;

/** One tint per card so the grid reads as separate things, not one repeated tile. */
const TINTS = [
  { panel: "bg-accent-soft", icon: "bg-accent text-accent-contrast", chip: "bg-accent-soft text-accent" },
  { panel: "bg-ember-soft", icon: "bg-ember text-on-media", chip: "bg-ember-soft text-ember" },
  { panel: "bg-secondary-soft", icon: "bg-secondary text-on-media", chip: "bg-secondary-soft text-secondary" },
  { panel: "bg-success-soft", icon: "bg-success text-on-media", chip: "bg-success-soft text-success" },
  { panel: "bg-info-soft", icon: "bg-info text-on-media", chip: "bg-info-soft text-info" },
  { panel: "bg-warning-soft", icon: "bg-ink text-on-media", chip: "bg-warning-soft text-ink" },
] as const;

export default async function ComparePage() {
  const slugs = COMPARE_SECTIONS.flatMap((section) =>
    section.partnerCategory ? PARTNERS[section.partnerCategory].map((p) => p.linkSlug) : [],
  );
  const live = await listLiveLinkSlugs(createSupabasePublicClient(), slugs);
  const liveSlugs = live.ok ? live.data : new Set<string>();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Compare" }]}
        title="Compare"
        description="Choose a category. We compare providers within it, because a flight can't be set against an eSIM."
      />
      <Container className="pt-10 pb-20 sm:pt-14 sm:pb-28">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COMPARE_SECTIONS.map((section, index) => {
            const tint = TINTS[index % TINTS.length]!;
            const providers = section.partnerCategory
              ? PARTNERS[section.partnerCategory].filter((p) => liveSlugs.has(p.linkSlug))
              : [];
            return (
              <li key={section.slug}>
                <Link
                  href={comparePath(section.slug)}
                  className="group border-border bg-surface hover:border-border-strong flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className={`${tint.panel} relative flex items-end justify-between px-5 pt-6 pb-5`}>
                    <span
                      className={`${tint.icon} grid size-14 place-items-center rounded-2xl shadow-sm`}
                    >
                      <SectionIcon icon={section.icon} className="size-7" />
                    </span>
                    <span className="bg-surface/80 text-ink rounded-full px-3 py-1 text-sm font-bold backdrop-blur-sm">
                      {providers.length} {providers.length === 1 ? "provider" : "providers"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <h2 className="display-sm text-[1.375rem]/[1.75rem]">{section.name}</h2>
                    <p className="text-ink-soft text-[0.9375rem]/[1.55]">{section.summary}</p>
                    {providers.length > 0 && (
                      <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
                        {providers.slice(0, 4).map((provider) => (
                          <li
                            key={provider.linkSlug}
                            className={`${tint.chip} rounded-full px-2.5 py-1 text-xs font-bold`}
                          >
                            {provider.name}
                          </li>
                        ))}
                        {providers.length > 4 && (
                          <li className="text-ink-muted px-1 py-1 text-xs font-bold">
                            +{providers.length - 4} more
                          </li>
                        )}
                      </ul>
                    )}
                    <span className="border-border text-ink mt-1 flex items-center justify-between border-t pt-4 text-[0.9375rem] font-bold">
                      Compare {section.shortName.toLowerCase()}
                      <ArrowUpRight
                        aria-hidden
                        className="size-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </>
  );
}
