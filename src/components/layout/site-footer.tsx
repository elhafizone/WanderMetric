import Link from "next/link";

import { CookieSettingsButton } from "@/components/analytics/consent";
import { Logo } from "@/components/brand/logo";
import { COMPARE_SECTIONS, SECTIONS, comparePath, sectionPath } from "@/core/sections/sections";

/**
 * Site footer: espresso ground, the brand with a concise description and
 * Company links, and four visual columns on desktop.
 *
 * The affiliate disclosure lives on its own dedicated page; the footer links
 * straight to it under Company.
 *
 * No social links: no platform is connected yet (see
 * `src/core/social/provider.ts`), and icons pointing at accounts that do not
 * exist are worse than none. They belong here the day an account is real.
 */

const COMPANY_LINKS: Array<{ href: string; label: string }> = [
  { href: "/about", label: "About us" },
  { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
  { href: "/contact", label: "Contact" },
];

const SECTION_LINKS = SECTIONS.map((s) => ({
  href: sectionPath(s.slug),
  label: s.name,
}));

const COMPARE_LINKS = [
  { href: "/compare", label: "All comparisons" },
  ...COMPARE_SECTIONS.map((s) => ({
    href: comparePath(s.slug),
    label: s.name,
  })),
];

const LINK =
  "text-n-400 flex min-h-9 items-center text-[0.9375rem] font-medium transition-colors hover:text-white hover:underline underline-offset-4";

const HEADING = "mb-2 text-[0.9375rem] font-bold text-white";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-n-400 mt-auto">
      <div className="mx-auto w-full max-w-[80rem] px-5 pt-14 pb-8 sm:px-8 lg:px-10 lg:pt-20 lg:pb-10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-x-12">
          <div className="flex flex-col gap-6 sm:col-span-2 lg:col-span-1">
            <Logo tone="reversed" className="h-10 w-auto self-start" />
            <p className="text-n-400 max-w-[34ch] text-[0.9375rem]/[1.6]">
              WanderMetric helps travelers discover real trips, experiences, and travel services
              with the details they need to make better booking decisions.
            </p>
            <nav aria-label="Company" className="flex flex-col gap-0.5">
              <h2 className={HEADING}>Company</h2>
              {COMPANY_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={LINK}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <nav aria-label="Sections" className="flex flex-col gap-0.5">
            <h2 className={HEADING}>Sections</h2>
            {SECTION_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={LINK}>
                {link.label}
              </Link>
            ))}
          </nav>

          <nav aria-label="Compare" className="flex flex-col gap-0.5">
            <h2 className={HEADING}>Compare</h2>
            {COMPARE_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={LINK}>
                {link.label}
              </Link>
            ))}
          </nav>

          <nav aria-label="Legal" className="flex flex-col gap-0.5">
            <h2 className={HEADING}>Legal</h2>
            <Link href="/privacy" className={LINK}>
              Privacy
            </Link>
            <CookieSettingsButton className={`${LINK} w-full text-left`} />
            <Link href="/terms" className={LINK}>
              Terms
            </Link>
          </nav>
        </div>

        <div className="mt-14 flex items-center justify-center border-t border-white/15 pt-6 text-center text-[0.8125rem]/5 font-medium">
          <span>© 2026 WanderMetric</span>
        </div>
      </div>
    </footer>
  );
}
