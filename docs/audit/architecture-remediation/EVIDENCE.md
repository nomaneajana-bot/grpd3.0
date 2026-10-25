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

## Demo web — Batch C journey

| Field | Value |
|---|---|
| Script | `scripts/architecture-remediation-batch-c-smoke.mjs` |
| Manifest | `batch-c-evidence.json` · `BATCH_C.md` |
| Result | **19 PASS / 0 FAIL** |
| Screenshots | `docs/audit/architecture-remediation/batch-c/*.png` |

## Demo web — Batch D settings + orphans

| Field | Value |
|---|---|
| Script | `scripts/architecture-remediation-batch-d-smoke.mjs` |
| Manifest | `batch-d-evidence.json` · `BATCH_D.md` |
| Result | **23 PASS / 0 FAIL** |
| Screenshots | `docs/audit/architecture-remediation/batch-d/*.png` |

## Demo web — package smoke (settings/avenir combined)

| Field | Value |
|---|---|
| Script | `scripts/architecture-remediation-smoke.mjs` |
| Status | Still available; Batch D supersedes settings/avenir deep-link checks for this package |

## Batch E — docs reconciliation

| Field | Value |
|---|---|
| Doc | `BATCH_E.md` |
| Blueprint | Tip truth in remediation addendum; §1–§10 historical @ `3ba6775` with tip callouts |
| Stale docs | `docs/architecture.md`, `docs/dead-routes.md` bannered HISTORICAL (preserved) |
| Rule | `.cursor/rules/app-architecture.mdc` → addendum + sole register + decisions ≠ OCIF |
| Issue register | **single** — `docs/product/ISSUE_REGISTER.md` |
| Historical evidence | Other `docs/audit/**` folders left intact |

## Batch A — inventory + mode

| Field | Value |
|---|---|
| Doc | `BATCH_A.md` · `CLIENT_API_INVENTORY.md` |
| Mode matrix | `batch-a-mode-evidence.json` **11/11** |

## Transport / deployment (decision #1)

| Field | Value |
|---|---|
| Doc | `TRANSPORT_AND_DEPLOYMENT.md` |
| Matrix | `transport-mode-matrix.json` **6/6** |
| Production / D05 | **Not claimed** |

## Docs updated this package

- `WORKING_DECISIONS.md` · `TRANSPORT_AND_DEPLOYMENT.md`
- `CLIENT_API_INVENTORY.md`
- `BEFORE_AFTER.md` · `SETTINGS_DISPOSITION.md` · `BATCH_C.md` · `BATCH_D.md`
- `docs/product/ISSUE_REGISTER.md` (007, 016–019)
- `docs/PROJECT_CHECKPOINT.md`
- `APP_BLUEPRINT.md` remediation addendum
