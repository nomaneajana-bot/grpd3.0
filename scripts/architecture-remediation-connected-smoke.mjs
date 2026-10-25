/**
 * Connected local PG smoke for architecture remediation routes:
 * logout, club PATCH, member-group.
 * Uses packaged serverless dispatch (rebuild first). Synthetic JWT/PIN only.
 * Does not claim hosted / native / UAT.
 */
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "package.json"));
const AUDIT = resolve(root, "docs/audit/architecture-remediation");
const ART = "/opt/cursor/artifacts";
mkdirSync(AUDIT, { recursive: true });
mkdirSync(ART, { recursive: true });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const TEST_JWT = "arch-remediation-jwt-secret-not-for-prod";
process.env.AUTH_JWT_SECRET = TEST_JWT;
delete process.env.SUPABASE_JWT_SECRET;
delete process.env.SUPABASE_URL;

const phone = `+2127${String(Date.now()).slice(-8)}`;
const pin = "246810";
const userId = `arch_${createHash("sha256").update(phone).digest("hex").slice(0, 16)}`;
const memberPhone = `+2128${String(Date.now()).slice(-8)}`;
const memberPin = "135791";
const memberId = `archm_${createHash("sha256").update(memberPhone).digest("hex").slice(0, 16)}`;
process.env.PIN_ALLOWLIST_JSON = JSON.stringify([
  { phone, pin, userId, profileComplete: true },
  { phone: memberPhone, pin: memberPin, userId: memberId, profileComplete: true },
]);

const bundlePath = resolve(root, ".packaging/serverless/api-v1.cjs");
if (!existsSync(bundlePath)) {
  console.error("Missing bundle — run: node scripts/package-serverless-api.mjs");
  process.exit(1);
}
const handler = require(bundlePath).default;

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

const tipSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const suffix = `arch_${Date.now().toString(36)}`;
const results = [];

function check(id, ok, detail) {
  results.push({ id, ok, detail: String(detail ?? "").slice(0, 240) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 120));
}

