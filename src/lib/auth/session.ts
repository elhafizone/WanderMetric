import "server-only";

import { redirect } from "next/navigation";

import type { UserRole } from "@/core/shared/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-side identity for admin routes.
 *
 * Always resolved through `getUser()`, which revalidates the token against the
 * auth server. `getSession()` merely decodes a cookie the client controls, so it
 * must never be used to gate access.
 */

export interface StaffUser {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
}

export async function getStaffUser(): Promise<StaffUser | null> {
  const db = await createSupabaseServerClient();

  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;

  const { data: profile } = await db
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
  };
}

/**
 * Gate for every admin page and server action.
 *
 * RLS is the real boundary — this exists so an unauthorised visitor gets a
 * redirect instead of an empty screen, and so a mutation fails before it reaches
 * the database rather than after.
 */
export async function requireStaff(minimum: UserRole = "viewer"): Promise<StaffUser> {
  const user = await getStaffUser();
  if (!user) redirect("/admin/login");

  const rank: Record<UserRole, number> = { viewer: 1, editor: 2, admin: 3 };
  if (rank[user.role] < rank[minimum]) redirect("/admin?denied=1");

  return user;
}

export function canEdit(role: UserRole): boolean {
  return role === "admin" || role === "editor";
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}
