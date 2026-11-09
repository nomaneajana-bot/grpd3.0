# D02 technical evidence pack

Upload-ready materials for incubation funding deliverable **D02 — Backend, REST API, database, environments and CI/CD**.

## Verified tip

- **Git branch:** `cursor/d02-backend-cicd-38d2`
- **Commit:** filled after push (see `git rev-parse HEAD` on this branch)
- **Base:** `main` @ `b8a04b1`
- **Production deploy:** **not** changed (still the pre-existing email-auth production tip)

## Environment used for evidence

- Local disposable PostgreSQL database `grpd_test` on `127.0.0.1:5432`
- Synthetic `AUTH_JWT_SECRET=d02-local-test-jwt-secret-not-for-prod` (fixture only; value is not a production secret)
- Neon test branch created for future hosted Preview wiring: `grpd-d02-test-20261109` (project `GRPD` / `dry-tooth-73314920`) — connection string **not** stored in this pack

## Commands run (results on this machine)

| Command | Result |
|---------|--------|
| `npx prisma migrate deploy` | 6 migrations applied (`evidence/migrations.txt`) |
| `npm test -- --ci` | 7 suites / **69 passed** (`evidence/unit-tests.txt`) |
| `npm run typecheck:server` | **exit 0** (`evidence/typecheck-server.txt`) |
| `npm run test:d02 -- --ci` | 2 suites / **11 passed** (`evidence/d02-integration.txt`) |
| `npx tsx scripts/d02-evidence-capture.ts` | All 8 assertions **true** (`evidence/functional-captures.json`) |

CI: GitHub Actions workflow `.github/workflows/backend-verification.yml` (runs on push/PR). Confirm the Actions run on this branch is green after push.

## Portal upload mapping

### 1) Architecture and data schema

Upload:

- `D02_Architecture_and_Data_Schema.pdf`

Supporting sources (same folder):

- `D02_Architecture_and_Data_Schema.md` / `.html`
- `evidence/migrations.txt`
- Live schema: `prisma/schema.prisma` + `prisma/migrations/**`

### 2) Access to the API or test environment, and functional captures

Upload:

- `D02_API_Test_Environment.pdf`

Supporting sources:

- `D02_API_Test_Environment.md` / `.html`
- `evidence/functional-captures.json` (redacted JWT/passwords)
- `evidence/d02-integration.txt`, `evidence/unit-tests.txt`, `evidence/typecheck-server.txt`

## PDF export note

PDFs were generated with Chrome headless `--print-to-pdf` from the HTML exports. To regenerate:

```bash
pandoc D02_Architecture_and_Data_Schema.md -o D02_Architecture_and_Data_Schema.html --standalone
google-chrome --headless --no-sandbox --disable-gpu \
  --print-to-pdf=D02_Architecture_and_Data_Schema.pdf \
  file://$PWD/D02_Architecture_and_Data_Schema.html
# same for D02_API_Test_Environment
```

## Limitations

- Hosted Vercel **Preview** for this branch requires Preview env vars (`DATABASE_URL` for Neon test branch + synthetic `AUTH_JWT_SECRET`). Those secrets are not committed; configure them in the Vercel dashboard if a public preview URL is required beyond local/CI evidence.
- Production remains untouched by design.
