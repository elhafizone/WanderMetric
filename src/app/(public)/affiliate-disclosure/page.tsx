import type { Metadata } from "next";

import { Container, Stack } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/section";
import { buildMetadata } from "@/core/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Affiliate disclosure",
  description:
    "How WanderMetric earns money from partner links, and what that does and does not affect.",
  path: "/affiliate-disclosure",
});

export default function AffiliateDisclosurePage() {
  return (
    <Container width="narrow">
      <Stack>
        <div className="flex flex-col gap-5">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Affiliate disclosure" }]}
          />
          <PageHeader eyebrow="Legal" title="Affiliate disclosure" />
        </div>
        <div className="prose-page flex max-w-[68ch] flex-col gap-5 text-[17px]/[1.7]">
          <p>
            WanderMetric earns commission when a reader books through some of the links on
            this site. This page explains exactly how that works.
          </p>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">
            What an affiliate link is
          </h2>
          <p>
            Some links here point to booking partners. If you follow one and make a
            booking, the partner pays us a percentage of what they earn. The price you pay
            is identical either way — the commission comes out of the partner&rsquo;s
            margin, not out of your pocket.
          </p>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">
            How links are marked
          </h2>
          <p>
            Affiliate links carry{" "}
            <code className="bg-surface-2 rounded px-1 py-0.5 font-mono text-[0.9em]">
              rel=&quot;sponsored nofollow&quot;
            </code>
            , which is the attribute search engines expect on a paid link, and every page
            carrying them shows a disclosure next to the links themselves rather than only
            in the footer.
          </p>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">
            What it does not affect
          </h2>
          <ul className="text-ink-muted flex list-disc flex-col gap-2 pl-5">
            <li>Which destinations, hotels or activities we cover.</li>
            <li>
              What we say about them. A place we like gets a good write-up whether or not
              it pays.
            </li>
            <li>The order things appear in. Rankings are editorial, not commercial.</li>
          </ul>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Why we tell you</h2>
          <p>
            Disclosure is legally required — by the FTC in the United States, the CAP Code
            in the UK, and equivalent rules elsewhere. It is also simply the right way to
            run a site funded this way: you should know how the thing you are reading
            makes money.
          </p>
        </div>
      </Stack>
    </Container>
  );
}
