import type { Metadata } from "next";

import { CategoryPage } from "@/components/category/category-page";
import { INSURANCE } from "@/components/category/configs";
import { buildMetadata } from "@/core/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Travel insurance, explained plainly",
  description:
    "What to check before you buy travel insurance: medical cover, pre-existing conditions, activities and cancellation, plus where to get a quote.",
  path: "/insurance",
});

// Providers appear only while their links are live, so this follows the database.
export const revalidate = 3600;

export default function Page() {
  return <CategoryPage config={INSURANCE} />;
}
