# Batch 6 evidence — LOCAL runtime wiring (Codex corrections)

- **tested_sha:** `4dad7495bcb1239dcc65e2a451d07f99db9cf43d`
- **prior Codex review:** `74fef39` / tested `83b5e09` — **NOT cleared**; corrections in this tip
- **branch:** `cursor/green-home-ux-join-3184`
- **environment:** `local_postgres_integration` · **hosted_claim:** false · **deploy_claim:** false
- **PG Batch5:** 15/15 · **PG Batch6:** 7/7 · **unit:** 113/113 · **typecheck:server:** PASS (37 entrypoints, typescript 5.9.3)

## Corrections applied

1. **jose JWT restored** (no custom crypto) — strict alg/issuer/sub/exp/nbf; Jest ESM via `babel.jest.config.js`
2. **Connected-client** uses real `resolveApiTransport` (env/module reset + isolated storage; **no transport spy**); missing URL fails; demo remains independent
3. **PIN login** registered on dispatcher (`auth/pin/login`); login → token → protected leave via real entry + `loginWithPin`; bad login rejected
4. **Server typecheck** with workspace TypeScript (`npm run typecheck:server`); Preview settings in plan marked **UNVERIFIED** (not inspected)

## Logs (repo-relative, sanitized)

- `docs/audit/batch6-runtime-wiring/logs/pg-integration-batch5.log`
- `docs/audit/batch6-runtime-wiring/logs/pg-integration-batch6.log`
- `docs/audit/batch6-runtime-wiring/logs/unit-regressions.log`
- `docs/audit/batch6-runtime-wiring/logs/typecheck-server.log`
- `docs/audit/batch6-runtime-wiring/logs/config-names.log`

## Deployment

See `DEPLOYMENT_PLAN.md` — **not executed** this batch. Remote Preview env **UNVERIFIED**.
