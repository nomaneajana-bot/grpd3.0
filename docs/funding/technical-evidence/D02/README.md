# D02 technical evidence pack

Upload-ready materials for incubation funding deliverable **D02 — Backend, REST API, database, environments and CI/CD**.

## Verified tip

- **Git branch:** `cursor/d02-backend-cicd-38d2`
- **Implementation commit (evidence captures):** `4a09e47b8d53a0e5be454567bd0cd883ac066190`
- **Branch tip after CI install fix:** `6bebba4` (and later doc revisions on this branch)
- **Base:** `main` @ `b8a04b1`
- **Production deploy:** **not** changed

## Environments

| Environment | Status |
|-------------|--------|
| Local disposable Postgres via `scripts/d02-setup-local-db.sh` | **Verified** (authoritative for functional captures) |
| GitHub Actions `Backend verification` | **Verified** (green on branch) |
| Hosted Vercel Preview with Preview env vars | **Future option only** — not claimed as D02 acceptance |
| Production | **Unchanged** |

Local credentials are written to gitignored `.env.d02.local`. **Do not** paste passwords or JWT secrets into PDFs or evidence.

## Commands run (results on this machine)

| Command | Result |
|---------|--------|
| `npx prisma migrate deploy` | 6 migrations applied (`evidence/migrations.txt`) |
| `npm test -- --ci` | 7 suites / **69 passed** (`evidence/unit-tests.txt`) |
| `npm run typecheck:server` | **exit 0** (`evidence/typecheck-server.txt`) |
| `npm run test:d02 -- --ci` | 2 suites / **11 passed** (`evidence/d02-integration.txt`) |
| `npx tsx scripts/d02-evidence-capture.ts` | All 8 assertions **true** (`evidence/functional-captures.json`) |

CI: `.github/workflows/backend-verification.yml` — green on this PR branch.

## Portal upload mapping

### 1) Architecture and data schema

- Upload: `D02_Architecture_and_Data_Schema.pdf`
- Sources: `D02_Architecture_and_Data_Schema.md` / `.html`, `evidence/migrations.txt`, `prisma/schema.prisma`

### 2) Access to the API or test environment, and functional captures

- Upload: `D02_API_Test_Environment.pdf`
- Sources: `D02_API_Test_Environment.md` / `.html`, `evidence/functional-captures.json`, other `evidence/*` transcripts

## Regenerate PDFs (project process)

```bash
cd docs/funding/technical-evidence/D02
pandoc D02_Architecture_and_Data_Schema.md -o D02_Architecture_and_Data_Schema.html --standalone --metadata title="D02 Architecture and Data Schema"
pandoc D02_API_Test_Environment.md -o D02_API_Test_Environment.html --standalone --metadata title="D02 API Test Environment"

mkdir -p /tmp/chrome-pdf-d02
google-chrome --headless --no-sandbox --disable-gpu \
  --user-data-dir=/tmp/chrome-pdf-d02 \
  --no-pdf-header-footer \
  --print-to-pdf="$PWD/D02_Architecture_and_Data_Schema.pdf" \
  "file://$PWD/D02_Architecture_and_Data_Schema.html"

google-chrome --headless --no-sandbox --disable-gpu \
  --user-data-dir=/tmp/chrome-pdf-d02 \
  --no-pdf-header-footer \
  --print-to-pdf="$PWD/D02_API_Test_Environment.pdf" \
  "file://$PWD/D02_API_Test_Environment.html"
```

## Limitations

- Supabase JWT helper code exists but is **unused** in verified D02 environments (no `SUPABASE_*` configured).
- Hosted Preview is not the D02 acceptance environment unless Preview secrets are explicitly configured later.
- Production remains untouched.
