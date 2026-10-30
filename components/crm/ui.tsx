import Link from "next/link";
import type { ReactNode } from "react";

type Access = { status: "allowed"; user: { id: string; email: string } } | { status: "unauthenticated" | "forbidden" | "unconfigured" };
export const contactPath = (id: string) => `/internal/crm/contacts/${encodeURIComponent(id)}`;
export function label(value: unknown): string { return typeof value === "string" ? value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()) : "—"; }
export function timestamp(value: unknown): string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return "Not recorded";
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(value));
}
export function sourceDate(value: unknown): string {
  if (typeof value === "number" && value > 0 && value < 100000) return new Date(Date.UTC(1899, 11, 30) + value * 86400000).toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return typeof value === "string" && value ? value : "Not recorded";
}
export function PrivateLink({ href, children, className, "aria-current": ariaCurrent }: { href: string; children: ReactNode; className?: string; "aria-current"?: "page" }) {
  return <Link href={href} prefetch={false} className={className} aria-current={ariaCurrent}>{children}</Link>;
}
export function CrmShell({ active, children }: { active: "today" | "relationships"; children: ReactNode }) {
  return <div className="crm-workspace"><aside className="crm-sidebar"><PrivateLink href="/internal/crm" className="crm-brand"><span className="crm-brand-mark" aria-hidden="true">AF</span><span>Arcane Forge<small>Internal workspace</small></span></PrivateLink><div className="crm-nav-label">RELATIONSHIPS</div><nav aria-label="CRM"><PrivateLink href="/internal/crm" className={active === "today" ? "is-active" : ""}><span aria-hidden="true">◷</span> Today</PrivateLink><PrivateLink href="/internal/crm/relationships" className={active === "relationships" ? "is-active" : ""}><span aria-hidden="true">◎</span> Relationships</PrivateLink></nav><div className="crm-sidebar-bottom"><span className="crm-private-dot" /> Private · Read only<p>Records are updated through the assistant. Every message is sent by Bing.</p><PrivateLink href="/">Back to website ↗</PrivateLink></div></aside><main className="crm-main" id="crm-main"><div className="crm-topline"><span>CRM <span aria-hidden="true">/</span> {active === "today" ? "Today" : "Relationships"}</span><span className="crm-readonly">Read only</span></div>{children}</main></div>;
}
export function CrmGate({ access, next = "/internal/crm" }: { access: Exclude<Access, { status: "allowed" }>; next?: string }) {
  const content = {
    unauthenticated: ["Sign in to your workspace", "Use your existing Arcane Forge account. Internal access is limited to the explicitly allowed account."],
    forbidden: ["Internal access required", "This signed-in account does not have access to the private CRM."],
    unconfigured: ["Internal access is not configured", "The CRM is protected. An administrator must finish the allowed-account configuration before it can be opened."],
  }[access.status];
  return <div className="crm-gate"><div className="crm-brand-mark" aria-hidden="true">AF</div><p className="crm-eyebrow">ARCANE FORGE · PRIVATE CRM</p><h1>{content[0]}</h1><p>{content[1]}</p><div className="crm-gate-actions">{access.status !== "unconfigured" && <PrivateLink className="crm-button" href={`/login?next=${encodeURIComponent(next)}`}>{access.status === "forbidden" ? "Open sign-in" : "Sign in"}</PrivateLink>}<PrivateLink href="/" className="crm-text-link">Back to website</PrivateLink></div></div>;
}
export function CrmUnavailable() { return <div className="crm-message" role="alert"><h2>CRM data is temporarily unavailable</h2><p>Your access remains protected. Try refreshing this page, or ask the assistant to check the private reader configuration.</p></div>; }
export function PageHeading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) { return <header className="crm-page-heading">{eyebrow && <p className="crm-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{children && <p>{children}</p>}</header>; }
export function Panel({ title, count, note, children, className = "" }: { title: string; count?: number; note?: string; children: ReactNode; className?: string }) { return <section className={`crm-panel ${className}`}><div className="crm-panel-heading"><h2>{title}</h2>{count !== undefined && <span className="crm-count">{count}</span>}</div>{note && <p className="crm-panel-note">{note}</p>}{children}</section>; }
export function Empty({ children }: { children: ReactNode }) { return <p className="crm-empty">{children}</p>; }
export function Status({ value }: { value: string }) { return <span className={`crm-status crm-status-${value}`}>{label(value)}</span>; }
export function Pagination({ base, offset, nextOffset, total, limit, params = {} }: { base: string; offset: number; nextOffset: number | null; total: number; limit: number; params?: Record<string, string> }) {
  const url = (n: number) => { const query = new URLSearchParams(params); if (n) query.set("offset", String(n)); return `${base}${query.size ? `?${query.toString()}` : ""}`; };
  if (offset === 0 && nextOffset === null) return null;
  return <nav className="crm-pagination" aria-label="Results pagination"><span>{total ? `${offset + 1}–${Math.min(offset + limit, total)} of ${total}` : "No results on this page"}</span><div>{offset > 0 && <PrivateLink href={url(Math.max(0, offset - limit))}>← Previous</PrivateLink>}{nextOffset !== null && <PrivateLink href={url(nextOffset)}>Next →</PrivateLink>}</div></nav>;
}
export function ExternalSource({ href, children }: { href: unknown; children: ReactNode }) {
  try { const url = new URL(String(href)); if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return <span>{children}</span>; return <a href={url.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{children} <span aria-hidden="true">↗</span></a>; } catch { return <span>{children}</span>; }
}
export function Fields({ values }: { values: Record<string, unknown> }) { return <dl className="crm-fields">{Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== "").map(([key, value]) => <div key={key}><dt>{label(key)}</dt><dd>{typeof value === "object" ? <pre>{JSON.stringify(value, null, 2)}</pre> : String(value)}</dd></div>)}</dl>; }