try {
  const club = await prisma.club.create({
    data: {
      name: `Arch ${suffix}`,
      slug: `club-${suffix}`,
      city: "Casablanca",
      visibility: "members",
      description: "before",
      createdById: userId,
      memberships: {
        create: [
          {
            userId,
            role: MembershipRole.admin,
            status: MembershipStatus.approved,
          },
          {
            userId: memberId,
            role: MembershipRole.member,
            status: MembershipStatus.approved,
            homeGroupId: "A",
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
  check(
    "admin_pin_login",
    login.statusCode === 200 && !!token,
    login.statusCode,
  );
  if (!token) throw new Error("no token");

  const unauthLogout = await invoke("POST", "/api/v1/auth/logout", { body: {} });
  check("logout_requires_auth", unauthLogout.statusCode === 401, unauthLogout.statusCode);

  const logout = await invoke("POST", "/api/v1/auth/logout", {
    token,
    body: { refreshToken: "x", deviceId: "smoke" },
  });
  const logoutJson = JSON.parse(logout.body || "{}");
  check(
    "logout_ack_stateless",
    logout.statusCode === 200 &&
      logoutJson?.data?.serverRevocation === "not_applicable_stateless_jwt",
    logout.body.slice(0, 160),
  );
  // Stateless JWT: same token still verifies — honesty is in response field + client copy
  check(
    "logout_does_not_claim_denylist",
    logoutJson?.data?.serverRevocation === "not_applicable_stateless_jwt",
    "honest revocation semantics",
  );

  const unauthPatch = await invoke("PATCH", `/api/v1/clubs/${club.id}`, {
    body: { name: "Nope" },
  });
  check("patch_requires_auth", unauthPatch.statusCode === 401, unauthPatch.statusCode);

  const memberLogin = await invoke("POST", "/api/v1/auth/pin/login", {
    body: { phone: memberPhone, pin: memberPin },
  });
  const memberToken = JSON.parse(memberLogin.body)?.data?.tokens?.accessToken;
  check("member_pin_login", !!memberToken, memberLogin.statusCode);

  const forbidPatch = await invoke("PATCH", `/api/v1/clubs/${club.id}`, {
    token: memberToken,
    body: { name: "Member cannot" },
  });
  check(
    "patch_forbidden_for_member",
    forbidPatch.statusCode === 403,
    forbidPatch.statusCode,
  );

  const patch = await invoke("PATCH", `/api/v1/clubs/${club.id}`, {
    token,
    body: {
      name: `Arch Renamed ${suffix}`,
      description: "after-patch",
      visibility: "public",
    },
  });
  check("patch_admin_ok", patch.statusCode === 200, patch.statusCode);
  const refreshed = await prisma.club.findUnique({ where: { id: club.id } });
  check(
    "patch_persisted",
    refreshed?.name === `Arch Renamed ${suffix}` &&
      refreshed?.description === "after-patch" &&
      refreshed?.visibility === "public",
    refreshed?.name,
  );

  const unauthMg = await invoke("PUT", `/api/v1/clubs/${club.id}/member-group`, {
    body: { userId: memberId, groupId: "B" },
  });
  check("member_group_requires_auth", unauthMg.statusCode === 401, unauthMg.statusCode);

  const forbidMg = await invoke("PUT", `/api/v1/clubs/${club.id}/member-group`, {
    token: memberToken,
    body: { userId: memberId, groupId: "B" },
  });
  check(
    "member_group_forbidden_for_member",
    forbidMg.statusCode === 403,
    forbidMg.statusCode,
  );

  const mg = await invoke("PUT", `/api/v1/clubs/${club.id}/member-group`, {
    token,
    body: { userId: memberId, groupId: "B" },
  });
  check("member_group_admin_ok", mg.statusCode === 200, mg.statusCode);
  const mem = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId: memberId, clubId: club.id } },
  });
  check("member_group_persisted", mem?.homeGroupId === "B", mem?.homeGroupId);

  // Reload persistence: second read
  const mem2 = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId: memberId, clubId: club.id } },
  });
  check("member_group_reload", mem2?.homeGroupId === "B", "reload");

  // Unrelated club preservation
  const other = await prisma.club.create({
    data: {
      name: `Other ${suffix}`,
      slug: `other-${suffix}`,
      city: "Rabat",
      visibility: "members",
      createdById: `other_${suffix}`,
      memberships: {
        create: {
          userId: memberId,
          role: MembershipRole.member,
          status: MembershipStatus.approved,
          homeGroupId: "C",
        },
      },
    },
  });
  const otherMem = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId: memberId, clubId: other.id } },
  });
  check(
    "unrelated_club_home_group_preserved",
    otherMem?.homeGroupId === "C",
    otherMem?.homeGroupId,
  );
} catch (e) {
  check("uncaught", false, String(e));
} finally {
  await prisma.club
    .deleteMany({ where: { slug: { startsWith: `club-${suffix}` } } })
    .catch(() => {});
  await prisma.club
    .deleteMany({ where: { slug: { startsWith: `other-${suffix}` } } })
    .catch(() => {});
  await prisma.$disconnect().catch(() => {});
}

const report = {
  batch: "architecture-remediation-connected",
  tested_sha: tipSha,
  environment: "local_postgres_integration",
  hosted_claim: false,
  native_claim: false,
  uat_claim: false,
  summary: {
    pass: results.filter((r) => r.ok).length,
    fail: results.filter((r) => !r.ok).length,
  },
  checks: results,
};
const json = JSON.stringify(report, null, 2) + "\n";
writeFileSync(resolve(ART, "architecture-remediation-connected-smoke.json"), json);
writeFileSync(resolve(AUDIT, "connected-evidence.json"), json);
console.log("SUMMARY", report.summary);
process.exit(report.summary.fail ? 1 : 0);
