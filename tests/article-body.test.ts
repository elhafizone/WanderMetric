import { describe, expect, it } from "vitest";

import {
  inlineText,
  parseArticleBody,
  parseInline,
  safeHref,
  segmentIntoParagraphs,
  slugifyHeading,
  splitSentences,
  type Block,
} from "@/lib/article/body";

/**
 * The article body parser.
 *
 * Two properties matter more than anything else here and are pinned first:
 *
 *   * **No words are invented or lost.** Sentence regrouping is a typographic
 *     operation. If the concatenation of the output ever stops matching the
 *     input, the site is silently rewriting editorial copy, which is the single
 *     worst failure this codebase can have.
 *   * **No href becomes a live control unless it is safe.** The body column is
 *     editor-supplied, so the scheme allow-list is a security boundary, not a
 *     tidiness rule.
 */

const PARIS =
  "The single biggest improvement you can make to a short Paris trip is booking timed entry for anything major before you leave home. The Louvre, the Musee d Orsay, Sainte-Chapelle and the Eiffel Tower all release slots online, and the difference between a booked slot and the walk-up queue is now measured in hours rather than minutes. Day one: start at the Louvre for the first slot of the morning, when the Denon wing is briefly quiet, then walk east along the Seine to the Ile de la Cite. Day two: the Musee d Orsay early, then cross to the Left Bank for the Luxembourg Gardens. Day three: keep it unstructured. Montmartre before nine is a genuinely different place from Montmartre at noon.";

function textOf(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.kind) {
        case "heading":
          return block.text;
        case "list":
          return block.items.map(inlineText).join(" ");
        default:
          return inlineText(block.content);
      }
    })
    .join(" ");
}

describe("sentence regrouping", () => {
  it("preserves every word of an unstructured body", () => {
    const parsed = parseArticleBody(PARIS);
    expect(textOf(parsed.blocks)).toBe(PARIS);
  });

  it("breaks a single long run into several paragraphs", () => {
    const parsed = parseArticleBody(PARIS);
    expect(parsed.segmented).toBe(true);
    expect(parsed.blocks.length).toBeGreaterThan(2);
    expect(parsed.blocks.every((block) => block.kind === "paragraph")).toBe(true);
  });

  it("starts a paragraph where the writer used a label and a colon", () => {
    const paragraphs = segmentIntoParagraphs(PARIS);
    expect(paragraphs.some((p) => p.startsWith("Day one:"))).toBe(true);
    expect(paragraphs.some((p) => p.startsWith("Day two:"))).toBe(true);
    expect(paragraphs.some((p) => p.startsWith("Day three:"))).toBe(true);
  });

  it("never invents a heading from prose", () => {
    const parsed = parseArticleBody(PARIS);
    expect(parsed.headings).toEqual([]);
  });

  it("leaves authored paragraphs exactly as written", () => {
    const authored = "First paragraph.\n\nSecond paragraph, which is short.";
    const parsed = parseArticleBody(authored);
    expect(parsed.segmented).toBe(false);
    expect(parsed.blocks).toHaveLength(2);
    expect(textOf(parsed.blocks)).toBe(
      "First paragraph. Second paragraph, which is short.",
    );
  });

  it("does not regroup a body that already carries markers", () => {
    const marked = "## Heading";
    expect(parseArticleBody(marked).segmented).toBe(false);
  });

  it("does not split inside an abbreviation", () => {
    const text = "Book ahead, e.g. Sainte-Chapelle. Then walk east along the river.";
    expect(splitSentences(text)).toEqual([
      "Book ahead, e.g. Sainte-Chapelle.",
      "Then walk east along the river.",
    ]);
  });

  it("leaves a short body alone", () => {
    const short = "One sentence. Then a second.";
    expect(segmentIntoParagraphs(short)).toEqual([short]);
  });

  it("absorbs an orphan trailing fragment", () => {
    const text = `${"Sentences of a reasonable working length that carry the paragraph past the target. ".repeat(4)}A coda.`;
    const paragraphs = segmentIntoParagraphs(text);
    const last = paragraphs.at(-1) ?? "";
    expect(last).toMatch(/A coda\.$/);
    expect(last.length).toBeGreaterThan(130);
  });
});

