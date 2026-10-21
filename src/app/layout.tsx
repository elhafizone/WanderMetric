import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Instrument_Serif } from "next/font/google";

import { JsonLd } from "@/components/seo/json-ld";
import { site } from "@/core/seo/site";

import "./globals.css";

/**
 * Two families, both self-hosted by `next/font` - so there is no connection to
 * a font CDN, no render-blocking stylesheet, and the files come from our own
 * origin.
 *
 * Instrument Serif is the display face: headlines, card titles and the
 * wordmark, never body copy and never a label. It has one upright weight and an
 * italic, so hierarchy comes from size. Hanken Grotesk sets everything a reader
 * has to read or operate - navigation, controls, metadata, body - and ships as
 * one variable file. `swap` is deliberate: text in the fallback face beats no
 * text while the woff2 arrives, and it keeps the font off the LCP critical path.
 */
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
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
  themeColor: "#f7f1e6",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${hanken.variable} ${instrument.variable} flex min-h-screen flex-col font-sans antialiased`}
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
