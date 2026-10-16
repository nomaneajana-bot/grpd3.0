/**
 * Package api/v1/[...path].ts into a Node serverless-style CJS bundle using
 * workspace-installed esbuild + next/jose (not Jest shims).
 *
 * Prisma stays external (native engine). Output is for local packaging proof only —
 * this script does not deploy or write to remote services.
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "package.json"));
const esbuild = require("esbuild");

const outDir = resolve(root, ".packaging/serverless");
const outfile = resolve(outDir, "api-v1.cjs");
mkdirSync(outDir, { recursive: true });

const entry = resolve(root, "api/v1/[...path].ts");
if (!existsSync(entry)) {
  console.error("Missing entry:", entry);
  process.exit(1);
}

const result = await esbuild.build({
  absWorkingDir: root,
  entryPoints: [entry],
  outfile,
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  sourcemap: true,
  logLevel: "info",
  // Keep Prisma engine outside the JS bundle (native).
  external: ["@prisma/client", ".prisma/client"],
  // Resolve workspace deps (next, jose, @vercel/node, zod, …).
  nodePaths: [resolve(root, "node_modules")],
  metafile: true,
});

writeFileSync(
  resolve(outDir, "api-v1.meta.json"),
  JSON.stringify(result.metafile, null, 2),
);

const inputs = Object.keys(result.metafile.inputs);
const hasJose = inputs.some((p) => p.includes("node_modules/jose/"));
const hasNext = inputs.some((p) => p.includes("node_modules/next/"));
const hasDispatch = inputs.some((p) => p.includes("lib/server/vercel-dispatch"));
const hasAppJwt = inputs.some((p) => p.includes("lib/server/app-jwt"));

const summary = {
  outfile,
  bytes: result.metafile.outputs[outfile.replace(root + "/", "")]?.bytes
    ?? result.metafile.outputs[Object.keys(result.metafile.outputs)[0]]?.bytes
    ?? null,
  inputCount: inputs.length,
  includes: {
    jose: hasJose,
    next: hasNext,
    vercelDispatch: hasDispatch,
    appJwt: hasAppJwt,
  },
};

writeFileSync(resolve(outDir, "bundle-summary.json"), JSON.stringify(summary, null, 2));
console.log("PASS serverless package:", JSON.stringify(summary, null, 2));

if (!hasJose || !hasNext || !hasDispatch || !hasAppJwt) {
  console.error("FAIL: expected jose, next, vercel-dispatch, and app-jwt in bundle inputs");
  process.exit(1);
}
