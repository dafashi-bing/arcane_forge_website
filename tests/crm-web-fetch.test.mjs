import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { createDeadlineFetch } from '../lib/supabase/timeout-fetch.mjs';
import { createClient } from '@supabase/supabase-js';

test('bounded Auth transport preserves successful JSON and forces no-store', async () => {
  let options;
  const fetcher=createDeadlineFetch(1000,async (_input,init)=>{
    options=init;
    return new Response(JSON.stringify({user:{id:'synthetic'}}),{status:200,headers:{'X-Supabase-Api-Version':'2024-01-01','Cache-Control':'public'}});
  });
  const result=await fetcher('https://example.invalid/auth/v1/user',{cache:'force-cache',headers:{Accept:'application/json'}});
  assert.equal(options.cache,'no-store'); assert.equal(options.headers.Accept,'application/json');
  assert.ok(options.signal instanceof AbortSignal);
  assert.equal(result.headers.get('cache-control'),'no-store');
  assert.equal(result.headers.get('x-supabase-api-version'),'2024-01-01');
  assert.deepEqual(await result.json(),{user:{id:'synthetic'}});
});
test('deadline actually aborts the pending request instead of leaving work running', async () => {
  let aborted=false;
  const fetcher=createDeadlineFetch(30,async (_input,{signal})=>new Promise((_resolve,reject)=>{
    signal.addEventListener('abort',()=>{aborted=true;reject(signal.reason);},{once:true});
  }));
  const result=await fetcher('https://example.invalid/auth/v1/user');
  assert.equal(result.status,408); assert.equal(aborted,true);
  assert.deepEqual(await result.json(),{message:'Auth verification is temporarily unavailable.',code:'auth_verification_unavailable'});
});
test('deadline remains active while the Auth response body is stalled', async () => {
  let aborted=false;
  const fetcher=createDeadlineFetch(30,async (_input,{signal})=>new Response(new ReadableStream({start(controller){
    controller.enqueue(new TextEncoder().encode('{"user":'));
    signal.addEventListener('abort',()=>{aborted=true;controller.error(signal.reason);},{once:true});
  }}),{status:200}));
  const result=await fetcher('https://example.invalid/auth/v1/user');
  assert.equal(result.status,408); assert.equal(aborted,true);
});
test('incoming caller abort and Request abort propagate to the actual request', async () => {
  for(const requestInput of [false,true]) {
    const caller=new AbortController();let downstream;
    const fetcher=createDeadlineFetch(1000,async (_input,{signal})=>new Promise((_resolve,reject)=>{
      downstream=signal;signal.addEventListener('abort',()=>reject(signal.reason),{once:true});
    }));
    const pending=requestInput?fetcher(new Request('https://example.invalid/auth/v1/user',{signal:caller.signal})):fetcher('https://example.invalid/auth/v1/user',{signal:caller.signal});
    caller.abort(new Error('SYNTHETIC_PRIVATE_REASON'));
    const result=await pending;
    assert.equal(downstream.aborted,true);assert.equal(result.status,408);
    assert.ok(!(await result.text()).includes('SYNTHETIC_PRIVATE_REASON'));
  }
});
test('one shared client deadline covers subsequent requests', async () => {
  let calls=0;let aborted=false;
  const fetcher=createDeadlineFetch(50,async (_input,{signal})=>{
    calls++;
    if(calls===1) {await delay(20);return new Response('{}');}
    return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(signal.reason);},{once:true}));
  });
  assert.equal((await fetcher('https://example.invalid/auth/v1/user')).status,200);
  assert.equal((await fetcher('https://example.invalid/auth/v1/user')).status,408);
  assert.equal(aborted,true);
  assert.equal((await fetcher('https://example.invalid/auth/v1/user')).status,408);
  assert.equal(calls,2,'Expired clients must not start another network request');
});
test('upstream failures become generic non-retryable errors without raw logging', async () => {
  for(const upstream of [async()=>{throw Error('SYNTHETIC_SECRET');},async()=>new Response('SYNTHETIC_SECRET',{status:503}),async()=>new Response('SYNTHETIC_SECRET',{status:404})]) {
    const result=await createDeadlineFetch(1000,upstream)('https://example.invalid/auth/v1/user');
    assert.equal(result.status,408); assert.ok(!(await result.text()).includes('SYNTHETIC_SECRET'));
  }
});
test('successful completion removes caller listeners and clears its abort timer', async () => {
  const caller=new AbortController();let downstream;
  const fetcher=createDeadlineFetch(30,async (_input,{signal})=>{downstream=signal;return new Response('{}');});
  await fetcher('https://example.invalid/auth/v1/user',{signal:caller.signal});
  caller.abort(); await delay(40);
  assert.equal(downstream.aborted,false);
});
test('installed Supabase Auth does not retry an aborted refresh after the deadline', async () => {
  let calls=0;let aborted=false;
  const transport=createDeadlineFetch(30,async (_input,{signal})=>new Promise((_resolve,reject)=>{
    calls++;signal.addEventListener('abort',()=>{aborted=true;reject(signal.reason);},{once:true});
  }));
  const supabase=createClient('https://example.invalid','synthetic-test-public-key',{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:transport},
  });
  const result=await supabase.auth.refreshSession({refresh_token:'synthetic-test-refresh-token'});
  assert.equal(result.error?.status,408);assert.equal(result.data.user,null);
  assert.equal(calls,1);assert.equal(aborted,true);
});
