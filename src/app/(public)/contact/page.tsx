import type { Metadata } from "next";

import { Container, Stack } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/section";
import { buildMetadata } from "@/core/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: "How to reach WanderMetric about corrections, partnerships or press.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <Container width="narrow">
      <Stack>
        <div className="flex flex-col gap-5">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
          <PageHeader eyebrow="Contact" title="Contact" />
        </div>
        <div className="prose-page flex max-w-[68ch] flex-col gap-5 text-[17px]/[1.7]">
          <p>
            We read everything, and we correct mistakes quickly. If something on this site
            is wrong or out of date, telling us is genuinely useful.
          </p>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Corrections</h2>
          <p>
            Include the page URL and what is wrong. Factual corrections are made as soon
            as they are verified.
          </p>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Partnerships</h2>
          <p>
            We work with travel brands through affiliate programmes. We do not sell
            editorial coverage, and we do not publish paid posts as though they were
            independent.
          </p>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Email</h2>
          <p>
            Write to{" "}
            <a
              className="text-accent underline-offset-4 hover:underline"
              href="mailto:hello@wandermetric.com"
            >
              hello@wandermetric.com
            </a>
            .
          </p>
        </div>
      </Stack>
    </Container>
  );
}
