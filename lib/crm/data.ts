import 'server-only';
import { unstable_noStore as noStore } from 'next/cache';
import pg from 'pg';
import { requireCrmAccess } from './auth';
import { executeWebRead, CrmReadError } from './reader.mjs';
import type { CrmToday, CrmRelationships, CrmContact } from './types';

export { CrmReadError };
export type CrmPagination = { limit?: number; offset?: number };
export type CrmRelationshipQuery = CrmPagination & { query?: string; relationship_type?: string; stage?: string; response_state?: string };

export async function readCrm(operation: 'today' | 'relationships' | 'contact', args: Record<string, unknown> = {}) {
  noStore();
  // This authorization lives at the data boundary even if a page/layout has
  // already checked access. Direct route and nested page reads cannot skip it.
  await requireCrmAccess();
  return executeWebRead({ operation, args, Client: pg.Client });
}
export async function readCrmToday(args: CrmPagination = {}): Promise<CrmToday> { return readCrm('today',args); }
export async function readCrmRelationships(args: CrmRelationshipQuery = {}): Promise<CrmRelationships> { return readCrm('relationships',args); }
export async function readCrmContact(contactId: string): Promise<CrmContact | null> { return readCrm('contact',{ contact_id: contactId }); }
