import { z } from "zod";

import type { Tables } from "@/core/shared/db";

/**
 * Admin resource registry.
 *
 * Eight entities share one list screen, one form screen and one set of server
 * actions, driven by this configuration. The alternative — eight near-identical
 * CRUD screens — is where admin panels rot: a fix applied to six of them and
 * forgotten on the other two.
 *
 * Adding an entity is a config entry, not a new page.
 */

export type FieldKind =
  | "text"
  | "textarea"
  | "richtext"
  | "slug"
  | "number"
  | "boolean"
  | "select"
  | "reference"
  | "datetime";

export interface FieldConfig {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  help?: string;
  options?: Array<{ value: string; label: string }>;
  /** For `reference`: the table to draw options from. */
  referenceTable?: ReferenceTable;
  /** Rows per textarea. */
  rows?: number;
}

export type ReferenceTable =
  "countries" | "cities" | "categories" | "media" | "affiliate_programs";

export interface ColumnConfig {
  name: string;
  label: string;
  /** Render as a status pill rather than plain text. */
  status?: boolean;
}

export interface ResourceConfig {
  slug: string;
  table: keyof Tables;
  label: string;
  labelSingular: string;
  description: string;
  columns: ColumnConfig[];
  fields: FieldConfig[];
  /** Column used by the list search box. */
  searchColumn: string;
  orderBy: { column: string; ascending: boolean };
  /** Soft-deleting resources are filtered and never hard-deleted. */
  softDelete: boolean;
  /** Admin-only resources (everything else allows editors). */
  adminOnly?: boolean;
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const INTEGRATION_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "disabled", label: "Disabled" },
];

const statusField: FieldConfig = {
  name: "status",
  label: "Status",
  kind: "select",
  required: true,
  options: STATUS_OPTIONS,
  help: "Publishing enforces minimum-substance rules at the database level.",
};

const seoFields: FieldConfig[] = [
  { name: "published_at", label: "Publish date", kind: "datetime" },
  { name: "is_featured", label: "Featured", kind: "boolean" },
];

