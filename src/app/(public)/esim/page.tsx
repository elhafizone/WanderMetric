import type { Metadata } from "next";

import { CategoryPage } from "@/components/category/category-page";
import { ESIM } from "@/components/category/configs";
import { buildMetadata } from "@/core/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Compare travel eSIMs",
  description:
    "Travel eSIM services we work with, and what to check before you buy: phone support, install timing and data-only plans.",
  path: "/esim",
});

// Providers appear only while their links are live, so this follows the database.
export const revalidate = 3600;

export default function Page() {
  return <CategoryPage config={ESIM} />;
}
