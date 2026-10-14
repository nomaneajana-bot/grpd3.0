# GRPD Project Checkpoint

**Updated:** 2026-10-14  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 tip under test (DEMO gate CLEARED):** `959b1ac18db002ef90fc430c1662f750e4796acf`  
**Batch 1 DEMO gate:** **CLEARED** (Codex) — hosted/native/UAT **not** accepted  
**Batch 1 full regression after Batch 2 tip:** re-run PASS (31/31) — see `docs/audit/batch2-walk-join/batch1-full-regression-evidence.json`  
**Batch 2 tip under test / `tested_sha`:** `6d36691` (exact: see evidence.json)  
**Batch 2 evidence:** `docs/audit/batch2-walk-join/evidence.json` — **42/42 PASS** · env `demo` · `hosted_claim: false`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH 2 STILL OPEN — STOP for Codex review (corrections).**  
Codex requested: past/invalid datetime checks, honest cancelled-list assert, real double-join/retry, remove bilingual M06 annotation, full Batch1 privacy controls.  
Do **not** advance to next batch until Codex clears this gate.

## Design / scope lock

- Preserve green-home experienceTheme / approved visual direction.
- Maquettes are design proposals — not acceptance.
- M08 design annotation must never appear in product UI.
- No merge, production deploy, new spending, credential changes, or OCIF submission.
- No hosted claim from demo.
- Creator auto-attendance and public-club association: **unresolved** — current behavior preserved and reported.

## Batch 1 — DEMO gate CLEARED (surfaces preserved)

| Surface | Status |
|---------|--------|
| Demo | **CLEARED** at `959b1ac`; full controls re-PASS after Batch 2 tip |
| Hosted | Not claimed / not accepted |
| Native | Not verified |
| UAT | Not run |

## Batch 2 — OPEN (corrected demo evidence)

| Item | Detail |
|------|--------|
| Issues | ISSUE-003; ISSUE-010 participation; M04/M05/M06; M07 gutters |
| Future fixture | Day+2 @ 10:30 local; past today 00:00 blocks publish |
| Join | Per-user `joinedSessions`; controlled 503 then retry; rapid double → one attendance row |
| M06 | French only; short phone 320×568 controls reachable |
| Privacy | Member / outsider / pending / ex-member + nested full Batch1 script 31/31 |
| Evidence | `docs/audit/batch2-walk-join/` — **42/42 PASS** |

### Unresolved (report only)

1. **Creator auto-attendance** — host still auto-joined on create.  
2. **Public + club association** — public still nulls `clubId`.

## Exact next action

1. **Codex** re-reviews Batch 2 corrected demo evidence.  
2. No next batch / merge / production / credentials / spending.

## Surfaces

| Surface | This checkpoint |
|---------|-----------------|
| Demo | Batch 1 CLEARED; Batch 2 corrected evidence **executed** (42/42) — awaiting Codex |
| Hosted | Not claimed |
| Multi-context | Not run |
| Native | Not verified |
| UAT | Not run |
