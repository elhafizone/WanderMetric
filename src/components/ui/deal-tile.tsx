import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { MediaImage } from "@/components/ui/media-image";
import type { DealCard } from "@/core/content/types";
import { dealEnds } from "@/lib/format";
import { dealPath } from "@/lib/paths";

const KIND_LABEL: Record<DealCard["kind"], string> = {
  hotel: "Stay",
  flight: "Flight",
  activity: "Things to do",
  tour: "Tour",
  package: "Package",
  other: "Deal",
};

/**
 * A deal on a card: a photograph with an expiry badge, a category, a title, a
 * place, and the discount as the partner states it.
 *
 * The badge is the point. Inside 48 hours it goes to full-weight Ember; after
 * that it is the calm tint with the date. It always carries a clock and words,
 * never colour alone. There is no price line: the discount is the partner's
 * own wording (`discount_label`), because the schema has nowhere to store a
 * price and that is deliberate.
 *
 * The button goes to our own deal page, which holds the partner link, so the
 * commission disclosure is always in front of the reader before they leave.
 */
export function DealTile({ deal }: { deal: DealCard }) {
  const ends = dealEnds(deal.ends_at);

  return (
    <article className="group border-border bg-surface ease-editorial relative flex h-full flex-col overflow-hidden rounded-lg border transition-shadow duration-200 hover:shadow-md">
      <div className="bg-surface-2 relative aspect-[16/10] w-full overflow-hidden">
        <MediaImage
          media={deal.hero}
          label={deal.title}
          imageKeys={[deal.city?.slug]}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 25vw"
        />
        {ends && (
          <div className="absolute top-2.5 left-2.5">
            <Badge tone={ends.urgent ? "solid-ember" : "ember"}>{ends.label}</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-ink-muted text-xs/4 font-extrabold tracking-[0.06em] uppercase">
            {KIND_LABEL[deal.kind]}
          </p>
          <h3 className="text-[1.0625rem]/[1.4375rem] font-bold text-pretty">
            <Link href={dealPath(deal.slug)} className="after:absolute after:inset-0">
              {deal.title}
            </Link>
          </h3>
          {deal.city && <p className="text-ink-muted text-sm/5">{deal.city.name}</p>}
        </div>

        <div className="border-border mt-auto flex items-end justify-between gap-3 border-t pt-3">
          <div className="flex flex-col">
            <span className="text-ink-muted text-xs/4 font-semibold">Discount</span>
            <strong className="text-lg/6 font-extrabold">{deal.discount_label ?? "See offer"}</strong>
          </div>
          <span
            aria-hidden="true"
            className="border-accent text-accent group-hover:bg-accent-soft flex min-h-11 items-center gap-1.5 rounded-md border-[1.5px] px-3.5 text-sm font-extrabold whitespace-nowrap transition-colors"
          >
            View deal
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
