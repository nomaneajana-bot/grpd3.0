# Orphans disposition (decision default #3 / ISSUE-007)

**Rule:** Wire `test-history` / `run/setup` only if they complete an **existing** MVP journey. Otherwise exclude from primary nav, mark deferred, keep safe deep-links. Do **not** invent activity tracking or coaching scope. Preserve `group-edit` → `group-create` + params.

**Verified tip:** `orphans-evidence.json` · demo · **12/12** · `git rev-parse` at run stamped in JSON.

## Dependency / approved-scope checks

| Route | Completes existing MVP journey? | Dependencies | Disposition |
|---|---|---|---|
| `/profile/test-history` | **No** — advanced training / PR history removed with Entraînement avancé | Would need activity-tracking / test-history product scope | **DEFERRED** — Redirect → `/(tabs)/profile`; source retained; **not** in primary nav |
| `/run/setup` | **No** on connected — no `/api/v1/runs`; club sorties cover join/organise MVP | Runs API + coaching/matching scope **not approved** to invent | **DEFERRED / BLOCKED connected** — deep-link kept; demo mock form OK; connected shows `run-setup-deferred` honesty UI |
| `/club/group-edit` | N/A — deprecated alias | Compatible with `group-create` | **KEEP redirect** — params `clubId` + `groupId` preserved |

## Invented scope explicitly rejected

| Temptation | Decision |
|---|---|
| Rebuild test history / activity tracking to “green” inventory | **Blocked** — out of MVP |
| Ship connected runs/coaching to make `/run/setup` work | **Blocked** — D13; no `/runs` API |
| Remove deep-link files entirely | **Rejected** — safe handling retained |
| Drop `group-edit` redirect | **Rejected** — params-preserving redirect kept |

## Primary navigation

Confirmed **no inbound** `router`/`href` to `test-history`, `run/setup`, or `group-edit` from `app/` / `components/` (only self files + club `_layout` screen registration).

## Runtime evidence (demo)

| Check | Result |
|---|---|
| `test-history` → `/profile` | PASS |
| `run/setup` loads safely (demo form) | PASS |
| `group-edit?clubId=club_orphan_x&groupId=B` → `group-create?clubId=…&groupId=B` | PASS |
| Profile has no test-history CTA | PASS |

Screenshots: `docs/audit/architecture-remediation/orphans/*.png`

## Status

**FIXED AWAITING RETEST** (Codex) — implemented dispositions verified; not OCIF; hosted not claimed.
