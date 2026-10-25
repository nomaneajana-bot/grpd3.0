# GRPD Project Checkpoint

**Updated:** 2026-10-25 (Africa/Casablanca)  
**Working branch:** `cursor/architecture-remediation-3184`  
**Base visual tip:** `origin/cursor/stitch-home-detail-3184` @ `8cbfe83` (Stito Accueil + Détail + `/demo`)  
**Remediation tip:** `5ad1f7c` (docs/evidence) · **API tested_sha:** `6ffbcbc`  
**Prior blueprint-only tip (avenir tree):** `69f0ecb` / audited `3ba6775` — **not an ancestor of Stito tip**; does **not** cover later demo/Stito  
**Method:** `docs/PROJECT_METHOD.md` · `AGENTS.md`  
**Workflow preserved:** inventory → product rules → canonical issue register → bounded journey implementation/testing → independent Codex review

## Current phase

**Architecture remediation (authorized by Nouamane)** — implement reported gaps in bounded batches; stop for Codex review after this package.  
Not a docs-only audit. Not production deploy. Not OCIF submission.

### Exact next action

1. Finish demo web Playwright smoke (`scripts/architecture-remediation-smoke.mjs`) when follow-up queue allows full verification.  
2. **STOP for Codex** independent review of `docs/audit/architecture-remediation/` + tip SHA.  
3. Do not start unrelated visual ports or production promotion.

## Surfaces

| Surface | Status |
|---------|--------|
| Demo web (Stito home/detail) | Preserved from stitch tip — UI smoke script ready; full run deferred while queue active |
| Connected API (local PG) | **15/15 PASS** — logout, PATCH club, member-group (`connected-evidence.json`) |
| Hosted / native / UAT | **Not claimed** · **BLOCKED** without authorized env |

## Working decisions

See `docs/audit/architecture-remediation/WORKING_DECISIONS.md`.

## Issue IDs this package

ISSUE-007, ISSUE-016, ISSUE-017, ISSUE-018, ISSUE-019 — **FIXED AWAITING RETEST** (Codex).
