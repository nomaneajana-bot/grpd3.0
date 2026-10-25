# Architecture remediation — evidence index

**Method:** inventory → working decisions → issue register → bounded batches → Codex stop  
**Branch:** `cursor/architecture-remediation-3184`

## Connected local Postgres

| Field | Value |
|---|---|
| Script | `scripts/architecture-remediation-connected-smoke.mjs` |
| Manifest | `docs/audit/architecture-remediation/connected-evidence.json` |
| Artifact | `/opt/cursor/artifacts/architecture-remediation-connected-smoke.json` |
| Environment | `local_postgres_integration` |
| Result | **16 PASS / 0 FAIL** |
| Hosted claim | false |
| Covers | logout authz + stateless ack + post-logout token still valid (no denylist); club PATCH; member-group persist/reload; unrelated club preserved |
| Semantics | `LOGOUT_SEMANTICS.md` · `SETTINGS_DISPOSITION.md` |

## Demo web

| Field | Value |
|---|---|
| Script | `scripts/architecture-remediation-smoke.mjs` |
| Status | Written; **not claimed run** until message queue empty / follow-up verification turn |
| Serve | `dist-demo` on `:8082` (export previously completed) |

## Docs updated this package

- `WORKING_DECISIONS.md`
- `CLIENT_API_INVENTORY.md`
- `BEFORE_AFTER.md`
- `SETTINGS_DISPOSITION.md` (row-level D3 / ISSUE-017)
- `docs/product/ISSUE_REGISTER.md` (007, 016–019)
- `docs/PROJECT_CHECKPOINT.md`
- `APP_BLUEPRINT.md` remediation addendum
