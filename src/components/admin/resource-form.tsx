"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { ActionState } from "@/lib/admin/actions";
import type { FieldConfig, ResourceConfig } from "@/lib/admin/resources";

export type ReferenceOptions = Record<string, Array<{ value: string; label: string }>>;

const INPUT =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25";

/** Formats an ISO timestamp for a datetime-local input, which wants no zone. */
function toLocalInput(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function Field({
  field,
  value,
  options,
}: {
  field: FieldConfig;
  value: unknown;
  options: ReferenceOptions;
}) {
  const id = `field-${field.name}`;
  const describedBy = field.help ? `${id}-help` : undefined;

  const control = () => {
    switch (field.kind) {
      case "textarea":
      case "richtext":
        return (
          <textarea
            id={id}
            name={field.name}
            rows={field.rows ?? 6}
            required={field.required}
            aria-describedby={describedBy}
            defaultValue={typeof value === "string" ? value : ""}
            className={`${INPUT} font-[inherit] leading-relaxed`}
          />
        );

      case "boolean":
        return (
          <input
            id={id}
            name={field.name}
            type="checkbox"
            defaultChecked={Boolean(value)}
            aria-describedby={describedBy}
            className="size-4 accent-[var(--wm-accent)]"
          />
        );

      case "number":
        return (
          <input
            id={id}
            name={field.name}
            type="number"
            step="any"
            required={field.required}
            aria-describedby={describedBy}
            defaultValue={value === null || value === undefined ? "" : String(value)}
            className={INPUT}
          />
        );

      case "datetime":
        return (
          <input
            id={id}
            name={field.name}
            type="datetime-local"
            aria-describedby={describedBy}
            defaultValue={toLocalInput(value)}
            className={INPUT}
          />
        );

      case "select":
        return (
          <select
            id={id}
            name={field.name}
            required={field.required}
            aria-describedby={describedBy}
            defaultValue={typeof value === "string" ? value : ""}
            className={INPUT}
          >
            {!field.required && <option value="">— none —</option>}
            {(field.options ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "reference": {
        const list = options[field.referenceTable ?? ""] ?? [];
        return (
          <select
            id={id}
            name={field.name}
            required={field.required}
            aria-describedby={describedBy}
            defaultValue={typeof value === "string" ? value : ""}
            className={INPUT}
          >
            <option value="">— none —</option>
            {list.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }

      default:
        return (
          <input
            id={id}
            name={field.name}
            type="text"
            required={field.required}
            aria-describedby={describedBy}
            defaultValue={typeof value === "string" ? value : ""}
            className={INPUT}
          />
        );
    }
  };

  const inline = field.kind === "boolean";

  return (
    <div className={inline ? "flex items-center gap-2" : "flex flex-col gap-1.5"}>
      {inline ? (
        <>
          {control()}
          <label htmlFor={id} className="text-sm font-medium">
            {field.label}
          </label>
        </>
      ) : (
        <>
          <label htmlFor={id} className="text-sm font-medium">
            {field.label}
            {field.required && (
              <span className="text-ink-muted" aria-hidden="true">
                {" "}
                *
              </span>
            )}
          </label>
          {control()}
        </>
      )}
      {field.help && (
        <p id={`${id}-help`} className="text-ink-muted text-xs">
          {field.help}
        </p>
      )}
    </div>
  );
}

export function ResourceForm({
  config,
  record,
  options,
  action,
}: {
  config: ResourceConfig;
  record: Record<string, unknown> | null;
  options: ReferenceOptions;
  action: (previous: ActionState, form: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {
    ok: true,
  });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <p
          role="alert"
          className="border-border bg-surface-2 rounded-md border px-4 py-3 text-sm"
        >
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-5">
        {config.fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            value={record?.[field.name]}
            options={options}
          />
        ))}
      </div>

      <div className="border-border bg-bg sticky bottom-0 flex flex-wrap items-center gap-3 border-t py-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-accent text-accent-contrast rounded-md px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          {pending
            ? "Saving…"
            : record
              ? "Save changes"
              : `Create ${config.labelSingular.toLowerCase()}`}
        </button>
        <Link
          href={`/admin/${config.slug}`}
          className="border-border hover:border-accent hover:text-accent rounded-md border px-5 py-2 text-sm"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