export const RESOURCES: Record<string, ResourceConfig> = {
  destinations: {
    slug: "destinations",
    table: "destinations",
    label: "Destinations",
    labelSingular: "Destination",
    description:
      "City and country pages. A destination with no city is the country-level page.",
    searchColumn: "title",
    orderBy: { column: "updated_at", ascending: false },
    softDelete: true,
    columns: [
      { name: "title", label: "Title" },
      { name: "slug", label: "Slug" },
      { name: "status", label: "Status", status: true },
    ],
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      {
        name: "slug",
        label: "Slug",
        kind: "slug",
        required: true,
        help: "Changing a published slug automatically writes a 301 redirect.",
      },
      {
        name: "country_id",
        label: "Country",
        kind: "reference",
        referenceTable: "countries",
        required: true,
      },
      {
        name: "city_id",
        label: "City",
        kind: "reference",
        referenceTable: "cities",
        help: "Leave empty for a country-level destination page.",
      },
      {
        name: "excerpt",
        label: "Excerpt",
        kind: "textarea",
        rows: 3,
        help: "At least 50 characters is required before this can be published.",
      },
      {
        name: "body",
        label: "Body",
        kind: "richtext",
        rows: 18,
        help: "At least 300 characters is required before this can be published. Plain text; blank lines separate paragraphs.",
      },
      { name: "best_time", label: "Best time to visit", kind: "textarea", rows: 2 },
      {
        name: "hero_media_id",
        label: "Hero image",
        kind: "reference",
        referenceTable: "media",
      },
      statusField,
      ...seoFields,
    ],
  },

  guides: {
    slug: "guides",
    table: "guides",
    label: "Guides",
    labelSingular: "Guide",
    description:
      "Long-form editorial. Publishing requires at least 500 characters of body.",
    searchColumn: "title",
    orderBy: { column: "updated_at", ascending: false },
    softDelete: true,
    columns: [
      { name: "title", label: "Title" },
      { name: "slug", label: "Slug" },
      { name: "status", label: "Status", status: true },
    ],
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "slug", required: true },
      { name: "excerpt", label: "Excerpt", kind: "textarea", rows: 3 },
      {
        name: "body",
        label: "Body",
        kind: "richtext",
        rows: 22,
        help: "At least 500 characters is required before this can be published.",
      },
      {
        name: "category_id",
        label: "Category",
        kind: "reference",
        referenceTable: "categories",
      },
      { name: "city_id", label: "City", kind: "reference", referenceTable: "cities" },
      {
        name: "country_id",
        label: "Country",
        kind: "reference",
        referenceTable: "countries",
      },
      { name: "reading_minutes", label: "Reading minutes", kind: "number" },
      {
        name: "hero_media_id",
        label: "Hero image",
        kind: "reference",
        referenceTable: "media",
      },
      statusField,
      ...seoFields,
    ],
  },

  hotels: {
    slug: "hotels",
    table: "hotels",
    label: "Hotels",
    labelSingular: "Hotel",
    description:
      "Editorial hotel records. No price, availability or review data is stored — that is provider-owned and fetched live.",
    searchColumn: "name",
    orderBy: { column: "updated_at", ascending: false },
    softDelete: true,
    columns: [
      { name: "name", label: "Name" },
      { name: "slug", label: "Slug" },
      { name: "status", label: "Status", status: true },
    ],
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "slug", required: true },
      {
        name: "city_id",
        label: "City",
        kind: "reference",
        referenceTable: "cities",
        required: true,
      },
      { name: "summary", label: "Summary", kind: "textarea", rows: 3 },
      { name: "body", label: "Body", kind: "richtext", rows: 14 },
      { name: "address", label: "Address", kind: "text" },
      {
        name: "star_rating",
        label: "Star rating",
        kind: "number",
        help: "1–5. The official star classification, not a review score.",
      },
      {
        name: "hero_media_id",
        label: "Hero image",
        kind: "reference",
        referenceTable: "media",
      },
      statusField,
      ...seoFields,
    ],
  },

  activities: {
    slug: "activities",
    table: "activities",
    label: "Activities & tours",
    labelSingular: "Activity",
    description:
      "Things to do and guided tours. `Kind` decides which URL root it lives under.",
    searchColumn: "name",
    orderBy: { column: "updated_at", ascending: false },
    softDelete: true,
    columns: [
      { name: "name", label: "Name" },
      { name: "kind", label: "Kind" },
      { name: "status", label: "Status", status: true },
    ],
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "slug", required: true },
      {
        name: "kind",
        label: "Kind",
        kind: "select",
        required: true,
        options: [
          { value: "activity", label: "Activity — /activities" },
          { value: "tour", label: "Tour — /tours" },
        ],
      },
      {
        name: "city_id",
        label: "City",
        kind: "reference",
        referenceTable: "cities",
        required: true,
      },
      { name: "summary", label: "Summary", kind: "textarea", rows: 3 },
      { name: "body", label: "Body", kind: "richtext", rows: 14 },
      {
        name: "category_id",
        label: "Category",
        kind: "reference",
        referenceTable: "categories",
      },
      { name: "duration_minutes", label: "Duration (minutes)", kind: "number" },
      {
        name: "hero_media_id",
        label: "Hero image",
        kind: "reference",
        referenceTable: "media",
      },
      statusField,
      ...seoFields,
    ],
  },

  deals: {
    slug: "deals",
    table: "deals",
    label: "Deals",
    labelSingular: "Deal",
    description:
      "Time-limited offers. Expired deals stop being publicly readable automatically.",
    searchColumn: "title",
    orderBy: { column: "updated_at", ascending: false },
    softDelete: true,
    columns: [
      { name: "title", label: "Title" },
      { name: "kind", label: "Kind" },
      { name: "status", label: "Status", status: true },
    ],
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "slug", required: true },
      {
        name: "kind",
        label: "Kind",
        kind: "select",
        required: true,
        options: [
          { value: "hotel", label: "Hotel" },
          { value: "flight", label: "Flight" },
          { value: "activity", label: "Activity" },
          { value: "tour", label: "Tour" },
          { value: "package", label: "Package" },
          { value: "other", label: "Other" },
        ],
      },
      { name: "summary", label: "Summary", kind: "textarea", rows: 3 },
      { name: "body", label: "Body", kind: "richtext", rows: 12 },
      {
        name: "discount_label",
        label: "Discount label",
        kind: "text",
        help: 'Free text such as "up to 30% off". Never state a figure you cannot verify.',
      },
      { name: "city_id", label: "City", kind: "reference", referenceTable: "cities" },
      { name: "starts_at", label: "Starts", kind: "datetime" },
      {
        name: "ends_at",
        label: "Ends",
        kind: "datetime",
        help: "After this moment the deal disappears from the public site automatically.",
      },
      {
        name: "hero_media_id",
        label: "Hero image",
        kind: "reference",
        referenceTable: "media",
      },
      statusField,
      ...seoFields,
    ],
  },

  countries: {
    slug: "countries",
    table: "countries",
    label: "Countries",
    labelSingular: "Country",
    description: "Reference geography plus the country landing page copy.",
    searchColumn: "name",
    orderBy: { column: "name", ascending: true },
    softDelete: true,
    columns: [
      { name: "name", label: "Name" },
      { name: "iso2", label: "ISO" },
      { name: "status", label: "Status", status: true },
    ],
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "slug", required: true },
      { name: "iso2", label: "ISO 3166-1 alpha-2", kind: "text", required: true },
      { name: "iso3", label: "ISO 3166-1 alpha-3", kind: "text" },
      {
        name: "continent",
        label: "Continent",
        kind: "select",
        required: true,
        options: [
          { value: "africa", label: "Africa" },
          { value: "antarctica", label: "Antarctica" },
          { value: "asia", label: "Asia" },
          { value: "europe", label: "Europe" },
          { value: "north_america", label: "North America" },
          { value: "oceania", label: "Oceania" },
          { value: "south_america", label: "South America" },
        ],
      },
      { name: "currency_code", label: "Currency code", kind: "text" },
      { name: "capital", label: "Capital", kind: "text" },
      { name: "summary", label: "Summary", kind: "textarea", rows: 3 },
      { name: "body", label: "Body", kind: "richtext", rows: 14 },
      {
        name: "hero_media_id",
        label: "Hero image",
        kind: "reference",
        referenceTable: "media",
      },
      statusField,
    ],
  },

  cities: {
    slug: "cities",
    table: "cities",
    label: "Cities",
    labelSingular: "City",
    description: "Cities. The IATA code enables real flight deep links.",
    searchColumn: "name",
    orderBy: { column: "name", ascending: true },
    softDelete: true,
    columns: [
      { name: "name", label: "Name" },
      { name: "slug", label: "Slug" },
      { name: "status", label: "Status", status: true },
    ],
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "slug", required: true },
      {
        name: "country_id",
        label: "Country",
        kind: "reference",
        referenceTable: "countries",
        required: true,
      },
      { name: "summary", label: "Summary", kind: "textarea", rows: 3 },
      { name: "latitude", label: "Latitude", kind: "number" },
      { name: "longitude", label: "Longitude", kind: "number" },
      { name: "timezone", label: "Timezone", kind: "text" },
      {
        name: "iata_code",
        label: "IATA city code",
        kind: "text",
        help: "Three letters. Used to build flight deep links rather than guessing an airport.",
      },
      { name: "population", label: "Population", kind: "number" },
      {
        name: "hero_media_id",
        label: "Hero image",
        kind: "reference",
        referenceTable: "media",
      },
      statusField,
      { name: "is_featured", label: "Featured", kind: "boolean" },
    ],
  },

  "affiliate-links": {
    slug: "affiliate-links",
    table: "affiliate_links",
    label: "Affiliate links",
    labelSingular: "Affiliate link",
    description:
      "Every outbound partner URL lives here and nowhere else. The slug drives /go/[slug].",
    searchColumn: "label",
    orderBy: { column: "updated_at", ascending: false },
    softDelete: true,
    adminOnly: true,
    columns: [
      { name: "label", label: "Label" },
      { name: "slug", label: "Slug" },
      { name: "status", label: "Status", status: true },
    ],
    fields: [
      { name: "label", label: "Label", kind: "text", required: true },
      {
        name: "slug",
        label: "Slug",
        kind: "slug",
        required: true,
        help: "Reachable at /go/{slug}.",
      },
      {
        name: "program_id",
        label: "Programme",
        kind: "reference",
        referenceTable: "affiliate_programs",
        required: true,
      },
      {
        name: "destination_url",
        label: "Destination URL",
        kind: "text",
        required: true,
        help: "Must be an absolute http(s) URL — enforced by a database constraint.",
      },
      {
        name: "deep_link_template",
        label: "Deep link template",
        kind: "textarea",
        rows: 2,
        help: "Optional. Placeholders: {marker} {clickId} {subId} {url} {campaign}.",
      },
      { name: "city_id", label: "City", kind: "reference", referenceTable: "cities" },
      {
        name: "status",
        label: "Status",
        kind: "select",
        required: true,
        options: INTEGRATION_STATUS_OPTIONS,
      },
    ],
  },
};

