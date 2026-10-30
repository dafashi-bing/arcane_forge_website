-- Run with psql -v ON_ERROR_STOP=1. All fixtures roll back, including receipts.
BEGIN;
SET LOCAL statement_timeout = '30s';
DO $$
DECLARE
 args jsonb; event_args jsonb; result jsonb; replay jsonb; stats jsonb; v_fixture_action uuid;
 baseline_contacts integer; baseline_sent integer; baseline_human integer;
 baseline_auto integer; baseline_unknown integer; baseline_verified integer;
BEGIN
 stats:=crm.command('summary','{}','integration-test');
 baseline_contacts:=(stats->>'contacts')::integer;
 baseline_sent:=(stats->>'contacted_unique')::integer;
 baseline_human:=(stats->>'human_replied_unique')::integer;
 baseline_auto:=(stats->>'auto_replied_unique')::integer;
 baseline_unknown:=(stats->>'inbox_unknown')::integer;
 baseline_verified:=(stats->>'verified_no_reply')::integer;
 args:=jsonb_build_object('idempotency_key','test-crm-import','source_key','integration-fixture',
   'captured_at','2026-10-28T12:00:00Z','source_sha256',repeat('a',64),'records',jsonb_build_array(jsonb_build_object(
     'contact_id','TEST-CRM-ROLLBACK','organization_name','TEST CRM ROLLBACK organization','organization_website','https://www.fixture-a.example.invalid/path',
     'person_name','Test Alias','person_role','Fixture','channel','email','address','fixture@example.invalid',
     'relationship_types',jsonb_build_array('pilot_prospect'),'stage','proposed','owner','Bing',
     'context',jsonb_build_object('uncertainty','Synthetic test, never outreach'),
     'source_record',jsonb_build_object('source','synthetic'),
     'research',jsonb_build_array(jsonb_build_object('source_key','fixture-source','source_url','https://example.invalid',
       'observed_at','2026-10-28T12:00:00Z','kind','test','content',jsonb_build_object('uncertainty','Fixture only'))),
     'next_action',jsonb_build_object('description','Review fixture','owner','Bing','due_at','2026-10-29T12:00:00Z'))),'interactions','[]'::jsonb);
 result:=crm.command('import',args,'integration-test');
 IF result->>'created_contacts'<>'1' THEN RAISE EXCEPTION 'Import create count failed: %',result;END IF;
 replay:=crm.command('import',args,'integration-test');
 IF replay->>'replayed'<>'true' OR replay->>'import_id'<>result->>'import_id' THEN RAISE EXCEPTION 'Import replay failed';END IF;
 BEGIN
   PERFORM crm.command('import',args||jsonb_build_object('source_key','changed-with-same-key'),'integration-test');
   RAISE EXCEPTION 'Expected idempotency conflict';
 EXCEPTION WHEN unique_violation THEN NULL;END;
 stats:=crm.command('summary','{}','integration-test');
 IF (stats->>'contacts')::integer<>baseline_contacts+1 OR (stats->>'contacted_unique')::integer<>baseline_sent THEN RAISE EXCEPTION 'Import invented send';END IF;


 -- Names do not resolve conflicting organization identities; evidence metadata is immutable too.
 BEGIN
   PERFORM crm.command('import',args||jsonb_build_object('idempotency_key','test-crm-org-conflict','records',
     jsonb_build_array((args->'records'->0)||jsonb_build_object('organization_website','https://fixture-b.example.invalid/'))),'integration-test');
   RAISE EXCEPTION 'Expected same-name organization website conflict';
 EXCEPTION WHEN unique_violation THEN NULL;END;
 BEGIN
   PERFORM crm.command('import',args||jsonb_build_object('idempotency_key','test-crm-evidence-kind-conflict','records',
     jsonb_build_array((args->'records'->0)||jsonb_build_object('research',jsonb_build_array((args->'records'->0->'research'->0)||jsonb_build_object('kind','changed-kind'))))),'integration-test');
   RAISE EXCEPTION 'Expected evidence kind conflict';
 EXCEPTION WHEN unique_violation THEN NULL;END;
 BEGIN
   PERFORM crm.command('import',args||jsonb_build_object('idempotency_key','test-crm-evidence-time-conflict','records',
     jsonb_build_array((args->'records'->0)||jsonb_build_object('research',jsonb_build_array((args->'records'->0->'research'->0)||jsonb_build_object('observed_at','2026-10-28T12:00:01Z'))))),'integration-test');
   RAISE EXCEPTION 'Expected evidence observed_at conflict';
 EXCEPTION WHEN unique_violation THEN NULL;END;

 -- Different stable IDs must not multiply an existing organization/contact route.
 BEGIN
   PERFORM crm.command('import',args||jsonb_build_object('idempotency_key','test-crm-dupe','records',
     jsonb_build_array((args->'records'->0)||jsonb_build_object('contact_id','TEST-CRM-DUPLICATE'))),'integration-test');
   RAISE EXCEPTION 'Expected contact duplicate conflict';
 EXCEPTION WHEN unique_violation THEN NULL;END;
 -- Same stable ID cannot silently change identity through a new import.
 BEGIN
   PERFORM crm.command('import',args||jsonb_build_object('idempotency_key','test-crm-identity','records',
     jsonb_build_array((args->'records'->0)||jsonb_build_object('address','changed@example.invalid'))),'integration-test');
   RAISE EXCEPTION 'Expected immutable contact identity conflict';
 EXCEPTION WHEN unique_violation THEN NULL;END;

 event_args:=jsonb_build_object('idempotency_key','test-crm-send','contact_id','TEST-CRM-ROLLBACK','type','sent',
   'occurred_at','2026-10-28T13:00:00Z','channel','email','sending_account','synthetic-sender@example.invalid',
   'confirmation','user_confirmed','evidence','Synthetic integration test; no message sent','summary','Synthetic logged send',
   'follow_up_due_at','2026-10-29T13:00:00Z');
 result:=crm.command('interaction',event_args,'integration-test');v_fixture_action:=(result->>'follow_up_action_id')::uuid;
 replay:=crm.command('interaction',event_args,'integration-test');
 IF replay->>'interaction_id'<>result->>'interaction_id' OR replay->>'replayed'<>'true' THEN RAISE EXCEPTION 'Interaction replay failed';END IF;
 BEGIN
   PERFORM crm.command('interaction',event_args||jsonb_build_object('summary','changed-with-same-key'),'integration-test');
   RAISE EXCEPTION 'Expected interaction conflict';
 EXCEPTION WHEN unique_violation THEN NULL;END;
 BEGIN
   PERFORM crm.command('interaction',(event_args-'sending_account')||jsonb_build_object('idempotency_key','test-invalid-send'),'integration-test');
   RAISE EXCEPTION 'Expected sending account validation';
 EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 BEGIN
   PERFORM crm.command('interaction',event_args||jsonb_build_object('idempotency_key','test-naive-date','occurred_at','2026-10-28 13:00:00'),'integration-test');
   RAISE EXCEPTION 'Expected timezone validation';
 EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 stats:=crm.command('summary','{}','integration-test');
 IF (stats->>'contacted_unique')::integer<>baseline_sent+1 OR (stats->>'inbox_unknown')::integer<>baseline_unknown+1 THEN RAISE EXCEPTION 'Send denominator/unknown failed: %',stats;END IF;

 -- Only explicit bounded inbox evidence verifies no human reply.
 PERFORM crm.command('interaction',jsonb_build_object('idempotency_key','test-crm-inbox','contact_id','TEST-CRM-ROLLBACK','type','inbox_checked',
   'occurred_at','2026-10-28T14:00:00Z','channel','email','sending_account','synthetic-sender@example.invalid','confirmation','user_confirmed',
   'evidence','Synthetic manual inbox check','summary','Synthetic check','inbox_state','no_reply','checked_through','2026-10-28T14:00:00Z'),'integration-test');
 stats:=crm.command('summary','{}','integration-test');
 IF (stats->>'verified_no_reply')::integer<>baseline_verified+1 THEN RAISE EXCEPTION 'Explicit inbox check not recognized';END IF;

 -- Follow-up makes earlier inbox evidence stale and must still count once.
 PERFORM crm.command('interaction',(event_args-'follow_up_due_at')||jsonb_build_object('idempotency_key','test-crm-followup','occurred_at','2026-10-28T15:00:00Z','is_follow_up',true),'integration-test');
 stats:=crm.command('summary','{}','integration-test');
 IF (stats->>'contacted_unique')::integer<>baseline_sent+1 OR (stats->>'inbox_unknown')::integer<>baseline_unknown+1
   OR (stats->>'verified_no_reply')::integer<>baseline_verified THEN RAISE EXCEPTION 'Follow-up inflated denominator or stale no-reply persisted: %',stats;END IF;

 PERFORM crm.command('interaction',jsonb_build_object('idempotency_key','test-crm-auto','contact_id','TEST-CRM-ROLLBACK','type','auto_reply',
   'occurred_at','2026-10-28T15:01:00Z','channel','email','confirmation','observed','evidence','Synthetic automatic reply',
   'summary','Synthetic out-of-office'),'integration-test');
 stats:=crm.command('summary','{}','integration-test');
 IF (stats->>'human_replied_unique')::integer<>baseline_human OR (stats->>'auto_replied_unique')::integer<>baseline_auto+1 THEN RAISE EXCEPTION 'Automatic reply inflated human metric';END IF;

 PERFORM crm.command('interaction',jsonb_build_object('idempotency_key','test-crm-human','contact_id','TEST-CRM-ROLLBACK','type','human_reply',
   'occurred_at','2026-10-28T16:00:00Z','channel','email','confirmation','user_confirmed','evidence','Synthetic human reply',
   'summary','Synthetic human response'),'integration-test');
 stats:=crm.command('summary','{}','integration-test');
 IF (stats->>'human_replied_unique')::integer<>baseline_human+1 OR (stats->>'contacted_unique')::integer<>baseline_sent+1 THEN RAISE EXCEPTION 'Human response numerator failed';END IF;
 IF (stats->>'human_reply_rate')::numeric <> round((baseline_human+1)::numeric/(baseline_sent+1),4) THEN RAISE EXCEPTION 'Reply rate denominator incorrect';END IF;
 result:=crm.command('history','{"contact_id":"TEST-CRM-ROLLBACK"}','integration-test');
 IF jsonb_array_length(result->'interactions')<>5 OR result->'response'->>'send_count'<>'2' THEN RAISE EXCEPTION 'History lost events or idempotency doubled events';END IF;
 IF result->'response'->>'response_state'<>'human_reply' THEN RAISE EXCEPTION 'Human response state failed';END IF;

 PERFORM crm.command('relationship','{"idempotency_key":"test-crm-publisher","contact_id":"TEST-CRM-ROLLBACK","relationship_type":"publisher","stage":"qualified","context":{"note":"synthetic role"}}','integration-test');
 PERFORM crm.command('relationship','{"idempotency_key":"test-crm-publisher-update","contact_id":"TEST-CRM-ROLLBACK","relationship_type":"publisher","stage":"discussion","outcome":"test only"}','integration-test');
 result:=crm.command('history','{"contact_id":"TEST-CRM-ROLLBACK"}','integration-test');
 IF jsonb_array_length(result->'relationships')<>2 OR jsonb_array_length(result->'relationship_history')<>3 THEN RAISE EXCEPTION 'Multiple roles or relationship history failed';END IF;

 result:=crm.command('due','{"as_of":"2026-10-29T14:00:00Z"}','integration-test');
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(result->'due_actions') a WHERE a->>'action_id'=v_fixture_action::text) THEN RAISE EXCEPTION 'Follow-up action not due';END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(result->'human_replies_needing_review') a WHERE a->>'contact_id'='TEST-CRM-ROLLBACK') THEN RAISE EXCEPTION 'Human reply attention missing';END IF;
 PERFORM crm.command('action',jsonb_build_object('idempotency_key','test-crm-action-done','contact_id','TEST-CRM-ROLLBACK','action_id',v_fixture_action,
   'description','Reviewed synthetic follow-up','status','done','owner','Bing'),'integration-test');
 result:=crm.command('due','{"as_of":"2026-10-29T14:00:00Z"}','integration-test');
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(result->'due_actions') a WHERE a->>'action_id'=v_fixture_action::text) THEN RAISE EXCEPTION 'Completed action remains due';END IF;
 IF NOT EXISTS(SELECT 1 FROM crm.action_events ae WHERE ae.action_id=v_fixture_action AND ae.status='open') THEN RAISE EXCEPTION 'Action history overwritten';END IF;

 BEGIN
   UPDATE crm.interactions SET summary='overwrite' WHERE contact_id='TEST-CRM-ROLLBACK';
   RAISE EXCEPTION 'Expected immutable interaction protection';
 EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 RAISE NOTICE 'PASS: import/replay/conflicts, duplicate/identity checks, validation, unique sends, auto/human rates, inbox chronology, history, roles, due actions';
