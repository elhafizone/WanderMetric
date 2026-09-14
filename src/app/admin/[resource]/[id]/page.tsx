import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/delete-button";
import { ResourceForm } from "@/components/admin/resource-form";
import { AdminHeader } from "@/components/admin/ui";
import { saveResource, type ActionState } from "@/lib/admin/actions";
import { untypedTable } from "@/lib/admin/generic-table";
import { loadReferenceOptions } from "@/lib/admin/references";
import { getResource, type ReferenceTable } from "@/lib/admin/resources";
import { canEdit, requireStaff } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource, id } = await params;
  const config = getResource(resource);
  if (!config) notFound();

  const user = await requireStaff(config.adminOnly ? "admin" : "viewer");

  const db = await createSupabaseServerClient();
  const { data } = await untypedTable(db)
    .from(config.table)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const record = data as unknown as Record<string, unknown>;

  const referenceTables = config.fields
    .filter((f) => f.kind === "reference" && f.referenceTable)
    .map((f) => f.referenceTable as ReferenceTable);
  const options = await loadReferenceOptions(referenceTables);

  async function action(previous: ActionState, form: FormData) {
    "use server";
    return saveResource(resource, id, previous, form);
  }

  const editable = canEdit(user.role) && (!config.adminOnly || user.role === "admin");

  return (
    <>
      <AdminHeader
        title={`Edit ${config.labelSingular.toLowerCase()}`}
        description={String(record.title ?? record.name ?? record.label ?? "")}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <Link
          href={`/admin/${config.slug}`}
          className="text-accent underline-offset-4 hover:underline"
        >
          ← Back to {config.label.toLowerCase()}
        </Link>
        {editable && <DeleteButton resource={resource} id={id} />}
      </div>

      {editable ? (
        <ResourceForm config={config} record={record} options={options} action={action} />
      ) : (
        <p className="border-border bg-surface-2 rounded-md border px-4 py-3 text-sm">
          Your role is <strong>{user.role}</strong>, which is read-only. Ask an admin for
          editor access to make changes.
        </p>
      )}
    </>
  );
}
