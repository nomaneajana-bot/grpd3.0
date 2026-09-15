import {readFileSync,writeFileSync,cpSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../../..');
const runtime=process.env.D02_TEST_RUNTIME;
if(!runtime) throw new Error('D02_TEST_RUNTIME required');
const url=new URL(process.env.DATABASE_URL||'');
if(url.hostname!=='127.0.0.1'||url.port!=='55439') throw new Error('Only the isolated local test database is allowed');
const schema=readFileSync(resolve(root,'prisma/schema.prisma'),'utf8').replace('provider = "prisma-client-js"',`provider = "prisma-client-js"\n  output = ${JSON.stringify(resolve(runtime,'generated'))}`);
writeFileSync(resolve(runtime,'schema.prisma'),schema);
cpSync(resolve(root,'prisma/migrations'),resolve(runtime,'migrations'),{recursive:true});
for(const args of [['generate','--schema',resolve(runtime,'schema.prisma')],['migrate','deploy','--schema',resolve(runtime,'schema.prisma')]]) {
 const result=spawnSync(process.execPath,[resolve(runtime,'node_modules/prisma/build/index.js'),...args],{cwd:runtime,stdio:'inherit',env:process.env});
 if(result.status!==0) process.exit(result.status??1);
}
