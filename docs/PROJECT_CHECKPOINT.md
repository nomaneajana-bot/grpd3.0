# GRPD Project Checkpoint

**Updated:** 2026-10-13  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 tip under test:** `959b1ac18db002ef90fc430c1662f750e4796acf`  
**Docs tip:** branch HEAD after corrected evidence  
**Evidence `tested_sha`:** `959b1ac18db002ef90fc430c1662f750e4796acf` · env `demo` · hosted_claim `false`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH 1 STILL OPEN — STOP for Codex review (corrected evidence).**  
Prior acceptance blocked: pending-member privacy was not tested (unconditional PASS / outsider substitute).  
Corrected run establishes genuine pending via UI for the exact target club, asserts `pending` + `approved=false`, then runs pending direct-link/list/reload/re-login privacy.  
Do **not** start Batch 2 until Codex clears this gate.

## Design / scope lock

- Preserve green-home experienceTheme / approved visual direction.
- Maquettes at `product/design/community-journey-v1/maquettes.html` are design proposals — not acceptance.
- M08 design annotation must never appear in product UI.
- No merge, production deploy, new spending, credential changes, or OCIF submission.
- No hosted claim from demo.

## Batch 1 corrected evidence

| Item | Detail |
|------|--------|
| Issues | ISSUE-001, ISSUE-005, ISSUE-010 privacy |
| Pending setup | UI request for exact `target_club_name`; fail/block if not pending |
| Controls | Member positive · outsider negative · **genuine pending** negative · ex-member after leave |
| Evidence | `docs/audit/batch1-privacy/evidence.json` — **31/31 PASS** |
| Screenshots | All paths repo-relative under `docs/audit/batch1-privacy/screenshots/` (18 files) |

### Evidence summary (demo)

- Real `/session/<id>` ≠ `create` after members-only publish  
- Approved member: unique logistics present  
- Outsider: direct link + list + re-login — logistics absent  
- **Pending:** membership `status=pending`, `approved=false`, M07 UI visible; direct link + list + reload + re-login — logistics absent  
- Leave club → inaccessible; logistics absent  
- `tested_sha` + `environment: demo`; `hosted_claim: false`

## Exact next action

1. **Codex** re-reviews corrected Batch 1 evidence (pending genuinely tested; screenshots resolvable).  
2. Only after clearance: later batches (M01/M02/M03/M06, walk, previews, hosted leave, TOI).  
3. No next implementation batch in this turn.

## Surfaces

| Surface | This checkpoint |
|---------|-----------------|
| Demo | Batch 1 corrected evidence **executed** (31/31) |
| Hosted | Not claimed |
| Multi-context | Not run |
| Native | Not verified |
| UAT | Not run |
