# GRPD Project Checkpoint

**Updated:** 2026-10-13  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 product tip (code under test):** `25d843f49830605627dc0c80914fb909b57100da`  
**Docs tip:** branch HEAD (evidence stamp may follow product tip)  
**Evidence `tested_sha`:** `25d843f49830605627dc0c80914fb909b57100da` · env `demo` · hosted_claim `false`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH 1 COMPLETE — STOP for Codex review.**  
Private outing access + trustworthy evidence implemented and exercised on **demo**.  
Do **not** start Batch 2 (M01/M02/M03/M06 / walk journey / hosted leave) until Codex clears this gate.

## Design / scope lock

- Preserve green-home experienceTheme / approved visual direction.
- Maquettes at `product/design/community-journey-v1/maquettes.html` are design proposals with fictional data — not live club content or acceptance.
- M08 design annotation must never appear in product UI (verified absent).
- No merge, production deploy, new spending, credential changes, or OCIF submission.

## Batch 1 delivered

| Item | Detail |
|------|--------|
| Issues | ISSUE-001, ISSUE-005, ISSUE-010 privacy only |
| Maquettes implemented on existing routes | M07 (club pending), M08 (session inaccessible), M04/M05 access/participation on `/session/[id]` |
| Mock vs hosted | Demo mock list filter aligned with hosted GET privacy; differences stay explicit; **no hosted claim** |
| Cancel-request backend | **Not** implemented; cancel pending disabled/explained outside `DEMO_MODE` |
| Membership / auto-attendance policy | Unchanged |
| Evidence | `/opt/cursor/artifacts/batch1-evidence/` + `docs/audit/batch1-privacy/` |
| Design sheet render | `/opt/cursor/artifacts/batch1-maquettes/` (PNG + PDF) |
| Side-by-side | `/opt/cursor/artifacts/batch1-evidence/side-by-side/` |

### Evidence summary (demo)

- Successful members-only create → real `/session/<id>` ≠ `create`
- Approved member positive control with **known unique** private spot present
- Outsider + pending-equivalent negative controls: direct link + list; unique logistics **absent**
- Reload + re-login gates hold
- Leave club → members-only outing inaccessible; logistics absent (ISSUE-010 privacy)
- Every artifact records `tested_sha` + `environment: demo`; `hosted_claim: false`

## Exact next action

1. **Codex** reviews Batch 1 implementation, evidence, maquette renders, and IA proposal.  
2. After clearance, next bounded batches (queued): M01/M02/M03/M06; walk/language journey (ISSUE-003); preview cards (ISSUE-002); hosted leave routes (ISSUE-004); TOI (ISSUE-011).  
3. Nouamane answers only true open rules (public club association, creator auto-attendance, invite expiry, cancel, aperçus) — not walk framing or private-logistics baseline.

## Surfaces

| Surface | This checkpoint |
|---------|-----------------|
| Demo | Batch 1 evidence **executed** |
| Hosted | Not claimed; env/creds still required for hosted lane |
| Multi-context | Not run this batch |
| Native | Not verified |
| UAT | Stakeholder sessions — not founder-only; not run |
