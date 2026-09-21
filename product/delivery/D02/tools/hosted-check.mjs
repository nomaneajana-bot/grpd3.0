/** Run against an explicitly designated test environment. Never prints credentials. */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';

export async function verifyHosted({base,hostToken,guestToken,bypass,writeOrigin,request=fetch}) {
 const url=new URL(base);
 assert.ok(url.protocol==='https:' || (url.protocol==='http:' && url.hostname==='127.0.0.1'),'HTTPS required outside loopback');
 assert.equal(url.pathname,'/','Provide an origin, without path');
 assert.ok(!url.username && !url.password && !url.search && !url.hash,'Origin must not contain credentials or parameters');
 const report={origin:url.origin,startedAt:new Date().toISOString(),checks:[],records:{clubs:[],outings:[]},complete:false};
 async function call(path,{method='GET',token,body}={}) {
  const headers={};if(token)headers.authorization='Bearer '+token;
  if(bypass)headers['x-vercel-protection-bypass']=bypass;
  if(body!==undefined)headers['content-type']='application/json';
  const r=await request(url.origin+'/api/v1/'+path,{method,headers,redirect:'error',signal:AbortSignal.timeout(30000),body:body===undefined?undefined:JSON.stringify(body)});
  assert.ok(r.headers.get('content-type')?.includes('application/json'),`Expected API JSON for ${path}, HTTP ${r.status}`);
  return {status:r.status,body:await r.json()};
 }
 function ok(r){assert.equal(r.status,200,'Expected successful API response');assert.equal(r.body.ok,true);return r.body.data;}
 function pass(name){report.checks.push({name,result:'PASS'});}
 try {
  assert.equal(ok(await call('health')).database,'ready');pass('Readiness JSON');
  assert.equal((await call('me/sessions')).status,401);pass('Nested endpoint rejects anonymous access');
  assert.equal((await call('missing')).status,404);pass('Unknown route rejected');
  if(!hostToken && !guestToken){report.mode='read-only';return report;}
  assert.ok(hostToken && guestToken && hostToken!==guestToken,'Two distinct test identities required');
  assert.equal(writeOrigin,url.origin,'Explicit designated test origin required before any writes');
  ok(await call('me/sessions',{token:hostToken}));ok(await call('me/sessions',{token:guestToken}));
  const label='D02 test '+randomUUID().slice(0,8);
  const privateClub=ok(await call('clubs',{method:'POST',token:hostToken,body:{name:label+' Language',visibility:'members'}}));
  report.records.clubs.push(privateClub.id);
  const publicClub=ok(await call('clubs',{method:'POST',token:hostToken,body:{name:label+' Founders',visibility:'public',joinMode:'open'}}));
  report.records.clubs.push(publicClub.id);assert.notEqual(privateClub.id,publicClub.id);
  const discovered=ok(await call('clubs')).clubs;assert.ok(!discovered.some(c=>c.id===privateClub.id));
  assert.equal((await call(`clubs/${privateClub.id}`,{token:guestToken})).status,404);
  pass('Independent clubs and private discovery');
  const invite=ok(await call(`clubs/${privateClub.id}/invite`,{method:'POST',token:hostToken,body:{}}));
  for(let i=0;i<2;i++)ok(await call('clubs/join',{method:'POST',token:guestToken,body:{code:invite.code}}));
  pass('Invitation redemption and retry');
  const dateISO=new Date(Date.now()+86400000*7).toISOString();
  async function create(title,clubId){const outing=ok(await call('sessions',{method:'POST',token:hostToken,body:{title,clubId,meetingPoint:'Fictional test meeting point',hostName:'D02 test host',programme:'Automated acceptance fixture',dateISO,experience:{kind:'community',activity:'walk',format:'open',durationMinutes:45}}}));report.records.outings.push(outing.id);return outing;}
  const a=await create(label+' private walk',privateClub.id),b=await create(label+' public walk',publicClub.id);
  assert.notEqual(a.id,b.id);
  assert.equal((await call(`sessions/${a.id}`)).status,404);
  assert.equal((await call(`sessions/${a.id}/participants`)).status,404);
  assert.ok(!ok(await call('sessions')).sessions.some(s=>s.id===a.id));
  const detail=ok(await call(`sessions/${a.id}`,{token:guestToken}));
  assert.equal(detail.title,a.title);assert.equal(detail.clubId,privateClub.id);assert.equal(detail.dateISO,dateISO);
  pass('Multiple outings retain logistics and privacy');
  for(const outing of [a,b])ok(await call(`sessions/${outing.id}/join`,{method:'POST',token:guestToken,body:{}}));
  for(let i=0;i<2;i++)ok(await call(`sessions/${a.id}/join`,{method:'POST',token:guestToken,body:{}}));
  let mine=ok(await call('me/sessions',{token:guestToken})).sessions;
  assert.equal(mine.filter(s=>s.id===a.id).length,1);assert.ok(mine.some(s=>s.id===b.id));
  for(let i=0;i<2;i++)ok(await call(`sessions/${a.id}/leave`,{method:'POST',token:guestToken,body:{}}));
  mine=ok(await call('me/sessions',{token:guestToken})).sessions;
  assert.ok(!mine.some(s=>s.id===a.id));assert.ok(mine.some(s=>s.id===b.id));
  pass('Selected join/cancel and retries preserve other participation');
  assert.equal((await call('sessions',{method:'POST',token:hostToken,body:{title:'Invalid date',dateISO:'not-a-date'}})).status,400);
  assert.equal((await call('clubs',{method:'POST',token:hostToken,body:{}})).status,400);
  pass('Invalid input rejected');
  report.mode='authenticated-test';report.complete=true;
 } catch(error){report.error=error instanceof assert.AssertionError?'Acceptance assertion failed: '+error.message.split('\n')[0]:'Request failed; inspect environment and access without logging tokens';}
 finally {report.finishedAt=new Date().toISOString();}
 return report;
}

if(process.argv[1] && resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)) {
 const report=await verifyHosted({base:process.env.D02_HOSTED_ORIGIN,writeOrigin:process.env.D02_TEST_WRITE_ORIGIN,hostToken:process.env.D02_HOST_TOKEN,guestToken:process.env.D02_GUEST_TOKEN,bypass:process.env.D02_VERCEL_BYPASS});
 const output=process.env.D02_REPORT_PATH;
 if(output){mkdirSync(dirname(resolve(output)),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
 console.log(JSON.stringify(report,null,2));
 if(report.error)process.exitCode=1;
}
