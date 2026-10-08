import { Ticket } from "lucide-react";

import type { OfferOption } from "@/core/content/offer-facts";

/**
 * The listing's own options as comparison cards. Shown in the main column,
 * because choosing between them is the decision the reader came to make.
 */
export function OfferOptionCards({ options }: { options: OfferOption[] }) {
  if (options.length < 2) return null;

  return (
    <section aria-labelledby="options-heading" className="flex flex-col gap-4">
      <h2 id="options-heading" className="flex items-center gap-3 text-[1.5rem]/[1.3] font-semibold tracking-tight">
        <span className="bg-accent-soft text-accent grid size-10 shrink-0 place-items-center rounded-full">
          <Ticket aria-hidden className="size-5" />
        </span>
        Options on the listing
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <li
            key={option.name}
            className="border-border bg-surface flex flex-col gap-1.5 rounded-2xl border p-4"
          >
            <span className="text-base/[1.4] font-semibold">{option.name}</span>
            {option.detail && <span className="text-ink-muted text-sm/[1.55]">{option.detail}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
