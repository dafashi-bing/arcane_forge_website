-- All records and receipts roll back. Can run against a fresh or populated target.
BEGIN;
SET LOCAL statement_timeout='30s';
DO $$
DECLARE r jsonb; before_summary jsonb; after_summary jsonb; payload jsonb;
BEGIN
  before_summary:=crm.command('summary','{}','web-reader-test');
  payload:=jsonb_build_object('idempotency_key','test-crm-web-import','source_key','synthetic-web-reader-fixture',
    'captured_at','2026-10-28T12:00:00Z','source_sha256',repeat('b',64),'records',jsonb_build_array(jsonb_build_object(
      'contact_id','TEST-CRM-WEB-ROLLBACK','organization_name','TEST CRM WEB ROLLBACK organization',
      'channel','email','address','web-fixture@example.invalid','relationship_types',jsonb_build_array('pilot_prospect'),
      'stage','proposed','owner','Bing','context',jsonb_build_object('uncertainty','Synthetic fixture','batch_date','1900-01-01'),
      'source_record',jsonb_build_object('source','synthetic'),
      'research',jsonb_build_array(jsonb_build_object('source_key','web-fixture-source','kind','test','content',jsonb_build_object('uncertainty','Synthetic fixture'))),
      'next_action',jsonb_build_object('description','Review synthetic web fixture','owner','Bing'))));
  PERFORM crm.command('import',payload,'web-reader-test');
  PERFORM crm.command('relationship','{"idempotency_key":"test-crm-web-publisher","contact_id":"TEST-CRM-WEB-ROLLBACK","relationship_type":"publisher","stage":"qualified","context":{}}','web-reader-test');
  r:=crm.web_read('relationships','{"query":"TEST CRM WEB ROLLBACK","relationship_type":"publisher","stage":"qualified","limit":1}');
  IF r->>'total'<>'1' OR r->'contacts'->0->>'contact_id'<>'TEST-CRM-WEB-ROLLBACK' THEN RAISE EXCEPTION 'Web search/filter failed'; END IF;
  r:=crm.web_read('relationships','{"query":"TEST CRM WEB ROLLBACK","relationship_type":"pilot_prospect","stage":"qualified"}');
  IF r->>'total'<>'0' THEN RAISE EXCEPTION 'Stage and role must match the same relationship'; END IF;
  r:=crm.web_read('relationships','{"query":"%"}');
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(r->'contacts') c WHERE c->>'contact_id'='TEST-CRM-WEB-ROLLBACK') THEN RAISE EXCEPTION 'Wildcard search must be literal'; END IF;
  r:=crm.web_read('today','{"limit":100}');
  IF r->'summary'->>'contacts' IS DISTINCT FROM (((before_summary->>'contacts')::integer+1)::text) THEN RAISE EXCEPTION 'Web today summary failed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(r->'unscheduled_actions') a WHERE a->>'contact_id'='TEST-CRM-WEB-ROLLBACK') THEN RAISE EXCEPTION 'Unscheduled review missing'; END IF;
  IF (r->'recent_imports'->0) ? 'payload' THEN RAISE EXCEPTION 'Recent imports must not expose source payload'; END IF;
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(r->'research_batches') b WHERE b->>'batch_date'='1900-01-01' AND b->>'contacts'='1') THEN RAISE EXCEPTION 'Source research batch date lost'; END IF;
  r:=crm.web_read('contact','{"contact_id":"TEST-CRM-WEB-ROLLBACK"}');
  IF jsonb_array_length(r->'relationships')<>2 OR jsonb_array_length(r->'research')<>1 THEN RAISE EXCEPTION 'Web history incomplete'; END IF;
  IF crm.web_read('contact','{"contact_id":"TEST-CRM-WEB-MISSING"}') IS NOT NULL THEN RAISE EXCEPTION 'Missing contact result must be null'; END IF;
  after_summary:=crm.command('summary','{}','web-reader-test');
  IF after_summary->>'contacted_unique' IS DISTINCT FROM before_summary->>'contacted_unique' THEN RAISE EXCEPTION 'Read invented send'; END IF;
  RAISE NOTICE 'PASS: web reads preserve filters, research, unscheduled actions and metric semantics';
END $$;

SET LOCAL ROLE crm_web;
DO $$ BEGIN
  PERFORM crm.web_read('today','{"limit":1}');
  PERFORM crm.web_read('relationships','{"query":"TEST CRM WEB ROLLBACK"}');
  PERFORM crm.web_read('contact','{"contact_id":"TEST-CRM-WEB-ROLLBACK"}');
  BEGIN PERFORM 1 FROM crm.contacts; RAISE EXCEPTION 'Web role read table directly'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM crm.command('summary','{}','unauthorized'); RAISE EXCEPTION 'Web role executed agent command'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM crm.web_read('interaction','{}'); RAISE EXCEPTION 'Web reader accepted write'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM crm.web_read('today','{"actor":"attacker"}'); RAISE EXCEPTION 'Web reader accepted unsupported fields'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM crm.web_read('relationships','{"limit":100000}'); RAISE EXCEPTION 'Web reader accepted unbounded query'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  RAISE NOTICE 'PASS: scoped web role reads only through web_read and cannot execute commands or direct tables';
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM crm.web_read('today','{}'); RAISE EXCEPTION 'Anon read web CRM'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RAISE NOTICE 'PASS: anonymous web database access denied';
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN PERFORM crm.web_read('today','{}'); RAISE EXCEPTION 'Customer read web CRM'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RAISE NOTICE 'PASS: authenticated customer web database access denied';
END $$;
RESET ROLE;
SET LOCAL ROLE crm_agent;
DO $$ BEGIN
  BEGIN PERFORM crm.web_read('today','{}'); RAISE EXCEPTION 'Agent inherited web boundary'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RAISE NOTICE 'PASS: agent and web scopes remain separate';
END $$;
RESET ROLE;
ROLLBACK;
SELECT count(*) AS leftover_fixture_contacts FROM crm.contacts WHERE id='TEST-CRM-WEB-ROLLBACK';
SELECT count(*) AS leftover_fixture_receipts FROM crm.receipts WHERE idempotency_key LIKE 'test-crm-web-%';
