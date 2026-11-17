/**
 * Import the packaged serverless CJS bundle and exercise health + PIN login
 * + protected leave against disposable local Postgres.
 * Synthetic AUTH_JWT_SECRET / PIN_ALLOWLIST only. No remote writes.
 */
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomBytes } from "node:crypto";
import http from "node:http";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "package.json"));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL required for local PG smoke");
  process.exit(1);
}

const TEST_JWT = "batch6-predeploy-packaging-jwt-secret-not-for-prod";
process.env.AUTH_JWT_SECRET = TEST_JWT;
delete process.env.SUPABASE_JWT_SECRET;
delete process.env.SUPABASE_URL;

const phone = `+2126${String(Date.now()).slice(-8)}`;
const pin = "135791";
const userId = `pkg_${createHash("sha256").update(phone).digest("hex").slice(0, 16)}`;
process.env.PIN_ALLOWLIST_JSON = JSON.stringify([
  { phone, pin, userId, profileComplete: true },
]);

const bundlePath = resolve(root, ".packaging/serverless/api-v1.cjs");
const handler = require(bundlePath).default;
if (typeof handler !== "function") {
  console.error("Bundle default export is not a handler function");
  process.exit(1);
}

// Prove jose/next resolved inside the required bundle (runtime import).
const jose = require("jose");
if (!jose.SignJWT || !jose.jwtVerify) {
  console.error("Installed jose missing SignJWT/jwtVerify");
  process.exit(1);
}

const { PrismaClient, MembershipRole, MembershipStatus } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

function invoke(method, urlPath, { token, body } = {}) {
  return new Promise((resolvePromise, reject) => {
    const state = { statusCode: 200, headers: {}, body: "" };
    const req = {
      method,
      url: urlPath,
      headers: {
        host: "127.0.0.1",
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ?? {},
    };
    const res = {
      status(code) {
        state.statusCode = code;
        return res;
      },
      setHeader(key, value) {
        state.headers[key.toLowerCase()] = String(value);
        return res;
      },
      send(payload) {
        state.body =
          typeof payload === "string" ? payload : JSON.stringify(payload);
        return res;
      },
      json(payload) {
        state.headers["content-type"] = "application/json";
        state.body = JSON.stringify(payload);
        return res;
      },
    };
    Promise.resolve(handler(req, res))
      .then(() => resolvePromise(state))
      .catch(reject);
  });
}

const suffix = `pkg_${Date.now().toString(36)}`;
const results = [];

try {
  // Runtime import smoke via local HTTP wrapping the same handler.
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString("utf8");
    const state = await invoke(req.method || "GET", req.url || "/", {
      token: req.headers.authorization?.replace(/^Bearer\s+/i, "") || null,
      body: raw ? JSON.parse(raw) : {},
    });
    res.writeHead(state.statusCode, {
      "content-type": state.headers["content-type"] || "application/json",
    });
    res.end(state.body);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const addr = server.address();
  const base = `http://127.0.0.1:${addr.port}`;

  const health = await invoke("GET", "/api/v1/health");
  results.push({
    check: "health_json_ready",
    ok: health.statusCode === 200 && /"database"\s*:\s*"ready"/.test(health.body),
    status: health.statusCode,
  });
  if (!results.at(-1).ok) throw new Error("health failed: " + health.body);

  const badLogin = await invoke("POST", "/api/v1/auth/pin/login", {
    body: { phone, pin: "000000" },
  });
  results.push({
    check: "bad_login_401",
    ok: badLogin.statusCode === 401 && /INVALID_PIN/.test(badLogin.body),
    status: badLogin.statusCode,
  });
  if (!results.at(-1).ok) throw new Error("bad login: " + badLogin.body);

  const club = await prisma.club.create({
    data: {
      name: `Pkg ${suffix}`,
      slug: `club-${suffix}`,
      city: "Casablanca",
      visibility: "members",
      createdById: `owner_${suffix}`,
      memberships: {
        create: [
          {
            userId: `owner_${suffix}`,
            role: MembershipRole.admin,
            status: MembershipStatus.approved,
          },
          {
            userId,
            role: MembershipRole.member,
            status: MembershipStatus.approved,
          },
        ],
      },
    },
  });

  const login = await invoke("POST", "/api/v1/auth/pin/login", {
    body: { phone, pin },
  });
  const loginJson = JSON.parse(login.body);
  const token = loginJson?.data?.tokens?.accessToken;
  results.push({
    check: "pin_login_token",
    ok:
      login.statusCode === 200 &&
      !!token &&
      loginJson?.data?.user?.id === userId,
    status: login.statusCode,
  });
  if (!results.at(-1).ok) throw new Error("login failed: " + login.body);

  const unauth = await invoke("POST", `/api/v1/clubs/${club.id}/leave`, {
    body: {},
  });
  results.push({
    check: "protected_leave_requires_bearer",
    ok: unauth.statusCode === 401,
    status: unauth.statusCode,
  });

  const leave = await invoke("POST", `/api/v1/clubs/${club.id}/leave`, {
    token,
    body: {},
  });
  results.push({
    check: "login_token_protected_leave",
    ok: leave.statusCode === 200,
    status: leave.statusCode,
  });
  if (!results.at(-1).ok) throw new Error("leave failed: " + leave.body);

  const gone = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId, clubId: club.id } },
  });
  results.push({
    check: "membership_removed",
    ok: gone === null,
  });

  // HTTP path also works (same handler).
  const httpHealth = await fetch(`${base}/api/v1/health`);
  const httpText = await httpHealth.text();
  results.push({
    check: "http_runtime_import_health",
    ok: httpHealth.status === 200 && /ready/.test(httpText),
    status: httpHealth.status,
  });

  await new Promise((r, j) => server.close((e) => (e ? j(e) : r())));

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ results, failed: failed.length }, null, 2));
  if (failed.length) process.exit(1);
  console.log("PASS serverless local smoke: health + auth + protected leave");
} finally {
  await prisma.club.deleteMany({ where: { slug: { startsWith: `club-${suffix}` } } }).catch(() => {});
  await prisma.$disconnect().catch(() => {});
}
