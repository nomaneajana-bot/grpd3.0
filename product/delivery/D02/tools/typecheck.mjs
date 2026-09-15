import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readdirSync} from 'node:fs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../../..');
const runtime=process.env.D02_TEST_RUNTIME;if(!runtime)throw new Error('D02_TEST_RUNTIME required');
const deps=createRequire(resolve(runtime,'package.json'));const ts=deps('typescript');
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?(e.name==='__tests__'?[]:walk(resolve(dir,e.name))):(e.name.endsWith('.ts')?[resolve(dir,e.name)]:[]));
const roots=[...walk(resolve(root,'app/api/v1')),...walk(resolve(root,'lib/server')),resolve(root,'api/v1/[...path].ts')];
const options={noEmit:true,strict:true,skipLibCheck:true,esModuleInterop:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,baseUrl:root,types:['node'],typeRoots:[resolve(runtime,'node_modules/@types')],paths:{'@/*':['./*'],'@prisma/client':[resolve(runtime,'generated/index.d.ts')],'zod':[resolve(runtime,'node_modules/zod')],'jose':[resolve(runtime,'node_modules/jose')],'next/*':[resolve(runtime,'node_modules/next/*')],'@vercel/node':[resolve(runtime,'node_modules/@vercel/node')]}};
const program=ts.createProgram(roots,options);const diagnostics=ts.getPreEmitDiagnostics(program);
if(diagnostics.length){console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));process.exit(1);}
console.log(`PASS strict TypeScript check: ${roots.length} backend route/helper/adapter entrypoints and their dependencies`);