describe("authored structure", () => {
  it("promotes headings and collects them for the table of contents", () => {
    const parsed = parseArticleBody(
      "## Day one\n\nStart early.\n\n### The Louvre\n\nGo at opening.",
    );
    expect(parsed.headings).toEqual([
      { id: "day-one", text: "Day one", level: 2 },
      { id: "the-louvre", text: "The Louvre", level: 3 },
    ]);
  });

  it("de-duplicates repeated heading anchors", () => {
    const parsed = parseArticleBody("## Notes\n\nOne.\n\n## Notes\n\nTwo.");
    expect(parsed.headings.map((h) => h.id)).toEqual(["notes", "notes-2"]);
  });

  it("reads quotes, lists and callouts", () => {
    const parsed = parseArticleBody(
      "> Walk ten minutes away from any major sight.\n\n- Cacio e pepe\n- Carbonara\n\n!> Booking: reserve a seat when travelling with luggage.",
    );
    expect(parsed.blocks.map((b) => b.kind)).toEqual(["quote", "list", "note"]);
    const note = parsed.blocks[2];
    expect(note?.kind === "note" && note.label).toBe("Booking");
  });

  it("labels an unlabelled callout with the house wording", () => {
    const parsed = parseArticleBody("!> Most museums close on Monday or Tuesday.");
    const note = parsed.blocks[0];
    expect(note?.kind === "note" && note.label).toBe("Good to know");
  });

  it("reads a numbered list as ordered", () => {
    const parsed = parseArticleBody("1. Book ahead\n2. Arrive early");
    const list = parsed.blocks[0];
    expect(list?.kind === "list" && list.ordered).toBe(true);
  });

  it("returns nothing for an absent or blank body", () => {
    expect(parseArticleBody(null).blocks).toEqual([]);
    expect(parseArticleBody("   \n  ").blocks).toEqual([]);
  });
});

describe("inline formatting", () => {
  it("reads links, bold and italic", () => {
    const nodes = parseInline(
      "See the [Louvre](/activities/paris/the-louvre) **early**.",
    );
    expect(nodes).toEqual([
      { kind: "text", value: "See the " },
      {
        kind: "link",
        href: "/activities/paris/the-louvre",
        children: [{ kind: "text", value: "Louvre" }],
      },
      { kind: "text", value: " " },
      { kind: "strong", children: [{ kind: "text", value: "early" }] },
      { kind: "text", value: "." },
    ]);
  });

  it("keeps the words of a rejected link but drops the link", () => {
    const nodes = parseInline("Try [this](javascript:alert) instead.");
    expect(nodes.some((node) => node.kind === "link")).toBe(false);
    expect(inlineText(nodes)).toBe("Try this instead.");
  });

  it("refuses a hostile href however it is punctuated", () => {
    for (const source of [
      "[x](javascript:alert(1))",
      "[x](data:text/html,<script>)",
      "[x](//evil.example.com)",
    ]) {
      expect(parseInline(source).some((node) => node.kind === "link")).toBe(false);
    }
  });
});

describe("safeHref", () => {
  it("accepts site paths, anchors, https and mailto", () => {
    expect(safeHref("/guides/three-days-in-paris")).toBe("/guides/three-days-in-paris");
    expect(safeHref("#day-one")).toBe("#day-one");
    expect(safeHref("https://example.com/x")).toBe("https://example.com/x");
    expect(safeHref("mailto:hello@wandermetric.com")).toBe(
      "mailto:hello@wandermetric.com",
    );
  });

  it("rejects every scheme that could execute or exfiltrate", () => {
    for (const href of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "data:text/html;base64,PHN2Zz4=",
      "//evil.example.com",
      "http://example.com",
      "vbscript:msgbox(1)",
      "",
      "   ",
    ]) {
      expect(safeHref(href)).toBeNull();
    }
  });
});

describe("slugifyHeading", () => {
  it("produces stable, URL-safe anchors", () => {
    expect(slugifyHeading("Day One — Start Early")).toBe("day-one-start-early");
    expect(slugifyHeading("Musée d'Orsay")).toBe("musee-d-orsay");
    expect(slugifyHeading("…")).toBe("section");
  });
});
