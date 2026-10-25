# Batch D — settings + orphan dispositions (demo)

**Scope:** Retained settings actions; unsupported rows honest (Hors MVP / no fake toasts); orphan deep links safe; back behavior; phone + desktop layout. No redesign.

| Field | Value |
|---|---|
| Script | `scripts/architecture-remediation-batch-d-smoke.mjs` |
| Manifest | `batch-d-evidence.json` |
| Environment | **demo** web |
| Result | **23 PASS / 0 FAIL** |
| Hosted / native / UAT / full a11y | **Not claimed** |

## Settings (ISSUE-017)

| Check | Result |
|---|---|
| Loads with Langue / Unités | PASS |
| No push delivery claim | PASS |
| Hors MVP non-interactive (no nav) | PASS |
| Language toggle + reload persist | PASS |
| Units toggle | PASS |
| Notification rows present (local) | PASS |
| Back from settings | PASS |
| Logout control present | PASS |
| Phone + desktop readable | PASS |

Row table: `SETTINGS_DISPOSITION.md`.

## Orphans (ISSUE-007 / D7–D10)

| Route | Disposition verified |
|---|---|
| `/profile/test-history` | Redirects to `/profile` |
| `/run/setup` | Demo form loads (safe); connected deferred UI in source (`run-setup-deferred`) — demo surface does not claim connected |
| `/club/group-edit?clubId&groupId` | Redirects to `group-create` **with params preserved** |
| `/avenir` | Loads + enter CTA navigates (demo) |

## Explicitly not claimed

- Connected `/run/setup` deferred runtime (code path present; DEMO_MODE uses form)
- Full keyboard/a11y UAT
- Hosted push / legal CMS
