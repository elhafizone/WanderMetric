import { z } from "zod";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/core/shared/pagination";

/** Query parameters shared by every list endpoint. */
export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});

export const slugParam = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Must be a lowercase hyphenated slug");

export const searchQuery = paginationQuery.extend({
  q: z.string().trim().min(2).max(120),
  type: z.enum(["destination", "guide", "hotel", "activity", "deal"]).optional(),
});

export const activityKindQuery = paginationQuery.extend({
  kind: z.enum(["activity", "tour"]).optional(),
  city: slugParam.optional(),
});

export const citiesQuery = paginationQuery.extend({
  country: slugParam.optional(),
  featured: z.coerce.boolean().optional(),
});

export const subscribeBody = z.object({
  // Length cap first so a megabyte of input is rejected before regex work.
  email: z.string().trim().max(254).pipe(z.email()),
  source: z.string().trim().max(64).optional(),
});

/** Parses URLSearchParams against a schema, flattening repeated keys. */
export function parseQuery<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams,
): z.ZodSafeParseResult<z.infer<T>> {
  return schema.safeParse(Object.fromEntries(searchParams.entries()));
}
