/**
 * Site search.
 *
 * A plain GET form, so it works without JavaScript, is linkable, and costs no
 * client bundle. Results are rendered server-side at /search.
 *
 * The `hero` variant adds a type filter. It is a discovery control, not a
 * booking widget: there are no dates, no guest counts and no price fields,
 * because this site has no inventory to search and pretending otherwise would
 * be the fastest way to look like every other affiliate page.
 *
 * It sits on the ivory plate rather than on the photograph, so it is a bordered
 * white field rather than a floating translucent one — no backdrop blur, no
 * heavy shadow. Glass on paper looks like a widget; this looks like part of
 * the page.
 */

const TYPES = [
  { value: "", label: "Anything" },
  { value: "destination", label: "Destinations" },
  { value: "hotel", label: "Hotels" },
  { value: "activity", label: "Things to do" },
  { value: "guide", label: "Travel guides" },
  { value: "deal", label: "Deals" },
];

export function SearchForm({
  defaultValue = "",
  defaultType = "",
  autoFocus = false,
  variant = "default",
}: {
  defaultValue?: string;
  defaultType?: string;
  autoFocus?: boolean;
  variant?: "default" | "hero";
}) {
  if (variant === "hero") {
    return (
      <form
        action="/search"
        method="get"
        role="search"
        className="bg-surface border-border focus-within:border-border-strong flex w-full flex-col gap-2 rounded-2xl border p-2 shadow-sm transition-colors sm:flex-row sm:items-center sm:gap-1 sm:rounded-full sm:p-1.5"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-2.5">
          <label htmlFor="hero-search" className="eyebrow text-ink-muted">
            Where do you want to go?
          </label>
          <input
            id="hero-search"
            name="q"
            type="search"
            defaultValue={defaultValue}
            autoFocus={autoFocus}
            placeholder="Lisbon, Kyoto, the Amalfi Coast…"
            className="text-ink placeholder:text-ink-muted/70 w-full min-w-0 bg-transparent text-base outline-none"
          />
        </div>

        <div
          aria-hidden="true"
          className="bg-border mx-2 hidden h-9 w-px shrink-0 sm:block"
        />

        <div className="flex flex-col gap-0.5 px-4 py-2.5 sm:w-52">
          <label htmlFor="hero-type" className="eyebrow text-ink-muted">
            What are you looking for?
          </label>
          <select
            id="hero-type"
            name="type"
            defaultValue={defaultType}
            className="text-ink -ml-0.5 w-full min-w-0 bg-transparent text-base outline-none"
          >
            {TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-accent text-accent-contrast hover:bg-accent-hover shrink-0 rounded-full px-7 py-3.5 text-sm font-medium transition-colors duration-200 sm:py-4"
        >
          Explore
        </button>
      </form>
    );
  }

  return (
    <form
      action="/search"
      method="get"
      role="search"
      className="border-border bg-surface focus-within:border-ink flex w-full items-center gap-2 rounded-full border p-1.5 pl-5 transition-colors"
    >
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
        className="text-ink placeholder:text-ink-muted/70 min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none"
      />
      <button
        type="submit"
        className="bg-accent text-accent-contrast hover:bg-accent-hover shrink-0 rounded-full px-6 py-2.5 text-sm font-medium transition-colors duration-200"
      >
        Search
      </button>
    </form>
  );
}
