import type { Metadata } from "next";

import { site } from "@/core/seo/site";

export interface PageMetadataInput {
  title: string;
  description: string;
  /** Site-root-relative path, e.g. "/guides/paris-in-3-days". */
  path: string;
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * Builds a complete metadata object: canonical, Open Graph and Twitter cards.
 *
 * Page components call this rather than assembling metadata by hand, so every
 * indexable page carries a canonical URL and complete social tags by default.
 * In Phase 5 the inputs come from the `seo_metadata` table instead of literals.
 */
export function buildMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
  type = "website",
  publishedTime,
  modifiedTime,
}: PageMetadataInput): Metadata {
  const url = new URL(path, site.url).toString();
  const images = image ? [{ url: new URL(image, site.url).toString() }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: site.name,
      locale: site.locale,
      images,
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      site: site.twitterHandle,
      images,
    },
  };
}
