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

1. Remaining queue: avenir CTA · notifications honesty · Batch B (already verified) · **DELIVER** · then **STOP for Codex**.  
2. Orphans (#3) **confirmed** — `ORPHANS.md` · **12/12**. VERIFICATION done. No production promotion. No broad acceptance / OCIF.

## Surfaces

| Surface | Status |
|---------|--------|
| Demo VERIFICATION (interactive handlers) | **17/17 PASS** — `verification-demo-evidence.json` @ `b9d4755` |
| Demo web Batch B (auth→logout→relogin) | **16/16 PASS** — `batch-b-evidence.json` @ `cd42a80` |
| Demo web Batch C (club→outing→join/leave) | **19/19 PASS** — `batch-c-evidence.json` |
| Demo web Batch D (settings + orphans) | **23/23 PASS** — `batch-d-evidence.json` |
| Connected API (local PG) | **16/16 PASS** (re-run @ `b9d4755`) — logout, PATCH, member-group, unrelated preserve |
| Integration PG + JWT unit | **22 + 11 PASS** |
| Hosted / native / UAT | **Hosted BLOCKED** (Vercel Auth) · native/UAT **not claimed** |

## Working decisions

See `docs/audit/architecture-remediation/WORKING_DECISIONS.md`.

## Issue IDs this package

ISSUE-007, ISSUE-016, ISSUE-017, ISSUE-018, ISSUE-019 — **FIXED AWAITING RETEST** (Codex).
