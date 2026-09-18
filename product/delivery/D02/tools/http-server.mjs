import './integration-loader.mjs';
import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
const {default:handler}=await import('../../../../api/v1/[...path].ts');

/** Loopback-only harness for the actual Vercel adapter, not a replacement API. */
export async function startApiServer(port=0,{page}={}) {
 const db=new URL(process.env.DATABASE_URL||'');
 if(db.hostname!=='127.0.0.1'||db.port!=='55439') throw new Error('Dedicated test database required');
 const server=createServer(async(req,res)=>{
  try {
   const url=new URL(req.url,'http://127.0.0.1');
   if(url.pathname==='/'&&page){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(page);return;}
   if(!url.pathname.startsWith('/api/v1/')) {res.writeHead(404);res.end('Not found');return;}
   const chunks=[];let size=0;
   for await(const chunk of req) {
    size+=chunk.length;
    if(size>1024*1024) {res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,error:{code:'PAYLOAD_TOO_LARGE'}}));return;}
    chunks.push(chunk);
   }
   req.query={...Object.fromEntries(url.searchParams),path:url.pathname.slice(8).split('/').map(decodeURIComponent)};
   if(chunks.length) req.body=Buffer.concat(chunks).toString('utf8');
   res.status=function(status){res.statusCode=status;return res;};
   res.send=function(body){res.end(body);return res;};
   res.json=function(body){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(body));return res;};
   await handler(req,res);
  } catch {if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,error:{code:'INTERNAL_ERROR'}}));}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 return {server,url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 process.env.AUTH_JWT_SECRET=randomUUID()+randomUUID();
 process.env.SUPABASE_URL='';process.env.SUPABASE_JWT_SECRET='';process.env.PIN_ALLOWLIST_JSON='';
 const {signAppAccessToken}=await import('../../../../lib/server/app-jwt.ts');
 const accounts=await Promise.all(['d02-local-host','d02-local-member'].map(id=>signAppAccessToken(id)));
 const page=readFileSync(new URL('./api-console.html',import.meta.url),'utf8').replace('/*TEST_ACCOUNTS*/[]',JSON.stringify(accounts));
 const running=await startApiServer(Number(process.env.D02_HTTP_PORT||8092),{page});
 console.log(`D02 local verification console: ${running.url}/ (test identities only; not a production login)`);
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await running.close();process.exit(0);});
}
