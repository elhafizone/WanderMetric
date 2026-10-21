import {
  Backpack,
  BadgeEuro,
  Baby,
  CalendarClock,
  CheckCircle2,
  Clock,
  Info,
  PawPrint,
  PencilLine,
  ReceiptText,
  Scale,
  ShieldAlert,
  TicketCheck,
  type LucideIcon,
} from "lucide-react";

import { AffiliateLink } from "@/components/affiliate/affiliate-link";
import type { FlightHelpGroup, FlightHelpIcon, FlightHelpItem } from "@/core/content/flight-help";
import { formatReadOn } from "@/core/content/offer-facts";

const ICONS: Record<FlightHelpIcon, LucideIcon> = {
  info: Info,
  baggage: Backpack,
  clock: Clock,
  checkin: TicketCheck,
  child: Baby,
  pet: PawPrint,
  refund: ReceiptText,
  edit: PencilLine,
  shield: ShieldAlert,
  scale: Scale,
  fee: BadgeEuro,
};

const GROUPS: Array<{ key: FlightHelpGroup; title: string; description: string; tone: string }> = [
  {
    key: "before",
    title: "Before you fly",
    description: "Baggage, check-in, children, pets and changes, summarised from Aviasales' help pages.",
    tone: "bg-accent-soft text-accent",
  },
  {
    key: "wrong",
    title: "If a flight goes wrong",
    description: "Delays, cancellations and refunds: what the claims services say you may be owed.",
    tone: "bg-warning-soft text-warning",
  },
];

/**
 * Each card summarises one page of a partner's own website in our words and
 * links to that exact page through /go/{slug}. A card is shown only when its
 * affiliate link is live, so a missing link never leaves a dead button.
 */
export function FlightHelpGrid({
  items,
  liveSlugs,
}: {
  items: FlightHelpItem[];
  liveSlugs: Set<string>;
}) {
  const visible = items.filter((item) => liveSlugs.has(item.linkSlug));
  if (visible.length === 0) return null;
  const readOn = formatReadOn(visible[0]?.readOn);

  return (
    <div className="flex flex-col gap-14">
      {GROUPS.map((group) => {
        const cards = visible.filter((item) => item.group === group.key);
        if (cards.length === 0) return null;
        return (
          <section key={group.key} aria-labelledby={`help-${group.key}`} className="flex flex-col gap-5">
            <div className="max-w-2xl">
              <h2
                id={`help-${group.key}`}
                className="display text-[1.5rem]/[1.75rem] sm:text-[2rem]/[2.25rem]"
              >
                {group.title}
              </h2>
              <p className="text-ink-soft mt-2 text-base/[1.625rem]">{group.description}</p>
            </div>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cards.map((item) => {
                const Icon = ICONS[item.icon];
                return (
                  <li key={item.linkSlug}>
                    <article className="border-border bg-surface hover:border-border-strong flex h-full flex-col gap-4 rounded-2xl border p-5 transition-colors">
                      <div className="flex items-start gap-3">
                        <span
                          className={`grid size-11 shrink-0 place-items-center rounded-xl ${group.tone}`}
                        >
                          <Icon aria-hidden className="size-5" />
                        </span>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <h3 className="display-sm text-[1.0625rem]/[1.4rem] text-pretty">
                            {item.title}
                          </h3>
                          <span className="text-ink-muted text-xs font-semibold">{item.partner}</span>
                        </div>
                      </div>
                      <p className="text-ink-soft text-[0.9375rem]/[1.55]">{item.summary}</p>
                      <ul className="flex flex-col gap-2">
                        {item.points.map((point) => (
                          <li key={point} className="flex gap-2.5 text-[0.875rem]/[1.5]">
                            <CheckCircle2
                              aria-hidden
                              className="text-success mt-0.5 size-4 shrink-0"
                            />
                            {point}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto pt-1">
                        <AffiliateLink
                          linkSlug={item.linkSlug}
                          campaign="flights-help"
                          fromPath="/flights"
                          className="group/out border-border-strong hover:border-ink hover:bg-surface-2 inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition-colors"
                        >
                          Read it on {item.partner}
                        </AffiliateLink>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <p className="text-ink-muted flex items-start gap-2 text-sm/[1.55]">
        <CalendarClock aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>
          Summarised from each partner&rsquo;s own pages{readOn ? `, read on ${readOn}` : ""}. Rules
          and fees change, so confirm on the partner&rsquo;s page before you rely on them.
        </span>
      </p>
    </div>
  );
}