export function getResource(slug: string): ResourceConfig | undefined {
  return RESOURCES[slug];
}

export function listResources(): ResourceConfig[] {
  return Object.values(RESOURCES);
}

/**
 * Builds a Zod schema from the field config.
 *
 * Empty strings become null rather than being written as empty values: an empty
 * text input means "not set", and storing "" would defeat every `is null` check
 * and NOT NULL-ish assumption downstream.
 */
export function buildSchema(config: ResourceConfig) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of config.fields) {
    let schema: z.ZodTypeAny;

    switch (field.kind) {
      case "number":
        schema = z.preprocess(
          (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
          z.number().nullable(),
        );
        break;
      case "boolean":
        schema = z.preprocess(
          (v) => v === "on" || v === "true" || v === true,
          z.boolean(),
        );
        break;
      case "slug":
        schema = z
          .string()
          .trim()
          .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Lowercase letters, numbers and hyphens only",
          )
          .max(120);
        break;
      case "datetime":
        schema = z.preprocess(
          (v) => (v === "" || v === null || v === undefined ? null : v),
          z.string().nullable(),
        );
        break;
      default:
        schema = z.preprocess(
          (v) => (typeof v === "string" && v.trim() === "" ? null : v),
          z.string().nullable(),
        );
    }

    if (field.required && field.kind !== "boolean") {
      schema =
        field.kind === "slug"
          ? schema
          : z.preprocess(
              (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
              z.union([z.string(), z.number()]),
            );
    }

    shape[field.name] = schema;
  }

  return z.object(shape);
}
