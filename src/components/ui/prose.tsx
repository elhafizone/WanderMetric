import type { ReactNode } from "react";

/**
 * Renders stored body copy.
 *
 * Body text is plain text with a deliberately tiny Markdown subset: `## `
 * headings, `- ` bullet lists and `**bold**`. Everything is turned into React
 * elements, never into an HTML string, so React still escapes every character
 * and there is no `dangerouslySetInnerHTML` anywhere in the page body:
 * stored-XSS through the editor stays structurally impossible. Anything outside
 * the subset renders as the plain paragraph it is. If richer formatting is
 * needed later it should arrive as a sanitised allow-list, not as raw HTML.
 *
 * Typographically this is the one place on the site tuned for sustained
 * reading rather than scanning: 18px on a 1.75 leading, a measure capped near
 * 68 characters, and a larger opening paragraph so an article starts the way a
 * magazine article starts.
 */

export type Block =
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "paragraph"; text: string };

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.split(/\n{2,}/)) {
    const chunk = raw.trim();
    if (!chunk) continue;

    const lines = chunk.split("\n").map((line) => line.trim());
    // A heading line may sit directly above its paragraph without a blank line.
    let rest = lines;
    while (rest.length > 0 && /^#{2,3}\s+/.test(rest[0] ?? "")) {
      blocks.push({ kind: "heading", text: (rest[0] ?? "").replace(/^#{2,3}\s+/, "") });
      rest = rest.slice(1);
    }
    if (rest.length === 0) continue;

    if (rest.every((line) => /^[-*]\s+/.test(line))) {
      blocks.push({ kind: "list", items: rest.map((line) => line.replace(/^[-*]\s+/, "")) });
    } else {
      blocks.push({ kind: "paragraph", text: rest.join(" ") });
    }
  }
  return blocks;
}

/** `**bold**` becomes <strong>; every other character is left to React to escape. */
export function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={index} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

export function Prose({
  text,
  className,
  lead = true,
}: {
  text: string | null;
  className?: string;
  /** Set the first paragraph as a standfirst. Off for short summaries. */
  lead?: boolean;
}) {
  if (!text) return null;

  const blocks = parseBlocks(text);
  if (blocks.length === 0) return null;

  const firstParagraph = blocks.findIndex((block) => block.kind === "paragraph");

  return (
    <div className={`text-ink flex max-w-[68ch] flex-col gap-6 ${className ?? ""}`}>
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          return (
            <h2
              key={index}
              className="text-ink mt-4 text-[1.5rem]/[1.3] font-semibold tracking-tight first:mt-0"
            >
              {inline(block.text)}
            </h2>
          );
        }
        if (block.kind === "list") {
          return (
            <ul
              key={index}
              className="marker:text-ink-soft flex list-disc flex-col gap-2 pl-6 text-[1.0625rem]/[1.75]"
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{inline(item)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p
            key={index}
            className={
              lead && index === firstParagraph
                ? "text-ink-soft text-[1.25rem]/[1.6]"
                : "text-[1.0625rem]/[1.75]"
            }
          >
            {inline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
