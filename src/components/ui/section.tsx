import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/layout/container";

/**
 * Section heading: a display title, an optional line of support, and an "all"
 * link on the right that is always a 44px hit target.
 *
 * `eyebrow` is a small overline above the title. `tone="ember"` colours it for
 * time-bound sections (the deals rail) and nowhere else.
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
      className={`flex flex-wrap items-end gap-x-6 gap-y-2 ${
        centered ? "flex-col items-center text-center" : "justify-between"
      }`}
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <p className={`eyebrow mb-1.5 ${tone === "ember" ? "text-ember" : "text-secondary"}`}>
            {eyebrow}
          </p>
        )}
        <h2 className="display text-[1.5rem]/[1.25] lg:text-[2rem]/[1.2]">{title}</h2>
        {description && (
          <p className="text-ink-muted mt-1.5 max-w-prose text-base/6">{description}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="text-ink hover:text-accent inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[0.9375rem] font-extrabold transition-colors"
        >
          {linkLabel}
          <ArrowRight aria-hidden="true" className="h-[1.125rem] w-[1.125rem]" />
        </Link>
      )}
    </div>
  );
}

/**
 * Header band for listing pages: a tinted strip with the breadcrumb, a 44px
 * title and one line of support. Actions (a search field, a sort control) go
 * in `children`, beside or beneath the title.
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
      <Container className="flex flex-col gap-3.5 pt-5 pb-7 sm:pb-8">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <header className="max-w-3xl">
            {eyebrow && <p className="eyebrow text-secondary mb-1.5">{eyebrow}</p>}
            <h1 className="display text-[2rem]/[2.25rem] lg:text-[2.75rem]/[3.125rem]">
              {title}
            </h1>
            {description && (
              <p className="text-ink-soft mt-2 max-w-[62ch] text-base/6 sm:text-[1.0625rem]/[1.625rem]">
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
