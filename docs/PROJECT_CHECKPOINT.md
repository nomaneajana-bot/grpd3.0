# GRPD Project Checkpoint

**Updated:** 2026-10-25 (Africa/Casablanca)  
**Working branch:** `cursor/architecture-remediation-3184`  
**Base visual tip:** `origin/cursor/stitch-home-detail-3184` @ `8cbfe83` (Stito Accueil + Détail + `/demo`)  
**Remediation tip:** see `git rev-parse HEAD` on branch · **API tested_sha:** `f920e4a` · **Batch C demo tested_sha:** in `batch-c-evidence.json`  
**Prior blueprint-only tip (avenir tree):** `69f0ecb` / audited `3ba6775` — **not an ancestor of Stito tip**; does **not** cover later demo/Stito  
**Method:** `docs/PROJECT_METHOD.md` · `AGENTS.md`  
**Workflow preserved:** inventory → product rules → canonical issue register → bounded journey implementation/testing → independent Codex review

## Current phase

**Architecture remediation (authorized by Nouamane)** — implement reported gaps in bounded batches; stop for Codex review after this package.  
Not a docs-only audit. Not production deploy. Not OCIF submission.

### Exact next action

1. Remaining queue items (batch discipline note, VERIFICATION, orphans/avenir/notifications reminders, Batch B demo UI, DELIVER) then **STOP for Codex**.  
2. No unrelated visual ports or production promotion. Batch E docs reconciliation **done**.

## Surfaces

| Surface | Status |
|---------|--------|
| Demo web Batch C (club→outing→join/leave) | **19/19 PASS** — `batch-c-evidence.json` |
| Demo web Batch D (settings + orphans) | **23/23 PASS** — `batch-d-evidence.json` |
| Connected API (local PG) | **16/16 PASS** — logout, PATCH club, member-group (`connected-evidence.json`) |
| Hosted / native / UAT | **Not claimed** · **BLOCKED** without authorized env |

## Working decisions

See `docs/audit/architecture-remediation/WORKING_DECISIONS.md`.

## Issue IDs this package

ISSUE-007, ISSUE-016, ISSUE-017, ISSUE-018, ISSUE-019 — **FIXED AWAITING RETEST** (Codex).
