# D02 — API test environment and functional captures

**Branch:** `cursor/d02-backend-cicd-38d2`  
**Purpose:** Portal evidence item 2 — access to the API/test environment + functional captures  
**Safety:** No production secrets, no real user credentials, no live JWTs in this document

## 1. How to access the test environment

### Local disposable API test (verified on this branch)

Prerequisites: Node 24+, PostgreSQL listening locally.

```bash
# Create disposable DB (example used for evidence)
sudo -u postgres psql -c "CREATE USER grpd_test WITH PASSWORD 'grpd_test_local_only' SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE grpd_test OWNER grpd_test;"

export DATABASE_URL='postgresql://grpd_test:grpd_test_local_only@127.0.0.1:5432/grpd_test'
export AUTH_JWT_SECRET='d02-local-test-jwt-secret-not-for-prod'   # synthetic only

npx prisma generate
npx prisma migrate deploy

# Automated journeys (auth success, 401, 403)
npm run test:d02 -- --ci

# Sanitized functional captures for the portal
npx tsx scripts/d02-evidence-capture.ts
```

Artifacts written to `docs/funding/technical-evidence/D02/evidence/`:

- `functional-captures.json` — redacted request/response transcript
- `d02-integration.txt` — Jest D02 suite output
- `unit-tests.txt`, `typecheck-server.txt`, `migrations.txt`

### CI test environment

GitHub Actions workflow: `.github/workflows/backend-verification.yml`

- Spins up Postgres 14 on port `55439`
- Runs `prisma migrate deploy`, unit tests, server typecheck, `npm run test:d02`
- Uploads `d02-ci-results/` as a workflow artifact

### Hosted preview / production

- **Production was not redeployed** for D02.
- Existing production (`grpd30.vercel.app`) currently tracks an older email-auth preview branch and is out of scope for this evidence pack.
- To exercise a hosted **preview** of *this* branch later: open the PR → Vercel Preview URL → set Preview env `DATABASE_URL` (Neon test branch) + `AUTH_JWT_SECRET` (synthetic) in the Vercel project settings for Preview only. Do not paste those values into evidence files.

## 2. Functional captures (real results)

Source of truth: `evidence/functional-captures.json`  
Captured at: see `capturedAt` inside that file.

| Step | Method / path | Expected | Result |
|------|---------------|----------|--------|
| Health | `GET /api/v1/health` | 200, database ready | **PASS** (`healthOk: true`) |
| Register | `POST /api/v1/auth/email/register` | 200 + tokens | **PASS** (`registerOk: true`) |
| Unauthenticated | `GET /api/v1/me/memberships` (no Bearer) | 401 `UNAUTHORIZED` | **PASS** (`unauthRejected: true`) |
| Create club | `POST /api/v1/clubs` (admin Bearer) | 200 | **PASS** (`createClubOk: true`) |
| Invite | `POST /api/v1/clubs/:id/invite` | 200 + code | **PASS** (`inviteOk: true`) |
| Join | `POST /api/v1/clubs/join-by-code` | 200 | **PASS** (`joinOk: true`) |
| Role deny | `GET /api/v1/clubs/:id/roster` as member | 403 `FORBIDDEN` | **PASS** (`memberRosterForbidden: true`) |
| Role allow | `GET /api/v1/clubs/:id/roster` as admin | 200 + members | **PASS** (`adminRosterOk: true`) |

### Excerpt — unauthenticated rejection

```json
{
  "step": "3_unauth_me",
  "method": "GET",
  "path": "/api/v1/me/memberships",
  "status": 401,
  "response": {
    "ok": false,
    "error": { "message": "Unauthorized", "code": "UNAUTHORIZED" }
  }
}
```

### Excerpt — role access check

Member roster call returns `403 FORBIDDEN`; admin roster call returns `200` with members array (see captures `7_roster_member_forbidden` and `8_roster_admin_ok`).

## 3. Commands and results executed for this pack

```text
npx prisma migrate deploy     → 6 migrations applied (evidence/migrations.txt)
npm test -- --ci              → 7 suites / 69 tests passed (evidence/unit-tests.txt)
npm run typecheck:server      → exit 0 (evidence/typecheck-server.txt)
npm run test:d02 -- --ci      → 2 suites / 11 tests passed (evidence/d02-integration.txt)
npx tsx scripts/d02-evidence-capture.ts → all assertions true (evidence/functional-captures.json)
```

## 4. Limitations

- Local disposable DB passwords shown above are **synthetic fixtures** for evaluators recreating the harness; they are not production credentials.
- Hosted Preview URL for this exact commit is created by Vercel when the PR is pushed; if Preview env vars are not yet configured, use the local/CI harness as the authoritative functional proof.
- PIN allowlist auth is available for fixture-only CI (`PIN_ALLOWLIST_JSON`); email auth is the self-serve path documented for testers.
