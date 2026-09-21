## Verified hosted acceptance checkpoint - 21 September 2026, Cursor
Isolated D02 Preview PIN auth configured (AUTH_JWT_SECRET + PIN_ALLOWLIST_JSON, Preview / codex/d02-backend-verification only). Automation bypass created; SSO deployment protection remains enabled. Production DATABASE_URL unchanged.
Redeploy dpl_6CNMNchG44cXqHgxmvJ3X6pt3UW2 Ready on commit 05f73a4cbcdb36b7614cada84a905ec1b6a954c8.
URL: https://grpd30-355kzkwzz-noas-projects-0b3f311d.vercel.app
hosted-check.mjs authenticated-test: 8/8 PASS, complete=true (evidence/2026-09-21/hosted-runner-preview.json). Neon persistence verified on grpd_d02_test (hosted-persistence-neon.json).
French D02 review/docs refreshed; PDF regenerated. D02 technical criteria for architecture/API/Test env are met for Codex review. Financial originals and stakeholder/OCIF acceptance remain open. D03 not started.
NEXT for Codex: milestone/dossier review. Owner may add named evaluator Visit access if needed. Do not merge main or submit OCIF from this checkpoint.

# GRPD - Cursor handoff
Updated 21 September 2026 (hosted acceptance). Owner: Nouamane. Working directory: /Users/noa/Desktop/grpd3.0.
Separate D02 worktree used: /tmp/grpd-d02-worktree (branch codex/d02-backend-verification). Dirty main checkout preserved.

## Mission and division of work
Cursor handled implementation and heavy testing for D02 hosted acceptance. Codex reserved for milestone review and OCIF evidence decisions. Resume existing product; do not restart. After Codex review of this checkpoint, continue D03 mobile when instructed.

## Working rules
- This checkout contains extensive unrelated uncommitted mobile/design work. Preserve it. Never reset, clean, stage everything or overwrite local changes.
- Local Git HEAD on main does not represent the published D02 branch. Use /tmp/grpd-d02-worktree for D02 publishes.
- Existing draft PR: https://github.com/nomaneajana-bot/grpd3.0/pull/4 . Branch: codex/d02-backend-verification. No main merge or OCIF submission in this mission.
- Public repository: never commit .env, connection strings, tokens, private financial documents or user data.
- Do not invent invoices, bank evidence, supplier attribution, acceptance, successful tests or production readiness.

## Last verified published / exercised version
Commit: 05f73a4cbcdb36b7614cada84a905ec1b6a954c8.
CI passed: https://github.com/nomaneajana-bot/grpd3.0/actions/runs/35607697453 .
Preview deployment (post PIN auth env): dpl_6CNMNchG44cXqHgxmvJ3X6pt3UW2 Ready.
Preview URL: https://grpd30-355kzkwzz-noas-projects-0b3f311d.vercel.app
Branch alias: https://grpd30-git-codex-d02-backend-veri-6f38b5-noas-projects-0b3f311d.vercel.app
Vercel project: prj_M5oKQEy7NTYOO9eWy5TOgd1eO2cQ; SSO protection still enabled.

## Actual Neon / Vercel Test setup - do not recreate
Neon project GRPD dry-tooth-73314920; branch grpd-d02-test / br-super-voice-ahsrux4i; database grpd_d02_test migrated (eight migrations).
Preview-only secrets on codex/d02-backend-verification: DATABASE_URL, AUTH_JWT_SECRET, PIN_ALLOWLIST_JSON. Production All Environments DATABASE_URL unchanged.
Automation bypass exists for authorized hosted checks; do not disable deployment protection. Secrets live in /tmp/grpd-d02-preview-secrets.env and /tmp/grpd-d02-runtime.env (mode 0600) — never commit.

## Hosted acceptance results (genuine)
Tool: product/delivery/D02/tools/hosted-check.mjs
Report: product/delivery/D02/evidence/2026-09-21/hosted-runner-preview.json
Persistence: product/delivery/D02/evidence/2026-09-21/hosted-persistence-neon.json
Mode authenticated-test, complete=true, eight PASS groups including clubs, invites, outings, join/cancel, invalid input.
Distinct from local evidence hosted-runner-local.json and CI logs.

## Documentation refreshed
- product/delivery/D02/REPRISE_2026-09-21.md
- product/delivery/D02/ARCHITECTURE.md
- product/delivery/D02/API_ENVIRONNEMENT.md
- product/delivery/D02/ACCES_ET_RECETTE_HEBERGEE.md
- product/delivery/D02/CONFORMITE_D02.json
- output/pdf/GRPD_D02_Reprise_2026-09-21.pdf

## D02 technical vs open items
Met for technical D02 scope: architecture, modelling, secured REST API journeys on isolated Test, Dev/Test/Production separation documented, CI/CD with verified Preview.
Not met / owner-Codex: definitive invoices/payment evidence; stakeholder UAT; OCIF submission; D03 mobile builds; Production go-live (D05).

## Checkpoint return
See conversation final report for files/commit, deployment URL/SHA, tests, evidence paths, blockers, and technical-criteria verdict.
