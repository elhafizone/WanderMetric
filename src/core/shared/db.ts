import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * The typed client every repository accepts.
 *
 * Repositories take the client as an argument rather than importing one. That
 * keeps `src/core` free of any request-scoped or framework concern and lets the
 * same query run under an anonymous visitor's RLS, a signed-in editor's, or the
 * service role, purely by which client is passed in.
 */
export type Db = SupabaseClient<Database>;

export type Tables = Database["public"]["Tables"];
export type Enums = Database["public"]["Enums"];

export type Row<T extends keyof Tables> = Tables[T]["Row"];
export type Insert<T extends keyof Tables> = Tables[T]["Insert"];
export type Update<T extends keyof Tables> = Tables[T]["Update"];

export type ContentStatus = Enums["content_status"];
export type ContentTypeName = Enums["content_type"];
export type UserRole = Enums["user_role"];
export type ActivityKind = Enums["activity_kind"];
export type DealKind = Enums["deal_kind"];
export type DeviceType = Enums["device_type"];
export type Vertical = Enums["vertical"];