END $$;

DO $$
DECLARE
 records jsonb; args jsonb; r jsonb; next_page jsonb; event_args jsonb;
 queue_offset integer:=0; collected jsonb:='[]'; page_total integer;
BEGIN
 SELECT jsonb_agg(jsonb_build_object('contact_id','TEST-CRM-PAGE-'||g,'organization_name','TEST CRM PAGE Organization',
   'channel','email','address','page-'||g||'@example.invalid','relationship_types',jsonb_build_array('partner'),
   'owner','Bing','stage','proposed','research','[]'::jsonb,
   'next_action',jsonb_build_object('description','Synthetic page action','owner','Bing','due_at','2026-10-28T12:00:00Z')))
 INTO records FROM generate_series(1,105) g;
 records:=records||jsonb_build_array(jsonb_build_object('contact_id','TEST-CRM-SCOPES','organization_name','TEST CRM Scope Organization',
   'channel','email','address','scopes@example.invalid','relationship_types',jsonb_build_array('pilot_prospect'),'owner','Bing','stage','proposed'));
 args:=jsonb_build_object('idempotency_key','test-crm-pages','source_key','integration-pages','source_sha256',repeat('b',64),
   'captured_at','2026-10-28T12:00:00Z','records',records);
 PERFORM crm.command('import',args,'integration-test');
 r:=crm.command('search','{"query":"TEST CRM PAGE","limit":100,"offset":0,"contacted":false,"response_state":"not_contacted","relationship_type":"partner"}','integration-test');
 IF r->>'total'<>'105' OR jsonb_array_length(r->'contacts')<>100 OR r->>'next_offset'<>'100' THEN RAISE EXCEPTION 'Search first-page/filter/count failure: %',r;END IF;
 next_page:=crm.command('search','{"query":"TEST CRM PAGE","limit":100,"offset":100,"contacted":false,"response_state":"not_contacted","relationship_type":"partner"}','integration-test');
 IF next_page->>'total'<>'105' OR jsonb_array_length(next_page->'contacts')<>5 OR next_page->'next_offset'<>'null'::jsonb THEN RAISE EXCEPTION 'Search last-page failure';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(r->'contacts') a JOIN jsonb_array_elements(next_page->'contacts') b ON a->>'contact_id'=b->>'contact_id') THEN RAISE EXCEPTION 'Search pagination duplicated rows';END IF;
 r:=crm.command('search','{"query":"TEST CRM PAGE","contacted":true}','integration-test');
 IF r->>'total'<>'0' THEN RAISE EXCEPTION 'Contacted filter failure';END IF;
 r:=crm.command('search','{"query":"TEST CRM PAGE","relationship_type":"publisher"}','integration-test');
 IF r->>'total'<>'0' THEN RAISE EXCEPTION 'Relationship filter failure';END IF;
 r:=crm.command('search','{"query":"TEST CRM PAGE","offset":2147483647,"limit":100}','integration-test');
 IF jsonb_array_length(r->'contacts')<>0 OR r->'next_offset'<>'null'::jsonb THEN RAISE EXCEPTION 'Large offset overflow/termination failure';END IF;
 LOOP
   r:=crm.command('due',jsonb_build_object('as_of','2026-10-29T14:00:00Z','limit',100,'offset',queue_offset),'integration-test');
   page_total:=(r->>'due_actions_total')::integer;
   collected:=collected||(r->'due_actions');
   EXIT WHEN r->'next_offset'='null'::jsonb;
   queue_offset:=(r->>'next_offset')::integer;
   IF queue_offset>1000000 THEN RAISE EXCEPTION 'Queue pagination did not terminate';END IF;
 END LOOP;
 IF jsonb_array_length(collected)<>page_total OR (SELECT count(DISTINCT a->>'action_id') FROM jsonb_array_elements(collected) a)<>page_total THEN RAISE EXCEPTION 'Due pagination lost or repeated actions';END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(collected) a WHERE a->>'contact_id' LIKE 'TEST-CRM-PAGE-%')<>105 THEN RAISE EXCEPTION 'Due pagination omitted synthetic rows';END IF;

 event_args:=jsonb_build_object('idempotency_key','test-crm-scope-send-a','contact_id','TEST-CRM-SCOPES','type','sent',
   'occurred_at','2026-10-28T13:00:00Z','channel','email','sending_account','account-a@example.invalid',
   'confirmation','user_confirmed','evidence','Synthetic only; no send','summary','Synthetic scope send');
 PERFORM crm.command('interaction',event_args,'integration-test');
 PERFORM crm.command('interaction',event_args||jsonb_build_object('idempotency_key','test-crm-scope-send-b','occurred_at','2026-10-28T14:00:00Z','sending_account','account-b@example.invalid'),'integration-test');
 PERFORM crm.command('interaction',event_args||jsonb_build_object('idempotency_key','test-crm-scope-send-linkedin','occurred_at','2026-10-28T15:00:00Z','channel','linkedin','sending_account','account-b@example.invalid'),'integration-test');
 event_args:=event_args||jsonb_build_object('idempotency_key','test-crm-scope-inbox-a','type','inbox_checked','occurred_at','2026-10-28T16:00:00Z',
   'inbox_state','no_reply','checked_through','2026-10-28T16:00:00Z');
 BEGIN
   PERFORM crm.command('interaction',(event_args-'sending_account')||jsonb_build_object('idempotency_key','test-crm-scope-no-account'),'integration-test');
   RAISE EXCEPTION 'Expected inbox sending_account validation';
 EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 PERFORM crm.command('interaction',event_args,'integration-test');
 r:=crm.command('history','{"contact_id":"TEST-CRM-SCOPES"}','integration-test');
 IF r->'response'->>'response_state'<>'unknown' OR r->'response'->>'inbox_scope_count'<>'3' OR r->'response'->>'inbox_covered_scope_count'<>'1' THEN RAISE EXCEPTION 'One account incorrectly covered all send scopes';END IF;
 PERFORM crm.command('interaction',event_args||jsonb_build_object('idempotency_key','test-crm-scope-wrong-account','occurred_at','2026-10-28T16:01:00Z','sending_account','wrong@example.invalid'),'integration-test');
 r:=crm.command('history','{"contact_id":"TEST-CRM-SCOPES"}','integration-test');
 IF r->'response'->>'inbox_covered_scope_count'<>'1' THEN RAISE EXCEPTION 'Mismatched account incorrectly covered sent scope';END IF;
 PERFORM crm.command('interaction',event_args||jsonb_build_object('idempotency_key','test-crm-scope-inbox-b','occurred_at','2026-10-28T16:02:00Z','sending_account','account-b@example.invalid'),'integration-test');
 PERFORM crm.command('interaction',event_args||jsonb_build_object('idempotency_key','test-crm-scope-wrong-channel','occurred_at','2026-10-28T16:03:00Z','channel','linkedin'),'integration-test');
 r:=crm.command('history','{"contact_id":"TEST-CRM-SCOPES"}','integration-test');
 IF r->'response'->>'response_state'<>'unknown' OR r->'response'->>'inbox_covered_scope_count'<>'2' THEN RAISE EXCEPTION 'Mismatched channel incorrectly covered sent scope';END IF;
 PERFORM crm.command('interaction',event_args||jsonb_build_object('idempotency_key','test-crm-scope-inbox-linkedin','occurred_at','2026-10-28T16:04:00Z','channel','linkedin','sending_account','account-b@example.invalid'),'integration-test');
 r:=crm.command('history','{"contact_id":"TEST-CRM-SCOPES"}','integration-test');
 IF r->'response'->>'response_state'<>'verified_no_reply' OR r->'response'->>'inbox_covered_scope_count'<>'3' THEN RAISE EXCEPTION 'All scoped evidence did not verify no reply';END IF;
 PERFORM crm.command('interaction',event_args||jsonb_build_object('idempotency_key','test-crm-scope-inbox-unknown','occurred_at','2026-10-28T17:00:00Z','inbox_state','unknown','sending_account','account-b@example.invalid'),'integration-test');
 r:=crm.command('history','{"contact_id":"TEST-CRM-SCOPES"}','integration-test');
 IF r->'response'->>'response_state'<>'unknown' OR r->'response'->>'inbox_covered_scope_count'<>'2' THEN RAISE EXCEPTION 'Later scope unknown failed to invalidate no reply';END IF;
 -- An unsolicited reply before the first send is not an outbound response metric.
 PERFORM crm.command('interaction',jsonb_build_object('idempotency_key','test-crm-scope-early-human','contact_id','TEST-CRM-SCOPES','type','human_reply',
   'occurred_at','2026-10-28T12:00:00Z','channel','email','confirmation','observed','evidence','Synthetic earlier unsolicited contact','summary','Not an outbound response'),'integration-test');
 r:=crm.command('history','{"contact_id":"TEST-CRM-SCOPES"}','integration-test');
 IF r->'response'->'last_human_reply_at'<>'null'::jsonb THEN RAISE EXCEPTION 'Pre-send reply inflated outbound human reply';END IF;
 RAISE NOTICE 'PASS: website/evidence conflict regressions, 105-row search/due pagination, filters, scoped multi-account/channel inbox coverage';
