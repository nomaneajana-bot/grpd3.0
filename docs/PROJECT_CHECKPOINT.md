# GRPD Project Checkpoint

**Updated:** 2026-10-14  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 tip (DEMO gate CLEARED):** `959b1ac18db002ef90fc430c1662f750e4796acf`  
**Batch 2 tip (DEMO gate CLEARED):** `6d36691234ec4d8fbdddd4ff92ba818e02b1d957`  
**Batch 3 tip (DEMO gate CLEARED functional):** `75356094d741c63cbfbfca2fa7301042784a2fbf`  
**Batch 3 evidence:** `docs/audit/batch3-club-idea/evidence.json` — **57 PASS / 0 FAIL / 1 BLOCKED** · `hosted_claim: false`  
**Batch 3 closeout:** Tab diagnosis = harness_limitation; keyboard OPEN (ISSUE-012) — not full a11y/UAT  
**Batch 4:** ISSUE-011 in progress — `docs/audit/batch4-toi-roster/`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH 4 — ISSUE-011 TOI / roster home-group counts (demo).**  
Batch 3 functional DEMO gate **CLEARED** (Tab supported, not full a11y/UAT).  
Executing bounded Batch 4: same-user TOI vs exact counts; move +/− / no duplicates; reload; second identity; two clubs; empty/admin; home-group ≠ outing autojoin; pace optional walk/language.  
**STOP for Codex after evidence.** No merge / production / credentials / spending / OCIF / broad redesign.

## Preview (Nouamane)

- PR: https://github.com/nomaneajana-bot/grpd3.0/pull/6  
- Branch preview: https://grpd30-git-cursor-green-home-ux-j-75ed8a-noas-projects-0b3f311d.vercel.app  
- Verified: Vercel **SSO-gated** (302 → SSO). SSO proves protection only — **not** functioning user preview. Hosted access remains blocked without credential/security changes.

## Exact next action

1. Finish Batch 4 demo evidence + nested regressions.  
2. Update register/checkpoint with `tested_sha` + screenshots.  
3. **STOP for Codex** review of Batch 4.  
4. No merge / prod / spending / credentials / OCIF.

## Surfaces

| Surface | Status |
|---------|--------|
| Demo | Batch1+2+3 CLEARED (functional); Batch4 in progress; ISSUE-012 keyboard OPEN |
| Hosted | Not claimed (SSO preview protection only; ISSUE-004/008 open) |
| Native | Not verified |
| UAT | Not run |

### Unresolved (not decided)

1. Creator auto-attendance  
2. Public + club association  
