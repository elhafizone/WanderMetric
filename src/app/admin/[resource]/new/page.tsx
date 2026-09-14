import { notFound } from "next/navigation";

import { ResourceForm } from "@/components/admin/resource-form";
import { AdminHeader } from "@/components/admin/ui";
import { saveResource, type ActionState } from "@/lib/admin/actions";
import { loadReferenceOptions } from "@/lib/admin/references";
import { getResource, type ReferenceTable } from "@/lib/admin/resources";
import { requireStaff } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function NewResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = await params;
  const config = getResource(resource);
  if (!config) notFound();

  await requireStaff(config.adminOnly ? "admin" : "editor");

  const referenceTables = config.fields
    .filter((f) => f.kind === "reference" && f.referenceTable)
    .map((f) => f.referenceTable as ReferenceTable);
  const options = await loadReferenceOptions(referenceTables);

  // Bound to this resource with no id, so the same action serves create and edit.
  async function action(previous: ActionState, form: FormData) {
    "use server";
    return saveResource(resource, null, previous, form);
  }

  return (
    <>
      <AdminHeader
        title={`New ${config.labelSingular.toLowerCase()}`}
        description={config.description}
      />
      <ResourceForm config={config} record={null} options={options} action={action} />
    </>
  );
}
