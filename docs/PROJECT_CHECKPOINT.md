# GRPD Project Checkpoint

**Updated:** 2026-10-15  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 tip (DEMO gate CLEARED):** `959b1ac18db002ef90fc430c1662f750e4796acf`  
**Batch 2 tip (DEMO gate CLEARED):** `6d36691234ec4d8fbdddd4ff92ba818e02b1d957`  
**Batch 3 tip (DEMO gate CLEARED functional):** `75356094d741c63cbfbfca2fa7301042784a2fbf`  
**Batch 4 `tested_sha` (Codex correction):** `3dff8ed2f2af5075fd3fd71660a2dd307d9c2851`  
**Batch 4 evidence:** `docs/audit/batch4-toi-roster/evidence.json` — **37 PASS / 0 FAIL / 3 BLOCKED** (nested SKIP this correction) · `hosted_claim: false`  
**Prior nested regressions (de5402a):** B1 31/31 · B2 42/42 · B3 56/0 FAIL — copies under `docs/audit/batch4-toi-roster/regressions/`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH 4 CORRECTION COMPLETE — STOP for Codex re-review.**  
Codex finding on `e383d2a`: `admin_move_member_b_counts` must not PASS when B is already same-group.  
Corrected harness **actually moves B** to a different group via admin UI; asserts source −1 / target +1; separate same-group idempotency; B TOI after login; host TOI + club B unchanged; no outing autojoin.  
Evidence at `3dff8ed`. No merge / production / credentials / spending / OCIF / next batch.

## Preview (Nouamane)

- PR: https://github.com/nomaneajana-bot/grpd3.0/pull/6  
- Branch preview: https://grpd30-git-cursor-green-home-ux-j-75ed8a-noas-projects-0b3f311d.vercel.app  
- Verified: Vercel **SSO-gated** (302 → SSO). SSO proves protection only — **not** functioning user preview. Hosted access remains blocked without credential/security changes.

## Exact next action

1. **Codex** re-reviews Batch 4 corrected evidence at `3dff8ed` (esp. `admin_move_member_b_counts` + B TOI + idempotency).  
2. After clear: propose next bounded batch from remaining gaps.  
3. No merge / prod / spending / credentials / OCIF.

## Surfaces

| Surface | Status |
|---------|--------|
| Demo | Batch1–3 CLEARED (functional); Batch4 corrected evidence ready for Codex; ISSUE-012 keyboard OPEN |
| Hosted | Not claimed (SSO preview protection only; ISSUE-004/008 open) |
| Native | Not verified |
| UAT | Not run |

### Unresolved (not decided)

1. Creator auto-attendance  
2. Public + club association  
