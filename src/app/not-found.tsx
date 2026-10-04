import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SearchForm } from "@/components/search/search-form";
import { ButtonLink } from "@/components/ui/button";

/**
 * 404. Returns a genuine 404 status (Next handles that for this file), which
 * matters: a "soft 404" that returns 200 gets the URL indexed as a real page.
 *
 * It leads with the search box rather than an apology. Someone who lands here
 * came looking for a place, and the fastest route back to the site is to let
 * them name it.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Container width="narrow">
          <div className="flex flex-col gap-5 py-16 sm:py-24">
            <p className="eyebrow text-accent">404</p>
            <h1 className="display text-[2.25rem] sm:text-[3.25rem]">
              We could not find that page
            </h1>
            <p className="text-ink-soft max-w-[52ch] text-lg/[1.65]">
              It may have moved, or the link may be wrong. Search for somewhere, or start from
              the sections.
            </p>
            <div className="pt-2">
              <SearchForm autoFocus />
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <ButtonLink href="/tours-activities">Browse tours and activities</ButtonLink>
              <ButtonLink href="/" variant="secondary">
                Back to the home page
              </ButtonLink>
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
