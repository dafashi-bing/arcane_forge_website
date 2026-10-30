import { NextResponse } from "next/server";
import { getCrmAccess } from "@/lib/crm/auth";
const headers = { "Cache-Control": "private, no-store, max-age=0", "Pragma": "no-cache", "X-Robots-Tag": "noindex, nofollow, noarchive", "Referrer-Policy": "no-referrer", "Vary": "Cookie" };
export function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers }); }
export async function denyUnlessAllowed() {
  const access = await getCrmAccess();
  if (access.status === "allowed") return null;
  const status = access.status === "unauthenticated" ? 401 : access.status === "forbidden" ? 403 : 503;
  return json({ error: status === 401 ? "Sign-in required" : status === 403 ? "Internal access required" : "Internal access unavailable" }, status);
}
export function failed(error: unknown) {
  const status = typeof error === "object" && error !== null && "statusCode" in error && [400, 401, 403, 404, 503].includes(Number(error.statusCode)) ? Number(error.statusCode) : 503;
  const message = { 400: "Invalid CRM request", 401: "Sign-in required", 403: "Internal access required", 404: "Contact not found", 503: "CRM data unavailable" }[status];
  return json({ error: message }, status);
}
export function numberParam(value: string | null, fallback: number): number { return value === null ? fallback : /^\d+$/.test(value) ? Number(value) : NaN; }
