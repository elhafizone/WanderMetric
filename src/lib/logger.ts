/**
 * Structured logging.
 *
 * Shared hosting log retention is not dependable, so output is single-line JSON
 * ready to ship to an external sink without reparsing.
 *
 * Redaction is applied to every payload: anything whose key looks like a
 * credential is replaced before serialization, so a careless `logError(ctx, err,
 * { config })` cannot leak a token. Never log passwords, tokens, API keys,
 * service-role keys or personal data.
 */

const SENSITIVE_KEY = /(password|token|secret|key|authorization|cookie|session|apikey)/i;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [
      k,
      SENSITIVE_KEY.test(k) ? "[redacted]" : redact(v, depth + 1),
    ]),
  );
}

type Level = "info" | "warn" | "error";

function emit(
  level: Level,
  context: string,
  message: string,
  meta?: Record<string, unknown>,
) {
  const line = JSON.stringify({
    level,
    context,
    message,
    ...(meta ? { meta: redact(meta) } : {}),
    timestamp: new Date().toISOString(),
  });

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function logInfo(
  context: string,
  message: string,
  meta?: Record<string, unknown>,
) {
  emit("info", context, message, meta);
}

export function logWarn(
  context: string,
  message: string,
  meta?: Record<string, unknown>,
) {
  emit("warn", context, message, meta);
}

/**
 * Turns whatever was thrown or returned into a readable message plus the fields
 * worth keeping.
 *
 * Supabase and PostgREST report failures as plain objects
 * (`{ message, code, details, hint }`), not `Error` instances, so `String(error)`
 * printed `[object Object]` and hid a failing insert for days. Anything with a
 * string `message` is now read for it, and the database error code, details and
 * hint ride along as `error_*` fields.
 */
export function describeError(error: unknown): {
  message: string;
  extra: Record<string, unknown>;
} {
  if (error instanceof Error) {
    return { message: error.message, extra: error.stack ? { stack: error.stack } : {} };
  }

  if (typeof error === "string") return { message: error, extra: {} };

  if (error !== null && typeof error === "object") {
    const fields = error as Record<string, unknown>;
    const extra: Record<string, unknown> = {};
    for (const name of ["code", "details", "hint"] as const) {
      const value = fields[name];
      if (typeof value === "string" && value) extra[`error_${name}`] = value;
    }
    if (typeof fields.message === "string" && fields.message) {
      return { message: fields.message, extra };
    }
    try {
      return { message: JSON.stringify(error), extra };
    } catch {
      return { message: "Unserialisable error object", extra };
    }
  }

  return { message: String(error), extra: {} };
}

export function logError(
  context: string,
  error: unknown,
  meta?: Record<string, unknown>,
) {
  const { message, extra } = describeError(error);
  emit("error", context, message, { ...meta, ...extra });
}
