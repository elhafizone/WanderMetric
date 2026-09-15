import type { Metadata } from "next";

import { Container, PageShell, Stack } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/section";
import { buildMetadata } from "@/core/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "About WanderMetric",
  description:
    "What WanderMetric is, how it is funded, and the editorial standards it holds itself to.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <PageShell>
      <Container width="narrow">
        <Stack gap="tight">
          <div className="flex flex-col gap-6">
            <Breadcrumbs
              items={[{ label: "Home", href: "/" }, { label: "About WanderMetric" }]}
            />
            <PageHeader eyebrow="About" title="About WanderMetric" />
            <div aria-hidden="true" className="rule w-full" />
          </div>
          <div className="prose-page flex flex-col gap-5">
            <p>
              WanderMetric is a travel discovery platform. We write destination guides,
              describe what is genuinely worth your time in a place, and point you at the
              places to stay and things to book.
            </p>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">
              How we are funded
            </h2>
            <p>
              We earn commission when a reader books through a partner link on this site.
              That funding model only works if the recommendations are worth trusting, so
              it is separated from the editorial work: commission rates never influence
              what we cover, what we recommend, or what we say about it.
            </p>
            <p>
              Every page carrying affiliate links says so, in context, near the links
              themselves. We do not accept payment for coverage, and we do not publish
              sponsored posts dressed up as editorial.
            </p>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">
              What we will not do
            </h2>
            <ul className="text-ink-muted flex list-disc flex-col gap-2 pl-5">
              <li>
                Publish invented prices, availability, ratings or reviews. If we do not
                hold the data, we do not show a number.
              </li>
              <li>
                Mass-generate thin pages to chase search traffic. A destination page
                cannot be published here until it carries real, original substance — that
                rule is enforced by the database, not by good intentions.
              </li>
              <li>Recommend somewhere because it pays better.</li>
            </ul>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">Get in touch</h2>
            <p>
              Corrections and questions are welcome — see the{" "}
              <a
                className="text-accent underline-offset-4 hover:underline"
                href="/contact"
              >
                contact page
              </a>
              .
            </p>
          </div>
        </Stack>
      </Container>
    </PageShell>
  );
}
