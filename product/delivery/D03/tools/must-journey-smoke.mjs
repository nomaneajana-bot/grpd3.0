/** Device-independent Must-journey smoke against isolated Test Preview.
 * Does not replace installable-build verification or UAT.
 * Never prints tokens. Requires env: D02_HOSTED_ORIGIN, D02_VERCEL_BYPASS,
 * D02_HOST_TOKEN, D02_GUEST_TOKEN, D02_OUTSIDER_TOKEN, D02_TEST_WRITE_ORIGIN.
 */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';

async function main() {
 const base=process.env.D02_HOSTED_ORIGIN;
 const writeOrigin=process.env.D02_TEST_WRITE_ORIGIN;
 const bypass=process.env.D02_VERCEL_BYPASS;
 const host=process.env.D02_HOST_TOKEN;
 const guest=process.env.D02_GUEST_TOKEN;
 const outsider=process.env.D02_OUTSIDER_TOKEN;
 assert.ok(base && writeOrigin && bypass && host && guest && outsider);
 const url=new URL(base);
 assert.equal(url.origin, writeOrigin);
 const report={origin:url.origin,startedAt:new Date().toISOString(),checks:[],complete:false};
 async function call(path,{method='GET',token,body}={}) {
  const headers={'x-vercel-protection-bypass':bypass,Accept:'application/json'};
  if(token)headers.authorization='Bearer '+token;
  if(body!==undefined)headers['content-type']='application/json';
  const r=await fetch(url.origin+'/api/v1/'+path,{method,headers,redirect:'error',body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
  assert.ok(r.headers.get('content-type')?.includes('application/json'),`JSON expected ${path} HTTP ${r.status}`);
  return {status:r.status,body:await r.json()};
 }
 function ok(r){assert.equal(r.status,200);assert.equal(r.body.ok,true);return r.body.data;}
 function pass(name){report.checks.push({name,result:'PASS'});}
 try {
  ok(await call('health')); pass('Health');
  const label='D03 mvp '+randomUUID().slice(0,8);
  const privateClub=ok(await call('clubs',{method:'POST',token:host,body:{name:label+' Private',visibility:'members'}}));
  const publicClub=ok(await call('clubs',{method:'POST',token:host,body:{name:label+' Public',visibility:'public',joinMode:'open'}}));
  assert.ok(!ok(await call('clubs')).clubs.some(c=>c.id===privateClub.id));
  assert.equal((await call(`clubs/${privateClub.id}`,{token:outsider})).status,404);
  assert.equal((await call(`clubs/${privateClub.id}`,{token:guest})).status,404);
  pass('Outsider and non-member cannot read private club');
  const invite=ok(await call(`clubs/${privateClub.id}/invite`,{method:'POST',token:host,body:{}}));
  ok(await call('clubs/join',{method:'POST',token:guest,body:{code:invite.code}}));
  pass('Participant redeems invite');
  const dateISO=new Date(Date.now()+86400000*5).toISOString();
  const privateOuting=ok(await call('sessions',{method:'POST',token:host,body:{title:label+' private walk',clubId:privateClub.id,meetingPoint:'Parc test',hostName:'Host',programme:'Demo',dateISO,experience:{kind:'community',activity:'walk',format:'open',durationMinutes:45}}}));
  const publicOuting=ok(await call('sessions',{method:'POST',token:host,body:{title:label+' public walk',clubId:publicClub.id,meetingPoint:'Parc public',hostName:'Host',programme:'Demo',dateISO,experience:{kind:'community',activity:'walk',format:'open',durationMinutes:45}}}));
  assert.equal((await call(`sessions/${privateOuting.id}`,{token:outsider})).status,404);
  assert.ok(!ok(await call('sessions')).sessions.some(s=>s.id===privateOuting.id));
  assert.ok(ok(await call('sessions')).sessions.some(s=>s.id===publicOuting.id));
  pass('Public discoverable; private hidden from outsider/public list');
  ok(await call(`sessions/${publicOuting.id}/join`,{method:'POST',token:guest,body:{}}));
  ok(await call(`sessions/${privateOuting.id}/join`,{method:'POST',token:guest,body:{}}));
  ok(await call(`sessions/${privateOuting.id}/leave`,{method:'POST',token:guest,body:{}}));
  const mine=ok(await call('me/sessions',{token:guest})).sessions;
  assert.ok(mine.some(s=>s.id===publicOuting.id));
  assert.ok(!mine.some(s=>s.id===privateOuting.id));
  pass('Join public, join/leave private preserves other participation');
  report.complete=true; report.mode='d03-must-smoke';
 } catch (error) {
  report.error=error instanceof assert.AssertionError?'Assertion: '+error.message.split('\n')[0]:'Request failed';
 } finally {
  report.finishedAt=new Date().toISOString();
 }
 const out=process.env.D03_REPORT_PATH;
 if(out){mkdirSync(dirname(resolve(out)),{recursive:true});writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
 console.log(JSON.stringify(report,null,2));
 if(report.error)process.exitCode=1;
}

if(process.argv[1] && resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)) await main();
