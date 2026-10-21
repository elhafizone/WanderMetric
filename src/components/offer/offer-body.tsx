import {
  Backpack,
  CalendarX2,
  CheckCircle2,
  Clock,
  Info,
  Lightbulb,
  TicketCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { inline, parseBlocks, type Block } from "@/components/ui/prose";

/** Picks an icon from the words of a section heading. Falls back to a plain info mark. */
function iconFor(heading: string): LucideIcon {
  const text = heading.toLowerCase();
  if (/cancel|chang|refund|flexib/.test(text)) return CalendarX2;
  if (/includ|cover|pay|price/.test(text)) return CheckCircle2;
  if (/group|who|suit|right for/.test(text)) return Users;
  if (/tip|practical|bring|before you go|prepare/.test(text)) return Lightbulb;
  if (/ticket|tier|option|choose|decision/.test(text)) return TicketCheck;
  if (/day|hour|time|shape|schedule|opening|how long/.test(text)) return Clock;
  if (/pack|carry/.test(text)) return Backpack;
  return Info;
}

interface Section {
  heading: string | null;
  blocks: Block[];
}

function toSections(blocks: Block[]): Section[] {
  const sections: Section[] = [];
  for (const block of blocks) {
    if (block.kind === "heading") {
      sections.push({ heading: block.text, blocks: [] });
      continue;
    }
    const current = sections[sections.length - 1];
    if (current) current.blocks.push(block);
    else sections.push({ heading: null, blocks: [block] });
  }
  return sections;
}

/**
 * The written guide, split at its headings into separate sections. Each section
 * has an icon chosen from its title, lists get check marks, and the opening
 * section is set larger because it says what the offer is.
 *
 * Rendering is built from React elements only, as in `Prose`, so stored text can
 * never inject markup.
 */
export function OfferBody({ text }: { text: string | null }) {
  if (!text) return null;
  const sections = toSections(parseBlocks(text));
  if (sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-10">
      {sections.map((section, sectionIndex) => {
        const Icon = section.heading ? iconFor(section.heading) : Info;
        const isIntro = sectionIndex === 0;
        return (
          <section key={sectionIndex} className="flex max-w-[68ch] flex-col gap-4">
            {section.heading && (
              <h2 className="display-sm flex items-center gap-3.5 text-[1.75rem]/[1.12] sm:text-[2.125rem]">
                <span className="bg-accent-soft text-accent grid size-10 shrink-0 place-items-center rounded-full">
                  <Icon aria-hidden className="size-5" />
                </span>
                {inline(section.heading)}
              </h2>
            )}
            {section.blocks.map((block, blockIndex) => {
              if (block.kind === "list") {
                return (
                  <ul key={blockIndex} className="flex flex-col gap-2.5 text-[1.0625rem]/[1.65]">
                    {block.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex gap-3">
                        <CheckCircle2
                          aria-hidden
                          className="text-success mt-[0.2rem] size-5 shrink-0"
                        />
                        <span>{inline(item)}</span>
                      </li>
                    ))}
                  </ul>
                );
              }
              if (block.kind === "paragraph") {
                return (
                  <p
                    key={blockIndex}
                    className={
                      isIntro && blockIndex === 0
                        ? "text-ink-soft text-[1.1875rem]/[1.65]"
                        : "text-[1.0625rem]/[1.75]"
                    }
                  >
                    {inline(block.text)}
                  </p>
                );
              }
              return null;
            })}
          </section>
        );
      })}
    </div>
  );
}
