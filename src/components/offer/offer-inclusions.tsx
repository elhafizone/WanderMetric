import { Check, X } from "lucide-react";

import type { OfferInclusions } from "@/core/content/offer-facts";

/**
 * What the listing says is covered and what is not, side by side. It appears
 * only when the listing states at least one of the two, and the "not included"
 * column only when the listing names something there.
 */
export function OfferInclusionsBlock({ data }: { data: OfferInclusions }) {
  const columns = [
    {
      title: "Included",
      items: data.included,
      Icon: Check,
      tone: "bg-success-soft text-success",
    },
    {
      title: "Not included",
      items: data.notIncluded,
      Icon: X,
      tone: "bg-error-soft text-error",
    },
  ].filter((column) => column.items.length > 0);

  return (
    <div className={`grid gap-4 ${columns.length > 1 ? "sm:grid-cols-2" : ""}`}>
      {columns.map(({ title, items, Icon, tone }) => (
        <section key={title} className="border-border bg-surface rounded-2xl border p-5">
          <h2 className="mb-3 text-base font-semibold">{title}</h2>
          <ul className="flex flex-col gap-2.5">
            {items.map((item) => (
              <li key={item} className="flex gap-3 text-[0.9375rem]/[1.5]">
                <span
                  className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${tone}`}
                >
                  <Icon aria-hidden className="size-3.5" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
