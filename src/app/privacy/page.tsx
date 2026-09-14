import type { Metadata } from "next";

import { Container, Stack } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/section";
import { buildMetadata } from "@/core/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Privacy policy",
  description:
    "What WanderMetric collects, what it deliberately does not collect, and how long anything is kept.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <Container width="narrow">
      <Stack>
        <div className="flex flex-col gap-5">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Privacy policy" }]}
          />
          <PageHeader eyebrow="Legal" title="Privacy policy" />
        </div>
        <div className="prose-page flex max-w-[68ch] flex-col gap-5 text-[17px]/[1.7]">
          <p>
            This policy describes what this site actually does. It is written against the
            implementation rather than copied from a template.
          </p>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">What we collect</h2>
          <p>When you visit a page, we may record:</p>
          <ul className="text-ink-muted flex list-disc flex-col gap-2 pl-5">
            <li>the page path and the time of the visit</li>
            <li>
              the referring website&rsquo;s hostname — the host only, never the full
              referring URL
            </li>
            <li>UTM campaign parameters, when a link carries them</li>
            <li>a coarse country, derived at the network edge</li>
            <li>a device category: desktop, mobile or tablet</li>
            <li>a random session identifier stored in a first-party cookie</li>
          </ul>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">
            What we deliberately do not collect
          </h2>
          <ul className="text-ink-muted flex list-disc flex-col gap-2 pl-5">
            <li>
              Your IP address is never stored. It is used only to derive a country at the
              edge, and is then discarded.
            </li>
            <li>No cross-site tracking identifier, and no fingerprinting.</li>
            <li>
              No name, email or other personal detail, unless you choose to give it to us
              by subscribing to the newsletter.
            </li>
            <li>No advertising network trackers.</li>
          </ul>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">
            The session cookie
          </h2>
          <p>
            The session cookie holds a random identifier with no connection to you as a
            person. It exists so that a click on a partner link can be attributed to the
            page that produced it, which is how this site is funded. It expires after 30
            days — no longer than the attribution window it serves — and it is httpOnly,
            so scripts cannot read it.
          </p>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Affiliate links</h2>
          <p>
            When you follow a partner link, we record the click and pass an anonymous
            identifier to the partner so any resulting booking is credited to us. The
            partner then applies its own privacy policy, which we do not control. We never
            pass your personal details to a partner, because we do not hold them.
          </p>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Newsletter</h2>
          <p>
            If you subscribe, we store your email address, the page you subscribed from,
            and the date. Subscription is double opt-in: nothing is sent until you
            confirm. You can unsubscribe from any email, and we never sell or share the
            list.
          </p>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Retention</h2>
          <p>
            Raw visit and click records are aggregated into daily totals and the
            underlying rows are aged out. Aggregated statistics contain no identifiers of
            any kind.
          </p>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Your rights</h2>
          <p>
            Under the GDPR and equivalent laws you may request access to, correction of,
            or deletion of any personal data we hold. In practice that is limited to a
            newsletter subscription, since nothing else we store identifies a person.
            Write to{" "}
            <a
              className="text-accent underline-offset-4 hover:underline"
              href="mailto:privacy@wandermetric.com"
            >
              privacy@wandermetric.com
            </a>
            .
          </p>
        </div>
      </Stack>
    </Container>
  );
}
