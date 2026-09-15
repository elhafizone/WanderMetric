import type { Metadata } from "next";

import { Container, PageShell, Stack } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/section";
import { buildMetadata } from "@/core/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Terms of use",
  description: "The terms under which WanderMetric is provided.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <PageShell>
      <Container width="narrow">
        <Stack gap="tight">
          <div className="flex flex-col gap-6">
            <Breadcrumbs
              items={[{ label: "Home", href: "/" }, { label: "Terms of use" }]}
            />
            <PageHeader eyebrow="Legal" title="Terms of use" />
            <div aria-hidden="true" className="rule w-full" />
          </div>
          <div className="prose-page flex flex-col gap-5">
            <h2 className="mt-4 text-xl font-semibold tracking-tight">
              Use of this site
            </h2>
            <p>
              WanderMetric is provided for personal, non-commercial use. You may link to
              any page here freely.
            </p>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">Accuracy</h2>
            <p>
              Travel information changes. Opening hours, journey times, prices and entry
              requirements move without notice, and while we correct errors as soon as we
              find them, you should confirm anything time-sensitive with the operator
              before you travel. We do not warrant that every detail is current.
            </p>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">
              Third-party bookings
            </h2>
            <p>
              Bookings are made with third-party partners, not with WanderMetric. Their
              terms, their cancellation policies and their customer service apply. We are
              not a party to your booking and cannot alter or cancel it.
            </p>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">
              Intellectual property
            </h2>
            <p>
              Text and design on this site belong to WanderMetric unless credited
              otherwise. Short quotations with attribution and a link are welcome;
              wholesale reproduction is not.
            </p>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">Liability</h2>
            <p>
              To the extent permitted by law, WanderMetric is not liable for loss arising
              from reliance on information published here or from any transaction with a
              third-party partner.
            </p>
          </div>
        </Stack>
      </Container>
    </PageShell>
  );
}
