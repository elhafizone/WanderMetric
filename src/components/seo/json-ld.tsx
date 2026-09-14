/**
 * Emits a JSON-LD block.
 *
 * `JSON.stringify` output is escaped for `</script>` so a stray sequence in
 * content cannot break out of the script element. This is the one place the
 * site uses dangerouslySetInnerHTML, and it never receives user-authored HTML —
 * only a structure we build ourselves.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
