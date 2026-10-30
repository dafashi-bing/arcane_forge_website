import 'server-only';
import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { evaluateCrmAccess, CrmAccessError } from './policy.mjs';

export { CrmAccessError };
export type CrmAccess =
  | { status: 'allowed'; user: { id: string; email: string } }
  | { status: 'unauthenticated' | 'forbidden' | 'unconfigured' };

export async function getCrmAccess(): Promise<CrmAccess> {
  noStore();
  try {
    // getUser verifies the session with the Auth server. Never authorize from
    // getSession(), a decoded JWT, request headers or browser-controlled metadata.
    const supabase = await createClient({ fetchTimeoutMs: 8000 });
    const { data: { user }, error } = await supabase.auth.getUser();
    return evaluateCrmAccess(user, error) as CrmAccess;
  } catch {
    return evaluateCrmAccess(null, true) as CrmAccess;
  }
}

export async function requireCrmAccess() {
  const access = await getCrmAccess();
  if (access.status !== 'allowed') throw new CrmAccessError(access.status);
  return access.user;
}
