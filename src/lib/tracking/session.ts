import "server-only";

import { cookies } from "next/headers";

/**
 * Anonymous session identifier.
 *
 * A random UUID in a first-party cookie. It is not derived from anything about
 * the visitor, is scoped to this site only, and is never joined to personal
 * data — its sole purpose is grouping a visit so a click can be attributed to
 * the page that produced it.
 *
 * 30 days matches the longest affiliate attribution window we expect to work
 * with, so nothing is retained longer than it can be used.
 */
export const SESSION_COOKIE = "wm_sid";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function readSessionId(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  return value && isUuid(value) ? value : null;
}

/**
 * Returns the existing session id, or mints one.
 *
 * Only callable where a cookie may be written — a Route Handler or Server
 * Action. Server Components cannot set cookies.
 */
export async function ensureSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value;
  if (existing && isUuid(existing)) return existing;

  const id = crypto.randomUUID();
  store.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return id;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
