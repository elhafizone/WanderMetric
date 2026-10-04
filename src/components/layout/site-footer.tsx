import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { CookieSettingsButton } from "@/components/analytics/consent";
import { Logo } from "@/components/brand/logo";

/**
 * Site footer: ink ground, the brand, the long form of the affiliate
 * disclosure, and four columns of links.
 *
 * The long disclosure lives here (the short form sits beside the search module
 * and above the first affiliate link on a page), and it is never collapsed.
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
    title: "Search",
    links: [
      { href: "/flights", label: "Flights" },
      { href: "/car-hire", label: "Car hire" },
      { href: "/transfers", label: "Airport transfers" },
      { href: "/activities", label: "Things to do" },
      { href: "/esim", label: "eSIMs" },
      { href: "/insurance", label: "Travel insurance" },
    ],
  },
  {
    title: "Plan",
    links: [
      { href: "/destinations", label: "Destinations" },
      { href: "/deals", label: "Deals" },
      { href: "/guides", label: "Guides" },
      { href: "/hotels", label: "Hotels & stays" },
    ],
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
  "text-n-400 flex min-h-9 items-center text-sm font-medium transition-colors hover:text-white hover:underline";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-n-400 mt-auto">
      <div className="mx-auto w-full max-w-[80rem] px-5 pt-10 pb-8 sm:px-8 lg:px-10 lg:pt-16 lg:pb-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-16">
          <div className="flex max-w-[27.5rem] flex-col gap-4">
            <Logo tone="reversed" className="h-8 w-auto self-start" />
            <Link
              href="/affiliate-disclosure"
              className="flex min-h-11 items-center gap-1.5 self-start text-sm font-bold text-white"
            >
              Read how we earn
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4 lg:gap-x-6">
            {GROUPS.map((group) => (
              <nav key={group.title} aria-label={group.title} className="flex flex-col gap-0.5">
                <h2 className="mb-1.5 text-xs/4 font-extrabold tracking-[0.08em] text-white uppercase">
                  {group.title}
                </h2>
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} className={LINK}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            ))}
            <nav aria-label="Legal" className="flex flex-col gap-0.5">
              <h2 className="mb-1.5 text-xs/4 font-extrabold tracking-[0.08em] text-white uppercase">
                Legal
              </h2>
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

        <div className="mt-10 flex flex-col gap-2 border-t border-[#3a3631] pt-5 text-[0.8125rem]/5 font-medium sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-6">
          <span>© {new Date().getFullYear()} WanderMetric · wandermetric.com</span>
          <span>
            Prices, where shown, are last-seen partner figures and may have changed. Always
            check the final price before you book.
          </span>
        </div>
      </div>
    </footer>
  );
}
