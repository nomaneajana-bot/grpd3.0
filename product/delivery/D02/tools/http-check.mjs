import './integration-loader.mjs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {startApiServer} from './http-server.mjs';
process.env.AUTH_JWT_SECRET=randomUUID()+randomUUID();
process.env.SUPABASE_URL='';process.env.SUPABASE_JWT_SECRET='';process.env.PIN_ALLOWLIST_JSON='';
const {signAppAccessToken}=await import('../../../../lib/server/app-jwt.ts');
const {prisma}=await import('../../../../lib/server/prisma.ts');
const host='http-host-'+randomUUID(),guest='http-guest-'+randomUUID();
const hostToken=await signAppAccessToken(host),guestToken=await signAppAccessToken(guest);
let api=await startApiServer();let count=0;
async function call(path,{method='GET',token,body,raw}={}) {
 const headers={};if(token)headers.authorization='Bearer '+token;
 if(body!==undefined||raw!==undefined)headers['content-type']='application/json';
 const r=await fetch(api.url+'/api/v1/'+path,{method,headers,body:raw??(body!==undefined?JSON.stringify(body):undefined)});
 return {status:r.status,body:await r.json(),headers:r.headers};
}
function ok(r){assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.ok,true);return r.body.data;}
function pass(message){count++;console.log('PASS '+message);}
try{
 const health=await call('health');assert.equal(ok(health).database,'ready');assert.equal(health.headers.get('cache-control'),'no-store');
 assert.equal((await call('health',{method:'POST'})).status,405);
 assert.equal((await call('missing')).status,404);
 assert.equal((await call('clubs/x/invite/extra',{method:'POST',token:hostToken,body:{}})).status,404);
 assert.equal((await call('clubs',{method:'POST',token:hostToken,raw:'{broken'})).status,400);
 pass('HTTP adapter preserves readiness, 404, 405, strict paths and malformed JSON status codes');
 assert.equal((await call('clubs',{method:'POST',token:'invalid',body:{name:'blocked'}})).status,401);
 assert.equal((await call('me/sessions')).status,401);
 pass('HTTP authentication rejects missing and invalid signed access tokens');
 const club=ok(await call('clubs',{method:'POST',token:hostToken,body:{name:'HTTP private club',visibility:'members'}}));
 const invitation=ok(await call(`clubs/${club.id}/invite`,{method:'POST',token:hostToken,body:{}}));
 ok(await call('clubs/join',{method:'POST',token:guestToken,body:{code:invitation.code}}));
 const outing=ok(await call('sessions',{method:'POST',token:hostToken,body:{title:'HTTP outing',meetingPoint:'Test meeting point',hostName:'Test host',programme:'Integration scenario',dateISO:new Date(Date.now()+86400000).toISOString(),clubId:club.id,experience:{kind:'community',activity:'walk',format:'open',durationMinutes:45}}}));
 assert.equal((await call(`sessions/${outing.id}`)).status,404);
 assert.equal((await call(`sessions/${outing.id}/participants`)).status,404);
 assert.ok(!ok(await call('sessions')).sessions.some(x=>x.id===outing.id));
 assert.equal(ok(await call(`sessions/${outing.id}`,{token:guestToken})).id,outing.id);
 pass('Actual HTTP club invitation and outing creation retain private-club visibility');
 await Promise.all([1,2,3].map(async()=>ok(await call(`sessions/${outing.id}/join`,{method:'POST',token:guestToken,body:{}}))));
 assert.equal(await prisma.sessionAttendance.count({where:{sessionId:outing.id,userId:guest}}),1);
 ok(await call(`sessions/${outing.id}/leave`,{method:'POST',token:guestToken,body:{}}));
 assert.equal((await prisma.sessionAttendance.findUnique({where:{sessionId_userId:{sessionId:outing.id,userId:guest}}})).status,'left');
 pass('HTTP join retries and cancellation agree with stored PostgreSQL attendance');
 await api.close();await prisma.$disconnect();api=await startApiServer();
 assert.equal(ok(await call(`sessions/${outing.id}`,{token:hostToken})).id,outing.id);
 pass('HTTP server restart and Prisma reconnection retain the same outing');
 console.log(`${count} HTTP integration groups passed against the Vercel adapter. Loopback test environment only.`);
}finally{await api.close();await prisma.$disconnect();}
