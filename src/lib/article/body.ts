/**
 * Turns a stored body string into an editorial block structure.
 *
 * ## Why this exists
 *
 * `guides.body` is a single `text` column of **plain text** — not HTML, not
 * markdown — and `<Prose>` renders it by splitting on blank lines. Every guide
 * currently in the database is one unbroken run of prose with no blank line
 * anywhere, so the article page rendered each one as a single
 * 1,200-character paragraph. That is the actual reason the page read as a blog
 * detail view rather than a magazine article: there was no structure on screen
 * because there was none in the string.
 *
 * ## What this module is allowed to do
 *
 * Two things, and deliberately nothing else.
 *
 * 1. **Read structure the writer actually wrote.** A small plain-text
 *    convention — `##`/`###` for headings, `>` for a pull quote, `-` or `1.`
 *    for a list, `!>` for a practical-note callout, `[text](url)` for a link,
 *    `**bold**` and `*italic*` — is promoted to real elements. No stored guide
 *    uses any of it today, so it changes nothing on screen now; it is the path
 *    by which an editor gets headings, a table of contents and a pull quote
 *    without a schema migration or a change to the API contract.
 *
 * 2. **Regroup sentences into paragraphs when the writer wrote none.** This is
 *    the one inference in the file and it is tightly bounded: it runs only when
 *    the body contains no blank line and no marker anywhere, it never adds,
 *    removes, reorders or rewords a single character, and it can only insert a
 *    break at a boundary the writer's own full stop already created. Grouping
 *    sentences into paragraphs is a typographic decision, of the same kind as
 *    line length. It is not an editorial one.
 *
 * ## What it must never do
 *
 * Invent a heading, a section, a quote or a fact. Promoting `Day one — start
 * early` to an `<h2>` out of the sentence "Day one: start at the Louvre…" would
 * mean lifting words from the writer's sentence and presenting them as an
 * editor's section title, which is the fabrication rule 2 of CLAUDE.md
 * forbids. So a label-and-colon opening earns a *paragraph break* and nothing
 * more: the reader sees the rhythm the writer implied, and every word stays in
 * the sentence it was written in.
 *
 * ## Security
 *
 * The output is a data structure of plain strings, rendered through React
 * elements. There is no HTML string in this module and no
 * `dangerouslySetInnerHTML` at any call site, so the stored-XSS property of the
 * original `<Prose>` is preserved exactly. Link hrefs are additionally checked
 * against a scheme allow-list and degrade to plain text when they fail.
 */

export type Inline =
  | { kind: "text"; value: string }
  | { kind: "strong"; children: Inline[] }
  | { kind: "emphasis"; children: Inline[] }
  | { kind: "link"; href: string; children: Inline[] };

