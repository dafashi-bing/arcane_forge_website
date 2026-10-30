import { readCrmContact } from "@/lib/crm/data";
import { denyUnlessAllowed, failed, json } from "../../response";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await denyUnlessAllowed(); if (denied) return denied;
  try { const { id } = await params; const data = await readCrmContact(id); return data ? json(data) : json({ error: "Contact not found" }, 404); } catch (error) { return failed(error); }
}
