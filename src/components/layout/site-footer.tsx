import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { CookieSettingsButton } from "@/components/analytics/consent";
import { Logo } from "@/components/brand/logo";
import { SECTIONS, sectionPath } from "@/core/sections/sections";

/**
 * Site footer: espresso ground, the brand with a one-line promise, the way the
 * site earns its money, and four columns of links.
 *
 * The long disclosure lives on its own page (the short form sits beside the
 * search module and above the first affiliate link on a page); the footer links
 * straight to it and never collapses it.
 *
 * No social links: no platform is connected yet (see
 * `src/core/social/provider.ts`), and icons pointing at accounts that do not
 * exist are worse than none. They belong here the day an account is real.
 */

const GROUPS: Array<{
  title: string;
  links: Array<{ href: string; label: string }>;
}> = [
  {
    title: "Sections",
    links: SECTIONS.map((s) => ({ href: sectionPath(s.slug), label: s.name })),
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/affiliate-disclosure", label: "How we make money" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

const LINK =
  "text-n-400 flex min-h-9 items-center text-[0.9375rem] font-medium transition-colors hover:text-white hover:underline underline-offset-4";

const HEADING = "mb-2 text-[0.9375rem] font-bold text-white";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-n-400 mt-auto">
      <div className="mx-auto w-full max-w-[80rem] px-5 pt-14 pb-8 sm:px-8 lg:px-10 lg:pt-20 lg:pb-10">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between lg:gap-16">
          <div className="flex max-w-[24rem] flex-col gap-6">
            <Logo tone="reversed" className="h-10 w-auto self-start" />
            <p className="display text-[2rem]/[1.08] text-white sm:text-[2.5rem]/[1.05]">
              Read what a trip includes before you book it.
            </p>
            <Link
              href="/affiliate-disclosure"
              className="text-cta-light flex min-h-11 items-center gap-1.5 self-start text-[0.9375rem] font-bold underline decoration-1 underline-offset-[6px]"
            >
              How we make money
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:w-[36rem] lg:grid-cols-[1.25fr_1fr_1fr] lg:gap-x-10">
            {GROUPS.map((group) => (
              <nav key={group.title} aria-label={group.title} className="flex flex-col gap-0.5">
                <h2 className={HEADING}>{group.title}</h2>
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} className={LINK}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            ))}
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
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-white/15 pt-6 text-[0.8125rem]/5 font-medium sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-8">
          <span>© {new Date().getFullYear()} WanderMetric · wandermetric.com</span>
          <span className="max-w-[60ch]">
            Prices, where shown, are last-seen partner figures and may have changed. Always
            check the final price before you book.
          </span>
        </div>
      </div>
    </footer>
  );
}
