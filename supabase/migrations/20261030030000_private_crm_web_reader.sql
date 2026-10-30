-- Additive, private read boundary for the website. Passwords are provisioned separately.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='crm_web') THEN
    RAISE EXCEPTION 'crm_web already exists; inspect its ownership before applying';
  END IF;
  CREATE ROLE crm_web NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
END $$;

-- The role has no table access and cannot execute the mutating agent command.
REVOKE ALL ON SCHEMA crm FROM crm_web;
REVOKE ALL ON ALL TABLES IN SCHEMA crm FROM crm_web;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA crm FROM crm_web;

CREATE FUNCTION crm.web_read(p_operation text, p_args jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, crm AS $$
DECLARE
  v_limit integer := 25; v_offset integer := 0; v_result jsonb;
  v_query text; v_role text; v_stage text; v_response text;
BEGIN
  IF p_operation IS NULL OR p_operation NOT IN ('today','relationships','contact')
    OR p_args IS NULL OR jsonb_typeof(p_args)<>'object' THEN
    RAISE EXCEPTION 'unsupported web read' USING ERRCODE='22023';
  END IF;
  IF p_operation IN ('today','relationships') THEN
    IF (p_args ? 'limit' AND (jsonb_typeof(p_args->'limit')<>'number' OR p_args->>'limit' !~ '^\d{1,3}$'))
      OR (p_args ? 'offset' AND (jsonb_typeof(p_args->'offset')<>'number' OR p_args->>'offset' !~ '^\d{1,7}$')) THEN
      RAISE EXCEPTION 'invalid pagination' USING ERRCODE='22023';
    END IF;
    v_limit:=coalesce((p_args->>'limit')::integer,25); v_offset:=coalesce((p_args->>'offset')::integer,0);
    IF v_limit NOT BETWEEN 1 AND 100 OR v_offset NOT BETWEEN 0 AND 1000000 THEN
      RAISE EXCEPTION 'invalid pagination' USING ERRCODE='22023';
    END IF;
  END IF;
  IF p_operation='today' THEN
    IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_args) k WHERE k NOT IN ('limit','offset')) THEN
      RAISE EXCEPTION 'unsupported today field' USING ERRCODE='22023';
    END IF;
    SELECT jsonb_build_object(
      'summary',crm.command('summary','{}','web-reader'),
      'queues',crm.command('due',jsonb_build_object('limit',v_limit,'offset',v_offset),'web-reader'),
      'unscheduled_actions_total',(SELECT count(*) FROM crm.current_actions WHERE status='open' AND due_at IS NULL),
      'unscheduled_actions',coalesce((SELECT jsonb_agg(to_jsonb(q) ORDER BY q.recorded_at DESC,q.action_id) FROM (
        SELECT a.*,o.name AS organization,p.name AS person
        FROM crm.current_actions a JOIN crm.contacts c ON c.id=a.contact_id
          JOIN crm.organizations o ON o.id=c.organization_id LEFT JOIN crm.people p ON p.id=c.person_id
        WHERE a.status='open' AND a.due_at IS NULL ORDER BY a.recorded_at DESC,a.action_id LIMIT v_limit OFFSET v_offset
      ) q),'[]'::jsonb),
      'unscheduled_next_offset',CASE WHEN v_offset::bigint+v_limit < (SELECT count(*) FROM crm.current_actions WHERE status='open' AND due_at IS NULL) THEN v_offset+v_limit ELSE NULL END,
      'recent_imports',coalesce((SELECT jsonb_agg(to_jsonb(q) ORDER BY q.recorded_at DESC,q.id) FROM (
        SELECT id,source_key,captured_at,recorded_at,jsonb_array_length(payload->'records') AS contact_count
        FROM crm.imports ORDER BY recorded_at DESC,id LIMIT 10
      ) q),'[]'::jsonb),
      'recent_research',coalesce((SELECT jsonb_agg(to_jsonb(q) ORDER BY q.recorded_at DESC,q.id) FROM (
        SELECT r.id,r.contact_id,r.kind,r.source_key,r.source_url,r.observed_at,r.recorded_at,o.name AS organization
        FROM crm.research r JOIN crm.contacts c ON c.id=r.contact_id JOIN crm.organizations o ON o.id=c.organization_id
        ORDER BY r.recorded_at DESC,r.id LIMIT 10
      ) q),'[]'::jsonb),
      'research_batches',coalesce((SELECT jsonb_agg(to_jsonb(q) ORDER BY q.batch_date DESC NULLS LAST) FROM (
        SELECT nullif(c.context->>'batch_date','') AS batch_date,count(*) AS contacts,max(c.created_at) AS latest_imported_at
        FROM crm.contacts c GROUP BY nullif(c.context->>'batch_date','')
        ORDER BY batch_date DESC NULLS LAST LIMIT 10
      ) q),'[]'::jsonb),'limit',v_limit,'offset',v_offset) INTO v_result;
  ELSIF p_operation='relationships' THEN
    IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_args) k WHERE k NOT IN ('query','relationship_type','stage','response_state','limit','offset')) THEN
      RAISE EXCEPTION 'unsupported relationship field' USING ERRCODE='22023';
    END IF;
    IF EXISTS(SELECT 1 FROM jsonb_each(p_args) e WHERE e.key IN ('query','relationship_type','stage','response_state') AND jsonb_typeof(e.value)<>'string') THEN
      RAISE EXCEPTION 'invalid relationship filters' USING ERRCODE='22023';
    END IF;
    v_query:=coalesce(p_args->>'query',''); v_role:=p_args->>'relationship_type';
    v_stage:=p_args->>'stage'; v_response:=p_args->>'response_state';
    IF length(v_query)>500 OR length(coalesce(v_stage,''))>100
      OR (v_role IS NOT NULL AND v_role NOT IN ('pilot_prospect','customer','publisher','partner','investor','other'))
      OR (v_response IS NOT NULL AND v_response NOT IN ('not_contacted','unknown','verified_no_reply','human_reply')) THEN
      RAISE EXCEPTION 'invalid relationship filters' USING ERRCODE='22023';
    END IF;
    WITH matches AS (
      SELECT c.id AS contact_id,o.id AS organization_id,o.name AS organization,p.name AS person,p.role AS person_role,
        c.channel,c.address,c.owner,r.first_sent_at,r.last_sent_at,r.last_human_reply_at,r.response_state,
        coalesce((SELECT jsonb_agg(to_jsonb(cr) ORDER BY cr.relationship_type) FROM crm.current_relationships cr WHERE cr.contact_id=c.id),'[]') AS relationships
      FROM crm.contacts c JOIN crm.organizations o ON o.id=c.organization_id
        LEFT JOIN crm.people p ON p.id=c.person_id JOIN crm.contact_response r ON r.contact_id=c.id
      WHERE strpos(lower(concat_ws(' ',c.id,o.name,p.name,p.role,c.address)),lower(v_query))>0
        AND (v_response IS NULL OR r.response_state=v_response)
        AND ((v_role IS NULL AND v_stage IS NULL) OR EXISTS(
          SELECT 1 FROM crm.current_relationships cr WHERE cr.contact_id=c.id
            AND (v_role IS NULL OR cr.relationship_type=v_role) AND (v_stage IS NULL OR cr.stage=v_stage)))
    ), page AS (SELECT * FROM matches ORDER BY organization,contact_id LIMIT v_limit OFFSET v_offset)
    SELECT jsonb_build_object('contacts',(SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.organization,q.contact_id),'[]') FROM page q),
      'total',count(*),'limit',v_limit,'offset',v_offset,
      'next_offset',CASE WHEN v_offset::bigint+v_limit<count(*) THEN v_offset+v_limit ELSE NULL END,
      'filter_options',jsonb_build_object('stages',(SELECT coalesce(jsonb_agg(stage ORDER BY stage),'[]') FROM (SELECT DISTINCT stage FROM crm.current_relationships) s),
        'relationship_types',jsonb_build_array('pilot_prospect','customer','publisher','partner','investor','other'))) INTO v_result FROM matches;
  ELSE
    IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_args) k WHERE k<>'contact_id')
      OR jsonb_typeof(p_args->'contact_id') IS DISTINCT FROM 'string'
      OR length(btrim(coalesce(p_args->>'contact_id',''))) NOT BETWEEN 1 AND 150 THEN
      RAISE EXCEPTION 'invalid contact id' USING ERRCODE='22023';
    END IF;
    IF NOT EXISTS(SELECT 1 FROM crm.contacts WHERE id=p_args->>'contact_id') THEN RETURN NULL; END IF;
    v_result:=crm.command('history',p_args,'web-reader');
  END IF;
  RETURN v_result;
END $$;

REVOKE ALL ON FUNCTION crm.web_read(text,jsonb) FROM PUBLIC,anon,authenticated,crm_agent,crm_web;
GRANT USAGE ON SCHEMA crm TO crm_web;
GRANT EXECUTE ON FUNCTION crm.web_read(text,jsonb) TO crm_web;
COMMENT ON FUNCTION crm.web_read(text,jsonb) IS 'Private website read boundary with fixed, hardcoded read dispatch. Website independently verifies the explicit allowed Auth identity and uses a read-only transaction on every read. STABLE is a planner/visibility property, not a nested-call write guarantee. No Data API exposure.';
