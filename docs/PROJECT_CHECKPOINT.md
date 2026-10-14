# GRPD Project Checkpoint

**Updated:** 2026-10-14  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 tip (DEMO gate CLEARED):** `959b1ac18db002ef90fc430c1662f750e4796acf`  
**Batch 2 tip (DEMO gate CLEARED):** `6d36691234ec4d8fbdddd4ff92ba818e02b1d957`  
**Batch 2 evidence:** `docs/audit/batch2-walk-join/evidence.json` — **42/42** · packaging current-only  
**Batch 3 tip under test / `tested_sha`:** `75356094d741c63cbfbfca2fa7301042784a2fbf`  
**Batch 3 evidence:** `docs/audit/batch3-club-idea/evidence.json` — **57 PASS / 0 FAIL / 1 BLOCKED** · env `demo` · `hosted_claim: false`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH 3 OPEN — STOP for Codex DEMO re-review (Codex correction evidence).**  
Corrections: exact one club + one membership on double-submit; controlled create fail/retry with preserved input + no phantom; stale association via app UI (unfinished bound form → Découvrir → Proposer); idea CTA context without `?idea=` bypass; keyboard reachability/activation with honest BLOCKED Tab focus-order.  
Do **not** merge / production / credentials / spending / OCIF. No next batch.

## Design / scope lock

- Preserve green-home experienceTheme / approved visual direction.
- Maquettes are design proposals — not acceptance.
- Design annotations must never appear in product UI.
- Creator auto-attendance and public-club association: **unresolved** — preserved and reported.

## Batch 3 — OPEN (corrected demo evidence)

| Item | Detail |
|------|--------|
| `tested_sha` | `75356094d741c63cbfbfca2fa7301042784a2fbf` |
| Summary | 57 PASS · 0 FAIL · 1 BLOCKED (Tab focus-order on web RN inputs) |
| Evidence | `docs/audit/batch3-club-idea/` — current screenshots only; prior run archived under `archive/pre-6779c19064f0/` |
| Regressions | Batch1 31/31 · Batch2 42/42 under `regressions/` |

### Exact next action

1. **Codex** re-reviews Batch 3 corrected demo evidence at `7535609`.  
2. No next batch / merge / production / credentials / spending / OCIF.

## Surfaces

| Surface | This checkpoint |
|---------|-----------------|
| Demo | Batch 1+2 CLEARED; Batch 3 corrected evidence executed — awaiting Codex |
| Hosted | Not claimed |
| Native | Not verified |
| UAT | Not run |
