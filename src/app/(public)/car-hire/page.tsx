import type { Metadata } from "next";

import { CategoryPage } from "@/components/category/category-page";
import { CAR_HIRE } from "@/components/category/configs";
import { buildMetadata } from "@/core/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Compare car hire",
  description:
    "Car hire providers we work with, what each is best at, and what to check before you book: licence, deposit, insurance excess and fuel policy.",
  path: "/car-hire",
});

// Providers appear only while their links are live, so this follows the database.
export const revalidate = 3600;

export default function Page() {
  return <CategoryPage config={CAR_HIRE} />;
}
