import Link from "next/link";

import { Container, Stack } from "@/components/layout/container";
import { SearchForm } from "@/components/search/search-form";

/**
 * 404. Returns a genuine 404 status (Next handles that for this file), which
 * matters: a "soft 404" that returns 200 gets the URL indexed as a real page.
 */
export default function NotFound() {
  return (
    <Container width="narrow">
      <Stack>
        <div className="flex flex-col gap-4 py-10">
          <p className="text-accent font-mono text-xs tracking-[0.16em] uppercase">404</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            We could not find that page
          </h1>
          <p className="text-ink-muted max-w-prose">
            It may have moved, or the link may be wrong. Try a search, or start from the
            destinations index.
          </p>
          <div className="max-w-lg pt-2">
            <SearchForm />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/destinations"
              className="bg-accent text-accent-contrast rounded-md px-5 py-2.5 text-sm font-medium hover:opacity-90"
            >
              Browse destinations
            </Link>
            <Link
              href="/"
              className="border-border hover:border-accent hover:text-accent rounded-md border px-5 py-2.5 text-sm font-medium"
            >
              Go home
            </Link>
          </div>
        </div>
      </Stack>
    </Container>
  );
}
