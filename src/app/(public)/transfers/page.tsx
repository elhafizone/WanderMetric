import type { Metadata } from "next";

import { CategoryPage } from "@/components/category/category-page";
import { TRANSFERS } from "@/components/category/configs";
import { buildMetadata } from "@/core/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Compare airport transfers",
  description:
    "Airport transfer providers we work with, and what to check before you book: delays, luggage, price per vehicle and pickup.",
  path: "/transfers",
});

// Providers appear only while their links are live, so this follows the database.
export const revalidate = 3600;

export default function Page() {
  return <CategoryPage config={TRANSFERS} />;
}
