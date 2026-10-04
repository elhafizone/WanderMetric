import { Check, ExternalLink } from "lucide-react";

import type { PartnerInfo } from "@/core/affiliate/partners";
import { routes } from "@/core/seo/site";

/**
 * A row per partner: what it is, what it says about itself, and one button.
 *
 * The identity's offer card without a price. There is no price because we hold
 * none, and there is no logo because we do not show partner marks: the tile on
 * the left is the partner's initial on the brand tint, which claims nothing.
 *
 * The button is the only affiliate link in the row and goes to `/go/{slug}`,
 * never to the partner's URL, with `rel="sponsored nofollow noopener"` and a
 * new tab, so the outbound treatment is identical everywhere on the site.
 */
export function PartnerList({
  partners,
  campaign,
  fromPath,
}: {
  partners: PartnerInfo[];
  campaign: string;
  fromPath: string;
}) {
  return (
    <ul className="flex flex-col gap-3 sm:gap-4">
      {partners.map((partner) => {
        const href = `${routes.affiliateRedirect(partner.linkSlug)}?${new URLSearchParams({
          c: campaign,
          from: fromPath,
        }).toString()}`;

        return (
          <li
            key={partner.linkSlug}
            className="border-border bg-surface flex flex-col overflow-hidden rounded-lg border transition-shadow duration-200 hover:shadow-md sm:flex-row"
          >
            <div className="flex flex-1 gap-4 p-4 sm:p-5">
              <span
                aria-hidden="true"
                className="bg-accent-soft text-accent font-display flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl font-bold"
              >
                {partner.name.charAt(0)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-secondary-soft text-secondary rounded-full px-2.5 py-1 text-xs/4 font-bold">
                    {partner.kind}
                  </span>
                </div>
                <h3 className="text-[1.0625rem]/[1.4375rem] font-bold">{partner.name}</h3>
                <p className="text-ink-soft text-sm/5">{partner.summary}</p>
                <ul className="text-ink-soft flex flex-col gap-1 text-sm/5 font-medium">
                  {partner.points.map((point) => (
                    <li key={point} className="flex items-start gap-1.5">
                      <Check aria-hidden="true" className="text-success mt-0.5 h-4 w-4 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-border flex items-center border-t p-4 sm:w-52 sm:shrink-0 sm:border-t-0 sm:border-l sm:p-5">
              <a
                href={href}
                rel="sponsored nofollow noopener"
                target="_blank"
                className="bg-cta text-on-cta hover:bg-cta-hover flex min-h-11 w-full items-center justify-center gap-1.5 rounded-md px-4 text-[0.9375rem] font-extrabold whitespace-nowrap transition-colors"
              >
                Visit {partner.name}
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

