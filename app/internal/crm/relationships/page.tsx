import { getCrmAccess } from "@/lib/crm/auth";
import { readCrmRelationships } from "@/lib/crm/data";
import { CrmGate, CrmShell, CrmUnavailable, PageHeading } from "@/components/crm/ui";
import RelationshipsBrowser from "@/components/crm/RelationshipsBrowser";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function RelationshipsPage() {
  const access = await getCrmAccess();
  if (access.status !== "allowed") return <CrmGate access={access} next="/internal/crm/relationships" />;
  let data;
  try { data = await readCrmRelationships({ limit: 12, offset: 0 }); }
  catch { return <CrmShell active="relationships"><PageHeading title="Relationships" /><CrmUnavailable /></CrmShell>; }
  return <CrmShell active="relationships"><PageHeading eyebrow="ORGANIZATIONS & CONTACT ROUTES" title="Relationships">Research, recorded conversations, and the evidence behind each next step.</PageHeading><RelationshipsBrowser initialData={data} /></CrmShell>;
}
