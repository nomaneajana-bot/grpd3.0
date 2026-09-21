import {registerHooks, stripTypeScriptTypes, createRequire} from 'node:module';
import {readFileSync, existsSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const runtime = process.env.D02_TEST_RUNTIME;
if (!runtime) throw new Error('Set D02_TEST_RUNTIME to the isolated test dependencies directory');
const deps = createRequire(resolve(runtime,'package.json'));
const dependencyPaths = Object.fromEntries(["zod","jose","next/server"].map(name => [name, deps.resolve(name)]));
registerHooks({
 resolve(specifier, context, next) {
  let file;
  if (specifier.startsWith('@/')) file=resolve(root,specifier.slice(2));
  else if (specifier.startsWith('.') && context.parentURL?.startsWith(pathToFileURL(root).href)) file=resolve(dirname(fileURLToPath(context.parentURL)),specifier);
  if(file && !existsSync(file) && existsSync(file+'.ts')) file+='.ts';
  if(file && existsSync(file)) return {url:pathToFileURL(file).href,shortCircuit:true};
  if(specifier==='@prisma/client') return {url:pathToFileURL(resolve(runtime,'generated/index.js')).href,shortCircuit:true};
  if(['zod','jose','next/server'].includes(specifier)) return {url:pathToFileURL(dependencyPaths[specifier]).href,shortCircuit:true};
  return next(specifier,context);
 },
 load(url,context,next) {
  if(url.endsWith('.ts') && url.startsWith(pathToFileURL(root).href)) return {format:'module',source:stripTypeScriptTypes(readFileSync(fileURLToPath(url),'utf8')),shortCircuit:true};
  return next(url,context);
 }
});
