import {
  Backpack,
  Building2,
  CalendarClock,
  CalendarX2,
  CheckCircle2,
  Clock,
  Info,
  Languages,
  ListChecks,
  MapPin,
  ShieldCheck,
  Tag,
  Ticket,
  TicketCheck,
  TriangleAlert,
  UserCheck,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { AffiliateLink } from "@/components/affiliate/affiliate-link";
import {
  factRows,
  factsCaution,
  formatReadOn,
  offerOptions,
} from "@/core/content/offer-facts";
import type { OfferDetail } from "@/core/offers/offers";
import { offerPath } from "@/core/sections/sections";

/**
 * Sidebar for an offer guide: the facts read from the partner listing, the
 * and the booking button.
 *
 * Everything shown is something the listing stated. Facts are stacked (label over
 * value) because several of them are sentences, such as a meeting point or a
 * cancellation rule, and do not fit a two-column row.
 */
export function OfferGuidePanel({ item }: { item: OfferDetail }) {
  if (!item.link) return null;

  const rows = factRows(item.facts);
  const options = offerOptions(item.facts);
  const caution = factsCaution(item.facts);
  const readOn = formatReadOn(item.facts_read_on);

  const provider = providerLabel(item.link.slug);

  return (
    <>
      <div className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="bg-cta/10 text-cta grid size-10 shrink-0 place-items-center rounded-full">
            <ShieldCheck aria-hidden className="size-5" />
          </span>
          <p className="text-sm/[1.4] font-semibold">
            Booked on {provider}
            <span className="text-ink-muted block font-normal">
              You pay the partner, not us.
            </span>
          </p>
        </div>
        {item.price_note && (
          <p className="text-ink-soft flex gap-2.5 text-sm/[1.55]">
            <Tag aria-hidden className="text-ink-muted mt-0.5 size-4 shrink-0" />
            {item.price_note}
          </p>
        )}
        <AffiliateLink
          linkSlug={item.link.slug}
          contentType="offer"
          contentId={item.id}
          fromPath={offerPath(item.section, item.country.slug, item.slug)}
          emphasis="high"
          className="group/out ease-editorial bg-cta text-on-cta hover:bg-cta-hover inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 py-3 text-[0.9375rem] font-bold whitespace-nowrap shadow-sm transition-all duration-200 hover:shadow-md"
        >
          Check availability on {provider}
        </AffiliateLink>
        {readOn && (
          <p className="text-ink-muted text-xs/[1.5]">
            Facts read from the partner listing on {readOn}. Details and prices change; confirm
            on the booking page.
          </p>
        )}
      </div>

      {caution && (
        <div className="bg-warning-soft flex gap-3 rounded-xl p-4 text-sm/[1.6]">
          <TriangleAlert aria-hidden className="text-warning mt-0.5 size-5 shrink-0" />
          <p className="text-ink-soft">
            <strong className="text-ink font-semibold">Check before you book.</strong> {caution}
          </p>
        </div>
      )}

      <section aria-labelledby="key-details" className="flex flex-col gap-3">
        <h2 id="key-details" className="flex items-center gap-2 text-base font-semibold">
          <ListChecks aria-hidden className="text-accent size-5" />
          Key details
        </h2>
        <ul className="grid gap-2.5">
          {rows.map((row) => {
            const { Icon, tone } = rowIcon(row.key);
            return (
              <li
                key={row.key}
                className="border-border bg-surface flex items-start gap-3 rounded-xl border p-3.5"
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg ${tone}`}
                >
                  <Icon aria-hidden className="size-[1.125rem]" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-ink-muted text-xs font-medium">{row.label}</span>
                  <span className="text-[0.9375rem]/[1.45] font-semibold [overflow-wrap:anywhere]">
                    {row.value}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {options.length === 1 && (
        <div className="border-border bg-surface rounded-xl border p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Ticket aria-hidden className="text-accent size-5" />
            Options on the listing
          </h2>
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

const GREEN = "bg-success-soft text-success";
const TEAL = "bg-accent-soft text-accent";
const SAND = "bg-ember-soft text-ember";

/** An icon and a tint for each kind of fact; anything unrecognised gets a plain info mark. */
function rowIcon(key: string): { Icon: LucideIcon; tone: string } {
  switch (key) {
    case "duration":
    case "duration_minutes":
    case "suggested_duration":
    case "duration_note":
    case "time_at_site":
      return { Icon: Clock, tone: TEAL };
    case "guide_language":
      return { Icon: Languages, tone: TEAL };
    case "group_size":
      return { Icon: Users, tone: TEAL };
    case "departs_from":
    case "meeting_point":
    case "pick_up":
    case "drop_off":
    case "location":
    case "venue":
      return { Icon: MapPin, tone: SAND };
    case "schedule":
    case "departures":
    case "opening_hours":
    case "date_selection":
    case "arrive_before_minutes":
      return { Icon: CalendarClock, tone: SAND };
    case "included":
    case "included_listed":
      return { Icon: CheckCircle2, tone: GREEN };
    case "not_included":
      return { Icon: XCircle, tone: "bg-error-soft text-error" };
    case "cancellation":
    case "late_policy":
      return { Icon: CalendarX2, tone: GREEN };
    case "voucher":
    case "validity":
    case "confirmation":
      return { Icon: TicketCheck, tone: TEAL };
    case "ticket_tiers_in_checkout":
      return { Icon: Ticket, tone: TEAL };
    case "operator":
    case "provider":
    case "sold_by":
      return { Icon: Building2, tone: SAND };
    case "eligibility":
      return { Icon: UserCheck, tone: TEAL };
    case "physical_note":
    case "checkout_requirement":
      return { Icon: Backpack, tone: SAND };
    default:
      return { Icon: Info, tone: TEAL };
  }
}
