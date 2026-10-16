# Batch 6 evidence — LOCAL runtime wiring

- **tested_sha:** `83b5e096d4f17ade3cd1660c7a1293f7d2906cbf`
- **branch:** `cursor/green-home-ux-join-3184`
- **environment:** `local_postgres_integration` · **hosted_claim:** false · **deploy_claim:** false
- **PG:** 21/21 PASS · **unit:** 11/11 PASS (lifecycle + apiMode demo)
- **Prior diagnosis accepted:** RUNTIME_MAP `6b05559` / tip `4403447`

## What landed (local)

- Vercel entry `api/v1/[...path].ts` + `vercel-dispatch.ts` (cancel-request registered)
- `vercel.json` API rewrite vs SPA exclusion
- Bearer auth (app JWT); no `req.auth` network fallback; all `requireAuth` callers `await`ed (20 sites)
- Health JSON; Batch5 leave/cancel semantics preserved
- Connected ApiClient exercised against local HTTP fronting dispatcher; missing URL → `MISSING_API_URL` (not silent mock)
- Demo/apiMode unit still PASS

## Logs (repo-relative, sanitized)

- `docs/audit/batch6-runtime-wiring/logs/pg-integration.log`
- `docs/audit/batch6-runtime-wiring/logs/unit-regressions.log`
- `docs/audit/batch6-runtime-wiring/logs/config-names.log`

## Deployment

See `DEPLOYMENT_PLAN.md` — **not executed** this batch.
