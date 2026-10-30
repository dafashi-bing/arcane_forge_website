-- Internal CRM for arcane-forge-website. This schema is deliberately not in the Data API.
-- The agent login is provisioned separately; this migration never embeds a password.
CREATE SCHEMA crm;
REVOKE ALL ON SCHEMA crm FROM PUBLIC, anon, authenticated;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'crm_agent') THEN
    CREATE ROLE crm_agent NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  ELSE
    RAISE EXCEPTION 'crm_agent already exists; inspect its ownership before applying this migration';
  END IF;
END $$;
ALTER DEFAULT PRIVILEGES IN SCHEMA crm REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA crm REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

CREATE TABLE crm.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 300),
  normalized_name text GENERATED ALWAYS AS (lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))) STORED UNIQUE,
  website text,
  created_at timestamptz NOT NULL DEFAULT now(),
  recorded_by text NOT NULL
);
CREATE TABLE crm.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES crm.organizations(id),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 300),
  role text,
  normalized_name text GENERATED ALWAYS AS (lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  recorded_by text NOT NULL,
  UNIQUE(organization_id, normalized_name)
);
CREATE TABLE crm.contacts (
  id text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 150),
  organization_id uuid NOT NULL REFERENCES crm.organizations(id),
  person_id uuid REFERENCES crm.people(id),
  channel text NOT NULL CHECK (channel IN ('email','contact_form','linkedin','phone','other')),
  address text NOT NULL CHECK (length(btrim(address)) BETWEEN 1 AND 2000),
  normalized_address text GENERATED ALWAYS AS (lower(rtrim(btrim(address), '/'))) STORED,
  owner text NOT NULL CHECK (length(btrim(owner)) BETWEEN 1 AND 150),
  context jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  recorded_by text NOT NULL,
  UNIQUE(organization_id, channel, normalized_address)
);
CREATE TABLE crm.relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id text NOT NULL REFERENCES crm.contacts(id),
  relationship_type text NOT NULL CHECK (relationship_type IN ('pilot_prospect','customer','publisher','partner','investor','other')),
  created_at timestamptz NOT NULL DEFAULT now(),
  recorded_by text NOT NULL,
  UNIQUE(contact_id, relationship_type)
);
CREATE TABLE crm.relationship_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES crm.relationships(id),
  stage text NOT NULL CHECK (length(btrim(stage)) BETWEEN 1 AND 100),
  owner text NOT NULL CHECK (length(btrim(owner)) BETWEEN 1 AND 150),
  context jsonb NOT NULL DEFAULT '{}',
  outcome text,
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  recorded_by text NOT NULL,
  database_role text NOT NULL DEFAULT session_user
);
CREATE TABLE crm.research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id text NOT NULL REFERENCES crm.contacts(id),
  source_key text NOT NULL CHECK (length(btrim(source_key)) BETWEEN 1 AND 1000),
  source_url text,
  observed_at timestamptz NOT NULL,
  kind text NOT NULL CHECK (length(btrim(kind)) BETWEEN 1 AND 100),
  content jsonb NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  recorded_by text NOT NULL,
  UNIQUE(contact_id,source_key)
);
CREATE TABLE crm.interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id text NOT NULL REFERENCES crm.contacts(id),
  type text NOT NULL CHECK (type IN ('sent','human_reply','auto_reply','bounce','meeting','note','inbox_checked')),
  occurred_at timestamptz NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email','contact_form','linkedin','phone','other')),
  sending_account text,
  confirmation text NOT NULL CHECK (confirmation IN ('user_confirmed','observed')),
  evidence text NOT NULL CHECK (length(btrim(evidence)) BETWEEN 1 AND 10000),
  summary text NOT NULL CHECK (length(btrim(summary)) BETWEEN 1 AND 10000),
  outcome text,
  is_follow_up boolean NOT NULL DEFAULT false,
  inbox_state text CHECK (inbox_state IN ('no_reply','unknown')),
  checked_through timestamptz,
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  recorded_by text NOT NULL,
  database_role text NOT NULL DEFAULT session_user,
  CHECK(type NOT IN ('sent','inbox_checked') OR (sending_account IS NOT NULL AND length(btrim(sending_account)) > 0)),
  CHECK(NOT is_follow_up OR type = 'sent'),
  CHECK(type <> 'inbox_checked' OR (inbox_state IS NOT NULL AND checked_through IS NOT NULL AND checked_through <= occurred_at))
);
CREATE INDEX interactions_contact_time ON crm.interactions(contact_id, occurred_at DESC, recorded_at DESC);
CREATE TABLE crm.action_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL,
  contact_id text NOT NULL REFERENCES crm.contacts(id),
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 1 AND 2000),
  status text NOT NULL CHECK (status IN ('open','done','cancelled')),
  due_at timestamptz,
  owner text NOT NULL CHECK (length(btrim(owner)) BETWEEN 1 AND 150),
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  recorded_by text NOT NULL,
  database_role text NOT NULL DEFAULT session_user
);
CREATE INDEX action_events_latest ON crm.action_events(action_id, recorded_at DESC);
CREATE TABLE crm.imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL,
  captured_at timestamptz NOT NULL,
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[a-fA-F0-9]{64}$'),
  payload jsonb NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  recorded_by text NOT NULL
);
CREATE TABLE crm.receipts (
  idempotency_key text PRIMARY KEY,
  operation text NOT NULL,
  arguments jsonb NOT NULL,
  result jsonb NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  recorded_by text NOT NULL
);

