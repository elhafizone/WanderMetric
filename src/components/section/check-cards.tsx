import {
  Banknote,
  Camera,
  CreditCard,
  Fuel,
  IdCard,
  Info,
  MapPinned,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

/**
 * A section's "check before you book" list as icon cards.
 *
 * Items in `sections.ts` read "Label: advice". The label becomes the card's
 * title and the advice its body; an item without a short label becomes a card
 * with a body only. The icon is chosen from the label's words.
 */
function iconFor(label: string): LucideIcon {
  const text = label.toLowerCase();
  if (/licen|permit|passport|id\b/.test(text)) return IdCard;
  if (/deposit/.test(text)) return CreditCard;
  if (/excess|insur|cover/.test(text)) return ShieldAlert;
  if (/fuel/.test(text)) return Fuel;
  if (/border|route|cross/.test(text)) return MapPinned;
  if (/photo|check|inspect/.test(text)) return Camera;
  if (/price|fee|cost|pay/.test(text)) return Banknote;
  return Info;
}

function split(item: string): { label: string | null; body: string } {
  const match = item.match(/^([^:]{2,28}):\s+(.+)$/s);
  if (match?.[1] && match[2]) {
    return { label: match[1], body: match[2].charAt(0).toUpperCase() + match[2].slice(1) };
  }
  const photo = item.match(/^(Photograph)\b/i);
  if (photo) return { label: "Photograph the car", body: item };
  return { label: null, body: item };
}

export function CheckCards({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <section aria-labelledby="check-before" className="flex flex-col gap-5">
      <h2 id="check-before" className="display text-[1.5rem]/[1.75rem] sm:text-[2rem]/[2.25rem]">
        {title}
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const { label, body } = split(item);
          const Icon = iconFor(label ?? item);
          return (
            <li
              key={item}
              className="border-border bg-surface flex gap-4 rounded-2xl border p-5"
            >
              <span className="bg-ember-soft text-ember grid size-11 shrink-0 place-items-center rounded-xl">
                <Icon aria-hidden className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                {label && <h3 className="text-base/[1.4rem] font-bold">{label}</h3>}
                <p className="text-ink-soft text-[0.9375rem]/[1.55]">{body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
