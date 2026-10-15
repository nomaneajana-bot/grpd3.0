# GRPD Project Checkpoint

**Updated:** 2026-10-15  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 tip (DEMO gate CLEARED):** `959b1ac18db002ef90fc430c1662f750e4796acf`  
**Batch 2 tip (DEMO gate CLEARED):** `6d36691234ec4d8fbdddd4ff92ba818e02b1d957`  
**Batch 3 tip (DEMO gate CLEARED functional):** `75356094d741c63cbfbfca2fa7301042784a2fbf`  
**Batch 4 tip (DEMO gate CLEARED):** `3dff8ed2f2af5075fd3fd71660a2dd307d9c2851` (Codex accepted correction)  
**Batch 5 docs tip:** `366590f8a04eca75041fc1b635c8a0305d9b86bd`  
**Batch 5 `tested_sha`:** `3befb19c9627973ebefa72a438e38b429f0c44b7`  
**Batch 5 evidence:** `docs/audit/batch5-leave-cancel/evidence.json` — **17 PASS / 0 FAIL / 2 BLOCKED** · `hosted_claim: false` · env `local_postgres_integration` · Codex base `88da14e`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH 5 Codex `88da14e` fixes COMPLETE — STOP for Codex re-review.**  
ISSUE-004: leave/cancel races serialized; conditional cancel; route 401/actor isolation; lifecycle rollback; French UX; cancel UI ungated from DEMO_MODE.  
Local PostgreSQL integration **PASS** (15/15 PG + 5/5 unit).  
Hosted Preview dual-browser journey **BLOCKED** (SSO 302; protection unchanged; no credential changes). ISSUE-008 remains blocked on hosted access.  
No merge / production / spending / OCIF / next batch.

## Preview (Nouamane)

- PR: https://github.com/nomaneajana-bot/grpd3.0/pull/6  
- Branch preview: https://grpd30-git-cursor-green-home-ux-j-75ed8a-noas-projects-0b3f311d.vercel.app  
- Access check (2026-10-15): **302 → Vercel SSO**. SSO proves protection only — not functioning user preview. Exact deployed SHA unread without SSO.

## Exact next action

1. **Codex** re-reviews Batch 5 at `3befb19` (race/auth/rollback/French/DEMO_MODE-cancel + PG evidence + hosted blocker).  
2. After clear: hosted retest when authorized Preview/Test env exists (ISSUE-004 hosted VERIFIED / ISSUE-008).  
3. No merge / prod / spending / credentials / OCIF.

## Surfaces

| Surface | Status |
|---------|--------|
| Demo | Batch1–4 CLEARED; mock leave/cancel preserved |
| Hosted | Code landed; **not** VERIFIED (SSO blocker). ISSUE-004 FIXED AWAITING RETEST (hosted) |
| Local PG integration | PASS at `3befb19` (15/15 + races) |
| Native | Not verified |
| UAT | Not run |

### Unresolved (not decided)

1. Creator auto-attendance  
2. Public + club association  
3. Admin leave transfer/deletion UX (currently reject sole admin — recorded)  
