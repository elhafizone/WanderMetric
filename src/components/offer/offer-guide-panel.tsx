import { AffiliateLink } from "@/components/affiliate/affiliate-link";
import {
  factRows,
  factsCaution,
  formatReadOn,
  offerOptions,
} from "@/core/content/offer-facts";
import type { ActivityDetail } from "@/core/content/types";
import { activityPath } from "@/lib/paths";

/**
 * Sidebar for an offer guide: the facts read from the partner listing, the
 * booking button, and the one-line disclosure beside it.
 *
 * Everything shown is something the listing stated. Facts are stacked (label over
 * value) because several of them are sentences, such as a meeting point or a
 * cancellation rule, and do not fit a two-column row.
 */
export function OfferGuidePanel({ item }: { item: ActivityDetail }) {
  if (!item.link) return null;

  const rows = factRows(item.facts);
  const options = offerOptions(item.facts);
  const caution = factsCaution(item.facts);
  const readOn = formatReadOn(item.facts_read_on);

  return (
    <>
      <div className="border-border bg-surface rounded-lg border p-5">
        <h2 className="eyebrow text-ink-muted mb-3">At a glance</h2>
        <dl className="divide-border flex flex-col divide-y text-[0.9375rem]">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0">
              <dt className="text-ink-muted text-sm">{row.label}</dt>
              <dd className="font-semibold [overflow-wrap:anywhere]">{row.value}</dd>
            </div>
          ))}
        </dl>
        {item.price_note && (
          <p className="border-border text-ink-soft mt-4 border-t border-dashed pt-3 text-sm/[1.55]">
            {item.price_note}
          </p>
        )}
      </div>

      {options.length > 0 && (
        <div className="border-border bg-surface rounded-lg border p-5">
          <h2 className="eyebrow text-ink-muted mb-3">Options on the listing</h2>
          <ul className="divide-border flex flex-col divide-y text-[0.9375rem]">
            {options.map((option) => (
              <li key={option.name} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0">
                <span className="font-semibold">{option.name}</span>
                {option.detail && <span className="text-ink-muted text-sm">{option.detail}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {caution && (
        <p className="border-border-strong text-ink-soft border-l-2 py-1 pl-4 text-sm/[1.6]">
          <strong className="text-ink font-semibold">Check before you book.</strong> {caution}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <AffiliateLink
          linkSlug={item.link.slug}
          contentType="activity"
          contentId={item.id}
          fromPath={activityPath(item)}
          emphasis="high"
          className="group/out ease-editorial bg-cta text-on-cta hover:bg-cta-hover inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-extrabold shadow-sm transition-all duration-200 hover:shadow-md"
        >
          Check availability on {providerLabel(item.link.slug)}
        </AffiliateLink>
        {readOn && (
          <p className="text-ink-muted text-xs/[1.5]">
            Facts read from the partner listing on {readOn}. Details and prices change; confirm
            on the booking page.
          </p>
        )}
      </div>
    </>
  );
}

/** The button names the partner. Link slugs for offer guides start with the programme. */
function providerLabel(linkSlug: string): string {
  const programme = linkSlug.split("-")[0] ?? "";
  const known: Record<string, string> = {
    klook: "Klook",
    kkday: "KKday",
    tiqets: "Tiqets",
    go: "Go City",
    wegotrip: "WeGoTrip",
    welcome: "Welcome Pickups",
    kiwitaxi: "Kiwitaxi",
    gettransfer: "GetTransfer",
    intui: "Intui Travel",
  };
  return known[programme] ?? "the partner";
}
