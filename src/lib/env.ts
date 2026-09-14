import { z } from "zod";

/**
 * Environment contract for WanderMetric.
 *
 * Validation is LAZY by design. `next build` has to succeed on a machine with no
 * Supabase credentials — CI, a fresh clone, or the current Phase 1 state where the
 * Supabase project does not exist yet. Nothing here throws at import time; a value
 * is only validated when something actually asks for it.
 */

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Canonical site origin. Falls back to the production domain. */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://wandermetric.com";
}

/**
 * Returns the browser-safe Supabase config, or `null` when it is not configured.
 * Callers decide how to degrade — never assume Supabase is present.
 */
export function getSupabasePublicConfig(): Pick<
  PublicEnv,
  "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
> | null {
  const parsed = publicEnvSchema
    .pick({ NEXT_PUBLIC_SUPABASE_URL: true, NEXT_PUBLIC_SUPABASE_ANON_KEY: true })
    .safeParse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

  return parsed.success ? parsed.data : null;
}

/** Same as above but throws — use where Supabase is genuinely required. */
export function requireSupabasePublicConfig() {
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example).",
    );
  }
  return config;
}

/**
 * Service-role key. Server-only — this must never reach the browser bundle.
 */
export function requireServiceRoleKey(): string {
  const parsed = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. It is required for privileged server-side access.",
    );
  }
  return parsed.data.SUPABASE_SERVICE_ROLE_KEY;
}

export const isProduction = process.env.NODE_ENV === "production";
