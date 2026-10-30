"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { CrmRelationships } from "@/lib/crm/types";
import { Empty, PrivateLink, Status, contactPath, label, timestamp } from "./ui";

type Filters = { query: string; relationship_type: string; stage: string; response_state: string };
const EMPTY_FILTERS: Filters = { query: "", relationship_type: "", stage: "", response_state: "" };
const PAGE_SIZE = 12;

export default function RelationshipsBrowser({ initialData }: { initialData: CrmRelationships }) {
  const [data, setData] = useState<CrmRelationships | null>(initialData);
  const [draft, setDraft] = useState<Filters>({ ...EMPTY_FILTERS });
  const [applied, setApplied] = useState<Filters>({ ...EMPTY_FILTERS });
  const [options, setOptions] = useState(initialData.filter_options);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState<401 | 403 | null>(null);
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);

  useEffect(() => () => { sequence.current++; controller.current?.abort(); }, []);

  async function load(filters: Filters, offset: number) {
    controller.current?.abort();
    const current = ++sequence.current;
    const abort = new AbortController();
    controller.current = abort;
    setLoading(true);
    setError(null);
    const body = {
      ...(filters.query && { query: filters.query }),
      ...(filters.relationship_type && { relationship_type: filters.relationship_type }),
      ...(filters.stage && { stage: filters.stage }),
      ...(filters.response_state && { response_state: filters.response_state }),
      limit: PAGE_SIZE,
      offset,
    };
    try {
      // Private search text stays in this POST body and component memory.
      const response = await fetch("/api/internal/crm/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
        cache: "no-store",
        redirect: "error",
        signal: abort.signal,
      });
      if (current !== sequence.current) return;
      if (response.status === 401 || response.status === 403) {
        setData(null);
        setDraft({ ...EMPTY_FILTERS });
        setApplied({ ...EMPTY_FILTERS });
        setOptions({ stages: [], relationship_types: [] });
        setDenied(response.status);
        return;
      }
      if (!response.ok) throw new Error("Read failed");
      const result: CrmRelationships = await response.json();
      if (current !== sequence.current) return;
      if (!Array.isArray(result.contacts) || !result.filter_options || !Array.isArray(result.filter_options.stages) || !Array.isArray(result.filter_options.relationship_types)) throw new Error("Read failed");
      setData(result);
      setOptions(result.filter_options);
      setApplied({ ...filters });
      setDenied(null);
    } catch {
      if (current !== sequence.current || abort.signal.aborted) return;
      setData(null);
      setError("Relationships could not be loaded. Try the search again.");
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void load({ ...draft }, 0); }
  function clear() { const empty = { ...EMPTY_FILTERS }; setDraft(empty); void load(empty, 0); }

  if (denied) return <div className="crm-message" role="alert"><h2>{denied === 401 ? "Sign in to continue" : "Internal access required"}</h2><p>{denied === 401 ? "Your session is no longer available. Sign in again to open the private workspace." : "This account does not have access to the private CRM."}</p><PrivateLink className="crm-button" href="/login?next=%2Finternal%2Fcrm%2Frelationships">Open sign-in</PrivateLink></div>;
  const hasFilters = Object.values(applied).some(Boolean);
  return <>
    <form className="crm-filters" method="post" action="/internal/crm/relationships" onSubmit={submit} autoComplete="off">
      <div className="crm-search-field"><label htmlFor="crm-search">Search organizations or contacts</label><input id="crm-search" type="search" value={draft.query} onChange={event => setDraft({ ...draft, query: event.target.value })} maxLength={500} autoComplete="off" placeholder="Organization, person, address, or contact ID" /></div>
      <div><label htmlFor="crm-role">Relationship role</label><select id="crm-role" value={draft.relationship_type} onChange={event => setDraft({ ...draft, relationship_type: event.target.value })}><option value="">All roles</option>{options.relationship_types.map(role => <option key={role} value={role}>{label(role)}</option>)}</select></div>
      <div><label htmlFor="crm-stage">Stage</label><select id="crm-stage" value={draft.stage} onChange={event => setDraft({ ...draft, stage: event.target.value })}><option value="">All stages</option>{options.stages.map(stage => <option key={stage} value={stage}>{label(stage)}</option>)}</select></div>
      <div><label htmlFor="crm-response">Response state</label><select id="crm-response" value={draft.response_state} onChange={event => setDraft({ ...draft, response_state: event.target.value })}><option value="">All states</option>{["not_contacted", "unknown", "verified_no_reply", "human_reply"].map(state => <option key={state} value={state}>{label(state)}</option>)}</select></div>
      <button className="crm-button" type="submit" disabled={loading}>{loading ? "Searching…" : "Search"}</button>
    </form>
    <noscript><p className="crm-footnote">Search and filters require JavaScript. The initial contact records are shown below.</p></noscript>
    <div className="crm-results-heading" aria-live="polite"><p>{loading ? "Loading relationships…" : data ? <><strong>{data.total}</strong> matching contact {data.total === 1 ? "record" : "records"}</> : "Results unavailable"}</p>{hasFilters && <button className="crm-clear-button" type="button" onClick={clear} disabled={loading}>Clear filters</button>}</div>
    {error && <div className="crm-message" role="alert"><p>{error}</p></div>}
    {data && <div aria-busy={loading}>
      {data.contacts.length ? <div className="crm-contact-grid">{data.contacts.map(contact => <article className="crm-contact-card" key={contact.contact_id}><div className="crm-row-title"><span className="crm-org-avatar" aria-hidden="true">{contact.organization.slice(0, 1).toUpperCase()}</span><Status value={contact.response_state} /></div><h2><PrivateLink href={contactPath(contact.contact_id)}>{contact.organization}<span aria-hidden="true"> ↗</span></PrivateLink></h2><p className="crm-person">{contact.person || "Public contact route"}</p><p className="crm-contact-address"><span>{label(contact.channel)}</span> {contact.address}</p><div className="crm-role-list">{(contact.relationships || []).map(relationship => <span key={relationship.id || relationship.relationship_type}>{label(relationship.relationship_type)}<b> · </b>{label(relationship.stage)}</span>)}</div><div className="crm-contact-meta"><span>{contact.last_sent_at ? `Last sent ${timestamp(contact.last_sent_at)}` : "No recorded send"}</span><small>{contact.contact_id}</small></div></article>)}</div> : <div className="crm-panel"><Empty>No contacts match these filters.</Empty></div>}
      {(data.offset > 0 || data.next_offset !== null) && <nav className="crm-pagination" aria-label="Results pagination"><span>{data.total ? `${data.offset + 1}–${Math.min(data.offset + data.limit, data.total)} of ${data.total}` : "No results on this page"}</span><div>{data.offset > 0 && <button type="button" onClick={() => void load(applied, Math.max(0, data.offset - data.limit))} disabled={loading}>← Previous</button>}{data.next_offset !== null && <button type="button" onClick={() => void load(applied, data.next_offset!)} disabled={loading}>Next →</button>}</div></nav>}
    </div>}
    <p className="crm-footnote">Each record represents one stable contact route or person. Several routes can belong to one organization. Unknown reply status is not evidence of no reply.</p>
  </>;
}
