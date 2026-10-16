# Batch 6 — predeployment packaging evidence

- **tested_sha:** *(filled at stamp — packaging tip)*  
- **prior local Batch6 (CLEARED):** `4dad7495bcb1239dcc65e2a451d07f99db9cf43d`  
- **branch:** `cursor/green-home-ux-join-3184`  
- **hosted_claim / deploy_claim:** false  
- **Vercel settings inspection:** **BLOCKED** (CLI logged out; MCP needsAuth; no login)

## Proven

| Check | Result |
|-------|--------|
| Expo web connected build | PASS → `dist-connected/` |
| Connected static: no secrets; DEMO false; test URL embedded | PASS |
| Expo web demo build (separate) | PASS → `dist-demo/` |
| Demo static: DEMO true | PASS |
| Serverless CJS package (esbuild + installed next/jose) | PASS → `.packaging/serverless/api-v1.cjs` |
| Runtime import health + PIN login→leave on local PG | PASS (7/7) |

## Logs

Under `docs/audit/batch6-predeploy-packaging/logs/`.

## Checklist

`PREVIEW_CHECKLIST.md` — only open owner decisions; no deploy executed.