-- Default deny at both privilege and row-security boundaries, including future Data API exposure.
ALTER TABLE crm.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.relationship_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.research ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.action_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA crm FROM PUBLIC, anon, authenticated, crm_agent;

CREATE FUNCTION crm.reject_history_change() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, crm AS $$
BEGIN RAISE EXCEPTION 'CRM history is append-only' USING ERRCODE = '42501'; END $$;
CREATE TRIGGER immutable_interactions BEFORE UPDATE OR DELETE ON crm.interactions FOR EACH ROW EXECUTE FUNCTION crm.reject_history_change();
CREATE TRIGGER immutable_action_events BEFORE UPDATE OR DELETE ON crm.action_events FOR EACH ROW EXECUTE FUNCTION crm.reject_history_change();
CREATE TRIGGER immutable_relationship_events BEFORE UPDATE OR DELETE ON crm.relationship_events FOR EACH ROW EXECUTE FUNCTION crm.reject_history_change();
CREATE TRIGGER immutable_research BEFORE UPDATE OR DELETE ON crm.research FOR EACH ROW EXECUTE FUNCTION crm.reject_history_change();
CREATE TRIGGER immutable_imports BEFORE UPDATE OR DELETE ON crm.imports FOR EACH ROW EXECUTE FUNCTION crm.reject_history_change();
CREATE TRIGGER immutable_receipts BEFORE UPDATE OR DELETE ON crm.receipts FOR EACH ROW EXECUTE FUNCTION crm.reject_history_change();

CREATE VIEW crm.current_relationships AS
 SELECT r.id, r.contact_id, r.relationship_type, e.stage, e.owner, e.context, e.outcome, e.recorded_at, e.recorded_by
 FROM crm.relationships r JOIN LATERAL (
   SELECT * FROM crm.relationship_events WHERE relationship_id=r.id ORDER BY recorded_at DESC,id DESC LIMIT 1
 ) e ON true;
CREATE VIEW crm.current_actions AS
 SELECT DISTINCT ON (action_id) * FROM crm.action_events ORDER BY action_id, recorded_at DESC,id DESC;
CREATE VIEW crm.contact_response AS
 SELECT c.id AS contact_id,
   s.first_sent_at, s.last_sent_at, s.send_count,
   r.last_human_reply_at, r.human_reply_count, a.last_auto_reply_at,
   CASE WHEN r.last_human_reply_at IS NOT NULL THEN 'human_reply'
        WHEN s.first_sent_at IS NULL THEN 'not_contacted'
        WHEN k.scope_count > 0 AND k.covered_scope_count=k.scope_count THEN 'verified_no_reply'
        ELSE 'unknown' END AS response_state,
   CASE WHEN k.covered_scope_count=k.scope_count THEN k.min_checked_through ELSE NULL END AS checked_through,
   k.last_recorded_at AS inbox_recorded_at,
   k.scope_count AS inbox_scope_count,k.covered_scope_count AS inbox_covered_scope_count,
   k.coverage AS inbox_coverage
 FROM crm.contacts c
 LEFT JOIN LATERAL (SELECT min(occurred_at) AS first_sent_at,max(occurred_at) AS last_sent_at,count(*) AS send_count FROM crm.interactions WHERE contact_id=c.id AND type='sent') s ON true
 LEFT JOIN LATERAL (SELECT max(occurred_at) AS last_human_reply_at,count(*) AS human_reply_count FROM crm.interactions WHERE contact_id=c.id AND type='human_reply' AND occurred_at >= s.first_sent_at) r ON true
 LEFT JOIN LATERAL (SELECT max(occurred_at) AS last_auto_reply_at FROM crm.interactions WHERE contact_id=c.id AND type='auto_reply' AND occurred_at >= s.first_sent_at) a ON true
 LEFT JOIN LATERAL (
   SELECT count(*) AS scope_count,
     count(*) FILTER (WHERE checked.inbox_state='no_reply' AND checked.checked_through>=scope.last_sent_at) AS covered_scope_count,
     min(checked.checked_through) AS min_checked_through,max(checked.recorded_at) AS last_recorded_at,
     coalesce(jsonb_agg(jsonb_build_object('channel',scope.channel,'sending_account',scope.sending_account,
       'last_sent_at',scope.last_sent_at,'latest_inbox_state',checked.inbox_state,
       'checked_through',checked.checked_through,'check_occurred_at',checked.occurred_at,
       'check_recorded_at',checked.recorded_at) ORDER BY scope.channel,scope.sending_account),'[]'::jsonb) AS coverage
   FROM (SELECT channel,sending_account,max(occurred_at) AS last_sent_at FROM crm.interactions
     WHERE contact_id=c.id AND type='sent' GROUP BY channel,sending_account) scope
   LEFT JOIN LATERAL (SELECT * FROM crm.interactions WHERE contact_id=c.id AND type='inbox_checked'
     AND channel=scope.channel AND sending_account=scope.sending_account
     ORDER BY occurred_at DESC,recorded_at DESC,id DESC LIMIT 1) checked ON true
 ) k ON true;

CREATE FUNCTION crm.timestamp_arg(v text, field_name text) RETURNS timestamptz
LANGUAGE plpgsql IMMUTABLE SET search_path = pg_catalog AS $$
BEGIN
 IF v IS NULL OR v !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$' THEN
   RAISE EXCEPTION '% requires an ISO timestamp with timezone',field_name USING ERRCODE='22023';
 END IF;
 RETURN v::timestamptz;
EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN
 RAISE EXCEPTION '% requires a valid ISO timestamp',field_name USING ERRCODE='22023';
END $$;

CREATE FUNCTION crm.command(p_operation text, p_args jsonb, p_actor text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, crm AS $$
DECLARE
 v_key text; v_receipt crm.receipts%ROWTYPE; v_result jsonb; v_record jsonb; v_research jsonb;
 v_org uuid; v_person uuid; v_relationship uuid; v_id uuid; v_action uuid; v_existing crm.contacts%ROWTYPE;
 v_type text; v_role text; v_stage text; v_owner text; v_contact text; v_channel text; v_address text;
 v_occurred timestamptz; v_due timestamptz; v_through timestamptz; v_capture timestamptz; v_observed timestamptz;
 v_created integer := 0; v_seen integer := 0; v_evidence integer := 0; v_limit integer; v_offset integer; v_total bigint; v_reply_total bigint; v_as_of timestamptz;
 v_before jsonb; v_after jsonb; v_events jsonb; v_actions jsonb;
BEGIN
 IF p_actor IS NULL OR length(btrim(p_actor)) NOT BETWEEN 1 AND 150 THEN
   RAISE EXCEPTION 'actor is required (1..150 characters)' USING ERRCODE='22023';
 END IF;
 IF p_args IS NULL OR jsonb_typeof(p_args) <> 'object' THEN
   RAISE EXCEPTION 'arguments must be an object' USING ERRCODE='22023';
 END IF;
 IF p_operation NOT IN ('import','search','history','interaction','action','relationship','due','summary') OR p_operation IS NULL THEN
   RAISE EXCEPTION 'unsupported CRM operation' USING ERRCODE='22023';
 END IF;
 IF p_operation IN ('import','interaction','action','relationship') THEN
   v_key := p_args->>'idempotency_key';
   IF v_key IS NULL OR length(btrim(v_key)) NOT BETWEEN 1 AND 200 THEN
     RAISE EXCEPTION 'idempotency_key required (1..200 characters)' USING ERRCODE='22023';
   END IF;
   PERFORM pg_advisory_xact_lock(hashtextextended('crm:'||v_key,0));
   SELECT * INTO v_receipt FROM crm.receipts WHERE idempotency_key=v_key;
   IF FOUND THEN
     IF v_receipt.operation <> p_operation OR v_receipt.arguments <> p_args THEN
       RAISE EXCEPTION 'idempotency_key already used with different arguments' USING ERRCODE='23505';
     END IF;
     RETURN v_receipt.result || jsonb_build_object('replayed',true);
   END IF;
 END IF;

 IF p_operation='import' THEN
   IF jsonb_typeof(p_args->'records') IS DISTINCT FROM 'array' OR jsonb_array_length(p_args->'records') NOT BETWEEN 1 AND 500
     OR jsonb_typeof(p_args->'source_key') IS DISTINCT FROM 'string'
     OR jsonb_typeof(p_args->'source_sha256') IS DISTINCT FROM 'string'
     OR length(btrim(coalesce(p_args->>'source_key',''))) NOT BETWEEN 1 AND 1000
     OR coalesce(p_args->>'source_sha256','') !~ '^[a-fA-F0-9]{64}$'
     OR (p_args ? 'interactions' AND jsonb_typeof(p_args->'interactions') <> 'array') THEN
     RAISE EXCEPTION 'import requires 1..500 records, source_key, SHA256 and an interactions array when supplied' USING ERRCODE='22023';
   END IF;
   v_capture:=crm.timestamp_arg(p_args->>'captured_at','captured_at');
   FOR v_record IN SELECT value FROM jsonb_array_elements(p_args->'records') LOOP
     v_contact:=v_record->>'contact_id';v_channel:=v_record->>'channel';v_address:=v_record->>'address';
     v_owner:=coalesce(v_record->>'owner','Bing');v_stage:=coalesce(v_record->>'stage','proposed');
     IF jsonb_typeof(v_record) <> 'object'
       OR jsonb_typeof(v_record->'contact_id') IS DISTINCT FROM 'string'
       OR jsonb_typeof(v_record->'organization_name') IS DISTINCT FROM 'string'
       OR jsonb_typeof(v_record->'channel') IS DISTINCT FROM 'string'
       OR jsonb_typeof(v_record->'address') IS DISTINCT FROM 'string'
       OR (v_record ? 'person_name' AND jsonb_typeof(v_record->'person_name') NOT IN ('string','null'))
       OR (v_record ? 'person_role' AND jsonb_typeof(v_record->'person_role') NOT IN ('string','null'))
       OR (v_record ? 'organization_website' AND jsonb_typeof(v_record->'organization_website') NOT IN ('string','null'))
       OR (v_record ? 'owner' AND jsonb_typeof(v_record->'owner') <> 'string')
       OR (v_record ? 'stage' AND jsonb_typeof(v_record->'stage') <> 'string')
       OR length(btrim(coalesce(v_contact,''))) NOT BETWEEN 1 AND 150
       OR length(btrim(coalesce(v_record->>'organization_name',''))) NOT BETWEEN 1 AND 300
       OR v_channel IS NULL OR v_channel NOT IN ('email','contact_form','linkedin','phone','other')
       OR length(btrim(coalesce(v_address,''))) NOT BETWEEN 1 AND 2000
       OR length(btrim(v_owner)) NOT BETWEEN 1 AND 150 OR length(btrim(v_stage)) NOT BETWEEN 1 AND 100
       OR jsonb_typeof(v_record->'relationship_types') IS DISTINCT FROM 'array'
       OR jsonb_array_length(v_record->'relationship_types') NOT BETWEEN 1 AND 10
       OR jsonb_typeof(coalesce(v_record->'context','{}'::jsonb)) <> 'object'
       OR (v_record ? 'research' AND jsonb_typeof(v_record->'research') <> 'array') THEN
       RAISE EXCEPTION 'invalid contact record in import' USING ERRCODE='22023';
     END IF;
     IF v_channel='email' AND v_address !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
       RAISE EXCEPTION 'invalid contact email' USING ERRCODE='22023';
     END IF;
     -- Lock normalized organization identity so concurrent imports cannot multiply it.
     PERFORM pg_advisory_xact_lock(hashtextextended('crm-org:'||lower(regexp_replace(btrim(v_record->>'organization_name'),'\s+',' ','g')),0));
     SELECT id INTO v_org FROM crm.organizations WHERE normalized_name=lower(regexp_replace(btrim(v_record->>'organization_name'),'\s+',' ','g'));
     IF NOT FOUND THEN
       INSERT INTO crm.organizations(name,website,recorded_by) VALUES(btrim(v_record->>'organization_name'),v_record->>'organization_website',p_actor) RETURNING id INTO v_org;
     ELSIF nullif(btrim(v_record->>'organization_website'),'') IS NOT NULL AND EXISTS(
       SELECT 1 FROM crm.organizations o WHERE o.id=v_org AND nullif(btrim(o.website),'') IS NOT NULL
         AND regexp_replace(regexp_replace(lower(btrim(o.website)),'^https?://([^/:?#]+).*$','\1'),'^www\.','')
           IS DISTINCT FROM regexp_replace(regexp_replace(lower(btrim(v_record->>'organization_website')),'^https?://([^/:?#]+).*$','\1'),'^www\.','')
     ) THEN
       RAISE EXCEPTION 'organization name matches but website host conflicts; review identity' USING ERRCODE='23505';
     END IF;
     v_person:=NULL;
     IF nullif(btrim(v_record->>'person_name'),'') IS NOT NULL THEN
       SELECT id INTO v_person FROM crm.people WHERE organization_id=v_org AND normalized_name=lower(regexp_replace(btrim(v_record->>'person_name'),'\s+',' ','g'));
       IF NOT FOUND THEN
         INSERT INTO crm.people(organization_id,name,role,recorded_by) VALUES(v_org,btrim(v_record->>'person_name'),v_record->>'person_role',p_actor) RETURNING id INTO v_person;
       END IF;
     END IF;
     SELECT * INTO v_existing FROM crm.contacts WHERE id=v_contact;
     IF FOUND THEN
       IF v_existing.organization_id IS DISTINCT FROM v_org OR v_existing.person_id IS DISTINCT FROM v_person
         OR v_existing.channel IS DISTINCT FROM v_channel OR v_existing.normalized_address IS DISTINCT FROM lower(rtrim(btrim(v_address),'/')) THEN
         RAISE EXCEPTION 'existing contact_id has conflicting identity; review before merging' USING ERRCODE='23505';
       END IF;
       v_seen:=v_seen+1;
     ELSE
       IF EXISTS(SELECT 1 FROM crm.contacts WHERE organization_id=v_org AND channel=v_channel AND normalized_address=lower(rtrim(btrim(v_address),'/'))) THEN
         RAISE EXCEPTION 'organization/contact route already has another stable ID; review duplicate' USING ERRCODE='23505';
       END IF;
       INSERT INTO crm.contacts(id,organization_id,person_id,channel,address,owner,context,recorded_by)
       VALUES(v_contact,v_org,v_person,v_channel,btrim(v_address),v_owner,coalesce(v_record->'context','{}'),p_actor);
       v_created:=v_created+1;
     END IF;
     FOR v_role IN SELECT value FROM jsonb_array_elements_text(v_record->'relationship_types') LOOP
       IF v_role NOT IN ('pilot_prospect','customer','publisher','partner','investor','other') THEN
         RAISE EXCEPTION 'invalid relationship type' USING ERRCODE='22023';
       END IF;
       SELECT id INTO v_relationship FROM crm.relationships WHERE contact_id=v_contact AND relationship_type=v_role;
       IF NOT FOUND THEN
         INSERT INTO crm.relationships(contact_id,relationship_type,recorded_by) VALUES(v_contact,v_role,p_actor) RETURNING id INTO v_relationship;
         INSERT INTO crm.relationship_events(relationship_id,stage,owner,context,recorded_by)
         VALUES(v_relationship,v_stage,v_owner,coalesce(v_record->'context','{}'),p_actor);
       END IF;
     END LOOP;
     FOR v_research IN SELECT value FROM jsonb_array_elements(coalesce(v_record->'research','[]')) LOOP
       IF length(btrim(coalesce(v_research->>'source_key',''))) NOT BETWEEN 1 AND 1000
         OR length(btrim(coalesce(v_research->>'kind',''))) NOT BETWEEN 1 AND 100 OR NOT(v_research ? 'content') THEN
         RAISE EXCEPTION 'research requires source_key, kind and content' USING ERRCODE='22023';
       END IF;
       v_observed:=CASE WHEN nullif(v_research->>'observed_at','') IS NULL THEN v_capture ELSE crm.timestamp_arg(v_research->>'observed_at','research observed_at') END;
       IF EXISTS(SELECT 1 FROM crm.research WHERE contact_id=v_contact AND source_key=v_research->>'source_key') THEN
         IF EXISTS(SELECT 1 FROM crm.research WHERE contact_id=v_contact AND source_key=v_research->>'source_key'
           AND (content IS DISTINCT FROM v_research->'content' OR source_url IS DISTINCT FROM v_research->>'source_url'
             OR kind IS DISTINCT FROM v_research->>'kind' OR observed_at IS DISTINCT FROM v_observed)) THEN
           RAISE EXCEPTION 'research source_key conflicts with existing evidence' USING ERRCODE='23505';
         END IF;
       ELSE
         INSERT INTO crm.research(contact_id,source_key,source_url,observed_at,kind,content,recorded_by)
         VALUES(v_contact,v_research->>'source_key',v_research->>'source_url',v_observed,v_research->>'kind',v_research->'content',p_actor);
         v_evidence:=v_evidence+1;
       END IF;
     END LOOP;
     IF v_existing.id IS NULL AND jsonb_typeof(v_record->'next_action')='object' THEN
       v_action:=gen_random_uuid();v_record:=v_record || jsonb_build_object('_action_id',v_action);
       INSERT INTO crm.action_events(action_id,contact_id,description,status,due_at,owner,recorded_by)
       VALUES(v_action,v_contact,v_record->'next_action'->>'description','open',CASE WHEN nullif(v_record->'next_action'->>'due_at','') IS NULL THEN NULL ELSE crm.timestamp_arg(v_record->'next_action'->>'due_at','next action due_at') END,coalesce(v_record->'next_action'->>'owner',v_owner),p_actor);
     END IF;
   END LOOP;
   FOR v_record IN SELECT value FROM jsonb_array_elements(coalesce(p_args->'interactions','[]')) LOOP
     PERFORM crm.command('interaction',v_record,p_actor);
   END LOOP;
   INSERT INTO crm.imports(source_key,captured_at,source_sha256,payload,recorded_by)
   VALUES(p_args->>'source_key',v_capture,p_args->>'source_sha256',p_args,p_actor) RETURNING id INTO v_id;
   v_result:=jsonb_build_object('import_id',v_id,'created_contacts',v_created,'existing_contacts',v_seen,'new_evidence',v_evidence,'records',jsonb_array_length(p_args->'records'));

 ELSIF p_operation='interaction' THEN
   v_contact:=p_args->>'contact_id';v_type:=p_args->>'type';v_channel:=p_args->>'channel';
   IF NOT EXISTS(SELECT 1 FROM crm.contacts WHERE id=v_contact) THEN RAISE EXCEPTION 'unknown contact_id' USING ERRCODE='22023';END IF;
   IF jsonb_typeof(p_args->'contact_id') IS DISTINCT FROM 'string'
     OR jsonb_typeof(p_args->'type') IS DISTINCT FROM 'string'
     OR jsonb_typeof(p_args->'channel') IS DISTINCT FROM 'string'
     OR jsonb_typeof(p_args->'confirmation') IS DISTINCT FROM 'string'
     OR jsonb_typeof(p_args->'evidence') IS DISTINCT FROM 'string'
     OR jsonb_typeof(p_args->'summary') IS DISTINCT FROM 'string'
     OR (p_args ? 'sending_account' AND jsonb_typeof(p_args->'sending_account') NOT IN ('string','null'))
     OR (p_args ? 'outcome' AND jsonb_typeof(p_args->'outcome') NOT IN ('string','null'))
     OR v_type IS NULL OR v_type NOT IN ('sent','human_reply','auto_reply','bounce','meeting','note','inbox_checked')
     OR v_channel IS NULL OR v_channel NOT IN ('email','contact_form','linkedin','phone','other')
     OR p_args->>'confirmation' IS NULL OR p_args->>'confirmation' NOT IN ('user_confirmed','observed')
     OR length(btrim(coalesce(p_args->>'evidence',''))) NOT BETWEEN 1 AND 10000
     OR length(btrim(coalesce(p_args->>'summary',''))) NOT BETWEEN 1 AND 10000
     OR (v_type IN ('sent','inbox_checked') AND length(btrim(coalesce(p_args->>'sending_account',''))) NOT BETWEEN 1 AND 1000)
     OR (p_args ? 'is_follow_up' AND jsonb_typeof(p_args->'is_follow_up') <> 'boolean')
     OR (coalesce((p_args->>'is_follow_up')::boolean,false) AND v_type<>'sent') THEN
     RAISE EXCEPTION 'invalid interaction: confirmation, evidence, channel, summary and sending account for sent/inbox_checked are required' USING ERRCODE='22023';
   END IF;
   v_occurred:=crm.timestamp_arg(p_args->>'occurred_at','occurred_at');
   IF v_occurred > now()+interval '5 minutes' THEN RAISE EXCEPTION 'interaction cannot occur in the future' USING ERRCODE='22023';END IF;
   v_through:=NULL;
   IF v_type='inbox_checked' THEN
     v_through:=crm.timestamp_arg(p_args->>'checked_through','checked_through');
     IF p_args->>'inbox_state' IS NULL OR p_args->>'inbox_state' NOT IN ('no_reply','unknown') OR v_through>v_occurred THEN
       RAISE EXCEPTION 'inbox_checked needs inbox_state and checked_through <= occurred_at' USING ERRCODE='22023';
     END IF;
   ELSIF p_args ? 'inbox_state' OR p_args ? 'checked_through' THEN
     RAISE EXCEPTION 'inbox_state and checked_through only belong to inbox_checked' USING ERRCODE='22023';
   END IF;
   INSERT INTO crm.interactions(contact_id,type,occurred_at,channel,sending_account,confirmation,evidence,summary,outcome,is_follow_up,inbox_state,checked_through,recorded_by)
   VALUES(v_contact,v_type,v_occurred,v_channel,p_args->>'sending_account',p_args->>'confirmation',p_args->>'evidence',p_args->>'summary',p_args->>'outcome',coalesce((p_args->>'is_follow_up')::boolean,false),p_args->>'inbox_state',v_through,p_actor) RETURNING id INTO v_id;
   IF nullif(p_args->>'follow_up_due_at','') IS NOT NULL THEN
     IF v_type <> 'sent' THEN RAISE EXCEPTION 'follow_up_due_at only belongs to sent' USING ERRCODE='22023';END IF;
     v_due:=crm.timestamp_arg(p_args->>'follow_up_due_at','follow_up_due_at');
     IF v_due<v_occurred THEN RAISE EXCEPTION 'follow-up due cannot precede send' USING ERRCODE='22023';END IF;
     v_action:=gen_random_uuid();
     INSERT INTO crm.action_events(action_id,contact_id,description,status,due_at,owner,recorded_by)
     SELECT v_action,v_contact,'Review conversation and decide whether Bing should follow up','open',v_due,owner,p_actor FROM crm.contacts WHERE id=v_contact;
   END IF;
   v_result:=jsonb_build_object('interaction_id',v_id,'contact_id',v_contact,'type',v_type,'follow_up_action_id',v_action);

 ELSIF p_operation='action' THEN
   v_contact:=p_args->>'contact_id';v_stage:=p_args->>'status';v_owner:=p_args->>'owner';
   IF NOT EXISTS(SELECT 1 FROM crm.contacts WHERE id=v_contact) OR v_stage IS NULL OR v_stage NOT IN ('open','done','cancelled')
     OR length(btrim(coalesce(p_args->>'description',''))) NOT BETWEEN 1 AND 2000
     OR length(btrim(coalesce(v_owner,''))) NOT BETWEEN 1 AND 150 THEN RAISE EXCEPTION 'invalid action' USING ERRCODE='22023';END IF;
   v_action:=coalesce(nullif(p_args->>'action_id','')::uuid,gen_random_uuid());
   IF p_args ? 'action_id' THEN
     IF NOT EXISTS(SELECT 1 FROM crm.action_events WHERE action_id=v_action AND contact_id=v_contact) THEN
       RAISE EXCEPTION 'action_id must identify an existing action for this contact' USING ERRCODE='22023';
     END IF;
   ELSIF v_stage<>'open' THEN RAISE EXCEPTION 'new actions must be open' USING ERRCODE='22023'; END IF;
   v_due:=CASE WHEN nullif(p_args->>'due_at','') IS NULL THEN NULL ELSE crm.timestamp_arg(p_args->>'due_at','due_at') END;
   INSERT INTO crm.action_events(action_id,contact_id,description,status,due_at,owner,recorded_by)
   VALUES(v_action,v_contact,p_args->>'description',v_stage,v_due,v_owner,p_actor) RETURNING id INTO v_id;
   v_result:=jsonb_build_object('action_id',v_action,'action_event_id',v_id,'status',v_stage);

 ELSIF p_operation='relationship' THEN
   v_contact:=p_args->>'contact_id';v_role:=p_args->>'relationship_type';v_stage:=p_args->>'stage';
   SELECT owner INTO v_owner FROM crm.contacts WHERE id=v_contact;
   IF NOT FOUND OR v_role IS NULL OR v_role NOT IN ('pilot_prospect','customer','publisher','partner','investor','other')
     OR length(btrim(coalesce(v_stage,''))) NOT BETWEEN 1 AND 100 OR jsonb_typeof(coalesce(p_args->'context','{}'))<>'object' THEN
     RAISE EXCEPTION 'invalid relationship' USING ERRCODE='22023';END IF;
   v_owner:=coalesce(p_args->>'owner',v_owner);
   IF length(btrim(v_owner)) NOT BETWEEN 1 AND 150 THEN RAISE EXCEPTION 'invalid relationship owner' USING ERRCODE='22023';END IF;
   PERFORM pg_advisory_xact_lock(hashtextextended('crm-relationship:'||v_contact||':'||v_role,0));
   SELECT id INTO v_relationship FROM crm.relationships WHERE contact_id=v_contact AND relationship_type=v_role;
   IF NOT FOUND THEN INSERT INTO crm.relationships(contact_id,relationship_type,recorded_by) VALUES(v_contact,v_role,p_actor) RETURNING id INTO v_relationship;END IF;
   INSERT INTO crm.relationship_events(relationship_id,stage,owner,context,outcome,recorded_by)
   VALUES(v_relationship,v_stage,v_owner,coalesce(p_args->'context','{}'),p_args->>'outcome',p_actor) RETURNING id INTO v_id;
   v_result:=jsonb_build_object('relationship_id',v_relationship,'relationship_event_id',v_id,'relationship_type',v_role,'stage',v_stage);

 ELSIF p_operation='search' THEN
   v_limit:=coalesce((p_args->>'limit')::integer,25);v_offset:=coalesce((p_args->>'offset')::integer,0);
   IF v_limit NOT BETWEEN 1 AND 100 OR v_offset<0 OR length(coalesce(p_args->>'query',''))>500
     OR (p_args ? 'contacted' AND jsonb_typeof(p_args->'contacted')<>'boolean')
     OR (p_args ? 'response_state' AND (jsonb_typeof(p_args->'response_state')<>'string' OR p_args->>'response_state' NOT IN ('not_contacted','unknown','verified_no_reply','human_reply')))
     OR (p_args ? 'relationship_type' AND (jsonb_typeof(p_args->'relationship_type')<>'string' OR p_args->>'relationship_type' NOT IN ('pilot_prospect','customer','publisher','partner','investor','other'))) THEN
     RAISE EXCEPTION 'invalid search query, filters, offset or limit' USING ERRCODE='22023';END IF;
   WITH matches AS (
     SELECT c.id AS contact_id,o.id AS organization_id,o.name AS organization,p.name AS person,c.channel,c.address,c.owner,
       r.first_sent_at,r.last_sent_at,r.last_human_reply_at,r.response_state,
       (SELECT jsonb_agg(to_jsonb(cr)) FROM crm.current_relationships cr WHERE cr.contact_id=c.id) AS relationships
     FROM crm.contacts c JOIN crm.organizations o ON o.id=c.organization_id LEFT JOIN crm.people p ON p.id=c.person_id JOIN crm.contact_response r ON r.contact_id=c.id
     WHERE lower(concat_ws(' ',c.id,o.name,p.name,c.address)) LIKE '%'||lower(coalesce(p_args->>'query',''))||'%'
       AND (NOT(p_args ? 'contacted') OR (r.first_sent_at IS NOT NULL)=(p_args->>'contacted')::boolean)
       AND (NOT(p_args ? 'response_state') OR r.response_state=p_args->>'response_state')
       AND (NOT(p_args ? 'relationship_type') OR EXISTS(SELECT 1 FROM crm.relationships rel WHERE rel.contact_id=c.id AND rel.relationship_type=p_args->>'relationship_type'))
   ), page AS (SELECT * FROM matches ORDER BY organization,contact_id LIMIT v_limit OFFSET v_offset)
   SELECT jsonb_build_object('contacts',(SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.organization,q.contact_id),'[]') FROM page q),
     'total',count(*),'limit',v_limit,'offset',v_offset,
     'next_offset',CASE WHEN v_offset::bigint+v_limit<count(*) THEN v_offset::bigint+v_limit ELSE NULL END) INTO v_result FROM matches;

 ELSIF p_operation='history' THEN
   v_contact:=p_args->>'contact_id';SELECT * INTO v_existing FROM crm.contacts WHERE id=v_contact;
   IF NOT FOUND THEN RAISE EXCEPTION 'unknown contact_id' USING ERRCODE='22023';END IF;
   SELECT jsonb_build_object('contact',to_jsonb(c),'organization',to_jsonb(o),'person',to_jsonb(p),'response',to_jsonb(r),
     'organization_contacts',(SELECT coalesce(jsonb_agg(to_jsonb(oc)),'[]') FROM crm.contacts oc WHERE oc.organization_id=c.organization_id),
     'organization_interactions',(SELECT coalesce(jsonb_agg(to_jsonb(oi) ORDER BY oi.occurred_at,oi.recorded_at),'[]') FROM crm.interactions oi JOIN crm.contacts oc ON oc.id=oi.contact_id WHERE oc.organization_id=c.organization_id),
     'organization_research',(SELECT coalesce(jsonb_agg(to_jsonb(ore) ORDER BY ore.observed_at),'[]') FROM crm.research ore JOIN crm.contacts oc ON oc.id=ore.contact_id WHERE oc.organization_id=c.organization_id),
     'relationships',(SELECT coalesce(jsonb_agg(to_jsonb(cr)),'[]') FROM crm.current_relationships cr WHERE cr.contact_id=c.id),
     'relationship_history',(SELECT coalesce(jsonb_agg(to_jsonb(re) ORDER BY re.recorded_at),'[]') FROM crm.relationship_events re JOIN crm.relationships rel ON rel.id=re.relationship_id WHERE rel.contact_id=c.id),
     'research',(SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY e.observed_at),'[]') FROM crm.research e WHERE e.contact_id=c.id),
     'interactions',(SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.occurred_at,i.recorded_at),'[]') FROM crm.interactions i WHERE i.contact_id=c.id),
     'actions',(SELECT coalesce(jsonb_agg(to_jsonb(ac)),'[]') FROM crm.current_actions ac WHERE ac.contact_id=c.id),
     'action_history',(SELECT coalesce(jsonb_agg(to_jsonb(ae) ORDER BY ae.recorded_at),'[]') FROM crm.action_events ae WHERE ae.contact_id=c.id)) INTO v_result
   FROM crm.contacts c JOIN crm.organizations o ON o.id=c.organization_id LEFT JOIN crm.people p ON p.id=c.person_id JOIN crm.contact_response r ON r.contact_id=c.id WHERE c.id=v_contact;

 ELSIF p_operation='due' THEN
   v_limit:=coalesce((p_args->>'limit')::integer,50);v_offset:=coalesce((p_args->>'offset')::integer,0);
   v_as_of:=CASE WHEN nullif(p_args->>'as_of','') IS NULL THEN now() ELSE crm.timestamp_arg(p_args->>'as_of','as_of') END;
   IF v_limit NOT BETWEEN 1 AND 100 OR v_offset<0 THEN RAISE EXCEPTION 'invalid due offset or limit' USING ERRCODE='22023';END IF;
   SELECT count(*) INTO v_total FROM crm.current_actions WHERE status='open' AND due_at<=v_as_of;
   SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.due_at,q.action_id),'[]') INTO v_actions FROM (
     SELECT a.*,o.name AS organization,p.name AS person FROM crm.current_actions a JOIN crm.contacts c ON c.id=a.contact_id JOIN crm.organizations o ON o.id=c.organization_id LEFT JOIN crm.people p ON p.id=c.person_id
     WHERE a.status='open' AND a.due_at<=v_as_of ORDER BY a.due_at,a.action_id LIMIT v_limit OFFSET v_offset
   ) q;
   WITH replies AS (
     SELECT c.id AS contact_id,o.name AS organization,p.name AS person,r.last_human_reply_at,r.response_state,
       (SELECT i.outcome FROM crm.interactions i WHERE i.contact_id=c.id ORDER BY i.occurred_at DESC,i.recorded_at DESC LIMIT 1) AS latest_outcome
     FROM crm.contacts c JOIN crm.organizations o ON o.id=c.organization_id LEFT JOIN crm.people p ON p.id=c.person_id JOIN crm.contact_response r ON r.contact_id=c.id
     WHERE r.last_human_reply_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM crm.interactions i WHERE i.contact_id=c.id AND i.occurred_at>=r.last_human_reply_at AND i.outcome IS NOT NULL)
   ), page AS (SELECT * FROM replies ORDER BY last_human_reply_at DESC,contact_id LIMIT v_limit OFFSET v_offset)
   SELECT count(*),(SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.last_human_reply_at DESC,q.contact_id),'[]') FROM page q) INTO v_reply_total,v_events FROM replies;
   v_result:=jsonb_build_object('as_of',v_as_of,'due_actions',v_actions,'human_replies_needing_review',v_events,
     'due_actions_total',v_total,'human_replies_needing_review_total',v_reply_total,'limit',v_limit,'offset',v_offset,
     'next_offset',CASE WHEN v_offset::bigint+v_limit<greatest(v_total,v_reply_total) THEN v_offset::bigint+v_limit ELSE NULL END,
     'note','Each queue applies offset independently. An action is a reminder for Bing; no message will be sent automatically. Replies without a recorded outcome are review candidates, not inferred unread inbox messages.');

 ELSIF p_operation='summary' THEN
   IF p_args ? 'since' OR p_args ? 'until' THEN RAISE EXCEPTION 'summary currently supports lifetime metrics only; omit since/until' USING ERRCODE='22023';END IF;
   SELECT jsonb_build_object('scope','lifetime','contacts',count(*),'organizations',(SELECT count(*) FROM crm.organizations),
     'contacted_unique',count(*) FILTER(WHERE first_sent_at IS NOT NULL),
     'human_replied_unique',count(*) FILTER(WHERE first_sent_at IS NOT NULL AND last_human_reply_at IS NOT NULL),
     'auto_replied_unique',count(*) FILTER(WHERE first_sent_at IS NOT NULL AND last_auto_reply_at IS NOT NULL),
     'send_events',coalesce(sum(send_count),0),
     'human_reply_rate',round((count(*) FILTER(WHERE first_sent_at IS NOT NULL AND last_human_reply_at IS NOT NULL))::numeric/nullif(count(*) FILTER(WHERE first_sent_at IS NOT NULL),0),4),
     'inbox_unknown',count(*) FILTER(WHERE response_state='unknown'),
     'verified_no_reply',count(*) FILTER(WHERE response_state='verified_no_reply'),
     'not_contacted',count(*) FILTER(WHERE response_state='not_contacted'),
     'due_actions',(SELECT count(*) FROM crm.current_actions WHERE status='open' AND due_at<=now()),
     'open_actions',(SELECT count(*) FROM crm.current_actions WHERE status='open'),
     'metric_definition',jsonb_build_object('unit','stable contact_id (one public contact route/person record)',
       'denominator','Distinct contact IDs with at least one recorded actual/user-confirmed sent event, lifetime.',
       'numerator','Those same outbound contact IDs with at least one human_reply at or after their first sent timestamp.',
       'followups','Additional sent events for the same contact do not increase unique-contact counts.',
       'auto_replies','Reported separately and excluded from human numerator.',
       'no_reply','Every distinct sent(channel,sending_account) scope needs its latest matching inbox_checked no_reply covering that scope latest send; missing, mismatched, stale or latest-unknown checks leave unknown.',
       'rate','null when denominator is zero; otherwise numerator divided by denominator (0..1).',
       'delivery_adjustment','No delivery-adjusted denominator. Bounces remain in the contacted denominator. No inbox synchronization.')) INTO v_result
   FROM crm.contact_response;
 END IF;
 IF p_operation IN ('import','interaction','action','relationship') THEN
   INSERT INTO crm.receipts(idempotency_key,operation,arguments,result,recorded_by) VALUES(v_key,p_operation,p_args,v_result,p_actor);
 END IF;
 RETURN v_result;
END $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA crm FROM PUBLIC,anon,authenticated,crm_agent;
REVOKE ALL ON ALL TABLES IN SCHEMA crm FROM PUBLIC,anon,authenticated,crm_agent;
GRANT USAGE ON SCHEMA crm TO crm_agent;
GRANT EXECUTE ON FUNCTION crm.command(text,jsonb,text) TO crm_agent;
COMMENT ON SCHEMA crm IS 'Private internal CRM. Agent can execute only crm.command; no direct table grants and no public/customer policies.';
COMMENT ON FUNCTION crm.command(text,jsonb,text) IS 'Validated internal CRM commands. All mutations require idempotency_key. History is append-only. Actor is the declared recorder; database_role records the connection identity.';
