export type JsonObject = Record<string, any>;
export interface CrmRelationship {
  id: string; contact_id: string; relationship_type: string; stage: string;
  owner: string; context: JsonObject; outcome: string | null; recorded_at: string; recorded_by: string;
}
export interface CrmContactRow {
  contact_id: string; organization_id: string; organization: string; person: string | null; person_role?: string | null;
  channel: string; address: string; owner: string; first_sent_at: string | null; last_sent_at: string | null;
  last_human_reply_at: string | null; response_state: string; relationships: CrmRelationship[];
}
export interface CrmAction {
  id: string; action_id: string; contact_id: string; description: string; status: string;
  due_at: string | null; owner: string; recorded_at: string; recorded_by: string;
  organization?: string; person?: string | null;
}
export interface CrmSummary {
  scope: string; contacts: number; organizations: number; contacted_unique: number; human_replied_unique: number;
  auto_replied_unique: number; send_events: number; human_reply_rate: number | null; inbox_unknown: number;
  verified_no_reply: number; not_contacted: number; due_actions: number; open_actions: number;
  metric_definition: Record<string,string>;
}
export interface CrmQueues {
  as_of: string; due_actions: CrmAction[];
  human_replies_needing_review: { contact_id: string; organization: string; person: string | null; last_human_reply_at: string; response_state: string; latest_outcome: string | null }[];
  due_actions_total: number; human_replies_needing_review_total: number; limit: number; offset: number; next_offset: number | null; note: string;
}
export interface CrmToday {
  summary: CrmSummary; queues: CrmQueues;
  unscheduled_actions: CrmAction[]; unscheduled_actions_total: number; unscheduled_next_offset: number | null;
  recent_imports: { id: string; source_key: string; captured_at: string; recorded_at: string; contact_count: number }[];
  recent_research: { id: string; contact_id: string; kind: string; source_key: string; source_url: string | null; observed_at: string; recorded_at: string; organization: string }[];
  research_batches: { batch_date: string | null; contacts: number; latest_imported_at: string }[];
  limit: number; offset: number;
}
export interface CrmRelationships {
  contacts: CrmContactRow[]; total: number; limit: number; offset: number; next_offset: number | null;
  filter_options: { stages: string[]; relationship_types: string[] };
}
export interface CrmContact {
  contact: { id: string; organization_id: string; person_id: string | null; channel: string; address: string; owner: string; context: JsonObject; created_at: string; recorded_by: string };
  organization: { id: string; name: string; website: string | null; created_at: string; recorded_by: string };
  person: { id: string; name: string; role: string | null } | null;
  response: JsonObject;
  organization_contacts: JsonObject[]; organization_interactions: JsonObject[]; organization_research: JsonObject[];
  relationships: CrmRelationship[]; relationship_history: JsonObject[];
  research: JsonObject[]; interactions: JsonObject[]; actions: CrmAction[]; action_history: JsonObject[];
}
