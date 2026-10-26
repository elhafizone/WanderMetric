import { afterEach, describe, expect, it, vi } from "vitest";

import { describeError, logError } from "@/lib/logger";

/**
 * Error logging.
 *
 * Supabase returns failures as plain objects, not Error instances. Logging them
 * with String() produced "[object Object]" and hid a silently failing click
 * insert in production, so the message and database code must come through.
 */

describe("describeError", () => {
  it("reads an Error", () => {
    const parts = describeError(new Error("boom"));
    expect(parts.message).toBe("boom");
    expect(parts.extra.stack).toEqual(expect.any(String));
  });

  it("reads a PostgREST-style error object instead of printing [object Object]", () => {
    const parts = describeError({
      message: 'insert or update on table "affiliate_clicks" violates foreign key constraint',
      code: "23503",
      details: "Key (session_id) is not present in table tracking_sessions.",
      hint: null,
    });
    expect(parts.message).toContain("violates foreign key constraint");
    expect(parts.message).not.toContain("[object Object]");
    expect(parts.extra).toEqual({
      error_code: "23503",
      error_details: "Key (session_id) is not present in table tracking_sessions.",
    });
  });

  it("falls back to JSON for an object with no message", () => {
    expect(describeError({ status: 500 }).message).toBe('{"status":500}');
  });

  it("handles strings and other primitives", () => {
    expect(describeError("plain").message).toBe("plain");
    expect(describeError(undefined).message).toBe("undefined");
    expect(describeError(null).message).toBe("null");
  });

  it("does not throw on a circular object", () => {
    const loop: Record<string, unknown> = {};
    loop.self = loop;
    expect(describeError(loop).message).toBe("Unserialisable error object");
  });
});

describe("logError", () => {
  afterEach(() => vi.restoreAllMocks());

  it("emits one JSON line carrying the readable message and the database code", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logError("go.redirect.record_click", { message: "fk violation", code: "23503" }, { slug: "airalo" });

    expect(spy).toHaveBeenCalledTimes(1);
    const line = JSON.parse(String(spy.mock.calls[0]?.[0]));
    expect(line).toMatchObject({
      level: "error",
      context: "go.redirect.record_click",
      message: "fk violation",
      meta: { slug: "airalo", error_code: "23503" },
    });
  });
});
