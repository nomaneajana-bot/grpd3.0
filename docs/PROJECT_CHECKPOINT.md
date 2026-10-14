# GRPD Project Checkpoint

**Updated:** 2026-10-14  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 tip under test:** `959b1ac18db002ef90fc430c1662f750e4796acf`  
**Batch 1 DEMO gate:** **CLEARED** (Codex) — hosted/native/UAT **not** accepted  
**Batch 2 tip under test / `tested_sha`:** `5991af54a0fae693c9dfc3d9def016f3c38c1c98`  
**Batch 2 evidence:** `docs/audit/batch2-walk-join/evidence.json` — **33/33 PASS** · env `demo` · `hosted_claim: false`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH 2 COMPLETE FOR CURSOR — STOP for Codex review.**  
Theme: WALK / LANGUAGE CREATE → DETAIL → JOIN → CANCEL (+ M06 confirm, M07 gutters).  
Batch 1 **demo** evidence gate remains CLEARED. Hosted / native / UAT remain **not** accepted.

## Design / scope lock

- Preserve green-home experienceTheme / approved visual direction.
- Maquettes at `product/design/community-journey-v1/maquettes.html` are design proposals — not acceptance.
- M08 design annotation must never appear in product UI.
- No merge, production deploy, new spending, credential changes, or OCIF submission.
- No hosted claim from demo.
- Creator auto-attendance and public-club association: **unresolved** — current behavior preserved and reported.

## Batch 1 — DEMO gate CLEARED

| Surface | Status |
|---------|--------|
| Demo | **CLEARED** — `docs/audit/batch1-privacy/evidence.json` 31/31; `tested_sha` `959b1ac` |
| Hosted | Not claimed / not accepted |
| Native | Not verified |
| UAT | Not run |

## Batch 2 — OPEN for Codex (demo evidence executed)

| Item | Detail |
|------|--------|
| Issues | ISSUE-003; ISSUE-010 participation; M04/M05/M06; M07 gutters |
| Journey | Create walk (+ optional language) → detail field agreement → 2nd user join → M06 cancel → persistence |
| Evidence | `docs/audit/batch2-walk-join/` — **33/33 PASS** |
| Screenshots | Repo-relative under `screenshots/` + `side-by-side/` (maquette + product + M07 before/after) |
| Regression | Batch 1 private-access outsider gate re-checked |

### Unresolved (report only)

1. **Creator auto-attendance** — host still auto-joined on create (`status=joined` observed).  
2. **Public + club association** — public creates still null `clubId`.

## Exact next action

1. **Codex** reviews Batch 2 demo evidence (actual checks; no hosted claim).  
2. Do **not** start next batch / home preview / new backend / merge / production until cleared.  

## Surfaces

| Surface | This checkpoint |
|---------|-----------------|
| Demo | Batch 1 **CLEARED**; Batch 2 evidence **executed** (33/33) — awaiting Codex |
| Hosted | Not claimed |
| Multi-context | Not run |
| Native | Not verified |
| UAT | Not run |
