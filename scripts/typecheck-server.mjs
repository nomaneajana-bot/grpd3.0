/**
 * Strict typecheck of backend route/helper/adapter entrypoints using the
 * workspace's installed TypeScript + runtime deps (jose, next, @vercel/node,
 * @prisma/client, zod) — not a Next.js shim-only pass.
 */
import { createRequire } from "node:module";
import { readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "package.json"));
const ts = require("typescript");

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules") return [];
      return walk(p);
    }
    return e.name.endsWith(".ts") ? [p] : [];
  });
}

const roots = [
  ...walk(resolve(root, "app/api/v1")),
  ...walk(resolve(root, "lib/server")),
  resolve(root, "api/v1/[...path].ts"),
  resolve(root, "lib/phone-normalize.ts"),
];

const options = {
  noEmit: true,
  strict: true,
  skipLibCheck: true,
  esModuleInterop: true,
  allowSyntheticDefaultImports: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  isolatedModules: true,
  jsx: ts.JsxEmit.Preserve,
  baseUrl: root,
  types: ["node"],
  paths: {
    "@/*": ["./*"],
  },
};

const program = ts.createProgram(roots, options);
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (f) => f,
      getCurrentDirectory: () => root,
      getNewLine: () => "\n",
    }),
  );
  process.exit(1);
}
console.log(
  `PASS strict TypeScript check: ${roots.length} backend route/helper/adapter entrypoints and their dependencies (workspace typescript ${ts.version})`,
);
