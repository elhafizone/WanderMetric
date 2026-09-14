/**
 * Site search.
 *
 * A plain GET form, so it works without JavaScript, is linkable, and costs no
 * client bundle. Results are rendered server-side at /search.
 */
export function SearchForm({
  defaultValue = "",
  autoFocus = false,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  return (
    <form action="/search" method="get" role="search" className="flex w-full gap-2">
      <label htmlFor="site-search" className="sr-only">
        Search destinations, guides and things to do
      </label>
      <input
        id="site-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        placeholder="Search destinations, guides, things to do…"
        className="border-border bg-surface placeholder:text-ink-muted focus-visible:border-accent focus-visible:ring-accent/30 min-w-0 flex-1 rounded-md border px-4 py-2.5 text-base outline-none focus-visible:ring-2"
      />
      <button
        type="submit"
        className="bg-accent text-accent-contrast rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
      >
        Search
      </button>
    </form>
  );
}
