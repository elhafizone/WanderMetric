import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import { JsonLd } from "@/components/seo/json-ld";
import { site } from "@/core/seo/site";

import "./globals.css";

/**
 * Two families, both variable, both self-hosted by `next/font` — so there is no
 * connection to a font CDN, no render-blocking stylesheet, and one file per
 * family rather than one per weight.
 *
 * Fraunces carries the editorial voice: it is the display face and never sets
 * body copy. Inter sets everything a reader has to read at length. `swap` is
 * deliberate on a content site — text in the fallback face beats no text while
 * the woff2 arrives, and it keeps the font off the LCP critical path.
 */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: "variable",
  axes: ["SOFT", "opsz"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Root metadata. `metadataBase` makes every relative canonical and Open Graph
 * URL in the app resolve against the correct origin per environment.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    url: site.url,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    site: site.twitterHandle,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // One theme, so one theme-colour. Advertising a dark variant here would ask
  // the browser to tint its own chrome dark around a page that is not.
  themeColor: "#fbf8f3",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${fraunces.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        {/* Site-level structured data. Emitted once here rather than per page so
            it cannot drift between routes. */}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": `${site.url}#organization`,
                name: site.name,
                url: site.url,
                description: site.description,
              },
              {
                "@type": "WebSite",
                "@id": `${site.url}#website`,
                name: site.name,
                url: site.url,
                publisher: { "@id": `${site.url}#organization` },
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${site.url}/search?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ],
          }}
        />

        {children}
      </body>
    </html>
  );
}
