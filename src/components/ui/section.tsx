import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/layout/container";

/**
 * Section heading: a display title, an optional line of support, and an "all"
 * link on the right that is always a 44px hit target.
 *
 * `eyebrow` is a small lead-in above the title; use it only when it says
 * something the title does not. `tone="ember"` colours it for time-bound
 * sections and nowhere else.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "See all",
  align = "split",
  tone = "accent",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  align?: "split" | "center";
  tone?: "accent" | "ember";
}) {
  const centered = align === "center";

  return (
    <div
      className={`flex flex-wrap items-end gap-x-6 gap-y-3 ${
        centered ? "flex-col items-center text-center" : "justify-between"
      }`}
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <p className={`eyebrow mb-2 ${tone === "ember" ? "text-ember" : "text-secondary"}`}>
            {eyebrow}
          </p>
        )}
        <h2 className="display text-[1.75rem]/[1.12] sm:text-[2.25rem]/[1.1]">{title}</h2>
        {description && (
          <p className="text-ink-muted mt-3 max-w-prose text-base/[1.6] sm:text-[1.0625rem]/[1.65]">
            {description}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="text-ink hover:text-accent decoration-border-strong hover:decoration-accent inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[0.9375rem] font-bold underline decoration-1 underline-offset-[6px] transition-colors"
        >
          {linkLabel}
          <ArrowUpRight aria-hidden="true" className="h-[1.125rem] w-[1.125rem]" />
        </Link>
      )}
    </div>
  );
}

/**
 * Header band for listing pages: a sand strip with the breadcrumb, a large
 * serif title and one line of support. Actions (a search field, a sort control)
 * go in `children`, beside or beneath the title.
 *
 * It renders its own full-bleed band, so a page places it directly under the
 * site header and not inside a Container.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string | null;
  crumbs?: Crumb[];
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-bg-tint border-border border-b">
      <Container className="flex flex-col gap-6 pt-5 pb-9 sm:gap-8 sm:pb-12 lg:pb-14">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <header className="max-w-3xl">
            {eyebrow && <p className="eyebrow text-secondary mb-2">{eyebrow}</p>}
            <h1 className="display text-[2.125rem]/[1.08] sm:text-[2.75rem]/[1.05] lg:text-[3.5rem]/[1.04]">
              {title}
            </h1>
            {description && (
              <p className="text-ink-soft mt-4 max-w-[58ch] text-base/[1.65] sm:text-[1.125rem]/[1.7]">
                {description}
              </p>
            )}
          </header>
          {children}
        </div>
      </Container>
    </div>
  );
}