END $$;

SET LOCAL ROLE crm_agent;
SELECT crm.command('search','{"query":"TEST-CRM-ROLLBACK","limit":5}','integration-test')->'contacts' AS scoped_agent_search;
DO $$ BEGIN
 BEGIN PERFORM 1 FROM crm.contacts; RAISE EXCEPTION 'CRM agent must not read tables directly';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM crm.timestamp_arg('2026-10-28T00:00:00Z','test'); RAISE EXCEPTION 'CRM agent must not execute internal helper';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 RAISE NOTICE 'PASS: scoped role can execute command but cannot read tables/internal helpers';
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM crm.command('summary','{}','unauthorized');RAISE EXCEPTION 'anon executed CRM';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM 1 FROM crm.contacts;RAISE EXCEPTION 'anon read CRM';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 RAISE NOTICE 'PASS: anonymous CRM access denied';
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM crm.command('summary','{}','unauthorized');RAISE EXCEPTION 'customer executed CRM';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM 1 FROM crm.contacts;RAISE EXCEPTION 'customer read CRM';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 RAISE NOTICE 'PASS: authenticated customer CRM access denied';
END $$;
RESET ROLE;
ROLLBACK;
SELECT count(*) AS leftover_fixture_contacts FROM crm.contacts WHERE id LIKE 'TEST-CRM-%';
SELECT count(*) AS leftover_fixture_receipts FROM crm.receipts WHERE idempotency_key LIKE 'test-crm-%';
