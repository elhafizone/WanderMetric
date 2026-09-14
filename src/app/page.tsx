import type { Metadata } from "next";

import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { getSupabasePublicConfig } from "@/lib/env";

export const metadata: Metadata = buildMetadata({
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  path: "/",
});

const foundations = [
  {
    area: "Application",
    detail: "Next.js App Router, TypeScript in strict mode, ESLint and Prettier.",
  },
  {
    area: "Data",
    detail: "Supabase client, server and admin adapters behind a lazy env contract.",
  },
  {
    area: "Domain",
    detail: "Framework-free core layer — the same logic a mobile app will consume.",
  },
  {
    area: "Discovery",
    detail: "Canonical URLs, Open Graph, robots and sitemap wired from day one.",
  },
];

export default function HomePage() {
  const supabaseConfigured = getSupabasePublicConfig() !== null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-12 px-5 py-16">
      <header className="flex flex-col gap-4">
        <p className="text-accent font-mono text-xs tracking-[0.18em] uppercase">
          Phase 1 · Foundation
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {site.name}
        </h1>
        <p className="text-ink-muted max-w-prose text-lg">
          A travel discovery and affiliate platform. This is the project foundation — the
          public site is not built yet.
        </p>
      </header>

      <section aria-labelledby="foundations-heading" className="flex flex-col gap-4">
        <h2
          id="foundations-heading"
          className="text-ink-muted font-mono text-xs tracking-[0.14em] uppercase"
        >
          What is in place
        </h2>
        <ul className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
          {foundations.map(({ area, detail }) => (
            <li key={area} className="bg-surface flex flex-col gap-1.5 p-5">
              <h3 className="text-sm font-semibold">{area}</h3>
              <p className="text-ink-muted text-sm">{detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-border text-ink-muted flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-6 text-sm">
        <span
          aria-hidden="true"
          className={`inline-block size-2 rounded-full ${
            supabaseConfigured ? "bg-accent" : "bg-ink-muted"
          }`}
        />
        <span>
          Supabase{" "}
          {supabaseConfigured ? "configured" : "not configured — see .env.example"}
        </span>
        <a
          className="hover:text-accent focus-visible:text-accent ml-auto underline underline-offset-4"
          href="/api/v1/health"
        >
          Health check
        </a>
      </footer>
    </main>
  );
}
