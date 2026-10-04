import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { SectionIcon } from "@/components/section/section-icon";
import { PageHeader } from "@/components/ui/section";
import { COMPARE_SECTIONS, comparePath } from "@/core/sections/sections";
import { buildMetadata } from "@/core/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Compare",
  description:
    "Compare providers inside one category: car rentals, transfers, eSIMs, insurance and more. We never compare across categories.",
  path: "/compare",
});

export default function ComparePage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Compare" }]}
        title="Compare"
        description="Choose a category. We compare providers within it, because a flight can't be set against an eSIM."
      />
      <Container className="pt-6 pb-16 sm:pt-8 sm:pb-24">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMPARE_SECTIONS.map((section) => (
            <li key={section.slug}>
              <Link
                href={comparePath(section.slug)}
                className="border-border bg-surface hover:border-border-strong flex h-full flex-col gap-2 rounded-lg border p-5 transition-colors"
              >
                <SectionIcon icon={section.icon} className="text-accent h-6 w-6" />
                <span className="display-sm text-[1.25rem]/6">{section.name}</span>
                <span className="text-ink-soft text-sm/[1.55]">{section.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
