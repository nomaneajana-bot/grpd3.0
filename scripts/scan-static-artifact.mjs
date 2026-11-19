/**
 * Scan a static Expo web export for leaked secrets and mode flags.
 * Usage: node scripts/scan-static-artifact.mjs <dir> [--expect-demo|--expect-connected]
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.argv[2] || "dist-connected");
const expectDemo = process.argv.includes("--expect-demo");
const expectConnected = process.argv.includes("--expect-connected") || !expectDemo;
const expectedTestUrl = process.env.EXPECTED_API_URL || "http://127.0.0.1:3999";

if (!existsSync(root)) {
  console.error("Missing artifact dir:", root);
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const secretPatterns = [
  { name: "AUTH_JWT_SECRET_assignment", re: /AUTH_JWT_SECRET\s*[:=]\s*["'][^"']+["']/ },
  { name: "SUPABASE_JWT_SECRET_assignment", re: /SUPABASE_JWT_SECRET\s*[:=]\s*["'][^"']+["']/ },
  { name: "DATABASE_URL_assignment", re: /DATABASE_URL\s*[:=]\s*["'][^"']+["']/ },
  { name: "PIN_ALLOWLIST_JSON_assignment", re: /PIN_ALLOWLIST_JSON\s*[:=]\s*["'\[]/ },
  { name: "postgres_connection_uri", re: /postgresql:\/\/[^\s"'`]+/i },
  { name: "private_key_pem", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];

const files = walk(root).filter((f) => /\.(js|html|json|txt|css)$/i.test(f));
const blob = files.map((f) => readFileSync(f, "utf8")).join("\n");
const findings = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const rel = relative(root, file);
  for (const { name, re } of secretPatterns) {
    if (re.test(text)) findings.push({ file: rel, pattern: name });
  }
}

// featureFlags Metro form: DEMO_MODE getter → const n=!0|!1
const demoFlagMatch = blob.match(
  /"DEMO_MODE",\{enumerable:!0,get:function\(\)\{return n\}\}[\s\S]{0,120}?const t=!0,n=(!0|!1)/,
);
const demoModeBaked =
  demoFlagMatch == null ? null : demoFlagMatch[1] === "!0";

const apiUrlEmbedded = blob.includes(expectedTestUrl);
const mockEnvFnFalse = /function u\(\)\{return!1\}/.test(blob) ||
  /isExplicitMockEnv[\s\S]{0,80}return !1/.test(blob) ||
  /return!1\},826,/.test(blob);

const report = {
  artifact: root,
  mode: expectDemo ? "demo" : "connected",
  fileCount: files.length,
  secretPatternHits: findings.length,
  findings: findings.slice(0, 20),
  demoModeBaked,
  apiUrlEmbedded,
  expectedTestUrl,
  mockEnvReturnsFalse: mockEnvFnFalse,
};

let ok = findings.length === 0;
if (expectConnected) {
  ok =
    ok &&
    demoModeBaked === false &&
    apiUrlEmbedded === true;
}
if (expectDemo) {
  ok = ok && demoModeBaked === true;
}

console.log(JSON.stringify(report, null, 2));
if (!ok) {
  console.error("FAIL static artifact scan");
  process.exit(1);
}
console.log(
  expectConnected
    ? "PASS connected static artifact: no secret assignments; DEMO_MODE=false; test API URL embedded"
    : "PASS demo static artifact: DEMO_MODE=true; no secret assignments",
);
