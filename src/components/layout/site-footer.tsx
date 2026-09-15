import Link from "next/link";

import { SubscribeForm } from "@/components/newsletter/subscribe-form";

/**
 * Site footer.
 *
 * No social links: no platform is connected yet (see
 * `src/core/social/provider.ts`), and icons pointing at accounts that do not
 * exist are worse than none. They belong here the day an account is real.
 */

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
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
];

export function SiteFooter() {
  return (
    <footer className="bg-bg-tint border-border mt-auto border-t">
      <div className="mx-auto w-full max-w-[84rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-16">
          <div className="flex max-w-md flex-col gap-5">
            <p
              className="font-display text-2xl leading-none tracking-tight"
              style={{ fontVariationSettings: '"opsz" 40, "SOFT" 20' }}
            >
              Wander<span className="text-accent">Metric</span>
            </p>
            <p className="text-ink-soft text-base/[1.7]">
              A travel publication for people who would rather read one honest page about
              a place than ten that were written to rank.
            </p>

            <div className="border-border mt-2 border-t pt-6">
              <h2 className="display-sm mb-1 text-lg">New guides, once in a while</h2>
              <p className="text-ink-muted mb-4 text-sm/relaxed">
                A short email when something worth reading is published. Nothing else.
              </p>
              <SubscribeForm source="footer" />
            </div>
          </div>

          <FooterNav id="footer-explore" title="Explore" items={EXPLORE} />
          <FooterNav id="footer-company" title="WanderMetric" items={COMPANY} />
        </div>

        <div className="border-border text-ink-muted flex flex-col gap-3 border-t py-8 text-xs sm:flex-row sm:items-center sm:justify-between">
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

function FooterNav({
  id,
  title,
  items,
}: {
  id: string;
  title: string;
  items: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <nav aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="eyebrow text-ink-muted">
        {title}
      </h2>
      <ul className="flex flex-col gap-3 text-[0.9375rem]">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              className="text-ink-soft hover:text-accent inline-block transition-colors duration-200"
              href={item.href}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
