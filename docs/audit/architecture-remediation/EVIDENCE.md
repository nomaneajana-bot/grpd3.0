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

## Demo web — Batch B auth → logout/relogin

| Field | Value |
|---|---|
| Script | `scripts/architecture-remediation-batch-b-smoke.mjs` |
| Manifest | `batch-b-evidence.json` · `BATCH_B.md` |
| Environment | **demo** `http://127.0.0.1:38303` |
| tested_sha | `cd42a80bd07fc78fd8d74c862654630b13d7b4a0` |
| Result | **16 PASS / 0 FAIL** |
| Screenshots | `docs/audit/architecture-remediation/batch-b/*.png` |
| Hosted / native / UAT / OCIF | **false** |
| DEMO OTP | `000000` DEMO_MODE-only — not production auth |

## Batch E — docs reconciliation

| Field | Value |
|---|---|
| Doc | `BATCH_E.md` |
| Blueprint | Tip truth in remediation addendum; §1–§10 historical @ `3ba6775` with tip callouts |
| Stale docs | `docs/architecture.md`, `docs/dead-routes.md` bannered HISTORICAL (preserved) |
| Rule | `.cursor/rules/app-architecture.mdc` → addendum + sole register + decisions ≠ OCIF |
| Issue register | **single** — `docs/product/ISSUE_REGISTER.md` |
| Historical evidence | Other `docs/audit/**` folders left intact |

## Notifications (decision #5 / D4 / ISSUE-017)

| Field | Value |
|---|---|
| Doc | `NOTIFICATIONS.md` |
| Evidence | `notifications-evidence.json` **14/14** · `notifications/*.png` |
| Push delivery | **Not claimed / not implemented** |

## `/avenir` (decision #4 / ISSUE-019)

| Field | Value |
|---|---|
| Doc | `AVENIR.md` · D10 |
| Evidence | `avenir-evidence.json` **15/15** · `avenir/*.png` |
| Forced tab | **false** |

## Orphans (decision #3 / ISSUE-007)

| Field | Value |
|---|---|
| Doc | `ORPHANS.md` · working decisions D7–D9 |
| Evidence | `orphans-evidence.json` **12/12** · `orphans/*.png` |
| Invented activity/coach | **false** |
| group-edit params | `clubId` + `groupId` preserved on redirect |

## VERIFICATION (package)

| Field | Value |
|---|---|
| Doc | `VERIFICATION.md` |
| Demo interactive | `verification-demo-evidence.json` **17/17** · `verification/*.png` |
| Connected PG (re-run) | `connected-evidence.json` **16/16** @ tip `b9d4755…` |
| Integration PG | **22/22** · artifact log |
| Typecheck server | **PASS** |
| Client `tsc` | **5 pre-existing** `TS18048` in `app/session/[id].tsx` — not fixed as remediation scope |
| Hosted | **BLOCKED** · `verification/hosted-probe.json` |
| Native / UAT / OCIF | **Not claimed** |

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
