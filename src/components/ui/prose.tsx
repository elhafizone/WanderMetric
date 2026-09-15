/**
 * Renders stored body copy.
 *
 * Body text is plain text, not HTML, and is split on blank lines into
 * paragraphs. That is a deliberate security decision: React escapes the output,
 * so there is no `dangerouslySetInnerHTML` anywhere in the page body and
 * stored-XSS through the editor is structurally impossible. If rich formatting
 * is needed later it should arrive as a sanitised allow-list, not as raw HTML.
 *
 * Typographically this is the one place on the site tuned for sustained
 * reading rather than scanning: 18px on a 1.75 leading, a measure capped near
 * 68 characters, and a larger opening paragraph so an article starts the way a
 * magazine article starts.
 */
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

  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return (
    <div className={`text-ink flex max-w-[68ch] flex-col gap-6 ${className ?? ""}`}>
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className={
            lead && index === 0
              ? "text-ink-soft text-[1.25rem]/[1.6]"
              : "text-[1.0625rem]/[1.75]"
          }
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
