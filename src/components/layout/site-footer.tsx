import Link from "next/link";

import { SubscribeForm } from "@/components/newsletter/subscribe-form";
import { site } from "@/core/seo/site";

const EXPLORE = [
  { href: "/destinations", label: "Destinations" },
  { href: "/guides", label: "Travel guides" },
  { href: "/hotels", label: "Hotels" },
  { href: "/activities", label: "Things to do" },
  { href: "/tours", label: "Tours" },
  { href: "/flights", label: "Flights" },
  { href: "/deals", label: "Deals" },
];

const COMPANY = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms" },
  { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
];

export function SiteFooter() {
  return (
    <footer className="border-border bg-surface mt-20 border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <p className="font-semibold">
            Wander<span className="text-accent">Metric</span>
          </p>
          <p className="text-ink-muted max-w-prose text-sm">{site.description}</p>
          <div className="mt-2 max-w-sm">
            <h2 className="mb-2 text-sm font-medium">Get new guides by email</h2>
            <SubscribeForm source="footer" />
          </div>
        </div>

        <nav aria-labelledby="footer-explore" className="flex flex-col gap-3">
          <h2 id="footer-explore" className="text-sm font-medium">
            Explore
          </h2>
          <ul className="text-ink-muted flex flex-col gap-2 text-sm">
            {EXPLORE.map((item) => (
              <li key={item.href}>
                <Link className="hover:text-accent hover:underline" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-company" className="flex flex-col gap-3">
          <h2 id="footer-company" className="text-sm font-medium">
            WanderMetric
          </h2>
          <ul className="text-ink-muted flex flex-col gap-2 text-sm">
            {COMPANY.map((item) => (
              <li key={item.href}>
                <Link className="hover:text-accent hover:underline" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-border border-t">
        <div className="text-ink-muted mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} WanderMetric. All rights reserved.</p>
          {/* Site-wide disclosure. Pages carrying affiliate links repeat it in
              context, because a footer mention alone is not adequate. */}
          <p className="max-w-prose">
            Some links on this site are affiliate links. We may earn a commission at no
            cost to you.
          </p>
        </div>
      </div>
    </footer>
  );
}
