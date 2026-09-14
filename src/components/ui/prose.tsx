/**
 * Renders stored body copy.
 *
 * Body text is plain text, not HTML, and is split on blank lines into
 * paragraphs. That is a deliberate security decision: React escapes the output,
 * so there is no `dangerouslySetInnerHTML` anywhere in the public site and
 * stored-XSS through the editor is structurally impossible. If rich formatting
 * is needed later it should arrive as a sanitised allow-list, not as raw HTML.
 */
export function Prose({ text, className }: { text: string | null; className?: string }) {
  if (!text) return null;

  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={`text-ink flex flex-col gap-4 text-[17px]/[1.7] ${className ?? ""}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