export type Block =
  | { kind: "heading"; level: 2 | 3; id: string; text: string }
  | { kind: "paragraph"; content: Inline[] }
  | { kind: "quote"; content: Inline[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
  | { kind: "note"; label: string; content: Inline[] };

export interface ArticleHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface ParsedArticle {
  blocks: Block[];
  /** Flat list for the table of contents. Empty when the body has no headings. */
  headings: ArticleHeading[];
  /**
   * True when paragraph breaks were derived from sentence boundaries rather
   * than authored. Exposed so a caller can reason about it; nothing in the
   * rendered page depends on the flag.
   */
  segmented: boolean;
}

const EMPTY: ParsedArticle = { blocks: [], headings: [], segmented: false };

/**
 * Lines that carry structural meaning. Used both to parse and to decide whether
 * a body is unstructured enough for sentence regrouping to be allowed near it.
 */
const MARKER = /^\s*(#{2,3}\s|>\s|!>\s|[-*]\s|\d+[.)]\s)/;

export function parseArticleBody(text: string | null | undefined): ParsedArticle {
  if (!text) return EMPTY;

  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return EMPTY;

  const authored = normalized
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  if (authored.length === 0) return EMPTY;

  // A body with no blank line and no marker is a single undifferentiated run of
  // prose. That is the only shape sentence regrouping may touch.
  const unstructured =
    authored.length === 1 && !normalized.includes("\n") && !MARKER.test(normalized);

  const chunks = unstructured ? segmentIntoParagraphs(normalized) : authored;
  const blocks: Block[] = [];
  const headings: ArticleHeading[] = [];
  const usedIds = new Set<string>();

  for (const chunk of chunks) {
    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const first = lines[0];
    if (first === undefined) continue;

    const heading = /^(#{2,3})\s+(.*)$/.exec(first);
    if (heading && lines.length === 1) {
      const label = (heading[2] ?? "").trim();
      if (!label) continue;
      const level = (heading[1] ?? "").length === 2 ? 2 : 3;
      const id = uniqueSlug(label, usedIds);
      blocks.push({ kind: "heading", level, id, text: label });
      headings.push({ id, text: label, level });
      continue;
    }

    if (lines.every((line) => line.startsWith("> "))) {
      const quoted = lines.map((line) => line.slice(2).trim()).join(" ");
      if (quoted) blocks.push({ kind: "quote", content: parseInline(quoted) });
      continue;
    }

    if (lines.length === 1 && first.startsWith("!> ")) {
      const { label, body } = splitNote(first.slice(3).trim());
      if (body) blocks.push({ kind: "note", label, content: parseInline(body) });
      continue;
    }

    const bulleted = lines.every((line) => /^[-*]\s+\S/.test(line));
    const numbered = lines.every((line) => /^\d+[.)]\s+\S/.test(line));
    if (bulleted || numbered) {
      const items = lines
        .map((line) => line.replace(/^([-*]|\d+[.)])\s+/, "").trim())
        .filter(Boolean)
        .map(parseInline);
      if (items.length > 0) blocks.push({ kind: "list", ordered: numbered, items });
      continue;
    }

    blocks.push({ kind: "paragraph", content: parseInline(lines.join(" ")) });
  }

  return { blocks, headings, segmented: unstructured && blocks.length > 1 };
}

/**
 * A `!>` callout may name itself — `!> Booking: reserve seats in advance` —
 * otherwise it carries the house label. The colon form is honoured only for a
 * short leading label, so an ordinary sentence containing a colon is not
 * silently decapitated.
 */
function splitNote(text: string): { label: string; body: string } {
  const labelled = /^([A-Za-z][A-Za-z '&-]{1,28}):\s+(.+)$/.exec(text);
  if (labelled) {
    return { label: (labelled[1] ?? "").trim(), body: (labelled[2] ?? "").trim() };
  }
  return { label: "Good to know", body: text };
}

// ---------------------------------------------------------------------------
// Sentence regrouping
// ---------------------------------------------------------------------------

/**
 * Abbreviations whose full stop does not end a sentence.
 *
 * Breaking after one would put a paragraph boundary mid-sentence. It would not
 * alter a word, but it would look like a mistake, which is reason enough.
 */
const ABBREVIATIONS = new Set([
  "e.g.",
  "i.e.",
  "etc.",
  "vs.",
  "approx.",
  "no.",
  "mt.",
  "mr.",
  "mrs.",
  "ms.",
  "dr.",
  "prof.",
  "st.",
  "ave.",
  "rd.",
]);

/** Roughly the point past which a paragraph stops being comfortable to read. */
const TARGET_CHARS = 300;
/** A trailing fragment shorter than this is absorbed into the paragraph above. */
const ORPHAN_CHARS = 130;

export function splitSentences(text: string): string[] {
  const out: string[] = [];
  let current = "";

  // Break on whitespace that follows terminal punctuation and precedes
  // something that can open a sentence. A closing quote or bracket is allowed
  // between the two.
  const parts = text.split(/(?<=[.!?]["'”’)\]]?)\s+(?=["'“‘([]?[A-Z0-9])/u);

  for (const part of parts) {
    current = current ? `${current} ${part}` : part;
    const lastWord = current.split(/\s+/).pop()?.toLowerCase() ?? "";
    // Keep accumulating through an abbreviation or a lone initial ("J.").
    if (ABBREVIATIONS.has(lastWord) || /^[a-z]\.$/i.test(lastWord)) continue;
    out.push(current);
    current = "";
  }

  if (current) out.push(current);
  return out;
}

/**
 * A sentence the writer opened with a short label and a colon — "Day one:",
 * "Day two:" — starts a new paragraph regardless of length. The break comes
 * from the writer's own punctuation: no word moves, and no title is coined.
 */
function opensAMovement(sentence: string): boolean {
  return /^[A-Z][A-Za-z'’ -]{1,24}:\s/.test(sentence);
}

export function segmentIntoParagraphs(text: string): string[] {
  const sentences = splitSentences(text);
  if (sentences.length < 3) return [text];

  const paragraphs: string[] = [];
  let buffer: string[] = [];
  let length = 0;

  const flush = () => {
    if (buffer.length === 0) return;
    paragraphs.push(buffer.join(" "));
    buffer = [];
    length = 0;
  };

  for (const sentence of sentences) {
    if (buffer.length > 0 && (length >= TARGET_CHARS || opensAMovement(sentence))) {
      flush();
    }
    buffer.push(sentence);
    length += sentence.length + 1;
  }
  flush();

  // A one-line coda reads as a mistake rather than as emphasis — unless the
  // writer opened it with a label, in which case the break is theirs and a
  // short final movement is exactly what they wrote.
  const last = paragraphs.at(-1);
  const previous = paragraphs.at(-2);
  if (
    last !== undefined &&
    previous !== undefined &&
    last.length < ORPHAN_CHARS &&
    !opensAMovement(last)
  ) {
    paragraphs.splice(-2, 2, `${previous} ${last}`);
  }

  return paragraphs;
}

// ---------------------------------------------------------------------------
// Inline formatting
// ---------------------------------------------------------------------------

/**
 * Hrefs a stored body is permitted to produce.
 *
 * Site-relative paths, in-page anchors, https and mailto. Everything else —
 * `javascript:`, `data:`, protocol-relative `//host`, bare `http:` — fails, and
 * the link degrades to its own label as plain text, so a bad value can never
 * become a live control.
 */
export function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (!href || /[\s<>"']/.test(href)) return null;
  if (href.startsWith("//")) return null;
  if (href.startsWith("/") || href.startsWith("#")) return href;
  if (/^https:\/\/[^/]+/i.test(href)) return href;
  if (/^mailto:[^@\s]+@[^@\s]+$/i.test(href)) return href;
  return null;
}

const INLINE = /\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let cursor = 0;

  INLINE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > cursor) {
      out.push({ kind: "text", value: text.slice(cursor, match.index) });
    }

    const [whole, linkText, linkHref, strong, emphasis] = match;

    if (linkText !== undefined) {
      const href = safeHref(linkHref ?? "");
      // A rejected URL keeps its words; it simply stops being a link.
      out.push(
        href
          ? { kind: "link", href, children: [{ kind: "text", value: linkText }] }
          : { kind: "text", value: linkText },
      );
    } else if (strong !== undefined) {
      out.push({ kind: "strong", children: [{ kind: "text", value: strong }] });
    } else if (emphasis !== undefined) {
      out.push({ kind: "emphasis", children: [{ kind: "text", value: emphasis }] });
    }

    cursor = match.index + (whole ?? "").length;
  }

  if (cursor < text.length) out.push({ kind: "text", value: text.slice(cursor) });
  return out.length > 0 ? out : [{ kind: "text", value: text }];
}

/** Flattens inline content back to plain text. */
export function inlineText(content: Inline[]): string {
  return content
    .map((node) => (node.kind === "text" ? node.value : inlineText(node.children)))
    .join("");
}

// ---------------------------------------------------------------------------
// Anchors
// ---------------------------------------------------------------------------

export function slugifyHeading(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

function uniqueSlug(text: string, used: Set<string>): string {
  const base = slugifyHeading(text);
  let candidate = base;
  let n = 2;
  while (used.has(candidate)) candidate = `${base}-${n++}`;
  used.add(candidate);
  return candidate;
}
