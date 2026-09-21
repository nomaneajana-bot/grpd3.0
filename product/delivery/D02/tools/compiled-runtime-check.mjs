/** Checks runtime imports without the integration loader or TypeScript path aliases.
 * This local packaging check does not establish Vercel deployment readiness.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,symlinkSync,readdirSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname,relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../../..');
const runtime=process.env.D02_TEST_RUNTIME;
if(!runtime)throw new Error('D02_TEST_RUNTIME required');
const ts=createRequire(resolve(runtime,'package.json'))('typescript');
const stage=mkdtempSync(join(tmpdir(),'grpd-compiled-check-'));
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?(e.name==='__tests__'?[]:walk(join(d,e.name))):e.name.endsWith('.ts')?[join(d,e.name)]:[]);
const inputs=[...walk(join(root,'app/api/v1')),...walk(join(root,'lib/server')),join(root,'api/v1/[...path].ts'),join(root,'lib/phone-normalize.ts')];
// Include transitive relative source dependencies, but never repair alias imports.
for(let i=0;i<inputs.length;i++){
 for(const {fileName} of ts.preProcessFile(readFileSync(inputs[i],'utf8'),true,true).importedFiles){
  if(!fileName.startsWith('.'))continue;
  const base=resolve(dirname(inputs[i]),fileName);
  const dep=[base+'.ts',join(base,'index.ts')].find(existsSync);
  if(dep && !inputs.includes(dep)){
   assert.ok(dep.startsWith(root+'/'),'Dependency must stay in repository');inputs.push(dep);
  }
 }
}
try {
 for(const file of inputs){
  const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.Node16,esModuleInterop:true}}).outputText;
  const dest=join(stage,relative(root,file).replace(/\.ts$/,'.js'));mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,js);
 }
 mkdirSync(join(stage,'node_modules/@prisma'),{recursive:true});
 for(const dep of ['next','jose','zod'])symlinkSync(resolve(runtime,'node_modules',dep),join(stage,'node_modules',dep),'dir');
 symlinkSync(resolve(runtime,'generated'),join(stage,'node_modules/@prisma/client'),'dir');
 const routes=inputs.filter(f=>f.endsWith('/route.ts')).map(f=>'./'+relative(root,f).replace(/\.ts$/,'.js'));
 const child=`const assert=require('node:assert/strict');
 const routes=${JSON.stringify(routes)};
 for(const p of routes)require(p);
 console.log('PASS '+routes.length+' compiled route modules load with native Node resolution');
 const handler=require('./api/v1/[...path].js').default;
 async function call(path,method='GET',body,query={}){
  let result={};const res={status(n){result.status=n;return this},setHeader(){},send(s){result.body=JSON.parse(s)},json(v){result.body=v}};
  await handler({method,url:'/api/v1/'+path,headers:{host:'localhost',...(body?{'content-type':'application/json'}:{})},query,body},res);return result;
 }
 (async()=>{
  for(const [path,method,body,status] of [['missing','GET',undefined,404],['health','POST',undefined,405],['me/sessions','GET',undefined,401],['clubs','POST','{bad',400]]) {
   const r=await call(path,method,body);assert.equal(r.status,status,JSON.stringify(r));assert.equal(r.body.ok,false);
  }
  for(const query of [{},{path:'health'},{path:['health']}]) {
   assert.equal((await call('me/sessions','GET',undefined,query)).status,401);
  }
  for(const path of ['health/extra','health%2Fextra','health%5Cextra','%ZZ','health//']) {
   assert.equal((await call(path)).status,404,path);
  }
  assert.equal((await call('me/sessions?path=health')).status,401);
  console.log('PASS compiled adapter: missing/conflicting query path, strict URL paths, 404/405/401/400');
 })().catch(e=>{console.error(e);process.exitCode=1});`;
 writeFileSync(join(stage,'check.cjs'),child);
 // A fresh environment prevents accidental reads of real credentials or databases.
 const env={PATH:process.env.PATH,NODE_ENV:'test',DATABASE_URL:'postgresql://unused@127.0.0.1:1/unused'};
 const run=spawnSync(process.execPath,[join(stage,'check.cjs')],{cwd:stage,env,encoding:'utf8',timeout:30000});
 process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');
 assert.equal(run.status,0,run.error?.message||'Compiled runtime failed');
 const adapter=join(stage,'api/v1/[...path].js');
 const nativeImport='require("../../lib/server/vercel-dispatch")';
 const compiled=readFileSync(adapter,'utf8');
 assert.ok(compiled.includes(nativeImport),'Expected adapter import absent');
 writeFileSync(adapter,compiled.replace(nativeImport,'require("@/lib/server/vercel-dispatch")'));
 const negative=spawnSync(process.execPath,['-e',`require('node:assert/strict').throws(()=>require('./api/v1/[...path].js'),e=>e.code==='MODULE_NOT_FOUND'&&e.message.includes('@/lib/server/vercel-dispatch'))`],{cwd:stage,env,encoding:'utf8',timeout:10000});
 assert.equal(negative.status,0,'Negative control must reject the previously published alias');
 console.log('PASS negative control: previously published alias is rejected by native resolution');
 console.log('PASS compiled-runtime smoke check; no custom resolver and no database operations');
} finally {rmSync(stage,{recursive:true,force:true});}
