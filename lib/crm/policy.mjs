// Pure policy: the server must supply a user returned by Supabase auth.getUser().
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export function evaluateCrmAccess(user, authError, env = process.env) {
  const id = env.CRM_ALLOWED_USER_ID;
  const email = env.CRM_ALLOWED_USER_EMAIL;
  if (typeof id !== 'string' || !UUID.test(id) || typeof email !== 'string' ||
      !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(email) || id !== id.trim() || email !== email.trim()) {
    return { status: 'unconfigured' };
  }
  if (authError || !user) return { status: 'unauthenticated' };
  if (user.id !== id || typeof user.email !== 'string' || user.email.toLowerCase() !== email.toLowerCase() ||
      user.is_anonymous === true || user.aud !== 'authenticated' || user.role !== 'authenticated' ||
      typeof user.email_confirmed_at !== 'string' || !Number.isFinite(Date.parse(user.email_confirmed_at)) ||
      Date.parse(user.email_confirmed_at) > Date.now()) return { status: 'forbidden' };
  return { status: 'allowed', user: { id: user.id, email: user.email } };
}

export class CrmAccessError extends Error {
  constructor(status) {
    const statusCode = status === 'unauthenticated' ? 401 : status === 'forbidden' ? 403 : 503;
    super(statusCode === 401 ? 'Sign in to continue.' : statusCode === 403 ? 'This account does not have internal access.' : 'Internal access is not configured.');
    this.name = 'CrmAccessError'; this.status = status; this.statusCode = statusCode;
  }
}
